import { useState } from 'react';

export function LobbyScreen({ onBack }: { onBack: () => void }) {
  const [code, setCode] = useState('');
  const [created, setCreated] = useState('');
  const create = () => setCreated(Math.random().toString(36).slice(2, 8).toUpperCase());
  return <section className="lobby-page"><button className="back" onClick={onBack}>← Карьера</button><div className="lobby-hero"><small>ОНЛАЙН-МАТЧ</small><h1>Играй 1 на 1</h1><p>Создай закрытое лобби и отправь код другу.</p></div><div className="lobby-grid"><div className="panel"><span className="big-icon">＋</span><h2>Создать лобби</h2><p>Получи новый код для дружеского матча.</p><button className="primary" onClick={create}>СОЗДАТЬ</button>{created && <div className="lobby-code"><small>КОД ЛОББИ</small><b>{created}</b><span>Ожидаем второго игрока…</span></div>}</div><div className="panel"><span className="big-icon">⌨</span><h2>Войти по коду</h2><p>Введи шесть символов от друга.</p><input className="code-input" maxLength={6} placeholder="KZ72FA" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /><button className="outline wide" disabled={code.length !== 6}>ПРИСОЕДИНИТЬСЯ</button><small className="prototype-note">Сейчас это демонстрация интерфейса. Для игры через интернет потребуется подключить сервер лобби.</small></div></div></section>;
}
