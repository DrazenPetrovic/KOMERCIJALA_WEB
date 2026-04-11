import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader } from "lucide-react";
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
import { getCurrentUser } from "../utils/auth";

interface KretanjeProizvodaApiData {
  sifra_radnika: number | string;
  sifra_proizvoda: number | string;
  naziv_proizvoda: string;
  jm: string;
  sifra_grupe: number | string;
  naziv_grupe: string;
  ukupna_kolicina: number | string;
  ukupni_ruc: number | string;
  mjesec: number | string;
  godina: number | string;
}

interface KretanjeProizvodaData {
  sifra_radnika: number;
  sifra_proizvoda: number;
  naziv_proizvoda: string;
  jm: string;
  sifra_grupe: number;
  naziv_grupe: string;
  ukupna_kolicina: number;
  ukupni_ruc: number;
  mjesec: number;
  godina: number;
}

interface ProductData {
  sifra_proizvoda: number;
  naziv_proizvoda: string;
  jm: string;
  ukupna_kolicina: number;
}

interface GroupData {
  key: string;
  sifra_grupe: number;
  naziv_grupe: string;
  ukupna_kolicina: number;
  kolicinePoJm: Record<string, number>;
  proizvodi: ProductData[];
}

interface GroupFilterOption {
  sifra_grupe: number;
  naziv_grupe: string;
}

interface GroupChartSeries {
  sifra_grupe: number;
  naziv_grupe: string;
  jmKeys: string[];
  data: Array<{ periodLabel: string; [key: string]: string | number }>;
}

type ViewMode = "month" | "quarter" | "year";

interface PeriodData {
  key: string;
  periodLabel: string;
  godina: number;
  mjesec?: number;
  kvartal?: number;
  grupe: GroupData[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
}

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAJ",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
];

const CHART_COLORS = [
  "#785E9E",
  "#8FC74A",
  "#2563EB",
  "#D97706",
  "#DC2626",
  "#0891B2",
  "#4F46E5",
  "#16A34A",
];

const quantityFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const toNumber = (value: number | string | null | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatQuantity = (value: number) => quantityFormatter.format(value);

const getMonthlyOrderRank = (month: number, currentMonth: number) => {
  if (month <= currentMonth) {
    return currentMonth - month;
  }

  // Mjeseci koji tek dolaze u tekućoj godini idu na kraj, redom od narednog do DEC.
  return currentMonth + (month - currentMonth);
};

const comparePeriods = (
  a: { godina: number; mjesec?: number; kvartal?: number },
  b: { godina: number; mjesec?: number; kvartal?: number },
  viewMode: ViewMode,
  currentMonth: number,
) => {
  if (viewMode === "month") {
    const rankA = getMonthlyOrderRank(a.mjesec ?? 0, currentMonth);
    const rankB = getMonthlyOrderRank(b.mjesec ?? 0, currentMonth);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return b.godina - a.godina;
  }

  if (viewMode === "quarter") {
    if (a.godina !== b.godina) {
      return b.godina - a.godina;
    }

    return (b.kvartal ?? 0) - (a.kvartal ?? 0);
  }

  return b.godina - a.godina;
};

const normalizeRow = (
  item: KretanjeProizvodaApiData,
): KretanjeProizvodaData => ({
  ...item,
  sifra_radnika: toNumber(item.sifra_radnika),
  sifra_proizvoda: toNumber(item.sifra_proizvoda),
  sifra_grupe: toNumber(item.sifra_grupe),
  ukupna_kolicina: toNumber(item.ukupna_kolicina),
  ukupni_ruc: toNumber(item.ukupni_ruc),
  mjesec: toNumber(item.mjesec),
  godina: toNumber(item.godina),
});

export default function KretanjeProizvoda() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [rawData, setRawData] = useState<KretanjeProizvodaData[]>([]);
  const [expandedGroupIds, setExpandedGroupIds] = useState<
    Record<string, boolean>
  >({});
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const currentMonth = new Date().getMonth() + 1;

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${apiUrl}/api/poslovanje/kretanje-proizvoda`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          },
        );

        const json = (await response.json()) as ApiResponse<
          KretanjeProizvodaApiData[]
        >;

        if (!response.ok || !json.success) {
          throw new Error(
            json?.error || "Greška pri učitavanju kretanja proizvoda",
          );
        }

        const normalizedData = (json.data ?? []).map(normalizeRow);

        // Filtriranje podataka po sifra_radnika (samo za vrstaRadnika = 2)
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.vrstaRadnika === 2) {
          const filtered = normalizedData.filter(
            (item) => item.sifra_radnika === currentUser.sifraRadnika,
          );
          setRawData(filtered);
        } else {
          // Za admina (vrstaRadnika = 1) prikazujem sve
          setRawData(normalizedData);
        }
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Nepoznata greška");
        setRawData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  const groupedByPeriod = useMemo(() => {
    const periodMap = new Map<
      string,
      {
        key: string;
        periodLabel: string;
        godina: number;
        mjesec?: number;
        kvartal?: number;
        items: KretanjeProizvodaData[];
      }
    >();

    for (const item of rawData) {
      const kvartal = Math.floor((item.mjesec - 1) / 3) + 1;
      const periodKey =
        viewMode === "month"
          ? `${item.godina}-${String(item.mjesec).padStart(2, "0")}`
          : viewMode === "quarter"
            ? `${item.godina}-Q${kvartal}`
            : `${item.godina}`;
      const periodLabel =
        viewMode === "month"
          ? `${MONTHS[item.mjesec - 1] || `M${item.mjesec}`} ${item.godina}`
          : viewMode === "quarter"
            ? `Q${kvartal} ${item.godina}`
            : `${item.godina}`;
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          key: periodKey,
          periodLabel,
          godina: item.godina,
          mjesec: viewMode === "month" ? item.mjesec : undefined,
          kvartal: viewMode === "quarter" ? kvartal : undefined,
          items: [],
        });
      }

      periodMap.get(periodKey)!.items.push(item);
    }

    if (viewMode === "month") {
      const years = Array.from(new Set(rawData.map((item) => item.godina)));

      for (const godina of years) {
        for (let mjesec = 1; mjesec <= 12; mjesec += 1) {
          const periodKey = `${godina}-${String(mjesec).padStart(2, "0")}`;

          if (!periodMap.has(periodKey)) {
            periodMap.set(periodKey, {
              key: periodKey,
              periodLabel: `${MONTHS[mjesec - 1] || `M${mjesec}`} ${godina}`,
              godina,
              mjesec,
              kvartal: undefined,
              items: [],
            });
          }
        }
      }
    }

    return Array.from(periodMap.values())
      .sort((a, b) => comparePeriods(a, b, viewMode, currentMonth))
      .map((period): PeriodData => {
        const groupMap = new Map<string, GroupData>();

        for (const item of period.items) {
          const groupKey = `${period.key}_${item.sifra_grupe}`;
          const existingGroup = groupMap.get(groupKey);

          if (!existingGroup) {
            groupMap.set(groupKey, {
              key: groupKey,
              sifra_grupe: item.sifra_grupe,
              naziv_grupe: item.naziv_grupe,
              ukupna_kolicina: item.ukupna_kolicina,
              kolicinePoJm: { [item.jm]: item.ukupna_kolicina },
              proizvodi: [
                {
                  sifra_proizvoda: item.sifra_proizvoda,
                  naziv_proizvoda: item.naziv_proizvoda,
                  jm: item.jm,
                  ukupna_kolicina: item.ukupna_kolicina,
                },
              ],
            });
            continue;
          }

          existingGroup.ukupna_kolicina += item.ukupna_kolicina;
          existingGroup.kolicinePoJm[item.jm] =
            (existingGroup.kolicinePoJm[item.jm] ?? 0) + item.ukupna_kolicina;

          const existingProduct = existingGroup.proizvodi.find(
            (product) => product.sifra_proizvoda === item.sifra_proizvoda,
          );

          if (existingProduct) {
            existingProduct.ukupna_kolicina += item.ukupna_kolicina;
          } else {
            existingGroup.proizvodi.push({
              sifra_proizvoda: item.sifra_proizvoda,
              naziv_proizvoda: item.naziv_proizvoda,
              jm: item.jm,
              ukupna_kolicina: item.ukupna_kolicina,
            });
          }
        }

        return {
          key: period.key,
          periodLabel: period.periodLabel,
          godina: period.godina,
          mjesec: period.mjesec,
          kvartal: period.kvartal,
          grupe: Array.from(groupMap.values()).sort((a, b) =>
            a.naziv_grupe.localeCompare(b.naziv_grupe, "sr"),
          ),
        };
      });
  }, [rawData, viewMode, currentMonth]);

  const groupFilterOptions = useMemo((): GroupFilterOption[] => {
    const map = new Map<number, string>();
    for (const row of rawData) {
      if (!map.has(row.sifra_grupe)) {
        map.set(row.sifra_grupe, row.naziv_grupe);
      }
    }

    return Array.from(map.entries())
      .map(([sifra_grupe, naziv_grupe]) => ({ sifra_grupe, naziv_grupe }))
      .sort((a, b) => a.naziv_grupe.localeCompare(b.naziv_grupe, "sr"));
  }, [rawData]);

  const visibleGroupedByPeriod = useMemo(() => {
    if (selectedGroupIds.length === 0) {
      return groupedByPeriod;
    }

    return groupedByPeriod.map((periodItem) => ({
      ...periodItem,
      grupe: periodItem.grupe.filter((group) =>
        selectedGroupIds.includes(group.sifra_grupe),
      ),
    }));
  }, [groupedByPeriod, selectedGroupIds]);

  const groupChartSeriesMap = useMemo(() => {
    const groupMap = new Map<
      number,
      {
        sifra_grupe: number;
        naziv_grupe: string;
        jmSet: Set<string>;
        periodMap: Map<
          string,
          {
            periodLabel: string;
            godina: number;
            mjesec?: number;
            kvartal?: number;
            values: Record<string, number>;
          }
        >;
      }
    >();

    for (const item of rawData) {
      const groupId = item.sifra_grupe;
      const kvartal = Math.floor((item.mjesec - 1) / 3) + 1;
      const periodKey =
        viewMode === "month"
          ? `${item.godina}-${String(item.mjesec).padStart(2, "0")}`
          : viewMode === "quarter"
            ? `${item.godina}-Q${kvartal}`
            : `${item.godina}`;
      const periodLabel =
        viewMode === "month"
          ? `${MONTHS[item.mjesec - 1] || `M${item.mjesec}`} ${item.godina}`
          : viewMode === "quarter"
            ? `Q${kvartal} ${item.godina}`
            : `${item.godina}`;

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          sifra_grupe: groupId,
          naziv_grupe: item.naziv_grupe,
          jmSet: new Set<string>(),
          periodMap: new Map(),
        });
      }

      const groupEntry = groupMap.get(groupId)!;
      groupEntry.jmSet.add(item.jm);

      if (!groupEntry.periodMap.has(periodKey)) {
        groupEntry.periodMap.set(periodKey, {
          periodLabel,
          godina: item.godina,
          mjesec: viewMode === "month" ? item.mjesec : undefined,
          kvartal: viewMode === "quarter" ? kvartal : undefined,
          values: {},
        });
      }

      const periodEntry = groupEntry.periodMap.get(periodKey)!;
      periodEntry.values[item.jm] =
        (periodEntry.values[item.jm] ?? 0) + item.ukupna_kolicina;
    }

    const result = new Map<number, GroupChartSeries>();

    for (const [groupId, groupEntry] of groupMap.entries()) {
      const jmKeys = Array.from(groupEntry.jmSet).sort((a, b) =>
        a.localeCompare(b, "sr"),
      );

      const data = Array.from(groupEntry.periodMap.values())
        .sort((a, b) => comparePeriods(a, b, viewMode, currentMonth))
        .map((periodEntry) => {
          const point: { periodLabel: string; [key: string]: string | number } =
            {
              periodLabel: periodEntry.periodLabel,
            };

          for (const jm of jmKeys) {
            point[jm] = periodEntry.values[jm] ?? 0;
          }

          return point;
        });

      result.set(groupId, {
        sifra_grupe: groupEntry.sifra_grupe,
        naziv_grupe: groupEntry.naziv_grupe,
        jmKeys,
        data,
      });
    }

    return result;
  }, [rawData, viewMode, currentMonth]);

  const selectedGroupsForChart = useMemo(() => {
    return selectedGroupIds
      .slice(0, 4)
      .map((groupId) => groupChartSeriesMap.get(groupId))
      .filter((series): series is GroupChartSeries => Boolean(series));
  }, [selectedGroupIds, groupChartSeriesMap]);

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroupIds((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const toggleGroupSelection = (groupId: number) => {
    setSelectedGroupIds((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      }

      if (prev.length >= 4) {
        return prev;
      }

      return [...prev, groupId];
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-[#785E9E] animate-spin" />
          <p className="text-gray-600">Učitavanje kretanja proizvoda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-semibold">Greška pri učitavanju</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (rawData.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">
          Nema dostupnih podataka o kretanju proizvoda
        </p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex h-10 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={`h-full px-3 text-xs rounded-lg font-semibold transition-colors ${
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
                className={`h-full px-3 text-xs rounded-lg font-semibold transition-colors ${
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
                className={`h-full px-3 text-xs rounded-lg font-semibold transition-colors ${
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
                GODIŠNJE
              </button>
            </div>

            <button
              type="button"
              disabled={selectedGroupIds.length === 0}
              onClick={() => setIsChartModalOpen(true)}
              className="h-10 rounded-xl bg-[#785E9E] px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Grafikon ({Math.min(selectedGroupIds.length, 4)})
            </button>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#785E9E]">
              Filter grupa proizvoda
            </p>
            <div className="mt-2 flex max-h-32 flex-wrap gap-x-4 gap-y-2 overflow-auto pr-1">
              {groupFilterOptions.map((group) => {
                const checked = selectedGroupIds.includes(group.sifra_grupe);
                const disabled = !checked && selectedGroupIds.length >= 4;

                return (
                  <label
                    key={group.sifra_grupe}
                    className={`flex items-center gap-2 text-xs ${
                      disabled
                        ? "cursor-not-allowed text-gray-400"
                        : "cursor-pointer text-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleGroupSelection(group.sifra_grupe)}
                      className="h-3.5 w-3.5 accent-[#785E9E]"
                    />
                    <span>
                      {group.naziv_grupe} ({group.sifra_grupe})
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              Možete izabrati maksimalno 4 grupe.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleGroupedByPeriod.map((periodItem) => (
          <div
            key={periodItem.key}
            className="bg-white rounded-lg shadow overflow-hidden flex flex-col"
          >
            {/* ── Kartica header ── */}
            <div className="bg-[#785E9E] px-4 py-2">
              <span className="text-white text-sm font-semibold uppercase tracking-wide">
                {periodItem.periodLabel}
              </span>
            </div>

            {/* ── Tabela s grupama ── */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#8FC74A]/20 text-xs font-semibold text-[#785E9E] uppercase tracking-wide">
                  <th className="w-6 px-2 py-1.5"></th>
                  <th className="text-left px-2 py-1.5">Naziv grupe</th>
                  <th className="text-right px-2 py-1.5">Količina</th>
                </tr>
              </thead>
              <tbody>
                {periodItem.grupe.map((group) => {
                  const groupKey = `group_${group.key}`;
                  const isExpanded = !!expandedGroupIds[groupKey];

                  return (
                    <>
                      {/* ── Red grupe (klikabilni) ── */}
                      <tr
                        key={group.key}
                        onClick={() => toggleGroupExpand(groupKey)}
                        className="cursor-pointer border-t border-gray-200 hover:bg-[#8FC74A]/15 transition-colors font-medium text-gray-800"
                      >
                        <td className="px-2 py-2 text-[#785E9E]">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </td>
                        <td className="px-2 py-2 text-xs">
                          {group.naziv_grupe}
                        </td>
                        <td className="px-2 py-2 text-xs font-semibold text-[#785E9E]">
                          {Object.entries(group.kolicinePoJm).map(
                            ([jm, kol]) => (
                              <div
                                key={jm}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="font-normal text-gray-500">
                                  {jm}:
                                </span>
                                <span className="text-right">
                                  {formatQuantity(kol)}
                                </span>
                              </div>
                            ),
                          )}
                        </td>
                      </tr>

                      {/* ── Redovi proizvoda ── */}
                      {isExpanded &&
                        group.proizvodi.map((product) => (
                          <tr
                            key={`${group.key}_${product.sifra_proizvoda}`}
                            className="bg-gray-50 border-t border-gray-100 text-gray-700 text-xs"
                          >
                            <td className="px-2 py-1.5"></td>
                            <td className="px-2 py-1.5 pl-5 text-gray-600">
                              <span className="text-gray-400 mr-1">
                                {product.sifra_proizvoda}
                              </span>
                              {product.naziv_proizvoda}
                              <span className="ml-1 text-gray-400">
                                ({product.jm})
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-right font-medium text-gray-800">
                              {formatQuantity(product.ukupna_kolicina)}
                            </td>
                          </tr>
                        ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {isChartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-1 md:p-2">
          <div className="h-[96vh] w-[98vw] max-w-none overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Grafikon odabranih grupa proizvoda
                </h3>
                <p className="text-xs text-gray-500">
                  {viewMode === "month"
                    ? "Prikaz po JM kroz sve dostupne mjesece"
                    : viewMode === "quarter"
                      ? "Prikaz po JM kroz kvartale"
                      : "Prikaz po JM kroz godine"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChartModalOpen(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Zatvori
              </button>
            </div>

            <div className="h-[calc(96vh-72px)] overflow-auto p-4">
              <div
                className={`grid gap-4 ${
                  selectedGroupsForChart.length === 1
                    ? "grid-cols-1"
                    : selectedGroupsForChart.length === 2
                      ? "grid-cols-1 lg:grid-cols-2"
                      : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {selectedGroupsForChart.map((groupSeries) => (
                  <div
                    key={groupSeries.sifra_grupe}
                    className="rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {groupSeries.naziv_grupe}
                      </p>
                      <p className="text-xs text-gray-500">
                        Šifra grupe: {groupSeries.sifra_grupe}
                      </p>
                    </div>

                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={groupSeries.data}
                          margin={{ top: 10, right: 20, left: 5, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="periodLabel"
                            tick={{ fontSize: 11 }}
                            interval={Math.max(
                              0,
                              Math.floor(groupSeries.data.length / 8),
                            )}
                            height={45}
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) =>
                              formatQuantity(Number(value))
                            }
                          />
                          <Tooltip
                            formatter={(
                              value: number | string | undefined,
                              name: string | undefined,
                            ) => [formatQuantity(toNumber(value)), name ?? ""]}
                          />
                          <Legend />

                          {groupSeries.jmKeys.map((jm, index) => (
                            <Line
                              key={`${groupSeries.sifra_grupe}_${jm}`}
                              type="monotone"
                              dataKey={jm}
                              name={jm}
                              stroke={CHART_COLORS[index % CHART_COLORS.length]}
                              strokeWidth={2.5}
                              dot={{
                                r: 2.8,
                                strokeWidth: 1,
                                fill: CHART_COLORS[index % CHART_COLORS.length],
                              }}
                              activeDot={{
                                r: 5,
                                strokeWidth: 1,
                                fill: CHART_COLORS[index % CHART_COLORS.length],
                              }}
                              isAnimationActive={false}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
