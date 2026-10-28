import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Static GLB furniture needs no per-object draw calls. Keep rigs and tools separate.
export function batchStatic(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map(),meshes=[];
 root.traverse(o=>{if(!o.isMesh||!o.visible||Array.isArray(o.material))return;const key=o.material.name+'|'+o.material.color?.getHex()+'|'+(o.material.map?.uuid||'');if(!groups.has(key))groups.set(key,{material:o.material,geometries:[]});let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));for(const a of Object.keys(g.attributes))if(!['position','normal','uv'].includes(a))g.deleteAttribute(a);if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));groups.get(key).geometries.push(g);meshes.push(o)});
 for(const m of meshes)m.removeFromParent();
 for(const {material,geometries}of groups.values()){const geometry=mergeGeometries(geometries);if(!geometry)continue;const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);for(const g of geometries)g.dispose()}
}
