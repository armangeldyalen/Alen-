import { FormEvent, useState } from 'react';
import { celebrations, countries } from '../data/gameData';
import { Career, Hair, Player, Skin } from '../types/game';
import { PlayerAvatar } from '../components/PlayerAvatar';

export function CharacterCreator({ onCreate }: { onCreate: (career: Career) => void }) {
  const [player, setPlayer] = useState<Player>({ name: 'Ален', country: countries[0], skin: 'tan', hair: 'short', height: 178, number: 10, foot: 'Правая', position: 'Нападающий', celebration: celebrations[0] });
  const [numberInput, setNumberInput] = useState('10');
  const update = <K extends keyof Player>(key: K, value: Player[K]) => setPlayer({ ...player, [key]: value });
  const changeNumber = (value: string) => {
    if (!/^\d{0,2}$/.test(value)) return;
    setNumberInput(value);
    const number = Number(value);
    if (number >= 2 && number <= 99) update('number', number);
  };
  const finishNumber = () => {
    if (Number(numberInput) < 2) {
      setNumberInput('2');
      update('number', 2);
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onCreate({ player, club: player.country, level: 1, season: 1, goals: 0, assists: 0, rating: 6.5, history: [], trophies: [] });
  };

  return <section className="creator">
    <div className="brand"><span>⚽</span><b>КУБОК МИРА 2026</b></div>
    <div className="creator__grid">
      <div className="preview-card"><div className="stadium-light" /><PlayerAvatar player={player} large /><h2>{player.name || 'Твой игрок'}</h2><p>№ {player.number} · {player.position}</p></div>
      <form className="panel creator__form" onSubmit={submit}>
        <div><small>СОЗДАНИЕ ИГРОКА</small><h1>Начни свою историю</h1><p>Внешность и рост не влияют на силу футболиста.</p></div>
        <label>Имя<input value={player.name} maxLength={18} onChange={(e) => update('name', e.target.value)} required /></label>
        <div className="two-cols"><label>Сборная<select value={player.country} onChange={(e) => update('country', e.target.value)}>{countries.map((x) => <option key={x}>{x}</option>)}</select></label><label>Номер (2–99)<input type="text" inputMode="numeric" maxLength={2} value={numberInput} onChange={(e) => changeNumber(e.target.value)} onBlur={finishNumber} /></label></div>
        <Choice label="Цвет кожи" value={player.skin} values={[['light','Светлый'],['tan','Смуглый'],['dark','Тёмный']]} onChange={(v) => update('skin', v as Skin)} />
        <Choice label="Причёска" value={player.hair} values={[['short','Короткая'],['curly','Кудри'],['mohawk','Ирокез'],['bald','Лысый']]} onChange={(v) => update('hair', v as Hair)} />
        <div className="two-cols"><label>Позиция<input value="Нападающий" disabled /></label><label>Ведущая нога<select value={player.foot} onChange={(e) => update('foot', e.target.value as Player['foot'])}><option>Правая</option><option>Левая</option></select></label></div>
        <label>Рост: {player.height} см<input type="range" min="155" max="205" value={player.height} onChange={(e) => update('height', Number(e.target.value))} /></label>
        <label>Празднование<select value={player.celebration} onChange={(e) => update('celebration', e.target.value)}>{celebrations.map((x) => <option key={x}>{x}</option>)}</select></label>
        <button className="primary" type="submit">НАЧАТЬ КУБОК МИРА <span>→</span></button>
      </form>
    </div>
  </section>;
}

function Choice({ label, value, values, onChange }: { label: string; value: string; values: string[][]; onChange: (value: string) => void }) {
  return <fieldset><legend>{label}</legend><div className="choice-row">{values.map(([key, text]) => <button type="button" className={value === key ? 'selected' : ''} onClick={() => onChange(key)} key={key}>{text}</button>)}</div></fieldset>;
}
