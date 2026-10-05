"""Build a 3D model (GLB) of Venora ER-0001 — 4-prong round solitaire stud — from its CAD sheet.

CAD sheet ER-0001 (GJSHIVAY DESIGN):
  diamond: round brilliant, 8.00 mm, 2 ct (pair 4 ct)
  top view: 8.51 mm overall width        side view: 6.09 mm head height
  setting: 4 prongs with ball tips, gallery rail, base ring
  metal weight (pair): 14KT 2.5925 g, 18KT 3.05 g
Post and screw-back are not drawn on the sheet; sized from the product photos.

Units: millimetres while building, exported in metres (glTF) so AR shows true size.
Orientation: the diamond table faces +Z (toward the viewer), Y is up, the post points to -Z.
"""
import json, math, os
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
import pygltflib

OUT = os.path.dirname(os.path.abspath(__file__))

# ---------------- diamond: ideal round brilliant, 57 facets ----------------
D = 8.00
R = D / 2
GIRDLE = 0.03 * D / 2          # half girdle thickness
CROWN_H = 0.162 * D
PAV_D = 0.431 * D
TABLE_APOTHEM = 0.57 * D / 2
z_g = GIRDLE                   # top of girdle
z_t = z_g + CROWN_H            # table
z_c = -GIRDLE - PAV_D          # culet

def polar(r, deg, z):
    a = math.radians(deg)
    return np.array([r * math.cos(a), r * math.sin(a), z])

T = [polar(TABLE_APOTHEM / math.cos(math.radians(22.5)), i * 45, z_t) for i in range(8)]
rS = 3.15
S = [polar(rS, i * 45 + 22.5, z_g + (R - rS) / (R - TABLE_APOTHEM) * CROWN_H) for i in range(8)]
G = [polar(R, k * 22.5, z_g) for k in range(16)]
Gb = [polar(R, k * 22.5, -GIRDLE) for k in range(16)]
L = [polar(R * 0.23, i * 45 + 22.5, -GIRDLE - PAV_D * 0.77) for i in range(8)]
C = np.array([0, 0, z_c])

polys = [T[:]]                                                        # table
for i in range(8):
    j = (i + 1) % 8
    polys.append([T[i], T[j], S[i]])                                  # star
    polys.append([T[i], S[i - 1], G[2 * i], S[i]])                    # bezel (kite)
    polys.append([S[i], G[2 * i], G[2 * i + 1]])                      # upper girdle
    polys.append([S[i], G[2 * i + 1], G[(2 * i + 2) % 16]])
    polys.append([Gb[2 * i], L[i], C, L[i - 1]])                      # pavilion main
    polys.append([Gb[2 * i], Gb[2 * i + 1], L[i]])                    # lower girdle
    polys.append([Gb[2 * i + 1], Gb[(2 * i + 2) % 16], L[i]])
for k in range(16):
    polys.append([G[k], G[(k + 1) % 16], Gb[(k + 1) % 16], Gb[k]])   # girdle band

def faceted(polys):
    """Flat-shaded mesh: every facet gets its own vertices; faces wound outward."""
    verts, faces = [], []
    for p in polys:
        p = [np.asarray(v, float) for v in p]
        n = np.cross(p[1] - p[0], p[2] - p[0])
        if np.dot(n, np.mean(p, axis=0)) < 0:
            p = p[::-1]
        base = len(verts)
        verts += p
        for k in range(1, len(p) - 1):
            faces.append([base, base + k, base + k + 1])
    return trimesh.Trimesh(np.array(verts), np.array(faces), process=False)

diamond = faceted(polys)
print('diamond facets:', len(polys) - 16, '+ girdle;', 'crown', round(CROWN_H, 2), 'pavilion', round(PAV_D, 2))

# ---------------- metal parts ----------------
SEG = 48

def tube(path, radius, seg=24):
    """Round wire swept along a polyline, capped."""
    path = [np.asarray(p, float) for p in path]
    rings = []
    for i, p in enumerate(path):
        t = (path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)])
        t /= np.linalg.norm(t)
        ref = np.array([0, 0, 1.0]) if abs(t[2]) < 0.9 else np.array([1.0, 0, 0])
        u = np.cross(t, ref); u /= np.linalg.norm(u)
        v = np.cross(t, u)
        rings.append([p + radius * (math.cos(a) * u + math.sin(a) * v) for a in np.linspace(0, 2 * math.pi, seg, endpoint=False)])
    verts = [v for r in rings for v in r]
    faces = []
    for i in range(len(rings) - 1):
        for k in range(seg):
            a, b = i * seg + k, i * seg + (k + 1) % seg
            c, d = a + seg, b + seg
            faces += [[a, b, d], [a, d, c]]
    for end, ring in ((0, 0), (1, len(rings) - 1)):
        centre = len(verts); verts.append(path[0] if end == 0 else path[-1])
        for k in range(seg):
            a, b = ring * seg + k, ring * seg + (k + 1) % seg
            faces.append([centre, b, a] if end == 0 else [centre, a, b])
    m = trimesh.Trimesh(np.array(verts), np.array(faces))
    m.fix_normals()
    return m

def band(r_in, r_out, z0, z1):
    m = trimesh.creation.annulus(r_min=r_in, r_max=r_out, height=z1 - z0, sections=SEG)
    m.apply_translation([0, 0, (z0 + z1) / 2])
    return m

def torus(major, minor, z, seg_major=SEG, seg_minor=12):
    verts, faces = [], []
    for i in range(seg_major):
        a = 2 * math.pi * i / seg_major
        for j in range(seg_minor):
            b = 2 * math.pi * j / seg_minor
            verts.append([(major + minor * math.cos(b)) * math.cos(a), (major + minor * math.cos(b)) * math.sin(a), z + minor * math.sin(b)])
    for i in range(seg_major):
        for j in range(seg_minor):
            a, b = i * seg_minor + j, i * seg_minor + (j + 1) % seg_minor
            c, d = ((i + 1) % seg_major) * seg_minor + j, ((i + 1) % seg_major) * seg_minor + (j + 1) % seg_minor
            faces += [[a, c, d], [a, d, b]]
    m = trimesh.Trimesh(np.array(verts), np.array(faces)); m.fix_normals(); return m

HEAD_TOP = z_t                      # top of the diamond table
HEAD_BOTTOM = HEAD_TOP - 6.09       # CAD side view: 6.09 mm head height
parts = []

# 4 prongs on the diagonals: straight up the sides, curving in over the crown, ball tips
PRONG_R, PRONG_AT = 0.55, 4.30
for ang in (45, 135, 225, 315):
    path = [polar(PRONG_AT, ang, z) for z in np.linspace(HEAD_BOTTOM, z_g + 0.15, 10)]
    path += [polar(PRONG_AT - 0.10, ang, z_g + 0.45), polar(PRONG_AT - 0.25, ang, z_g + 0.70)]
    parts.append(tube(path, PRONG_R))
    tip = trimesh.creation.icosphere(subdivisions=3, radius=0.72)
    tip.apply_translation(polar(PRONG_AT - 0.30, ang, z_g + 0.78))
    parts.append(tip)

# gallery rail (side view: 2.4–3.8 mm below the table) and base ring (8.51 mm overall width)
parts.append(band(3.72, 4.25, HEAD_TOP - 3.8, HEAD_TOP - 2.4))
parts.append(band(3.35, 4.20, HEAD_BOTTOM, HEAD_BOTTOM + 0.85))

# cross bar under the base that carries the post
for ang in (0, 90):
    bar = trimesh.creation.box(extents=[7.6, 0.9, 0.7])
    bar.apply_transform(trimesh.transformations.rotation_matrix(math.radians(ang), [0, 0, 1]))
    bar.apply_translation([0, 0, HEAD_BOTTOM + 0.35])
    parts.append(bar)

# threaded post (from photos: ~0.9 mm wire, ~10 mm long)
POST_END = HEAD_BOTTOM - 10.3
post = trimesh.creation.cylinder(radius=0.45, height=HEAD_BOTTOM - POST_END, sections=32)
post.apply_translation([0, 0, (HEAD_BOTTOM + POST_END) / 2])
parts.append(post)
for z in np.arange(POST_END + 0.6, HEAD_BOTTOM - 3.5, 0.45):
    parts.append(torus(0.45, 0.085, z, seg_major=24, seg_minor=8))

# screw-back: domed disc with a rolled rim and a threaded barrel
BACK_Z = HEAD_BOTTOM - 6.0
parts.append(band(0.0001, 2.85, BACK_Z - 0.45, BACK_Z))
parts.append(torus(2.85, 0.28, BACK_Z - 0.22))
parts.append(band(0.50, 0.95, BACK_Z - 3.0, BACK_Z - 0.45))

# smooth curved surfaces but keep sharp edges crisp (split normals at creases > 35 degrees)
metal = trimesh.util.concatenate([trimesh.graph.smooth_shade(p, angle=math.radians(35)) for p in parts])
vol = sum(p.volume for p in parts if p.is_watertight)
print('metal volume (approx, mm3):', round(vol, 1),
      '-> est. 14KT weight per earring:', round(vol * 13.07 / 1000, 2), 'g  (CAD sheet: %.2f g per earring)' % (2.5925 / 2))

# ---------------- materials + export ----------------
gold = PBRMaterial(name='Gold', baseColorFactor=[1.0, 0.766, 0.336, 1.0], metallicFactor=1.0, roughnessFactor=0.18)
stone = PBRMaterial(name='Diamond', baseColorFactor=[1.0, 1.0, 1.0, 1.0], metallicFactor=0.0, roughnessFactor=0.0)
metal.visual = trimesh.visual.TextureVisuals(material=gold)
diamond.visual = trimesh.visual.TextureVisuals(material=stone)

scene = trimesh.Scene()
scene.add_geometry(metal, node_name='Setting', geom_name='Setting')
scene.add_geometry(diamond, node_name='Diamond', geom_name='Diamond')
# mm -> m, and Z-forward build -> glTF (Y up, table facing the camera on +Z)
scene.apply_transform(trimesh.transformations.scale_matrix(0.001))
glb_path = os.path.join(OUT, 'ER-0001.glb')
scene.export(glb_path, include_normals=True)

# diamond optics: transmission + IOR 2.42 + volume + dispersion (glTF extensions)
g = pygltflib.GLTF2().load(glb_path)
ext = ['KHR_materials_transmission', 'KHR_materials_ior', 'KHR_materials_volume', 'KHR_materials_dispersion', 'KHR_materials_specular']
g.extensionsUsed = sorted(set((g.extensionsUsed or []) + ext))
for m in g.materials:
    if m.name == 'Diamond':
        m.extensions = {
            'KHR_materials_transmission': {'transmissionFactor': 1.0},
            'KHR_materials_ior': {'ior': 2.42},
            'KHR_materials_volume': {'thicknessFactor': 0.004, 'attenuationDistance': 0.05, 'attenuationColor': [1, 1, 1]},
            'KHR_materials_dispersion': {'dispersion': 0.9},
            'KHR_materials_specular': {'specularFactor': 1.0}
        }
g.asset.generator = 'Venora Jewels — built from CAD sheet ER-0001'
g.save(glb_path)
print('saved', glb_path, round(os.path.getsize(glb_path) / 1024), 'KB')
print('bounds (mm):', np.round(scene.bounds * 1000, 2).tolist())
