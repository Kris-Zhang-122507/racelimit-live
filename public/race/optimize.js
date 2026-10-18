// Merges the car's hundreds of small parts into a few meshes (one per look), so the graphics
// card draws it in ~40 calls instead of ~400. Moving parts (wheels, steering wheel) and parts
// that switch on and off (wing flaps, cockpit view) stay separate groups.
import * as THREE from "three";

const role = (m) => [m.userData.aero ?? "", m.userData.cockpitOnly ? "only" : m.userData.helmet || m.userData.lid || m.userData.inner || m.userData.extTub ? "hide" : ""].join("|");
const matKey = (m) => {
  const a = m.material;
  if (Array.isArray(a)) return null;
  const tex = (t) => (t ? t.uuid : "");
  return [a.type, a.color?.getHexString(), a.emissive?.getHexString(), a.emissiveIntensity, a.roughness, a.metalness, a.clearcoat, a.clearcoatRoughness, a.envMapIntensity, a.side, a.transparent, a.opacity, a.depthWrite, a.alphaTest, a.vertexColors, a.polygonOffset, tex(a.map), tex(a.normalMap), tex(a.emissiveMap), tex(a.roughnessMap), a.iridescence ?? ""].join(",");
};

export function mergeCar(car, keepOut = []) {
  car.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(car.matrixWorld).invert();
  const skip = new Set();
  for (const k of keepOut) k?.traverse((o) => skip.add(o));
  const groups = new Map();
  car.traverse((m) => {
    if (!m.isMesh || skip.has(m) || m.isInstancedMesh || !m.geometry?.attributes?.position) return;
    if (m.children.length || m.parent?.isMesh) return; // keep parts that carry other parts as they are
    const mk = matKey(m); if (!mk) return;
    const key = role(m) + "#" + mk;
    if (!groups.has(key)) groups.set(key, { meshes: [], material: m.material, role: role(m), cast: false });
    const g = groups.get(key); g.meshes.push(m); g.cast ||= m.castShadow;
  });
  let before = 0, after = 0;
  for (const g of groups.values()) {
    before += g.meshes.length;
    if (g.meshes.length < 2) { after++; continue; }
    const useUV = g.meshes.some((m) => m.geometry.attributes.uv) && !!(g.material.map || g.material.normalMap || g.material.roughnessMap || g.material.emissiveMap);
    const useCol = !!g.material.vertexColors;
    const pos = [], nor = [], uv = [], col = [], idx = [];
    let base = 0;
    for (const m of g.meshes) {
      const geo = m.geometry;
      if (!geo.attributes.normal) geo.computeVertexNormals();
      const mat = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld), nm = new THREE.Matrix3().getNormalMatrix(mat);
      const P = geo.attributes.position, Nn = geo.attributes.normal, U = geo.attributes.uv, Cc = geo.attributes.color, v = new THREE.Vector3();
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(mat); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(Nn, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
        if (useUV) uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0);
        if (useCol) col.push(Cc ? Cc.getX(i) : 1, Cc ? Cc.getY(i) : 1, Cc ? Cc.getZ(i) : 1);
      }
      if (geo.index) for (let i = 0; i < geo.index.count; i++) idx.push(base + geo.index.getX(i));
      else for (let i = 0; i < P.count; i++) idx.push(base + i);
      // a mirrored part (negative scale) needs its triangles flipped
      if (mat.determinant() < 0) for (let i = idx.length - (geo.index ? geo.index.count : P.count); i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
      base += P.count;
      m.parent.remove(m);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    if (useUV) geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    if (useCol) geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(base > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, g.material);
    const [aero, cock] = g.role.split("|");
    if (aero) mesh.userData.aero = aero;
    if (cock === "only") mesh.userData.cockpitOnly = true; else if (cock === "hide") mesh.userData.inner = true;
    mesh.visible = !(aero === "straight" || cock === "only");
    mesh.castShadow = g.cast; mesh.receiveShadow = true;
    car.add(mesh); after++;
  }
  return { before, after };
}
