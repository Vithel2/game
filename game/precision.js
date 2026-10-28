// Judge the last presented DOM position, not the next simulation frame. This also
// works at low frame rates and after modal re-rendering, on touch and keyboard.
export function presentedHit(root=document){
 const needle=root.querySelector('.skill-needle'),zone=root.querySelector('.skill-zone');
 if(!needle||!zone)return false;
 const n=needle.getBoundingClientRect(),z=zone.getBoundingClientRect(),center=(n.left+n.right)/2;
 return z.width>0&&center>=z.left-2&&center<=z.right+2;
}
