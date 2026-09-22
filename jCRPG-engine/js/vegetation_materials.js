import * as THREE from './threejs/three.module.js';

// Foliage replacements from the original SideTypeModels / AtlasTextureTypeConstants.
// Several OBJ materials omit these assignments because Java supplied them at runtime.
const foliage = {
 'pine_bb1.obj': {texture:'continental_pine_atlas.png',columns:2,column:0},
 'great_pine_bb1.obj': {texture:'continental_pine_atlas.png',columns:2,column:1},
 'high_bb_1.obj': {texture:'continental_deciduous_atlas.png',columns:3,column:1,rotateUV:true},
 'bush1.obj': {texture:'continental_deciduous_atlas.png',columns:3,column:0},
 'bush2.obj': {texture:'high_2.png',columns:1,column:0},
};
export function vegetationTexture(model,material) {
 return /^pmat3(?:_|$)/.test(material) ? foliage[model] : null;
}
export function maskVegetation(material) {
 material.transparent=false;
 material.opacity=1;
 material.alphaTest=0.5;
 material.depthWrite=true;
 material.blending=THREE.NoBlending;
}
