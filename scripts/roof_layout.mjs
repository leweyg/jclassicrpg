/** Place the shared roof meshes with their high sides facing the roof interior. */
export function roofPiece(x, z, width, depth) {
 const west=x===0, east=x===width-1, north=z===0, south=z===depth-1;
 if ((west||east)&&(north||south)) {
  // The unrotated corner rises toward -X/+Z, unlike the straight piece (+Z).
  return {asset:'roofCorner',rotation:north?(west?Math.PI/2:0):(west?Math.PI:-Math.PI/2),heightOffset:0};
 }
 if (north||south||west||east) return {asset:'roofEdge',rotation:north?0:south?Math.PI:west?Math.PI/2:-Math.PI/2,heightOffset:0};
 // Meet the 0.55-unit high edge of the surrounding slopes.
 return {asset:'roof',rotation:0,heightOffset:0.55};
}
