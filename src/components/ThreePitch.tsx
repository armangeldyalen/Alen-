import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Hair } from '../types/game';
import { teamAwayKitColors, teamKitColors } from '../data/gameData';
import { supabase } from '../lib/supabase';

interface Props {
  paused: boolean;
  playerNumber: number;
  playerSkin: 'light' | 'tan' | 'dark';
  playerHair: Hair;
  playerHeight: number;
  playerAccessories: string[];
  homeGoals: number;
  awayGoals: number;
  matchMinute: number;
  botStrength: number;
  shotResult: 'goal' | 'save' | null;
  shotPower: number;
  shotStyle: 'normal'|'finesse'|'power';
  homeTeam: string;
  awayTeam: string;
  onOpponentGoal: () => void;
}

export function ThreePitch({ paused, playerNumber, playerSkin, playerHair, playerHeight, playerAccessories, homeGoals, awayGoals, matchMinute, botStrength, shotResult, shotPower, shotStyle, homeTeam, awayTeam, onOpponentGoal }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const shotResultRef = useRef<'goal' | 'save' | null>(shotResult);
  const shotPowerRef=useRef(shotPower);const shotStyleRef=useRef(shotStyle);
  const matchStateRef=useRef({homeGoals,awayGoals,matchMinute,botStrength});
  useEffect(()=>{shotResultRef.current=shotResult;},[shotResult]);
  useEffect(()=>{shotPowerRef.current=shotPower;shotStyleRef.current=shotStyle;},[shotPower,shotStyle]);
  useEffect(()=>{matchStateRef.current={homeGoals,awayGoals,matchMinute,botStrength};},[homeGoals,awayGoals,matchMinute,botStrength]);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.scale.set(.25,.25,.25);
    scene.background = new THREE.Color(0x9bc7e4);
    scene.fog = new THREE.Fog(0x9bc7e4, 55, 115);
    const camera = new THREE.PerspectiveCamera(74, host.clientWidth / host.clientHeight, .1, 180);
    camera.up.set(0,1,0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=.92;
    renderer.shadowMap.enabled = false;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdff4ff, 0x31562e, 1.8));
    scene.add(new THREE.AmbientLight(0xffffff,.48));
    const sun = new THREE.DirectionalLight(0xfff4df, 2.15);
    sun.position.set(-20, 35, 10); sun.castShadow = false; scene.add(sun);
    [[-28,18,-20],[-28,18,20],[28,18,-20],[28,18,20]].forEach(([x,y,z])=>{const floodlight=new THREE.PointLight(0xd8efff,2.6,62,1.4);floodlight.position.set(x,y,z);scene.add(floodlight);});
    const field = new THREE.Mesh(new THREE.PlaneGeometry(84, 57), new THREE.MeshStandardMaterial({ color: 0x28c95a,roughness:.78,metalness:0,fog:false }));
    field.rotation.x = -Math.PI / 2; field.receiveShadow = false; scene.add(field);
    for(let stripe=0;stripe<12;stripe+=1){const grassStripe=new THREE.Mesh(new THREE.PlaneGeometry(7,57),new THREE.MeshBasicMaterial({color:stripe%2===0?0x42df70:0x1eaf4d,transparent:true,opacity:.24,fog:false}));grassStripe.rotation.x=-Math.PI/2;grassStripe.position.set(-38.5+stripe*7,.012,0);scene.add(grassStripe);}
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
    const standMaterial = new THREE.MeshStandardMaterial({ color: 0x263b4b,roughness:.82, fog: false });
    [[0,3,-29,78,6,11],[0,3,29,78,6,11]].forEach(([x,y,z,w,h,d]) => {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),standMaterial); stand.position.set(x,y,z); stand.receiveShadow=true; scene.add(stand);
    });
    const seatMaterials=[new THREE.MeshStandardMaterial({color:0x1769aa,roughness:.75}),new THREE.MeshStandardMaterial({color:0x25a8df,roughness:.7}),new THREE.MeshStandardMaterial({color:0x174b82,roughness:.8})];
    for(let row=0;row<14;row+=1){
      [-1,1].forEach((side)=>{const seats=new THREE.Mesh(new THREE.BoxGeometry(80,.28,.72),seatMaterials[row%seatMaterials.length]);seats.position.set(0,5.25+row*.48,side*(25+row*.82));scene.add(seats);});
      [-1,1].forEach((side)=>{const seats=new THREE.Mesh(new THREE.BoxGeometry(.72,.28,54),seatMaterials[(row+1)%seatMaterials.length]);seats.position.set(side*(38+row*.82),5.25+row*.48,0);scene.add(seats);});
    }
    const roofMaterial=new THREE.MeshStandardMaterial({color:0x25313a,roughness:.58,metalness:.42,side:THREE.DoubleSide});
    [[0,16.5,-41,106,1,18],[0,16.5,41,106,1,18],[-53,16.5,0,18,1,66],[53,16.5,0,18,1,66]].forEach(([x,y,z,w,h,d])=>{const roof=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),roofMaterial);roof.position.set(x,y,z);scene.add(roof);});
    const beamMaterial=new THREE.MeshStandardMaterial({color:0xb6c4cc,metalness:.68,roughness:.3});
    [-32,32].forEach((z)=>{const beam=new THREE.Mesh(new THREE.BoxGeometry(100,.28,.32),beamMaterial);beam.position.set(0,15.7,z);scene.add(beam);});
    [-44,44].forEach((x)=>{const beam=new THREE.Mesh(new THREE.BoxGeometry(.32,.28,64),beamMaterial);beam.position.set(x,15.7,0);scene.add(beam);});
    const lampMaterial=new THREE.MeshBasicMaterial({color:0xf2fbff});
    for(let lamp=0;lamp<12;lamp+=1){const x=-38+lamp*(76/11);[-1,1].forEach((side)=>{const panel=new THREE.Mesh(new THREE.BoxGeometry(3,.16,.7),lampMaterial);panel.position.set(x,15.45,side*31.5);scene.add(panel);});}
    // Tiered end stands support the crowds on both sides of both goals.
    [-1,1].forEach((endSide)=>{
      [-1,1].forEach((goalSide)=>{
        for(let row=0;row<14;row+=1){
          const height=5.15+row*.52;
          const tier=new THREE.Mesh(new THREE.BoxGeometry(1.25,height,17),standMaterial);
          tier.position.set(endSide*(38+row*.85),height/2,goalSide*17.5);
          scene.add(tier);
        }
      });
      for(let row=0;row<14;row+=1){
        const balcony=new THREE.Mesh(new THREE.BoxGeometry(1.25,.35,17),standMaterial);
        balcony.position.set(endSide*(38+row*.85),5.05+row*.52,0);
        scene.add(balcony);
      }
    });
    [[0,1.6,-24],[0,1.6,24]].forEach(([x,y,z])=>{const tunnel=new THREE.Mesh(new THREE.BoxGeometry(6,3.2,2.5),new THREE.MeshStandardMaterial({color:0x7f9188}));tunnel.position.set(x,y,z);scene.add(tunnel);});
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x28aee8, roughness: .62, metalness: .05, fog: false });
    // End walls are split around each goal: they run from the corners towards the
    // posts, while leaving a clear gap around the complete goal and its net.
    [[0,15,-35,98,30,1],[0,15,35,98,30,1],
      [-42.3,10,-15.25,1,20,14.5],[-42.3,10,15.25,1,20,14.5],
      [42.3,10,-15.25,1,20,14.5],[42.3,10,15.25,1,20,14.5],
      [-42.3,15.5,0,1,9,45],[42.3,15.5,0,1,9,45]
    ].filter(([x])=>Math.abs(x)<40).forEach(([x,y,z,w,h,d])=>{const wall=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wallMaterial);wall.position.set(x,y,z);scene.add(wall);});
    const farStadiumWall=new THREE.Mesh(new THREE.BoxGeometry(1,30,76),wallMaterial);farStadiumWall.position.set(56,15,0);scene.add(farStadiumWall);
    const barrierMaterial = new THREE.MeshStandardMaterial({ color: 0xeef4ef, roughness: .7 });
    [[0,.55,-23.2,72,1.1,.45],[0,.55,23.2,72,1.1,.45],[-35.7,.55,-15.5,.45,1.1,15],[-35.7,.55,15.5,.45,1.1,15],[35.7,.55,-15.5,.45,1.1,15],[35.7,.55,15.5,.45,1.1,15]].forEach(([x,y,z,w,h,d])=>{const barrier=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),barrierMaterial);barrier.position.set(x,y,z);scene.add(barrier);});
    const fanCount = 4000;
    const fanBodies=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.14,.34,3,6),new THREE.MeshStandardMaterial({color:0xffffff}),fanCount);
    const fanHeads=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,7,5),new THREE.MeshStandardMaterial({color:0xffffff}),fanCount);
    const fanBases: THREE.Vector3[]=[];const fanMatrix=new THREE.Matrix4();const fanHeadMatrix=new THREE.Matrix4();
    const fanColors=[0x2478ff,0xe94848,0xffffff,0xf4d33f,0x36bd68,0xff8a2c,0x9b5de5,0x21c9c3,0xf05aa6];
    const fanSkinColors=[0xf0bd95,0xb87348,0x633a2a,0xe1a477];
    for(let i=0;i<fanCount;i+=1){const side=i%4;const row=Math.floor(i/4)%25;const along=(i*7%400)/399;let x=0,z=0;if(side<2){x=-41+along*82;z=(side===0?-1:1)*(25+row*.62)}else{const angle=-Math.PI/2+along*Math.PI;const radiusZ=27+row*.34;const curvedX=38+row*.52+Math.cos(angle)*5.5;x=(side===2?-1:1)*curvedX;z=Math.sin(angle)*radiusZ}const base=new THREE.Vector3(x,5.55+row*.38,z);fanBases.push(base);fanMatrix.setPosition(base);fanHeadMatrix.setPosition(base.x,base.y+.48,base.z);fanBodies.setMatrixAt(i,fanMatrix);fanHeads.setMatrixAt(i,fanHeadMatrix);fanBodies.setColorAt(i,new THREE.Color(fanColors[i%fanColors.length]));fanHeads.setColorAt(i,new THREE.Color(fanSkinColors[(i*3)%fanSkinColors.length]));}fanBodies.instanceMatrix.needsUpdate=true;fanHeads.instanceMatrix.needsUpdate=true;scene.add(fanBodies,fanHeads);
    const seatBottoms=new THREE.InstancedMesh(new THREE.BoxGeometry(.38,.12,.34),new THREE.MeshStandardMaterial({color:0x1769aa,roughness:.72}),fanCount);
    const seatBacks=new THREE.InstancedMesh(new THREE.BoxGeometry(.38,.42,.09),new THREE.MeshStandardMaterial({color:0x208bd0,roughness:.7}),fanCount);
    const seatMatrix=new THREE.Matrix4();const seatBackMatrix=new THREE.Matrix4();const seatRotation=new THREE.Quaternion();const seatScale=new THREE.Vector3(1,1,1);const seatColors=[0x1769aa,0x24a6df,0x123f75];
    fanBases.forEach((base,index)=>{const side=index%4;seatMatrix.compose(new THREE.Vector3(base.x,base.y-.2,base.z),new THREE.Quaternion(),seatScale);seatBottoms.setMatrixAt(index,seatMatrix);const backPosition=new THREE.Vector3(base.x,base.y+.02,base.z);seatRotation.setFromAxisAngle(new THREE.Vector3(0,1,0),0);if(side<2)backPosition.z+=Math.sign(base.z)*.18;else{backPosition.x+=Math.sign(base.x)*.18;seatRotation.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);}seatBackMatrix.compose(backPosition,seatRotation,seatScale);seatBacks.setMatrixAt(index,seatBackMatrix);const color=new THREE.Color(seatColors[(index+Math.floor(index/40))%seatColors.length]);seatBottoms.setColorAt(index,color);seatBacks.setColorAt(index,color);});seatBottoms.instanceMatrix.needsUpdate=true;seatBacks.instanceMatrix.needsUpdate=true;scene.add(seatBottoms,seatBacks);
    scene.add(field);

    const skinColors = { light: 0xf0bd95, tan: 0xb87348, dark: 0x633a2a };
    const hairColors = { short: 0x241a14, curly: 0x15110f, mohawk: 0x7b351f, bald: 0x000000, fade: 0x17120f, afro: 0x14100e, braids: 0x241710, long: 0x16130f };
    const botSkins = [0xf0bd95, 0xb87348, 0x633a2a, 0x8c5136];
    const botHairs = [0x17120f, 0x6d351e, 0xd2a55b, 0x321d13];
    const makePlayer = (color: number, number: number, skin: number, hair: number, bald = false, referee = false, hairStyle?: Hair, accessories: string[] = []) => {
      const group = new THREE.Group();
      const arms: THREE.Group[] = [];
      const legs: THREE.Mesh[] = [];
      const shirtMaterial = new THREE.MeshStandardMaterial({ color });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.42,.54,1.2,10), shirtMaterial);
      body.position.y = 1.55; body.castShadow = true; group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(.42,12,8), new THREE.MeshStandardMaterial({ color: skin }));
      head.position.y = 2.35; head.castShadow = true; group.add(head);
      [-.16,.16].forEach((z)=>{const eye=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),new THREE.MeshStandardMaterial({color:0xf7f7f2}));eye.position.set(.39,2.38,z);group.add(eye);const pupil=new THREE.Mesh(new THREE.SphereGeometry(.038,8,6),new THREE.MeshStandardMaterial({color:0x17120f}));pupil.position.set(.455,2.38,z);group.add(pupil);});
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
      if (!bald) {
        const hairMaterial=new THREE.MeshStandardMaterial({color:hair});
        let hairGeometry:THREE.BufferGeometry=new THREE.SphereGeometry(.43,12,6,0,Math.PI*2,0,Math.PI/2);
        if(hairStyle==='afro'||hairStyle==='curly')hairGeometry=new THREE.SphereGeometry(hairStyle==='afro'?.55:.48,14,8,0,Math.PI*2,0,Math.PI*.56);
        if(hairStyle==='fade')hairGeometry=new THREE.SphereGeometry(.42,12,6,0,Math.PI*2,0,Math.PI*.38);
        if(hairStyle==='mohawk')hairGeometry=new THREE.CapsuleGeometry(.09,.42,4,8);
        const hairMesh=new THREE.Mesh(hairGeometry,hairMaterial);hairMesh.position.y=hairStyle==='mohawk'?2.72:2.48;
        if(hairStyle==='mohawk'){hairMesh.rotation.x=Math.PI/2;hairMesh.scale.set(1,.72,1);}
        group.add(hairMesh);
        if(hairStyle==='long'){
          const longShape=new THREE.Shape();
          longShape.moveTo(-.42,.3);longShape.quadraticCurveTo(0,.55,.42,.3);longShape.lineTo(.42,-.55);longShape.quadraticCurveTo(.42,-.68,.28,-.68);longShape.lineTo(-.28,-.68);longShape.quadraticCurveTo(-.42,-.68,-.42,-.55);longShape.closePath();
          const backHairGeometry=new THREE.ExtrudeGeometry(longShape,{depth:.12,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.045,bevelThickness:.035,curveSegments:10});
          backHairGeometry.center();
          const backHair=new THREE.Mesh(backHairGeometry,hairMaterial);
          backHair.rotation.y=Math.PI/2;backHair.position.set(-.34,2.08,0);backHair.scale.set(1,.94,.94);backHair.castShadow=true;group.add(backHair);
        }
      }
      if(accessories.includes('glasses')){[-.19,.19].forEach((z)=>{const lens=new THREE.Mesh(new THREE.TorusGeometry(.16,.035,6,14),new THREE.MeshStandardMaterial({color:0x18242a}));lens.rotation.y=Math.PI/2;lens.position.set(.4,2.35,z);group.add(lens);});const bridge=new THREE.Mesh(new THREE.BoxGeometry(.05,.04,.14),new THREE.MeshStandardMaterial({color:0x18242a}));bridge.position.set(.42,2.35,0);group.add(bridge);}
      if(accessories.includes('headband')){const band=new THREE.Mesh(new THREE.TorusGeometry(.425,.045,6,20),new THREE.MeshStandardMaterial({color:0xe53d45}));band.rotation.x=Math.PI/2;band.position.y=2.42;group.add(band);}
      if(accessories.includes('captain')){const captainBand=new THREE.Mesh(new THREE.BoxGeometry(.28,.14,.28),new THREE.MeshStandardMaterial({color:0xf2d133}));captainBand.position.set(0,1.28,-.57);group.add(captainBand);}
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
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(labelCanvas), transparent:true,depthTest:true,depthWrite:false }));
      label.position.set(-.46, 1.55, 0); label.scale.set(.62,.62,.62); label.renderOrder = 5; if(!referee)group.add(label);
      const frontCanvas = document.createElement('canvas'); frontCanvas.width = 192; frontCanvas.height = 128;
      const frontContext = frontCanvas.getContext('2d');
      if (frontContext) {
        frontContext.fillStyle = '#ffffff'; frontContext.textAlign = 'center';
        frontContext.font = 'bold 30px Arial'; frontContext.fillText(String(number), 96, 46);
      }
      const frontLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(frontCanvas), transparent:true,depthTest:true,depthWrite:false }));
      frontLabel.position.set(.46, 1.55, 0); frontLabel.scale.set(1.05,.7,1); frontLabel.renderOrder = 5; if(!referee)group.add(frontLabel);
      if(referee){
        [-.32,-.11,.11,.32].forEach((z)=>{[-1,1].forEach((front)=>{const stripe=new THREE.Mesh(new THREE.BoxGeometry(.035,.88,.095),new THREE.MeshStandardMaterial({color:0xf5f5f2}));stripe.position.set(front*.52,1.58,z);group.add(stripe);});});
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
    const ownNumbers = [3, 4, playerNumber];
    const rivalNumbers = [3, 4, 10];
    const homeKit=teamKitColors[homeTeam]??0x155bd7;let awayKit=teamKitColors[awayTeam]??0xe8e8e8;
    const colorDistance=(first:number,second:number)=>{const red=(first>>16)-(second>>16);const green=((first>>8)&255)-((second>>8)&255);const blue=(first&255)-(second&255);return Math.hypot(red,green,blue);};
    if(colorDistance(homeKit,awayKit)<105)awayKit=teamAwayKitColors[awayTeam]??(homeKit>0xaaaaaa?0x172a55:0xf4f4f4);
    const own = [[-17,-10],[-17,10],[-7,0]].map(([x,z],i) => { const main=i===2; const p=makePlayer(homeKit,ownNumbers[i],main?skinColors[playerSkin]:botSkins[i],main?hairColors[playerHair]:botHairs[i],main&&playerHair==='bald',false,main?playerHair:undefined,main?playerAccessories:[]);p.scale.y=main?.9+(playerHeight-155)/50*.22:1;p.position.set(x,0,z);const indicator=new THREE.Mesh(new THREE.ConeGeometry(.46,.82,4),new THREE.MeshStandardMaterial({color:0xff9f1c,emissive:0xff5a00,emissiveIntensity:1.8}));indicator.name='ball-owner-indicator';indicator.position.set(0,3.72,0);indicator.rotation.z=Math.PI;indicator.visible=false;p.add(indicator);return p; });
    const rivals = [[17,-10],[17,10],[7,0]].map(([x,z],i) => { const p=makePlayer(awayKit,rivalNumbers[i],botSkins[(i+2)%4],botHairs[(i+1)%4]);p.position.set(x,0,z);return p; });
    const flagUrl=(team:string)=>{if(team.startsWith('Англия'))return'https://flagcdn.com/w40/gb-eng.png';if(team.startsWith('Шотландия'))return'https://flagcdn.com/w40/gb-sct.png';const regional=[...team].filter((symbol)=>(symbol.codePointAt(0)??0)>=127462&&(symbol.codePointAt(0)??0)<=127487);const code=regional.map((symbol)=>String.fromCharCode((symbol.codePointAt(0)??127462)-127397)).join('').toLowerCase();return code?`https://flagcdn.com/w40/${code}.png`:'';};
    const flagLoader=new THREE.TextureLoader();flagLoader.setCrossOrigin('anonymous');
    const addShirtFlag=(footballer:THREE.Group,team:string)=>{const url=flagUrl(team);if(!url)return;flagLoader.load(url,(texture)=>{texture.colorSpace=THREE.SRGBColorSpace;const flag=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));flag.position.set(.55,1.72,-.27);flag.scale.set(.34,.23,1);flag.renderOrder=6;footballer.add(flag);});};
    own.forEach((footballer)=>addShirtFlag(footballer,homeTeam));rivals.forEach((footballer)=>addShirtFlag(footballer,awayTeam));
    const keepers: THREE.Group[]=[];
    [-32,32].forEach((x,i) => { const p=makePlayer(0xf05aa6,1,botSkins[(i+1)%4],botHairs[(i+3)%4]);p.position.set(x,0,0);keepers.push(p); });
    const referee=makePlayer(0x151817,0,botSkins[1],botHairs[0],false,true);
    referee.position.set(0,0,-5.5);referee.rotation.y=Math.PI/2;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.42,16,12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x164fdd, emissiveIntensity: .35 }));
    ball.castShadow = true; scene.add(ball);
    const slideDuration = 1.15;
    let selected = 2; let rivalSelected = 2; let possession: 'own' | 'rival' = 'own'; let stealCooldown = 0; let dribbleCooldown = 0; let dribbleTime = 0; let dribbleSide = 0; let slideTime = 0;
    const slideDirection = new THREE.Vector3(1, 0, 0);
    let passTarget: number|null=null;let passProgress=0;const passStart=new THREE.Vector3();let ownKeeperPassTarget:number|null=null;let ownKeeperPassProgress=0;const ownKeeperPassStart=new THREE.Vector3();
    let activeShot:'goal'|'save'|null=null;let shotProgress=0;const shotStart=new THREE.Vector3();
    let rivalSlideTime = 0; let rivalSlider = 0;
    const rivalSlideDirection = new THREE.Vector3(-1, 0, 0);
    let ownFallTime = 0; let ownFallIndex = 2;
    let rivalFallTime = 0; let rivalFallIndex = 2;
    const hitFallDuration = 1.45;
    type BotRole='defender_left'|'defender_right'|'attacker_left'|'attacker_right';
    type BotTactic={style:'defensive'|'balanced'|'attacking';pressing:number;attackSpeed:number;passTarget:BotRole;tacklePlayer:BotRole;counterattack:boolean;defensiveLine:'low'|'middle'|'high'};
    const roleIndex:Record<BotRole,number>={defender_left:0,defender_right:1,attacker_left:2,attacker_right:2};
    let botTactic:BotTactic={style:'balanced',pressing:Math.max(1,Math.min(10,botStrength)),attackSpeed:Math.max(1,Math.min(10,botStrength))*1.7,passTarget:'attacker_left',tacklePlayer:'defender_left',counterattack:false,defensiveLine:'middle'};
    let rivalPassTarget:number|null=null;let rivalPassProgress=0;const rivalPassStart=new THREE.Vector3();let aiPassCooldown=1.2;let rivalPasses=0;
    let rivalShot:'goal'|'save'|null=null;let rivalShotProgress=0;const rivalShotStart=new THREE.Vector3();
    const requestBotTactic=async()=>{const state=matchStateRef.current;const {data,error}=await supabase.functions.invoke('ai',{body:{mode:'football-tactics',state:{...state,minute:state.matchMinute,possession}}});if(!error&&data&&!data.error)botTactic={style:['defensive','attacking'].includes(data.style)?data.style:'balanced',pressing:THREE.MathUtils.clamp(Number(data.pressing)||5,1,10),attackSpeed:THREE.MathUtils.clamp(Number(data.attackSpeed)||5,1,10)*1.7,passTarget:data.passTarget in roleIndex?data.passTarget:'attacker_left',tacklePlayer:data.tacklePlayer in roleIndex?data.tacklePlayer:'defender_left',counterattack:Boolean(data.counterattack),defensiveLine:['low','high'].includes(data.defensiveLine)?data.defensiveLine:'middle'};};
    void requestBotTactic();const tacticTimer=window.setInterval(()=>{if(!paused)void requestBotTactic();},10000);
    const keys = new Set<string>(); const velocity = new THREE.Vector2();
    let cameraYaw = 0;let rotatingCamera = false;let cameraPlayer=2;
    const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();const pitchPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);const aimedPoint=new THREE.Vector3();
    const physicalKeys: Record<string, string> = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyQ: 'pass' };
    let kickoffPause=0;
    let kickoffOwnFormation=[[-17,-10],[-17,10],[-6,0]];let kickoffRivalFormation=[[17,-10],[17,10],[6,0]];
    const resetKickoff=(conceded:'own'|'rival')=>{kickoffOwnFormation=[[-17,-10],[-17,10],[conceded==='own'?-1:-6,0]];kickoffRivalFormation=[[17,-10],[17,10],[conceded==='rival'?1:6,0]];keepers[0].position.set(-32,0,0);keepers[1].position.set(32,0,0);possession=conceded;selected=2;rivalSelected=2;passTarget=null;ownKeeperPassTarget=null;rivalPassTarget=null;rivalPasses=0;rivalShot=null;rivalShotProgress=0;aiPassCooldown=1.2;activeShot=null;shotProgress=0;velocity.set(0,0);ball.position.set(0,.42,0);stealCooldown=2;kickoffPause=2;};
    const controlKey = (event: KeyboardEvent) => physicalKeys[event.code] ?? event.key.toLowerCase();
    const down = (event: KeyboardEvent) => {
      const key = controlKey(event); keys.add(key);
      if(event.code==='Space'&&possession==='own')window.dispatchEvent(new CustomEvent('football-player-position',{detail:{x:own[selected].position.x}}));
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
      if ((event.code === 'Digit2' || event.code === 'Digit3') && possession === 'own' && dribbleCooldown === 0 && slideTime === 0 && passTarget === null && !activeShot) {
        const dribbler = own[selected];
        const side = event.code === 'Digit2' ? -1 : 1;
        dribbler.rotation.y = -Math.atan2(side * 2.15, 1.15);
        dribbleSide = side;
        dribbleTime = .38;
        velocity.set(5.4, side * 7.8);
        dribbleCooldown = .62;
        stealCooldown = Math.max(stealCooldown, .48);
        event.preventDefault();
      }
      if (event.code === 'KeyQ' && possession === 'own' && passTarget === null && !activeShot) {
        let receiver=-1;let bestDistance=Infinity;
        own.forEach((teammate,index)=>{if(index===selected)return;const distance=teammate.position.distanceTo(ball.position);if(distance<bestDistance){bestDistance=distance;receiver=index;}});
        if(receiver>=0){passTarget=receiver;passStart.copy(ball.position);passProgress=0;}
        event.preventDefault();
      }
      if ((event.code === 'ShiftLeft' || event.code === 'ShiftRight') && !event.repeat && possession !== 'own' && !paused && kickoffPause === 0 && passTarget === null && !activeShot) {
        selected=(selected+1)%own.length;
        velocity.set(0,0);
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
    const mobilePass=()=>{if(possession!=='own'||passTarget!==null)return;let receiver=-1;let bestDistance=Infinity;own.forEach((teammate,index)=>{if(index===selected)return;const distance=teammate.position.distanceTo(ball.position);if(distance<bestDistance){bestDistance=distance;receiver=index;}});if(receiver>=0){passTarget=receiver;passStart.copy(ball.position);passProgress=0;}};
    const mobileSwitch=()=>{if(possession==='own'||paused||kickoffPause>0||passTarget!==null||activeShot)return;selected=(selected+1)%own.length;velocity.set(0,0);};
    const pointerMove = (event: PointerEvent) => { if (!rotatingCamera) return; cameraYaw-=event.movementX*.006; };
    const pointerUp = (event: PointerEvent) => { if (event.button === 2) rotatingCamera = false; };
    const stopMenu = (event: MouseEvent) => event.preventDefault();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('mobile-pass',mobilePass);
    window.addEventListener('mobile-switch',mobileSwitch);
    renderer.domElement.addEventListener('pointerdown', pointerDown); renderer.domElement.addEventListener('pointermove', pointerMove); renderer.domElement.addEventListener('pointerup', pointerUp); renderer.domElement.addEventListener('contextmenu', stopMenu);
    const animateKeeperDive=(keeper:THREE.Group,progress:number,targetZ:number,height:number)=>{const flight=Math.sin(Math.min(1,progress)*Math.PI);const travel=THREE.MathUtils.smoothstep(progress,.04,.7)*(1-THREE.MathUtils.smoothstep(progress,.82,1));const direction=targetZ>=0?1:-1;keeper.position.z=targetZ*travel;keeper.position.y=height*flight;keeper.rotation.x=-direction*flight*1.18;keeper.rotation.z=flight*.12;(keeper.userData.arms as THREE.Group[]).forEach((arm)=>{arm.rotation.x=direction*flight*1.35;arm.rotation.z*=.8;});(keeper.userData.legs as THREE.Mesh[]).forEach((leg,index)=>{leg.rotation.x=direction*flight*(index===0?.38:.2);});};
    let frame = 0; let fanAnimationAccumulator = 0; const clock = new THREE.Clock();
    const animate = () => { frame=requestAnimationFrame(animate); const dt=Math.min(clock.getDelta(),.04); const player=own[selected];if(kickoffPause>0){const previous=kickoffPause;kickoffPause=Math.max(0,kickoffPause-dt);const returnSpeed=1-Math.exp(-2.8*dt);own.forEach((footballer,index)=>footballer.position.lerp(new THREE.Vector3(kickoffOwnFormation[index][0],0,kickoffOwnFormation[index][1]),returnSpeed));rivals.forEach((footballer,index)=>footballer.position.lerp(new THREE.Vector3(kickoffRivalFormation[index][0],0,kickoffRivalFormation[index][1]),returnSpeed));ball.position.set(0,.42,0);velocity.set(0,0);if(previous>0&&kickoffPause===0){own.forEach((footballer,index)=>footballer.position.set(kickoffOwnFormation[index][0],0,kickoffOwnFormation[index][1]));rivals.forEach((footballer,index)=>footballer.position.set(kickoffRivalFormation[index][0],0,kickoffRivalFormation[index][1]));if(possession==='own'){passTarget=0;passStart.copy(ball.position);passProgress=0;}else{rivalPassTarget=0;rivalPassStart.copy(ball.position);rivalPassProgress=0;}}}const playPaused=paused||kickoffPause>0;
      if (!playPaused && slideTime <= 0) { const forward=keys.has('w')||keys.has('z')||keys.has('arrowup'); const back=keys.has('s')||keys.has('arrowdown'); const left=keys.has('a')||keys.has('q')||keys.has('arrowleft'); const right=keys.has('d')||keys.has('arrowright'); const moveX=(forward?1:0)-(back?1:0);const moveZ=(right?1:0)-(left?1:0);const length=Math.hypot(moveX,moveZ)||1;const dribbling=dribbleTime>0;const targetX=dribbling?8.4:moveX/length*7;const targetZ=dribbling?dribbleSide*10.2:moveZ/length*7;const smoothing=1-Math.exp(-(dribbling?16:9)*dt);velocity.x=THREE.MathUtils.lerp(velocity.x,targetX,smoothing);velocity.y=THREE.MathUtils.lerp(velocity.y,targetZ,smoothing);player.position.x+=velocity.x*dt;player.position.z+=velocity.y*dt;if(Math.abs(velocity.x)+Math.abs(velocity.y)>.15){const targetRotation=-Math.atan2(velocity.y,velocity.x);let difference=targetRotation-player.rotation.y;difference=Math.atan2(Math.sin(difference),Math.cos(difference));player.rotation.y+=difference*Math.min(1,(dribbling?16:10)*dt)}player.position.x=THREE.MathUtils.clamp(player.position.x,-34.5,34.5); player.position.z=THREE.MathUtils.clamp(player.position.z,-22,22); }
      stealCooldown=Math.max(0,stealCooldown-dt);
      dribbleCooldown=Math.max(0,dribbleCooldown-dt);
      dribbleTime=Math.max(0,dribbleTime-dt);
      aiPassCooldown=Math.max(0,aiPassCooldown-dt);
      if (!playPaused && slideTime > 0) {
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
      if (!playPaused && rivalSlideTime > 0) {
        const rivalElapsed = slideDuration-rivalSlideTime;
        rivalTackler.position.addScaledVector(rivalSlideDirection,(rivalElapsed<.55?9.2:2.4)*dt);
        rivalTackler.position.x=THREE.MathUtils.clamp(rivalTackler.position.x,-34.5,34.5);
        rivalTackler.position.z=THREE.MathUtils.clamp(rivalTackler.position.z,-22,22);
        rivalSlideTime=Math.max(0,rivalSlideTime-dt);
        if(possession==='own'&&rivalTackler.position.distanceTo(player.position)<2.55){ownFallIndex=selected;ownFallTime=hitFallDuration;possession='rival';rivalSelected=rivalSlider;rivalPasses=0;aiPassCooldown=.45;stealCooldown=.85;}
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
      const defensiveX=botTactic.defensiveLine==='low'?27:botTactic.defensiveLine==='high'?16:22;
      if(possession==='own'&&!playPaused){[0,1].forEach((index)=>{if(index===rivalSlider&&rivalSlideTime>0)return;const anchor=new THREE.Vector3(defensiveX,0,index===0?-11:11);rivals[index].position.lerp(anchor,Math.min(1,dt*1.15));});}
      if(!playPaused&&possession==='own'){
        const pressTarget=passTarget!==null?ball.position:player.position;let chosen=0;let nearestPressDistance=Infinity;
        rivals.forEach((candidate,index)=>{const candidateDistance=candidate.position.distanceTo(pressTarget);if(candidateDistance<nearestPressDistance){nearestPressDistance=candidateDistance;chosen=index;}});
        const defender=rivals[chosen];const direction=pressTarget.clone().sub(defender.position);direction.y=0;const distance=direction.length();const pressSpeed=3+botTactic.pressing*.28;
        if(direction.length()>.1&&rivalSlideTime<=0){defender.position.add(direction.normalize().multiplyScalar(dt*pressSpeed));defender.rotation.y=-Math.atan2(direction.z,direction.x);}
        if(distance<3.5+botTactic.pressing*.2&&stealCooldown===0&&rivalSlideTime===0&&passTarget===null){rivalSlider=chosen;rivalSlideDirection.copy(direction).normalize();defender.rotation.y=-Math.atan2(rivalSlideDirection.z,rivalSlideDirection.x);rivalSlideTime=slideDuration;stealCooldown=.35;}
      }
      else if(!playPaused){
        carrier=rivals[rivalSelected];
        const attackBoost=botTactic.style==='attacking'?.6:botTactic.style==='defensive'?-.15:0;const counterBoost=botTactic.counterattack?.7:0;const attackSpeed=2.8+botTactic.attackSpeed*.16+attackBoost+counterBoost;
        if(rivalPassTarget===null&&!rivalShot)carrier.position.x-=dt*attackSpeed;
        const swapSides=Math.sin(performance.now()*.00065)>0;
        rivals.forEach((teammate,index)=>{if(index===rivalSelected||index===rivalPassTarget)return;const lane=index===0?(swapSides?10:-10):index===1?(swapSides?-10:10):(carrier.position.z>0?-5:5);const runAhead=index===2?6:2.5;const supportX=THREE.MathUtils.clamp(carrier.position.x-runAhead,-29,25);teammate.position.lerp(new THREE.Vector3(supportX,0,lane),Math.min(1,dt*(1.35+botTactic.attackSpeed*.08)));teammate.rotation.y=Math.PI;});
        if(aiPassCooldown===0&&rivalPassTarget===null&&!rivalShot&&carrier.position.x>-18){
          if(rivalPasses<3&&Math.random()<.58){let target=roleIndex[botTactic.passTarget];if(target===rivalSelected||Math.random()<.45)target=(rivalSelected+1+Math.floor(Math.random()*(rivals.length-1)))%rivals.length;rivalPassTarget=target;rivalPassStart.copy(ball.position);rivalPassProgress=0;aiPassCooldown=1.8;}
          else aiPassCooldown=1.6+Math.random()*1.4;
        }
        if(!rivalShot&&rivalPassTarget===null&&carrier.position.x<=-18){rivalShot=Math.random()<.5?'goal':'save';rivalShotProgress=0;rivalShotStart.copy(ball.position);}
        let nearest=0;let distance=Infinity;own.forEach((p,i)=>{const d=p.position.distanceTo(carrier.position);if(d<distance){distance=d;nearest=i}});const chaser=own[nearest];if(nearest!==selected&&!rivalShot){const direction=carrier.position.clone().sub(chaser.position);direction.y=0;if(direction.length()>.1)chaser.position.add(direction.normalize().multiplyScalar(dt*3));}if(distance<1.2&&stealCooldown===0&&!rivalShot){possession='own';selected=nearest;rivalPassTarget=null;rivalPasses=0;stealCooldown=1.2;}
      }
      carrier=possession==='own'?own[selected]:rivals[rivalSelected];
      own.forEach((footballer,index)=>{const indicator=footballer.getObjectByName('ball-owner-indicator');if(indicator){indicator.visible=possession==='own'&&ownKeeperPassTarget===null&&index===selected;indicator.rotation.y+=dt*2.4;}});
      const requestedShot=shotResultRef.current;
      if(requestedShot&&!activeShot){activeShot=requestedShot;shotProgress=0;shotStart.copy(ball.position);passTarget=null;velocity.set(0,0);}
      if(activeShot&&possession==='own'){
        const styleSpeed=shotStyleRef.current==='power'?2.15:shotStyleRef.current==='finesse'?1.35:1.65;shotProgress=Math.min(1,shotProgress+dt*styleSpeed*(.7+shotPowerRef.current/250));
        const keeper=keepers[1];
        if(activeShot==='goal'){
          const flight=Math.min(1,shotProgress/.72);const netTime=Math.max(0,(shotProgress-.72)/.28);const goalTarget=new THREE.Vector3(38.4,shotStyleRef.current==='power'?1.25:2.05,shotStyleRef.current==='finesse'?-4.3:-2.4);
          ball.position.lerpVectors(shotStart,goalTarget,flight);ball.position.y+=Math.sin(flight*Math.PI)*2.25;
          if(netTime>0){ball.position.x=38.4-Math.sin(netTime*Math.PI)*.55;ball.position.y=THREE.MathUtils.lerp(1.65,.48,netTime);ball.position.z=-2.4+Math.sin(netTime*Math.PI*3)*.22*(1-netTime);}
          animateKeeperDive(keeper,Math.min(1,shotProgress*1.22),2.2,1.05);
        }else{
          const saveTarget=new THREE.Vector3(32.2,2.15,2.8);ball.position.lerpVectors(shotStart,saveTarget,shotProgress);ball.position.y+=Math.sin(shotProgress*Math.PI)*2.1;
          animateKeeperDive(keeper,Math.min(1,shotProgress*1.18),2.65,1.45);
          if(shotProgress>.82){ball.position.x-=Math.sin((shotProgress-.82)/.18*Math.PI)*1.2;ball.position.y+=.45;}
        }
        ball.rotation.z+=dt*18;
        if(!requestedShot&&shotProgress>=1){
          if(activeShot==='goal')resetKickoff('rival');
          else{
            let receiver=0;let nearestDistance=Infinity;
            rivals.forEach((teammate,index)=>{const distance=teammate.position.distanceTo(keepers[1].position);if(distance<nearestDistance){nearestDistance=distance;receiver=index;}});
            possession='rival';rivalSelected=receiver;rivalPassTarget=receiver;rivalPassStart.copy(ball.position);rivalPassProgress=0;rivalPasses=0;aiPassCooldown=1.2;activeShot=null;shotProgress=0;
          }
        }
      }else if(rivalShot&&possession==='rival'){
        rivalShotProgress=Math.min(1,rivalShotProgress+dt*1.55);const keeper=keepers[0];
        if(rivalShot==='goal'){
          const target=new THREE.Vector3(-38.35,1.35,rivalShotStart.z>=0?-2.8:2.8);ball.position.lerpVectors(rivalShotStart,target,rivalShotProgress);ball.position.y+=Math.sin(rivalShotProgress*Math.PI)*1.9;
          animateKeeperDive(keeper,Math.min(1,rivalShotProgress*1.15),target.z>0?-2.15:2.15,.9);
        }else{
          const target=new THREE.Vector3(-32.1,1.9,THREE.MathUtils.clamp(rivalShotStart.z*.35,-2.5,2.5));ball.position.lerpVectors(rivalShotStart,target,rivalShotProgress);ball.position.y+=Math.sin(rivalShotProgress*Math.PI)*1.7;
          animateKeeperDive(keeper,Math.min(1,rivalShotProgress*1.18),target.z,1.3);
        }
        ball.rotation.z-=dt*19;
        if(rivalShotProgress>=1){if(rivalShot==='goal'){onOpponentGoal();resetKickoff('own');}else{let receiver=0;let nearestDistance=Infinity;own.forEach((teammate,index)=>{const distance=teammate.position.distanceTo(keepers[0].position);if(distance<nearestDistance){nearestDistance=distance;receiver=index;}});rivalShot=null;rivalShotProgress=0;possession='own';selected=receiver;ownKeeperPassTarget=receiver;ownKeeperPassStart.copy(ball.position);ownKeeperPassProgress=0;stealCooldown=1.4;}}
      }else if(rivalPassTarget!==null&&possession==='rival'){
        rivalPassProgress=Math.min(1,rivalPassProgress+dt*(1.45+botTactic.attackSpeed*.055));const receiver=rivals[rivalPassTarget];const passEnd=new THREE.Vector3(receiver.position.x-.8,.45,receiver.position.z);ball.position.lerpVectors(rivalPassStart,passEnd,rivalPassProgress);ball.position.y=.42+Math.sin(rivalPassProgress*Math.PI)*.4;ball.rotation.z-=dt*13;
        if(rivalPassProgress>=1){rivalSelected=rivalPassTarget;rivalPassTarget=null;rivalPassProgress=0;rivalPasses+=1;aiPassCooldown=1.7+Math.random()*1.2;}
      }else if(ownKeeperPassTarget!==null&&possession==='own'){
        ownKeeperPassProgress=Math.min(1,ownKeeperPassProgress+dt*1.65);const receiver=own[ownKeeperPassTarget];const passEnd=new THREE.Vector3(receiver.position.x+.8,.45,receiver.position.z);ball.position.lerpVectors(ownKeeperPassStart,passEnd,ownKeeperPassProgress);ball.position.y=.42+Math.sin(ownKeeperPassProgress*Math.PI)*.5;ball.rotation.z+=dt*13;
        if(ownKeeperPassProgress>=1){selected=ownKeeperPassTarget;ownKeeperPassTarget=null;ownKeeperPassProgress=0;}
      }else if(passTarget!==null&&possession==='own'){
        passProgress=Math.min(1,passProgress+dt*1.8);const receiver=own[passTarget];const passEnd=new THREE.Vector3(receiver.position.x+.8,.45,receiver.position.z);ball.position.lerpVectors(passStart,passEnd,passProgress);ball.position.y=.42+Math.sin(passProgress*Math.PI)*.35;ball.rotation.z+=dt*13;
        let interceptor=-1;let interceptDistance=Infinity;rivals.forEach((defender,index)=>{const distance=defender.position.distanceTo(ball.position);if(distance<interceptDistance){interceptDistance=distance;interceptor=index;}});if(interceptor>=0&&interceptDistance<1.35){possession='rival';rivalSelected=interceptor;passTarget=null;passProgress=0;rivalPasses=0;aiPassCooldown=.45;stealCooldown=.7;}
        if(passTarget!==null&&passProgress>=1){selected=passTarget;passTarget=null;passProgress=0;}
      }else{if(kickoffPause>0)ball.position.set(0,.42,0);else ball.position.set(carrier.position.x+(possession==='own'?1:-1),.45,carrier.position.z);keepers.forEach((keeper)=>{keeper.position.y=THREE.MathUtils.lerp(keeper.position.y,0,Math.min(1,7*dt));keeper.position.z=THREE.MathUtils.lerp(keeper.position.z,0,Math.min(1,5*dt));keeper.rotation.x=THREE.MathUtils.lerp(keeper.rotation.x,0,Math.min(1,7*dt));keeper.rotation.z=THREE.MathUtils.lerp(keeper.rotation.z,0,Math.min(1,7*dt));(keeper.userData.arms as THREE.Group[]).forEach((arm)=>arm.rotation.x=THREE.MathUtils.lerp(arm.rotation.x,0,Math.min(1,7*dt)));});}
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
      fanAnimationAccumulator+=dt;if(fanAnimationAccumulator>=.065){fanAnimationAccumulator=0;const time=performance.now()*.006;fanBases.forEach((base,i)=>{const jump=Math.max(0,Math.sin(time+i*.7))*.32;fanMatrix.makeTranslation(base.x,base.y+jump,base.z);fanHeadMatrix.makeTranslation(base.x,base.y+.48+jump,base.z);fanBodies.setMatrixAt(i,fanMatrix);fanHeads.setMatrixAt(i,fanHeadMatrix)});fanBodies.instanceMatrix.needsUpdate=true;fanHeads.instanceMatrix.needsUpdate=true;}
      const followedPlayer=own[selected];scene.updateMatrixWorld(true);const followedWorld=new THREE.Vector3();
      if(passTarget!==null||ownKeeperPassTarget!==null)ball.getWorldPosition(followedWorld);else if(rivalShot==='save')keepers[0].getWorldPosition(followedWorld);else followedPlayer.getWorldPosition(followedWorld);
      const cameraFollowingBall=passTarget!==null||ownKeeperPassTarget!==null;
      const cameraOffset=new THREE.Vector3(-1.65,cameraFollowingBall?1.25:1.6,0).applyAxisAngle(new THREE.Vector3(0,1,0),cameraYaw);
      const chaseCamera=followedWorld.clone().add(cameraOffset);
      chaseCamera.x=THREE.MathUtils.clamp(chaseCamera.x,-35.5,35.5);chaseCamera.z=THREE.MathUtils.clamp(chaseCamera.z,-23,23);
      const lookOffset=new THREE.Vector3(2.15,cameraFollowingBall ? .16 : .25,0).applyAxisAngle(new THREE.Vector3(0,1,0),cameraYaw);const lookAhead=followedWorld.clone().add(lookOffset);
      if(cameraPlayer!==selected&&!cameraFollowingBall){camera.position.copy(chaseCamera);cameraPlayer=selected;}else camera.position.lerp(chaseCamera,1-Math.exp(-(cameraFollowingBall?16:12)*dt));
      camera.lookAt(lookAhead);renderer.render(scene,camera); };
    animate();
    const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)}; window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(frame);window.clearInterval(tacticTimer);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('mobile-pass',mobilePass);window.removeEventListener('mobile-switch',mobileSwitch);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('contextmenu',stopMenu);renderer.dispose();host.removeChild(renderer.domElement)};
  }, [paused, playerAccessories.join(','), playerHair, playerHeight, playerNumber, playerSkin, homeTeam, awayTeam]);
  return <div className="three-pitch" ref={mount} />;
}
