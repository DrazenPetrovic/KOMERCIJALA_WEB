import { useEffect, useState } from 'react';
import { Users, FileText, Save, Loader, Calendar, Search } from 'lucide-react';

interface Partner {
  sifra_partnera: number;
  Naziv_partnera: string;
  Naziv_grada: string;
  sifra_grada: number;
}

// interface Report {
//   sifra_tabele: number;
//   sifra_radnika: number;
//   sifra_partnera: number;
//   datum_razgovora: string;
//   podaci: string;
//   poslano_emailom: number;
// }


interface Report {
  sifra_tabele: number
  datum_izvjestaja: string;
  podaci_izvjestaja: string;
}

// interface HistoryItem {
//   datum_izvjestaja: string;
//   podaci_izvjestaja: string;
// }

// interface IzvlestajListProps {
//   onBack: () => void;
// }

export default function IzvlestajList() {
  const [partneri, setPartneri] = useState<Partner[]>([]);
  const [filteredPartneri, setFilteredPartneri] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportData, setReportData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');



    useEffect(() => {
    fetchPartneri();
  }, []);

  useEffect(() => {
    // Filtriranje partnera u realnom vremenu
    const filtered = partneri.filter((partner) =>
      partner.Naziv_partnera.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.Naziv_grada.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.sifra_partnera.toString().includes(searchQuery)
    );
    setFilteredPartneri(filtered);
  }, [searchQuery, partneri]);

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

      // console.log('Rezultat API poziva za partneri:', result);
      
      if (result.success && result.data) {
        const dataArray = Array.isArray(result.data) ? result.data : [];
        setPartneri(dataArray);
      } else {
        setError(result.error || 'Greška pri učitavanju partnera');
      }
    } catch (err) {
      setError('Greška pri učitavanju podataka');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async (sifraPartnera: number) => {
    try {
      setLoadingReports(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/izvjestaji/${sifraPartnera}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Greška pri učitavanju izvještaja');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setReports(result.data);
        // console.log('Rezultat API poziva za izvještaje:', result.data);
      }
    } catch (err) {
      console.error('Greška pri učitavanju izvještaja:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handlePartnerClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setReportData('');
    setSuccessMessage('');
    setError('');
    fetchReports(partner.sifra_partnera);
  };

  const handleSave = async () => {
    if (!selectedPartner) {
      setError('Molimo odaberite partnera');
      return;
    }

    if (!reportData.trim()) {
      setError('Molimo unesite podatke o razgovoru');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/izvjestaji/save`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sifraPartnera: selectedPartner.sifra_partnera,
          podaci: reportData,
        }),
      });

      if (!response.ok) {
        throw new Error('Greška pri spremanju izvještaja');
      }

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Izvještaj uspješno sačuvan!');
        setReportData('');
        // Refresh reports list
        fetchReports(selectedPartner.sifra_partnera);
      } else {
        setError(result.error || 'Greška pri spremanju izvještaja');
      }
    } catch (err) {
      setError('Greška pri spremanju podataka');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // const formatDate = (dateString: string): string => {
  //   if (!dateString) return '';
  //   const date = new Date(dateString);
  //   const day = String(date.getUTCDate()).padStart(2, '0');
  //   const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  //   const year = date.getUTCFullYear();
  //   return `${day}.${month}.${year}`;
  // };

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ backgroundImage: 'linear-gradient(to bottom right, #ffffff, #ffffff, #f0fdf4)' }}>
      <div className="h-full w-full px-4 md:px-6 lg:px-8 py-4 flex items-center justify-center">
        
        <div className="grid gap-6 h-full w-full max-w-7xl" style={{ gridTemplateColumns: '30% 1fr' }}>
          {/* LIJEVA STRANA - LISTA PARTNERA (30%) */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="px-6 md:px-8 py-4 md:py-6" style={{ backgroundImage: 'linear-gradient(to right, #785E9E, #6a4f8a)' }}>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
                <h1 className="text-xl md:text-2xl font-bold text-white">Partneri</h1>
              </div>
            </div>

            {/* SEARCH BOX */}
            <div className="p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pretraži partnere..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300" style={{ borderTopColor: '#785E9E' }}></div>
                  <p className="mt-6 text-gray-600 text-sm">Učitavanje partnera...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPartneri.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Nema pronađenih partnera</p>
                    </div>
                  ) : (
                    filteredPartneri.map((partner) => (
                      <button
                        key={partner.sifra_partnera}
                        onClick={() => handlePartnerClick(partner)}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                          selectedPartner?.sifra_partnera === partner.sifra_partnera
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        <p className="font-semibold text-gray-900 text-sm">{partner.Naziv_partnera}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{partner.Naziv_grada}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Šifra: {partner.sifra_partnera}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* DESNA STRANA - FORMA ZA IZVJEŠTAJ (70%) */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="px-6 md:px-8 py-4 md:py-6 flex-shrink-0" style={{ backgroundImage: 'linear-gradient(to right, #8FC74A, #7fb83a)' }}>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-white" />
                <h1 className="text-xl md:text-2xl font-bold text-white">Izvještaj</h1>
              </div>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              {!selectedPartner ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">Molimo odaberite partnera sa lijeve strane</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* INFO O ODABRANOM PARTNERU */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200 flex-shrink-0">
                    <h3 className="font-bold text-base mb-2" style={{ color: '#785E9E' }}>
                      {selectedPartner.Naziv_partnera}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-600">Grad:</p>
                        <p className="font-semibold">{selectedPartner.Naziv_grada}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Šifra:</p>
                        <p className="font-semibold">{selectedPartner.sifra_partnera}</p>
                      </div>
                    </div>
                  </div>

                  {/* FORMA ZA UNOS PODATAKA */}
                  <div className="flex-shrink-0">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Podaci o razgovoru:
                    </label>
                    <textarea
                      value={reportData}
                      onChange={(e) => setReportData(e.target.value)}
                      placeholder="Unesite podatke o razgovoru sa partnerom..."
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-all resize-none text-sm"
                    />
                  </div>

                  {/* PORUKE */}
                  {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex-shrink-0">
                      <p className="text-red-600 font-medium text-sm">{error}</p>
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex-shrink-0">
                      <p className="text-green-600 font-medium text-sm">{successMessage}</p>
                    </div>
                  )}

                  {/* SAVE DUGME */}
                  <button
                    onClick={handleSave}
                    disabled={saving || !reportData.trim()}
                    className="w-full px-6 py-3 rounded-xl transition-all text-white font-bold text-base flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    style={{ backgroundColor: '#785E9E' }}
                    onMouseEnter={(e) => {
                      if (!saving && reportData.trim()) {
                        e.currentTarget.style.backgroundColor = '#6a4f8a';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#785E9E';
                    }}
                  >
                    {saving ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Spremanje...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>SAČUVAJ</span>
                      </>
                    )}
                  </button>

                  {/* ISTORIJA IZVJEŠTAJA */}
                  <div className="border-t-2 border-gray-200 pt-4 mt-4">
                    <h3 className="font-bold text-base mb-3 flex-shrink-0" style={{ color: '#785E9E' }}>
                      Istorija izvještavanja
                    </h3>

                    {loadingReports ? (
                      <div className="text-center py-6">
                        <Loader className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                        <p className="text-gray-600 mt-2 text-xs">Učitavanje izvještaja...</p>
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-xs">Nema prethodnih izvještaja</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {reports.map((report) => (
                          <div
                           key={report.sifra_tabele}
                            className="bg-gray-50 rounded-xl p-3 border-2 border-gray-200 hover:border-purple-300 transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-purple-600" />
                                <span className="font-bold text-gray-900 text-xs">
                                
                                  {report.datum_izvjestaja}
                                </span>
                              </div>
                              {/* {report.poslano_emailom === 1 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Poslano
                                </span>
                              )} */}
                            </div>
                            <p className="font-normal text-xs text-gray-700 whitespace-pre-wrap break-words">
                              {report.podaci_izvjestaja}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}