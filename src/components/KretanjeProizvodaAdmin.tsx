import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader } from "lucide-react";
import {
  CartesianGrid,
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
  naziv_radnika: string;
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
  naziv_radnika: string;
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
  data: Array<{ periodLabel: string; godina: number; periodUnit: number; [key: string]: string | number }>;
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

interface TransakcijaAi {
  sifra_proizvoda: number;
  jm: string;
  kolicina: number | string;
  nabavna_cijena: number | string;
  cijena_sa_rab: number | string;
  datum_racuna: string;
  sifra_partnera: number;
  naziv_partnera: string;
  izvor_baze: string;
}

interface KupacInfo {
  kupac: string;
  prvi: string;
  zadnji: string;
  aktivnostPosto?: string;
}

interface LokalnaAnaliza {
  prestali: KupacInfo[];
  novi: KupacInfo[];
  povremeni: KupacInfo[];
  stabilni: KupacInfo[];
  ukupnoTransakcija: number;
  periodOd: string;
  periodDo: string;
  jm: string;
  sifra: number;
}

interface AgregiraniPeriod {
  period: string;
  kolicina: number;
  vpc_avg: number;
  nab_avg: number;
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

// Boje linija po godini — indeks 0 = prošla godina, 1 = pretprošla...
// Trenutna godina uvijek dobija boju iz CHART_COLORS po indeksu JM-a
const YEAR_DOT_COLORS = ["#DC2626", "#F59E0B", "#0891B2", "#6B7280"];

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

  return currentMonth + (month - currentMonth);
};

const getQuarterOrderRank = (quarter: number, currentQuarter: number) => {
  if (quarter <= currentQuarter) {
    return currentQuarter - quarter;
  }

  return currentQuarter + (quarter - currentQuarter);
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
    const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;
    const rankA = getQuarterOrderRank(a.kvartal ?? 0, currentQuarter);
    const rankB = getQuarterOrderRank(b.kvartal ?? 0, currentQuarter);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return b.godina - a.godina;
  }

  return b.godina - a.godina;
};

const normalizeRow = (
  item: KretanjeProizvodaApiData,
): KretanjeProizvodaData => ({
  ...item,
  sifra_radnika: toNumber(item.sifra_radnika),
  naziv_radnika: item.naziv_radnika ?? "",
  sifra_proizvoda: toNumber(item.sifra_proizvoda),
  sifra_grupe: toNumber(item.sifra_grupe),
  ukupna_kolicina: toNumber(item.ukupna_kolicina),
  ukupni_ruc: toNumber(item.ukupni_ruc),
  mjesec: toNumber(item.mjesec),
  godina: toNumber(item.godina),
});

interface Komercijalist {
  sifra_radnika: number;
  naziv_radnika: string;
}

export default function KretanjeProizvodaAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedWorker, setSelectedWorker] = useState<string>("sum");
  const [rawData, setRawData] = useState<KretanjeProizvodaData[]>([]);
  const [workers, setWorkers] = useState<Komercijalist[]>([]);
  const [expandedGroupIds, setExpandedGroupIds] = useState<
    Record<string, boolean>
  >({});
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [selectedProductForAi, setSelectedProductForAi] =
    useState<ProductData | null>(null);
  const [transakcijeAi, setTransakcijeAi] = useState<TransakcijaAi[]>([]);
  const [transakcijeLoading, setTransakcijeLoading] = useState(false);
  const [transakcijeError, setTransakcijeError] = useState<string>("");
  const [lokalnaAnaliza, setLokalnaAnaliza] = useState<LokalnaAnaliza | null>(null);
  const [agregirano, setAgregirano] = useState<AgregiraniPeriod[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState<string>("");
  const [aiError, setAiError] = useState<string>("");
  const [analyzeKey, setAnalyzeKey] = useState(0);
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState(false);
  const currentMonth = new Date().getMonth() + 1;
  const isAdmin = getCurrentUser()?.vrstaRadnika === 1;

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [kretanjeRes, komercijalRes] = await Promise.all([
          fetch(`${apiUrl}/api/poslovanje/kretanje-proizvoda`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
          fetch(`${apiUrl}/api/izvjestaji/komercijalisti`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
        ]);

        const json = (await kretanjeRes.json()) as ApiResponse<
          KretanjeProizvodaApiData[]
        >;

        if (!kretanjeRes.ok || !json.success) {
          throw new Error(
            json?.error || "Greška pri učitavanju kretanja proizvoda",
          );
        }

        setRawData((json.data ?? []).map(normalizeRow));

        if (komercijalRes.ok) {
          const komercijalJson = (await komercijalRes.json()) as ApiResponse<
            Komercijalist[]
          >;
          setWorkers(komercijalJson.data ?? []);
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

  const analizirajKupce = (tr: TransakcijaAi[]): LokalnaAnaliza => {
    const prijeXMjeseci = (x: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() - x);
      return d.toISOString().slice(0, 7);
    };
    const granicaPrestali = prijeXMjeseci(18);
    const granicaNovi = prijeXMjeseci(6);

    const poKupcu: Record<string, { mjeseci: Set<string> }> = {};
    for (const t of tr) {
      const mjesec = String(t.datum_racuna).slice(0, 7);
      if (!poKupcu[t.naziv_partnera])
        poKupcu[t.naziv_partnera] = { mjeseci: new Set() };
      poKupcu[t.naziv_partnera].mjeseci.add(mjesec);
    }

    const ukupnoMjeseci = new Set(tr.map((t) => String(t.datum_racuna).slice(0, 7))).size || 1;
    const rezultat: LokalnaAnaliza = {
      prestali: [], novi: [], povremeni: [], stabilni: [],
      ukupnoTransakcija: tr.length,
      periodOd: tr.map((t) => String(t.datum_racuna).slice(0, 7)).sort()[0] ?? "",
      periodDo: (() => { const s = tr.map((t) => String(t.datum_racuna).slice(0, 7)).sort(); return s[s.length - 1] ?? ""; })(),
      jm: tr[0]?.jm ?? "",
      sifra: Number(tr[0]?.sifra_proizvoda ?? 0),
    };

    for (const [kupac, data] of Object.entries(poKupcu)) {
      const sortirani = [...data.mjeseci].sort();
      const prvi = sortirani[0];
      const zadnji = sortirani[sortirani.length - 1] ?? "";
      const aktivnostPosto = ((sortirani.length / ukupnoMjeseci) * 100).toFixed(0);

      if (zadnji < granicaPrestali) {
        rezultat.prestali.push({ kupac, prvi, zadnji });
      } else if (prvi >= granicaNovi) {
        rezultat.novi.push({ kupac, prvi, zadnji });
      } else if (sortirani.length / ukupnoMjeseci < 0.5) {
        rezultat.povremeni.push({ kupac, prvi, zadnji, aktivnostPosto });
      } else {
        rezultat.stabilni.push({ kupac, prvi, zadnji });
      }
    }
    return rezultat;
  };

  const agregiranjePodataka = (tr: TransakcijaAi[]): AgregiraniPeriod[] => {
    const periodi = new Map<string, { kolicina: number; vpc_sum: number; nab_sum: number; count: number }>();
    for (const t of tr) {
      const period = String(t.datum_racuna).slice(0, 7);
      const ex = periodi.get(period) ?? { kolicina: 0, vpc_sum: 0, nab_sum: 0, count: 0 };
      periodi.set(period, {
        kolicina: ex.kolicina + Number(t.kolicina),
        vpc_sum: ex.vpc_sum + Number(t.cijena_sa_rab),
        nab_sum: ex.nab_sum + Number(t.nabavna_cijena),
        count: ex.count + 1,
      });
    }
    return Array.from(periodi.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, d]) => ({
        period,
        kolicina: d.kolicina,
        vpc_avg: d.vpc_sum / d.count,
        nab_avg: d.nab_sum / d.count,
      }));
  };

  useEffect(() => {
    if (!selectedProductForAi) return;
    let cancelled = false;

    const fetchTransakcije = async () => {
      setTransakcijeLoading(true);
      setTransakcijeError("");
      setLokalnaAnaliza(null);
      setAgregirano([]);
      setAiText("");
      setAiError("");
      try {
        const res = await fetch(
          `${apiUrl}/api/poslovanje/kretanje-proizvoda-detalji?sifra_proizvoda=${selectedProductForAi.sifra_proizvoda}`,
          { credentials: "include" },
        );
        const data = (await res.json()) as ApiResponse<TransakcijaAi[]>;
        if (cancelled) return;
        if (!res.ok || !data.success) throw new Error(data.error || "Greška pri učitavanju podataka.");
        const tr = (data.data ?? []).filter(
          (t) =>
            String(t.datum_racuna).slice(0, 7) >= "2023-01" &&
            Number(t.sifra_partnera) !== 300,
        );
        setTransakcijeAi(tr);
        setLokalnaAnaliza(analizirajKupce(tr));
        setAgregirano(agregiranjePodataka(tr));
      } catch (e: unknown) {
        if (!cancelled) setTransakcijeError(e instanceof Error ? e.message : "Greška.");
      } finally {
        if (!cancelled) setTransakcijeLoading(false);
      }
    };

    fetchTransakcije();
    return () => { cancelled = true; };
  }, [selectedProductForAi, analyzeKey, apiUrl]);

  const workerScopedData = useMemo(() => {
    if (selectedWorker === "sum") {
      return rawData;
    }

    const workerId = Number(selectedWorker);
    return rawData.filter((item) => item.sifra_radnika === workerId);
  }, [rawData, selectedWorker]);

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

    for (const item of workerScopedData) {
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
            ? `Q-${kvartal} ${item.godina}`
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
      const years = Array.from(
        new Set(workerScopedData.map((item) => item.godina)),
      );

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

    if (viewMode === "quarter") {
      const years = Array.from(
        new Set(workerScopedData.map((item) => item.godina)),
      );

      for (const godina of years) {
        for (let kvartal = 1; kvartal <= 4; kvartal += 1) {
          const periodKey = `${godina}-Q${kvartal}`;

          if (!periodMap.has(periodKey)) {
            periodMap.set(periodKey, {
              key: periodKey,
              periodLabel: `Q-${kvartal} ${godina}`,
              godina,
              mjesec: undefined,
              kvartal,
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
  }, [workerScopedData, viewMode, currentMonth]);

  const groupFilterOptions = useMemo((): GroupFilterOption[] => {
    const map = new Map<number, string>();
    for (const row of workerScopedData) {
      if (!map.has(row.sifra_grupe)) {
        map.set(row.sifra_grupe, row.naziv_grupe);
      }
    }

    return Array.from(map.entries())
      .map(([sifra_grupe, naziv_grupe]) => ({ sifra_grupe, naziv_grupe }))
      .sort((a, b) => a.naziv_grupe.localeCompare(b.naziv_grupe, "sr"));
  }, [workerScopedData]);

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

    for (const item of workerScopedData) {
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
            ? `Q-${kvartal} ${item.godina}`
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

      const sortedPeriods = Array.from(groupEntry.periodMap.values()).sort(
        (a, b) => {
          if (a.godina !== b.godina) return b.godina - a.godina;
          if (viewMode === "month") return (b.mjesec ?? 0) - (a.mjesec ?? 0);
          if (viewMode === "quarter") return (b.kvartal ?? 0) - (a.kvartal ?? 0);
          return 0;
        },
      );

      const data = sortedPeriods.map((periodEntry) => {
        const periodUnit =
          viewMode === "month"
            ? (periodEntry.mjesec ?? 0)
            : viewMode === "quarter"
              ? (periodEntry.kvartal ?? 0)
              : periodEntry.godina;

        const point: { periodLabel: string; godina: number; periodUnit: number; [key: string]: string | number } =
          {
            periodLabel: periodEntry.periodLabel,
            godina: periodEntry.godina,
            periodUnit,
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
  }, [workerScopedData, viewMode]);

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

  const openAiPrompt = (product: ProductData) => {
    if (!isAdmin) return;
    setChatHistory([]);
    setChatInput("");
    setTransakcijeAi([]);
    setLokalnaAnaliza(null);
    setAgregirano([]);
    setAiText("");
    setAiError("");
    setSelectedProductForAi(product);
  };

  const closeAiPrompt = () => {
    setSelectedProductForAi(null);
    setTransakcijeAi([]);
    setLokalnaAnaliza(null);
    setAgregirano([]);
    setAiText("");
    setAiError("");
    setAiLoading(false);
    setChatHistory([]);
    setChatInput("");
  };

  const retryFetch = () => setAnalyzeKey((k) => k + 1);

  const pokrniAiAnalizu = async () => {
    if (!selectedProductForAi || !lokalnaAnaliza || agregirano.length === 0) return;
    setAiLoading(true);
    setAiError("");
    setAiText("");
    try {
      const res = await fetch(`${apiUrl}/api/ai/proizvod-analiza`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          naziv_proizvoda: selectedProductForAi.naziv_proizvoda,
          jm: lokalnaAnaliza.jm,
          sifra: lokalnaAnaliza.sifra,
          agregirano,
          kategorizirani: {
            prestali: lokalnaAnaliza.prestali,
            novi: lokalnaAnaliza.novi,
            povremeni: lokalnaAnaliza.povremeni,
            stabilni: lokalnaAnaliza.stabilni,
          },
        }),
      });
      const data = (await res.json()) as { success: boolean; text?: string; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error || "AI analiza nije uspjela.");
      setAiText(String(data.text || ""));
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Greška pri AI analizi.");
    } finally {
      setAiLoading(false);
    }
  };

  const sendChatQuestion = async () => {
    const question = chatInput.trim();
    if (!question || !selectedProductForAi || !aiText || !lokalnaAnaliza) return;

    setChatInput("");
    setChatLoading(true);
    const newEntry: { role: "user" | "assistant"; content: string } = {
      role: "user",
      content: question,
    };
    setChatHistory((prev) => [...prev, newEntry]);

    try {
      const res = await fetch(`${apiUrl}/api/ai/proizvod-pitanje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          naziv_proizvoda: selectedProductForAi.naziv_proizvoda,
          jm: lokalnaAnaliza.jm,
          sifra: lokalnaAnaliza.sifra,
          agregirano,
          kategorizirani: {
            prestali: lokalnaAnaliza.prestali,
            novi: lokalnaAnaliza.novi,
            povremeni: lokalnaAnaliza.povremeni,
            stabilni: lokalnaAnaliza.stabilni,
          },
          aiAnalysis: aiText,
          chatHistory,
          question,
        }),
      });
      const data = (await res.json()) as { success: boolean; text?: string; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error || "Odgovor nije uspješan.");
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: String(data.text || "") },
      ]);
    } catch (e: unknown) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: e instanceof Error ? e.message : "Greška pri generisanju odgovora." },
      ]);
    } finally {
      setChatLoading(false);
    }
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
          <div className="flex flex-wrap items-center justify-center gap-2">
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

            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#785E9E]/40"
            >
              <option value="sum">SVE UKUPNO</option>
              {workers.map((worker) => (
                <option
                  key={worker.sifra_radnika}
                  value={String(worker.sifra_radnika)}
                >
                  {worker.naziv_radnika}
                </option>
              ))}
            </select>

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

      {visibleGroupedByPeriod.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {selectedWorker !== "sum"
              ? `Nema podataka o kretanju proizvoda za odabranog radnika.`
              : "Nema podataka za odabrani prikaz."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleGroupedByPeriod.map((periodItem) => (
            <div
              key={periodItem.key}
              className="bg-white rounded-lg shadow overflow-hidden flex flex-col"
            >
              <div className="bg-[#785E9E] px-4 py-2">
                <span className="text-white text-sm font-semibold uppercase tracking-wide">
                  {periodItem.periodLabel}
                </span>
              </div>

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
                      <Fragment key={group.key}>
                        <tr
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
                            {Object.entries(group.kolicinePoJm).sort(([a], [b]) => a.localeCompare(b)).map(
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
                                <button
                                  type="button"
                                  onClick={() => openAiPrompt(product)}
                                  disabled={!isAdmin}
                                  className={`font-medium transition-colors ${
                                    isAdmin
                                      ? "text-[#785E9E] hover:underline"
                                      : "text-gray-600 cursor-default"
                                  }`}
                                >
                                  {product.naziv_proizvoda}
                                </button>
                                <span className="ml-1 text-gray-400">
                                  ({product.jm})
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-right font-medium text-gray-800">
                                {formatQuantity(product.ukupna_kolicina)}
                              </td>
                            </tr>
                          ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {isChartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-1 md:p-2">
          <div className="h-[96vh] w-[98vw] max-w-none overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Grafikon odabranih grupa proizvoda
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedWorker === "sum"
                    ? "Ukupni prikaz kroz odabrane periode"
                    : `Prikaz za radnika ${selectedWorker}`}
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
              <div className="flex flex-col gap-6">
                {selectedGroupsForChart.map((groupSeries) => (
                  <div
                    key={groupSeries.sifra_grupe}
                    className="rounded-lg border-2 border-[#785E9E] bg-white overflow-hidden shadow-sm"
                  >
                    <div className="bg-[#785E9E] px-4 py-2.5 flex items-center justify-between">
                      <p className="text-sm font-bold text-white tracking-wide uppercase">
                        {groupSeries.naziv_grupe}
                      </p>
                      <p className="text-xs text-white/70">
                        Šifra: {groupSeries.sifra_grupe}
                        {groupSeries.jmKeys.length > 1 && (
                          <span className="ml-2 text-white/90">
                            · {groupSeries.jmKeys.length} JM
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="p-3">

                    <div
                      className={`grid gap-4 ${
                        groupSeries.jmKeys.length === 1
                          ? "grid-cols-1"
                          : groupSeries.jmKeys.length === 2
                            ? "grid-cols-1 md:grid-cols-2"
                            : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                      }`}
                    >
                      {groupSeries.jmKeys.map((jm, index) => {
                        const color = CHART_COLORS[index % CHART_COLORS.length];
                        const currentYear = new Date().getFullYear();

                        const CrossYearTooltip = (props: { active?: boolean; payload?: { payload: { periodUnit: number; godina: number; [key: string]: string | number } }[] }) => {
                          const { active, payload } = props;
                          if (!active || !payload || payload.length === 0) return null;
                          const hovered = payload[0].payload;
                          const sameUnitPoints = groupSeries.data
                            .filter((p) => p.periodUnit === hovered.periodUnit)
                            .sort((a, b) => (b.godina as number) - (a.godina as number));

                          return (
                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
                              {sameUnitPoints.map((p) => {
                                const yearOffset = currentYear - (p.godina as number);
                                const dotColor = yearOffset === 0
                                  ? color
                                  : YEAR_DOT_COLORS[(yearOffset - 1) % YEAR_DOT_COLORS.length];
                                const val = p[jm];
                                return (
                                  <div key={p.godina} className="flex items-center justify-between gap-4 py-0.5">
                                    <span className="flex items-center gap-1.5">
                                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
                                      <span className="text-gray-600">{p.periodLabel}</span>
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {formatQuantity(toNumber(val))} {jm}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        };

                        return (
                          <div key={jm} className="rounded border border-gray-100 bg-gray-50 p-2">
                            <p className="mb-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              {jm}
                            </p>
                            <div className="h-[240px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={groupSeries.data}
                                  margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis
                                    dataKey="periodLabel"
                                    tick={{ fontSize: 10 }}
                                    interval={Math.max(
                                      0,
                                      Math.floor(groupSeries.data.length / 6),
                                    )}
                                    height={40}
                                  />
                                  <YAxis
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(value) =>
                                      formatQuantity(Number(value))
                                    }
                                    width={65}
                                  />
                                  <Tooltip content={<CrossYearTooltip />} />
                                  <Line
                                    type="monotone"
                                    dataKey={jm}
                                    name={jm}
                                    stroke={color}
                                    strokeWidth={2.5}
                                    dot={(props) => {
                                      const { cx, cy, payload } = props;
                                      const yearOffset = currentYear - (payload.godina as number);
                                      const dotColor = yearOffset === 0
                                        ? color
                                        : YEAR_DOT_COLORS[(yearOffset - 1) % YEAR_DOT_COLORS.length];
                                      return (
                                        <circle
                                          key={`dot-${cx}-${cy}`}
                                          cx={cx}
                                          cy={cy}
                                          r={3.5}
                                          fill={dotColor}
                                          stroke="#fff"
                                          strokeWidth={1}
                                        />
                                      );
                                    }}
                                    activeDot={{ r: 5, strokeWidth: 1, fill: color }}
                                    isAnimationActive={false}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProductForAi && (
        <div className="fixed inset-0 z-[60] bg-black/60">
          <div className="flex w-full h-full flex-col bg-white overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between bg-[#785E9E] px-5 py-3 shrink-0">
              <div className="flex items-center gap-5 min-w-0">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">
                    Analiza kretanja proizvoda
                  </p>
                  <h3 className="text-sm font-bold text-white leading-tight truncate">
                    {selectedProductForAi.naziv_proizvoda}
                  </h3>
                </div>
                {lokalnaAnaliza && (
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <div className="rounded-lg bg-white/10 px-3 py-1.5 text-center">
                      <div className="text-base font-bold text-white">{lokalnaAnaliza.ukupnoTransakcija}</div>
                      <div className="text-[9px] uppercase tracking-wide text-white/60">transakcija</div>
                    </div>
                    <div className="text-[10px] text-white/70 leading-relaxed">
                      <div>JM: <strong className="text-white">{lokalnaAnaliza.jm}</strong></div>
                      <div>Šifra: <strong className="text-white">{lokalnaAnaliza.sifra}</strong></div>
                      <div>Period: <strong className="text-white">{lokalnaAnaliza.periodOd} — {lokalnaAnaliza.periodDo}</strong></div>
                    </div>
                  </div>
                )}
              </div>
              <button type="button" onClick={closeAiPrompt}
                className="shrink-0 rounded-lg border border-white/30 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors">
                Zatvori
              </button>
            </div>

            {/* Body — two columns */}
            <div className="flex flex-1 overflow-hidden">

              {/* LEFT — lokalna analiza + AI sekcija + chat input */}
              <div className="flex w-1/2 flex-col border-r border-gray-200">
                <div className="flex-1 overflow-auto p-5 flex flex-col gap-5">

                  {transakcijeLoading && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 py-4">
                      <Loader className="w-3.5 h-3.5 animate-spin text-[#785E9E]" />
                      <span>Učitavanje i lokalna analiza podataka...</span>
                    </div>
                  )}
                  {transakcijeError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-xs text-red-600 mb-2">{transakcijeError}</p>
                      <button type="button" onClick={retryFetch}
                        className="rounded-lg bg-[#785E9E] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                        Pokušaj ponovo
                      </button>
                    </div>
                  )}

                  {lokalnaAnaliza && (
                    <div className="flex flex-col gap-4">
                      <p className="text-[10px] uppercase tracking-widest text-[#785E9E] font-bold">
                        Lokalna analiza kupaca
                      </p>

                      {/* Stat cards */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
                          <div className="text-3xl font-bold text-green-700 leading-none">{lokalnaAnaliza.stabilni.length}</div>
                          <div className="text-[9px] font-semibold uppercase tracking-wide text-green-600 mt-1.5">Stabilni</div>
                        </div>
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
                          <div className="text-3xl font-bold text-blue-700 leading-none">{lokalnaAnaliza.novi.length}</div>
                          <div className="text-[9px] font-semibold uppercase tracking-wide text-blue-600 mt-1.5">Novi</div>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                          <div className="text-3xl font-bold text-amber-700 leading-none">{lokalnaAnaliza.povremeni.length}</div>
                          <div className="text-[9px] font-semibold uppercase tracking-wide text-amber-600 mt-1.5">Povremeni</div>
                        </div>
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
                          <div className="text-3xl font-bold text-red-700 leading-none">{lokalnaAnaliza.prestali.length}</div>
                          <div className="text-[9px] font-semibold uppercase tracking-wide text-red-600 mt-1.5">Prestali</div>
                        </div>
                      </div>

                      {/* Customer pill lists */}
                      {(
                        [
                          { label: "Stabilni (≥50% aktivnih mj, zadnjih 12+ mj)", lista: lokalnaAnaliza.stabilni, pillClass: "bg-green-100 text-green-800 border-green-200" },
                          { label: "Novi (zadnjih 6 mj)", lista: lokalnaAnaliza.novi, pillClass: "bg-blue-100 text-blue-800 border-blue-200" },
                          { label: "Povremeni (<50% aktivnih mj)", lista: lokalnaAnaliza.povremeni, pillClass: "bg-amber-100 text-amber-800 border-amber-200" },
                          { label: "Prestali (>18 mj bez narudžbe)", lista: lokalnaAnaliza.prestali, pillClass: "bg-red-100 text-red-800 border-red-200" },
                        ] as { label: string; lista: KupacInfo[]; pillClass: string }[]
                      ).map(({ label, lista, pillClass }) =>
                        lista.length > 0 ? (
                          <div key={label}>
                            <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-2">{label}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {lista.map((k) => (
                                <span key={k.kupac} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium leading-none ${pillClass}`}>
                                  {k.kupac}
                                  {k.aktivnostPosto && <span className="opacity-60">({k.aktivnostPosto}%)</span>}
                                  {label.startsWith("Prestali") && k.zadnji && <span className="opacity-60">[{k.zadnji}]</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null,
                      )}
                    </div>
                  )}

                  {/* AI sekcija */}
                  {lokalnaAnaliza && !aiText && !aiLoading && !aiError && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] text-gray-400 mb-3">
                        Lokalna analiza je gotova. Pokrenite AI za interpretaciju trendova i preporuke.
                      </p>
                      <button type="button" onClick={() => void pokrniAiAnalizu()}
                        className="rounded-lg bg-[#785E9E] px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity shadow-sm">
                        Pokreni AI analizu
                      </button>
                    </div>
                  )}
                  {aiLoading && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100 pt-4">
                      <Loader className="w-3.5 h-3.5 animate-spin text-[#785E9E]" />
                      <span>AI interpretira podatke...</span>
                    </div>
                  )}
                  {aiError && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-red-600 mb-2">{aiError}</p>
                      <button type="button" onClick={() => void pokrniAiAnalizu()}
                        className="rounded-lg bg-[#785E9E] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                        Pokušaj ponovo
                      </button>
                    </div>
                  )}
                  {aiText && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] uppercase tracking-widest text-[#785E9E] font-bold mb-3">
                        AI interpretacija
                      </p>
                      <p className="text-xs whitespace-pre-wrap leading-loose text-gray-700">
                        {aiText}
                      </p>
                    </div>
                  )}
                </div>

                {/* Chat input — samo kad je AI analiza gotova */}
                {aiText && (
                  <div className="shrink-0 border-t border-gray-200 bg-gray-50 p-4">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2">
                      Postavi pitanje
                    </p>
                    <div className="flex gap-2">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void sendChatQuestion();
                          }
                        }}
                        placeholder="npr. Zašto je došlo do pada u januaru?"
                        disabled={chatLoading}
                        rows={2}
                        className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#785E9E]/40 disabled:bg-gray-100"
                      />
                      <button type="button" onClick={() => void sendChatQuestion()}
                        disabled={!chatInput.trim() || chatLoading}
                        className="self-end rounded-lg bg-[#785E9E] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 transition-colors">
                        {chatLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : "Pošalji"}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[10px] text-gray-400">Enter za slanje · Shift+Enter za novi red</p>
                  </div>
                )}
              </div>

              {/* RIGHT — agregirani podaci + chat historija */}
              <div className="flex w-1/2 flex-col bg-gray-50">

                {/* Agregirani podaci table */}
                <div className="shrink-0 flex flex-col border-b border-gray-200" style={{ maxHeight: "42%" }}>
                  <div className="bg-white px-4 py-2 shrink-0 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                      Agregirani podaci po periodu
                    </p>
                    {lokalnaAnaliza && (
                      <span className="text-[10px] text-gray-400">
                        {lokalnaAnaliza.jm} · od 2023-01
                      </span>
                    )}
                  </div>
                  {agregirano.length > 0 ? (
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-[11px]">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-600 font-semibold">Period</th>
                            <th className="px-3 py-2 text-right text-gray-600 font-semibold">Količina</th>
                            <th className="px-3 py-2 text-right text-gray-600 font-semibold">VPC avg</th>
                            <th className="px-3 py-2 text-right text-gray-600 font-semibold">Nab avg</th>
                            <th className="px-3 py-2 text-right text-gray-600 font-semibold">Marža</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...agregirano].reverse().map((a) => {
                            const marza = a.vpc_avg - a.nab_avg;
                            const marzaPosto = a.nab_avg > 0 ? `${((marza / a.nab_avg) * 100).toFixed(1)}%` : "—";
                            return (
                              <tr key={a.period} className="border-t border-gray-100 hover:bg-white transition-colors">
                                <td className="px-3 py-1.5 font-medium text-gray-700">{a.period}</td>
                                <td className="px-3 py-1.5 text-right text-gray-700">{formatQuantity(a.kolicina)}</td>
                                <td className="px-3 py-1.5 text-right text-gray-500">{a.vpc_avg.toFixed(2)}</td>
                                <td className="px-3 py-1.5 text-right text-gray-500">{a.nab_avg.toFixed(2)}</td>
                                <td className={`px-3 py-1.5 text-right font-semibold ${marza >= 0 ? "text-green-700" : "text-red-700"}`}>
                                  {marza.toFixed(2)} ({marzaPosto})
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    !transakcijeLoading && (
                      <div className="flex items-center justify-center p-4 text-xs text-gray-400">
                        Nema agregatnih podataka
                      </div>
                    )
                  )}
                  {transakcijeLoading && (
                    <div className="flex items-center justify-center p-4 text-xs text-gray-400">
                      <Loader className="w-3 h-3 animate-spin mr-2 text-[#785E9E]" />
                      Učitavanje...
                    </div>
                  )}
                </div>

                {/* Chat historija */}
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="shrink-0 bg-white px-4 py-2 border-b border-gray-200">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                      Razgovor s AI
                    </p>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
                    {chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-gray-400">
                        <p className="text-xs">Ovdje će se prikazati vaša pitanja i AI odgovori.</p>
                        <p className="text-[11px]">{aiText ? "Koristite polje s lijeve strane." : "Prvo pokrenite AI analizu."}</p>
                      </div>
                    ) : (
                      chatHistory.map((item, i) =>
                        item.role === "user" ? (
                          <div key={i} className="flex justify-end">
                            <span className="inline-block max-w-[85%] rounded-lg bg-[#785E9E] px-3 py-2 text-xs text-white leading-relaxed">
                              {item.content}
                            </span>
                          </div>
                        ) : (
                          <div key={i} className="flex justify-start">
                            <div className="max-w-[90%] rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed shadow-sm">
                              {item.content}
                            </div>
                          </div>
                        ),
                      )
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-lg bg-white border border-gray-200 px-3 py-2 shadow-sm">
                          <Loader className="w-3.5 h-3.5 animate-spin text-[#785E9E]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
