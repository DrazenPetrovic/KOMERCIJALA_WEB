import { useMemo, useState, useEffect } from "react";
import {
  Package,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Printer,
} from "lucide-react";
// interface ArtikliListProps {
//   onBack: () => void; // ostavljamo prop radi kompatibilnosti, ali se ne koristi dok je dugme "Nazad" uklonjeno
// }

interface Artikal {
  sifra_proizvoda: number;
  naziv_proizvoda: string;
  jm: string;
  vpc: number;
  mpc: number;
  image_url?: string | null; // NOVO: opcioni URL slike proizvoda
}

export default function ArtikliList() {
  const [artikli, setArtikli] = useState<Artikal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 1) Dodaj ovu pomoćnu funkciju negde u komponenti (ispod clearSelection npr.)
  const handlePrintSelected = () => {
    // uzmi sve artikle koji su selektovani (iz filtered ili iz artikli — ja bih iz artikli)
    const selected = artikli.filter((a) =>
      selectedSifre.has(a.sifra_proizvoda),
    );

    if (selected.length === 0) return;

    // za sada samo log/alert; ovde će kasnije ići PDF generator
    console.log("Selected artikli for print:", selected);
    alert(`Štampanje selekcije (${selected.length})...`);
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
          // probaj više mogućih naziva polja, da “radi odmah” kad API vrati neki od njih:
          image_url:
            a.image_url || a.slika_url || a.slika || a.imageUrl || null,
        }));

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

  useEffect(() => {
    fetchArtikli();
  }, []);

  const filteredArtikli = useMemo(() => {
    return artikli.filter((artikal) => {
      return (
        (artikal.naziv_proizvoda || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (artikal.sifra_proizvoda || "").toString().includes(searchTerm)
      );
    });
  }, [artikli, searchTerm]);

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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredArtikli.map((artikal) => {
                  const isSelected = selectedSifre.has(artikal.sifra_proizvoda);

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
                        "border rounded-xl overflow-hidden transition-colors cursor-pointer select-none",
                        isSelected
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 bg-white hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {/* image */}
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {artikal.image_url ? (
                          <img
                            src={artikal.image_url}
                            alt={artikal.naziv_proizvoda}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // fallback ako slika ne postoji / 404
                              const img = e.currentTarget;
                              img.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center text-gray-400">
                            <ImageIcon className="w-10 h-10" />
                            <span className="text-sm mt-1">Nema slike</span>
                          </div>
                        )}
                      </div>

                      {/* content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm text-gray-500">
                              Šifra: {artikal.sifra_proizvoda}
                            </div>
                            <div
                              className="text-lg font-semibold text-gray-900 truncate"
                              title={artikal.naziv_proizvoda}
                            >
                              {artikal.naziv_proizvoda}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              JM: {artikal.jm}
                            </div>
                          </div>

                          {/* checkbox (da se vidi jasno selekcija) */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleSelect(artikal.sifra_proizvoda)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-5 h-5 accent-purple-600"
                            aria-label={`Selektuj artikal ${artikal.naziv_proizvoda}`}
                          />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="bg-white border border-gray-200 rounded-lg p-2">
                            <div className="text-xs text-gray-500">VPC</div>
                            <div className="font-medium text-gray-900">
                              {artikal.vpc.toLocaleString("sr-RS", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              KM
                            </div>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-lg p-2">
                            <div className="text-xs text-gray-500">MPC</div>
                            <div className="font-medium text-gray-900">
                              {artikal.mpc.toLocaleString("sr-RS", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              KM
                            </div>
                          </div>
                        </div>

                        {/* helper: ovde ćeš kasnije lako dodati dugme "Kreiraj PDF" */}
                        {/* <button ... disabled={selectedSifre.size === 0}>Kreiraj PDF</button> */}
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
