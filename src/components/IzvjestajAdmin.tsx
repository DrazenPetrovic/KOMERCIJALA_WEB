import React, { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../utils/auth";
import {
  Calendar,
  Filter,
  Sparkles,
  TrendingUp,
  TrendingDown,
  User,
  AlertCircle,
  X,
} from "lucide-react";

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
  sifra_tabele?: number;
  sifra_radnika: number;
  naziv_radnika: string;
  sifra_partnera: number;
  naziv_partnera: string;
  grad_partnera?: string;
  datum_razgovora: string;
  podaci_razgovora: string;
  ocj_sveobuhvatnost?: number;
  ocj_relevantnost?: number;
  ocj_komentar?: string;
}

interface PartnerReportResponseRow {
  sifra_tabele?: number;
  id_tabele?: number;
  id_izvjestaja?: number;
  sifra_radnika?: number;
  naziv_radnika?: string;
  naziv_komercijaliste?: string;
  radnik?: string;
  sifra_partnera?: number;
  naziv_partnera?: string;
  Naziv_grada?: string;
  naziv_grada?: string;
  grad_partnera?: string;
  datum_razgovora?: string;
  datum_izvjestaja?: string;
  podaci_razgovora?: string;
  podaci_izvjestaja?: string;
  podaci?: string;
  tekst?: string;
  ocj_sveobuhvatnost?: number;
  ocj_relevantnost?: number;
  ocj_komentar?: string;
}

interface RatingDraft {
  sveobuhvatnost: number;
  relevantnost: number;
  komentar: string;
  saving: boolean;
}

interface OcjenaAdmina {
  id_izvjestaja: number;
  naziv_admina: string;
  sveobuhvatnost: number;
  relevantnost: number;
  komentar?: string;
}

const mockAIAnalysis = {
  summary:
    "Prodaja danas pokazuje pozitivan trend sa povećanjem od 15% u odnosu na prošli dan. Ana Anić je postigla najbolje rezultate.",
  highlights: [
    { type: "positive", text: "Prosječna vrijednost transakcije: 2,130.00 KM" },
    { type: "positive", text: "Ukupno stavki obrađeno: 45" },
    { type: "warning", text: "Nabavka ispod očekivanog nivoa" },
  ],
  trend: "up" as const,
};

type PartnerKey = { sifra_partnera: number; naziv_partnera: string; grad_partnera?: string } | null;

const toISODate = (raw: unknown): string => {
  const s = String(raw || "");
  if (!s) return "";
  const dots = s.split(".");
  if (dots.length === 3 && dots[2].length === 4) {
    return `${dots[2]}-${dots[1].padStart(2, "0")}-${dots[0].padStart(2, "0")}`;
  }
  return s.split(/[T ]/)[0];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapIzvjestajRow = (row: any): IzvjestajRow => {
  const idRaw = row.sifra_tabele ?? row.id_tabele ?? row.id_izvjestaja;
  return {
    sifra_tabele: idRaw != null ? Number(idRaw) : undefined,
    sifra_radnika: Number(row.sifra_radnika || 0),
    naziv_radnika: row.naziv_radnika || row.naziv_komercijaliste || row.radnik || "",
    sifra_partnera: Number(row.sifra_partnera || 0),
    naziv_partnera: row.naziv_partnera || "",
    grad_partnera: row.Naziv_grada || row.naziv_grada || row.grad_partnera || row.grad || "",
    datum_razgovora: toISODate(row.datum_razgovora || row.datum_izvjestaja),
    podaci_razgovora: String(row.podaci_razgovora || row.podaci_izvjestaja || row.podaci || row.tekst || ""),
    ocj_sveobuhvatnost: row.ocj_sveobuhvatnost ? Number(row.ocj_sveobuhvatnost) : undefined,
    ocj_relevantnost: row.ocj_relevantnost ? Number(row.ocj_relevantnost) : undefined,
    ocj_komentar: row.ocj_komentar ?? undefined,
  };
};

const IzvjestajAdmin: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>("2026-02-20");
  const [dateRangeStart, setDateRangeStart] = useState<string>("");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>("");
  const [selectedWorker, setSelectedWorker] = useState<string>("");
  const [izvjestaji, setIzvjestaji] = useState<IzvjestajRow[]>([]);
  const [loadingIzvjestaji, setLoadingIzvjestaji] = useState(false);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [dateMode, setDateMode] = useState<"day" | "range">("day");
  const [komercijalisti, setKomercijalisti] = useState<Komercijalist[]>([]);
  const [cardRows, setCardRows] = useState<IzvjestajRow[]>([]);

  const [ratingDraft, setRatingDraft] = useState<Record<string, RatingDraft>>({});
  const [ratedKeys, setRatedKeys] = useState<Set<string>>(new Set());
  const [ocjeneMap, setOcjeneMap] = useState<Record<number, { sveobuhvatnost: number; relevantnost: number; komentar: string }>>({});
  const [allOcjeneMap, setAllOcjeneMap] = useState<Record<number, OcjenaAdmina[]>>({});

  // NEW: modal state
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [activePartner, setActivePartner] = useState<PartnerKey>(null);
  const [partnerModalRows, setPartnerModalRows] = useState<IzvjestajRow[]>([]);
  const [loadingPartnerRows, setLoadingPartnerRows] = useState(false);
  const [modalOcjeneMap, setModalOcjeneMap] = useState<Record<number, OcjenaAdmina[]>>({});

  const fetchIzvjestajiByDate = async (
    start: string,
    end: string,
  ): Promise<IzvjestajRow[]> => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

    const res = await fetch(
      `${apiUrl}/api/izvjestaji/izvjestaj-datum/${start}/${end}`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      },
    );

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error || "Greška pri učitavanju izvještaja");
    }

    return (json.data || []).map(mapIzvjestajRow);
  };

  useEffect(() => {
    const fetchKomercijalisti = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/izvjestaji/komercijalisti`, {
          credentials: "include",
        });
        const json = await res.json();
        if (json.success) setKomercijalisti(json.data);
      } catch (err) {
        console.error("Greška pri učitavanju komercijalista:", err);
      }
    };

    const fetchIzvjestajiPoslednji = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
        setLoadingIzvjestaji(true);

        const res = await fetch(
          `${apiUrl}/api/izvjestaji/izvjestaj-poslednji`,
          {
            credentials: "include",
          },
        );

        const json = await res.json();

        if (json.success) {
          const data: IzvjestajRow[] = (json.data || []).map(mapIzvjestajRow);
          setIzvjestaji(data);

          const firstDate = data?.[0]?.datum_razgovora?.slice(0, 10);

          if (firstDate) {
            setSelectedDate(firstDate);
            const baseInit = data.filter(
              (r) => r.datum_razgovora.slice(0, 10) === firstDate,
            );
            setCardRows(baseInit);
            buildDetaljiTable(baseInit, formatDate(firstDate));
          } else {
            setCardRows([]);
            setFilteredReports([]);
          }

          applyFiltersWithData(data, {
            dateMode: "day",
            selectedDate: firstDate || "2026-02-20",
            dateRangeStart: "",
            dateRangeEnd: "",
            selectedWorker: "",
          });

          if (firstDate) fetchOcjene();
        } else {
          setIzvjestaji([]);
          setFilteredReports([]);
        }
      } catch (e) {
        console.error("Greška izvjestaji poslednji:", e);
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

  const parseDatumForSort = (datum: string): number => {
    if (!datum) return 0;
    const parts = datum.split(".");
    if (parts.length === 3 && parts[2].length === 4) {
      return new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`).getTime();
    }
    return new Date(datum).getTime() || 0;
  };

  const formatDate = (input?: string): string => {
    if (!input) return "";
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(input)) return input;
    const datePart = input.split(/[T ]/)[0];
    const [y, m, d] = datePart.split("-");
    if (y?.length === 4 && m && d) {
      return `${d.slice(0, 2).padStart(2, "0")}.${m.padStart(2, "0")}.${y}`;
    }
    return input;
  };

  const formatRangeLabel = (start?: string, end?: string): string => {
    if (!start || !end) return "";
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
      category: "",
    }));

    table.sort((a, b) => b.items - a.items);
    setFilteredReports(table);
  };

  const applyFiltersWithData = (
    data: IzvjestajRow[],
    params: {
      dateMode: "day" | "range";
      selectedDate: string;
      dateRangeStart: string;
      dateRangeEnd: string;
      selectedWorker: string;
    },
  ) => {
    let base = [...data];

    let dateLabel = "";
    if (params.dateMode === "range") {
      if (params.dateRangeStart && params.dateRangeEnd) {
        base = base.filter((r) => {
          const d = r.datum_razgovora.slice(0, 10);
          return d >= params.dateRangeStart && d <= params.dateRangeEnd;
        });
        dateLabel = formatRangeLabel(
          params.dateRangeStart,
          params.dateRangeEnd,
        );
      } else {
        base = [];
        dateLabel = "";
      }
    } else {
      if (params.selectedDate) {
        base = base.filter(
          (r) => r.datum_razgovora.slice(0, 10) === params.selectedDate,
        );
        dateLabel = formatDate(params.selectedDate);
      } else {
        base = [];
        dateLabel = "";
      }
    }

    if (params.selectedWorker) {
      base = base.filter((r) => r.naziv_radnika === params.selectedWorker);
    }

    setCardRows(base);
    buildDetaljiTable(base, dateLabel);

    // NEW: ako je modal otvoren i promijeniš filtere, možeš ga automatski zatvoriti
    // da ne prikazuje "stare" podatke (opcionalno).
    setPartnerModalOpen(false);
    setActivePartner(null);
  };

  const applyFilters = async () => {
    try {
      setLoadingIzvjestaji(true);

      let start = "";
      let end = "";

      if (dateMode === "day") {
        if (!selectedDate) {
          applyFiltersWithData([], {
            dateMode,
            selectedDate,
            dateRangeStart,
            dateRangeEnd,
            selectedWorker,
          });
          return;
        }
        start = selectedDate;
        end = selectedDate;
      } else {
        if (!dateRangeStart || !dateRangeEnd) {
          applyFiltersWithData([], {
            dateMode,
            selectedDate,
            dateRangeStart,
            dateRangeEnd,
            selectedWorker,
          });
          return;
        }
        start = dateRangeStart;
        end = dateRangeEnd;
      }

      const data = await fetchIzvjestajiByDate(start, end);
      setIzvjestaji(data);

      // Backend je već filtrirao po datumu — samo filtriramo po komercijalisti lokalno
      const base = selectedWorker
        ? data.filter((r) => r.naziv_radnika === selectedWorker)
        : data;
      setCardRows(base);
      buildDetaljiTable(base, dateMode === "range" ? formatRangeLabel(start, end) : formatDate(start));
      setPartnerModalOpen(false);
      setActivePartner(null);

      fetchOcjene();
    } catch (e) {
      console.error("Greška pri primjeni filtera:", e);
      applyFiltersWithData([], {
        dateMode,
        selectedDate,
        dateRangeStart,
        dateRangeEnd,
        selectedWorker,
      });
    } finally {
      setLoadingIzvjestaji(false);
    }
  };

  // Modal: ignoriše datum/period filter, ali poštuje komercijalistu ako je odabran.
  const partnerRows = useMemo(() => {
    const selectedWorkerNormalized = selectedWorker.trim().toLowerCase();

    return partnerModalRows
      .filter((r) => {
        if (!selectedWorkerNormalized) return true;

        const rowWorker = (r.naziv_radnika || "").trim().toLowerCase();

        // Ako backend ne vrati naziv radnika u istoriji partnera, nemamo osnov za filter.
        if (!rowWorker) return true;

        return rowWorker === selectedWorkerNormalized;
      })
      .slice()
      .sort(
        (a, b) =>
          parseDatumForSort(b.datum_razgovora) -
          parseDatumForSort(a.datum_razgovora),
      );
  }, [partnerModalRows, selectedWorker]);

  const fetchPartnerReports = async (
    sifraPartnera: number,
  ): Promise<IzvjestajRow[]> => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

    const res = await fetch(`${apiUrl}/api/izvjestaji/${sifraPartnera}`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(
        json?.error || "Greška pri učitavanju izvještaja partnera",
      );
    }

    const rows = (json.data || []) as PartnerReportResponseRow[];
    return rows.map((row) => {
      const idRaw = row.sifra_tabele ?? row.id_tabele ?? (row as any).id_izvjestaja;
      return {
        sifra_tabele: idRaw != null ? Number(idRaw) : undefined,
        sifra_radnika: Number(row.sifra_radnika || 0),
        naziv_radnika: row.naziv_radnika || row.naziv_komercijaliste || row.radnik || "",
        sifra_partnera: Number(row.sifra_partnera || sifraPartnera),
        naziv_partnera: row.naziv_partnera || "",
        grad_partnera: row.Naziv_grada || row.naziv_grada || row.grad_partnera || "",
        datum_razgovora: toISODate(row.datum_razgovora || row.datum_izvjestaja),
        podaci_razgovora: String(
          row.podaci_razgovora || row.podaci_izvjestaja || row.podaci || row.tekst || "",
        ),
        ocj_sveobuhvatnost: row.ocj_sveobuhvatnost ? Number(row.ocj_sveobuhvatnost) : undefined,
        ocj_relevantnost: row.ocj_relevantnost ? Number(row.ocj_relevantnost) : undefined,
        ocj_komentar: row.ocj_komentar ?? undefined,
      };
    });
  };

  const openPartnerModal = async (r: IzvjestajRow) => {
    setActivePartner({
      sifra_partnera: r.sifra_partnera,
      naziv_partnera: r.naziv_partnera,
      grad_partnera: r.grad_partnera,
    });
    setPartnerModalRows([]);
    setModalOcjeneMap({});
    setPartnerModalOpen(true);
    setLoadingPartnerRows(true);

    try {
      const rows = await fetchPartnerReports(r.sifra_partnera);

      setPartnerModalRows(rows);
      if (!r.grad_partnera && rows.length > 0 && rows[0].grad_partnera) {
        setActivePartner((prev) =>
          prev ? { ...prev, grad_partnera: rows[0].grad_partnera } : prev,
        );
      }

      const partnerIds = new Set(rows.map((row) => row.sifra_tabele).filter(Boolean) as number[]);
      const map: Record<number, OcjenaAdmina[]> = {};
      for (const id of partnerIds) {
        if (allOcjeneMap[id]) map[id] = allOcjeneMap[id];
      }
      setModalOcjeneMap(map);
    } catch (err) {
      console.error("Greška pri učitavanju partner izvještaja:", err);
      setPartnerModalRows([]);
    } finally {
      setLoadingPartnerRows(false);
    }
  };

  const fetchOcjene = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/izvjestaji/ocjene`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        const currentAdminId = getCurrentUser()?.sifraRadnika;
        const myMap: Record<number, { sveobuhvatnost: number; relevantnost: number; komentar: string }> = {};
        const allMap: Record<number, OcjenaAdmina[]> = {};

        for (const o of json.data) {
          const id = Number(o.id_izvjestaja);

          if (!allMap[id]) allMap[id] = [];
          allMap[id].push({
            id_izvjestaja: id,
            naziv_admina: o.naziv_radnika || "Admin",
            sveobuhvatnost: Number(o.sveobuhvatnost),
            relevantnost: Number(o.relevantnost),
            komentar: o.komentar ?? undefined,
          });

          if (currentAdminId && Number(o.id_admina) === currentAdminId) {
            myMap[id] = {
              sveobuhvatnost: Number(o.sveobuhvatnost),
              relevantnost: Number(o.relevantnost),
              komentar: o.komentar ?? "",
            };
          }
        }

        setOcjeneMap(myMap);
        setAllOcjeneMap(allMap);
      }
    } catch (err) {
      console.error("Greška pri učitavanju ocjena:", err);
    }
  };

const getDraft = (key: string, row: IzvjestajRow): RatingDraft => {
    if (ratingDraft[key]) return ratingDraft[key];
    const idIzv = Number(row.sifra_tabele ?? (row as any).id_izvjestaja ?? 0);
    const ocjena = idIzv ? ocjeneMap[idIzv] : undefined;
    return {
      sveobuhvatnost: ocjena?.sveobuhvatnost ?? row.ocj_sveobuhvatnost ?? 0,
      relevantnost:   ocjena?.relevantnost   ?? row.ocj_relevantnost   ?? 0,
      komentar:       ocjena?.komentar       ?? row.ocj_komentar       ?? "",
      saving:         false,
    };
  };

  const updateRatingField = (key: string, row: IzvjestajRow, field: keyof Omit<RatingDraft, 'saving'>, value: string | number) => {
    setRatingDraft(prev => ({ ...prev, [key]: { ...getDraft(key, row), [field]: value } }));
  };

  const saveOcjena = async (sifraTabele: number, key: string, draft: RatingDraft) => {
    setRatingDraft(prev => ({ ...prev, [key]: { ...draft, saving: true } }));
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/izvjestaji/ocjena`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idIzvjestaja:   sifraTabele,
          sveobuhvatnost: draft.sveobuhvatnost,
          relevantnost:   draft.relevantnost,
          komentar:       draft.komentar || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Greška');
      setRatingDraft(prev => ({ ...prev, [key]: { ...draft, saving: false } }));
      setRatedKeys(prev => new Set(prev).add(key));
    } catch (err) {
      console.error('Greška pri ocjenjivanju:', err);
      setRatingDraft(prev => ({ ...prev, [key]: { ...draft, saving: false } }));
    }
  };

  const closePartnerModal = () => {
    setPartnerModalOpen(false);
    setActivePartner(null);
    setPartnerModalRows([]);
    setModalOcjeneMap({});
    setLoadingPartnerRows(false);
  };

  return (
    <div className="w-full bg-gray-50 p-2 md:p-3">
      <div className="max-w-[104rem] mx-auto space-y-3">
        {/* ... tvoj AI panel ostaje isti ... */}
        {/* ...AI ANALIZA ... */}
        <div className="bg-gradient-to-br from-[#785E9E] to-[#5d4a7a] rounded-lg shadow-lg p-3 md:p-4 text-white">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-base md:text-lg font-bold mb-1">
                AI Analiza
              </h2>
              <p className="text-purple-100 text-xs md:text-sm leading-relaxed">
                {mockAIAnalysis.summary}
              </p>
            </div>
            {mockAIAnalysis.trend === "up" ? (
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
                  highlight.type === "positive"
                    ? "bg-white/20 border border-white/30"
                    : "bg-orange-400/30 border border-orange-300/50"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{highlight.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ... tvoj filter panel ostaje isti ... */}
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm md:text-base font-semibold text-gray-900">
              Filteri
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5">
            <div className="lg:col-span-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDateMode("day");
                      setSelectedDate(selectedDate || "2026-02-20");
                      setDateRangeStart("");
                      setDateRangeEnd("");
                    }}
                    className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors ${
                      dateMode === "day"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Po danu
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDateMode("range");
                      setSelectedDate("");
                    }}
                    className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors ${
                      dateMode === "range"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Period
                  </button>
                </div>
              </div>

              {dateMode === "day" ? (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Datum
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setDateRangeStart("");
                        setDateRangeEnd("");
                      }}
                      className="w-full px-2.5 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#785E9E] focus:border-transparent [color:transparent] [&::-webkit-datetime-edit]:opacity-0"
                    />
                    <div className="absolute inset-0 px-2.5 flex items-center pointer-events-none text-xs md:text-sm">
                      {selectedDate
                        ? <span className="text-gray-800">{selectedDate.split("-").reverse().join(".")}</span>
                        : <span className="text-gray-400">dd.MM.yyyy</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Od Datuma
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dateRangeStart}
                        onChange={(e) => {
                          setDateRangeStart(e.target.value);
                          setSelectedDate("");
                        }}
                        className="w-full px-2.5 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#785E9E] focus:border-transparent [color:transparent] [&::-webkit-datetime-edit]:opacity-0"
                      />
                      <div className="absolute inset-0 px-2.5 flex items-center pointer-events-none text-xs md:text-sm">
                        {dateRangeStart
                          ? <span className="text-gray-800">{dateRangeStart.split("-").reverse().join(".")}</span>
                          : <span className="text-gray-400">dd.MM.yyyy</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Do Datuma
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dateRangeEnd}
                        onChange={(e) => {
                          setDateRangeEnd(e.target.value);
                          setSelectedDate("");
                        }}
                        className="w-full px-2.5 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#785E9E] focus:border-transparent [color:transparent] [&::-webkit-datetime-edit]:opacity-0"
                      />
                      <div className="absolute inset-0 px-2.5 flex items-center pointer-events-none text-xs md:text-sm">
                        {dateRangeEnd
                          ? <span className="text-gray-800">{dateRangeEnd.split("-").reverse().join(".")}</span>
                          : <span className="text-gray-400">dd.MM.yyyy</span>}
                      </div>
                    </div>
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
                {komercijalisti.map((k) => (
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
            {loadingIzvjestaji ? "Učitavanje..." : "Primijeni Filtere"}
          </button>
        </div>

        {/* Kartice */}
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-[#785E9E]/20">
          {cardRows.length === 0 ? (
            <div className="text-gray-500 text-xs md:text-sm">
              Nema podataka za odabrane filtere.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[13px]">
              {cardRows.map((r, idx) => (
                <div
                  key={`${r.sifra_partnera}-${r.datum_razgovora}-${idx}`}
                  className="rounded-xl border border-gray-200 bg-white px-[13px] pb-[13px] pt-[13px]
                             shadow-[0_1px_0_rgba(0,0,0,0.03)]
                             hover:border-[#785E9E]/40 hover:shadow-md transition flex flex-col h-full"
                >
                  <div className="flex items-center justify-between gap-2 leading-none">
                    <div className="flex items-center gap-2 min-w-0 leading-none">
                      <div className="min-w-0">
                        {/* NEW: partner clickable */}
                        <button
                          type="button"
                          onClick={() => openPartnerModal(r)}
                          className="inline-flex items-center gap-2 max-w-full px-2 py-1 rounded-lg
                                     bg-[#785E9E]/10 border border-[#785E9E]/20
                                     hover:bg-[#785E9E]/15"
                          title="Prikaži sve izvještaje za ovog partnera"
                        >
                          <span className="text-xs md:text-sm font-semibold text-[#5d4a7a] truncate">
                            {r.sifra_partnera} {r.naziv_partnera}
                          </span>
                          {r.grad_partnera && (
                            <span className="text-[10px] text-gray-500 truncate">
                              {r.grad_partnera}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    <div
                      className="text-[11px] md:text-xs font-semibold whitespace-nowrap
                                    text-[#5d4a7a] bg-[#785E9E]/10 border border-[#785E9E]/20
                                    px-2 py-0.5 rounded-full"
                    >
                      {formatDate(r.datum_razgovora)}
                    </div>
                  </div>

                  <div className="mt-2 flex-1 text-xs md:text-sm text-gray-900 whitespace-pre-wrap break-words">
                    {r.podaci_razgovora}
                  </div>

                  {(() => {
                    const idTabele = r.sifra_tabele ?? (r as any).id_tabele ?? (r as any).id_izvjestaja;
                    const key = String(idTabele ?? `${r.sifra_partnera}-${r.datum_razgovora}-${idx}`);
                    const draft = getDraft(key, r);
                    return (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        {(["relevantnost", "sveobuhvatnost"] as const).map((field) => (
                          <div key={field} className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-gray-500 w-24 capitalize">{field}</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => updateRatingField(key, r, field, n)}
                                  className={`w-5 h-5 rounded-full text-[10px] font-bold transition-colors ${
                                    draft[field] >= n
                                      ? "bg-[#785E9E] text-white"
                                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <textarea
                          value={draft.komentar}
                          onChange={(e) => updateRatingField(key, r, "komentar", e.target.value)}
                          placeholder="Komentar..."
                          rows={1}
                          className="w-full mt-1 px-2 py-1 text-[10px] border border-gray-200 rounded resize-none focus:outline-none focus:ring-1 focus:ring-[#785E9E]"
                        />
                        {(ratedKeys.has(key) || !!ocjeneMap[Number(idTabele)]) ? (
                          <span className="mt-1 inline-block text-[10px] text-green-600 font-semibold">✓ Ocijenjeno</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => idTabele && saveOcjena(Number(idTabele), key, draft)}
                            disabled={!draft.relevantnost || !draft.sveobuhvatnost || draft.saving || !idTabele}
                            className="mt-1 px-3 py-0.5 text-[10px] bg-[#785E9E] text-white rounded-lg hover:bg-[#6b5088] disabled:opacity-40 transition-colors"
                          >
                            {draft.saving ? "Snimanje..." : "Ocijeni"}
                          </button>
                        )}
                      </div>
                    );
                  })()}

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

        {/* NEW: Modal */}
        {partnerModalOpen && activePartner && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3"
            onClick={closePartnerModal}
          >
            <div
              className="w-full max-w-3xl bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    Partner: {activePartner.sifra_partnera}{" "}
                    {activePartner.naziv_partnera}
                    {activePartner.grad_partnera && (
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        — {activePartner.grad_partnera}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Prikazano unutar trenutnih filtera
                    (datum/period/komercijalista)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closePartnerModal}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Zatvori"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 max-h-[70vh] overflow-auto">
                {loadingPartnerRows ? (
                  <div className="text-xs text-gray-500">Učitavanje...</div>
                ) : partnerRows.length === 0 ? (
                  <div className="text-xs text-gray-500">
                    Nema izvještaja za ovog partnera (po izabranom
                    komercijalisti).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {partnerRows.map((r, i) => (
                      <div
                        key={`${r.datum_razgovora}-${i}`}
                        className="border rounded-lg p-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-[#785E9E]">
                            {r.naziv_radnika}
                          </div>
                          <div className="text-[11px] font-semibold text-gray-600">
                            {formatDate(r.datum_razgovora)}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-900 whitespace-pre-wrap break-words">
                          {r.podaci_razgovora}
                        </div>
                        {(() => {
                          const idIzv = r.sifra_tabele;
                          const ocjene = idIzv ? (modalOcjeneMap[idIzv] || []) : [];
                          if (ocjene.length === 0) return null;
                          return (
                            <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                              <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Ocjene admina</div>
                              {ocjene.map((o, oi) => (
                                <div key={oi} className="bg-purple-50 border border-purple-100 rounded-lg px-2 py-1.5">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-[10px] font-semibold text-[#785E9E]">{o.naziv_admina}</span>
                                    <div className="flex gap-2 text-[10px] text-gray-500">
                                      <span>Rel: <span className="font-bold text-[#785E9E]">{o.relevantnost}/5</span></span>
                                      <span>Svh: <span className="font-bold text-[#785E9E]">{o.sveobuhvatnost}/5</span></span>
                                    </div>
                                  </div>
                                  {o.komentar && (
                                    <p className="text-[10px] italic text-gray-500 break-words">{o.komentar}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-t flex justify-end">
                <button
                  type="button"
                  onClick={closePartnerModal}
                  className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Nazad
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IzvjestajAdmin;
