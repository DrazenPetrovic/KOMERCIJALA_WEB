import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type IzdaniRow = {
  mjesec_racuna: number | string;
  godina_racuna: number | string;
  ukupno: number | string;
};

type NaplataRow = {
  mjesec_uplate: number | string;
  godina_uplate: number | string;
  ukupno: number | string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
};

type CombinedRow = {
  key: string; // YYYY-MM
  mjesec: string; // JAN, FEB...
  godina: number;
  izdani: number;
  naplata: number;
};

type DisplayRow = {
  key: string;
  godina: number;
  periodLabel: string; // "MAR 2026", "Q1 2025", "2024"
  izdani: number;
  naplata: number;
  realizacija?: number;
};

type ViewMode = "month" | "quarter" | "year" | "realization";

const COLOR_ISSUED = "#2563EB";
const COLOR_PAID = "#F97316";
const COLOR_REALIZATION = "#16A34A";

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

const toNumber = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const format2 = (v: unknown) => toNumber(v).toFixed(2);

const formatKey = (mjesec: number, godina: number) =>
  `${godina}-${String(mjesec).padStart(2, "0")}`;

const getCurrentYearMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month1to12: now.getMonth() + 1 };
};

const createMonthsFromToInclusive = (
  startYear: number,
  startMonth1to12: number,
  endYear: number,
  endMonth1to12: number,
) => {
  const result: { godina: number; mjesecNum: number }[] = [];
  let y = startYear;
  let m = startMonth1to12;

  for (let i = 0; i < 240; i++) {
    result.push({ godina: y, mjesecNum: m });
    if (y === endYear && m === endMonth1to12) break;

    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
  return result;
};

export default function PoslovanjeKorisnici() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [izdani, setIzdani] = useState<IzdaniRow[]>([]);
  const [naplata, setNaplata] = useState<NaplataRow[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [resIzdani, resNaplata] = await Promise.all([
          fetch(`${apiUrl}/api/poslovanje/izdani-racuni`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
          fetch(`${apiUrl}/api/poslovanje/naplata-racuna`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
        ]);

        const jsonIzdani = (await resIzdani.json()) as ApiResponse<IzdaniRow[]>;
        const jsonNaplata = (await resNaplata.json()) as ApiResponse<
          NaplataRow[]
        >;

        if (!resIzdani.ok || !jsonIzdani.success) {
          throw new Error(
            jsonIzdani?.error || "Greška pri učitavanju izdanih računa",
          );
        }
        if (!resNaplata.ok || !jsonNaplata.success) {
          throw new Error(
            jsonNaplata?.error || "Greška pri učitavanju naplate računa",
          );
        }

        setIzdani(jsonIzdani.data ?? []);
        setNaplata(jsonNaplata.data ?? []);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Nepoznata greška");
        setIzdani([]);
        setNaplata([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  const combinedDesc: CombinedRow[] = useMemo(() => {
    const { year: endYear, month1to12: endMonth } = getCurrentYearMonth();
    const startYear = endYear - 3;
    const monthsAsc = createMonthsFromToInclusive(
      startYear,
      1,
      endYear,
      endMonth,
    );

    const map = new Map<string, CombinedRow>();
    for (const { godina, mjesecNum } of monthsAsc) {
      const key = formatKey(mjesecNum, godina);
      map.set(key, {
        key,
        mjesec: MONTHS[mjesecNum - 1],
        godina,
        izdani: 0,
        naplata: 0,
      });
    }

    for (const r of izdani) {
      const mjesecNum = toNumber(r.mjesec_racuna);
      const godina = toNumber(r.godina_racuna);
      const key = formatKey(mjesecNum, godina);
      const existing = map.get(key);
      if (existing) existing.izdani = toNumber(r.ukupno);
    }

    for (const r of naplata) {
      const mjesecNum = toNumber(r.mjesec_uplate);
      const godina = toNumber(r.godina_uplate);
      const key = formatKey(mjesecNum, godina);
      const existing = map.get(key);
      if (existing) existing.naplata = toNumber(r.ukupno);
    }

    return Array.from(map.values()).sort((a, b) => (a.key > b.key ? -1 : 1));
  }, [izdani, naplata]);

  const displayData: DisplayRow[] = useMemo(() => {
    if (viewMode === "month") {
      return combinedDesc.map((r) => ({
        key: r.key,
        godina: r.godina,
        periodLabel: `${r.mjesec} ${r.godina}`,
        izdani: r.izdani,
        naplata: r.naplata,
      }));
    }

    if (viewMode === "quarter") {
      const qMap = new Map<string, DisplayRow>();

      for (const r of combinedDesc) {
        const [yStr, mmStr] = r.key.split("-");
        const godina = Number(yStr);
        const mjesecNum = Number(mmStr);
        const q = Math.floor((mjesecNum - 1) / 3) + 1;

        const key = `${godina}-Q${q}`;
        const existing = qMap.get(key);
        if (existing) {
          existing.izdani += r.izdani;
          existing.naplata += r.naplata;
        } else {
          qMap.set(key, {
            key,
            godina,
            periodLabel: `Q${q} ${godina}`,
            izdani: r.izdani,
            naplata: r.naplata,
          });
        }
      }

      return Array.from(qMap.values()).sort((a, b) => (a.key > b.key ? -1 : 1));
    }

    if (viewMode === "realization") {
      return combinedDesc.map((r) => ({
        key: r.key,
        godina: r.godina,
        periodLabel: `${r.mjesec} ${r.godina}`,
        izdani: 0,
        naplata: 0,
        //realizacija: r.naplata * 0.45,
        realizacija: (r.naplata - r.naplata * 0.1453) * 0.0045,
      }));
    }

    // year
    const yMap = new Map<number, DisplayRow>();
    for (const r of combinedDesc) {
      const existing = yMap.get(r.godina);
      if (existing) {
        existing.izdani += r.izdani;
        existing.naplata += r.naplata;
      } else {
        yMap.set(r.godina, {
          key: String(r.godina),
          godina: r.godina,
          periodLabel: String(r.godina),
          izdani: r.izdani,
          naplata: r.naplata,
        });
      }
    }

    return Array.from(yMap.values()).sort((a, b) => b.godina - a.godina);
  }, [combinedDesc, viewMode]);

  return (
    <div className="w-full bg-gray-50 p-2 md:p-3">
      <div className="w-full mx-auto space-y-3">
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
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
                    ? { backgroundColor: "#785E9E" }
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
                    ? { backgroundColor: "#5d4a7a" }
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
              <button
                type="button"
                onClick={() => setViewMode("realization")}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                  viewMode === "realization"
                    ? "text-white"
                    : "text-gray-700 hover:text-gray-900"
                }`}
                style={
                  viewMode === "realization"
                    ? { backgroundColor: "#16A34A" }
                    : { backgroundColor: "transparent" }
                }
              >
                BONUS PRODAJE
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
          {/* Tabela */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Tabela</div>
              <div className="text-xs text-gray-500">{displayData.length}</div>
            </div>

            <div className="max-h-[60vh] lg:max-h-[75vh] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 border-b">
                  <tr className="text-left">
                    <th className="p-2">
                      {viewMode === "month"
                        ? "Mjesec/Godina"
                        : viewMode === "quarter"
                          ? "Kvartal"
                          : viewMode === "realization"
                            ? "Mjesec/Godina"
                            : "Godina"}
                    </th>
                    {viewMode === "realization" ? (
                      <th className="p-2">Realizacija</th>
                    ) : (
                      <>
                        <th className="p-2">Izdani</th>
                        <th className="p-2">Naplata</th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {displayData.map((r) => (
                    <tr
                      key={r.key}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="p-2 font-semibold text-gray-800 whitespace-nowrap">
                        {r.periodLabel}
                      </td>
                      {viewMode === "realization" ? (
                        <td
                          className="p-2 whitespace-nowrap"
                          style={{ color: COLOR_REALIZATION }}
                        >
                          {format2(r.realizacija)}
                        </td>
                      ) : (
                        <>
                          <td
                            className="p-2 whitespace-nowrap"
                            style={{ color: COLOR_ISSUED }}
                          >
                            {format2(r.izdani)}
                          </td>
                          <td
                            className="p-2 whitespace-nowrap"
                            style={{ color: COLOR_PAID }}
                          >
                            {format2(r.naplata)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grafikon */}
          <div className="lg:col-span-10 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Grafikon - Obračun bonusa prodaje se radi po formuli: (Naplata -
                PDV) * 0.45%)
              </div>
            </div>

            <div className="p-3">
              <div className="w-full h-[340px] sm:h-[380px] lg:h-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={displayData}
                    margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="periodLabel"
                      tick={{ fontSize: 11 }}
                      interval={
                        viewMode === "month" || viewMode === "realization"
                          ? 2
                          : 0
                      }
                      height={40}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, name: any) => [
                        format2(value),
                        name,
                      ]}
                    />
                    <Legend />
                    {viewMode === "realization" ? (
                      <Line
                        type="monotone"
                        dataKey="realizacija"
                        name="Bonus prodaje"
                        stroke={COLOR_REALIZATION}
                        strokeWidth={3}
                        dot={{
                          r: 3,
                          fill: "#000000",
                          stroke: "#000000",
                          strokeWidth: 0,
                        }}
                      />
                    ) : (
                      <>
                        <Line
                          type="monotone"
                          dataKey="izdani"
                          name="Izdani računi"
                          stroke={COLOR_ISSUED}
                          strokeWidth={4.5}
                          dot={{
                            r: 3,
                            fill: "#000000",
                            stroke: "#000000",
                            strokeWidth: 0,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="naplata"
                          name="Naplata"
                          stroke={COLOR_PAID}
                          strokeWidth={2.5}
                          dot={{
                            r: 3,
                            fill: "#000000",
                            stroke: "#000000",
                            strokeWidth: 0,
                          }}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
