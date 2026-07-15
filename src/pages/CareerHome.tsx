import { useEffect, useRef, useState } from 'react';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { makeSchedule } from '../data/gameData';
import { Career, MatchInfo } from '../types/game';

export function CareerHome({ career, onPlay, onLobby, onReset, onExit }: { career: Career; onPlay: (match: MatchInfo) => void; onLobby: () => void; onReset: () => void; onExit: () => void }) {
  const [selected, setSelected] = useState<MatchInfo | null>(null);
  const schedule = makeSchedule(Math.max(1, career.level - 2));
  const current = schedule.find((match) => match.level === career.level) ?? schedule[0];
  const currentNode = useRef<HTMLButtonElement>(null);
  const road = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const latest = career.history[career.history.length - 1];
  useEffect(() => { currentNode.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }, [career.level]);
  return <section className="career-page">
    <header className="topbar"><div className="brand"><span>⚽</span><b>ПУТЬ К ЛЕГЕНДЕ</b></div><div className="top-actions"><button className="outline" onClick={onExit}>← НАЗАД К ВХОДУ</button><button className="outline" onClick={onLobby}>1 НА 1</button><button className="icon-button" onClick={onReset}>↻</button></div></header>
    <div className="career-layout">
      <aside className="profile panel">
        <PlayerAvatar player={career.player} />
        <div><small>УРОВЕНЬ {career.level}</small><h2>{career.player.name}</h2><p>{career.club} · № {career.player.number}</p></div>
        <div className="country">{career.player.country}</div>
        <div className="stats"><div><b>{career.goals}</b><span>ГОЛЫ</span></div><div><b>{career.assists}</b><span>ПАСЫ</span></div><div><b>{career.rating.toFixed(1)}</b><span>ОЦЕНКА</span></div></div>
        <div className="scout"><span>👁</span><div><b>Скауты наблюдают</b><p>{career.rating >= 7.5 ? 'Большой клуб готовит предложение' : 'Играй ярко, чтобы получить контракт'}</p></div></div>
      </aside>
      <div className="season">
        <div className="season-title"><div><small>СЕЗОН {career.season}</small><h1>Карта карьеры</h1></div><span>{career.history.length} матчей сыграно</span></div>
        {latest && <div className={`notice ${latest.won ? 'win' : 'loss'}`}>Последний матч: {latest.won ? 'Победа' : 'Поражение'} {latest.playerGoals}:{latest.opponentGoals} · уровень сохранён</div>}
        <div className="level-road" ref={road} onWheel={(event) => {
          if (!road.current) return;
          road.current.scrollLeft += event.deltaY;
        }} onPointerDown={(event) => {
          if (!road.current) return;
          const target = event.target as HTMLElement;
          if (target.closest('.level-node.current')) return;
          drag.current = { active: true, startX: event.clientX, scrollLeft: road.current.scrollLeft };
          road.current.setPointerCapture(event.pointerId);
          road.current.classList.add('dragging');
        }} onPointerMove={(event) => {
          if (!road.current || !drag.current.active) return;
          road.current.scrollLeft = drag.current.scrollLeft - (event.clientX - drag.current.startX);
        }} onPointerUp={(event) => {
          drag.current.active = false;
          road.current?.releasePointerCapture(event.pointerId);
          road.current?.classList.remove('dragging');
        }}>
          {schedule.map((match) => {
            const completed = match.level < career.level;
            const active = match.level === career.level;
            const result = career.history.find((item) => item.level === match.level);
            return <button ref={active ? currentNode : undefined} key={match.level} className={`level-node ${active ? 'current' : completed ? 'completed' : 'locked'} ${match.kind}`} onClick={() => active && setSelected(match)} disabled={!active && !completed} title={completed ? 'Пройденный матч' : undefined}>
              <span className="node-number">{match.level}</span><span className="node-badge">{active || completed ? match.badge : '🔒'}</span><b>{active ? match.opponent : completed ? `Пройдено ${result?.playerGoals ?? 0}:${result?.opponentGoals ?? 0}` : 'Пройди предыдущий уровень'}</b><small>{active || completed ? match.tournament : 'ЧТОБЫ ОТКРЫТЬ ЭТОТ МАТЧ'}</small>{active && <em>СЛЕДУЮЩИЙ МАТЧ</em>}
            </button>;
          })}
        </div>
      </div>
    </div>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="match-card panel" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><small>УРОВЕНЬ {selected.level} · {selected.tournament}</small><div className="versus"><div><span>КУ</span><b>{career.club}</b></div><strong>VS</strong><div><span>{selected.badge}</span><b>{selected.opponent}</b></div></div><div className="power"><span>Сила соперника</span><b>{selected.power}</b></div><p>У тебя будет 2–3 голевых момента. Результат нельзя переиграть.</p><button className="primary" disabled={selected.level !== current.level} onClick={() => onPlay(selected)}>{selected.level === current.level ? 'ВЫЙТИ НА ПОЛЕ' : 'МАТЧ ЕЩЁ ЗАКРЫТ'}</button></div></div>}
  </section>;
}
