import { useState, useEffect, useRef } from "react";
import { AlertCircle, Search, DollarSign, Building2, Sun, Moon } from "lucide-react";

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
};


interface Dugovanje {
  sifra: number;
  naziv_partnera: string;
  ukupan_dug: number;
  dug_preko_24: number;
  dug_preko_30: number;
  dug_preko_60: number;
  dug_preko_120: number;
  najstariji_racun: string;
}

interface Stats {
  ukupanDug: number;
  dugPreko24: number;
  dugPreko30: number;
  dugPreko60: number;
  dugPreko120: number;
}

interface Uplata {
  sifra_partnera: number;
  napomena: string;
  sifra: number;
}

interface StatusIzvoda {
  naziv_banke: string;
  izvod_otvoren: string;
  izvod_zatvoren: string | null;
  status_izvoda: number;
}

export default function DugovanjaList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [uplateLoading, setUplateLoading] = useState(true);
  const [filter24Active, setFilter24Active] = useState(true);
  const [filter30Active, setFilter30Active] = useState(true);
  const [filter60Active, setFilter60Active] = useState(true);
  const [filter120Active, setFilter120Active] = useState(true);
  const [allDugovanja, setAllDugovanja] = useState<Dugovanje[]>([]);
  const [uplate, setUplate] = useState<Uplata[]>([]);
  const [stats, setStats] = useState<Stats>({
    ukupanDug: 0,
    dugPreko24: 0,
    dugPreko30: 0,
    dugPreko60: 0,
    dugPreko120: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [uplateError, setUplateError] = useState<string | null>(null);
  const [filterDo24Active, setFilterDo24Active] = useState(true);
  const [statusIzvoda, setStatusIzvoda] = useState<StatusIzvoda[]>([]);
  const [highContrast, setHighContrast] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchDugovanja();
    fetchUplate();
    fetchStatusIzvoda();

    pollingRef.current = setInterval(fetchStatusIzvoda, 60_000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchStatusIzvoda = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/dugovanja/status-izvoda`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return;
      const result = await response.json();
      if (result.success) setStatusIzvoda(result.data || []);
    } catch {
      // tiho — ne blokiramo glavni prikaz
    }
  };

  // ===== DUGOVANJA - GLAVNA PROCEDURA (OBAVEZNA) =====
  const fetchDugovanja = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/dugovanja`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Greška pri učitavanju dugovanja");
      }

      const dugovanjaResult = await response.json();
      //console.log("📊 DUGOVANJA UČITANA:", dugovanjaResult.data); // ← DODAJ OVO

      if (dugovanjaResult.success) {
        setAllDugovanja(dugovanjaResult.data);
        setStats(
          dugovanjaResult.stats || {
            ukupanDug: 0,
            dugPreko24: 0,
            dugPreko30: 0,
            dugPreko60: 0,
            dugPreko120: 0,
          },
        );
      } else {
        setError(dugovanjaResult.error || "Greška pri učitavanju dugovanja");
      }
    } catch (err) {
      console.error("❌ Error fetching dugovanja:", err);
      setError("Greška pri učitavanju dugovanja");
    } finally {
      setLoading(false);
    }
  };

  // ===== UPLATE - SEKUNDARNA PROCEDURA (OPCIONA) =====
  const fetchUplate = async () => {
    try {
      setUplateLoading(true);
      setUplateError(null);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/uplate`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(
          "⚠️ Greška pri učitavanju uplata - nastavljam sa dugovima",
        );
        setUplateError("Uplate se nisu mogle učitati");
        return;
      }

      const uplateResult = await response.json();
      //  console.log('💰 UPLATE UČITANE:', uplateResult.data); // ← DODAJ OVO
      //  console.log('🔍 TESTIRANJE imaUplatu(251):', uplateResult.data?.filter(u => Number(u.sifra) === 251)); // ← DODAJ OVO

      if (uplateResult.success) {
        setUplate(uplateResult.data || []);
        // console.log("✅ Uplate uspješno učitane");
      } else {
        console.warn("⚠️ Greška:", uplateResult.error);
        setUplateError(uplateResult.error || "Greška pri učitavanju uplata");
      }
    } catch (err) {
      console.error("❌ Error fetching uplate:", err);
      setUplateError("Greška pri učitavanju uplata");
      // VAŽNO: Dugovanja nastavljaju raditi normalno!
    } finally {
      setUplateLoading(false);
    }
  };

  // Funkcija koja proverava da li postoji uplata za datu šifru
  const imaUplatu = (sifra: number): boolean => {
    //return uplate.some(u => u.sifra === sifra);
    return uplate.some((u) => Number(u.sifra) === sifra);
  };

  // Filtriranje dugovanja - logika kao u VB.NET kodu
  const filteredDugovanja = allDugovanja.filter((d) => {
    const matchesSearch =
      (d.naziv_partnera || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      d.sifra.toString().includes(searchTerm);
    if (!matchesSearch) return false;

    // Ako ima dug preko 120 dana
    if (d.dug_preko_120 > 0) {
      return filter120Active;
    }
    // Ako ima dug preko 60 dana (ali ne preko 120)
    else if (d.dug_preko_60 > 0) {
      return filter60Active;
    }
    // Ako ima dug preko 30 dana (ali ne preko 60)
    else if (d.dug_preko_30 > 0) {
      return filter30Active;
    }
    // NOVO: dug postoji, ali NIJE preko 24 (dug do 24 dana)
    if (d.ukupan_dug > 0 && d.dug_preko_24 <= 0) return filterDo24Active;
    // Ako ima dug preko 24 dana (ali ne preko 30)
    else if (d.dug_preko_24 > 0) {
      return filter24Active;
    }

    return true;
  });

  // Funkcija za određivanje boje reda - kao u VB.NET kodu
  const getRowColor = (d: Dugovanje): string => {
    if (highContrast) {
      if (d.dug_preko_120 > 0) return "bg-black hover:bg-gray-900";
      if (d.dug_preko_60 > 0) return "bg-red-600 hover:bg-red-700";
      if (d.dug_preko_30 > 0) return "bg-amber-500 hover:bg-amber-600";
      if (d.dug_preko_24 > 0) return "bg-green-600 hover:bg-green-700";
      return "bg-gray-100 hover:bg-gray-200";
    }
    if (d.dug_preko_120 > 0) return "bg-red-900 hover:bg-red-800";
    if (d.dug_preko_60 > 0) return "bg-red-100 hover:bg-red-200";
    if (d.dug_preko_30 > 0) return "bg-yellow-300 hover:bg-yellow-200";
    if (d.dug_preko_24 > 0) return "bg-green-100 hover:bg-green-200";
    return "bg-white hover:bg-gray-50";
  };

  // Funkcija za određivanje boje teksta
  const getTextColor = (d: Dugovanje): string => {
    if (highContrast) {
      if (d.dug_preko_30 > 0 && d.dug_preko_60 <= 0) return "text-black font-semibold";
      if (d.dug_preko_120 > 0 || d.dug_preko_60 > 0 || d.dug_preko_24 > 0) return "text-white font-semibold";
      return "text-gray-900";
    }
    if (d.dug_preko_120 > 0) return "text-white";
    return "text-gray-800";
  };

  const dugDo24 = allDugovanja.reduce((sum, d) => {
    // "DUG DO 24": ima duga, ali nije prešao 24 dana
    const imaDuga = (d.ukupan_dug || 0) > 0;
    const preko24 = (d.dug_preko_24 || 0) > 0;

    return imaDuga && !preko24 ? sum + (d.ukupan_dug || 0) : sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className={`border-2 rounded-xl p-4 ${highContrast ? "bg-blue-700 border-blue-900" : "bg-blue-100 border-blue-300"}`}>
          <div className={`text-sm font-medium mb-1 ${highContrast ? "text-blue-100" : "text-blue-800"}`}>
            Ukupan dug
          </div>
          <div className={`text-2xl font-bold ${highContrast ? "text-white" : "text-blue-900"}`}>
            {stats.ukupanDug.toLocaleString("sr-RS", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            KM
          </div>
        </div>

        {/* NOVO: DUG DO 24 */}
        <div
          className={`border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow ${highContrast ? "bg-gray-700 border-gray-900" : "bg-white border-gray-300"}`}
          onClick={() => setFilterDo24Active(!filterDo24Active)}
        >
          <div className={`text-sm font-medium mb-1 ${highContrast ? "text-gray-100" : "text-gray-700"}`}>
            Dug do 24 dana
          </div>
          <div className={`text-2xl font-bold ${highContrast ? "text-white" : "text-gray-900"}`}>
            {dugDo24.toLocaleString("sr-RS", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            KM
          </div>
          <div className="mt-2">
            <span
              className={`inline-block px-3 py-1 text-white text-xs font-semibold rounded ${
                filterDo24Active ? "bg-gray-800" : "bg-gray-400"
              }`}
            >
              {filterDo24Active ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        <div
          className={`border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow ${highContrast ? "bg-green-700 border-green-900" : "bg-green-100 border-green-300"}`}
          onClick={() => setFilter24Active(!filter24Active)}
        >
          <div className={`text-sm font-medium mb-1 ${highContrast ? "text-green-100" : "text-green-800"}`}>
            Dug preko 24 dana
          </div>
          <div className={`text-2xl font-bold ${highContrast ? "text-white" : "text-green-900"}`}>
            {stats.dugPreko24.toLocaleString("sr-RS", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            KM
          </div>
          <div className="mt-2">
            <span
              className={`inline-block px-3 py-1 text-white text-xs font-semibold rounded ${
                filter24Active ? "bg-green-600" : "bg-gray-400"
              }`}
            >
              {filter24Active ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        <div
          className={`border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow ${highContrast ? "bg-amber-500 border-amber-700" : "bg-yellow-200 border-yellow-600"}`}
          onClick={() => setFilter30Active(!filter30Active)}
        >
          <div className={`text-sm font-medium mb-1 ${highContrast ? "text-black" : "text-yellow-800"}`}>
            Dug preko 30 dana
          </div>
          <div className={`text-2xl font-bold ${highContrast ? "text-black" : "text-yellow-800"}`}>
            {stats.dugPreko30.toLocaleString("sr-RS", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            KM
          </div>
          <div className="mt-2">
            <span
              className={`inline-block px-3 py-1 text-white text-xs font-semibold rounded ${
                filter30Active ? "bg-amber-700" : "bg-gray-400"
              }`}
            >
              {filter30Active ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        <div
          className={`border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow ${highContrast ? "bg-red-600 border-red-800" : "bg-red-100 border-red-300"}`}
          onClick={() => setFilter60Active(!filter60Active)}
        >
          <div className={`text-sm font-medium mb-1 ${highContrast ? "text-red-100" : "text-red-800"}`}>
            Dug preko 60 dana
          </div>
          <div className={`text-2xl font-bold ${highContrast ? "text-white" : "text-red-900"}`}>
            {stats.dugPreko60.toLocaleString("sr-RS", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            KM
          </div>
          <div className="mt-2">
            <span
              className={`inline-block px-3 py-1 text-white text-xs font-semibold rounded ${
                filter60Active ? "bg-red-800" : "bg-gray-400"
              }`}
            >
              {filter60Active ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        <div
          className="bg-red-900 border-2 border-red-950 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilter120Active(!filter120Active)}
        >
          <div className="text-sm font-medium text-red-100 mb-1">
            Dug preko 120 dana
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.dugPreko120.toLocaleString("sr-RS", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            KM
          </div>
          <div className="mt-2">
            <span
              className={`inline-block px-3 py-1 text-white text-xs font-semibold rounded ${
                filter120Active ? "bg-red-600" : "bg-gray-400"
              }`}
            >
              {filter120Active ? "ON" : "OFF"}
            </span>
          </div>
        </div>
      </div>

      <div className={`rounded-xl shadow-lg p-6 ${highContrast ? "bg-slate-100" : "bg-white"}`}>
        <div className="flex gap-4 mb-6 items-start">
          {/* Naslov */}
          <div className="flex items-center gap-3 self-stretch">
            <AlertCircle className="w-8 h-8 shrink-0" style={{ color: "#785E9E" }} />
            <h2 className="text-3xl font-bold" style={{ color: "#785E9E" }}>
              Dugovanja
            </h2>
          </div>

          {/* Status izvoda banke - 2 reda */}
          <div className="flex flex-col gap-2 flex-1">
            {statusIzvoda.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-green-400 bg-green-50 text-green-800 text-[10px] font-medium w-fit">
                <Building2 className="w-3.5 h-3.5" />
                Nema otvorenih izvoda za danas
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {statusIzvoda.slice(0, Math.ceil(statusIzvoda.length / 2)).map((izvod, i) => {
                    const otvoren = izvod.status_izvoda === 0;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-[10px] font-medium ${
                          otvoren
                            ? "border-orange-400 bg-orange-50 text-orange-800"
                            : "border-green-400 bg-green-50 text-green-800"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-semibold">{izvod.naziv_banke}</span>
                        <span className="mx-1 text-gray-400">|</span>
                        <span>Otvoren: {formatDateTime(izvod.izvod_otvoren)}</span>
                        {!otvoren && izvod.izvod_zatvoren && (
                          <>
                            <span className="mx-1 text-gray-400">|</span>
                            <span>Zatvoren: {formatDateTime(izvod.izvod_zatvoren)}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusIzvoda.slice(Math.ceil(statusIzvoda.length / 2)).map((izvod, i) => {
                    const otvoren = izvod.status_izvoda === 0;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-[10px] font-medium ${
                          otvoren
                            ? "border-orange-400 bg-orange-50 text-orange-800"
                            : "border-green-400 bg-green-50 text-green-800"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-semibold">{izvod.naziv_banke}</span>
                        <span className="mx-1 text-gray-400">|</span>
                        <span>Otvoren: {formatDateTime(izvod.izvod_otvoren)}</span>
                        {!otvoren && izvod.izvod_zatvoren && (
                          <>
                            <span className="mx-1 text-gray-400">|</span>
                            <span>Zatvoren: {formatDateTime(izvod.izvod_zatvoren)}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Dugme za promjenu kontrasta - skroz desno */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            title={highContrast ? "Prebaci na normalnu temu" : "Prebaci na visoko-kontrastnu temu (sunce)"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-colors shrink-0 self-start ${
              highContrast
                ? "bg-amber-400 border-amber-600 text-amber-900 hover:bg-amber-500"
                : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {highContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {highContrast ? "Visoki kontrast" : "Normalna tema"}
          </button>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Pretraži po šifri ili nazivu partnera..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center px-5 py-3 border-2 border-purple-400 bg-purple-50 rounded-lg whitespace-nowrap text-purple-800 text-lg">
            Pronađeno partnera:{" "}
            <span className="font-bold ml-2">
              {!loading && !error ? filteredDugovanja.length : "–"}
            </span>
          </div>
        </div>

        {/* ===== DUGOVANJA SE UVIJEK PRIKAZUJU ===== */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600 text-lg">
              Učitavanje dugovanja...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
            <p className="text-red-700 text-lg font-medium">{error}</p>
            <button
              onClick={fetchDugovanja}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Pokušaj ponovo
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ===== UPOZORENJE ZA UPLATE (OPCIONO) ===== */}
            {uplateError && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-700 text-sm">
                  ⚠️ {uplateError}
                </span>
              </div>
            )}

            {uplateLoading && (
              <div className="mb-4 text-sm text-gray-500">
                ⏳ Učitavanje uplata u pozadini...
              </div>
            )}

            {filteredDugovanja.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-xl">
                  {searchTerm
                    ? "Nije pronađen nijedan partner sa tim kriterijumom"
                    : "Nema dugovanja"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`min-w-full border border-gray-300 rounded-lg overflow-hidden ${highContrast ? "bg-slate-100" : "bg-white"}`}>
                  <thead
                    className="text-white"
                    style={{ backgroundColor: "#785E9E" }}
                  >
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-lg">
                        Šif
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-lg">
                        Naziv partnera
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-lg">
                        Ukupan dug
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-lg">
                        &gt;30 dana
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-lg">
                        &gt;60 dana
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-lg">
                        &gt;120 dana
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-lg">
                        Najstariji račun
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDugovanja.map((dug, index) => (
                      <tr
                        key={`${dug.sifra}-${index}`}
                        className={`border-t border-gray-200 transition-colors ${getRowColor(dug)}`}
                      >
                        <td
                          className={`px-6 py-4 font-medium ${getTextColor(dug)}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{dug.sifra}</span>
                            {imaUplatu(dug.sifra) && (
                              // <span className="text-green-600 font-bold text-xl" title="Ima uplatu">✓</span>
                              <DollarSign
                                className="w-5 h-5 text-green-500"
                                aria-label="Uplata evidentirana"
                              />
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${getTextColor(dug)}`}>
                          {dug.naziv_partnera}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-bold ${getTextColor(dug)}`}
                        >
                          {dug.ukupan_dug.toLocaleString("sr-RS", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          className={`px-6 py-4 text-right ${getTextColor(dug)}`}
                        >
                          {dug.dug_preko_30.toLocaleString("sr-RS", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          className={`px-6 py-4 text-right ${getTextColor(dug)}`}
                        >
                          {dug.dug_preko_60.toLocaleString("sr-RS", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          className={`px-6 py-4 text-right ${getTextColor(dug)}`}
                        >
                          {dug.dug_preko_120.toLocaleString("sr-RS", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={`px-6 py-4 ${getTextColor(dug)}`}>
                          {formatDate(dug.najstariji_racun)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
