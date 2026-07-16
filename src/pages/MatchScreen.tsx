import { useEffect, useState } from 'react';
import { opponentScore } from '../lib/matchEngine';
import { Career, MatchInfo } from '../types/game';
import { ThreePitch } from '../components/ThreePitch';

const teammates = [[22,18],[22,39],[22,62],[22,83],[38,25],[38,50],[38,75],[46,30],[46,70]];
const opponents = [[78,18],[78,39],[78,62],[78,83],[62,25],[62,50],[62,75],[54,20],[54,50],[54,80]];
const startingTeam = () => [...teammates.map(([x,y]) => ({ x, y: y * 3.5 })), { x: 48, y: 165 }];
const startingOpponents = () => opponents.map(([x,y]) => ({ x, y }));

export function MatchScreen({ career, match, onFinish }: { career: Career; match: MatchInfo; onFinish: (career: Career) => void }) {
  const [botGoals, setBotGoals] = useState(() => opponentScore(match));
  const [goals, setGoals] = useState(0);
  const [message, setMessage] = useState('Выбери направление и силу удара');
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [celebrating, setCelebrating] = useState(false);
  const [shotResult, setShotResult] = useState<'goal' | 'save' | null>(null);
  const [paused, setPaused] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [teamPositions, setTeamPositions] = useState(startingTeam);
  const [opponentPositions, setOpponentPositions] = useState(startingOpponents);
  const [controlledPlayer, setControlledPlayer] = useState(9);
  const type = 'Атака с игры';

  useEffect(() => {
    setResolving(false);
    setMessage(type === 'Атака с игры' ? 'Разыграй атаку вместе с командой' : 'Выбери направление и силу удара');
  }, [type]);

  const completeChance = (scored: boolean, text: string) => {
    setResolving(true);
    if (scored) setGoals((value) => value + 1);
    setMessage(text);
    window.setTimeout(() => {
      setResolving(false);
      setMessage('Матч продолжается');
    }, 900);
  };

  const playAttack = (action: 'pass' | 'dribble') => {
    if (resolving) return;
    const success = Math.random() < (action === 'pass' ? .9 : .75) - match.power / 60;
    if (success) {
      if (action === 'pass') setControlledPlayer((value) => (value + 1) % teamPositions.length);
      setMessage(action === 'pass' ? 'Точный пас партнёру и обратная передача!' : 'Защитник обыгран! Можно бить!');
    } else completeChance(false, action === 'pass' ? 'Защитник перехватил передачу.' : 'Защитник отобрал мяч.');
  };

  const shoot = () => {
    if (resolving) return;
    const shotDifficulty = Math.random();
    const saveChance = Math.max(.22, Math.min(.86, .8 - shotDifficulty * .58 + match.power * .018));
    const scored = Math.random() > saveChance;
    setResolving(true);
    setShotResult(scored ? 'goal' : 'save');
    window.setTimeout(() => {
      setShotResult(null);
      if (scored) {
        setTeamPositions(startingTeam());
        setOpponentPositions(startingOpponents());
        setControlledPlayer(9);
        setCelebrating(true);
        window.setTimeout(() => setCelebrating(false), 1800);
      }
      completeChance(scored, scored ? `ГОООЛ! ${career.player.celebration}!` : 'Вратарь спасает! Момент упущен.');
    }, 650);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const pressed = event.code === 'KeyW' ? 'w' : event.code === 'KeyA' ? 'a' : event.code === 'KeyS' ? 's' : event.code === 'KeyD' ? 'd' : event.code === 'KeyF' ? 'f' : event.code === 'Space' ? ' ' : event.key.toLowerCase();
      const key = pressed === 'z' || pressed === 'arrowup' ? 'w' : pressed === 'arrowleft' ? 'a' : pressed === 'arrowdown' ? 's' : pressed === 'arrowright' ? 'd' : pressed;
      if (['w', 'a', 's', 'd', 'f', ' '].includes(key)) event.preventDefault();
      if (paused && key === ' ') { setPaused(false); return; }
      if (paused) return;
      if (['w', 'a', 's', 'd'].includes(key)) setTeamPositions((positions) => positions.map((pos, index) => index !== controlledPlayer ? pos : {
        x: Math.max(5, Math.min(90, pos.x + (key === 'a' ? -1.5 : key === 'd' ? 1.5 : 0))),
        y: Math.max(8, Math.min(310, pos.y + (key === 'w' ? 3 : key === 's' ? -3 : 0))),
      }));
      if (event.repeat || finished) return;
      if (key === ' ') playAttack('pass');
      if (key === 'f') shoot();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (finished || resolving || paused) return;
      const carrier = teamPositions[controlledPlayer];
      const carrierY = 100 - carrier.y / 4.4;
      setOpponentPositions((positions) => {
        let nearest = 0;
        let nearestDistance = Infinity;
        positions.forEach((defender, index) => {
          const distance = Math.hypot(defender.x - carrier.x, defender.y - carrierY);
          if (distance < nearestDistance) { nearest = index; nearestDistance = distance; }
        });
        const speed = .18 + match.power * .06;
        const next = positions.map((defender, index) => index !== nearest ? defender : {
          x: defender.x + Math.sign(carrier.x - defender.x) * Math.min(speed, Math.abs(carrier.x - defender.x)),
          y: defender.y + Math.sign(carrierY - defender.y) * Math.min(speed, Math.abs(carrierY - defender.y)),
        });
        if (nearestDistance < 5 && Math.random() < .025 + match.power * .018) {
          completeChance(false, `Защитник уровня ${match.power} отобрал мяч!`);
        }
        return next;
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, [controlledPlayer, finished, match.power, paused, resolving, teamPositions]);

  useEffect(() => {
    if (finished || paused) return;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setFinished(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [finished, paused]);

  const matchTime = `${String(Math.min(90, Math.floor((60 - timeLeft) * 1.5))).padStart(2, '0')}:00`;

  const quitMatch = () => {
    if (!confirm('Выйти из матча? Будет засчитано поражение.')) return;
    const opponentGoals = Math.min(4, Math.max(botGoals, goals + 1));
    onFinish({ ...career, level: career.level + 1, rating: 5, history: [...career.history, { ...match, playerGoals: goals, opponentGoals, won: false }], season: career.level % 8 === 0 ? career.season + 1 : career.season });
  };

  const finish = () => {
    const won = goals > botGoals;
    const rating = Math.min(10, 6.1 + goals * 1.15 + (won ? .4 : 0));
    onFinish({ ...career, level: career.level + 1, goals: career.goals + goals, rating, history: [...career.history, { ...match, playerGoals: goals, opponentGoals: botGoals, won }], trophies: match.kind === 'cup' && won ? [...career.trophies, 'Кубковая победа'] : career.trophies, season: career.level % 8 === 0 ? career.season + 1 : career.season });
  };

  return <section className="match-screen">
    <header className="scoreboard"><div><small>{career.club}</small><b>{goals}</b></div><span>{matchTime}<br /><em>{match.tournament}</em></span><div><b>{botGoals}</b><small>{match.opponent}</small></div></header>
    <div className="pitch pitch--3d">
      <ThreePitch paused={paused} playerNumber={career.player.number} playerSkin={career.player.skin} playerHair={career.player.hair} shotResult={shotResult} onOpponentGoal={() => setBotGoals((value) => Math.min(4, value + 1))} />
      <div className="pause-menu">{!paused && <button onClick={() => setPaused(true)}>Ⅱ Пауза</button>}<button onClick={quitMatch}>↩ Выйти</button></div>
      <div className="crowd">{Array.from({ length: 110 }, (_, i) => <i key={i} />)}</div>
      {['left','right','bottom'].map((side) => <div className={`stadium-stand stand--${side}`} key={side}>{Array.from({ length: side === 'bottom' ? 110 : 65 }, (_, index) => <i key={index} />)}</div>)}
      <div className="keyboard-guide"><b>УПРАВЛЕНИЕ</b><span><kbd>W</kbd> вперёд</span><span><kbd>A</kbd> влево</span><span><kbd>S</kbd> назад</span><span><kbd>D</kbd> вправо</span><span><kbd>ЛКМ</kbd> точный пас</span><span><kbd>ПРОБЕЛ</kbd> быстрый пас</span><span><kbd>F</kbd> удар</span><span><kbd>E</kbd> подкат</span></div>
      {!finished && <div className="moment-status"><b>МАТЧ ИДЁТ</b><span>{message}</span></div>}
      <div className="center-circle" />
      {teamPositions.map((position, index) => <div className={`field-player teammate ${controlledPlayer === index ? 'controlled' : ''}`} style={{ left: `${position.x}%`, bottom: `${position.y}px` }} key={`t${index}`}>{index === 9 ? career.player.number : index + 2}</div>)}
      {opponentPositions.map((position, index) => <div className="field-player opponent" style={{ left: `${position.x}%`, top: `${position.y}%` }} key={`o${index}`}>{index + 2}</div>)}
      <div className="side-goal side-goal--left"><div className="field-player teammate goal-keeper home-keeper">G</div></div>
      <div className="side-goal side-goal--right"><div className={`field-player opponent goal-keeper ${shotResult ? `keeper--dive-${shotResult}` : ''}`}>G</div></div>
      <div aria-label="Мяч TRIONDA" className={`ball ball--possessed ${shotResult ? `ball--shot-${shotResult}` : ''}`} style={{ left: `${Math.min(97, teamPositions[controlledPlayer].x + 2)}%`, bottom: `${teamPositions[controlledPlayer].y - 8}px` }} />
      {celebrating && <div className="celebration-player"><strong>{career.player.number}</strong><b>ГОООЛ!</b><span>{career.player.celebration}</span></div>}
      {paused && <div className="pause-overlay"><b>ПАУЗА</b><span>Нажми ПРОБЕЛ, чтобы продолжить</span></div>}
    </div>
    {finished && <div className="match-controls panel"><div className="final-result"><small>МАТЧ ОКОНЧЕН</small><h1>{goals}:{botGoals}</h1><h2>{goals > botGoals ? 'ПОБЕДА!' : goals === botGoals ? 'НИЧЬЯ' : 'ПОРАЖЕНИЕ'}</h2><p>{goals > botGoals ? 'Болельщики празднуют победу сборной!' : 'Результат сохранён. Возвращаться назад нельзя.'}</p><button className="primary" onClick={finish}>ПРОДОЛЖИТЬ ТУРНИР</button></div></div>}
  </section>;
}
