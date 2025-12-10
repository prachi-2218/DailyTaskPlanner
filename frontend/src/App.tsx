import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import type { User } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) as User : null;
  });
  const [route, setRoute] = useState<'login'|'signup'|'dashboard'>(token ? 'dashboard' : 'login');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setRoute('dashboard');
    } else {
      localStorage.removeItem('token');
      setRoute('login');
    }
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  function logout() {
    setToken(null);
    setUser(null);
    setRoute('login');
  }

  return (
    <div className="min-h-screen">
      {route === 'login' && <Login onLogin={(t,u)=>{ setToken(t); setUser(u); }} goSignup={()=>setRoute('signup')} />}
      {route === 'signup' && <Signup onSignup={(t,u)=>{ setToken(t); setUser(u); }} goLogin={()=>setRoute('login')} />}
      {route === 'dashboard' && token && user && <Dashboard token={token} user={user} onLogout={logout} />}
    </div>
  );
}
