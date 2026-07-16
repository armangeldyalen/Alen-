import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Hair } from '../types/game';

interface Props {
  paused: boolean;
  playerNumber: number;
  playerSkin: 'light' | 'tan' | 'dark';
  playerHair: Hair;
  shotResult: 'goal' | 'save' | null;
  onOpponentGoal: () => void;
}

export function ThreePitch({ paused, playerNumber, playerSkin, playerHair, shotResult, onOpponentGoal }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const shotResultRef = useRef<'goal' | 'save' | null>(shotResult);
  useEffect(()=>{shotResultRef.current=shotResult;},[shotResult]);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9bc7e4);
    scene.fog = new THREE.Fog(0x9bc7e4, 55, 115);
    const camera = new THREE.PerspectiveCamera(58, host.clientWidth / host.clientHeight, .1, 180);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = false;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x31562e, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(-20, 35, 10); sun.castShadow = false; scene.add(sun);
    const field = new THREE.Mesh(new THREE.PlaneGeometry(84, 57), new THREE.MeshBasicMaterial({ color: 0x42d96b, fog: false }));
    field.rotation.x = -Math.PI / 2; field.receiveShadow = false; scene.add(field);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const border = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(70, .02, 45)), lineMat);
    border.position.y = .03; scene.add(border);
    const middle = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,.05,-22.5),new THREE.Vector3(0,.05,22.5)]), lineMat); scene.add(middle);
    const circle = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:48},(_,i) => new THREE.Vector3(Math.cos(i/48*Math.PI*2)*5,.05,Math.sin(i/48*Math.PI*2)*5))), lineMat); scene.add(circle);
    const rectangleLine = (x1:number,x2:number,z1:number,z2:number) => { const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1,.06,z1),new THREE.Vector3(x2,.06,z1),new THREE.Vector3(x2,.06,z2),new THREE.Vector3(x1,.06,z2),new THREE.Vector3(x1,.06,z1)]),lineMat);scene.add(line); };
    rectangleLine(-35,-23,-14,14); rectangleLine(23,35,-14,14);
    rectangleLine(-35,-29.5,-8,8); rectangleLine(29.5,35,-8,8);
    [-24,24].forEach((x)=>{const spot=new THREE.Mesh(new THREE.CircleGeometry(.16,12),new THREE.MeshBasicMaterial({color:0xffffff}));spot.rotation.x=-Math.PI/2;spot.position.set(x,.07,0);scene.add(spot);});
    [[-35,-22.5,0],[-35,22.5,Math.PI/2],[35,-22.5,-Math.PI/2],[35,22.5,Math.PI]].forEach(([x,z,start])=>{const points=Array.from({length:12},(_,i)=>new THREE.Vector3(x+Math.cos(start+i/11*Math.PI/2)*1.2,.07,z+Math.sin(start+i/11*Math.PI/2)*1.2));scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),lineMat));});

    const postMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .35 });
    const netMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .88 });
    [-1, 1].forEach((side) => {
      const goal = new THREE.Group(); const goalDepth=7;
      [-7,7].forEach((z) => {
        const post=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,4.8,16),postMaterial);post.position.set(0,2.4,z);goal.add(post);
        const backPost=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,4.3,10),postMaterial);backPost.position.set(side*goalDepth,2.15,z);goal.add(backPost);
        const base=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,goalDepth,10),postMaterial);base.rotation.z=Math.PI/2;base.position.set(side*goalDepth/2,.1,z);goal.add(base);
      });
      const crossbar=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,14.4,16),postMaterial);crossbar.rotation.x=Math.PI/2;crossbar.position.set(0,4.8,0);goal.add(crossbar);
      const netPoints: THREE.Vector3[]=[]; const backX=side*goalDepth;
      for(let z=-7;z<=7;z+=.7){netPoints.push(new THREE.Vector3(backX,0,z),new THREE.Vector3(backX,4.3,z));}
      for(let y=0;y<=4.3;y+=.42){netPoints.push(new THREE.Vector3(backX,y,-7),new THREE.Vector3(backX,y,7));}
      [-7,7].forEach((z)=>{for(let x=0;x<=goalDepth;x+=.55){const px=side*x;const top=4.8-x/goalDepth*.5;netPoints.push(new THREE.Vector3(px,0,z),new THREE.Vector3(px,top,z));}for(let y=.42;y<=4.2;y+=.42){netPoints.push(new THREE.Vector3(0,y,z),new THREE.Vector3(backX,Math.min(y,4.3),z));}});
      for(let x=0;x<=goalDepth;x+=.55){const px=side*x;const top=4.8-x/goalDepth*.5;netPoints.push(new THREE.Vector3(px,top,-7),new THREE.Vector3(px,top,7));}
      for(let z=-7;z<=7;z+=.7){netPoints.push(new THREE.Vector3(0,4.8,z),new THREE.Vector3(backX,4.3,z));}
      goal.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(netPoints),netMaterial));
      goal.position.set(side*35,0,0);scene.add(goal);
    });
    const standMaterial = new THREE.MeshBasicMaterial({ color: 0x86a997, fog: false });
    [[0,3,-29,78,6,11],[0,3,29,78,6,11]].forEach(([x,y,z,w,h,d]) => {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),standMaterial); stand.position.set(x,y,z); stand.receiveShadow=true; scene.add(stand);
    });
    // Tiered end stands support the crowds on both sides of both goals.
    [-1,1].forEach((endSide)=>{
      [-1,1].forEach((goalSide)=>{
        for(let row=0;row<8;row+=1){
          const height=5.15+row*.52;
          const tier=new THREE.Mesh(new THREE.BoxGeometry(1.25,height,17),standMaterial);
          tier.position.set(endSide*(38+row*1.1),height/2,goalSide*17.5);
          scene.add(tier);
        }
      });
      for(let row=0;row<8;row+=1){
        const balcony=new THREE.Mesh(new THREE.BoxGeometry(1.25,.35,17),standMaterial);
        balcony.position.set(endSide*(38+row*1.1),5.05+row*.52,0);
        scene.add(balcony);
      }
    });
    [[0,1.6,-24],[0,1.6,24]].forEach(([x,y,z])=>{const tunnel=new THREE.Mesh(new THREE.BoxGeometry(6,3.2,2.5),new THREE.MeshStandardMaterial({color:0x7f9188}));tunnel.position.set(x,y,z);scene.add(tunnel);});
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x78ad8f, fog: false });
    // End walls are split around each goal: they run from the corners towards the
    // posts, while leaving a clear gap around the complete goal and its net.
    [[0,15,-35,98,30,1],[0,15,35,98,30,1],
      [-42.3,10,-15.25,1,20,14.5],[-42.3,10,15.25,1,20,14.5],
      [42.3,10,-15.25,1,20,14.5],[42.3,10,15.25,1,20,14.5],
      [-42.3,15.5,0,1,9,45],[42.3,15.5,0,1,9,45]
    ].forEach(([x,y,z,w,h,d])=>{const wall=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wallMaterial);wall.position.set(x,y,z);scene.add(wall);});
    const barrierMaterial = new THREE.MeshStandardMaterial({ color: 0xeef4ef, roughness: .7 });
    [[0,.55,-23.2,72,1.1,.45],[0,.55,23.2,72,1.1,.45],[-35.7,.55,-15.5,.45,1.1,15],[-35.7,.55,15.5,.45,1.1,15],[35.7,.55,-15.5,.45,1.1,15],[35.7,.55,15.5,.45,1.1,15]].forEach(([x,y,z,w,h,d])=>{const barrier=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),barrierMaterial);barrier.position.set(x,y,z);scene.add(barrier);});
    const fanCount = 1000;
    const fanBodies=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.14,.34,3,6),new THREE.MeshStandardMaterial({color:0xffffff}),fanCount);
    const fanHeads=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,7,5),new THREE.MeshStandardMaterial({color:0xffffff}),fanCount);
    const fanBases: THREE.Vector3[]=[];const fanMatrix=new THREE.Matrix4();const fanHeadMatrix=new THREE.Matrix4();
    const fanColors=[0x2478ff,0xe94848,0xffffff,0xf4d33f,0x36bd68,0xff8a2c,0x9b5de5,0x21c9c3,0xf05aa6];
    const fanSkinColors=[0xf0bd95,0xb87348,0x633a2a,0xe1a477];
    for(let i=0;i<fanCount;i+=1){const side=i%4;const row=Math.floor(i/4)%8;const along=(i*7%180)/179;let x=0,z=0;if(side<2){x=-38+along*76;z=(side===0?-1:1)*(25+row*1.2)}else{x=(side===2?-1:1)*(38+row*1.1);z=-26+along*52}const base=new THREE.Vector3(x,5.55+row*.52,z);fanBases.push(base);fanMatrix.setPosition(base);fanHeadMatrix.setPosition(base.x,base.y+.48,base.z);fanBodies.setMatrixAt(i,fanMatrix);fanHeads.setMatrixAt(i,fanHeadMatrix);fanBodies.setColorAt(i,new THREE.Color(fanColors[i%fanColors.length]));fanHeads.setColorAt(i,new THREE.Color(fanSkinColors[(i*3)%fanSkinColors.length]));}fanBodies.instanceMatrix.needsUpdate=true;fanHeads.instanceMatrix.needsUpdate=true;scene.add(fanBodies,fanHeads);
    scene.add(field);

    const skinColors = { light: 0xf0bd95, tan: 0xb87348, dark: 0x633a2a };
    const hairColors = { short: 0x241a14, curly: 0x15110f, mohawk: 0x7b351f, bald: 0x000000, fade: 0x17120f, afro: 0x14100e, braids: 0x241710, long: 0x352016 };
    const botSkins = [0xf0bd95, 0xb87348, 0x633a2a, 0x8c5136];
    const botHairs = [0x17120f, 0x6d351e, 0xd2a55b, 0x321d13];
    const makePlayer = (color: number, number: number, skin: number, hair: number, bald = false, referee = false) => {
      const group = new THREE.Group();
      const arms: THREE.Group[] = [];
      const legs: THREE.Mesh[] = [];
      const shirtMaterial = new THREE.MeshStandardMaterial({ color });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.42,.54,1.2,10), shirtMaterial);
      body.position.y = 1.55; body.castShadow = true; group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(.42,12,8), new THREE.MeshStandardMaterial({ color: skin }));
      head.position.y = 2.35; head.castShadow = true; group.add(head);
      [-1,1].forEach((side) => {
        const arm = new THREE.Group();
        const upper = new THREE.Mesh(new THREE.CapsuleGeometry(.12,.4,4,8), shirtMaterial);
        upper.position.set(0, -.18, 0); upper.castShadow = true; arm.add(upper);
        const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.1,.37,4,8), new THREE.MeshStandardMaterial({ color: skin }));
        forearm.position.set(0, -.62, side * .02); forearm.castShadow = true; arm.add(forearm);
        const hand = new THREE.Mesh(new THREE.SphereGeometry(.13,8,6), new THREE.MeshStandardMaterial({ color: skin }));
        hand.position.set(0, -.9, side * .03); hand.castShadow = true; arm.add(hand);
        arm.position.set(0, 1.72, side * .56); group.add(arm); arms.push(arm);
      });
      if (!bald) { const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(.43,12,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:hair})); hairMesh.position.y=2.48; group.add(hairMesh); }
      [-1,1].forEach((side) => {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.15,1.08,4,8), new THREE.MeshStandardMaterial({ color }));
        leg.position.set(0, .43, side * .24); leg.castShadow = true; group.add(leg); legs.push(leg);
        const bootMaterial = new THREE.MeshStandardMaterial({ color: 0x171a18 });
        const boot = new THREE.Mesh(new THREE.BoxGeometry(.44,.17,.27), bootMaterial);
        boot.position.set(.12, -.28, side * .24); boot.castShadow = true; group.add(boot);
        [-.13,.1].forEach((x) => { const stud = new THREE.Mesh(new THREE.CylinderGeometry(.045,.035,.1,6), bootMaterial); stud.position.set(x,-.4,side*.24); group.add(stud); });
      });
      const labelCanvas = document.createElement('canvas'); labelCanvas.width = 64; labelCanvas.height = 64;
      const context = labelCanvas.getContext('2d');
      if (context) { context.fillStyle = '#ffffff'; context.font = 'bold 42px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(String(number), 32, 34); }
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(labelCanvas), depthTest: false }));
      label.position.set(-.46, 1.55, 0); label.scale.set(.62,.62,.62); label.renderOrder = 5; if(!referee)group.add(label);
      const frontCanvas = document.createElement('canvas'); frontCanvas.width = 192; frontCanvas.height = 128;
      const frontContext = frontCanvas.getContext('2d');
      if (frontContext) {
        frontContext.fillStyle = '#ffffff'; frontContext.textAlign = 'center';
        frontContext.font = 'bold 25px Arial'; frontContext.fillText(String(number), 96, 28);
        frontContext.font = 'bold 22px Arial'; frontContext.fillText('SPOTIFY', 96, 69);
        frontContext.font = 'italic bold 16px Arial'; frontContext.textAlign = 'left'; frontContext.fillText('NIKE', 12, 108);
      }
      const frontLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(frontCanvas), depthTest: false }));
      frontLabel.position.set(.46, 1.55, 0); frontLabel.scale.set(1.05,.7,1); frontLabel.renderOrder = 5; if(!referee)group.add(frontLabel);
      if(referee){
        const badge=new THREE.Mesh(new THREE.BoxGeometry(.03,.28,.2),new THREE.MeshStandardMaterial({color:0xf4db38}));
        badge.position.set(.43,1.72,-.2);group.add(badge);
        const collar=new THREE.Mesh(new THREE.TorusGeometry(.29,.035,6,16,Math.PI),new THREE.MeshStandardMaterial({color:0xd9e1de}));
        collar.rotation.set(0,Math.PI/2,Math.PI/2);collar.position.set(.39,1.98,0);group.add(collar);
      }
      group.userData.number = number;
      group.userData.body = body;
      group.userData.head = head;
      group.userData.arms = arms;
      group.userData.legs = legs;
      scene.add(group); return group;
    };
    const ownNumbers = [3, 4, 9, playerNumber];
    const rivalNumbers = [3, 4, 9, 10];
    const own = [[-25,-12],[-25,12],[-7,-8],[-7,8]].map(([x,z],i) => { const main=i===3; const p=makePlayer(0x155bd7,ownNumbers[i],main?skinColors[playerSkin]:botSkins[i],main?hairColors[playerHair]:botHairs[i],main&&playerHair==='bald');p.position.set(x,0,z);return p; });
    const rivals = [[25,-12],[25,12],[7,-8],[7,8]].map(([x,z],i) => { const p=makePlayer(0xe8e8e8,rivalNumbers[i],botSkins[(i+2)%4],botHairs[(i+1)%4]);p.position.set(x,0,z);return p; });
    const keepers: THREE.Group[]=[];
    [-32,32].forEach((x,i) => { const p=makePlayer(0xf05aa6,1,botSkins[(i+1)%4],botHairs[(i+3)%4]);p.position.set(x,0,0);keepers.push(p); });
    const referee=makePlayer(0xf2c21a,0,botSkins[1],botHairs[0],false,true);
    referee.position.set(0,0,-5.5);referee.rotation.y=Math.PI/2;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.42,16,12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x164fdd, emissiveIntensity: .35 }));
    ball.castShadow = true; scene.add(ball);
    const slideDuration = 1.15;
    let selected = 3; let rivalSelected = 3; let possession: 'own' | 'rival' = 'own'; let stealCooldown = 0; let slideTime = 0;
    const slideDirection = new THREE.Vector3(1, 0, 0);
    let passTarget: number|null=null;let passProgress=0;const passStart=new THREE.Vector3();
    let activeShot:'goal'|'save'|null=null;let shotProgress=0;const shotStart=new THREE.Vector3();
    let rivalSlideTime = 0; let rivalSlider = 0;
    const rivalSlideDirection = new THREE.Vector3(-1, 0, 0);
    let ownFallTime = 0; let ownFallIndex = 3;
    let rivalFallTime = 0; let rivalFallIndex = 3;
    const hitFallDuration = 1.45;
    const keys = new Set<string>(); const velocity = new THREE.Vector2();
    let cameraYaw = 0; const cameraPitch = .4; let cameraLookHeight = 0; let cameraDistance = 10; let rotatingCamera = false;
    const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();const pitchPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);const aimedPoint=new THREE.Vector3();
    const physicalKeys: Record<string, string> = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd' };
    const controlKey = (event: KeyboardEvent) => physicalKeys[event.code] ?? event.key.toLowerCase();
    const down = (event: KeyboardEvent) => {
      const key = controlKey(event); keys.add(key);
      if(event.code==='Space'){
        if(possession==='own'&&passTarget===null){
          let receiver=-1;let bestDistance=Infinity;
          own.forEach((teammate,index)=>{if(index===selected)return;const distance=teammate.position.distanceTo(ball.position);if(distance<bestDistance){bestDistance=distance;receiver=index;}});
          if(receiver>=0){passTarget=receiver;passStart.copy(ball.position);passProgress=0;}
        }else if(possession==='rival'){
          let nearest=0;let nearestDistance=Infinity;
          own.forEach((teammate,index)=>{const distance=teammate.position.distanceTo(ball.position);if(distance<nearestDistance){nearestDistance=distance;nearest=index;}});
          selected=nearest;velocity.set(0,0);
        }
        event.preventDefault();
      }
      if (event.code === 'KeyE' && possession === 'rival' && stealCooldown === 0 && slideTime === 0) {
        const defender = own[selected];
        slideDirection.copy(rivals[rivalSelected].position).sub(defender.position).setY(0);
        if (slideDirection.lengthSq() < .01) slideDirection.set(1, 0, 0);
        slideDirection.normalize();
        defender.rotation.y = -Math.atan2(slideDirection.z, slideDirection.x);
        slideTime = slideDuration;
        stealCooldown = .9;
        velocity.set(0, 0);
        event.preventDefault();
      }
    };
    const up = (event: KeyboardEvent) => keys.delete(controlKey(event));
    const pointerDown = (event: PointerEvent) => {
      if(event.button===0&&possession==='own'&&passTarget===null){
        const bounds=renderer.domElement.getBoundingClientRect();pointer.x=((event.clientX-bounds.left)/bounds.width)*2-1;pointer.y=-((event.clientY-bounds.top)/bounds.height)*2+1;raycaster.setFromCamera(pointer,camera);
        if(raycaster.ray.intersectPlane(pitchPlane,aimedPoint)){
          let receiver=-1;let nearestDistance=Infinity;
          own.forEach((teammate,index)=>{if(index===selected)return;const distance=Math.hypot(teammate.position.x-aimedPoint.x,teammate.position.z-aimedPoint.z);if(distance<nearestDistance){nearestDistance=distance;receiver=index;}});
          if(receiver>=0&&nearestDistance<8){passTarget=receiver;passStart.copy(ball.position);passProgress=0;}
        }
        event.preventDefault();
      }
      if (event.button === 2) { rotatingCamera = true; renderer.domElement.setPointerCapture(event.pointerId); }
    };
    const pointerMove = (event: PointerEvent) => { if (!rotatingCamera) return; cameraYaw -= event.movementX * .006; cameraLookHeight = THREE.MathUtils.clamp(cameraLookHeight + event.movementY * .025, -4.5, 8); };
    const pointerUp = (event: PointerEvent) => { if (event.button === 2) rotatingCamera = false; };
    const zoomCamera = (event: WheelEvent) => { event.preventDefault(); cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * .012, 1.8, 22); };
    const stopMenu = (event: MouseEvent) => event.preventDefault();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    renderer.domElement.addEventListener('pointerdown', pointerDown); renderer.domElement.addEventListener('pointermove', pointerMove); renderer.domElement.addEventListener('pointerup', pointerUp); renderer.domElement.addEventListener('wheel', zoomCamera, { passive: false }); renderer.domElement.addEventListener('contextmenu', stopMenu);
    let frame = 0; const clock = new THREE.Clock();
    const animate = () => { frame=requestAnimationFrame(animate); const dt=Math.min(clock.getDelta(),.04); const player=own[selected];
      if (!paused && slideTime <= 0) { const forward=keys.has('w')||keys.has('z')||keys.has('arrowup'); const back=keys.has('s')||keys.has('arrowdown'); const left=keys.has('a')||keys.has('q')||keys.has('arrowleft'); const right=keys.has('d')||keys.has('arrowright'); const moveX=(forward?1:0)-(back?1:0);const moveZ=(right?1:0)-(left?1:0);const length=Math.hypot(moveX,moveZ)||1;const targetX=moveX/length*7;const targetZ=moveZ/length*7;const smoothing=1-Math.exp(-9*dt);velocity.x=THREE.MathUtils.lerp(velocity.x,targetX,smoothing);velocity.y=THREE.MathUtils.lerp(velocity.y,targetZ,smoothing);player.position.x+=velocity.x*dt;player.position.z+=velocity.y*dt;if(Math.abs(velocity.x)+Math.abs(velocity.y)>.15){const targetRotation=-Math.atan2(velocity.y,velocity.x);let difference=targetRotation-player.rotation.y;difference=Math.atan2(Math.sin(difference),Math.cos(difference));player.rotation.y+=difference*Math.min(1,10*dt)}player.position.x=THREE.MathUtils.clamp(player.position.x,-34.5,34.5); player.position.z=THREE.MathUtils.clamp(player.position.z,-22,22); }
      stealCooldown=Math.max(0,stealCooldown-dt);
      if (!paused && slideTime > 0) {
        const elapsed = slideDuration - slideTime;
        const slideSpeed = elapsed < .55 ? 9.5 : 2.2;
        player.position.addScaledVector(slideDirection, slideSpeed * dt);
        player.position.x=THREE.MathUtils.clamp(player.position.x,-34.5,34.5); player.position.z=THREE.MathUtils.clamp(player.position.z,-22,22);
        slideTime=Math.max(0,slideTime-dt);
        if (possession === 'rival' && player.position.distanceTo(rivals[rivalSelected].position) < 2.1) {
          rivalFallIndex=rivalSelected;
          rivalFallTime=hitFallDuration;
          possession='own';
          stealCooldown=1.25;
        }
      }
      const elapsed = slideDuration - slideTime;
      const legsOut = slideTime > 0 ? THREE.MathUtils.smoothstep(elapsed, 0, .22) : 0;
      const bodyDown = slideTime > 0 ? THREE.MathUtils.smoothstep(elapsed, .16, .48) : 0;
      const recovery = slideTime > 0 ? 1-THREE.MathUtils.smoothstep(elapsed, .72, 1.12) : 0;
      const tacklePose = Math.min(legsOut, recovery);
      const fallPose = Math.min(bodyDown, recovery);
      const legs = player.userData.legs as THREE.Mesh[];
      const arms = player.userData.arms as THREE.Group[];
      legs.forEach((leg,index)=>{
        const target = tacklePose * (index === 0 ? -1.25 : -1.05);
        leg.rotation.z=THREE.MathUtils.lerp(leg.rotation.z,target,Math.min(1,20*dt));
        leg.position.x=THREE.MathUtils.lerp(leg.position.x,tacklePose*(index===0?.62:.35),Math.min(1,20*dt));
      });
      arms.forEach((arm,index)=>{arm.rotation.z=THREE.MathUtils.lerp(arm.rotation.z,fallPose*(index===0?.7:-.7),Math.min(1,16*dt));});
      player.rotation.z=THREE.MathUtils.lerp(player.rotation.z,-1.18*fallPose,Math.min(1,16*dt));
      player.position.y=THREE.MathUtils.lerp(player.position.y,.34*fallPose,Math.min(1,16*dt));
      const rivalTackler = rivals[rivalSlider];
      if (!paused && rivalSlideTime > 0) {
        const rivalElapsed = slideDuration-rivalSlideTime;
        rivalTackler.position.addScaledVector(rivalSlideDirection,(rivalElapsed<.55?9.5:2.2)*dt);
        rivalTackler.position.x=THREE.MathUtils.clamp(rivalTackler.position.x,-34.5,34.5);
        rivalTackler.position.z=THREE.MathUtils.clamp(rivalTackler.position.z,-22,22);
        rivalSlideTime=Math.max(0,rivalSlideTime-dt);
        if(possession==='own'&&rivalTackler.position.distanceTo(player.position)<2.1){ownFallIndex=selected;ownFallTime=hitFallDuration;possession='rival';rivalSelected=rivalSlider;stealCooldown=1.25;}
      }
      const rivalElapsed=slideDuration-rivalSlideTime;
      const rivalLegsOut=rivalSlideTime>0?THREE.MathUtils.smoothstep(rivalElapsed,0,.22):0;
      const rivalBodyDown=rivalSlideTime>0?THREE.MathUtils.smoothstep(rivalElapsed,.16,.48):0;
      const rivalRecovery=rivalSlideTime>0?1-THREE.MathUtils.smoothstep(rivalElapsed,.72,1.12):0;
      const rivalTacklePose=Math.min(rivalLegsOut,rivalRecovery);const rivalFallPose=Math.min(rivalBodyDown,rivalRecovery);
      (rivalTackler.userData.legs as THREE.Mesh[]).forEach((leg,index)=>{leg.rotation.z=THREE.MathUtils.lerp(leg.rotation.z,rivalTacklePose*(index===0?-1.25:-1.05),Math.min(1,20*dt));leg.position.x=THREE.MathUtils.lerp(leg.position.x,rivalTacklePose*(index===0?.62:.35),Math.min(1,20*dt));});
      (rivalTackler.userData.arms as THREE.Group[]).forEach((arm,index)=>{arm.rotation.z=THREE.MathUtils.lerp(arm.rotation.z,rivalFallPose*(index===0?.7:-.7),Math.min(1,16*dt));});
      rivalTackler.rotation.z=THREE.MathUtils.lerp(rivalTackler.rotation.z,-1.18*rivalFallPose,Math.min(1,16*dt));rivalTackler.position.y=THREE.MathUtils.lerp(rivalTackler.position.y,.34*rivalFallPose,Math.min(1,16*dt));
      const animateHitFall=(victim:THREE.Group,time:number,direction:number)=>{
        const hitElapsed=hitFallDuration-time;
        const knockDown=THREE.MathUtils.smoothstep(hitElapsed,.02,.34);
        const getUp=1-THREE.MathUtils.smoothstep(hitElapsed,.82,1.42);
        const pose=Math.min(knockDown,getUp);
        const stumble=hitElapsed<.28?Math.sin(hitElapsed/.28*Math.PI):0;
        victim.rotation.z=THREE.MathUtils.lerp(victim.rotation.z,direction*1.38*pose,Math.min(1,18*dt));
        victim.rotation.x=THREE.MathUtils.lerp(victim.rotation.x,.28*stumble,Math.min(1,16*dt));
        victim.position.y=THREE.MathUtils.lerp(victim.position.y,.38*pose+.32*stumble,Math.min(1,18*dt));
        (victim.userData.arms as THREE.Group[]).forEach((arm,index)=>{arm.rotation.z=THREE.MathUtils.lerp(arm.rotation.z,pose*(index===0?1.05:-1.05),Math.min(1,18*dt));});
        (victim.userData.legs as THREE.Mesh[]).forEach((leg,index)=>{leg.rotation.z=THREE.MathUtils.lerp(leg.rotation.z,pose*(index===0?.42:-.3),Math.min(1,18*dt));});
      };
      if(ownFallTime>0){ownFallTime=Math.max(0,ownFallTime-dt);animateHitFall(own[ownFallIndex],ownFallTime,1);}
      if(rivalFallTime>0){rivalFallTime=Math.max(0,rivalFallTime-dt);animateHitFall(rivals[rivalFallIndex],rivalFallTime,-1);}
      let carrier:THREE.Group=player;
      if(possession==='own'){let nearest=0;let distance=Infinity;rivals.forEach((r,i)=>{const d=r.position.distanceTo(player.position);if(d<distance){distance=d;nearest=i}});const defender=rivals[nearest];const direction=player.position.clone().sub(defender.position);direction.y=0;if(direction.length()>.1&&rivalSlideTime<=0)defender.position.add(direction.normalize().multiplyScalar(dt*2.6));if(distance<3.6&&stealCooldown===0&&rivalSlideTime===0){rivalSlider=nearest;rivalSlideDirection.copy(direction).normalize();defender.rotation.y=-Math.atan2(rivalSlideDirection.z,rivalSlideDirection.x);rivalSlideTime=slideDuration;stealCooldown=.9;}}
      else{carrier=rivals[rivalSelected];carrier.position.x-=dt*4.2;let nearest=0;let distance=Infinity;own.forEach((p,i)=>{const d=p.position.distanceTo(carrier.position);if(d<distance){distance=d;nearest=i}});const chaser=own[nearest];if(nearest!==selected){const direction=carrier.position.clone().sub(chaser.position);direction.y=0;if(direction.length()>.1)chaser.position.add(direction.normalize().multiplyScalar(dt*3));}if(distance<1.2&&stealCooldown===0){possession='own';selected=nearest;stealCooldown=1.2;}if(carrier.position.x<-33){onOpponentGoal();possession='own';selected=3;own.forEach((p,i)=>p.position.set([ -25,-25,-7,0][i],0,[-12,12,-8,0][i]));rivals.forEach((p,i)=>p.position.set([25,25,7,7][i],0,[-12,12,-8,8][i]));stealCooldown=2;}}
      carrier=possession==='own'?own[selected]:rivals[rivalSelected];
      const requestedShot=shotResultRef.current;
      if(requestedShot&&!activeShot){activeShot=requestedShot;shotProgress=0;shotStart.copy(ball.position);passTarget=null;velocity.set(0,0);}
      if(activeShot&&possession==='own'){
        shotProgress=Math.min(1,shotProgress+dt*1.55);
        const keeper=keepers[1];
        if(activeShot==='goal'){
          const flight=Math.min(1,shotProgress/.72);const netTime=Math.max(0,(shotProgress-.72)/.28);const goalTarget=new THREE.Vector3(38.4,1.65,-2.4);
          ball.position.lerpVectors(shotStart,goalTarget,flight);ball.position.y+=Math.sin(flight*Math.PI)*2.25;
          if(netTime>0){ball.position.x=38.4-Math.sin(netTime*Math.PI)*.55;ball.position.y=THREE.MathUtils.lerp(1.65,.48,netTime);ball.position.z=-2.4+Math.sin(netTime*Math.PI*3)*.22*(1-netTime);}
          const jump=Math.sin(Math.min(1,shotProgress*1.35)*Math.PI);keeper.position.y=jump*1.05;keeper.rotation.z=jump*.78;
        }else{
          const saveTarget=new THREE.Vector3(32.2,2.15,2.8);ball.position.lerpVectors(shotStart,saveTarget,shotProgress);ball.position.y+=Math.sin(shotProgress*Math.PI)*2.1;
          const jump=Math.sin(Math.min(1,shotProgress*1.45)*Math.PI);keeper.position.y=jump*1.45;keeper.rotation.z=-jump*.9;
          if(shotProgress>.82){ball.position.x-=Math.sin((shotProgress-.82)/.18*Math.PI)*1.2;ball.position.y+=.45;}
        }
        ball.rotation.z+=dt*18;
        if(!requestedShot&&shotProgress>=1)activeShot=null;
      }else if(passTarget!==null&&possession==='own'){
        passProgress=Math.min(1,passProgress+dt*1.8);const receiver=own[passTarget];const passEnd=new THREE.Vector3(receiver.position.x+.8,.45,receiver.position.z);ball.position.lerpVectors(passStart,passEnd,passProgress);ball.position.y=.42+Math.sin(passProgress*Math.PI)*.35;ball.rotation.z+=dt*13;
        if(passProgress>=1){selected=passTarget;passTarget=null;passProgress=0;}
      }else{ball.position.set(carrier.position.x+(possession==='own'?1:-1),.45,carrier.position.z);keepers[1].position.y=THREE.MathUtils.lerp(keepers[1].position.y,0,Math.min(1,8*dt));keepers[1].rotation.z=THREE.MathUtils.lerp(keepers[1].rotation.z,0,Math.min(1,8*dt));}
      if(!paused){
        const refereeTarget=new THREE.Vector3(ball.position.x+(possession==='own'?-5:5),0,ball.position.z+4);
        const refereeDirection=refereeTarget.sub(referee.position);refereeDirection.y=0;
        const refereeDistance=refereeDirection.length();
        if(refereeDistance>1.5){
          refereeDirection.normalize();
          referee.position.addScaledVector(refereeDirection,Math.min(2.15*dt,refereeDistance-1.5));
          const refereeRotation=-Math.atan2(refereeDirection.z,refereeDirection.x);let refereeTurn=refereeRotation-referee.rotation.y;refereeTurn=Math.atan2(Math.sin(refereeTurn),Math.cos(refereeTurn));referee.rotation.y+=refereeTurn*Math.min(1,5*dt);
        }
        referee.position.x=THREE.MathUtils.clamp(referee.position.x,-31,31);referee.position.z=THREE.MathUtils.clamp(referee.position.z,-19,19);
      }
      const time=performance.now()*.006;fanBases.forEach((base,i)=>{const jump=Math.max(0,Math.sin(time+i*.7))*.32;fanMatrix.makeTranslation(base.x,base.y+jump,base.z);fanHeadMatrix.makeTranslation(base.x,base.y+.48+jump,base.z);fanBodies.setMatrixAt(i,fanMatrix);fanHeads.setMatrixAt(i,fanHeadMatrix)});fanBodies.instanceMatrix.needsUpdate=true;fanHeads.instanceMatrix.needsUpdate=true;
      const faceView=cameraDistance<3.5;const desired=faceView?new THREE.Vector3(player.position.x+Math.cos(cameraYaw)*2.4,2.45,player.position.z-Math.sin(cameraYaw)*2.4):new THREE.Vector3(player.position.x-Math.cos(cameraYaw)*cameraDistance,4+cameraPitch*7,player.position.z+Math.sin(cameraYaw)*cameraDistance);desired.x=THREE.MathUtils.clamp(desired.x,-43,43);desired.z=THREE.MathUtils.clamp(desired.z,-33,33);desired.y=THREE.MathUtils.clamp(desired.y,1.8,12.5);camera.position.lerp(desired,.08);if(faceView)camera.lookAt(player.position.x,2+cameraLookHeight,player.position.z);else camera.lookAt(player.position.x+Math.cos(cameraYaw)*3,1.2+cameraLookHeight,player.position.z-Math.sin(cameraYaw)*3);renderer.render(scene,camera); };
    animate();
    const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)}; window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('wheel',zoomCamera);renderer.domElement.removeEventListener('contextmenu',stopMenu);renderer.dispose();host.removeChild(renderer.domElement)};
  }, [paused, playerHair, playerNumber, playerSkin]);
  return <div className="three-pitch" ref={mount} />;
}
