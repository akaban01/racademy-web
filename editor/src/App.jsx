import { useEffect, useState } from 'react';
import { startLogin, completeLogin, getSession, logout } from './auth/github.js';
import { SupplyListsEditor } from './screens/SupplyListsEditor.jsx';
import { AcademicCalendarEditor } from './screens/AcademicCalendarEditor.jsx';

export function App() {
  const [session, setSession] = useState(() => getSession());
  const [screen, setScreen] = useState('picker'); // 'picker' | 'supply-lists' | 'academic-calendar'
  const [callbackError, setCallbackError] = useState(null);
  const [handlingCallback, setHandlingCallback] = useState(window.location.pathname === '/callback');

  useEffect(() => {
    if (window.location.pathname !== '/callback') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    completeLogin(code, state)
      .then((newSession) => {
        setSession(newSession);
        window.history.replaceState({}, '', '/');
      })
      .catch((err) => setCallbackError(err.message))
      .finally(() => setHandlingCallback(false));
  }, []);

  if (handlingCallback) {
    return <p style={{ padding: 24 }}>Signing in…</p>;
  }

  if (!session) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: '80px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>Renaissance Academy — Content Editor</h1>
        {callbackError && <p style={{ color: 'crimson' }}>{callbackError}</p>}
        <p>Sign in with a GitHub account that has write access to the racademy-web repository.</p>
        <button onClick={startLogin}>Sign in with GitHub</button>
      </div>
    );
  }

  function handleLogout() {
    logout();
    setSession(null);
  }

  if (screen === 'supply-lists') {
    return <SupplyListsEditor session={session} onBack={() => setScreen('picker')} />;
  }
  if (screen === 'academic-calendar') {
    return <AcademicCalendarEditor session={session} onBack={() => setScreen('picker')} />;
  }

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>Content Editor</h1>
        <button onClick={handleLogout}>Sign out ({session.login})</button>
      </div>
      <p>What would you like to edit?</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => setScreen('supply-lists')}>Supply Lists</button>
        <button onClick={() => setScreen('academic-calendar')}>Academic Calendar</button>
      </div>
    </div>
  );
}
