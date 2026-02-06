import { useState } from 'react';
import { LogIn } from 'lucide-react';

interface LoginPanelProps {
  onLoginSuccess: () => void;
}

export function LoginPanel({ onLoginSuccess }: LoginPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = 'https://cakjyadlsfpdsrunpkyh.supabase.co/functions/v1/login-radnika';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        onLoginSuccess();
      } else {
        setError(data.message || 'Pogrešno korisničko ime ili šifra');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Greška pri povezivanju sa serverom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-green-50 flex items-center justify-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 lg:p-12">
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
              <img
                src="/foto/karpas_logo_software.png"
                alt="Karpas Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="bg-[#785E9E] p-5 md:p-6 rounded-full"><svg class="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg></div>`;
                  }
                }}
              />
            </div>
          </div>


          <form onSubmit={handleLogin} className="space-y-5 md:space-y-6">
            <div>
              <label className="block text-base md:text-lg font-medium text-gray-700 mb-3">
                Korisničko ime
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Unesite korisničko ime"
                className="w-full px-5 py-4 md:px-6 md:py-5 text-base md:text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 transition"
                style={{
                  '--tw-ring-color': '#785E9E',
                  borderColor: 'rgb(209 213 219)'
                } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = '#785E9E'}
                onBlur={(e) => e.target.style.borderColor = 'rgb(209 213 219)'}
                required
              />
            </div>

            <div>
              <label className="block text-base md:text-lg font-medium text-gray-700 mb-3">
                Lozinka
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Unesite lozinku"
                autoComplete="current-password"
                className="w-full px-5 py-4 md:px-6 md:py-5 text-base md:text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 transition"
                style={{
                  '--tw-ring-color': '#785E9E',
                  borderColor: 'rgb(209 213 219)'
                } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = '#785E9E'}
                onBlur={(e) => e.target.style.borderColor = 'rgb(209 213 219)'}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl text-base md:text-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-4 md:py-5 text-lg md:text-xl rounded-xl transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: '#785E9E',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6a4f8a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#785E9E'}
              onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#5c4176'}
              onMouseUp={(e) => e.currentTarget.style.backgroundColor = '#6a4f8a'}
            >
              {loading ? 'Prijava u toku...' : 'Prijava'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
