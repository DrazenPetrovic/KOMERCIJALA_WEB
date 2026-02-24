import React, { useEffect, useState } from 'react';
import { Calendar, Filter, Sparkles, TrendingUp, TrendingDown, User, AlertCircle } from 'lucide-react';

interface Report {
  id: number;
  date: string;
  worker: string;
  items: number;
  total: number;
  category: string;
}

interface Komercijalist {
  sifra_radnika: number;
  naziv_radnika: string;
}

interface IzvjestajRow {
  sifra_radnika: number;
  naziv_radnika: string;
  sifra_partnera: number;
  naziv_partnera: string;
  datum_razgovora: string;
  podaci_razgovora: string;
}

const mockAIAnalysis = {
  summary:
    'Prodaja danas pokazuje pozitivan trend sa povećanjem od 15% u odnosu na prošli dan. Ana Anić je postigla najbolje rezultate.',
  highlights: [
    { type: 'positive', text: 'Prosječna vrijednost transakcije: 2,130.00 KM' },
    { type: 'positive', text: 'Ukupno stavki obrađeno: 45' },
    { type: 'warning', text: 'Nabavka ispod očekivanog nivoa' }
  ],
  trend: 'up' as const
};

const IzvjestajAdmin: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-02-20');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [izvjestaji, setIzvjestaji] = useState<IzvjestajRow[]>([]);
  const [loadingIzvjestaji, setLoadingIzvjestaji] = useState(false);

  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [dateMode, setDateMode] = useState<'day' | 'range'>('day');
  const [komercijalisti, setKomercijalisti] = useState<Komercijalist[]>([]);
  const [cardRows, setCardRows] = useState<IzvjestajRow[]>([]);


    const fetchIzvjestajiByDate = async (start: string, end: string): Promise<IzvjestajRow[]> => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/api/izvjestaji/izvjestaj-datum/${start}/${end}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || 'Greška pri učitavanju izvještaja');
      }

      return (json.data || []) as IzvjestajRow[];
    };


  useEffect(() => {
    const fetchKomercijalisti = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/izvjestaji/komercijalisti`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) setKomercijalisti(json.data);
      } catch (err) {
        console.error('Greška pri učitavanju komercijalista:', err);
      }
    };

    const fetchIzvjestajiPoslednji = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        setLoadingIzvjestaji(true);

        const res = await fetch(`${apiUrl}/api/izvjestaji/izvjestaj-poslednji`, {
          credentials: 'include'
        });

        const json = await res.json();

        if (json.success) {
          const data: IzvjestajRow[] = json.data || [];
          setIzvjestaji(data);

          const firstDate = data?.[0]?.datum_razgovora?.slice(0, 10);
          console.log('Prvi datum iz izvještaja:', firstDate);
          console.log('Prvi datum iz izvještaja:', data?.[0]?.datum_razgovora);

          // if (firstDate) setSelectedDate(firstDate);
          
          if (firstDate) {
            setSelectedDate(firstDate);
            const baseInit = data.filter(r => r.datum_razgovora.slice(0, 10) === firstDate);
            setCardRows(baseInit);
            buildDetaljiTable(baseInit, formatDate(firstDate));
          } else {
            setCardRows([]);
            setFilteredReports([]);
          }



          // inicijalno napuni tabelu
          applyFiltersWithData(data, {
            dateMode: 'day',
            selectedDate: firstDate || '2026-02-20',
            dateRangeStart: '',
            dateRangeEnd: '',
            selectedWorker: ''
          });
        } else {
          setIzvjestaji([]);
          setFilteredReports([]);
        }
      } catch (e) {
        console.error('Greška izvjestaji poslednji:', e);
        setIzvjestaji([]);
        setFilteredReports([]);
      } finally {
        setLoadingIzvjestaji(false);
      }
    };

    fetchKomercijalisti();
    fetchIzvjestajiPoslednji();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

      const formatDate = (input?: string): string => {
            if (!input) return '';
            const datePart = input.includes('T') ? input.split('T')[0] : input; // YYYY-MM-DD
            const [y, m, d] = datePart.split('-');
            if (!y || !m || !d) return input;
            return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
      };

      const formatRangeLabel = (start?: string, end?: string): string => {
      if (!start || !end) return '';
      return `${formatDate(start)} - ${formatDate(end)}`;

      };

  const buildDetaljiTable = (rows: IzvjestajRow[], dateLabel: string) => {
    const map = new Map<number, { worker: string; items: number }>();

    for (const r of rows) {
      const key = r.sifra_radnika;
      if (!map.has(key)) map.set(key, { worker: r.naziv_radnika, items: 1 });
      else map.get(key)!.items += 1;
    }

    const table: Report[] = Array.from(map.entries()).map(([id, v]) => ({
      id,
      date: dateLabel,
      worker: v.worker,
      items: v.items,
      total: 0,
      category: ''
    }));

    table.sort((a, b) => b.items - a.items);
    setFilteredReports(table);
  };

  const applyFiltersWithData = (
    data: IzvjestajRow[],
    params: {
      dateMode: 'day' | 'range';
      selectedDate: string;
      dateRangeStart: string;
      dateRangeEnd: string;
      selectedWorker: string;
    }
  ) => {
    let base = [...data];

    // filter po datumu / periodu
    let dateLabel = '';
    if (params.dateMode === 'range') {
      if (params.dateRangeStart && params.dateRangeEnd) {
        base = base.filter(r => {
          const d = r.datum_razgovora.slice(0, 10);
          return d >= params.dateRangeStart && d <= params.dateRangeEnd;
        });
        dateLabel = formatRangeLabel(params.dateRangeStart, params.dateRangeEnd);
      } else {
        base = [];
        dateLabel = '';
      }
    } else {
      if (params.selectedDate) {
        base = base.filter(r => r.datum_razgovora.slice(0, 10) === params.selectedDate);
        dateLabel = formatDate(params.selectedDate);
      } else {
        base = [];
        dateLabel = '';
      }
    }

      // filter po radniku (OVDJE stvarno utiče)
      if (params.selectedWorker) {
        base = base.filter(r => r.naziv_radnika === params.selectedWorker);
      }

      // kartice: konkretni redovi iz baze (partneri + podaci_razgovora)
      setCardRows(base);
      buildDetaljiTable(base, dateLabel);
  };

  // const applyFilters = () => {
  //   applyFiltersWithData(izvjestaji, {
  //     dateMode,
  //     selectedDate,
  //     dateRangeStart,
  //     dateRangeEnd,
  //     selectedWorker
  //   });
  // };

      const applyFilters = async () => {
        try {
          setLoadingIzvjestaji(true);

          let start = '';
          let end = '';

          if (dateMode === 'day') {
            if (!selectedDate) {
              applyFiltersWithData([], {
                dateMode,
                selectedDate,
                dateRangeStart,
                dateRangeEnd,
                selectedWorker
              });
              return;
            }
            start = selectedDate;
            end = selectedDate; // isti dan
          } else {
            if (!dateRangeStart || !dateRangeEnd) {
              applyFiltersWithData([], {
                dateMode,
                selectedDate,
                dateRangeStart,
                dateRangeEnd,
                selectedWorker
              });
              return;
            }
            start = dateRangeStart;
            end = dateRangeEnd;
          }

          const data = await fetchIzvjestajiByDate(start, end);

          // opcionalno: da state "izvjestaji" bude uvijek zadnje učitano
          setIzvjestaji(data);

          applyFiltersWithData(data, {
            dateMode,
            selectedDate,
            dateRangeStart,
            dateRangeEnd,
            selectedWorker
          });
        } catch (e) {
          console.error('Greška pri primjeni filtera:', e);
          applyFiltersWithData([], {
            dateMode,
            selectedDate,
            dateRangeStart,
            dateRangeEnd,
            selectedWorker
          });
        } finally {
          setLoadingIzvjestaji(false);
        }
      };


  return (
    <div className="w-full bg-gray-50 p-2 md:p-3">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="bg-gradient-to-br from-[#785E9E] to-[#5d4a7a] rounded-lg shadow-lg p-3 md:p-4 text-white">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-base md:text-lg font-bold mb-1">AI Analiza</h2>
              <p className="text-purple-100 text-xs md:text-sm leading-relaxed">{mockAIAnalysis.summary}</p>
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

        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm md:text-base font-semibold text-gray-900">Filteri</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5">
            <div className="lg:col-span-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDateMode('day');
                      setSelectedDate(selectedDate || '2026-02-20');
                      setDateRangeStart('');
                      setDateRangeEnd('');
                    }}
                    className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors ${
                      dateMode === 'day' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Po danu
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDateMode('range');
                      setSelectedDate('');
                    }}
                    className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors ${
                      dateMode === 'range' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Period
                  </button>
                </div>
              </div>

              {dateMode === 'day' ? (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Datum</label>
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Od Datuma</label>
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

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Do Datuma</label>
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
                </div>
              )}
            </div>

            <div className="flex flex-col justify-end h-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <User className="w-3 h-3 inline mr-1" />
                Komercijalisti
              </label>

              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#785E9E] focus:border-transparent"
              >
                <option value="">Svi komercijalisti</option>
                {komercijalisti.map(k => (
                  <option key={k.sifra_radnika} value={k.naziv_radnika}>
                    {k.naziv_radnika}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={applyFilters}
            className="mt-2.5 w-full md:w-auto px-4 py-1.5 text-xs md:text-sm bg-[#785E9E] text-white rounded-lg hover:bg-[#6b5088] transition-colors font-medium"
            disabled={loadingIzvjestaji}
          >
            {loadingIzvjestaji ? 'Učitavanje...' : 'Primijeni Filtere'}
          </button>
        </div>

          {/* Izabrali ste izvještaj */}

            <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-[#785E9E]/20">
              {cardRows.length === 0 ? (
                <div className="text-gray-500 text-xs md:text-sm">
                  Nema podataka za odabrane filtere.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {cardRows.map((r, idx) => (
                    <div
                      key={`${r.sifra_partnera}-${r.datum_razgovora}-${idx}`}
                      className="
                        rounded-xl border border-gray-200 bg-white
                        px-3 pb-3 pt-‚7
                        shadow-[0_1px_0_rgba(0,0,0,0.03)]
                        hover:border-[#785E9E]/40 hover:shadow-md
                        transition
                        flex flex-col
                        h-full
                      "
                    >
                      {/* Header */}
                        <div className="flex items-center justify-between gap-2 leading-none">
                          <div className="flex items-center gap-2 min-w-0 leading-none">

                            {/* Partner (gore lijevo) */}
                            <div className="min-w-0">
                              <div
                                className="inline-flex items-center gap-2 max-w-full px-2 py-1 rounded-lg
                                          bg-[#785E9E]/10 border border-[#785E9E]/20"
                              >
                                <span className="text-xs md:text-sm font-semibold text-[#5d4a7a] truncate">
                                  {r.sifra_partnera} {r.naziv_partnera}
                                </span>
                              </div>
                            </div>

                          </div>

                          {/* Datum (gore desno) */}
                          <div className="text-[11px] md:text-xs font-semibold whitespace-nowrap
                                          text-[#5d4a7a] bg-[#785E9E]/10 border border-[#785E9E]/20
                                          px-2 py-0.5 rounded-full">
                            {formatDate(r.datum_razgovora)}
                          </div>
                        </div>

                      {/* Poruka (crna) */}
                      <div className="mt-2 flex-1 text-xs md:text-sm text-gray-900 whitespace-pre-wrap break-words">
                        {r.podaci_razgovora}
                      </div>

                      {/* Footer: dole desno radnik - u boji */}
                        <div className="mt-2 flex justify-end">
                          <div className="text-[11px] md:text-xs font-semibold text-[#785E9E]">
                            {r.naziv_radnika}
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
      </div>
    </div>
  );
};

export default IzvjestajAdmin;