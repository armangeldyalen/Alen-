import { useEffect, useState } from 'react';
import { CareerHome } from './pages/CareerHome';
import { CharacterCreator } from './pages/CharacterCreator';
import { MatchScreen } from './pages/MatchScreen';
import { LobbyScreen } from './pages/LobbyScreen';
import { Career, MatchInfo, Screen } from './types/game';
import { loadCareer, saveCareer } from './lib/storage';
import { RegistrationPage } from './pages/RegistrationPage';
import { DeviceChoice } from './pages/DeviceChoice';
import { supabase } from './lib/supabase';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [guest, setGuest] = useState(() => sessionStorage.getItem('football-guest') === 'true');
  const [career, setCareer] = useState<Career | null>(() => loadCareer());
  const [screen, setScreen] = useState<Screen>(career ? (localStorage.getItem('football-device') ? 'home' : 'device') : 'create');
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const resetShop=()=>localStorage.setItem('world-cup-shop',JSON.stringify({balance:100,lastReward:Date.now(),owned:[]}));

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
    localStorage.removeItem('football-device');
    resetShop();
    setCareer(null);
    setScreen('create');
  };

  const exitToRegistration = async () => {
    sessionStorage.removeItem('football-guest');
    setGuest(false);
    if (authenticated) await supabase.auth.signOut();
    setAuthenticated(false);
  };

  const finishMatch=(value:Career)=>{
    const result=value.history[value.history.length-1];
    if(result&&!result.won&&result.level!==7){
      localStorage.removeItem('road-to-glory-career');
      localStorage.removeItem('football-device');
      resetShop();
      setCareer(null);setMatch(null);setScreen('create');
      return;
    }
    setCareer(value);setScreen('home');
  };

  return (
    <main className="app-shell">
      {screen === 'create' && <CharacterCreator initialCareer={career} onCreate={(value) => { const wasEditing=Boolean(career);setCareer(value);if(wasEditing)setScreen('home');else{resetShop();localStorage.removeItem('football-device');setScreen('device');} }} />}
      {screen === 'device' && career && <DeviceChoice onChoose={(device)=>{localStorage.setItem('football-device',device);setScreen('home');}} />}
      {screen === 'home' && career && (
        <CareerHome career={career} onPlay={(value) => { setMatch(value); setScreen('match'); }} onEditPlayer={()=>setScreen('create')} onReset={reset} onExit={exitToRegistration} onUpdateCareer={setCareer} />
      )}
      {screen === 'match' && career && match && (
        <MatchScreen career={career} match={match} onFinish={finishMatch} />
      )}
      {screen === 'lobby' && <LobbyScreen onBack={() => setScreen('home')} />}
    </main>
  );
}
