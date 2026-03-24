import { useMemo, useState, useEffect } from "react";
import {
  Package,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Printer,
} from "lucide-react";
//import { generateStampaReport } from "../services/stampa/offerReport";
//import { generateStampaReport } from "./stampaRacuna";
import { generateStampaReport } from "./stampa/stampaReport";
// interface ArtikliListProps {
//   onBack: () => void; // ostavljamo prop radi kompatibilnosti, ali se ne koristi dok je dugme "Nazad" uklonjeno
// }

interface Artikal {
  sifra_proizvoda: number;
  naziv_proizvoda: string;
  jm: string;
  vpc: number;
  mpc: number;
  kolicinaNaStanju: number;
  sifraGrupe: string;
  nazivGrupe: string;
  image_url?: string | null; // NOVO: opcioni URL slike proizvoda
}

interface ArtikalGrupaOption {
  sifraGrupe: string;
  nazivGrupe: string;
}

const ALL_ARTIKLI_GRUPE = "all";

const toGroupString = (value: unknown): string => String(value ?? "").trim();

export default function ArtikliList() {
  const [artikli, setArtikli] = useState<Artikal[]>([]);
  const [artikliGrupe, setArtikliGrupe] = useState<ArtikalGrupaOption[]>([]);
  const [selectedArtikliGrupa, setSelectedArtikliGrupa] =
    useState<string>(ALL_ARTIKLI_GRUPE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handlePrintSelected = async () => {
    const selected = artikli.filter((a) =>
      selectedSifre.has(a.sifra_proizvoda),
    );

    if (selected.length === 0) return;

    await generateStampaReport({
      items: selected,
      documentType: "PONUDA",
      filePrefix: "stampa",
    });
  };

  // NOVO: selekcija proizvoda
  const [selectedSifre, setSelectedSifre] = useState<Set<number>>(new Set());

  const fetchArtikli = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/artikli`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP greška: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const artikliData = result.data.map((a: any) => ({
          sifra_proizvoda: a.sifra_proizvoda || 0,
          naziv_proizvoda: a.naziv_proizvoda || "",
          jm: a.jm || "",
          vpc: parseFloat(a.vpc || a.VPC) || 0,
          mpc: parseFloat(a.mpc || a.MPC) || 0,
          kolicinaNaStanju:
            Number(
              a.kolicinaNaStanju ?? a.kolicina_proizvoda ?? a.stanje ?? 0,
            ) || 0,
          sifraGrupe: toGroupString(
            a.grupa_proizvoda ?? a.sifra_grupe ?? a.grupa_sifra,
          ),
          nazivGrupe: toGroupString(a.naziv_grupe ?? a.Naziv_grupe ?? ""),
          // probaj više mogućih naziva polja, da “radi odmah” kad API vrati neki od njih:
          image_url:
            a.image_url || a.slika_url || a.slika || a.imageUrl || null,
        }));

        // console.log(
        //   "[ArtikliList] grupe iz getArtikli (sample)",
        //   artikliData.slice(0, 50).map((item: Artikal) => ({
        //     sifraArtikla: item.sifra_proizvoda,
        //     sifraGrupe: item.sifraGrupe,
        //     nazivGrupe: item.nazivGrupe,
        //   })),
        // );

        setArtikli(artikliData);
        // reset selekcije nakon refresh-a (možeš ukloniti ako želiš da se čuva selekcija)
        setSelectedSifre(new Set());
      } else {
        throw new Error(result.error || "Nepoznata greška");
      }
    } catch (err) {
      console.error("Greška:", err);
      setError(
        err instanceof Error ? err.message : "Greška pri učitavanju artikala",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchArtikliGrupe = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/artikli/grupe`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setArtikliGrupe([]);
        return;
      }

      const result = await response.json();
      const rows = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];

      // Debug: koje grupe dolaze iz /api/artikli/grupe
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // console.log(
      //   "[ArtikliList] grupe raw",
      //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
      //   rows.map((row: any) => row),
      // );

      const uniqueByKey = new Map<string, ArtikalGrupaOption>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows.forEach((row: any) => {
        const sifra = toGroupString(
          row.grupa_proizvoda ??
            row.sifra_grupe ??
            row.grupa_sifra ??
            row.id_grupe ??
            row.grupa_id,
        );
        const naziv = toGroupString(
          row.naziv_grupe ?? row.Naziv_grupe ?? row.naziv,
        );
        const key = sifra;
        if (!key || uniqueByKey.has(key)) return;

        uniqueByKey.set(key, {
          sifraGrupe: key,
          nazivGrupe: naziv || sifra,
        });
      });

      // console.log(
      //   "[ArtikliList] grupe normalizovane",
      //   Array.from(uniqueByKey.values()),
      // );

      setArtikliGrupe(
        Array.from(uniqueByKey.values()).sort((a, b) =>
          a.nazivGrupe.localeCompare(b.nazivGrupe, "sr-Latn", {
            sensitivity: "base",
          }),
        ),
      );
    } catch {
      setArtikliGrupe([]);
    }
  };

  useEffect(() => {
    fetchArtikli();
    fetchArtikliGrupe();
  }, []);

  const filteredArtikli = useMemo(() => {
    return artikli
      .filter((artikal) => {
        const matchesSearch =
          (artikal.naziv_proizvoda || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (artikal.sifra_proizvoda || "").toString().includes(searchTerm);

        if (selectedArtikliGrupa === ALL_ARTIKLI_GRUPE) {
          return matchesSearch;
        }

        const groupKey = toGroupString(artikal.sifraGrupe);

        return matchesSearch && groupKey === selectedArtikliGrupa;
      })
      .sort((a, b) => {
        const aOutOfStock = Number(a.kolicinaNaStanju) === 0;
        const bOutOfStock = Number(b.kolicinaNaStanju) === 0;

        if (aOutOfStock !== bOutOfStock) {
          return aOutOfStock ? 1 : -1;
        }

        return (a.naziv_proizvoda || "").localeCompare(
          b.naziv_proizvoda || "",
          "sr-Latn",
          { sensitivity: "base" },
        );
      });
  }, [artikli, searchTerm, selectedArtikliGrupa]);

  const isAllSelected =
    filteredArtikli.length > 0 &&
    filteredArtikli.every((a) => selectedSifre.has(a.sifra_proizvoda));

  const toggleSelect = (sifra: number) => {
    setSelectedSifre((prev) => {
      const next = new Set(prev);
      if (next.has(sifra)) next.delete(sifra);
      else next.add(sifra);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedSifre((prev) => {
      const next = new Set(prev);
      filteredArtikli.forEach((a) => next.add(a.sifra_proizvoda));
      return next;
    });
  };

  const clearSelection = () => setSelectedSifre(new Set());

  const toggleSelectAll = () => {
    if (isAllSelected) clearSelection();
    else selectAllFiltered();
  };

  return (
    <div className="space-y-6">
      {/* Dugme "Nazad" je IZBAČENO */}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-8 h-8" style={{ color: "#785E9E" }} />
          <h2 className="text-3xl font-bold" style={{ color: "#785E9E" }}>
            Artikli
          </h2>
        </div>

        <div className="mb-6">
          <div className="mb-3">
            <div
              className="text-sm font-semibold mb-2"
              style={{ color: "#785E9E" }}
            >
              Grupa artikala
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedArtikliGrupa(ALL_ARTIKLI_GRUPE)}
                className="px-3 py-1 rounded-full border-2 text-sm font-semibold transition-all"
                style={{
                  borderColor:
                    selectedArtikliGrupa === ALL_ARTIKLI_GRUPE
                      ? "#8FC74A"
                      : "#D1D5DB",
                  backgroundColor:
                    selectedArtikliGrupa === ALL_ARTIKLI_GRUPE
                      ? "#F0FFF4"
                      : "#FFFFFF",
                  color:
                    selectedArtikliGrupa === ALL_ARTIKLI_GRUPE
                      ? "#2F4F77"
                      : "#6B7280",
                }}
              >
                Sve grupe
              </button>

              {artikliGrupe.map((grupa) => {
                const isActive = selectedArtikliGrupa === grupa.sifraGrupe;

                return (
                  <button
                    key={grupa.sifraGrupe}
                    type="button"
                    onClick={() => setSelectedArtikliGrupa(grupa.sifraGrupe)}
                    className="px-3 py-1 rounded-full border-2 text-sm font-semibold transition-all"
                    style={{
                      borderColor: isActive ? "#8FC74A" : "#D1D5DB",
                      backgroundColor: isActive ? "#F0FFF4" : "#FFFFFF",
                      color: isActive ? "#2F4F77" : "#6B7280",
                    }}
                    title={grupa.nazivGrupe}
                  >
                    {grupa.nazivGrupe}
                  </button>
                );
              })}
            </div>
          </div>

          <input
            type="text"
            placeholder="Pretraži artikle po nazivu ili šifri..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
          />
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600 text-lg">Učitavanje artikala...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
            <p className="text-red-700 text-lg font-medium">{error}</p>
            <button
              onClick={fetchArtikli}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Pokušaj ponovo
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="text-gray-600 text-lg">
                Pronađeno artikala:{" "}
                <span className="font-semibold">{filteredArtikli.length}</span>
                <span className="ml-3">
                  Selektovano:{" "}
                  <span className="font-semibold">{selectedSifre.size}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={
                    isAllSelected
                      ? "Poništi selekciju"
                      : "Selektuj sve (filtrirane)"
                  }
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  {isAllSelected ? "Poništi" : "Selektuj sve"}
                </button>

                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={selectedSifre.size === 0}
                  title="Očisti selekciju"
                >
                  Očisti
                </button>

                <button
                  type="button"
                  onClick={handlePrintSelected}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedSifre.size === 0}
                  title="Štampaj selekciju"
                >
                  <Printer className="w-10 h-7" />

                  {selectedSifre.size > 0 ? ` (${selectedSifre.size})` : ""}
                </button>
              </div>
            </div>

            {filteredArtikli.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-xl">
                  {searchTerm
                    ? "Nije pronađen nijedan artikal sa tim kriterijumom"
                    : "Nema dostupnih artikala"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {filteredArtikli.map((artikal) => {
                  const isSelected = selectedSifre.has(artikal.sifra_proizvoda);
                  const isOutOfStock = Number(artikal.kolicinaNaStanju) === 0;

                  return (
                    <div
                      key={artikal.sifra_proizvoda}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleSelect(artikal.sifra_proizvoda)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleSelect(artikal.sifra_proizvoda);
                        }
                      }}
                      className={[
                        "border rounded-xl overflow-hidden transition-colors cursor-pointer select-none flex flex-col h-full",
                        isSelected
                          ? "border-purple-500 bg-purple-50"
                          : isOutOfStock
                            ? "border-gray-200 bg-gray-50 opacity-60 hover:bg-gray-100"
                            : "border-purple-900 bg-purple-400 hover:border-2 hover:border-[#8FC74A] hover:bg-purple-400",
                      ].join(" ")}
                      title={isOutOfStock ? "Nema na stanju" : undefined}
                    >
                      {/* image */}
                      <div className="w-full aspect-square overflow-hidden relative">
                        {/* blur pozadina */}
                        <img
                          src={`/proizvodi/${artikal.sifra_proizvoda}.jpg`}
                          className="absolute inset-0 w-full h-full object-cover blur-md scale-110"
                        />
                        {/* glavna slika */}
                        <img
                          src={`/proizvodi/${artikal.sifra_proizvoda}.jpg`}
                          alt={artikal.naziv_proizvoda}
                          className="relative w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            (
                              e.currentTarget
                                .previousElementSibling as HTMLElement
                            ).style.display = "none";
                            (
                              e.currentTarget.nextElementSibling as HTMLElement
                            ).style.display = "flex";
                          }}
                        />
                        {/* fallback */}
                        <div className="hidden flex-col items-center text-gray-400 absolute inset-0 justify-center bg-gray-100">
                          <ImageIcon className="w-10 h-10" />
                          <span className="text-sm mt-1">Nema slike</span>
                        </div>
                      </div>

                      {/* content */}
                      <div className="p-4 bg-purple-400 rounded-xl flex flex-col gap-2.5">
                        {/* Naziv - puni red */}
                        <div
                          className="text-lg font-semibold text-gray-900 w-full overflow-hidden"
                          title={artikal.naziv_proizvoda}
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {artikal.naziv_proizvoda}
                        </div>

                        {/* Šifra | JM | Stanje */}
                        <div className="flex items-center justify-between text-xs text-gray-800">
                          <span>
                            Šifra:{" "}
                            <strong className="text-gray-900">
                              {artikal.sifra_proizvoda}
                            </strong>
                          </span>
                          <span>
                            JM:{" "}
                            <strong className="text-gray-900">
                              {artikal.jm}
                            </strong>
                          </span>
                          <span>
                            Stanje:{" "}
                            <strong
                              className={
                                isOutOfStock ? "text-red-600" : "text-gray-900"
                              }
                            >
                              {Number(artikal.kolicinaNaStanju).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </strong>
                          </span>
                        </div>

                        {/* VPC / MPC */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white border border-gray-200 rounded-lg p-2">
                            <div className="text-xs text-gray-500">VPC</div>
                            <div className="font-medium text-gray-900">
                              {artikal.vpc.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              KM
                            </div>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-lg p-2">
                            <div className="text-xs text-gray-500">MPC</div>
                            <div className="font-medium text-gray-900">
                              {artikal.mpc.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              KM
                            </div>
                          </div>
                        </div>

                        {/* Grupa (lijevo) + Checkbox (desno) */}
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-[#2F4F77] bg-[#F0FFF4] border border-[#8FC74A] rounded-full px-2.5 py-0.5 whitespace-nowrap">
                            {artikal.nazivGrupe ||
                              `Grupa ${artikal.sifraGrupe || "-"}`}
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleSelect(artikal.sifra_proizvoda)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 accent-purple-600"
                            aria-label={`Selektuj artikal ${artikal.naziv_proizvoda}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
