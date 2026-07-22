import { useEffect, useRef, useState } from 'react';
import { Career, MatchInfo } from '../types/game';
import { ThreePitch } from '../components/ThreePitch';
import { MobileControls } from '../components/MobileControls';

const teammates = [[22,18],[22,39],[22,62],[22,83],[38,25],[38,50],[38,75],[46,30],[46,70]];
const opponents = [[78,18],[78,39],[78,62],[78,83],[62,25],[62,50],[62,75],[54,20],[54,50],[54,80]];
const startingTeam = () => [...teammates.map(([x,y]) => ({ x, y: y * 3.5 })), { x: 48, y: 165 }];
const startingOpponents = () => opponents.map(([x,y]) => ({ x, y }));
const cleanTeamName=(team:string)=>[...team].filter((symbol)=>{const code=symbol.codePointAt(0)??0;return code<127462||code>127487;}).join('').trim();
const teamFlagUrl=(team:string)=>{if(team.startsWith('Англия'))return'https://flagcdn.com/w40/gb-eng.png';if(team.startsWith('Шотландия'))return'https://flagcdn.com/w40/gb-sct.png';const regional=[...team].filter((symbol)=>(symbol.codePointAt(0)??0)>=127462&&(symbol.codePointAt(0)??0)<=127487);const code=regional.map((symbol)=>String.fromCharCode((symbol.codePointAt(0)??127462)-127397)).join('').toLowerCase();return code?`https://flagcdn.com/w40/${code}.png`:'';};
const SHOP_KEY='world-cup-shop';

export function MatchScreen({ career, match, onFinish }: { career: Career; match: MatchInfo; onFinish: (career: Career) => void }) {
  const phoneMode=localStorage.getItem('football-device')==='phone';
  const [botGoals, setBotGoals] = useState(0);
  const [goals, setGoals] = useState(0);
  const [message, setMessage] = useState('Выбери направление и силу удара');
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [celebrating, setCelebrating] = useState(false);
  const [shotResult, setShotResult] = useState<'goal' | 'save' | null>(null);
  const [shotPower,setShotPower]=useState(0);const [chargingShot,setChargingShot]=useState(false);const shotStyle='normal' as const;
  const [paused, setPaused] = useState(true);
  const [preMatch, setPreMatch] = useState(true);
  const playerFieldX=useRef(-7);
  const [resolving, setResolving] = useState(false);
  const [teamPositions, setTeamPositions] = useState(startingTeam);
  const [opponentPositions, setOpponentPositions] = useState(startingOpponents);
  const [controlledPlayer, setControlledPlayer] = useState(9);
  const type = 'Атака с игры';

  useEffect(()=>{const timer=window.setTimeout(()=>{setPreMatch(false);setPaused(false);},6200);return()=>window.clearTimeout(timer);},[]);

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

  const shoot = (power = 50) => {
    if (resolving) return;
    void power;
    const x=playerFieldX.current;
    const scoringChance=x>=0 ? .5 : .2;
    const scored = Math.random() < scoringChance;
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

  useEffect(()=>{const rememberPosition=(event:Event)=>{playerFieldX.current=(event as CustomEvent<{x:number}>).detail.x;};window.addEventListener('football-player-position',rememberPosition);return()=>window.removeEventListener('football-player-position',rememberPosition);},[]);

  useEffect(() => {
    if(!chargingShot)return;const timer=window.setInterval(()=>setShotPower((value)=>Math.min(100,value+3)),35);return()=>window.clearInterval(timer);
  },[chargingShot]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const pressed = event.code === 'KeyW' ? 'w' : event.code === 'KeyA' ? 'a' : event.code === 'KeyS' ? 's' : event.code === 'KeyD' ? 'd' : event.code === 'Space' ? ' ' : event.key.toLowerCase();
      const key = pressed === 'z' || pressed === 'arrowup' ? 'w' : pressed === 'arrowleft' ? 'a' : pressed === 'arrowdown' ? 's' : pressed === 'arrowright' ? 'd' : pressed;
      if (['w', 'a', 's', 'd', 'q', ' '].includes(key)) event.preventDefault();
      if (paused && !preMatch && key === ' ') { setPaused(false); return; }
      if (paused || preMatch) return;
      if (['w', 'a', 's', 'd'].includes(key)) setTeamPositions((positions) => positions.map((pos, index) => index !== controlledPlayer ? pos : {
        x: Math.max(5, Math.min(90, pos.x + (key === 'a' ? -1.5 : key === 'd' ? 1.5 : 0))),
        y: Math.max(8, Math.min(310, pos.y + (key === 'w' ? 3 : key === 's' ? -3 : 0))),
      }));
      if (event.repeat || finished) return;
      if(key===' '){setShotPower(0);setChargingShot(true);}
    };
    const onKeyUp=(event:KeyboardEvent)=>{if(event.code==='Space'&&chargingShot){setChargingShot(false);shoot(Math.max(10,shotPower));}};
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',onKeyUp);
    return () => {window.removeEventListener('keydown', onKeyDown);window.removeEventListener('keyup',onKeyUp);};
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
    if (finished || paused || preMatch) return;
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
  }, [finished, paused, preMatch]);

  const matchTime = `${String(Math.min(90, 90-timeLeft)).padStart(2, '0')}:00`;

  const quitMatch = () => {
    if (!confirm('Выйти из матча? Будет засчитано поражение.')) return;
    const opponentGoals = Math.min(4, Math.max(botGoals, goals + 1));
    onFinish({ ...career, level: career.level + 1, rating: 5, history: [...career.history, { ...match, playerGoals: goals, opponentGoals, won: false }], season: career.level % 8 === 0 ? career.season + 1 : career.season });
  };

  const finish = () => {
    const won = goals > botGoals;
    if(won){try{const shop=JSON.parse(localStorage.getItem(SHOP_KEY)??'null') as {balance?:number;lastReward?:number;owned?:string[]}|null;localStorage.setItem(SHOP_KEY,JSON.stringify({balance:(shop?.balance??100)+50,lastReward:shop?.lastReward??Date.now(),owned:shop?.owned??[]}));}catch{localStorage.setItem(SHOP_KEY,JSON.stringify({balance:150,lastReward:Date.now(),owned:[]}));}}
    const rating = Math.min(10, 6.1 + goals * 1.15 + (won ? .4 : 0));
    onFinish({ ...career, level: career.level + 1, goals: career.goals + goals, rating, history: [...career.history, { ...match, playerGoals: goals, opponentGoals: botGoals, won }], trophies: match.kind === 'cup' && won ? [...career.trophies, 'Кубковая победа'] : career.trophies, season: career.level % 8 === 0 ? career.season + 1 : career.season });
  };

  return <section className="match-screen">
    <header className="scoreboard"><div><small className="scoreboard-team"><img src={teamFlagUrl(career.player.country)} alt=""/><span>{cleanTeamName(career.club)}</span></small><b>{goals}</b></div><span>{matchTime}<br /><em>{match.tournament}</em></span><div><b>{botGoals}</b><small className="scoreboard-team"><img src={teamFlagUrl(match.opponent)} alt=""/><span>{cleanTeamName(match.opponent)}</span></small></div></header>
    <div className="pitch pitch--3d">
      <ThreePitch paused={paused} playerNumber={career.player.number} playerSkin={career.player.skin} playerHair={career.player.hair} playerHeight={career.player.height} playerAccessories={[...(career.player.accessories??[]),...(career.player.accessory&&career.player.accessory!=='none'?[career.player.accessory]:[])]} homeGoals={goals} awayGoals={botGoals} matchMinute={Math.min(90,90-timeLeft)} botStrength={match.power} shotResult={shotResult} shotPower={shotPower} shotStyle={shotStyle} homeTeam={career.player.country} awayTeam={match.opponent} onOpponentGoal={() => setBotGoals((value) => Math.min(4, value + 1))} />
      <div className="pause-menu">{!paused && <button onClick={() => setPaused(true)}>Ⅱ Пауза</button>}<button onClick={quitMatch}>↩ Выйти</button></div>
      {preMatch&&<div className="prematch-intro"><div className="prematch-title"><b>КОМАНДЫ ВЫХОДЯТ НА ПОЛЕ</b><span>{cleanTeamName(career.player.country)} — {cleanTeamName(match.opponent)}</span></div><div className="prematch-teams"><div className="prematch-lineup home">{[3,4,career.player.number,1].map((number,index)=><i className={number===1?'prematch-keeper':''} key={`home-${index}`}><em>{number}</em></i>)}</div><i className="prematch-referee"><em>СУДЬЯ</em></i><div className="prematch-lineup away">{[3,4,9,1].map((number,index)=><i className={number===1?'prematch-keeper':''} key={`away-${index}`}><em>{number}</em></i>)}</div></div><div className="prematch-photo">📸 КОМАНДНОЕ ФОТО</div></div>}
      <div className="crowd">{Array.from({ length: 110 }, (_, i) => <i key={i} />)}</div>
      {['left','right','bottom'].map((side) => <div className={`stadium-stand stand--${side}`} key={side}>{Array.from({ length: side === 'bottom' ? 110 : 65 }, (_, index) => <i key={index} />)}</div>)}
      {!phoneMode&&<div className="keyboard-guide"><b>УПРАВЛЕНИЕ</b><span><kbd>SHIFT</kbd> сменить игрока</span><span><kbd>Q</kbd> пас</span><span><kbd>ПРОБЕЛ</kbd> обычный удар</span><span><kbd>2</kbd> дриблинг влево</span><span><kbd>3</kbd> дриблинг вправо</span><span><kbd>E</kbd> подкат</span></div>}
      {phoneMode&&<MobileControls />}
      <div className={`shot-meter ${chargingShot?'charging':''}`}><div><span style={{width:`${shotPower}%`}} /></div><b>{shotPower}%</b><em>ОБЫЧНЫЙ · ПРОБЕЛ</em></div>
      {!finished && <div className="moment-status"><b>МАТЧ ИДЁТ</b><span>{message}</span></div>}
      <div className="center-circle" />
      {teamPositions.map((position, index) => <div className={`field-player teammate ${controlledPlayer === index ? 'controlled' : ''}`} style={{ left: `${position.x}%`, bottom: `${position.y}px` }} key={`t${index}`}>{index === 9 ? career.player.number : index + 2}</div>)}
      {opponentPositions.map((position, index) => <div className="field-player opponent" style={{ left: `${position.x}%`, top: `${position.y}%` }} key={`o${index}`}>{index + 2}</div>)}
      <div className="side-goal side-goal--left"><div className="field-player teammate goal-keeper home-keeper">G</div></div>
      <div className="side-goal side-goal--right"><div className={`field-player opponent goal-keeper ${shotResult ? `keeper--dive-${shotResult}` : ''}`}>G</div></div>
      <div aria-label="Мяч TRIONDA" className={`ball ball--possessed ${shotResult ? `ball--shot-${shotResult}` : ''}`} style={{ left: `${Math.min(97, teamPositions[controlledPlayer].x + 2)}%`, bottom: `${teamPositions[controlledPlayer].y - 8}px` }} />
      {celebrating && <div className="celebration-player"><strong>{career.player.number}</strong><b>ГОООЛ!</b><span>{career.player.celebration}</span></div>}
      {paused && <div className="pause-overlay" onPointerDown={()=>{if(phoneMode)setPaused(false);}}><b>ПАУЗА</b><span>{phoneMode?'Нажми на экран, чтобы продолжить':'Нажми ПРОБЕЛ, чтобы продолжить'}</span></div>}
    </div>
    {finished && <div className="match-controls panel"><div className="final-result"><small>МАТЧ ОКОНЧЕН</small><h1>{goals}:{botGoals}</h1><h2>{goals > botGoals ? 'ПОБЕДА!' : goals === botGoals ? 'НИЧЬЯ' : 'ПОРАЖЕНИЕ'}</h2><p>{goals > botGoals ? 'Болельщики празднуют победу сборной!' : career.level===7 ? 'Впереди матч за третье место.' : 'Ты выбыл из Кубка мира. Можно начать новый турнир.'}</p><button className="primary" onClick={finish}>{goals>botGoals?'СЛЕДУЮЩИЙ МАТЧ':career.level===7?'ИГРАТЬ ЗА 3-Е МЕСТО':'НАЧАТЬ НОВЫЙ ТУРНИР'}</button></div></div>}
  </section>;
}
