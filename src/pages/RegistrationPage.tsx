import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

export function RegistrationPage({ onSuccess, onGuest }: { onSuccess: () => void; onGuest: () => void }) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'signup' && password !== confirmPassword) {
      setMessage('Пароли не совпадают');
      return;
    }
    setBusy(true);
    setMessage('');
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (result.data.session) onSuccess();
    else setMessage('Проверь почту и подтверди регистрацию');
  };

  const signInWithGoogle = async () => {
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setMessage(error.message);
  };

  return <section className="registration-page">
    <div className="registration-art">
      <div className="brand"><span>⚽</span><b>КУБОК МИРА 2026</b></div>
      <div><h1>КУБОК МИРА 2026</h1><p>Создай своего игрока и выиграй Кубок мира.</p></div>
      <div className="feature-line"><span>01</span> Карьера футболиста <span>02</span> Матчи в 3D <span>03</span> Трофеи</div>
    </div>
    <div className="registration-form-wrap">
      <form className="registration-form" onSubmit={submit}>
        <small>{mode === 'signup' ? 'НОВЫЙ ИГРОК' : 'ВОЗВРАЩЕНИЕ В ИГРУ'}</small>
        <h2>{mode === 'signup' ? 'Создай аккаунт' : 'Войди в аккаунт'}</h2>
        <p>{mode === 'signup' ? 'Сохраняй карьеру и продолжай играть с любого устройства.' : 'Продолжи свой путь к легенде.'}</p>
        <label>Электронная почта<input type="email" placeholder="player@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Пароль<input type="password" placeholder="Минимум 6 символов" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {mode === 'signup' && <label>Повтори пароль<input type="password" placeholder="Повтори пароль" minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>}
        {message && <div className="auth-message">{message}</div>}
        <button className="primary" disabled={busy}>{busy ? 'ПОДОЖДИ…' : mode === 'signup' ? 'СОЗДАТЬ АККАУНТ →' : 'ВОЙТИ →'}</button>
        <div className="auth-divider"><span>ИЛИ</span></div>
        <button type="button" className="google-button" onClick={signInWithGoogle}><b>G</b> Войти через Google</button>
        <button type="button" className="guest-button" onClick={onGuest}>⚽ Играть как гость</button>
        <p className="guest-hint">Прогресс гостя сохраняется только на этом устройстве.</p>
        <button type="button" className="auth-switch" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); }}>{mode === 'signup' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}</button>
      </form>
    </div>
  </section>;
}
