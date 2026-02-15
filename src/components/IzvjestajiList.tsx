import { useEffect, useState } from 'react';
import { History, Save, FileText, Search, Sparkles, Send } from 'lucide-react';

interface Partner {
  sifra_partnera: number;
  Naziv_partnera: string;
  Naziv_grada: string;
  sifra_grada: number;
  pripada_radniku: number;
  Naziv_radnika: string;
}

interface HistoryItem {
  datum_izvjestaja: string;
  podaci_izvjestaja: string;
}

// interface IzvjestajiListProps {
//   onBack: () => void;
// }

export default function IzvjestajiList() {
  const [partneri, setPartneri] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    fetchPartneri();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      fetchHistorija(selectedPartner.sifra_partnera);
    }
  }, [selectedPartner]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredPartners(partneri);
    } else {
      const filtered = partneri.filter(partner => 
        partner.Naziv_partnera.toLowerCase().includes(searchText.toLowerCase()) ||
        partner.Naziv_grada.toLowerCase().includes(searchText.toLowerCase()) ||
        partner.sifra_partnera.toString().includes(searchText)
      );
      setFilteredPartners(filtered);
    }
  }, [searchText, partneri]);

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
        setFilteredPartners(dataArray);
        
        // Postavi prvog partnera kao odabranog ako postoji
        if (dataArray.length > 0) {
          setSelectedPartner(dataArray[0]);
        }
      } else {
        setError(result.error || 'Greška pri učitavanju partnera');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Greška pri učitavanju podataka';
      setError(errorMessage);
      console.error('Greška pri učitavanju partnera:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const fetchHistorija = async (sifraPartnera: number) => {
    try {
      setHistoryLoading(true);
      setHistoryError('');
      setHistory([]);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      // console.log('Učitavanje istorije za partnera sa šifrom:', sifraPartnera);
      
      const response = await fetch(`${apiUrl}/api/izvjestaji?sifraPartnera=${sifraPartnera}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Greška pri učitavanju istorije izvještaja');
      }

      const result = await response.json();
      // console.log('Rezultat učitavanja istorije:', result);
      if (result.success && result.data) {
        const dataArray = Array.isArray(result.data) ? result.data : [];
        setHistory(dataArray);
      } else {
        setHistoryError(result.error || 'Greška pri učitavanju istorije izvještaja');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Greška pri učitavanju istorije';
      setHistoryError(errorMessage);
      console.error('Greška pri učitavanju istorije izvještaja:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSave = () => {
    // Logika za čuvanje će biti implementirana kasnije
    console.log('Čuvanje izvještaja:', {
      partner: selectedPartner,
      text: inputText,
      aiMessage
    });
    // TODO: Implementirati backend poziv za čuvanje izvještaja
  };

  const handleAiGenerate = () => {
    // AI agent će biti implementiran kasnije
    console.log('Generisanje AI poruke za:', inputText);
    setAiMessage('AI agent će biti implementiran u sledećem koraku. Ovo je placeholder poruka.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Nazad</span>
          </button>
        </div> */}

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-semibold text-slate-800">Izvještaji</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Partner Selection Section */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Search size={20} />
                  Pretraga partnera
                </h2>
                <input
                  type="text"
                  placeholder="Pretraži partnere..."
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
                />
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-purple-600"></div>
                    <p className="mt-4 text-slate-600">Učitavanje partnera...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                      onClick={fetchPartneri}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Pokušaj ponovo
                    </button>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredPartners.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        {searchText ? 'Nema rezultata pretrage' : 'Nema partnera'}
                      </div>
                    ) : (
                      filteredPartners.map((partner) => (
                        <div
                          key={partner.sifra_partnera}
                   
                          onClick={() => setSelectedPartner(partner)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedPartner?.sifra_partnera === partner.sifra_partnera
                              ? 'bg-purple-100 border-2 border-purple-500'
                              : 'bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          <div className="font-semibold text-slate-800">{partner.Naziv_partnera}</div>
                          <div className="text-sm text-slate-600">Šifra: {partner.sifra_partnera}</div>
                          <div className="text-sm text-slate-500">{partner.Naziv_grada}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Partner Info */}
              {selectedPartner && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-900 mb-2">Odabrani partner</h3>
                  <div className="text-slate-800 font-semibold">{selectedPartner.Naziv_partnera}</div>
                  <div className="text-sm text-slate-600">Šifra: {selectedPartner.sifra_partnera}</div>
                  <div className="text-sm text-slate-600">Grad: {selectedPartner.Naziv_grada}</div>
                  <div className="text-sm text-slate-600">Radnik: {selectedPartner.Naziv_radnika}</div>
                </div>
              )}
            </div>

            {/* Main Content Section */}
            <div className="lg:col-span-2 space-y-4">
              {/* History Section */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <History size={20} />
                  Istorija izvještaja
                </h2>
                {historyLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-purple-600"></div>
                    <p className="mt-4 text-slate-600">Učitavanje istorije...</p>
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">{historyError}</p>
                    <button
                      onClick={() => selectedPartner && fetchHistorija(selectedPartner.sifra_partnera)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Pokušaj ponovo
                    </button>
                  </div>
                ) : !selectedPartner ? (
                  <div className="text-center py-8 text-slate-500">
                    Odaberite partnera da vidite istoriju izvještaja
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nema istorije izvještaja za ovog partnera
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {history.map((item, index) => (
                      <div key={`${selectedPartner?.sifra_partnera}-${item.datum_izvjestaja}-${index}`} className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-sm font-semibold text-slate-600 mb-1">{item.datum_izvjestaja}</div>
                        <div className="text-sm text-slate-700 whitespace-pre-line">{item.podaci_izvjestaja}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input Section */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-slate-700 mb-3">Novi izvještaj</h2>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Unesite tekst izvještaja..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={6}
                />
              </div>

              {/* AI Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <Sparkles size={20} className="text-blue-600" />
                    AI asistent (dolazi uskoro)
                  </h2>
                  <button
                    onClick={handleAiGenerate}
                    disabled={!inputText.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                    Generiši
                  </button>
                </div>
                {aiMessage && (
                  <div className="bg-white rounded-lg p-3 border border-blue-300">
                    <div className="text-sm text-slate-700">{aiMessage}</div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={!inputText.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md"
                >
                  <Save size={20} />
                  Sačuvaj izvještaj
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
