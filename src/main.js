import * as THREE from 'three';
import './style.css';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050912);
scene.fog = new THREE.FogExp2(0x080d18, 0.025);
const camera = new THREE.PerspectiveCamera(74, innerWidth/innerHeight, .08, 90);
camera.position.set(0,1.7,7.5);
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.shadowMap.enabled=true; renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.12;
document.body.appendChild(renderer.domElement);
const ui=document.createElement('div'); ui.id='game-ui';
ui.innerHTML=`
<div class="vignette"></div><div id="damage-flash"></div>
<header class="hud"><div class="brand"><span class="brand-mark">✦</span>THE LAST LIGHT</div>
<div class="objective"><span class="objective-label" id="level-name">FIELD NOTE 01</span><span id="objective-text">Wake the crystal and find the way out.</span></div>
<div class="lantern-state"><i id="lantern-dot"></i><span id="lantern-label">LANTERN ON</span></div><button id="sound-toggle" type="button">♪ SOUND ON</button></header>
<div id="crosshair"><i></i><b></b></div><div id="prompt"></div><div id="charge-indicator"><span>CRYSTAL CHARGING</span><i><em id="charge-fill"></em></i></div><div id="toast"></div><div id="battery"><div class="battery-copy"><span>LANTERN RESERVE</span><b id="battery-value">100%</b></div><i><em></em></i></div>
<footer class="controls"><span><kbd>WASD</kbd> MOVE</span><span><kbd>SHIFT</kbd> SPRINT</span><span><kbd>F</kbd> LANTERN</span><span><kbd>E</kbd> TURN MIRROR</span><span>BEAM AIM</span><span><kbd>M</kbd> SOUND</span></footer>
<div id="start-screen" class="screen"><div class="screen-glow"></div><div class="screen-content"><div class="eyebrow"><span></span> A SHORT ATMOSPHERIC PUZZLE</div><h1>THE LAST<br><em>LIGHT</em></h1><p class="subtitle">When the stars went dark, the observatory forgot the way home.</p><div class="start-rule"></div><p class="briefing">Aim your lantern through the mirrors to wake each crystal. Keep the flame alive, but spend it wisely. Something in the dark is listening.</p><button id="start-button" class="primary-button">ENTER THE OBSERVATORY <span>→</span></button><div class="start-hint">WASD move · Mouse look · F lantern · E turn mirror</div></div><div class="version">THREE CHAMBERS · ONE LAST LIGHT</div></div>
<div id="pause-screen" class="screen hidden"><div class="screen-content compact"><div class="eyebrow"><span></span> THE DARK IS WAITING</div><h2>PAUSED</h2><button id="resume-button" class="primary-button">RETURN TO THE LIGHT <span>→</span></button><div class="start-hint">Press ESC to resume</div></div></div>
<div id="end-screen" class="screen hidden"><div class="screen-glow"></div><div class="screen-content compact"><div class="eyebrow"><span></span> SIGNAL RESTORED</div><h1>THE WAY<br><em>REMAINS</em></h1><p class="subtitle">Three chambers answer. One distant star remembers.</p><div class="start-rule"></div><p class="briefing">You carried the last light through the dark.</p><button id="restart-button" class="primary-button">PLAY AGAIN <span>↻</span></button></div><div class="version">THE LAST LIGHT · COMPLETE</div></div>`;
document.body.appendChild(ui); const $=s=>ui.querySelector(s);
const objective=$('#objective-text'), levelName=$('#level-name'), prompt=$('#prompt'), cross=$('#crosshair'), toast=$('#toast');
const startScreen=$('#start-screen'),pauseScreen=$('#pause-screen'),endScreen=$('#end-screen');
const mats={
floor:new THREE.MeshStandardMaterial({color:0x202735,roughness:.88,metalness:.08}),
wall:new THREE.MeshStandardMaterial({color:0x30394b,roughness:.9}),
trim:new THREE.MeshStandardMaterial({color:0x596274,roughness:.65,metalness:.35}),
dark:new THREE.MeshStandardMaterial({color:0x101725,roughness:.95}),
gold:new THREE.MeshStandardMaterial({color:0x98734b,roughness:.42,metalness:.72}),
warm:new THREE.MeshStandardMaterial({color:0xffca72,emissive:0xc66b25,emissiveIntensity:2.3,roughness:.35}),
ice:new THREE.MeshStandardMaterial({color:0xb0fbff,emissive:0x2dd6ff,emissiveIntensity:2,roughness:.18}),
glass:new THREE.MeshPhysicalMaterial({color:0x9ceaff,metalness:.58,roughness:.09,transparent:true,opacity:.78,clearcoat:1,clearcoatRoughness:.04,emissive:0x0e3544,emissiveIntensity:.9,side:THREE.DoubleSide}),
platform:new THREE.MeshStandardMaterial({color:0x8eeeff,emissive:0x249bb5,emissiveIntensity:1.5,transparent:true,opacity:.82,roughness:.3})
};
function box(parent,x,y,z,w,h,d,mat,cast=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m}
function light(parent,c,i,r,x,y,z){const l=new THREE.PointLight(c,i,r,2);l.position.set(x,y,z);parent.add(l);return l}
scene.add(new THREE.HemisphereLight(0x7285ad,0x141721,.58));
const moon=new THREE.DirectionalLight(0x9aafd5,1.4); moon.position.set(-7,11,5);moon.castShadow=true;scene.add(moon);
const lantern=new THREE.SpotLight(0xffd59a,125,20,Math.PI/6,.46,1.35);
lantern.position.set(.18,-.13,-.18);lantern.target.position.set(0,-.2,-1);camera.add(lantern,lantern.target);const lanternFill=new THREE.PointLight(0xffd59a,3.2,12,2);lanternFill.position.set(0,-.1,-.2);camera.add(lanternFill);scene.add(camera);
const cone=new THREE.Mesh(new THREE.ConeGeometry(3.1,17,28,1,true),new THREE.MeshBasicMaterial({color:0xffd69a,transparent:true,opacity:.035,side:THREE.DoubleSide,depthWrite:false}));
cone.rotation.x=-Math.PI/2;cone.position.set(.14,-.1,-8.5);camera.add(cone);
const dustGeo=new THREE.BufferGeometry(),dustPos=new Float32Array(240*3);
for(let i=0;i<240;i++){dustPos[i*3]=(Math.random()-.5)*20;dustPos[i*3+1]=Math.random()*5;dustPos[i*3+2]=Math.random()*20-9}
dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xb0c6e8,size:.025,transparent:true,opacity:.5}));scene.add(dust);
const raycaster=new THREE.Raycaster();raycaster.far=20;
const beamGroup=new THREE.Group();scene.add(beamGroup);
const beamSegments=[];const beamGlowGeometry=new THREE.CylinderGeometry(.014,.014,1,6,1,true);const beamGlows=Array.from({length:5},()=>{const m=new THREE.Mesh(beamGlowGeometry,new THREE.MeshBasicMaterial({color:0x8cecff,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));m.visible=false;beamGroup.add(m);return m});const beamAxis=new THREE.Vector3(0,1,0);const beamLines=Array.from({length:5},()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0x8cecff,transparent:true,opacity:.85}));l.visible=false;beamGroup.add(l);return l});const pulseMat=new THREE.MeshBasicMaterial({color:0x9feeff,transparent:true,opacity:.28,depthWrite:false});const pulseGeo=new THREE.SphereGeometry(.008,8,6);const pulseMeshes=Array.from({length:4},()=>{const m=new THREE.Mesh(pulseGeo,pulseMat);scene.add(m);return m});
const shrinePosition=new THREE.Vector3(-8,0,3.5);
let room=new THREE.Group();scene.add(room);
let level=0,mirrors=[],crystals=[],enemies=[],bridge=[],gateLeft,gateRight,doorOpen=false,lanternOn=true,energy=100,activeMirror=null,playing=false,finished=false,locked=false,fallback=false,toastTimer=0,damageFlashTimer=0,yaw=0,pitch=0;
const vec=new THREE.Vector3();
function say(t){toast.textContent=t;toast.classList.add('visible');toastTimer=2.7}
function line(a,b,color=0x8cecff){const index=beamSegments.length;if(index>=beamLines.length)return;const l=beamLines[index],p=l.geometry.attributes.position;p.array.set([a.x,a.y,a.z,b.x,b.y,b.z]);p.needsUpdate=true;l.geometry.computeBoundingSphere();l.material.color.setHex(color);l.visible=true;const glow=beamGlows[index],delta=b.clone().sub(a),distance=delta.length();glow.material.color.setHex(color);glow.position.copy(a).add(b).multiplyScalar(.5);glow.quaternion.setFromUnitVectors(beamAxis,delta.normalize());glow.scale.set(1,distance,1);glow.visible=index>0;beamSegments.push({a:a.clone(),b:b.clone()})}
const mirrorAngles=[0,Math.PI/4,Math.PI/2,3*Math.PI/4,Math.PI,5*Math.PI/4,3*Math.PI/2,7*Math.PI/4];
function aimArrow(i){return ['N ↑','NE ↗','E →','SE ↘','S ↓','SW ↙','W ←','NW ↖'][i]}
function belongsTo(object,parent){for(let node=object;node;node=node.parent)if(node===parent)return true;return false}
function makeMirror(x,z,required,initial){const root=new THREE.Group();root.position.set(x,1.95,z);room.add(root);
box(root,0,-1.4,0,1.45,.38,1.45,mats.gold);
const pivot=new THREE.Group();root.add(pivot);
const frame=box(pivot,0,0,-.11,1.76,1.62,.2,mats.gold);
const face=box(pivot,0,0,.01,1.51,1.37,.08,mats.glass);face.castShadow=false;face.receiveShadow=false;

const halo=new THREE.Mesh(new THREE.TorusGeometry(.76,.018,6,48),mats.warm);halo.position.z=.14; pivot.add(halo);
const marks=new THREE.Group();room.add(marks);
for(let i=0;i<mirrorAngles.length;i++){const a=mirrorAngles[i];const tick=box(marks,x+Math.sin(a)*1.16,1.98,z+Math.cos(a)*1.16,.12,.08,.12,i===required?mats.warm:mats.trim,false)}
const plaque=box(root,0,1.03,.2,.56,.18,.08,mats.dark,false);
const m={root,pivot,face,required,index:initial,charge:0,active:false,x,z};applyMirror(m);mirrors.push(m)}
function applyMirror(m){m.pivot.rotation.y=mirrorAngles[m.index];m.face.material=m.active?mats.ice:mats.glass}
function makeCrystal(x,z){const group=new THREE.Group();group.position.set(x,0,z);room.add(group);box(group,0,.7,0,1.3,1.4,1.3,mats.dark);box(group,0,.05,0,1.42,.1,1.42,mats.gold);
const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.55),new THREE.MeshBasicMaterial({color:0x40eaff,toneMapped:false}));gem.position.y=1.62;gem.scale.y=1.5;group.add(gem);const chargeGem=new THREE.Mesh(new THREE.OctahedronGeometry(.72),new THREE.MeshBasicMaterial({color:0xc4fbff,toneMapped:false,transparent:true,opacity:.85}));chargeGem.position.y=1.62;chargeGem.scale.y=1.5;chargeGem.visible=false;group.add(chargeGem);const glow=light(group,0x28dfff,2.2,5,0,1.6,0);crystals.push({group,gem,chargeGem,glow,x,z,charge:0,charged:false})}
function buildRoom(n){
room.clear();const tones=[{bg:0x050912,fog:0x080d18,floor:0x202735,wall:0x30394b},{bg:0x080d13,fog:0x101824,floor:0x242b2d,wall:0x334044},{bg:0x0a0714,fog:0x130e1c,floor:0x25202e,wall:0x352b3d}][n];scene.background.setHex(tones.bg);scene.fog.color.setHex(tones.fog);mats.floor.color.setHex(tones.floor);mats.wall.color.setHex(tones.wall);beamLines.forEach(l=>l.visible=false);beamGlows.forEach(g=>g.visible=false);beamSegments.length=0;mirrors=[];crystals=[];enemies=[];bridge=[];doorOpen=false;ui.querySelector("#charge-indicator").classList.remove("visible");ui.querySelector("#charge-indicator span").textContent="CRYSTAL CHARGING";ui.querySelector("#charge-fill").style.width="0%";
box(room,0,-.18,3,22,.36,16,mats.floor,false);
box(room,-6.8,-.18,-6.7,8.4,.36,4.6,mats.floor,false);box(room,6.8,-.18,-6.7,8.4,.36,4.6,mats.floor,false);
box(room,0,-.18,-10.8,4.1,.36,4.2,mats.floor,false);box(room,0,-4,-7,5,.5,4.5,mats.dark,false);
for(const x of [-11,11])box(room,x,2.8,1,.55,5.6,20,mats.wall);
box(room,-6.6,2.8,11,8.8,5.6,.55,mats.wall);box(room,6.6,2.8,11,8.8,5.6,.55,mats.wall);
box(room,-6.7,2.8,-9,8.6,5.6,.55,mats.wall);box(room,6.7,2.8,-9,8.6,5.6,.55,mats.wall);box(room,0,5.05,-9,4.8,1.1,.55,mats.wall);
for(const x of [-9.7,-5.6,5.6,9.7])for(const z of [-7.1,0,8.2]){box(room,x,2.55,z,.62,5.1,.72,mats.dark);box(room,x,5.12,z,.88,.28,.96,mats.trim)}
box(room,-8,.34,3.5,1,.68,1,mats.gold);const shrineFlame=new THREE.Mesh(new THREE.ConeGeometry(.2,.62,7),mats.warm);shrineFlame.position.set(-8,1.08,3.5);room.add(shrineFlame);light(room,0xffa647,2.2,4,-8,1,3.5);
for(const z of [-4.5,3.4,8.8]){box(room,-10.42,2.8,z,.22,.55,.28,mats.gold);const f=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,1),mats.warm);f.position.set(-10.3,3.06,z);room.add(f);light(room,0xffb65c,3.2,5.5,-10.2,3.1,z)}

gateLeft=box(room,-1,2.05,-8.72,1.92,4.1,.34,mats.gold);gateRight=box(room,1,2.05,-8.72,1.92,4.1,.34,mats.gold);
box(room,-1,2.05,-8.51,.08,3.45,.05,mats.warm,false);box(room,1,2.05,-8.51,.08,3.45,.05,mats.warm,false);
const layouts=[
{title:'01 · THE OBSERVATORY',desc:'Aim the lantern through the mirror. Hold the beam on the crystal.',mirrors:[[0,-.55,7,0]],crystals:[[-5.1,-.65]],enemy:0},
{title:'02 · THE SUNKEN ARCHIVE',desc:'Relay the beam through both mirrors. Keep the wraith in your light.',mirrors:[[0,-.55,7,0],[-5.1,-.55,7,0]],crystals:[[-5.1,-4.4]],enemy:1},
{title:'03 · THE HOLLOW',desc:'Three mirrors. Two hungry shades. Find the relay before your lantern fades.',mirrors:[[0,-.55,1,0],[5,-.55,1,0],[5,-4.4,7,0]],crystals:[[-5.1,-4.4]],enemy:2}
];
const data=layouts[n];$('#level-name').textContent=data.title;$('#objective-text').textContent=data.desc;
data.mirrors.forEach(v=>makeMirror(...v));data.crystals.forEach(v=>makeCrystal(...v));
for(const z of [-5.15,-6.25,-7.35,-8.45]){const slab=box(room,0,-.04,z,3.55,.22,.92,mats.platform,false);slab.visible=false;bridge.push(slab)}
const beacon=new THREE.Mesh(new THREE.OctahedronGeometry(.38),mats.ice);beacon.position.set(0,2.3,-11.3);room.add(beacon);
for(let i=0;i<data.enemy;i++){const e=new THREE.Group();e.position.set(i?5:0,1.1,i?2:-3);room.add(e);
const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.48,1),new THREE.MeshStandardMaterial({color:0x362346,emissive:0x7b278e,emissiveIntensity:1.5,transparent:true,opacity:.82}));e.add(orb);
const eye=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshBasicMaterial({color:0xff4b8a}));eye.position.set(0,0,.4);e.add(eye);const l=light(e,0xcd3eaa,1.4,4,0,0,0);enemies.push({e,orb,home:e.position.clone(),light:l,cooldown:0})}
}
buildRoom(0);
const state={height:1.7,speed:4.3,sprint:6.2};const keys={forward:false,back:false,left:false,right:false,sprint:false};
function updateBatteryUI(){const pct=THREE.MathUtils.clamp(energy,0,100);$('#battery em').style.width=pct+'%';$('#battery-value').textContent=Math.ceil(pct)+'%';$('#battery').classList.toggle('low',pct<=20)}
function updateLampUI(){lantern.visible=lanternOn;lanternFill.visible=lanternOn;cone.visible=lanternOn;$('#lantern-dot').classList.toggle('off',!lanternOn);$('#lantern-label').textContent=lanternOn?'LANTERN ON':'LANTERN OUT';$('#lantern-label').classList.toggle('off',!lanternOn);updateBatteryUI()}
function enableFallback(){if(!playing||finished)return;fallback=true;pauseScreen.classList.add('hidden');say('Move the mouse to look around.')}
function requestLock(){try{const p=renderer.domElement.requestPointerLock?.();p?.catch?.(enableFallback)}catch{enableFallback()}}
function beginGame(){if(playing)return;playing=true;startScreen.classList.add('hidden');requestLock();startAmbience();say('The dark is listening.')}
const startButton=$('#start-button');startButton.addEventListener('click',beginGame);
startScreen.addEventListener('click',event=>{const r=startButton.getBoundingClientRect();if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)beginGame()});
$('#resume-button').addEventListener('click',requestLock);$('#restart-button').addEventListener('click',()=>location.reload());
document.addEventListener('pointerlockerror',enableFallback);
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===renderer.domElement;if(locked)fallback=false;if(playing&&!finished)pauseScreen.classList.toggle('hidden',locked||fallback);if(!locked)Object.keys(keys).forEach(k=>keys[k]=false)});
renderer.domElement.addEventListener('click',()=>{if(playing&&!locked&&!fallback)requestLock()});
document.addEventListener('mousemove',e=>{if(!(locked||fallback))return;yaw-=e.movementX*.0021;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0021,-1.38,1.38)});
function walkable(x,z){
if(x < -10.15||x>10.15||z>10.1)return false;
if(z< -4.72&&z> -9.02){if(!(doorOpen&&Math.abs(x)<1.88))return false;if(!bridge.some(p=>Math.abs(z-p.position.z)<.72))return false}
if(z< -9.15&&z> -12.7)return Math.abs(x)<1.88;
if(z< -4.72&&Math.abs(x)>1.88)return false;
if(Math.abs(x)<.92&&z> -1.45&&z<.35)return false;
if(x> -6&&x< -4.2&&z> -1.55&&z<.25)return false;
if(z< -8.55&&z> -9.35&&!doorOpen)return false;
return z>= -12.7
}
function updateAim(dt){
camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0,'YXZ');camera.getWorldDirection(vec);
raycaster.far=20;raycaster.set(camera.position,vec);
const faceMeshes=mirrors.map(m=>m.face);
const aimedHit=lanternOn?raycaster.intersectObjects(faceMeshes,false)[0]:null;
activeMirror=aimedHit&&camera.position.distanceTo(aimedHit.object.parent.parent.position)<(level===0?10:3.9)?mirrors.find(m=>m.face===aimedHit.object):null;
const shrineNear=camera.position.distanceTo(shrinePosition)<3.2;
cross.classList.toggle('targeting',!!activeMirror||shrineNear);prompt.classList.toggle('visible',!!activeMirror||shrineNear);
prompt.innerHTML=activeMirror?'<kbd>E</kbd><span>TURN MIRROR · '+aimArrow(activeMirror.index)+'</span>':shrineNear?'<kbd>E</kbd><span>REKINDLE LANTERN</span>':'';
beamLines.forEach(l=>l.visible=false);beamGlows.forEach(g=>g.visible=false);beamSegments.length=0;
if(lanternOn&&energy>0){
  const lampOrigin=lantern.getWorldPosition(new THREE.Vector3());
  let rayOrigin=camera.position.clone(),rayDirection=vec.clone(),previousMirror=null;
  for(let bounce=0;bounce<=mirrors.length;bounce++){
    raycaster.far=20;raycaster.set(rayOrigin,rayDirection);
    const hit=raycaster.intersectObject(room,true).find(h=>h.distance>.035&&!(previousMirror&&belongsTo(h.object,previousMirror.root)));
    if(!hit){const end=rayOrigin.clone().addScaledVector(rayDirection,18);line(bounce===0?lampOrigin:rayOrigin,end,bounce?0x8cecff:0xffd69a);break}
    const hitMirror=mirrors.find(m=>m.face===hit.object);
    const hitCrystal=crystals.find(c=>c.gem===hit.object||c.chargeGem===hit.object);
    line(bounce===0?lampOrigin:rayOrigin,hit.point,bounce?0x8cecff:0xffd69a);
    if(hitCrystal){
      const validReceiver=previousMirror&&previousMirror.index===previousMirror.required&&(level===0||previousMirror.active);ui.querySelector('#charge-indicator').classList.add('visible');ui.querySelector('#charge-indicator span').textContent=validReceiver?'CRYSTAL CHARGING':'CRYSTAL NEEDS THE FULL RELAY';
      if(validReceiver){
        const crystal=hitCrystal;crystal.charge=Math.min(1,crystal.charge+dt/1.3);crystal.charged=true;crystal.chargeGem.visible=true;
        crystal.chargeGem.scale.set(.9+crystal.charge*.2,1.35+crystal.charge*.3,.9+crystal.charge*.2);
        ui.querySelector('#charge-fill').style.width=(crystal.charge*100)+'%';
        if(crystal.charge>=1&&!doorOpen){doorOpen=true;playSuccess();ui.querySelector('#charge-indicator span').textContent='CRYSTAL AWAKENED';say('THE CRYSTAL WAKES. CROSS THE BRIDGE.');$('#objective-text').textContent='Cross the revealed bridge before the lantern goes dark.'}
      }
      break;
    }
    if(!hitMirror)break;
    if(previousMirror&&previousMirror.index===previousMirror.required&&hitMirror.index===hitMirror.required&&!hitMirror.active){
      hitMirror.charge=Math.min(1,hitMirror.charge+dt/1.15);ui.querySelector('#charge-indicator').classList.add('visible');ui.querySelector('#charge-indicator span').textContent='MIRROR RELAY CHARGING';ui.querySelector('#charge-fill').style.width=(hitMirror.charge*100)+'%';
      if(hitMirror.charge>=1){hitMirror.active=true;applyMirror(hitMirror);ui.querySelector('#charge-indicator span').textContent='RELAY CAUGHT · BEAM CONTINUES';ui.querySelector('#charge-fill').style.width='100%';playSuccess();say('RELAY CAUGHT · TURN THE NEXT MIRROR')}
    }
    const surfaceNormal=new THREE.Vector3(0,0,1).applyQuaternion(hitMirror.pivot.getWorldQuaternion(new THREE.Quaternion())).normalize();
    if(surfaceNormal.dot(rayDirection)>0)surfaceNormal.negate();
    rayDirection=rayDirection.clone().reflect(surfaceNormal).normalize();rayOrigin=hit.point.clone().addScaledVector(rayDirection,.12);previousMirror=hitMirror;
  }
}if(!doorOpen&&energy>0&&lanternOn){energy=Math.max(0,energy-dt*(level===0?.22:.38));updateBatteryUI();if(energy===0){lanternOn=false;updateLampUI();say('THE FLAME DIES · FIND THE BLUE SHRINE')}}
if(!doorOpen&&energy<=0)$('#objective-text').textContent='Lantern empty. Reach the blue shrine and press E.';
}

function interact(){
if(!playing||!(locked||fallback))return;
if(!activeMirror){if(camera.position.distanceTo(shrinePosition)<3.2){energy=100;lanternOn=true;updateLampUI();playRecharge();say('LANTERN REKINDLED')}return}
activeMirror.index=(activeMirror.index+1)%mirrorAngles.length;activeMirror.charge=0;applyMirror(activeMirror);playMirrorTurn();
say('MIRROR '+aimArrow(activeMirror.index)+' · ALIGN THE BEAM');
}
document.addEventListener('keydown',e=>{
if(['KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code))e.preventDefault();
if(!playing||finished)return;
if(e.code==='KeyW')keys.forward=true;if(e.code==='KeyS')keys.back=true;if(e.code==='KeyA')keys.left=true;if(e.code==='KeyD')keys.right=true;
if(e.code==='ShiftLeft'||e.code==='ShiftRight')keys.sprint=true;
if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='KeyM'&&!e.repeat)setSound(!soundEnabled);
if(e.code==='KeyF'&&!e.repeat){if(lanternOn){lanternOn=false;updateLampUI();say('DARKNESS SETTLES')}else if(energy>0){lanternOn=true;updateLampUI();say('THE LANTERN CATCHES')}else say('FIND THE BLUE SHRINE · PRESS E');}
if(e.code==='KeyR'&&finished)location.reload();
});
document.addEventListener('keyup',e=>{if(e.code==='KeyW')keys.forward=false;if(e.code==='KeyS')keys.back=false;if(e.code==='KeyA')keys.left=false;if(e.code==='KeyD')keys.right=false;if(e.code==='ShiftLeft'||e.code==='ShiftRight')keys.sprint=false});
function move(dt){
if(!playing||!(locked||fallback)||finished)return;
const f=Number(keys.forward)-Number(keys.back),s=Number(keys.right)-Number(keys.left);
if(!f&&!s){stepTimer=0;return}
const oldX=camera.position.x,oldZ=camera.position.z,len=Math.hypot(f,s),speed=(keys.sprint?state.sprint:state.speed)*dt;
const dx=(-Math.sin(yaw)*f/len+Math.cos(yaw)*s/len)*speed,dz=(-Math.cos(yaw)*f/len-Math.sin(yaw)*s/len)*speed;
if(walkable(camera.position.x+dx,camera.position.z))camera.position.x+=dx;
if(walkable(camera.position.x,camera.position.z+dz))camera.position.z+=dz;
if(Math.hypot(camera.position.x-oldX,camera.position.z-oldZ)>.002){
stepTimer-=dt;if(stepTimer<=0){playFootstep(keys.sprint);stepTimer=keys.sprint?.34:.49}
}else stepTimer=0;
}
function resetLevel(){
level++;if(level>=3){finished=true;document.exitPointerLock?.();endScreen.classList.remove('hidden');return}
camera.position.set(0,1.7,7.5);yaw=0;pitch=0;energy=100;lanternOn=true;updateLampUI();buildRoom(level);say(level===1?'THE SUNKEN ARCHIVE · LISTEN FOR THE WRAITH':'THE HOLLOW · TWO WRAITHS IN THE DARK');
}
let prev=performance.now(),stepTimer=0;
function animate(){
requestAnimationFrame(animate);const now=performance.now(),dt=Math.min((now-prev)/1000,.05);prev=now;move(dt);
for(const m of mirrors){m.pivot.rotation.y=THREE.MathUtils.damp(m.pivot.rotation.y,mirrorAngles[m.index],12,dt)}
crystals.forEach(c=>{c.gem.rotation.y+=dt*.42;c.gem.position.y=1.62+Math.sin(now*.002)*.08;c.chargeGem.rotation.y=c.gem.rotation.y;c.chargeGem.position.y=c.gem.position.y});
if(doorOpen){gateLeft.position.x=THREE.MathUtils.damp(gateLeft.position.x,-4.55,5,dt);gateRight.position.x=THREE.MathUtils.damp(gateRight.position.x,4.55,5,dt);
bridge.forEach((p,i)=>{p.visible=true;p.material.opacity=.75+Math.sin(now*.004+i)*.1});}
if(playing&&!finished&&(locked||fallback)){
updateAim(dt);
enemies.forEach(e=>{
e.orb.position.y=Math.sin(now*.003)*.12;
const toShade=new THREE.Vector3(e.e.position.x-camera.position.x,0,e.e.position.z-camera.position.z),shadeDistance=toShade.length();const illuminated=lanternOn&&energy>0&&shadeDistance<12&&vec.dot(toShade.normalize())>.55;
if(!illuminated){const toPlayer=new THREE.Vector3(camera.position.x-e.e.position.x,0,camera.position.z-e.e.position.z);if(toPlayer.length()>0)e.e.position.addScaledVector(toPlayer.normalize(),dt*(level===2?1.5:1.1))}else{e.e.position.lerp(e.home,dt*.6)}
const dist=e.e.position.distanceTo(camera.position);e.cooldown=Math.max(0,e.cooldown-dt);
if(dist<1.15&&e.cooldown===0){energy=Math.max(0,energy-35);playChime([120,82],.05,.36);updateBatteryUI();e.cooldown=2.4;if(energy===0){lanternOn=false;updateLampUI()}camera.position.set(0,1.7,7.5);$('#damage-flash').classList.add('visible');damageFlashTimer=.38;say('A SHADE STRIKES · 35% LIGHT LOST');}
});
if(camera.position.z< -10.25){if(level<2)resetLevel();else{finished=true;document.exitPointerLock?.();endScreen.classList.remove('hidden')}}
}

if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toast.classList.remove('visible')}if(damageFlashTimer>0){damageFlashTimer-=dt;if(damageFlashTimer<=0)$('#damage-flash').classList.remove('visible')}
pulseMeshes.forEach((mesh,i)=>{if(!beamSegments.length){mesh.visible=false;return}const s=beamSegments[i%beamSegments.length],t=.16+((now*.001+i*.22)% .72);mesh.visible=true;mesh.position.lerpVectors(s.a,s.b,t)});renderer.render(scene,camera);
}
updateLampUI();animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.75))});

let soundEnabled=true,audioContext=null,ambienceGain=null,footstepBuffer=null;
function updateSoundLabel(){$('#sound-toggle').textContent=soundEnabled?'♪ SOUND ON':'♪ SOUND OFF'}
function setSound(enabled){
  soundEnabled=enabled;updateSoundLabel();
  if(audioContext&&ambienceGain)ambienceGain.gain.setTargetAtTime(enabled?.12:0,audioContext.currentTime,.6);
}
function startAmbience(){
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return;
  if(!audioContext){
    audioContext=new AudioContextClass();const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=520;
    ambienceGain=audioContext.createGain();ambienceGain.gain.value=0;filter.connect(ambienceGain);ambienceGain.connect(audioContext.destination);
    for(const [frequency,detune] of [[55,-3],[82.41,2],[110,-2],[164.81,3]]){
      const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=frequency;osc.detune.value=detune;gain.gain.value=.18;osc.connect(gain);gain.connect(filter);osc.start();
    }
    const buffer=audioContext.createBuffer(1,audioContext.sampleRate*2,audioContext.sampleRate),samples=buffer.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*.12;
    const noise=audioContext.createBufferSource(),wind=audioContext.createBiquadFilter(),windGain=audioContext.createGain();
    noise.buffer=buffer;noise.loop=true;wind.type='lowpass';wind.frequency.value=180;windGain.gain.value=.14;noise.connect(wind);wind.connect(windGain);windGain.connect(filter);noise.start();
footstepBuffer=audioContext.createBuffer(1,Math.floor(audioContext.sampleRate*.12),audioContext.sampleRate);
    const stepSamples=footstepBuffer.getChannelData(0);for(let i=0;i<stepSamples.length;i++)stepSamples[i]=(Math.random()*2-1)*(1-i/stepSamples.length);;
  }
  audioContext.resume().catch(()=>{});setSound(soundEnabled);
}
$('#sound-toggle').addEventListener('click',()=>setSound(!soundEnabled));
function playChime(notes=[520,780],volume=.035,duration=.22){
  if(!soundEnabled||!audioContext||audioContext.state!=='running')return;
  const now=audioContext.currentTime;
  notes.forEach((frequency,index)=>{
    const osc=audioContext.createOscillator(),gain=audioContext.createGain(),start=now+index*.065;
    osc.type='sine';osc.frequency.setValueAtTime(frequency,start);
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(gain);gain.connect(audioContext.destination);osc.start(start);osc.stop(start+duration+.03);
  });
}
function playMirrorTurn(){playChime([510,720],.026,.12)}
function playRecharge(){playChime([440,587,784],.05,.32)}
function playSuccess(){playChime([392,587,784,988],.045,.4)}
function playFootstep(sprinting=false){
  if(!soundEnabled||!audioContext||!footstepBuffer||audioContext.state!=='running')return;
  const now=audioContext.currentTime,noise=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),env=audioContext.createGain();
  noise.buffer=footstepBuffer;filter.type='bandpass';filter.frequency.value=sprinting?920:680;filter.Q.value=.7;
  env.gain.setValueAtTime(.0001,now);env.gain.exponentialRampToValueAtTime(sprinting?.045:.032,now+.009);env.gain.exponentialRampToValueAtTime(.0001,now+.12);
  noise.connect(filter);filter.connect(env);env.connect(audioContext.destination);noise.start(now);noise.stop(now+.13);
  const thud=audioContext.createOscillator(),thudEnv=audioContext.createGain();thud.type='triangle';thud.frequency.setValueAtTime(sprinting?92:74,now);thud.frequency.exponentialRampToValueAtTime(48,now+.085);
  thudEnv.gain.setValueAtTime(.0001,now);thudEnv.gain.exponentialRampToValueAtTime(sprinting?.027:.021,now+.006);thudEnv.gain.exponentialRampToValueAtTime(.0001,now+.095);
  thud.connect(thudEnv);thudEnv.connect(audioContext.destination);thud.start(now);thud.stop(now+.1);
}
