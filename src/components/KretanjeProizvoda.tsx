import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader } from "lucide-react";
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
  proizvodi: ProductData[];
}

interface MonthData {
  key: string;
  mjesec: number;
  godina: number;
  grupe: GroupData[];
}

interface YearData {
  godina: number;
  mjeseci: MonthData[];
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
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const toNumber = (value: number | string | null | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  const [rawData, setRawData] = useState<KretanjeProizvodaData[]>([]);
  const [expandedGroupIds, setExpandedGroupIds] = useState<
    Record<string, boolean>
  >({});

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
    const yearMap = new Map<number, Map<number, KretanjeProizvodaData[]>>();

    for (const item of rawData) {
      if (!yearMap.has(item.godina)) {
        yearMap.set(item.godina, new Map<number, KretanjeProizvodaData[]>());
      }

      const monthMap = yearMap.get(item.godina)!;
      if (!monthMap.has(item.mjesec)) {
        monthMap.set(item.mjesec, []);
      }

      monthMap.get(item.mjesec)!.push(item);
    }

    return Array.from(yearMap.entries())
      .sort(([yearA], [yearB]) => yearB - yearA)
      .map(
        ([godina, monthMap]): YearData => ({
          godina,
          mjeseci: Array.from(monthMap.entries())
            .sort(([monthA], [monthB]) => monthB - monthA)
            .map(([mjesec, items]): MonthData => {
              const groupMap = new Map<string, GroupData>();

              for (const item of items) {
                const groupKey = `${godina}_${mjesec}_${item.sifra_grupe}`;
                const existingGroup = groupMap.get(groupKey);

                if (!existingGroup) {
                  groupMap.set(groupKey, {
                    key: groupKey,
                    sifra_grupe: item.sifra_grupe,
                    naziv_grupe: item.naziv_grupe,
                    ukupna_kolicina: item.ukupna_kolicina,
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
                key: `${godina}_${mjesec}`,
                mjesec,
                godina,
                grupe: Array.from(groupMap.values()).sort((a, b) =>
                  a.naziv_grupe.localeCompare(b.naziv_grupe, "sr"),
                ),
              };
            }),
        }),
      );
  }, [rawData]);

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroupIds((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-purple-600 animate-spin" />
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
    <div className="space-y-6 pb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Kretanja proizvoda
        </h2>
        <p className="text-gray-600 text-sm">
          Pregled količina po godini, mjesecu, grupi i proizvodu
        </p>
      </div>

      <div className="space-y-4">
        {groupedByPeriod.map((yearItem) => (
          <div
            key={yearItem.godina}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div
              onClick={() => toggleGroupExpand(`year_${yearItem.godina}`)}
              className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-600 px-6 py-4 cursor-pointer hover:from-purple-100 hover:to-purple-150 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="p-1">
                    {expandedGroupIds[`year_${yearItem.godina}`] ? (
                      <ChevronDown className="w-5 h-5 text-purple-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-purple-600" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {yearItem.godina}
                    </h3>
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {yearItem.mjeseci.length} mjesec
                  {yearItem.mjeseci.length !== 1 ? "i" : ""}
                </span>
              </div>
            </div>

            {expandedGroupIds[`year_${yearItem.godina}`] && (
              <div className="divide-y">
                {yearItem.mjeseci.map((monthItem) => {
                  const monthKey = `month_${monthItem.key}`;
                  const monthName =
                    MONTHS[monthItem.mjesec - 1] || `M${monthItem.mjesec}`;

                  return (
                    <div key={monthItem.key}>
                      <div
                        onClick={() => toggleGroupExpand(monthKey)}
                        className="px-8 py-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-2 border-purple-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button className="p-0.5">
                              {expandedGroupIds[monthKey] ? (
                                <ChevronDown className="w-4 h-4 text-purple-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-purple-500" />
                              )}
                            </button>
                            <span className="font-medium text-gray-700">
                              {monthName} {monthItem.godina}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">
                              {monthItem.grupe.length} grupa
                              {monthItem.grupe.length !== 1 ? "e" : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      {expandedGroupIds[monthKey] &&
                        monthItem.grupe.length > 0 && (
                          <div className="bg-gray-50 px-8 py-3 space-y-3">
                            {monthItem.grupe.map((group) => {
                              const groupKey = `group_${group.key}`;

                              return (
                                <div
                                  key={group.key}
                                  className="rounded-lg border border-gray-200 bg-white overflow-hidden"
                                >
                                  <div
                                    onClick={() => toggleGroupExpand(groupKey)}
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3">
                                        <button className="p-0.5">
                                          {expandedGroupIds[groupKey] ? (
                                            <ChevronDown className="w-4 h-4 text-purple-500" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4 text-purple-500" />
                                          )}
                                        </button>
                                        <div>
                                          <p className="font-medium text-gray-800">
                                            {group.naziv_grupe}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            Šifra grupe: {group.sifra_grupe}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm text-gray-500">
                                          Ukupna količina
                                        </p>
                                        <p className="font-semibold text-purple-600">
                                          {group.ukupna_kolicina.toFixed(3)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {expandedGroupIds[groupKey] && (
                                    <div className="border-t border-gray-200 px-4 py-3">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="text-gray-600 text-xs font-semibold">
                                            <th className="text-left pb-2">
                                              Šifra
                                            </th>
                                            <th className="text-left pb-2">
                                              Naziv proizvoda
                                            </th>
                                            <th className="text-left pb-2">
                                              JM
                                            </th>
                                            <th className="text-right pb-2">
                                              Količina
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                          {group.proizvodi.map((product) => (
                                            <tr
                                              key={`${group.key}_${product.sifra_proizvoda}`}
                                              className="hover:bg-gray-50 transition-colors"
                                            >
                                              <td className="py-2 text-gray-700">
                                                {product.sifra_proizvoda}
                                              </td>
                                              <td className="py-2 text-gray-700">
                                                {product.naziv_proizvoda}
                                              </td>
                                              <td className="py-2 text-gray-600 text-xs">
                                                {product.jm}
                                              </td>
                                              <td className="py-2 text-right font-medium text-gray-800">
                                                {product.ukupna_kolicina.toFixed(
                                                  3,
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
