/** Column-major XYZ Euler transforms, matching Three.js/FolderUtils. */
export const identity = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
export function compose(node){
 const p=node.position??[0,0,0],s=node.scale??[1,1,1],r=node.rotation_degrees?.map(n=>n*Math.PI/180)??node.rotation??[0,0,0];
 const [x,y,z]=r,a=Math.cos(x),b=Math.sin(x),c=Math.cos(y),d=Math.sin(y),e=Math.cos(z),f=Math.sin(z);
 return [c*e*s[0],(a*f+b*e*d)*s[0],(b*f-a*e*d)*s[0],0,
  -c*f*s[1],(a*e-b*f*d)*s[1],(b*e+a*f*d)*s[1],0,
  d*s[2],-b*c*s[2],a*c*s[2],0,p[0],p[1],p[2],1];
}
export function multiply(a,b){const out=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
