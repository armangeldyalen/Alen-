import { FormEvent, useState } from 'react';
import { celebrations, countries } from '../data/gameData';
import { Career, Hair, Player, Skin } from '../types/game';
import { PlayerAvatar } from '../components/PlayerAvatar';

const purchasedItems=[
  ['hair-fade','Модный фейд','hair','fade'],['hair-afro','Большое афро','hair','afro'],['hair-long','Длинные волосы','hair','long'],
  ['eyes-blue','Голубые глаза','eyeColor','blue'],['eyes-green','Зелёные глаза','eyeColor','green'],['eyes-gray','Серые глаза','eyeColor','gray'],
  ['acc-headband','Повязка на голову','accessory','headband'],['acc-glasses','Спортивные очки','accessory','glasses'],['acc-captain','Капитанская повязка','accessory','captain']
] as const;
const loadOwnedItems=()=>{try{return (JSON.parse(localStorage.getItem('world-cup-shop')??'null')?.owned??[]) as string[];}catch{return[];}};

export function CharacterCreator({ onCreate, initialCareer }: { onCreate: (career: Career) => void; initialCareer?: Career | null }) {
  const [player, setPlayer] = useState<Player>(initialCareer?.player ?? { name: '', country: countries[0], skin: 'tan', hair: 'short', height: 178, number: 0, foot: 'Правая', position: 'Нападающий', celebration: celebrations[0] });
  const [numberInput, setNumberInput] = useState(initialCareer ? String(initialCareer.player.number) : '');
  const [ownedItems] = useState(loadOwnedItems);
  const update = <K extends keyof Player>(key: K, value: Player[K]) => setPlayer({ ...player, [key]: value });
  const changeNumber = (value: string) => {
    if (!/^\d{0,2}$/.test(value)) return;
    setNumberInput(value);
    const number = Number(value);
    update('number', number >= 2 && number <= 99 ? number : 0);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!player.name.trim() || player.number < 2 || player.number > 99) return;
    onCreate(initialCareer ? {...initialCareer,player,club:player.country} : { player, club: player.country, level: 4, season: 1, goals: 0, assists: 0, rating: 6.5, history: [], trophies: [] });
  };
  const toggleItem=(key:'hair'|'eyeColor'|'accessory',value:string)=>{
    if(key==='hair')update('hair',(player.hair===value?'short':value) as Hair);
    if(key==='eyeColor')update('eyeColor',(player.eyeColor===value?'brown':value) as Player['eyeColor']);
    if(key==='accessory')setPlayer((current)=>{const equipped=current.accessories??(current.accessory&&current.accessory!=='none'&&current.accessory!=='wristband'?[current.accessory]:[]);const accessories=equipped.includes(value as 'headband'|'glasses'|'captain')?equipped.filter((item)=>item!==value):[...equipped,value as 'headband'|'glasses'|'captain'];return{...current,accessory:'none',accessories};});
  };

  return <section className="creator">
    <div className="brand"><span>⚽</span><b>КУБОК МИРА 2026</b></div>
    <div className="creator__grid">
      <div className="preview-card"><div className="stadium-light" /><PlayerAvatar player={player} large /><h2>{player.name || 'Твой игрок'}</h2><p>{numberInput ? `№ ${numberInput} · ` : ''}{player.position}</p></div>
      <form className="panel creator__form" onSubmit={submit}>
        <div><small>СОЗДАНИЕ ИГРОКА</small><h1>Начни свою историю</h1><p>Внешность и рост не влияют на силу футболиста.</p></div>
        <label>Имя<input value={player.name} maxLength={18} onChange={(e) => update('name', e.target.value)} required /></label>
        <div className="two-cols"><label>Сборная<select value={player.country} onChange={(e) => update('country', e.target.value)}>{countries.map((x) => <option key={x}>{x}</option>)}</select></label><label>Номер (2–99)<input type="text" inputMode="numeric" maxLength={2} value={numberInput} onChange={(e) => changeNumber(e.target.value)} required /></label></div>
        <Choice label="Цвет кожи" value={player.skin} values={[['light','Светлый'],['tan','Смуглый'],['dark','Тёмный']]} onChange={(v) => update('skin', v as Skin)} />
        <Choice label="Причёска" value={player.hair} values={[['short','Короткая'],['curly','Кудри'],['mohawk','Ирокез'],['bald','Лысый']]} onChange={(v) => update('hair', v as Hair)} />
        {ownedItems.length>0&&<fieldset className="owned-items"><legend>Купленные предметы</legend><p>Нажми, чтобы надеть или снять предмет</p><div>{purchasedItems.filter(([id])=>ownedItems.includes(id)).map(([id,name,key,value])=>{const active=key==='accessory'?[...(player.accessories??[]),player.accessory].includes(value as Player['accessory']):player[key]===value;return <button type="button" className={active?'equipped':''} onClick={()=>toggleItem(key,value)} key={id}><i className={`shop-preview preview-${id}`} /><b>{name}</b><span>{active?'СНЯТЬ':'НАДЕТЬ'}</span></button>;})}</div></fieldset>}
        <div className="two-cols"><label>Позиция<input value="Нападающий" disabled /></label><label>Ведущая нога<select value={player.foot} onChange={(e) => update('foot', e.target.value as Player['foot'])}><option>Правая</option><option>Левая</option></select></label></div>
        <label>Рост: {player.height} см<input type="range" min="155" max="205" value={player.height} onChange={(e) => update('height', Number(e.target.value))} /></label>
        <label>Празднование<select value={player.celebration} onChange={(e) => update('celebration', e.target.value)}>{celebrations.map((x) => <option key={x}>{x}</option>)}</select></label>
        <button className="primary" type="submit" disabled={!player.name.trim() || player.number < 2}>НАЧАТЬ КУБОК МИРА <span>→</span></button>
      </form>
    </div>
  </section>;
}

function Choice({ label, value, values, onChange }: { label: string; value: string; values: string[][]; onChange: (value: string) => void }) {
  return <fieldset><legend>{label}</legend><div className="choice-row">{values.map(([key, text]) => <button type="button" className={value === key ? 'selected' : ''} onClick={() => onChange(key)} key={key}>{text}</button>)}</div></fieldset>;
}
