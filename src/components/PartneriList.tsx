import { useEffect, useState } from 'react';
import { Search, ArrowLeft, Users, MapPin, Hash } from 'lucide-react';

interface Partner {
  sifra_partnera: number;
  Naziv_partnera: string;
  Naziv_grada: string;
  sifra_grada: number;
  pripada_radniku: number;
  Naziv_radnika: string;
}

interface PartneriListProps {
  onBack: () => void;
}

export default function PartneriList({ onBack }: PartneriListProps) {
  const [partneri, setPartneri] = useState<Partner[]>([]);
  const [filteredPartneri, setFilteredPartneri] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPartneri();
  }, []);

  useEffect(() => {
    try {
      if (searchTerm.trim() === '') {
        setFilteredPartneri(partneri);
      } else {
        const filtered = partneri.filter(partner => {
          try {
            const naziv = partner?.Naziv_partnera?.toString() || '';
            return naziv.toLowerCase().includes(searchTerm.toLowerCase());
          } catch (err) {
            console.error('Error filtering partner:', partner, err);
            return false;
          }
        });
        setFilteredPartneri(filtered);
      }
    } catch (err) {
      console.error('Error in search filter:', err);
      setFilteredPartneri([]);
    }
  }, [searchTerm, partneri]);

  const fetchPartneri = async () => {
    try {
      setLoading(true);
      setError('');

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/partneri`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Greška pri učitavanju partnera');
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (result.success && result.data) {
        const dataArray = Array.isArray(result.data) ? result.data : [];
        console.log('Broj partnera:', dataArray.length);
        console.log('Prvi partner:', dataArray[0]);

        setPartneri(dataArray);
        setFilteredPartneri(dataArray);
      } else {
        console.error('API Error:', result);
        setError(result.error || 'Greška pri učitavanju partnera');
      }
    } catch (err) {
      setError('Greška pri učitavanju podataka');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundImage: 'linear-gradient(to bottom right, #ffffff, #ffffff, #f0fdf4)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* NAZAD DUGME */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-8 transition-all hover:gap-3 font-medium"
          style={{ color: '#785E9E' }}
        >
          <ArrowLeft size={22} />
          <span>Nazad</span>
        </button>

        {/* GLAVNI CONTAINER */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* HEADER */}
          <div className="px-6 md:px-8 py-6 md:py-8" style={{ backgroundImage: `linear-gradient(to right, #785E9E, #6a4f8a)` }}>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Partneri</h1>
                <p className="text-white text-opacity-80 mt-1">Prikaz svih registrovanih partnera</p>
              </div>
            </div>
          </div>

          {/* SEARCH SEKCIJA */}
          <div className="px-6 md:px-8 py-6 md:py-8 border-b border-gray-200 bg-gray-50">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={22} />
              <input
                type="text"
                placeholder="Pretraži po nazivu partnera..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-5 py-3 md:py-4 border-2 border-gray-300 rounded-xl focus:outline-none transition-all text-base md:text-lg"
                style={{ 
                  focusBorderColor: '#785E9E',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#785E9E';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(120, 94, 158, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* SADRŽAJ */}
          <div className="p-6 md:p-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300" style={{ borderTopColor: '#785E9E' }}></div>
                <p className="mt-6 text-gray-600 text-lg">Učitavanje partnera...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-red-50 rounded-xl border-2 border-red-200">
                <p className="text-red-600 text-lg font-medium">{error}</p>
                <button
                  onClick={fetchPartneri}
                  className="mt-6 px-6 py-3 rounded-lg transition-all text-white font-medium"
                  style={{ backgroundColor: '#785E9E' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6a4f8a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#785E9E'}
                >
                  Pokušaj ponovo
                </button>
              </div>
            ) : (
              <div>
                {filteredPartneri.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">
                      {searchTerm ? 'Nema rezultata pretrage' : 'Nema partnera'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredPartneri.map((partner, index) => (
                        <div
                          key={partner.sifra_partnera || index}
                          className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 md:p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group"
                          style={{ borderColor: '#d1d5db' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#785E9E';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }}
                        >
                          {/* ŠIFRA */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
                              <Hash className="w-5 h-5" style={{ color: '#785E9E' }} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase">Šifra</p>
                              <p className="text-lg font-bold" style={{ color: '#785E9E' }}>
                                {partner.sifra_partnera || '-'}
                              </p>
                            </div>
                          </div>

                          {/* NAZIV PARTNERA */}
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Naziv</p>
                            <p className="text-base md:text-lg font-bold text-gray-900 group-hover:text-white transition-colors group-hover:px-2 group-hover:py-1 group-hover:rounded" style={{ color: '#000000' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#785E9E'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                              {partner.Naziv_partnera || '-'}
                            </p>
                          </div>

                          {/* GRAD */}
                          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                            <MapPin className="w-4 h-4" style={{ color: '#8FC74A' }} />
                            <p className="text-sm font-medium text-gray-700">
                              {partner.Naziv_grada || '-'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* STATISTIKA */}
                    <div className="mt-8 p-4 md:p-6 rounded-xl border-2" style={{ backgroundImage: 'linear-gradient(to right, #f3e8ff, #f0fdf4)', borderColor: '#785E9E' }}>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <p className="text-gray-600 text-sm">Prikazano</p>
                          <p className="text-2xl font-bold" style={{ color: '#785E9E' }}>
                            {filteredPartneri.length}
                          </p>
                        </div>
                        <div className="hidden md:block w-px h-12" style={{ backgroundColor: 'rgba(120, 94, 158, 0.2)' }}></div>
                        <div>
                          <p className="text-gray-600 text-sm">Ukupno partnera</p>
                          <p className="text-2xl font-bold" style={{ color: '#8FC74A' }}>
                            {partneri.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}