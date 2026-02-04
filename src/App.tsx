import { useEffect, useState } from 'react';
import { LoginPanel } from './components/LoginPanel';
import { Dashboard } from './components/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const authenticated = localStorage.getItem('authenticated');
    const storedUsername = localStorage.getItem('username');
    if (authenticated === 'true' && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
    }
  }, []);

  const handleLoginSuccess = () => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    localStorage.removeItem('username');
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
