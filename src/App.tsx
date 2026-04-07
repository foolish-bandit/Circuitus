import { useState, useCallback } from 'react';
import { isAuthenticated, logout } from '@/lib/auth';
import LoginPage from '@/pages/LoginPage';
import MainLayout from '@/pages/MainLayout';

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated);

  const handleLogin = useCallback(() => setAuthed(true), []);
  const handleLogout = useCallback(() => {
    logout();
    setAuthed(false);
  }, []);

  if (!authed) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <MainLayout onLogout={handleLogout} />;
}
