import { useEffect, useState } from 'react';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { makeGroups, makeSchedule, teamStrength } from '../data/gameData';
import { Career, MatchInfo } from '../types/game';

type TeamStanding = { played: number; points: number; goalsFor: number; goalsAgainst: number };
type ShopState = { balance: number; lastReward: number; owned: string[] };
const SHOP_KEY='world-cup-shop';
const loadShop=():ShopState=>{try{const saved=JSON.parse(localStorage.getItem(SHOP_KEY)??'null') as ShopState|null;const now=Date.now();if(!saved)return{balance:100,lastReward:now,owned:[]};const hours=Math.floor((now-saved.lastReward)/3600000);return{...saved,balance:saved.balance+hours*100,lastReward:saved.lastReward+hours*3600000};}catch{return{balance:100,lastReward:Date.now(),owned:[]};}};

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

function createBracket(groups: string[][], standings: Map<string, TeamStanding>, career: Career) {
  const ranked = (teams: string[]) => [...teams].sort((a,b)=>{const first=standings.get(a)!;const second=standings.get(b)!;return second.points-first.points||(second.goalsFor-second.goalsAgainst)-(first.goalsFor-first.goalsAgainst)||(teamStrength[b]??5)-(teamStrength[a]??5);});
  const qualified = groups.flatMap((group)=>ranked(group).slice(0,2));
  qualified.push(...ranked(groups.flatMap((group)=>ranked(group).slice(2,3))).slice(0,8));
  if(!qualified.includes(career.player.country)){qualified[qualified.length-1]=career.player.country;}
  const playerPosition=qualified.indexOf(career.player.country);[qualified[0],qualified[playerPosition]]=[qualified[playerPosition],qualified[0]];
  const rounds: BracketMatch[][]=[];let teams=qualified;
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
    rounds.push(matches);teams=matches.map((match)=>match.winner??'Победитель');
  }
  return rounds;
}

export function CareerHome({ career, onPlay, onReset, onExit, onEliminated, onUpdateCareer }: { career: Career; onPlay: (match: MatchInfo) => void; onReset: () => void; onExit: () => void; onEliminated: () => void; onUpdateCareer: (career: Career) => void }) {
  const [selected, setSelected] = useState<MatchInfo | null>(null);
  const [shopOpen,setShopOpen]=useState(false);const [shop,setShop]=useState<ShopState>(loadShop);
  const [now,setNow]=useState(Date.now());
  const schedule = makeSchedule(1, career.player.country);
  const groups = makeGroups(career.player.country);
  const standings = calculateStandings(groups, career);
  const playerGroup=groups.find((group)=>group.includes(career.player.country))!;
  const playerGroupRanking=[...playerGroup].sort((first,second)=>{const a=standings.get(first)!;const b=standings.get(second)!;return b.points-a.points||(b.goalsFor-b.goalsAgainst)-(a.goalsFor-a.goalsAgainst)||(teamStrength[second]??5)-(teamStrength[first]??5);});
  const playerGroupPosition=playerGroupRanking.indexOf(career.player.country)+1;
  const bracket=createBracket(groups,standings,career);
  const baseCurrent = schedule.find((match) => match.level === career.level) ?? null;
  const bracketRound=career.level>=4?bracket[career.level-4]:null;
  const playerFixture=bracketRound?.find((match)=>match.teams.includes(career.player.country));
  const bracketOpponent=playerFixture?.teams.find((team)=>team!==career.player.country);
  const current = baseCurrent&&career.level<4?baseCurrent:baseCurrent&&bracketOpponent&&bracketOpponent!=='Победитель'?{...baseCurrent,opponent:bracketOpponent,badge:bracketOpponent.split(' ').slice(-1)[0],power:teamStrength[bracketOpponent]??5}:null;
  const latest = career.history[career.history.length - 1];
  const simulatedScorerGoals=(name:string)=>career.history.reduce((total,_match,index)=>{const seed=Array.from(name+index).reduce((sum,letter)=>sum+letter.charCodeAt(0),0);return total+seed%4;},0);
  const topScorers=[{name:'Лионель Месси',team:'🇦🇷'},{name:'Килиан Мбаппе',team:'🇫🇷'},{name:'Харри Кейн',team:'🏴'}].map((scorer)=>({...scorer,goals:simulatedScorerGoals(scorer.name)})).sort((a,b)=>b.goals-a.goals);
  useEffect(()=>{if(career.level===4&&playerGroupPosition>2)onEliminated();},[career.level,playerGroupPosition,onEliminated]);
  useEffect(()=>{localStorage.setItem(SHOP_KEY,JSON.stringify(shop));},[shop]);
  useEffect(()=>{const timer=window.setInterval(()=>{setNow(Date.now());setShop((value)=>{const hours=Math.floor((Date.now()-value.lastReward)/3600000);return hours>0?{...value,balance:value.balance+hours*100,lastReward:value.lastReward+hours*3600000}:value;});},1000);return()=>window.clearInterval(timer);},[]);
  const rewardSeconds=Math.max(0,Math.ceil((shop.lastReward+3600000-now)/1000));const rewardTimer=`${String(Math.floor(rewardSeconds/3600)).padStart(2,'0')}:${String(Math.floor((rewardSeconds%3600)/60)).padStart(2,'0')}:${String(rewardSeconds%60).padStart(2,'0')}`;
  const buy=(id:string,price:number,change:Partial<Career['player']>)=>{if(shop.balance<price||shop.owned.includes(id))return;setShop((value)=>({...value,balance:value.balance-price,owned:[...value.owned,id]}));onUpdateCareer({...career,player:{...career.player,...change}});};

  return <section className="career-page">
    <header className="topbar"><div className="brand"><span>⚽</span><b>КУБОК МИРА 2026</b></div><div className="top-actions"><button className="outline" onClick={onExit}>← НАЗАД К ВХОДУ</button><button className="icon-button" onClick={onReset}>↻</button></div></header>
    <div className="career-layout">
      <div className="profile-column"><aside className="profile panel">
        <PlayerAvatar player={career.player} />
        <div><small>ИГРОК СБОРНОЙ</small><h2>{career.player.name}</h2><p>{career.club} · № {career.player.number}</p></div>
        <div className="country">{career.player.country}</div>
        <div className="stats"><div><b>{career.goals}</b><span>ГОЛЫ</span></div><div><b>{career.assists}</b><span>ПАСЫ</span></div><div><b>{career.rating.toFixed(1)}</b><span>ОЦЕНКА</span></div></div>
      </aside><section className="top-scorers panel"><small>ТОП-3 БОМБАРДИРОВ</small>{topScorers.map((scorer,index)=><div key={scorer.name}><span>{index+1}</span><b>{scorer.team} {scorer.name}</b><strong>{scorer.goals}</strong></div>)}</section><button className="shop-side-button panel" onClick={()=>setShopOpen(true)}><span>🛍</span><div><small>МАГАЗИН</small><b>{shop.balance} €</b></div><em>ОТКРЫТЬ →</em></button></div>
      <main className="season">
        <div className="season-title"><div><small>КУБОК МИРА 2026</small><h1>{career.level<=3?'Группы турнира':'Плей-офф'}</h1></div><span>{career.level<=3?'12 групп · 48 сборных':'Путь к финалу'}</span></div>
        <div className="match-summary-row">
          {latest && <div className={`notice ${latest.won ? 'win' : 'loss'}`}>Последний матч: {latest.won ? 'Победа' : 'Поражение'} {latest.playerGoals}:{latest.opponentGoals} · результат сохранён</div>}
          {current ? <button className="next-world-match panel" onClick={() => setSelected(current)}><small>СЛЕДУЮЩИЙ МАТЧ</small><b>{career.player.country} <span>VS</span> {current.opponent}</b><em>{current.tournament}</em></button> : <div className="notice win">Турнир завершён!</div>}
        </div>
        {career.level<=3?<div className="world-cup-groups">
          {groups.map((group, groupIndex) => <section className={`group-table panel ${group.includes(career.player.country) ? 'player-group' : ''}`} key={groupIndex}>
            <h2>Группа {String.fromCharCode(65 + groupIndex)}</h2>
            <div className="group-head"><span>Сборная</span><span>И</span><span>О</span></div>
            {[...group].sort((first,second)=>{const a=standings.get(first)!;const b=standings.get(second)!;return b.points-a.points||(b.goalsFor-b.goalsAgainst)-(a.goalsFor-a.goalsAgainst);}).map((team) => {
              const isPlayer = team === career.player.country;
              const teamStats=standings.get(team)!;
              return <div className={`group-team ${isPlayer ? 'chosen-team' : ''}`} key={team}><b>{team}</b><span>{teamStats.played}</span><span>{teamStats.points}</span></div>;
            })}
          </section>)}
        </div>:<div className="knockout-bracket">
          {bracket.map((round,index)=><section className={`bracket-round round-${index}`} key={index}><h2>{['1/16 финала','1/8 финала','Четвертьфинал','Полуфинал','Финал'][index]}</h2><div className="bracket-matches">{round.map((match,matchIndex)=><div className={`bracket-match ${match.teams.includes(career.player.country)?'player-fixture':''}`} key={matchIndex}>{match.teams.map((team)=><div className={match.winner===team?'advanced':''} key={team+matchIndex}><span>{team.split(' ').slice(-1)[0]}</span><b>{team}</b>{match.winner===team&&<em>✓</em>}</div>)}</div>)}</div></section>)}
        </div>}
      </main>
    </div>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="match-card panel" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><small>{selected.tournament}</small><div className="versus"><div><span>КМ</span><b>{career.club}</b></div><strong>VS</strong><div><span>{selected.badge}</span><b>{selected.opponent}</b></div></div><div className="power"><span>Сила соперника</span><b>{selected.power}</b></div><p>Результат матча нельзя переиграть.</p><button className="primary" onClick={() => onPlay(selected)}>ВЫЙТИ НА ПОЛЕ</button></div></div>}
    {shopOpen&&<div className="modal-backdrop" onClick={()=>setShopOpen(false)}><div className="shop-modal panel" onClick={(event)=>event.stopPropagation()}><button className="close" onClick={()=>setShopOpen(false)}>×</button><small>МАГАЗИН ИГРОКА</small><h1>{shop.balance} €</h1><div className="hourly-reward"><span>🎁</span><div><small>СЛЕДУЮЩАЯ НАГРАДА</small><b>+100 €</b></div><strong>{rewardTimer}</strong></div><div className="shop-grid">{[
      ['hair-fade','Модный фейд',300,{hair:'fade'}],['hair-afro','Большое афро',350,{hair:'afro'}],['hair-braids','Футбольные косички',400,{hair:'braids'}],['hair-long','Длинные волосы',300,{hair:'long'}],
      ['eyes-blue','Голубые глаза',150,{eyeColor:'blue'}],['eyes-green','Зелёные глаза',200,{eyeColor:'green'}],['eyes-gray','Серые глаза',100,{eyeColor:'gray'}],
      ['acc-headband','Повязка на голову',250,{accessory:'headband'}],['acc-glasses','Спортивные очки',350,{accessory:'glasses'}],['acc-wrist','Напульсник',150,{accessory:'wristband'}]
    ].map(([id,name,price,change])=><button disabled={shop.balance<(price as number)||shop.owned.includes(id as string)} onClick={()=>buy(id as string,price as number,change as Partial<Career['player']>)} key={id as string}><i className={`shop-preview preview-${id}`} /><b>{name as string}</b><span>{shop.owned.includes(id as string)?'КУПЛЕНО':`${price} €`}</span></button>)}</div></div></div>}
  </section>;
}
