import { useEffect, useState } from 'react';
import { ArrowLeft, Users, FileText, Save, Loader, Calendar } from 'lucide-react';

interface Partner {
  sifra_partnera: number;
  Naziv_partnera: string;
  Naziv_grada: string;
  sifra_grada: number;
}

interface Report {
  sifra_tabele: number;
  sifra_radnika: number;
  sifra_partnera: number;
  datum_razgovora: string;
  podaci: string;
  poslano_emailom: number;
}

interface IzvlestajListProps {
  onBack: () => void;
}

export default function IzvlestajList({ onBack }: IzvlestajListProps) {
  const [partneri, setPartneri] = useState<Partner[]>([]);
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LIJEVA STRANA - LISTA PARTNERA */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 md:px-8 py-6 md:py-8" style={{ backgroundImage: 'linear-gradient(to right, #785E9E, #6a4f8a)' }}>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Partneri</h1>
                  <p className="text-white text-opacity-80 mt-1">Odaberite partnera za izvještaj</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300" style={{ borderTopColor: '#785E9E' }}></div>
                  <p className="mt-6 text-gray-600 text-lg">Učitavanje partnera...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {partneri.map((partner) => (
                    <button
                      key={partner.sifra_partnera}
                      onClick={() => handlePartnerClick(partner)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedPartner?.sifra_partnera === partner.sifra_partnera
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{partner.Naziv_partnera}</p>
                      <p className="text-sm text-gray-600 mt-1">{partner.Naziv_grada}</p>
                      <p className="text-xs text-gray-500 mt-1">Šifra: {partner.sifra_partnera}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DESNA STRANA - FORMA ZA IZVJEŠTAJ */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 md:px-8 py-6 md:py-8" style={{ backgroundImage: 'linear-gradient(to right, #8FC74A, #7fb83a)' }}>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 md:w-10 md:h-10 text-white" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Izvještaj</h1>
                  <p className="text-white text-opacity-80 mt-1">Unesite podatke o razgovoru</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {!selectedPartner ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Molimo odaberite partnera sa lijeve strane</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* INFO O ODABRANOM PARTNERU */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
                    <h3 className="font-bold text-lg mb-2" style={{ color: '#785E9E' }}>
                      {selectedPartner.Naziv_partnera}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Podaci o razgovoru:
                    </label>
                    <textarea
                      value={reportData}
                      onChange={(e) => setReportData(e.target.value)}
                      placeholder="Unesite podatke o razgovoru sa partnerom..."
                      rows={8}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-all resize-none"
                    />
                  </div>

                  {/* PORUKE */}
                  {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                      <p className="text-red-600 font-medium">{error}</p>
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <p className="text-green-600 font-medium">{successMessage}</p>
                    </div>
                  )}

                  {/* SAVE DUGME */}
                  <button
                    onClick={handleSave}
                    disabled={saving || !reportData.trim()}
                    className="w-full px-6 py-4 rounded-xl transition-all text-white font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <Loader className="w-6 h-6 animate-spin" />
                        <span>Spremanje...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-6 h-6" />
                        <span>SAVE</span>
                      </>
                    )}
                  </button>

                  {/* ISTORIJA IZVJEŠTAJA */}
                  <div className="border-t-2 border-gray-200 pt-6 mt-6">
                    <h3 className="font-bold text-lg mb-4" style={{ color: '#785E9E' }}>
                      Istorija izvještavanja
                    </h3>

                    {loadingReports ? (
                      <div className="text-center py-8">
                        <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                        <p className="text-gray-600 mt-2">Učitavanje izvještaja...</p>
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Nema prethodnih izvještaja</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {reports.map((report) => (
                          <div
                            key={report.sifra_tabele}
                            className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-purple-300 transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                <span className="font-semibold text-gray-900">
                                  {formatDate(report.datum_razgovora)}
                                </span>
                              </div>
                              {report.poslano_emailom === 1 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Poslano
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                              {report.podaci}
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
