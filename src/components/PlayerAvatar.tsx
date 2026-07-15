import { Player } from '../types/game';

export function PlayerAvatar({ player, large = false }: { player: Player; large?: boolean }) {
  return (
    <div className={`avatar ${large ? 'avatar--large' : ''}`}>
      <div className={`avatar__hair hair--${player.hair}`} />
      <div className={`avatar__head skin--${player.skin}`}><span /><span /></div>
      <div className="avatar__shirt"><b>{player.number}</b></div>
      <div className="avatar__legs"><i /><i /></div>
    </div>
  );
}
