import { useEffect, useState } from 'react';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { makeGroups, makeSchedule, teamStrength } from '../data/gameData';
import { Career, MatchInfo } from '../types/game';

type TeamStanding = { played: number; points: number; goalsFor: number; goalsAgainst: number };
type ShopState = { balance: number; lastReward: number; owned: string[] };
const SHOP_KEY='world-cup-shop';
const REWARD_INTERVAL=30*60*1000;
const loadShop=():ShopState=>{try{const saved=JSON.parse(localStorage.getItem(SHOP_KEY)??'null') as ShopState|null;const now=Date.now();if(!saved)return{balance:100,lastReward:now,owned:[]};const rewards=Math.floor((now-saved.lastReward)/REWARD_INTERVAL);return{...saved,balance:saved.balance+rewards*100,lastReward:saved.lastReward+rewards*REWARD_INTERVAL};}catch{return{balance:100,lastReward:Date.now(),owned:[]};}};

function calculateStandings(groups: string[][], career: Career) {
  const table = new Map<string, TeamStanding>();
  groups.flat().forEach((team) => table.set(team, { played: 0, points: 0, goalsFor: 0, goalsAgainst: 0 }));
  const pairings = [[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
  const completedRounds = Math.min(3, career.history.filter((result) => result.level <= 3).length);
  const addResult = (home: string, away: string, homeGoals: number, awayGoals: number) => {
    const homeStats = table.get(home)!; const awayStats = table.get(away)!;
    homeStats.played += 1; awayStats.played += 1; homeStats.goalsFor += homeGoals; homeStats.goalsAgainst += awayGoals; awayStats.goalsFor += awayGoals; awayStats.goalsAgainst += homeGoals;
    if (homeGoals > awayGoals) homeStats.points += 3; else if (awayGoals > homeGoals) awayStats.points += 3; else { homeStats.points += 1; awayStats.points += 1; }
  };
  const playBotMatch=(home:string,away:string,round:number)=>{
    const homeStrength=teamStrength[home]??5;const awayStrength=teamStrength[away]??5;
    const seed=Array.from(home+away+round).reduce((sum,letter)=>sum+letter.charCodeAt(0),0);
    const homeWins=homeStrength===awayStrength?seed%2===0:homeStrength>awayStrength;
    const difference=Math.abs(homeStrength-awayStrength);const winnerGoals=Math.min(4,1+Math.ceil(difference/2)+(seed%2));const loserGoals=difference<=1?Math.max(0,winnerGoals-1):seed%Math.max(1,winnerGoals-1);
    addResult(home,away,homeWins?winnerGoals:loserGoals,homeWins?loserGoals:winnerGoals);
  };
  for(let round=0;round<completedRounds;round+=1){
    groups.forEach((group)=>{
      if(group.includes(career.player.country)){
        const opponents=group.filter((team)=>team!==career.player.country);const result=career.history.find((match)=>match.level===round+1);
        if(result)addResult(career.player.country,opponents[round],result.playerGoals,result.opponentGoals);
        const bots=group.filter((team)=>team!==career.player.country&&team!==opponents[round]);
        playBotMatch(bots[0],bots[1],round);
      }else{
        pairings[round].forEach(([homeIndex,awayIndex])=>playBotMatch(group[homeIndex],group[awayIndex],round));
      }
    });
  }
  return table;
}

type BracketMatch = { teams: [string, string]; winner: string | null };
const teamFlagUrl=(team:string)=>{if(team.startsWith('Англия'))return'https://flagcdn.com/w40/gb-eng.png';if(team.startsWith('Шотландия'))return'https://flagcdn.com/w40/gb-sct.png';const flag=team.split(' ').slice(-1)[0];const code=[...flag].map((symbol)=>String.fromCharCode((symbol.codePointAt(0)??127462)-127397)).join('').toLowerCase();return code.length===2?`https://flagcdn.com/w40/${code}.png`:'';};

function createBracket(groups: string[][], _standings: Map<string, TeamStanding>, career: Career) {
  const qualified = groups.flat().sort((a,b)=>(teamStrength[b]??5)-(teamStrength[a]??5)).slice(0,32);
  const automaticTeams=[...new Set(['Казахстан 🇰🇿',career.player.country])];
  automaticTeams.forEach((team)=>{if(!qualified.includes(team)){let replaceIndex=qualified.length-1;while(replaceIndex>0&&automaticTeams.includes(qualified[replaceIndex]))replaceIndex-=1;qualified[replaceIndex]=team;}});
  const seeded=qualified.slice(0,16);const lowerSeeds=qualified.slice(16).reverse();const leftHalf:string[]=[];const rightHalf:string[]=[];
  seeded.forEach((team,index)=>{const half=index%2===0?leftHalf:rightHalf;half.push(team,lowerSeeds[index]);});
  const rounds: BracketMatch[][]=[];let teams=[...leftHalf,...rightHalf];
  for(let round=0;round<5;round+=1){
    const completedResult=career.history.find((result)=>result.level===round+4);const stageCompleted=Boolean(completedResult);
    const matches:BracketMatch[]=[];
    for(let index=0;index<teams.length;index+=2){
      const first=teams[index]??'—';const second=teams[index+1]??'—';let winner:string|null=null;
      if(stageCompleted){
        if(first===career.player.country||second===career.player.country){winner=completedResult!.won?career.player.country:(first===career.player.country?second:first);}
        else winner=(teamStrength[first]??5)>=(teamStrength[second]??5)?first:second;
      }
      matches.push({teams:[first,second],winner});
    }
    rounds.push(matches);teams=matches.map((match)=>match.winner??'');
  }
  return rounds;
}

export function CareerHome({ career, onPlay, onEditPlayer, onReset, onExit, onUpdateCareer }: { career: Career; onPlay: (match: MatchInfo) => void; onEditPlayer: () => void; onReset: () => void; onExit: () => void; onUpdateCareer: (career: Career) => void }) {
  const [selected, setSelected] = useState<MatchInfo | null>(null);
  const [shopOpen,setShopOpen]=useState(false);const [shop,setShop]=useState<ShopState>(loadShop);
  const [now,setNow]=useState(Date.now());
  const schedule = makeSchedule(1, career.player.country);
  const groups = makeGroups(career.player.country);
  const standings = calculateStandings(groups, career);
  const bracket=createBracket(groups,standings,career);
  const latest = career.history[career.history.length - 1];
  const semifinalLoss=career.history.some((result)=>result.level===7&&!result.won);
  const baseCurrent = schedule.find((match) => match.level === career.level) ?? null;
  const bracketRound=career.level>=4?bracket[career.level-4]:null;
  const playerFixture=bracketRound?.find((match)=>match.teams.includes(career.player.country));
  const bracketOpponent=playerFixture?.teams.find((team)=>team!==career.player.country);
  const otherSemifinal=bracket[3]?.find((fixture)=>!fixture.teams.includes(career.player.country));
  const thirdPlaceOpponent=otherSemifinal?.teams.find((team)=>team!==otherSemifinal.winner);
  const thirdPlaceMatch=career.level===8&&semifinalLoss&&thirdPlaceOpponent?{level:8,opponent:thirdPlaceOpponent,badge:thirdPlaceOpponent.split(' ').slice(-1)[0],power:teamStrength[thirdPlaceOpponent]??5,tournament:'Кубок мира 2026 · Матч за 3-е место',kind:'cup' as const}:null;
  const current = thirdPlaceMatch??(baseCurrent&&career.level<4?baseCurrent:baseCurrent&&bracketOpponent&&bracketOpponent!=='Победитель'?{...baseCurrent,opponent:bracketOpponent,badge:bracketOpponent.split(' ').slice(-1)[0],power:teamStrength[bracketOpponent]??5}:null);
  const simulatedScorerGoals=(name:string)=>career.history.reduce((total,_match,index)=>{const seed=Array.from(name+index).reduce((sum,letter)=>sum+letter.charCodeAt(0),0);return total+seed%4;},0);
  const playerFlag=career.player.country.split(' ').slice(-1)[0];
  const topScorers=[...([{name:'Лионель Месси',team:'🇦🇷'},{name:'Килиан Мбаппе',team:'🇫🇷'},{name:'Харри Кейн',team:'🏴'}].map((scorer)=>({...scorer,goals:simulatedScorerGoals(scorer.name),isPlayer:false}))),{name:career.player.name,team:playerFlag,goals:career.goals,isPlayer:true}].sort((a,b)=>b.goals-a.goals||Number(b.isPlayer)-Number(a.isPlayer)).slice(0,3);
  useEffect(()=>{localStorage.setItem(SHOP_KEY,JSON.stringify(shop));},[shop]);
  useEffect(()=>{const timer=window.setInterval(()=>{setNow(Date.now());setShop((value)=>{const rewards=Math.floor((Date.now()-value.lastReward)/REWARD_INTERVAL);return rewards>0?{...value,balance:value.balance+rewards*100,lastReward:value.lastReward+rewards*REWARD_INTERVAL}:value;});},1000);return()=>window.clearInterval(timer);},[]);
  const rewardSeconds=Math.max(0,Math.ceil((shop.lastReward+REWARD_INTERVAL-now)/1000));const rewardTimer=`${String(Math.floor(rewardSeconds/3600)).padStart(2,'0')}:${String(Math.floor((rewardSeconds%3600)/60)).padStart(2,'0')}:${String(rewardSeconds%60).padStart(2,'0')}`;
  const buy=(id:string,price:number,change:Partial<Career['player']>)=>{if(shop.balance<price||shop.owned.includes(id))return;setShop((value)=>({...value,balance:value.balance-price,owned:[...value.owned,id]}));const accessory=change.accessory;const accessories=accessory&&accessory!=='none'&&accessory!=='wristband'?[...new Set([...(career.player.accessories??[]),accessory])]:career.player.accessories;onUpdateCareer({...career,player:{...career.player,...change,accessory:accessory?'none':career.player.accessory,accessories}});setShopOpen(false);};
  const bracketColumn=(roundIndex:number,side:'left'|'right')=>{const round=bracket[roundIndex];const half=Math.ceil(round.length/2);const matches=side==='left'?round.slice(0,half):round.slice(half);return <section className={`bracket-round bracket-${side} round-${roundIndex}`}><h2>{['1/16','1/8','1/4','1/2'][roundIndex]}</h2><div className="bracket-matches">{matches.map((match,matchIndex)=><div className={`bracket-match ${match.teams.includes(career.player.country)?'player-fixture':''}`} key={matchIndex}>{match.teams.map((team,teamIndex)=><div className={match.winner===team&&team?'advanced':''} key={`${team}-${teamIndex}`}>{team&&<img src={teamFlagUrl(team)} alt="" />}<b>{team}</b>{match.winner===team&&team&&<em>✓</em>}</div>)}</div>)}</div></section>;};

  if(career.level>8&&latest?.tournament.includes('3-е место'))return <section className="champions-page"><header className="topbar"><div className="brand"><span>⚽</span><b>КУБОК МИРА 2026</b></div><button className="icon-button" onClick={onReset}>↻ НОВАЯ КАРЬЕРА</button></header><div className="champions-photo"><div className="champions-heading"><small>ТУРНИР ЗАВЕРШЁН</small><h1>ТРЕТЬЕ МЕСТО</h1><p>{career.player.country} · БРОНЗОВЫЕ ПРИЗЁРЫ</p></div><div className="world-cup-trophy">🥉<b>КУБОК МИРА 2026</b></div></div></section>;
  if(career.level>8&&latest?.won)return <section className="champions-page"><header className="topbar"><div className="brand"><span>⚽</span><b>КУБОК МИРА 2026</b></div><button className="icon-button" onClick={onReset}>↻ НОВАЯ КАРЬЕРА</button></header><div className="champions-photo"><div className="champions-heading"><small>ИСТОРИЧЕСКАЯ ПОБЕДА</small><h1>ПОБЕДИТЕЛИ КУБКА МИРА 2026</h1><p>{career.player.country}</p></div><div className="champion-team"><ChampionFigure player={{...career.player,name:'Игрок',number:3,skin:'tan',hair:'short',accessory:'none',accessories:[]}} /><ChampionFigure player={{...career.player,name:'Игрок',number:4,skin:'dark',hair:'fade',accessory:'none',accessories:[]}} /><div className="champion-main"><PlayerAvatar player={career.player} large /><b>{career.player.name}</b><span>КАПИТАН</span></div><div className="world-cup-trophy"><b>КУБОК МИРА</b></div><ChampionFigure player={{...career.player,name:'Игрок',number:9,skin:'light',hair:'curly',accessory:'none',accessories:[]}} /><ChampionFigure player={{...career.player,name:'Вратарь',number:1,skin:'tan',hair:'short',accessory:'none',accessories:[]}} keeper /><CoachFigure /></div><div className="champion-confetti">★ ● ★ ● ★ ● ★ ● ★ ● ★</div></div></section>;

  return <section className="career-page">
    <header className="topbar"><div className="brand"><span>⚽</span><b>КУБОК МИРА 2026</b></div><div className="top-actions"><button className="outline" onClick={onExit}>← НАЗАД К ВХОДУ</button><button className="icon-button" onClick={onReset}>↻</button></div></header>
    <div className="career-layout">
      <div className="profile-column"><button className="edit-player-button panel" onClick={onEditPlayer}>✏️ ИЗМЕНИТЬ МОЕГО ИГРОКА</button><aside className="profile panel">
        <PlayerAvatar player={career.player} />
        <div><small>ИГРОК СБОРНОЙ</small><h2>{career.player.name}</h2><p>{career.club} · № {career.player.number}</p></div>
        <div className="country">{career.player.country}</div>
        <div className="stats"><div><b>{career.goals}</b><span>ГОЛЫ</span></div><div><b>{career.assists}</b><span>ПАСЫ</span></div><div><b>{career.rating.toFixed(1)}</b><span>ОЦЕНКА</span></div></div>
      </aside><section className="top-scorers panel"><small>ТОП-3 БОМБАРДИРОВ</small>{topScorers.map((scorer,index)=><div className={scorer.isPlayer?'my-scorer':''} key={`${scorer.name}-${scorer.team}`}><span>{index+1}</span><b>{scorer.team} {scorer.name}</b><strong>{scorer.goals}</strong></div>)}</section><button className="shop-side-button panel" onClick={()=>setShopOpen(true)}><span>🛍</span><div><small>МАГАЗИН</small><b>{shop.balance} €</b></div><em>ОТКРЫТЬ →</em></button></div>
      <main className="season">
        <div className="season-title"><div><small>КУБОК МИРА 2026</small><h1>Плей-офф</h1></div><span>Путь к финалу</span></div>
        <div className="match-summary-row">
          {latest && <div className={`notice ${latest.won ? 'win' : 'loss'}`}>Последний матч: {latest.won ? 'Победа' : 'Поражение'} {latest.playerGoals}:{latest.opponentGoals} · результат сохранён</div>}
          {current ? <button className="next-world-match panel" onClick={() => setSelected(current)}><small>ИГРАТЬ</small><b>{career.player.country} <span>VS</span> {current.opponent}</b><em>{current.tournament}</em></button> : <div className="notice win">Турнир завершён!</div>}
        </div>
        <div className="knockout-bracket knockout-bracket--two-sided">
          {bracketColumn(0,'left')}{bracketColumn(1,'left')}{bracketColumn(2,'left')}{bracketColumn(3,'left')}
          <section className="bracket-round bracket-final"><h2>ФИНАЛ</h2><div className="bracket-matches">{bracket[4].map((match,matchIndex)=><div className={`bracket-match ${match.teams.includes(career.player.country)?'player-fixture':''}`} key={matchIndex}>{match.teams.map((team,teamIndex)=><div className={match.winner===team&&team?'advanced':''} key={`${team}-${teamIndex}`}>{team&&<img src={teamFlagUrl(team)} alt="" />}<b>{team}</b>{match.winner===team&&team&&<em>🏆</em>}</div>)}</div>)}</div></section>
          {bracketColumn(3,'right')}{bracketColumn(2,'right')}{bracketColumn(1,'right')}{bracketColumn(0,'right')}
        </div>
      </main>
    </div>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="match-card panel" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><small>{selected.tournament}</small><div className="versus"><div><span className="versus-flag"><img src={teamFlagUrl(career.player.country)} alt={`Флаг ${career.player.country}`} /></span><b>{career.club}</b></div><strong>VS</strong><div><span className="versus-flag"><img src={teamFlagUrl(selected.opponent)} alt={`Флаг ${selected.opponent}`} /></span><b>{selected.opponent}</b></div></div><div className="power"><span>Сила соперника</span><b>{selected.power}</b></div><p>Результат матча нельзя переиграть.</p><button className="primary" onClick={() => onPlay(selected)}>ВЫЙТИ НА ПОЛЕ</button></div></div>}
    {shopOpen&&<div className="modal-backdrop" onClick={()=>setShopOpen(false)}><div className="shop-modal panel" onClick={(event)=>event.stopPropagation()}><button className="close" onClick={()=>setShopOpen(false)}>×</button><small>МАГАЗИН ИГРОКА</small><h1>{shop.balance} €</h1><div className="hourly-reward"><span>🎁</span><div><small>СЛЕДУЮЩАЯ НАГРАДА</small><b>+100 €</b></div><strong>{rewardTimer}</strong></div><div className="shop-grid">{[
      ['hair-fade','Модный фейд',100,{hair:'fade'}],['hair-afro','Большое афро',150,{hair:'afro'}],['hair-long','Длинные волосы',100,{hair:'long'}],
      ['eyes-blue','Голубые глаза',100,{eyeColor:'blue'}],['eyes-green','Зелёные глаза',100,{eyeColor:'green'}],['eyes-gray','Серые глаза',100,{eyeColor:'gray'}],
      ['acc-headband','Повязка на голову',100,{accessory:'headband'}],['acc-glasses','Спортивные очки',150,{accessory:'glasses'}],['acc-captain','Капитанская повязка',100,{accessory:'captain'}]
    ].map(([id,name,price,change])=><button disabled={shop.balance<(price as number)||shop.owned.includes(id as string)} onClick={()=>buy(id as string,price as number,change as Partial<Career['player']>)} key={id as string}><i className={`shop-preview preview-${id}`} /><b>{name as string}</b><span>{shop.owned.includes(id as string)?'КУПЛЕНО':`${price} €`}</span></button>)}</div></div></div>}
  </section>;
}

function ChampionFigure({player,keeper=false}:{player:Career['player'];keeper?:boolean}){return <div className={`champion-figure ${keeper?'champion-keeper':''}`}><PlayerAvatar player={player} large /><span>{keeper?'ВРАТАРЬ':'ИГРОК'}</span></div>;}
function CoachFigure(){return <div className="champion-coach"><div className="coach-avatar"><div className="coach-hair"/><div className="coach-head"><i/><i/></div><div className="coach-suit"><i/><b/></div><div className="coach-arm coach-arm-left"/><div className="coach-arm coach-arm-right"/><div className="coach-legs"><i/><i/></div></div><b>ТРЕНЕР</b></div>;}
