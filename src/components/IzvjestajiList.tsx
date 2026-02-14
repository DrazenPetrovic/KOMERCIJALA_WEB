import { useState } from 'react';
import { ArrowLeft, History, Save, FileText, Search, Sparkles, Send } from 'lucide-react';

interface Partner {
  sif: string;
  naziv: string;
  grad: string;
  radnik: string;
}

interface HistoryItem {
  datum: string;
  tekst: string;
}

interface IzvjestajiListProps {
  onBack: () => void;
}

const mockPartners: Partner[] = [
  { sif: '20729', naziv: 'Alna Ljubuški', grad: 'Čarnek', radnik: 'Vračar Nikola' },
  { sif: '20736', naziv: 'Alvo Tim doo', grad: 'Čapjevina', radnik: 'Vračar Nikola' },
  { sif: '20739', naziv: 'Alvo Tim doo', grad: 'Čapjevina', radnik: 'Vračar Nikola' },
  { sif: '20454', naziv: 'Avdagić', grad: 'Sanski Most', radnik: 'Vračar Nikola' },
  { sif: '20839', naziv: 'Baymeric restraunt', grad: 'Čataljin', radnik: 'Vračar Nikola' },
  { sif: '20989', naziv: 'Balance lange bar', grad: 'Doboj', radnik: 'Vračar Nikola' },
  { sif: '20471', naziv: 'Balkan El-Spres', grad: 'Bijedor', radnik: 'Vračar Nikola' },
  { sif: '20670', naziv: 'Bašeni Gacin', grad: 'Gacin', radnik: 'Vračar Nikola' },
  { sif: '20471', naziv: 'Bašen ekspres', grad: 'Bijeko', radnik: 'Vračar Nikola' },
  { sif: '20479', naziv: 'Big Ban', grad: 'Lučiči', radnik: 'Vračar Nikola' },
  { sif: '20002', naziv: 'Brahaj', grad: 'Banja Luka', radnik: 'Vračar Nikola' },
  { sif: '20385', naziv: 'Brko', grad: 'Broko', radnik: 'Vračar Nikola' },
  { sif: '20611', naziv: 'Burger Stop', grad: 'Broko', radnik: 'Vračar Nikola' },
  { sif: '20428', naziv: 'Camping', grad: 'Sanski Most', radnik: 'Vračar Nikola' },
];

const mockHistory: HistoryItem[] = [
  {
    datum: '11.02.2025',
    tekst: 'Obišeo kupca.\nRazgovarao sam sa vlasnikom.Želi se da malo slabije ime posla.što se vidi po narudžbama da su rijeđe nego inače.U glavnom smo razgovarali ne obavezno i vezano za posao.'
  },
  {
    datum: '08.02.2025',
    tekst: 'Telefonski kontakt. Dogovorena isporuka za narednu sedmicu.'
  },
  {
    datum: '05.02.2025',
    tekst: 'Isporuka robe prema narudžbi. Sve u redu, nema primedbi.'
  }
];

export default function IzvjestajiList({ onBack }: IzvjestajiListProps) {
  const [selectedPartner, setSelectedPartner] = useState<Partner>(mockPartners[10]);
  const [inputText, setInputText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>(mockPartners);

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value.trim() === '') {
      setFilteredPartners(mockPartners);
    } else {
      const filtered = mockPartners.filter(partner => 
        partner.naziv.toLowerCase().includes(value.toLowerCase()) ||
        partner.grad.toLowerCase().includes(value.toLowerCase()) ||
        partner.sif.includes(value)
      );
      setFilteredPartners(filtered);
    }
  };

  const handleSave = () => {
    // Logika za čuvanje će biti implementirana kasnije
    console.log('Čuvanje izvještaja:', {
      partner: selectedPartner,
      text: inputText,
      aiMessage
    });
    alert('Izvještaj sačuvan! (Funkcionalnost će biti implementirana u sledećem koraku)');
  };

  const handleAiGenerate = () => {
    // AI agent će biti implementiran kasnije
    console.log('Generisanje AI poruke za:', inputText);
    setAiMessage('AI agent će biti implementiran u sledećem koraku. Ovo je placeholder poruka.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Nazad</span>
          </button>
        </div>

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
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredPartners.map((partner) => (
                    <div
                      key={partner.sif}
                      onClick={() => setSelectedPartner(partner)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedPartner.sif === partner.sif
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <div className="font-semibold text-slate-800">{partner.naziv}</div>
                      <div className="text-sm text-slate-600">Šifra: {partner.sif}</div>
                      <div className="text-sm text-slate-500">{partner.grad}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Partner Info */}
              {selectedPartner && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-900 mb-2">Odabrani partner</h3>
                  <div className="text-slate-800 font-semibold">{selectedPartner.naziv}</div>
                  <div className="text-sm text-slate-600">Šifra: {selectedPartner.sif}</div>
                  <div className="text-sm text-slate-600">Grad: {selectedPartner.grad}</div>
                  <div className="text-sm text-slate-600">Radnik: {selectedPartner.radnik}</div>
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
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {mockHistory.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="text-sm font-semibold text-slate-600 mb-1">{item.datum}</div>
                      <div className="text-sm text-slate-700 whitespace-pre-line">{item.tekst}</div>
                    </div>
                  ))}
                </div>
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
