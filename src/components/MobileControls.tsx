import { PointerEvent, useRef, useState } from 'react';

const sendKey=(code:string,type:'keydown'|'keyup')=>window.dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));

export function MobileControls(){
  const pad=useRef<HTMLDivElement>(null);const activeKeys=useRef(new Set<string>());const [stick,setStick]=useState({x:0,y:0});
  const releaseKeys=()=>{activeKeys.current.forEach((code)=>sendKey(code,'keyup'));activeKeys.current.clear();setStick({x:0,y:0});};
  const move=(event:PointerEvent<HTMLDivElement>)=>{const bounds=pad.current!.getBoundingClientRect();let x=event.clientX-(bounds.left+bounds.width/2);let y=event.clientY-(bounds.top+bounds.height/2);const distance=Math.hypot(x,y);const limit=bounds.width*.32;if(distance>limit){x=x/distance*limit;y=y/distance*limit;}setStick({x,y});const next=new Set<string>();if(y<-10)next.add('KeyW');if(y>10)next.add('KeyS');if(x<-10)next.add('KeyA');if(x>10)next.add('KeyD');activeKeys.current.forEach((code)=>{if(!next.has(code))sendKey(code,'keyup');});next.forEach((code)=>{if(!activeKeys.current.has(code))sendKey(code,'keydown');});activeKeys.current=next;};
  const action=(code:string)=>(event:PointerEvent<HTMLButtonElement>)=>{event.preventDefault();sendKey(code,'keydown');event.currentTarget.setPointerCapture(event.pointerId);};
  const release=(code:string)=>(event:PointerEvent<HTMLButtonElement>)=>{event.preventDefault();sendKey(code,'keyup');};
  return <div className="mobile-controls">
    <div className="mobile-joystick" ref={pad} onPointerDown={(event)=>{event.currentTarget.setPointerCapture(event.pointerId);move(event);}} onPointerMove={(event)=>{if(event.currentTarget.hasPointerCapture(event.pointerId))move(event);}} onPointerUp={releaseKeys} onPointerCancel={releaseKeys}><i style={{transform:`translate(${stick.x}px,${stick.y}px)`}} /></div>
    <div className="mobile-actions">
      <button className="mobile-switch" onPointerDown={(event)=>{event.preventDefault();window.dispatchEvent(new Event('mobile-switch'));}}>СМЕНА</button>
      <button className="mobile-pass" onPointerDown={(event)=>{event.preventDefault();window.dispatchEvent(new Event('mobile-pass'));}}>ПАС</button>
      <button className="mobile-tackle" onPointerDown={action('KeyE')} onPointerUp={release('KeyE')}>ПОДКАТ</button>
      <button className="mobile-finesse" onPointerDown={action('KeyF')} onPointerUp={release('KeyF')} onPointerCancel={release('KeyF')}>КРУЧ.</button>
      <button className="mobile-shoot" onPointerDown={action('Space')} onPointerUp={release('Space')} onPointerCancel={release('Space')}>УДАР</button>
    </div>
  </div>;
}
