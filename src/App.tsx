import { useEffect, useState } from 'react';
import { LoginPanel } from './components/LoginPanel';
import { Dashboard } from './components/Dashboard';
import { supabase } from './utils/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email || '');
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || '');
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUserEmail('');
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail('');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Učitavanje...</div>;
  }

  return isAuthenticated ? (
    <Dashboard username={userEmail} onLogout={handleLogout} />
  ) : (
    <LoginPanel onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;
