import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const el=document.querySelector('#model');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e8e5df');
const camera=new THREE.PerspectiveCamera(34,1,.001,10);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.72;
el.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.04;controls.maxDistance=.8;
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.65;
scene.add(new THREE.HemisphereLight(0xffffff,0x726a5d,.55));
const light=new THREE.DirectionalLight(0xfff1dc,1.0);light.position.set(-1,2,2);scene.add(light);
const loader=new GLTFLoader();const models={};let current=null;
const states={family:'COB',state:'ZGASZONE',view:'render'};
const info={PREMIUM:'70 LED/m · 140 LED/m · 210 LED/m · RGBW 5-pin',DELUX:'3in1 · Low Brightness 160 · Slim 4 mm',COB:'COB · WCOB · COB IP67 — PREMIUM · 3 lata gwarancji'};
function resize(){const r=el.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(el);
function setLight(){if(!current)return;current.traverse(o=>{if(!o.isMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if(!m.emissive)continue;let v=0;const n=m.name||'';const emitter=n.includes('phosphor')||n.includes('RGB chip')||n.includes('luminous silicone');if(emitter){m.emissive.copy(n.includes('RGB chip')?m.color:new THREE.Color(1,.7,.35));if(states.state==='ZAPALONE')v=3;else if(states.state==='MIESZANE'&&['premium70','premium210','delux3w1','slim160','RGB chip','cob —','cobip67 —'].some(k=>n.includes(k)))v=3;}m.emissiveIntensity=v;}});}
async function loadModel(){
 const family=states.family;
 if(current)current.visible=false;
 if(!models[family]){
  let gltf;
  if(window.MODEL_URLS){gltf=await loader.loadAsync(window.MODEL_URLS[family]);}
  else{const raw=atob(window.MODEL_DATA[family]);const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);gltf=await loader.parseAsync(bytes.buffer,'');}
  models[family]=gltf.scene;scene.add(gltf.scene);
 }
 if(states.family!==family)return;
 current=models[family];current.visible=true;setLight();
 const box=new THREE.Box3().setFromObject(current);const center=box.getCenter(new THREE.Vector3());
 controls.target.copy(center);controls.target.y-=.010;camera.position.copy(center).add(new THREE.Vector3(.13,.14,.19));controls.update();resize();
}
function refresh(){
 document.querySelector('#render').src=`3D_Z_MODELI/rendery/${states.family}_${states.state}.png`;
 document.querySelector('#render').alt=`${states.family} — ${states.state.toLowerCase()}`;
 document.querySelector('#caption').textContent=info[states.family];
 document.querySelector('#blend').href=`3D_Z_MODELI/modele/${states.family}_EDYTOWALNE.blend`;
 document.querySelector('#glb').href=`3D_Z_MODELI/modele/${states.family}.glb`;
 document.querySelector('#png').href=`3D_Z_MODELI/rendery/${states.family}_${states.state}.png`;
 document.querySelectorAll('button[data-family]').forEach(b=>b.classList.toggle('active',b.dataset.family===states.family));
 document.querySelectorAll('button[data-state]').forEach(b=>b.classList.toggle('active',b.dataset.state===states.state));
 document.querySelector('#render').hidden=states.view==='model';el.hidden=states.view!=='model';
 document.querySelector('#toggle').textContent=states.view==='model'?'Pokaż render':'Obróć model 3D';
 document.querySelector('#hint').hidden=states.view!=='model';
 setLight();
}
document.querySelectorAll('button[data-family]').forEach(b=>b.onclick=()=>{states.family=b.dataset.family;refresh();if(states.view==='model')loadModel().catch(showError);});
document.querySelectorAll('button[data-state]').forEach(b=>b.onclick=()=>{states.state=b.dataset.state;refresh();});
document.querySelector('#toggle').onclick=()=>{states.view=states.view==='render'?'model':'render';refresh();if(states.view==='model')loadModel().catch(showError);};
function showError(e){document.querySelector('#error').textContent='Nie udało się wyświetlić modelu 3D: '+e.message;}
refresh();renderer.setAnimationLoop(()=>{if(states.view==='model'){controls.update();renderer.render(scene,camera);}});
if(location.hash.startsWith('#3d')){const p=location.hash.split('/');if(['PREMIUM','DELUX','COB'].includes(p[1]))states.family=p[1];if(['ZGASZONE','ZAPALONE','MIESZANE'].includes(p[2]))states.state=p[2];states.view='model';refresh();loadModel().then(()=>{document.body.dataset.modelLoaded='true';}).catch(showError);}
