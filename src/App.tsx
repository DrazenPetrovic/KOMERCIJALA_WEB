import { useEffect, useState } from 'react';
import { LoginPanel } from './components/LoginPanel';
import { Dashboard } from './components/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('https://cakjyadlsfpdsrunpkyh.supabase.co/functions/v1/verify-auth', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUsername(data.username);
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('https://cakjyadlsfpdsrunpkyh.supabase.co/functions/v1/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsAuthenticated(false);
    setUsername('');
  };

  return isAuthenticated ? (
    <Dashboard username={username} onLogout={handleLogout} />
  ) : (
    <LoginPanel onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;
