import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KretanjeProizvodaAdmin from "./KretanjeProizvodaAdmin";

type PoslovanjeSekcija = "poslovanje" | "sekcija_2" | "sekcija_3" | "sekcija_4";
type ViewMode = "month" | "quarter" | "year";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
};

type AdminApiRow = {
  sifra_radnika: number | string;
  mjesec_racuna?: number | string;
  mjesec_uplate?: number | string;
  godina_racuna?: number | string;
  godina_uplate?: number | string;
  ukupno: number | string;
};

type NormalizedRow = {
  sifraRadnika: number;
  godina: number;
  mjesec: number;
  ukupno: number;
};

type AggregatedRow = {
  key: string;
  periodLabel: string;
  godina: number;
  mjesec?: number;
  quarter?: number;
  total: number;
  byWorker: Record<string, number>;
};

const BRAND_PRIMARY = "#785E9E";
const SUM_IZDANI_COLOR = "#000000";
const SUM_NAPLATA_COLOR = "#DC2626";
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const poslovanjeButtons: { id: PoslovanjeSekcija; label: string }[] = [
  { id: "poslovanje", label: "POSLOVANJE" },
  { id: "sekcija_2", label: "KRETANJE PROIZVODA" },
  { id: "sekcija_3", label: "SEKCIJA 3" },
  { id: "sekcija_4", label: "SEKCIJA 4" },
];

const toNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const format2 = (value: unknown) => numberFormatter.format(toNumber(value));

const formatMonthKey = (godina: number, mjesec: number) =>
  `${godina}-${String(mjesec).padStart(2, "0")}`;

const getCurrentYearMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const createMonthsInRange = (
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
) => {
  const range: Array<{ godina: number; mjesec: number }> = [];
  let year = startYear;
  let month = startMonth;

  for (let i = 0; i < 240; i += 1) {
    range.push({ godina: year, mjesec: month });
    if (year === endYear && month === endMonth) break;

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return range;
};

const normalizeAdminRows = (rows: AdminApiRow[]): NormalizedRow[] => {
  return rows
    .map((row) => {
      const mjesec = toNumber(row.mjesec_racuna ?? row.mjesec_uplate);
      const godina = toNumber(row.godina_racuna ?? row.godina_uplate);

      return {
        sifraRadnika: toNumber(row.sifra_radnika),
        mjesec,
        godina,
        ukupno: toNumber(row.ukupno),
      };
    })
    .filter((row) => row.mjesec >= 1 && row.mjesec <= 12 && row.godina > 0);
};

const aggregateRows = (rows: NormalizedRow[], viewMode: ViewMode) => {
  const map = new Map<string, AggregatedRow>();

  for (const row of rows) {
    const quarter = Math.floor((row.mjesec - 1) / 3) + 1;
    const key =
      viewMode === "month"
        ? `${row.godina}-${String(row.mjesec).padStart(2, "0")}`
        : viewMode === "quarter"
          ? `${row.godina}-Q${quarter}`
          : `${row.godina}`;
    const periodLabel =
      viewMode === "month"
        ? `${MONTHS[row.mjesec - 1]} ${row.godina}`
        : viewMode === "quarter"
          ? `Q${quarter} ${row.godina}`
          : String(row.godina);

    const existing = map.get(key);
    if (existing) {
      existing.total += row.ukupno;
      const workerKey = String(row.sifraRadnika);
      existing.byWorker[workerKey] =
        (existing.byWorker[workerKey] ?? 0) + row.ukupno;
      continue;
    }

    map.set(key, {
      key,
      periodLabel,
      godina: row.godina,
      mjesec: viewMode === "month" ? row.mjesec : undefined,
      quarter: viewMode === "quarter" ? quarter : undefined,
      total: row.ukupno,
      byWorker: { [String(row.sifraRadnika)]: row.ukupno },
    });
  }

  const aggregated = Array.from(map.values());
  aggregated.sort((a, b) => {
    if (viewMode === "year") return b.godina - a.godina;
    if (viewMode === "quarter") {
      if (a.godina !== b.godina) return b.godina - a.godina;
      return (b.quarter ?? 0) - (a.quarter ?? 0);
    }

    if (a.godina !== b.godina) return b.godina - a.godina;
    return (b.mjesec ?? 0) - (a.mjesec ?? 0);
  });

  return aggregated;
};

const fillMissingPeriods = (rows: NormalizedRow[]) => {
  const { year: endYear, month: endMonth } = getCurrentYearMonth();
  const startYear = endYear - 3;
  const months = createMonthsInRange(startYear, 1, endYear, endMonth);

  const byPeriod = new Map<string, NormalizedRow[]>();
  for (const row of rows) {
    const key = formatMonthKey(row.godina, row.mjesec);
    const current = byPeriod.get(key) ?? [];
    current.push(row);
    byPeriod.set(key, current);
  }

  const expanded: NormalizedRow[] = [];
  for (const period of months) {
    const key = formatMonthKey(period.godina, period.mjesec);
    const periodRows = byPeriod.get(key);
    if (periodRows && periodRows.length > 0) {
      expanded.push(...periodRows);
      continue;
    }

    expanded.push({
      sifraRadnika: 0,
      godina: period.godina,
      mjesec: period.mjesec,
      ukupno: 0,
    });
  }

  return expanded;
};

export default function PoslovanjeAdmin() {
  const [activeSection, setActiveSection] =
    useState<PoslovanjeSekcija>("poslovanje");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedWorker, setSelectedWorker] = useState<string>("sum");
  const [izdaniRows, setIzdaniRows] = useState<NormalizedRow[]>([]);
  const [naplataRows, setNaplataRows] = useState<NormalizedRow[]>([]);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [resIzdani, resNaplata] = await Promise.all([
          fetch(`${apiUrl}/api/poslovanje/izdani-racuni-admin`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
          fetch(`${apiUrl}/api/poslovanje/naplata-racuna-admin`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
        ]);

        const jsonIzdani = (await resIzdani.json()) as ApiResponse<
          AdminApiRow[]
        >;
        const jsonNaplata = (await resNaplata.json()) as ApiResponse<
          AdminApiRow[]
        >;

        if (!resIzdani.ok || !jsonIzdani.success) {
          throw new Error(
            jsonIzdani.error || "Greška pri učitavanju admin izdanih računa",
          );
        }
        if (!resNaplata.ok || !jsonNaplata.success) {
          throw new Error(
            jsonNaplata.error || "Greška pri učitavanju admin naplate računa",
          );
        }

        const normalizedIzdani = normalizeAdminRows(jsonIzdani.data ?? []);
        const normalizedNaplata = normalizeAdminRows(jsonNaplata.data ?? []);

        setIzdaniRows(normalizedIzdani);
        setNaplataRows(normalizedNaplata);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Nepoznata greška");
        setIzdaniRows([]);
        setNaplataRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  const workers = useMemo(() => {
    const set = new Set<number>();
    for (const row of [...izdaniRows, ...naplataRows]) {
      if (row.sifraRadnika > 0) set.add(row.sifraRadnika);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [izdaniRows, naplataRows]);

  const izdaniChartRows = useMemo(() => {
    const completeRows = fillMissingPeriods(izdaniRows);
    return aggregateRows(completeRows, viewMode);
  }, [izdaniRows, viewMode]);

  const naplataChartRows = useMemo(() => {
    const completeRows = fillMissingPeriods(naplataRows);
    return aggregateRows(completeRows, viewMode);
  }, [naplataRows, viewMode]);

  const combinedRows = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        periodLabel: string;
        izdaniTotal: number;
        naplataTotal: number;
        izdaniByWorker: Record<string, number>;
        naplataByWorker: Record<string, number>;
      }
    >();

    for (const row of izdaniChartRows) {
      map.set(row.key, {
        key: row.key,
        periodLabel: row.periodLabel,
        izdaniTotal: row.total,
        naplataTotal: 0,
        izdaniByWorker: row.byWorker,
        naplataByWorker: {},
      });
    }

    for (const row of naplataChartRows) {
      const existing = map.get(row.key);
      if (existing) {
        existing.naplataTotal = row.total;
        existing.naplataByWorker = row.byWorker;
      } else {
        map.set(row.key, {
          key: row.key,
          periodLabel: row.periodLabel,
          izdaniTotal: 0,
          naplataTotal: row.total,
          izdaniByWorker: {},
          naplataByWorker: row.byWorker,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => (a.key > b.key ? -1 : 1));
  }, [izdaniChartRows, naplataChartRows]);

  const chartData = useMemo(() => {
    const isSumSelected = selectedWorker === "sum";

    return combinedRows.map((row) => ({
      key: row.key,
      periodLabel: row.periodLabel,
      total_izdani: isSumSelected
        ? row.izdaniTotal
        : (row.izdaniByWorker[selectedWorker] ?? 0),
      total_naplata: isSumSelected
        ? row.naplataTotal
        : (row.naplataByWorker[selectedWorker] ?? 0),
    }));
  }, [combinedRows, selectedWorker]);

  const tableRows = useMemo(() => {
    if (selectedWorker === "sum") {
      return combinedRows.map((row) => ({
        key: `sum-${row.key}`,
        periodLabel: row.periodLabel,
        izdani: row.izdaniTotal,
        naplata: row.naplataTotal,
      }));
    }

    return combinedRows.map((row) => ({
      key: `${selectedWorker}-${row.key}`,
      periodLabel: row.periodLabel,
      izdani: row.izdaniByWorker[selectedWorker] ?? 0,
      naplata: row.naplataByWorker[selectedWorker] ?? 0,
    }));
  }, [combinedRows, selectedWorker]);

  return (
    <section className="w-full">
      <div className="mt-1 md:mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
        {poslovanjeButtons.map((button) => {
          const isActive = activeSection === button.id;

          return (
            <button
              key={button.id}
              type="button"
              onClick={() => setActiveSection(button.id)}
              className={`w-full rounded-xl px-3 py-3 md:py-4 text-sm md:text-base font-semibold transition-all border ${
                isActive
                  ? "text-white shadow"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: BRAND_PRIMARY,
                      borderColor: BRAND_PRIMARY,
                    }
                  : undefined
              }
            >
              {button.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 md:mt-6">
        {activeSection === "poslovanje" ? (
          <div
            className="w-full bg-gray-50 p-2 md:p-3 rounded-2xl border"
            style={{ borderColor: `${BRAND_PRIMARY}33` }}
          >
            <div className="w-full mx-auto space-y-3">
              <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-gray-200">
                <div className="flex items-center gap-2 flex-wrap justify-between">
                  <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setViewMode("month")}
                      className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                        viewMode === "month"
                          ? "text-white"
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                      style={
                        viewMode === "month"
                          ? { backgroundColor: BRAND_PRIMARY }
                          : { backgroundColor: "transparent" }
                      }
                    >
                      MJESEČNO
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("quarter")}
                      className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                        viewMode === "quarter"
                          ? "text-white"
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                      style={
                        viewMode === "quarter"
                          ? { backgroundColor: "#5D4A7A" }
                          : { backgroundColor: "transparent" }
                      }
                    >
                      KVARTALNO
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("year")}
                      className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                        viewMode === "year"
                          ? "text-white"
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                      style={
                        viewMode === "year"
                          ? { backgroundColor: "#111827" }
                          : { backgroundColor: "transparent" }
                      }
                    >
                      GODINA
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    {loading ? "Učitavanje..." : "Podaci učitani"}
                  </div>
                </div>
              </div>

              {error ? (
                <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-3 border-b flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">
                      Tabela
                    </div>
                    <div className="text-xs text-gray-500">
                      {tableRows.length}
                    </div>
                  </div>

                  <div className="max-h-[58vh] lg:max-h-[72vh] overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50 border-b">
                        <tr className="text-left">
                          <th className="p-2">
                            {viewMode === "month"
                              ? "Mjesec/Godina"
                              : viewMode === "quarter"
                                ? "Kvartal"
                                : "Godina"}
                          </th>
                          <th className="p-2">Izdani računi</th>
                          <th className="p-2">Naplata</th>
                        </tr>
                      </thead>

                      <tbody>
                        {tableRows.map((row) => (
                          <tr
                            key={row.key}
                            className="border-b last:border-b-0 hover:bg-gray-50"
                          >
                            <td className="p-2 font-semibold text-gray-800 whitespace-nowrap">
                              {row.periodLabel}
                            </td>
                            <td
                              className="p-2 whitespace-nowrap font-semibold"
                              style={{ color: SUM_IZDANI_COLOR }}
                            >
                              {format2(row.izdani)}
                            </td>
                            <td
                              className="p-2 whitespace-nowrap font-semibold"
                              style={{ color: SUM_NAPLATA_COLOR }}
                            >
                              {format2(row.naplata)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-9 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-3 border-b flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm font-semibold text-gray-900">
                      Grafikon (
                      {selectedWorker === "sum"
                        ? "Zbirno"
                        : `Radnik ${selectedWorker}`}
                      )
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <label htmlFor="worker-filter" className="text-gray-600">
                        Filter:
                      </label>
                      <select
                        id="worker-filter"
                        value={selectedWorker}
                        onChange={(e) => setSelectedWorker(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2"
                        style={{
                          borderColor: `${BRAND_PRIMARY}55`,
                          boxShadow: "none",
                        }}
                      >
                        <option value="sum">Zbirno (svi radnici)</option>
                        {workers.map((workerId) => (
                          <option key={workerId} value={String(workerId)}>
                            Radnik {workerId}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="w-full h-[340px] sm:h-[380px] lg:h-[520px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="periodLabel"
                            tick={{ fontSize: 11 }}
                            interval={viewMode === "month" ? 2 : 0}
                            height={40}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value, name) => {
                              const safeName =
                                typeof name === "string" ? name : "";
                              const label =
                                safeName === "total_izdani"
                                  ? selectedWorker === "sum"
                                    ? "Zbirno Izdani"
                                    : `Radnik ${selectedWorker} - Izdani`
                                  : safeName === "total_naplata"
                                    ? selectedWorker === "sum"
                                      ? "Zbirno Naplata"
                                      : `Radnik ${selectedWorker} - Naplata`
                                    : safeName;
                              return [format2(value ?? 0), label];
                            }}
                          />
                          <Legend
                            formatter={(value) => {
                              if (value === "total_izdani") {
                                return selectedWorker === "sum"
                                  ? "Zbirno Izdani"
                                  : `Radnik ${selectedWorker} - Izdani`;
                              }
                              if (value === "total_naplata") {
                                return selectedWorker === "sum"
                                  ? "Zbirno Naplata"
                                  : `Radnik ${selectedWorker} - Naplata`;
                              }
                              return value;
                            }}
                          />

                          <Line
                            type="monotone"
                            dataKey="total_izdani"
                            name="total_izdani"
                            stroke={SUM_IZDANI_COLOR}
                            strokeWidth={4.5}
                            dot={{
                              r: 4,
                              fill: SUM_IZDANI_COLOR,
                              stroke: "#FFFFFF",
                              strokeWidth: 1.5,
                            }}
                            activeDot={{ r: 6 }}
                          />

                          <Line
                            type="monotone"
                            dataKey="total_naplata"
                            name="total_naplata"
                            stroke={SUM_NAPLATA_COLOR}
                            strokeWidth={4.5}
                            dot={{
                              r: 4,
                              fill: SUM_NAPLATA_COLOR,
                              stroke: "#FFFFFF",
                              strokeWidth: 1.5,
                            }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeSection === "sekcija_2" ? (
          <div
            className="w-full bg-gray-50 p-2 md:p-3 rounded-2xl border"
            style={{ borderColor: `${BRAND_PRIMARY}33` }}
          >
            <KretanjeProizvodaAdmin />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              U pripremi
            </h3>
            <p className="mt-2 text-sm md:text-base text-gray-600">
              Za ovu sekciju još nisu definisani sadržaj i forma.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
