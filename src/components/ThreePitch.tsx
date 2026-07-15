import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  paused: boolean;
  playerNumber: number;
  playerSkin: 'light' | 'tan' | 'dark';
  playerHair: 'short' | 'curly' | 'mohawk' | 'bald';
  shotResult: 'goal' | 'save' | null;
}

export function ThreePitch({ paused, playerNumber, playerSkin, playerHair, shotResult }: Props) {
  const mount = useRef<HTMLDivElement>(null);

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
    const field = new THREE.Mesh(new THREE.PlaneGeometry(84, 57), new THREE.MeshBasicMaterial({ color: 0x258447 }));
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
    const netMaterial = new THREE.MeshBasicMaterial({ color: 0xeef7f2, wireframe: true, transparent: true, opacity: .6 });
    [-1, 1].forEach((side) => {
      const goal = new THREE.Group();
      [-6,6].forEach((z) => { const post=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,4.2,12),postMaterial);post.position.set(0,2.1,z);goal.add(post); });
      const crossbar=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,12.3,12),postMaterial);crossbar.rotation.x=Math.PI/2;crossbar.position.set(0,4.2,0);goal.add(crossbar);
      const net=new THREE.Mesh(new THREE.BoxGeometry(4.2,4.1,12),netMaterial);net.position.set(side*2.1,2.05,0);goal.add(net);
      goal.position.set(side*35,0,0);scene.add(goal);
    });
    const standMaterial = new THREE.MeshStandardMaterial({ color: 0x26332d, roughness: 1 });
    [[0,3,-29,78,6,11],[0,3,29,78,6,11],[-43,3,0,16,6,58],[43,3,0,16,6,58]].forEach(([x,y,z,w,h,d]) => {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),standMaterial); stand.position.set(x,y,z); stand.receiveShadow=true; scene.add(stand);
    });
    [[0,1.6,-24],[0,1.6,24],[-38,1.6,0],[38,1.6,0]].forEach(([x,y,z],index)=>{const tunnel=new THREE.Mesh(new THREE.BoxGeometry(index<2?6:2.5,3.2,index<2?2.5:7),new THREE.MeshStandardMaterial({color:0x7f9188}));tunnel.position.set(x,y,z);scene.add(tunnel);});
    const stadiumWall = new THREE.Mesh(new THREE.BoxGeometry(98,14,70),new THREE.MeshStandardMaterial({color:0x315443,side:THREE.BackSide}));
    stadiumWall.position.y=7; scene.add(stadiumWall);
    const fanCount = 1000; const fanGeometry = new THREE.SphereGeometry(.18,6,5); const fanMaterial = new THREE.MeshStandardMaterial({color:0xffffff});
    const fans = new THREE.InstancedMesh(fanGeometry,fanMaterial,fanCount); const fanBases: THREE.Vector3[]=[]; const fanMatrix=new THREE.Matrix4();
    const fanColors=[0xb8f33b,0xffffff,0xf2cf62,0x3ba3ff,0xe84d4d];
    for(let i=0;i<fanCount;i+=1){const side=i%4;const row=Math.floor(i/4)%8;const along=(i*7%180)/179;let x=0,z=0;if(side<2){x=-38+along*76;z=(side===0?-1:1)*(25+row*1.2)}else{x=(side===2?-1:1)*(38+row*1.1);z=-26+along*52}const base=new THREE.Vector3(x,5.7+row*.52,z);fanBases.push(base);fanMatrix.setPosition(base);fans.setMatrixAt(i,fanMatrix);fans.setColorAt(i,new THREE.Color(fanColors[i%fanColors.length]));}fans.instanceMatrix.needsUpdate=true;scene.add(fans);
    scene.add(field);

    const skinColors = { light: 0xf0bd95, tan: 0xb87348, dark: 0x633a2a };
    const hairColors = { short: 0x241a14, curly: 0x15110f, mohawk: 0x7b351f, bald: 0x000000 };
    const botSkins = [0xf0bd95, 0xb87348, 0x633a2a, 0x8c5136];
    const botHairs = [0x17120f, 0x6d351e, 0xd2a55b, 0x321d13];
    const makePlayer = (color: number, number: number, skin: number, hair: number, bald = false) => {
      const group = new THREE.Group();
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
        arm.position.set(0, 1.72, side * .56); group.add(arm);
      });
      if (!bald) { const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(.43,12,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:hair})); hairMesh.position.y=2.48; group.add(hairMesh); }
      [-1,1].forEach((side) => {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.15,1.08,4,8), new THREE.MeshStandardMaterial({ color }));
        leg.position.set(0, .43, side * .24); leg.castShadow = true; group.add(leg);
        const bootMaterial = new THREE.MeshStandardMaterial({ color: 0x171a18 });
        const boot = new THREE.Mesh(new THREE.BoxGeometry(.44,.17,.27), bootMaterial);
        boot.position.set(.12, -.28, side * .24); boot.castShadow = true; group.add(boot);
        [-.13,.1].forEach((x) => { const stud = new THREE.Mesh(new THREE.CylinderGeometry(.045,.035,.1,6), bootMaterial); stud.position.set(x,-.4,side*.24); group.add(stud); });
      });
      const labelCanvas = document.createElement('canvas'); labelCanvas.width = 64; labelCanvas.height = 64;
      const context = labelCanvas.getContext('2d');
      if (context) { context.fillStyle = '#ffffff'; context.font = 'bold 42px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(String(number), 32, 34); }
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(labelCanvas), depthTest: false }));
      label.position.set(-.46, 1.55, 0); label.scale.set(.62,.62,.62); label.renderOrder = 5; group.add(label);
      const frontCanvas = document.createElement('canvas'); frontCanvas.width = 192; frontCanvas.height = 128;
      const frontContext = frontCanvas.getContext('2d');
      if (frontContext) {
        frontContext.fillStyle = '#ffffff'; frontContext.textAlign = 'center';
        frontContext.font = 'bold 25px Arial'; frontContext.fillText(String(number), 96, 28);
        frontContext.font = 'bold 22px Arial'; frontContext.fillText('SPOTIFY', 96, 69);
        frontContext.font = 'italic bold 16px Arial'; frontContext.textAlign = 'left'; frontContext.fillText('NIKE', 12, 108);
      }
      const frontLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(frontCanvas), depthTest: false }));
      frontLabel.position.set(.46, 1.55, 0); frontLabel.scale.set(1.05,.7,1); frontLabel.renderOrder = 5; group.add(frontLabel);
      group.userData.number = number;
      scene.add(group); return group;
    };
    const ownNumbers = [3, 4, 9, playerNumber];
    const rivalNumbers = [3, 4, 9, 10];
    const own = [[-25,-12],[-25,12],[-7,-8],[-7,8]].map(([x,z],i) => { const main=i===3; const p=makePlayer(0x174d2d,ownNumbers[i],main?skinColors[playerSkin]:botSkins[i],main?hairColors[playerHair]:botHairs[i],main&&playerHair==='bald');p.position.set(x,0,z);return p; });
    const rivals = [[25,-12],[25,12],[7,-8],[7,8]].map(([x,z],i) => { const p=makePlayer(0xe8e8e8,rivalNumbers[i],botSkins[(i+2)%4],botHairs[(i+1)%4]);p.position.set(x,0,z);return p; });
    [-32,32].forEach((x,i) => { const p=makePlayer(0xf3cf35,1,botSkins[(i+1)%4],botHairs[(i+3)%4]);p.position.set(x,0,0); });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.42,16,12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x164fdd, emissiveIntensity: .35 }));
    ball.castShadow = true; scene.add(ball);
    let selected = 3; const keys = new Set<string>();
    let cameraYaw = 0; let cameraPitch = .4; let cameraDistance = 10; let rotatingCamera = false;
    const down = (event: KeyboardEvent) => { keys.add(event.key.toLowerCase()); if (event.code === 'Space') { selected=(selected+1)%own.length; event.preventDefault(); } };
    const up = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    const pointerDown = (event: PointerEvent) => { if (event.button === 2) { rotatingCamera = true; renderer.domElement.setPointerCapture(event.pointerId); } };
    const pointerMove = (event: PointerEvent) => { if (!rotatingCamera) return; cameraYaw -= event.movementX * .006; cameraPitch = THREE.MathUtils.clamp(cameraPitch + event.movementY * .004, .05, 1); };
    const pointerUp = (event: PointerEvent) => { if (event.button === 2) rotatingCamera = false; };
    const zoomCamera = (event: WheelEvent) => { event.preventDefault(); cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * .012, 5, 22); };
    const stopMenu = (event: MouseEvent) => event.preventDefault();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    renderer.domElement.addEventListener('pointerdown', pointerDown); renderer.domElement.addEventListener('pointermove', pointerMove); renderer.domElement.addEventListener('pointerup', pointerUp); renderer.domElement.addEventListener('wheel', zoomCamera, { passive: false }); renderer.domElement.addEventListener('contextmenu', stopMenu);
    let frame = 0; const clock = new THREE.Clock();
    const animate = () => { frame=requestAnimationFrame(animate); const dt=Math.min(clock.getDelta(),.04); const player=own[selected];
      if (!paused) { const forward=keys.has('w')||keys.has('z')||keys.has('arrowup'); const back=keys.has('s')||keys.has('arrowdown'); const left=keys.has('a')||keys.has('q')||keys.has('arrowleft'); const right=keys.has('d')||keys.has('arrowright'); const moveX=(forward?1:0)-(back?1:0);const moveZ=(right?1:0)-(left?1:0);player.position.x+=moveX*7*dt;player.position.z+=moveZ*7*dt;if(moveX!==0||moveZ!==0)player.rotation.y=-Math.atan2(moveZ,moveX);player.position.x=THREE.MathUtils.clamp(player.position.x,-31,31); player.position.z=THREE.MathUtils.clamp(player.position.z,-20,20); }
      ball.position.set(player.position.x+1, .45, player.position.z); if (shotResult) ball.position.x=THREE.MathUtils.lerp(ball.position.x,31,.15);
      const time=performance.now()*.006;fanBases.forEach((base,i)=>{fanMatrix.makeTranslation(base.x,base.y+Math.max(0,Math.sin(time+i*.7))*.32,base.z);fans.setMatrixAt(i,fanMatrix)});fans.instanceMatrix.needsUpdate=true;
      const desired=new THREE.Vector3(player.position.x-Math.cos(cameraYaw)*cameraDistance,4+cameraPitch*7,player.position.z+Math.sin(cameraYaw)*cameraDistance); camera.position.lerp(desired,.08); camera.lookAt(player.position.x+Math.cos(cameraYaw)*3,1.2,player.position.z-Math.sin(cameraYaw)*3); rivals.forEach((r) => r.position.x-=Math.sign(r.position.x-player.position.x)*dt*.35); renderer.render(scene,camera); };
    animate();
    const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)}; window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('wheel',zoomCamera);renderer.domElement.removeEventListener('contextmenu',stopMenu);renderer.dispose();host.removeChild(renderer.domElement)};
  }, [paused, playerHair, playerNumber, playerSkin, shotResult]);
  return <div className="three-pitch" ref={mount} />;
}
