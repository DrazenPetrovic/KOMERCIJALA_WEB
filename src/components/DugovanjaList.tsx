import { useState } from 'react';
import { ArrowLeft, AlertCircle, Search } from 'lucide-react';

interface DugovanjaListProps {
  onBack: () => void;
}

interface Dugovanje {
  sifra: number;
  naziv_partnera: string;
  ukupan_dug: number;
  dug_preko_30: number;
  dug_preko_60: number;
  najstariji_racun: string;
}

export default function DugovanjaList({ onBack }: DugovanjaListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading] = useState(false);

  // Mock podaci za prikaz
  const dugovanja: Dugovanje[] = [
    {
      sifra: 5597,
      naziv_partnera: "AEL KAFFERS CENTAR d.o.o.",
      ukupan_dug: 117.00,
      dug_preko_30: 0.00,
      dug_preko_60: 0.00,
      najstariji_racun: "16.01.2026."
    },
    {
      sifra: 74,
      naziv_partnera: "AMFORA d.o.o.",
      ukupan_dug: 113.46,
      dug_preko_30: 0.00,
      dug_preko_60: 0.00,
      najstariji_racun: "02.02.2026."
    },
    {
      sifra: 5622,
      naziv_partnera: "ART s.p. / vl.Bogdan Nikolić",
      ukupan_dug: 708.92,
      dug_preko_30: 0.00,
      dug_preko_60: 0.00,
      najstariji_racun: "27.01.2026."
    }
  ];

  // Mock statistike
  const stats = {
    ukupanDug: 137247.83,
    dugPreko24: 59320.49,
    dugPreko30: 59320.49,
    dugUmanjeni: 81821.06
  };

  const filteredDugovanja = dugovanja.filter(dug =>
    dug.naziv_partnera.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dug.sifra.toString().includes(searchTerm)
  );

  const isDugovanjeKriticno = (dug: Dugovanje) => {
    return dug.dug_preko_60 > 0 || dug.ukupan_dug > 10000;
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-4">
          <div className="text-sm font-medium text-blue-800 mb-1">Ukupan dug</div>
          <div className="text-2xl font-bold text-blue-900">
            {stats.ukupanDug.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
          </div>
          <div className="mt-2">
            <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded">ON</span>
          </div>
        </div>

        <div className="bg-green-100 border-2 border-green-300 rounded-xl p-4">
          <div className="text-sm font-medium text-green-800 mb-1">Dug preko 24 dana</div>
          <div className="text-2xl font-bold text-green-900">
            {stats.dugPreko24.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
          </div>
          <div className="mt-2">
            <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded">ON</span>
          </div>
        </div>

        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4">
          <div className="text-sm font-medium text-yellow-800 mb-1">Dug preko 30 dana</div>
          <div className="text-2xl font-bold text-yellow-900">
            {stats.dugPreko30.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
          </div>
          <div className="mt-2">
            <span className="inline-block px-3 py-1 bg-yellow-600 text-white text-xs font-semibold rounded">ON</span>
          </div>
        </div>

        <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4">
          <div className="text-sm font-medium text-red-800 mb-1">Dug umanjeni</div>
          <div className="text-2xl font-bold text-red-900">
            {stats.dugUmanjeni.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
          </div>
          <div className="mt-2">
            <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded">ON</span>
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

        {!loading && (
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
                      <th className="px-6 py-4 text-left font-semibold text-lg">Najstariji račun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDugovanja.map((dug, index) => {
                      const isKriticno = isDugovanjeKriticno(dug);
                      return (
                        <tr
                          key={dug.sifra}
                          className={`border-t border-gray-200 transition-colors ${
                            isKriticno
                              ? 'bg-red-100 hover:bg-red-200'
                              : index % 2 === 0
                                ? 'bg-white hover:bg-gray-50'
                                : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <td className="px-6 py-4 text-gray-800 font-medium">{dug.sifra}</td>
                          <td className="px-6 py-4 text-gray-800">{dug.naziv_partnera}</td>
                          <td className="px-6 py-4 text-right text-gray-800 font-bold">
                            {dug.ukupan_dug.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-800">
                            {dug.dug_preko_30.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-800">
                            {dug.dug_preko_60.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-gray-800">{dug.najstariji_racun}</td>
                        </tr>
                      );
                    })}
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
