import { useState, useEffect } from 'react';
import { ArrowLeft, Package, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ArtikliListProps {
  onBack: () => void;
}

interface Artikal {
  sifra_proizvoda: number;
  naziv_proizvoda: string;
  jm: string;
  vpc: number;
  mpc: number;
}

export default function ArtikliList({ onBack }: ArtikliListProps) {
  const [artikli, setArtikli] = useState<Artikal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchArtikli = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/artikli`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Niste prijavljeni');
          return;
        }
        throw new Error(`HTTP greška: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const artikliData = result.data.map((a: any) => ({
          sifra_proizvoda: a.sifra_proizvoda || 0,
          naziv_proizvoda: a.naziv_proizvoda || '',
          jm: a.jm || '',
          vpc: parseFloat(a.vpc || a.VPC) || 0,
          mpc: parseFloat(a.mpc || a.MPC) || 0
        }));
        setArtikli(artikliData);
      } else {
        throw new Error(result.error || 'Nepoznata greška');
      }
    } catch (err) {
      console.error('Greška:', err);
      setError(err instanceof Error ? err.message : 'Greška pri učitavanju artikala');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtikli();
  }, []);

  const filteredArtikli = artikli.filter(artikal =>
    (artikal.naziv_proizvoda || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (artikal.sifra_proizvoda || '').toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-lg font-medium">Nazad</span>
        </button>

        <button
          onClick={fetchArtikli}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Osveži
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-8 h-8" style={{ color: '#785E9E' }} />
          <h2 className="text-3xl font-bold" style={{ color: '#785E9E' }}>
            Artikli
          </h2>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Pretraži artikle po nazivu ili šifri..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
          />
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600 text-lg">Učitavanje artikala...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
            <p className="text-red-700 text-lg font-medium">{error}</p>
            <button
              onClick={fetchArtikli}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Pokušaj ponovo
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-4 text-gray-600 text-lg">
              Pronađeno artikala: <span className="font-semibold">{filteredArtikli.length}</span>
            </div>

            {filteredArtikli.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-xl">
                  {searchTerm ? 'Nije pronađen nijedan artikal sa tim kriterijumom' : 'Nema dostupnih artikala'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
                  <thead className="text-white" style={{ backgroundColor: '#785E9E' }}>
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-lg">Šifra</th>
                      <th className="px-6 py-4 text-left font-semibold text-lg">Naziv proizvoda</th>
                      <th className="px-6 py-4 text-left font-semibold text-lg">Jedinica mere</th>
                      <th className="px-6 py-4 text-right font-semibold text-lg">VPC (KM)</th>
                      <th className="px-6 py-4 text-right font-semibold text-lg">MPC (KM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArtikli.map((artikal, index) => (
                      <tr
                        key={`${artikal.sifra_proizvoda}-${index}`}
                        className={`border-t border-gray-200 hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4 text-gray-800 font-medium">{artikal.sifra_proizvoda}</td>
                        <td className="px-6 py-4 text-gray-800">{artikal.naziv_proizvoda}</td>
                        <td className="px-6 py-4 text-gray-600">{artikal.jm}</td>
                        <td className="px-6 py-4 text-right text-gray-800 font-medium">
                          {artikal.vpc.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
                        </td>
                        <td className="px-6 py-4 text-right text-gray-800 font-medium">
                          {artikal.mpc.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
