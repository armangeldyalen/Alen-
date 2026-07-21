import { Player } from '../types/game';
import { teamKitColors } from '../data/gameData';
import type { CSSProperties } from 'react';

export function PlayerAvatar({ player, large = false }: { player: Player; large?: boolean }) {
  const kitColor=teamKitColors[player.country]??0x19814b;const kitHex=`#${kitColor.toString(16).padStart(6,'0')}`;const kitText=kitColor>0xbbbbbb?'#102015':'#ffffff';
  const regional=[...player.country].filter((symbol)=>(symbol.codePointAt(0)??0)>=127462&&(symbol.codePointAt(0)??0)<=127487);
  const flagCode=player.country.startsWith('Англия')?'gb-eng':player.country.startsWith('Шотландия')?'gb-sct':regional.map((symbol)=>String.fromCharCode((symbol.codePointAt(0)??127462)-127397)).join('').toLowerCase();
  const heightScale=.9+(player.height-155)/50*.22;
  const accessories=[...new Set([...(player.accessories??[]),...(player.accessory&&player.accessory!=='none'&&player.accessory!=='wristband'?[player.accessory]:[])])];
  return (
    <div className={`avatar ${large ? 'avatar--large' : ''}`} style={{'--avatar-height-scale':heightScale} as CSSProperties}>
      <div className={`avatar__hair hair--${player.hair}`} />
      <div className={`avatar__head skin--${player.skin} eyes--${player.eyeColor ?? 'brown'}`}><span /><span /></div>
      {accessories.map((accessory)=><div className={`avatar__accessory accessory--${accessory}`} key={accessory} />)}
      <div className="avatar__shirt" style={{background:kitHex,color:kitText}}>{flagCode&&<img className="avatar__shirt-flag" src={`https://flagcdn.com/w40/${flagCode}.png`} alt="" />}<b>{player.number || ''}</b></div>
      <div className={`avatar__real-arm avatar__real-arm--left skin--${player.skin}`}><i style={{background:kitHex}} /><b /><span /></div>
      <div className={`avatar__real-arm avatar__real-arm--right skin--${player.skin}`}><i style={{background:kitHex}} /><b /><span /></div>
      <div className="avatar__legs"><i /><i /></div>
    </div>
  );
}
