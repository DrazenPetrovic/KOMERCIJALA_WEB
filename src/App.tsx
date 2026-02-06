import { useEffect, useState } from 'react';
import { LoginPanel } from './components/LoginPanel';
import { Dashboard } from './components/Dashboard';
import { getCurrentUser, signOut } from './utils/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUsername(user.username);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    const user = getCurrentUser();
    if (user) {
      setUsername(user.username);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    signOut();
    setIsAuthenticated(false);
    setUsername('');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Učitavanje...</div>;
  }

  return isAuthenticated ? (
    <Dashboard username={username} onLogout={handleLogout} />
  ) : (
    <LoginPanel onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;
