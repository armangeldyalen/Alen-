import { useEffect, useState } from 'react';
import { CareerHome } from './pages/CareerHome';
import { CharacterCreator } from './pages/CharacterCreator';
import { MatchScreen } from './pages/MatchScreen';
import { LobbyScreen } from './pages/LobbyScreen';
import { Career, MatchInfo, Screen } from './types/game';
import { loadCareer, saveCareer } from './lib/storage';
import { RegistrationPage } from './pages/RegistrationPage';
import { supabase } from './lib/supabase';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [guest, setGuest] = useState(() => sessionStorage.getItem('football-guest') === 'true');
  const [career, setCareer] = useState<Career | null>(() => loadCareer());
  const [screen, setScreen] = useState<Screen>(career ? 'home' : 'create');
  const [match, setMatch] = useState<MatchInfo | null>(null);

  useEffect(() => { if (career) saveCareer(career); }, [career]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthenticated(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAuthenticated(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  if (authenticated === null) return <div className="app-loading">⚽</div>;
  if (!authenticated && !guest) return <RegistrationPage onSuccess={() => setAuthenticated(true)} onGuest={() => { sessionStorage.setItem('football-guest', 'true'); setGuest(true); }} />;

  const reset = () => {
    if (!confirm('Удалить карьеру и создать нового футболиста?')) return;
    localStorage.removeItem('road-to-glory-career');
    setCareer(null);
    setScreen('create');
  };

  const exitToRegistration = async () => {
    sessionStorage.removeItem('football-guest');
    setGuest(false);
    if (authenticated) await supabase.auth.signOut();
    setAuthenticated(false);
  };

  return (
    <main className="app-shell">
      {screen === 'create' && <CharacterCreator onCreate={(value) => { setCareer(value); setScreen('home'); }} />}
      {screen === 'home' && career && (
        <CareerHome career={career} onPlay={(value) => { setMatch(value); setScreen('match'); }} onLobby={() => setScreen('lobby')} onReset={reset} onExit={exitToRegistration} onEliminated={() => { localStorage.removeItem('road-to-glory-career'); setCareer(null); setMatch(null); setScreen('create'); }} />
      )}
      {screen === 'match' && career && match && (
        <MatchScreen career={career} match={match} onFinish={(value) => { setCareer(value); setScreen('home'); }} />
      )}
      {screen === 'lobby' && <LobbyScreen onBack={() => setScreen('home')} />}
    </main>
  );
}
