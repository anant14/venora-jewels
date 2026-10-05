/* Venora Jewels — 360° 3D viewer (three.js).
   Gold is a physically based metal; the diamond uses a ray-traced refraction shader
   (light bounces inside the stone using a BVH of its facets), which is what makes it sparkle.
   Usage: const v = await mountViewer(el, { glb, hdr, gold: "Y" }); v.setGold("R");
   The page must include the VIEWER_IMPORTMAP below (as <script type="importmap">) before loading this module. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshBVH, MeshBVHUniformStruct, shaderStructs, shaderIntersectFunction } from "three-mesh-bvh";

// metal colours (linear, physically based reflectance of each alloy)
export const GOLD = {
  Y: { color: [1.0, 0.766, 0.336], name: "Yellow Gold" },
  R: { color: [0.97, 0.62, 0.52], name: "Rose Gold" },
  W: { color: [0.86, 0.86, 0.84], name: "White Gold" }
};

const diamondVertex = /* glsl */`
  uniform mat4 viewMatrixInverse;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying mat4 vModelMatrixInverse;
  void main() {
    vModelMatrixInverse = inverse(modelMatrix);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize((viewMatrixInverse * vec4(normalMatrix * normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }`;

const diamondFragment = /* glsl */`
  precision highp isampler2D;
  precision highp usampler2D;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying mat4 vModelMatrixInverse;
  uniform sampler2D envMap;
  uniform float bounces;
  uniform float ior;
  uniform float aberration;
  uniform float fresnel;
  uniform vec3 tint;
  uniform float envIntensity;
  uniform mat4 modelMatrix;
  ${shaderStructs}
  ${shaderIntersectFunction}
  uniform BVH bvh;

  vec3 sampleEnv(vec3 d) {
    vec2 uv = vec2(atan(d.z, d.x) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.1415927 + 0.5);
    return texture2D(envMap, uv).rgb * envIntensity;
  }

  // refract into the stone, bounce around inside (total internal reflection), refract out
  vec3 traceStone(vec3 rd, vec3 n, float eta) {
    vec3 dir = refract(rd, n, 1.0 / eta);
    vec3 origin = (vModelMatrixInverse * vec4(vWorldPosition + dir * 0.00001, 1.0)).xyz;
    dir = normalize((vModelMatrixInverse * vec4(dir, 0.0)).xyz);
    for (float i = 0.0; i < 8.0; i++) {
      if (i >= bounces) break;
      uvec4 faceIndices = uvec4(0u);
      vec3 faceNormal = vec3(0.0, 0.0, 1.0);
      vec3 barycoord = vec3(0.0);
      float side = 1.0;
      float dist = 0.0;
      bvhIntersectFirstHit(bvh, origin, dir, faceIndices, faceNormal, barycoord, side, dist);
      vec3 hit = origin + dir * max(dist - 0.000001, 0.0);
      vec3 outDir = refract(dir, faceNormal, eta);
      if (length(outDir) != 0.0) { dir = outDir; break; }
      dir = reflect(dir, faceNormal);
      origin = hit + dir * 0.000002;
    }
    return normalize((modelMatrix * vec4(dir, 0.0)).xyz);
  }

  void main() {
    vec3 rd = normalize(vWorldPosition - cameraPosition);
    vec3 n = normalize(vNormal);
    vec3 col;
    col.r = sampleEnv(traceStone(rd, n, ior * (1.0 - aberration))).r;
    col.g = sampleEnv(traceStone(rd, n, ior)).g;
    col.b = sampleEnv(traceStone(rd, n, ior * (1.0 + aberration))).b;
    // surface reflection (fresnel) on top
    float f = fresnel * pow(1.0 + dot(rd, n), 4.0) + 0.04;
    col = mix(col * tint, sampleEnv(reflect(rd, n)), clamp(f, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

/* A jewellery photo studio for the diamond, as an HDR environment generated in code:
   bright white surroundings, very bright softboxes, and thin dark strips that give
   diamonds their crisp black-and-white facet contrast. */
function jewelleryStudio() {
  const W = 512, H = 256, data = new Float32Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);                          // 0 = straight down, 1 = straight up
    for (let x = 0; x < W; x++) {
      const u = x / W;
      let L = 0.35 + 0.7 * v;                       // brighter towards the ceiling
      const strip = Math.abs(((u * 10) % 1) - 0.5); // 10 dark vertical strips
      if (strip > 0.40 && v > 0.12 && v < 0.88) L = 0.01;
      for (const c of [0.10, 0.36, 0.61, 0.86]) {   // 4 softboxes around the stone
        if (Math.abs(u - c) < 0.045 && v > 0.55 && v < 0.82) L = 9;
      }
      if (v > 0.93) L = 5;                          // overhead light
      if (v < 0.12) L = 0.25;                       // darker table below
      const i = (y * W + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = L; data[i + 3] = 1;
    }
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
  t.wrapS = THREE.RepeatWrapping;
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

export async function mountViewer(container, { glb, hdr, gold = "Y", autoRotate = true }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", touchAction: "none" });
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.0005, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = 1.6;
  controls.enablePan = false;

  const [envTex, gltf] = await Promise.all([
    new RGBELoader().setDataType(THREE.FloatType).loadAsync(hdr),
    new GLTFLoader().loadAsync(glb)
  ]);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(envTex).texture;

  const metal = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.16, clearcoat: 0.3, clearcoatRoughness: 0.1, envMapIntensity: 1.25 });
  const model = gltf.scene;
  model.traverse(o => {
    if (!o.isMesh) return;
    if (o.material && o.material.name === "Diamond") {
      o.geometry.boundsTree = new MeshBVH(o.geometry);
      const bvh = new MeshBVHUniformStruct();
      bvh.updateFrom(o.geometry.boundsTree);
      o.material = new THREE.ShaderMaterial({
        vertexShader: diamondVertex, fragmentShader: diamondFragment,
        uniforms: {
          envMap: { value: jewelleryStudio() }, bvh: { value: bvh }, bounces: { value: 5 }, ior: { value: 2.42 },
          aberration: { value: 0.012 }, fresnel: { value: 1.0 }, tint: { value: new THREE.Color(1, 1, 1) },
          envIntensity: { value: 1.0 }, viewMatrixInverse: { value: camera.matrixWorld }
        }
      });
    } else {
      o.material = metal;
    }
  });
  scene.add(model);

  // soft contact shadow under the piece
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  model.position.sub(centre);
  const radius = size.length() / 2;
  const shadowTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(60,40,30,.35)"); grd.addColorStop(1, "rgba(60,40,30,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2.2, radius * 2.2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -size.y / 2 - radius * 0.15;
  scene.add(shadow);

  camera.position.set(radius * 1.3, radius * 1.0, radius * 3.8);
  controls.minDistance = radius * 1.6;
  controls.maxDistance = radius * 7;
  controls.target.set(0, 0, 0);

  function setGold(c) {
    const g = GOLD[c] || GOLD.Y;
    metal.color.setRGB(...g.color, THREE.LinearSRGBColorSpace);
  }
  setGold(gold);

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // stop auto-rotate while the visitor drags; resume a few seconds later
  let resumeTimer = 0;
  controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(resumeTimer); });
  controls.addEventListener("end", () => { resumeTimer = setTimeout(() => { controls.autoRotate = autoRotate; }, 4000); });

  let running = true;
  (function loop() {
    if (!running) return;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();

  return {
    setGold,
    setView(azimuthDeg, polarDeg) {
      const r = camera.position.length(), a = THREE.MathUtils.degToRad(azimuthDeg), p = THREE.MathUtils.degToRad(polarDeg);
      camera.position.set(r * Math.sin(p) * Math.sin(a), r * Math.cos(p), r * Math.sin(p) * Math.cos(a));
      controls.update();
    },
    stop() { running = false; renderer.dispose(); },
    renderer, controls
  };
}
