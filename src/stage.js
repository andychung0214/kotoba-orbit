import * as THREE from '../vendor/three.module.min.js';

export function mountStage(host) {
  if(!host)return ()=>{};
  let renderer;
  try {renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});} catch {host.dataset.renderer='fallback';return ()=>{};}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
  host.append(renderer.domElement);host.dataset.renderer='webgl';
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(35,1,.1,50);camera.position.set(0,4.6,6.6);camera.lookAt(0,0,0);
  const root=new THREE.Group();root.rotation.z=-.18;scene.add(root);
  scene.add(new THREE.AmbientLight(0xbdb5dc,2));
  const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,6,4);scene.add(key);
  const rim=new THREE.PointLight(0xa5a1ff,15);rim.position.set(-3,2,1);scene.add(rim);
  const material=(color,metalness=.15,roughness=.45)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const disc=new THREE.Group();root.add(disc);
  const vinyl=new THREE.Mesh(new THREE.CylinderGeometry(1.66,1.66,.10,96),material(0x252332,.6,.32));disc.add(vinyl);
  const sleeve=new THREE.Mesh(new THREE.BoxGeometry(3.4,.1,3.4),material(0x74658d,.1,.8));sleeve.position.set(.13,-.22,-.12);sleeve.rotation.y=.24;root.add(sleeve);
  const grooveMaterial=material(0x5c536d,.7,.4);
  for(let i=0;i<19;i++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.74+i*.043,.005,4,100),grooveMaterial);
    ring.rotation.x=-Math.PI/2;ring.position.y=.057;disc.add(ring);
  }
  const label=new THREE.Mesh(new THREE.CylinderGeometry(.67,.67,.012,64),material(0xc1acf3,.15,.65));label.position.y=.065;disc.add(label);
  const dot=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.025,32),material(0x191e2c));dot.position.y=.08;disc.add(dot);
  const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=512;
  const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#c1acf3';ctx.fillRect(0,0,512,512);ctx.fillStyle='#31273f';ctx.textAlign='center';ctx.font='bold 65px sans-serif';ctx.fillText('言葉軌道',256,205);ctx.font='21px monospace';ctx.fillText('KOTOBA ORBIT',256,320);ctx.font='15px monospace';ctx.fillText('SIDE A  /  YOUR FIRST WORD',256,356);
  const texture=new THREE.CanvasTexture(labelCanvas);
  const printed=new THREE.Mesh(new THREE.CircleGeometry(.665,64),new THREE.MeshBasicMaterial({map:texture}));printed.rotation.x=-Math.PI/2;printed.position.y=.075;disc.add(printed);
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(2.08,.012,8,128),material(0xb8a2da));orbit.rotation.x=-Math.PI/2+.18;orbit.rotation.z=-.13;root.add(orbit);
  const bead=new THREE.Mesh(new THREE.SphereGeometry(.105,24,16),material(0xd4ed9a));root.add(bead);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,disposed=false,targetX=0,targetZ=-.18;
  const draw=()=>{renderer.render(scene,camera);};
  const resize=()=>{if(disposed)return;const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix();draw();};
  const observer=new ResizeObserver(resize);observer.observe(host);
  function animate(time=0){if(disposed)return;disc.rotation.y=reduced.matches?-.3:time*.00012;bead.position.set(Math.cos(time*.00018)*2.08,.2,Math.sin(time*.00018)*2.08);root.rotation.x+=(targetX-root.rotation.x)*.04;root.rotation.z+=(targetZ-root.rotation.z)*.04;draw();if(!reduced.matches&&!document.hidden)frame=requestAnimationFrame(animate);}
  function restart(){cancelAnimationFrame(frame);if(!document.hidden)animate();}
  function pointer(e){if(reduced.matches)return;const r=host.getBoundingClientRect();targetX=(e.clientY-r.top-r.height/2)/r.height*.18;targetZ=-.18+(e.clientX-r.left-r.width/2)/r.width*.18;}
  host.addEventListener('pointermove',pointer);document.addEventListener('visibilitychange',restart);reduced.addEventListener('change',restart);
  resize();animate();
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();host.removeEventListener('pointermove',pointer);document.removeEventListener('visibilitychange',restart);reduced.removeEventListener('change',restart);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture.dispose();renderer.dispose();renderer.domElement.remove();};
}
