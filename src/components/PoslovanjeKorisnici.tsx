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

type QuarterlyRow = {
  key: string; // YYYY-QN (npr 2026-Q1)
  period: string; // Q1 2026
  izdani: number;
  naplata: number;
};

const COLOR_ISSUED = "#2563EB"; // blue
const COLOR_PAID = "#F97316"; // orange

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
const getQuarter = (month1to12: number) => Math.floor((month1to12 - 1) / 3) + 1;

const aggregateQuarterlyFromMonths = (
  monthsDesc: CombinedRow[],
): QuarterlyRow[] => {
  // monthsDesc je DESC (najnovije->najstarije), zadržaćemo DESC i za kvartale
  const map = new Map<string, QuarterlyRow>();

  for (const m of monthsDesc) {
    const monthIdx = MONTHS.indexOf(m.mjesec) + 1; // 1-12
    const q = getQuarter(monthIdx);
    const key = `${m.godina}-Q${q}`;

    const existing = map.get(key);
    if (existing) {
      existing.izdani += m.izdani;
      existing.naplata += m.naplata;
    } else {
      map.set(key, {
        key,
        period: `Q${q} ${m.godina}`,
        izdani: m.izdani,
        naplata: m.naplata,
      });
    }
  }

  // zadrži DESC: veći ključ (npr 2026-Q1) treba biti prije
  return Array.from(map.values()).sort((a, b) => (a.key > b.key ? -1 : 1));
};

const getCurrentYearMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month1to12 = now.getMonth() + 1; // JS: 0-11
  return { year, month1to12 };
};

const toNumber = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const format2 = (v: unknown) => toNumber(v).toFixed(2);

const formatKey = (mjesec: number, godina: number) =>
  `${godina}-${String(mjesec).padStart(2, "0")}`;

const createMonthsFromToInclusive = (
  startYear: number,
  startMonth1to12: number,
  endYear: number,
  endMonth1to12: number,
) => {
  const result: { godina: number; mjesecNum: number }[] = [];
  let y = startYear;
  let m = startMonth1to12;

  // forward until end inclusive
  // (we will reverse later for display)
  // safety to avoid infinite loops
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

  const [viewMode, setViewMode] = useState<"monthly" | "quarterly">("monthly");

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
    // RANGE: MAR 2023 -> MAR 2026 inclusive = 37 mjeseci,
    // ali ti želiš MART 2026 -> MART 2023. (descending)
    // Ako baš želiš TAČNO 36 mjeseci, reci pa ćemo skratiti (npr. APR 2023 -> MAR 2026).
    const { year: endYear, month1to12: endMonth } = getCurrentYearMonth();
    const startYear = endYear - 3; // cijele 3 prethodne godine + tekuća do trenutnog mjeseca
    const monthsAsc = createMonthsFromToInclusive(
      startYear,
      1,
      endYear,
      endMonth,
    );

    // seed with 0s
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

    // fill izdani
    for (const r of izdani) {
      const mjesecNum = toNumber(r.mjesec_racuna);
      const godina = toNumber(r.godina_racuna);
      const key = formatKey(mjesecNum, godina);
      const existing = map.get(key);
      if (existing) existing.izdani = toNumber(r.ukupno);
    }

    // fill naplata
    for (const r of naplata) {
      const mjesecNum = toNumber(r.mjesec_uplate);
      const godina = toNumber(r.godina_uplate);
      const key = formatKey(mjesecNum, godina);
      const existing = map.get(key);
      if (existing) existing.naplata = toNumber(r.ukupno);
    }

    // return descending: MAR 2026 ... MAR 2023
    return Array.from(map.values()).sort((a, b) => (a.key > b.key ? -1 : 1));
  }, [izdani, naplata]);

  const quarterlyDesc = useMemo(
    () => aggregateQuarterlyFromMonths(combinedDesc),
    [combinedDesc],
  );

  // const tableData = viewMode === "quarterly" ? quarterlyDesc : combinedDesc;

  return (
    <div className="w-full bg-gray-50 p-2 md:p-3">
      {/* full width (no max-w) */}
      <div className="w-full mx-auto space-y-3">
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("monthly")}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                  viewMode === "monthly"
                    ? "text-white"
                    : "text-gray-700 hover:text-gray-900"
                }`}
                style={
                  viewMode === "monthly"
                    ? { backgroundColor: "#785E9E" }
                    : { backgroundColor: "transparent" }
                }
              >
                MJESEČNO
              </button>

              <button
                type="button"
                onClick={() => setViewMode("quarterly")}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                  viewMode === "quarterly"
                    ? "text-white"
                    : "text-gray-700 hover:text-gray-900"
                }`}
                style={
                  viewMode === "quarterly"
                    ? { backgroundColor: "#5d4a7a" }
                    : { backgroundColor: "transparent" }
                }
              >
                KVARTALNO
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

        {/* Responsive layout:
            - mobile: stacked (table then chart)
            - lg+: side-by-side
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Tabela: full width on mobile, 2/12 on desktop */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Tabela</div>
              <div className="text-xs text-gray-500">
                {combinedDesc.length} mjeseci
              </div>
            </div>

            <div className="max-h-[60vh] lg:max-h-[75vh] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 border-b">
                  {viewMode === "monthly" ? (
                    <tr className="text-left">
                      <th className="p-2">Mjesec</th>
                      <th className="p-2">Godina</th>
                      <th className="p-2">Izdani</th>
                      <th className="p-2">Naplata</th>
                    </tr>
                  ) : (
                    <tr className="text-left">
                      <th className="p-2">Kvartal</th>
                      <th className="p-2">Izdani</th>
                      <th className="p-2">Naplata</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {viewMode === "monthly"
                    ? combinedDesc.map((r) => (
                        <tr
                          key={r.key}
                          className="border-b last:border-b-0 hover:bg-gray-50"
                        >
                          <td className="p-2 font-semibold text-gray-800 whitespace-nowrap">
                            {r.mjesec}
                          </td>
                          <td className="p-2 font-semibold text-gray-800 whitespace-nowrap">
                            {r.godina}
                          </td>
                          <td
                            className="p-2 whitespace-nowrap"
                            style={{ color: COLOR_ISSUED }}
                          >
                            {toNumber(r.izdani).toFixed(2)}
                          </td>
                          <td
                            className="p-2 whitespace-nowrap"
                            style={{ color: COLOR_PAID }}
                          >
                            {toNumber(r.naplata).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    : quarterlyDesc.map((q) => (
                        <tr
                          key={q.key}
                          className="border-b last:border-b-0 hover:bg-gray-50"
                        >
                          <td className="p-2 font-semibold text-gray-800 whitespace-nowrap">
                            {q.period}
                          </td>
                          <td
                            className="p-2 whitespace-nowrap"
                            style={{ color: COLOR_ISSUED }}
                          >
                            {toNumber(q.izdani).toFixed(2)}
                          </td>
                          <td
                            className="p-2 whitespace-nowrap"
                            style={{ color: COLOR_PAID }}
                          >
                            {toNumber(q.naplata).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grafikon: full width on mobile, 10/12 on desktop */}
          <div className="lg:col-span-10 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Grafikon
              </div>
            </div>

            <div className="p-3">
              <div className="w-full h-[340px] sm:h-[380px] lg:h-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  {/* Data is descending, so X axis will naturally go: left newest, right oldest */}
                  <LineChart
                    data={
                      viewMode === "quarterly" ? quarterlyDesc : combinedDesc
                    }
                    margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    {viewMode === "monthly" ? (
                      <XAxis
                        dataKey="key"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(key: string) => {
                          const [y, mm] = key.split("-");
                          const monthIdx = Number(mm) - 1;
                          return `${MONTHS[monthIdx]} ${y}`;
                        }}
                        interval={2}
                        height={40}
                      />
                    ) : (
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        height={40}
                      />
                    )}

                    <YAxis tick={{ fontSize: 12 }} />

                    <Tooltip
                      labelFormatter={(key) => {
                        if (viewMode === "monthly") {
                          const [y, mm] = String(key).split("-");
                          const monthIdx = Number(mm) - 1;
                          return `${MONTHS[monthIdx]} ${y}`;
                        }
                        return String(key);
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, name: any) => [
                        format2(value),
                        name,
                      ]}
                    />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="izdani"
                      name="Izdani računi"
                      stroke={COLOR_ISSUED}
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        stroke: "#000000",
                        fill: "#000000",
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
                        stroke: "#000000",
                        fill: "#000000",
                        strokeWidth: 0,
                      }}
                    />
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
