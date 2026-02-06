import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Search } from 'lucide-react';

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

interface DugovanjaListProps {
  onBack: () => void;
}

interface Dugovanje {
  sifra: number;
  naziv_partnera: string;
  ukupan_dug: number;
  dug_preko_24: number;
  dug_preko_30: number;
  dug_preko_60: number;
  dug_preko_120: number;
  najstariji_racun: string;
}

interface Stats {
  ukupanDug: number;
  dugPreko24: number;
  dugPreko30: number;
  dugPreko60: number;
  dugPreko120: number;
}

interface Uplata {
  sifra_partnera: number;
  napomena: string;
  sifra: number;
}

export default function DugovanjaList({ onBack }: DugovanjaListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter24Active, setFilter24Active] = useState(true);
  const [filter30Active, setFilter30Active] = useState(true);
  const [filter60Active, setFilter60Active] = useState(true);
  const [filter120Active, setFilter120Active] = useState(true);
  const [allDugovanja, setAllDugovanja] = useState<Dugovanje[]>([]);
  const [uplate, setUplate] = useState<Uplata[]>([]);
  const [stats, setStats] = useState<Stats>({
    ukupanDug: 0,
    dugPreko24: 0,
    dugPreko30: 0,
    dugPreko60: 0,
    dugPreko120: 0
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Niste prijavljeni');
        return;
      }

      // Paralelno učitavanje dugovanja i uplata
      const apiUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
      const [dugovanjaResponse, uplateResponse] = await Promise.all([
        fetch(`${apiUrl}/functions/v1/pregled-dugovanja`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${apiUrl}/functions/v1/pregled-uplata`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!dugovanjaResponse.ok) {
        throw new Error('Greška pri učitavanju dugovanja');
      }

      const dugovanjaResult = await dugovanjaResponse.json();

      if (dugovanjaResult.success) {
        setAllDugovanja(dugovanjaResult.data);
        setStats(dugovanjaResult.stats || { ukupanDug: 0, dugPreko24: 0, dugPreko30: 0, dugPreko60: 0, dugPreko120: 0 });
      } else {
        setError(dugovanjaResult.error || 'Greška pri učitavanju dugovanja');
      }

      // Uplate su opcione, ne treba da blokiraju prikaz dugovanja
      if (uplateResponse.ok) {
        const uplateResult = await uplateResponse.json();
        if (uplateResult.success) {
          setUplate(uplateResult.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Greška pri učitavanju dugovanja');
    } finally {
      setLoading(false);
    }
  };

  // Funkcija koja proverava da li postoji uplata za datu šifru
  const imaUplatu = (sifra: number): boolean => {
    return uplate.some(u => u.sifra === sifra);
  };

  // Filtriranje dugovanja - logika kao u VB.NET kodu
  const filteredDugovanja = allDugovanja.filter(d => {
    const matchesSearch = (d.naziv_partnera || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.sifra.toString().includes(searchTerm);
    if (!matchesSearch) return false;

    // Ako ima dug preko 120 dana
    if (d.dug_preko_120 > 0) {
      return filter120Active;
    }
    // Ako ima dug preko 60 dana (ali ne preko 120)
    else if (d.dug_preko_60 > 0) {
      return filter60Active;
    }
    // Ako ima dug preko 30 dana (ali ne preko 60)
    else if (d.dug_preko_30 > 0) {
      return filter30Active;
    }
    // Ako ima dug preko 24 dana (ali ne preko 30)
    else if (d.dug_preko_24 > 0) {
      return filter24Active;
    }

    return true;
  });

  // Funkcija za određivanje boje reda - kao u VB.NET kodu
  const getRowColor = (d: Dugovanje): string => {
    if (d.dug_preko_120 > 0) {
      return 'bg-red-900 hover:bg-red-800';
    } else if (d.dug_preko_60 > 0) {
      return 'bg-red-100 hover:bg-red-200';
    } else if (d.dug_preko_30 > 0) {
      return 'bg-yellow-100 hover:bg-yellow-200';
    } else if (d.dug_preko_24 > 0) {
      return 'bg-green-100 hover:bg-green-200';
    }
    return 'bg-white hover:bg-gray-50';
  };

  // Funkcija za određivanje boje teksta
  const getTextColor = (d: Dugovanje): string => {
    if (d.dug_preko_120 > 0) {
      return 'text-white';
    }
    return 'text-gray-800';
  };

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
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-4">
          <div className="text-sm font-medium text-blue-800 mb-1">Ukupan dug</div>
          <div className="text-2xl font-bold text-blue-900">
            {stats.ukupanDug.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
          </div>
        </div>

        <div
          className="bg-green-100 border-2 border-green-300 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilter24Active(!filter24Active)}
        >
          <div className="text-sm font-medium text-green-800 mb-1">Dug preko 24 dana</div>
          <div className="text-2xl font-bold text-green-900">
            {stats.dugPreko24.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
          </div>
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 text-white text-xs font-semibold rounded ${
              filter24Active ? 'bg-green-600' : 'bg-gray-400'
            }`}>
              {filter24Active ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        <div
          className="bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilter30Active(!filter30Active)}
        >
          <div className="text-sm font-medium text-yellow-800 mb-1">Dug preko 30 dana</div>
          <div className="text-2xl font-bold text-yellow-900">
            {stats.dugPreko30.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
          </div>
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 text-white text-xs font-semibold rounded ${
              filter30Active ? 'bg-yellow-600' : 'bg-gray-400'
            }`}>
              {filter30Active ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        <div
          className="bg-red-100 border-2 border-red-300 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilter60Active(!filter60Active)}
        >
          <div className="text-sm font-medium text-red-800 mb-1">Dug preko 60 dana</div>
          <div className="text-2xl font-bold text-red-900">
            {stats.dugPreko60.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
          </div>
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 text-white text-xs font-semibold rounded ${
              filter60Active ? 'bg-red-600' : 'bg-gray-400'
            }`}>
              {filter60Active ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        <div
          className="bg-red-900 border-2 border-red-950 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilter120Active(!filter120Active)}
        >
          <div className="text-sm font-medium text-red-100 mb-1">Dug preko 120 dana</div>
          <div className="text-2xl font-bold text-white">
            {stats.dugPreko120.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
          </div>
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 text-white text-xs font-semibold rounded ${
              filter120Active ? 'bg-red-600' : 'bg-gray-400'
            }`}>
              {filter120Active ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8" style={{ color: '#785E9E' }} />
            <h2 className="text-3xl font-bold" style={{ color: '#785E9E' }}>
              Dugovanja
            </h2>
          </div>
        </div>

        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Pretraži po šifri ili nazivu partnera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600 text-lg">Učitavanje dugovanja...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
            <p className="text-red-700 text-lg font-medium">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Pokušaj ponovo
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-4 text-gray-600 text-lg">
              Pronađeno partnera: <span className="font-semibold">{filteredDugovanja.length}</span>
            </div>

            {filteredDugovanja.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-xl">
                  {searchTerm ? 'Nije pronađen nijedan partner sa tim kriterijumom' : 'Nema dugovanja'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
                  <thead className="text-white" style={{ backgroundColor: '#785E9E' }}>
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-lg">Šif</th>
                      <th className="px-6 py-4 text-left font-semibold text-lg">Naziv partnera</th>
                      <th className="px-6 py-4 text-right font-semibold text-lg">Ukupan dug</th>
                      <th className="px-6 py-4 text-right font-semibold text-lg">&gt;30 dana</th>
                      <th className="px-6 py-4 text-right font-semibold text-lg">&gt;60 dana</th>
                      <th className="px-6 py-4 text-right font-semibold text-lg">&gt;120 dana</th>
                      <th className="px-6 py-4 text-left font-semibold text-lg">Najstariji račun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDugovanja.map((dug, index) => (
                      <tr
                        key={`${dug.sifra}-${index}`}
                        className={`border-t border-gray-200 transition-colors ${getRowColor(dug)}`}
                      >
                        <td className={`px-6 py-4 font-medium ${getTextColor(dug)}`}>
                          <div className="flex items-center gap-2">
                            <span>{dug.sifra}</span>
                            {imaUplatu(dug.sifra) && (
                              <span className="text-green-600 font-bold text-xl" title="Ima uplatu danas">✓</span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${getTextColor(dug)}`}>{dug.naziv_partnera}</td>
                        <td className={`px-6 py-4 text-right font-bold ${getTextColor(dug)}`}>
                          {dug.ukupan_dug.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`px-6 py-4 text-right ${getTextColor(dug)}`}>
                          {dug.dug_preko_30.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`px-6 py-4 text-right ${getTextColor(dug)}`}>
                          {dug.dug_preko_60.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`px-6 py-4 text-right ${getTextColor(dug)}`}>
                          {dug.dug_preko_120.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`px-6 py-4 ${getTextColor(dug)}`}>{formatDate(dug.najstariji_racun)}</td>
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
