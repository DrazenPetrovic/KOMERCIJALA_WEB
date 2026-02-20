import React, { useState } from 'react';
import { Calendar, Filter, Sparkles, TrendingUp, TrendingDown, User, AlertCircle } from 'lucide-react';

// Mock tipovi podataka
interface Report {
  id: number;
  date: string;
  worker: string;
  items: number;
  total: number;
  category: string;
}

// Mock podaci
const mockReports: Report[] = [
  { id: 1, date: '2026-02-20', worker: 'Marko Marković', items: 15, total: 2450.00, category: 'Prodaja' },
  { id: 2, date: '2026-02-20', worker: 'Ana Anić', items: 22, total: 3890.50, category: 'Prodaja' },
  { id: 3, date: '2026-02-20', worker: 'Petar Petrović', items: 8, total: 1250.00, category: 'Nabavka' },
  { id: 4, date: '2026-02-19', worker: 'Marko Marković', items: 12, total: 1850.00, category: 'Prodaja' },
  { id: 5, date: '2026-02-19', worker: 'Jelena Jelić', items: 18, total: 2980.00, category: 'Prodaja' },
];

const mockAIAnalysis = {
  summary: "Prodaja danas pokazuje pozitivan trend sa povećanjem od 15% u odnosu na prošli dan. Ana Anić je postigla najbolje rezultate.",
  highlights: [
    { type: 'positive', text: 'Prosječna vrijednost transakcije: 2,130.00 KM' },
    { type: 'positive', text: 'Ukupno stavki obrađeno: 45' },
    { type: 'warning', text: 'Nabavka ispod očekivanog nivoa' },
  ],
  trend: 'up' as const
};

const IzvjestajAdmin: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-02-20');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [filteredReports, setFilteredReports] = useState<Report[]>(
    mockReports.filter(r => r.date === '2026-02-20')
  );

  // Izvuci jedinstvene radnike
  const workers = Array.from(new Set(mockReports.map(r => r.worker)));

  // Funkcija za formatiranje datuma
  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  // Funkcija za filtriranje
  const applyFilters = () => {
    let filtered = mockReports;

    // Filter po datumu ili range
    if (dateRangeStart && dateRangeEnd) {
      filtered = filtered.filter(r => r.date >= dateRangeStart && r.date <= dateRangeEnd);
    } else if (selectedDate) {
      filtered = filtered.filter(r => r.date === selectedDate);
    }

    // Filter po radniku
    if (selectedWorker) {
      filtered = filtered.filter(r => r.worker === selectedWorker);
    }

    setFilteredReports(filtered);
  };

  return (
    <div className="w-full bg-gray-50 p-2 md:p-3">
      <div className="max-w-7xl mx-auto space-y-3">
       
        {/* AI Analiza - Prominentna Sekcija */}
        <div className="bg-gradient-to-br from-[#785E9E] to-[#5d4a7a] rounded-lg shadow-lg p-3 md:p-4 text-white">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-base md:text-lg font-bold mb-1">AI Analiza</h2>
              <p className="text-purple-100 text-xs md:text-sm leading-relaxed">
                {mockAIAnalysis.summary}
              </p>
            </div>
            {mockAIAnalysis.trend === 'up' ? (
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
            )}
          </div>
          
          <div className="space-y-1.5 mt-2">
            {mockAIAnalysis.highlights.map((highlight, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-2 p-2 rounded-lg text-xs md:text-sm ${
                  highlight.type === 'positive' 
                    ? 'bg-white/20 border border-white/30' 
                    : 'bg-orange-400/30 border border-orange-300/50'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{highlight.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filteri */}
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm md:text-base font-semibold text-gray-900">Filteri</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Single Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Datum
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateRangeStart('');
                  setDateRangeEnd('');
                }}
                className="w-full px-2.5 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#785E9E] focus:border-transparent"
              />
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Od Datuma
              </label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => {
                  setDateRangeStart(e.target.value);
                  setSelectedDate('');
                }}
                className="w-full px-2.5 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#785E9E] focus:border-transparent"
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Do Datuma
              </label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => {
                  setDateRangeEnd(e.target.value);
                  setSelectedDate('');
                }}
                className="w-full px-2.5 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#785E9E] focus:border-transparent"
              />
            </div>

            {/* Worker Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <User className="w-3 h-3 inline mr-1" />
                Radnik
              </label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#785E9E] focus:border-transparent"
              >
                <option value="">Svi radnici</option>
                {workers.map(worker => (
                  <option key={worker} value={worker}>{worker}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={applyFilters}
            className="mt-2.5 w-full md:w-auto px-4 py-1.5 text-xs md:text-sm bg-[#785E9E] text-white rounded-lg hover:bg-[#6b5088] transition-colors font-medium"
          >
            Primijeni Filtere
          </button>
        </div>

        {/* Tabela Izvještaja */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-3 md:p-4 border-b border-gray-200">
            <h3 className="text-sm md:text-base font-semibold text-gray-900">
              Detalji Izvještaja
            </h3>
          </div>

          {/* Mobile View - Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredReports.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-xs">
                Nema izvještaja za odabrane filtere
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report.id} className="p-3 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900 text-xs">{report.worker}</p>
                      <p className="text-xs text-gray-600">{formatDate(report.date)}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#785E9E]/10 text-[#785E9E] text-xs rounded-full font-medium">
                      {report.items} izvještaja
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Radnik
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Broj Izvještaja
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-gray-500 text-xs">
                      Nema izvještaja za odabrane filtere
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-900">
                        {formatDate(report.date)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-3 h-3 text-gray-400 mr-1.5" />
                          <span className="text-xs font-medium text-gray-900">
                            {report.worker}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-900">
                        {report.items}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IzvjestajAdmin;