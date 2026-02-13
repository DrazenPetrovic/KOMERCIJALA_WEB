
import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Edit2, Trash2, Loader, X } from 'lucide-react';

// Prag za šifru kupca - ako je šifra veća od ovog broja, prikazuje se simbol
const CUSTOMER_CODE_THRESHOLD = 10000;

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// ===== INTERFEJSI =====

interface Order {
  id: string;
  code: string;
  productName: string;
  unit: string;
  quantity: number;
  note?: string;
}

interface Customer {
  id: string;
  code: string;
  name: string;
  orders: Order[];
}

interface City {
  id: string;
  name: string;
  customers: Customer[];
}

interface NarudzbaProizvod {
  sif: string;
  naziv_proizvoda: string;
  jm: string;
  kolicina: number;
  napomena?: string;
}

interface NarudzbaKupac {
  sifra_kupca: number;
  naziv_kupca: string;
  proizvodi: NarudzbaProizvod[];
}

interface TerenoData {
  sifra_terena_dostava: number;
  sifra_terena: number;
  datum_dostave: string;
  zavrsena_dostava: number;
  naziv_dana: string;
}

interface TerenGrad {
  sifra_tabele: number;
  sifra_terena: number;
  naziv_terena: string;
  sifra_grada: number;
  naziv_grada: string;
  aktivan: number;
}

interface Kupac {
  sifra_kupca: number;
  naziv_kupca: string;
  sifra_grada: number;
  naziv_grada: string;
  vrsta_kupca: number;
}

interface DaySchedule {
  sifraTerenaDostava: number;
  sifraTerena: number;
  date: string;
  day: string;
  cities: City[];
}

interface DayOption {
  sifraTerenaDostava: number;
  sifraTerena: number;
  day: string;
  date: string;
}

interface OrdersListProps {
  onBack: () => void;
}

export function OrdersList({ onBack }: OrdersListProps) {
  // ===== STATE =====
  const [tereniData, setTereniData] = useState<TerenoData[]>([]);
  const [terenGradData, setTerenGradData] = useState<TerenGrad[]>([]);
  const [kupciData, setKupciData] = useState<Kupac[]>([]);
  const [loading, setLoading] = useState(true);
  const [terenGradLoading, setTerenGradLoading] = useState(true);
  const [kupciLoading, setKupciLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTerenaSifra, setSelectedTerenaSifra] = useState<number | null>(null);
  const [selectedKupac, setSelectedKupac] = useState<Kupac | null>(null);
  const [showKupacModal, setShowKupacModal] = useState(false);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [narudzbePoKupcu, setNarudzbePoKupcu] = useState<NarudzbaKupac[]>([]);
  const [loadingNarudzbe, setLoadingNarudzbe] = useState(false);
  const [terenGradError, setTerenGradError] = useState<string | null>(null);
  const [kupciError, setKupciError] = useState<string | null>(null);
  const [expandedGrad, setExpandedGrad] = useState<number | null>(null);

  const [searchKupac, setSearchKupac] = useState<string>('');

  const mockSchedule: Record<number, DaySchedule> = {};

  // ===== GLAVNA PROCEDURA - TERENI PO DANIMA =====
  useEffect(() => {
    fetchTerenPoDanima();
  }, []);

  const fetchTerenPoDanima = async () => {
    try {
      setLoading(true);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/teren/terena-po-danima`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const tereniResult = await response.json();

      if (tereniResult.success && tereniResult.data) {
        setTereniData(tereniResult.data);
        console.log('✅ Tereni po danima učitani:', tereniResult.data);

        if (tereniResult.data.length > 0) {
          const firstDay = tereniResult.data[0];
          setSelectedDay(firstDay.sifra_terena_dostava);
          setSelectedTerenaSifra(firstDay.sifra_terena);
          
          // Učitaj narudžbe za prvi dan
          if (firstDay.sifra_terena) {
            fetchAktivneNarudzbe(firstDay.sifra_terena);
          }
        }
      }
    } catch (error) {
      console.error('❌ Greška pri učitavanju terena:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== SEKUNDARNA PROCEDURA - TEREN GRAD =====
  useEffect(() => {
    fetchTerenGrad();
  }, []);

  const fetchTerenGrad = async () => {
    try {
      setTerenGradLoading(true);
      setTerenGradError(null);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/teren/teren-grad`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('⚠️ Greška pri učitavanju teren-grad');
        setTerenGradError('Gradovi se nisu mogli učitati');
        return;
      }

      const terenGradResult = await response.json();

      if (terenGradResult.success && terenGradResult.data) {
        setTerenGradData(terenGradResult.data);
        console.log('✅ Teren-grad učitan:', terenGradResult.data);
      }
    } catch (error) {
      console.error('❌ Error fetching teren-grad:', error);
      setTerenGradError('Greška pri učitavanju gradova');
    } finally {
      setTerenGradLoading(false);
    }
  };

  // ===== TERĆA PROCEDURA - KUPCI =====
  useEffect(() => {
    fetchTerenKupci();
  }, []);

  const fetchTerenKupci = async () => {
    try {
      setKupciLoading(true);
      setKupciError(null);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/teren/teren-kupci`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('⚠️ Greška pri učitavanju kupaca');
        setKupciError('Kupci se nisu mogli učitati');
        return;
      }

      const kupciResult = await response.json();

      if (kupciResult.success && kupciResult.data) {
        setKupciData(kupciResult.data);
        console.log('✅ Kupci učitani:', kupciResult.data);
      }
    } catch (error) {
      console.error('❌ Error fetching kupci:', error);
      setKupciError('Greška pri učitavanju kupaca');
    } finally {
      setKupciLoading(false);
    }
  };

  // ===== ČETVRTA PROCEDURA - AKTIVNE NARUDŽBE PO TERENU =====
  const fetchAktivneNarudzbe = async (sifraTerena: number) => {
    try {
      setLoadingNarudzbe(true);
      setNarudzbePoKupcu([]);
      console.log(`⏳ Učitavanje narudžbi za teren ${sifraTerena}...`);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Pozovi obe procedure
      const [grupisaneResponse, aktivneResponse] = await Promise.all([
        fetch(`${apiUrl}/api/narudzbe/narudzbe-grupisane?sifraTerena=${sifraTerena}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }),
        fetch(`${apiUrl}/api/narudzbe/narudzbe-aktivne?sifraTerena=${sifraTerena}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      ]);

      if (!grupisaneResponse.ok || !aktivneResponse.ok) {
        console.warn('⚠️ Greška pri učitavanju narudžbi');
        return;
      }

      const grupisaneResult = await grupisaneResponse.json();
      const aktivneResult = await aktivneResponse.json();

      console.log('✅ Grupisane narudžbe:', grupisaneResult.data);
      console.log('✅ Aktivne narudžbe:', aktivneResult.data);

      // Kombiniraj podatke - grupisane sadrže kupce, aktivne proizvode
      if (grupisaneResult.success && aktivneResult.success) {
        const grupisaneData = grupisaneResult.data || [];
        const aktivneData = aktivneResult.data || [];

        // Kreiraj mapu kupaca sa proizvodima
        const kupciMap = new Map<number, NarudzbaKupac>();

        // Prvo dodaj sve kupce iz grupisanih
        grupisaneData.forEach((item: any) => {
          if (!kupciMap.has(item.sifra_kupca)) {
            kupciMap.set(item.sifra_kupca, {
              sifra_kupca: item.sifra_kupca,
              naziv_kupca: item.naziv_kupca || item.naziv || 'Nepoznat kupac',
              proizvodi: []
            });
          }
        });

        // Dodaj proizvode iz aktivnih narudžbi
        aktivneData.forEach((item: any) => {
          const kupac = kupciMap.get(item.sifra_kupca);
          if (kupac) {
            kupac.proizvodi.push({
              sif: item.sif || item.sifra_proizvoda,
              naziv_proizvoda: item.naziv_proizvoda,
              jm: item.jm,
              kolicina: item.kolicina,
              napomena: item.napomena || ''
            });
          }
        });

        const narudzbe = Array.from(kupciMap.values());
        setNarudzbePoKupcu(narudzbe);
        console.log('✅ Narudžbe po kupcu formirane:', narudzbe);
      }
    } catch (error) {
      console.error('❌ Error fetching aktivne narudžbe:', error);
    } finally {
      setLoadingNarudzbe(false);
    }
  };

  // ===== FILTRIRAJUĆE FUNKCIJE =====
  const getGradesForSelectedTeren = (): TerenGrad[] => {
    if (!selectedTerenaSifra) return [];
    return terenGradData.filter(tg => tg.sifra_terena === selectedTerenaSifra);
  };

const getKupciForGrad = (sifraGrada: number): Kupac[] => {
  //   return kupciData.filter(k => k.sifra_grada === sifraGrada);
  // };
  const kupciZaGrad = kupciData.filter(k => k.sifra_grada === sifraGrada);
  
  // Ako nema search texta, vrati sve kupce
  if (!searchKupac.trim()) {
    return kupciZaGrad;
  }
  
  // Filtriraj kupce po search textu (traži u nazivu kupca)
  const searchLower = searchKupac.toLowerCase();
  return kupciZaGrad.filter(kupac => 
    kupac.naziv_kupca.toLowerCase().includes(searchLower) ||
    kupac.sifra_kupca.toString().includes(searchKupac)
  );
  };




  const uniqueDays = Array.from(
    new Map(
      tereniData.map(t => [
        t.sifra_terena_dostava,
        {
          sifraTerenaDostava: t.sifra_terena_dostava,
          sifraTerena: t.sifra_terena,
          day: t.naziv_dana,
          date: formatDate(t.datum_dostave)
        }
      ])
    ).values()
  ).sort((a, b) => a.sifraTerenaDostava - b.sifraTerenaDostava);

  const currentSchedule = selectedDay ? mockSchedule[selectedDay] : undefined;

  // ===== HANDLER FUNKCIJE =====
  const toggleCity = (cityId: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(cityId)) {
      newExpanded.delete(cityId);
    } else {
      newExpanded.add(cityId);
    }
    setExpandedCities(newExpanded);
  };

  const handleDayClick = (day: DayOption) => {
    setSelectedDay(day.sifraTerenaDostava);
    setSelectedTerenaSifra(day.sifraTerena);
    setExpandedGrad(null);
    setSelectedKupac(null);
    setShowKupacModal(false);
    setExpandedCities(new Set());
    setSelectedCustomer(null);
    setSearchKupac('');
    
    // Učitaj aktivne narudžbe za odabrani teren
    if (day.sifraTerena) {
      fetchAktivneNarudzbe(day.sifraTerena);
    }
  };

  const handleGradClick = (grad: TerenGrad) => {
    if (expandedGrad === grad.sifra_grada) {
      setExpandedGrad(null);
      setSelectedKupac(null);
      setShowKupacModal(false);
    } else {
      setExpandedGrad(grad.sifra_grada);
      setSelectedKupac(null);
      setShowKupacModal(false);
    }
  };

  const handleKupacClick = (kupac: Kupac) => {
    setSelectedKupac(kupac);
    setShowKupacModal(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 px-6 md:px-8 py-4 md:py-5 border-b-2 border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
          </button>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#785E9E' }}>
            Pregled narudžbi
          </h2>
        </div>
        <button
          className="px-6 py-3 rounded-lg transition-all text-white font-medium text-sm md:text-base whitespace-nowrap"
          style={{ backgroundColor: '#785E9E' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6a4f8a'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#785E9E'}
        >
          Opcije
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-220px)]">
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LIJEVA STRANA - NAVIGACIJA */}
          <div className="w-full md:w-96 border-r-2 border-gray-200 overflow-y-auto bg-gray-50">
            {/* HEADER SA DANIMA */}
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 z-10">
              <div className="flex overflow-x-auto gap-1 p-3">
                {loading ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-gray-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Učitavanje...</span>
                  </div>
                ) : uniqueDays.length === 0 ? (
                  <div className="px-3 py-2 text-gray-600 text-sm">Nema dostupnih dana</div>
                ) : (
                  uniqueDays.map((d) => (
                    <button
                      key={d.sifraTerenaDostava}
                      onClick={() => handleDayClick(d)}
                      className={`px-3 py-2 rounded-lg whitespace-nowrap text-xs md:text-sm font-medium transition-all ${
                        selectedDay === d.sifraTerenaDostava
                          ? 'text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: selectedDay === d.sifraTerenaDostava ? '#8FC74A' : 'transparent',
                      }}
                    >
                      <div>{d.day}</div>
                      <div className="text-xs">{d.date}</div>
                    </button>
                  ))
                )}
              </div>

              {/* UPOZORENJA I LOADING */}
              {terenGradError && (
                <div className="px-3 py-2 bg-yellow-50 border-t border-yellow-200 text-yellow-700 text-xs flex items-center gap-2">
                  <span>⚠️ {terenGradError}</span>
                </div>
              )}

              {terenGradLoading && (
                <div className="px-3 py-2 text-gray-500 text-xs flex items-center gap-2">
                  <Loader className="w-3 h-3 animate-spin" />
                  <span>Učitavanje gradova...</span>
                </div>
              )}

              {kupciError && (
                <div className="px-3 py-2 bg-yellow-50 border-t border-yellow-200 text-yellow-700 text-xs flex items-center gap-2">
                  <span>⚠️ {kupciError}</span>
                </div>
              )}

              {kupciLoading && (
                <div className="px-3 py-2 text-gray-500 text-xs flex items-center gap-2">
                  <Loader className="w-3 h-3 animate-spin" />
                  <span>Učitavanje kupaca...</span>
                </div>
              )}
            </div>

            {/* SADRŽAJ */}
            <div className="p-4 space-y-4">
              {currentSchedule?.cities.map((city) => (
                <div key={city.id} className="bg-white rounded-lg shadow-sm">
                  <button
                    onClick={() => toggleCity(city.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-all font-semibold"
                    style={{ color: '#785E9E' }}
                  >
                    <span>{city.name}</span>
                    {expandedCities.has(city.id) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>

                  {expandedCities.has(city.id) && (
                    <div className="border-t-2 border-gray-100 divide-y">
                      {city.customers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => setSelectedCustomer(customer)}
                          className={`w-full text-left px-4 py-3 transition-all text-sm ${
                            selectedCustomer?.id === customer.id
                              ? 'bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                          style={{
                            color: selectedCustomer?.id === customer.id ? '#8FC74A' : '#374151',
                            fontWeight: selectedCustomer?.id === customer.id ? 'bold' : 'normal',
                          }}
                        >
                          <div className="font-medium">{customer.code}</div>
                          <div className="text-xs text-gray-600 truncate">{customer.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* ===== GRADOVI KAO DUGMADI ===== */}
              {!terenGradError && !terenGradLoading && getGradesForSelectedTeren().length > 0 && (
                <div className="bg-white rounded-lg shadow-sm mt-4 border-2 border-green-200 p-4">
                  {/* <div className="font-semibold mb-3" style={{ color: '#8FC74A' }}>
                    📍 Gradovi
                  </div> */}

                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="🔍 Pretraži kupce po imenu ili šifri..."
                          value={searchKupac}
                          onChange={(e) => setSearchKupac(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-400 focus:outline-none transition-all"
                        />
                        {searchKupac && (
                          <div className="mt-2 text-xs text-gray-600">
                            Pretraga: "<span className="font-semibold text-green-600">{searchKupac}</span>"
                            <button
                              onClick={() => setSearchKupac('')}
                              className="ml-2 text-red-500 hover:text-red-700 font-medium"
                            >
                              ✕ Obriši
                            </button>
                          </div>
                        )}
                      </div>

                  <div className="space-y-3">
                    {getGradesForSelectedTeren().map((grad) => (
                      <div key={grad.sifra_tabele} className="space-y-2">
                        {/* DUGME ZA GRAD - TOGGLE */}
                        <button
                          onClick={() => handleGradClick(grad)}
                          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all text-left flex items-center justify-between ${
                            expandedGrad === grad.sifra_grada
                              ? 'text-white shadow-lg'
                              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                          }`}
                          style={{
                            backgroundColor: expandedGrad === grad.sifra_grada ? '#8FC74A' : undefined,
                          }}
                        >
                          <span>{grad.naziv_grada}</span>
                          {expandedGrad === grad.sifra_grada ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>

                        {/* KUPCI ZA ODABRANI GRAD */}
                        {expandedGrad === grad.sifra_grada && (
                          <div className="pl-4 space-y-2 border-l-4 border-green-300 animate-in fade-in duration-200">
                            {kupciLoading ? (
                              <div className="px-3 py-2 text-gray-500 text-xs flex items-center gap-2">
                                <Loader className="w-3 h-3 animate-spin" />
                                <span>Učitavanje kupaca...</span>
                              </div>
                            ) : getKupciForGrad(grad.sifra_grada).length === 0 ? (
                              <div className="px-3 py-2 text-gray-600 text-sm">
                                        {searchKupac ? (<> Nema kupaca za pretragu "<span className="font-semibold">{searchKupac}</span>"
                                    </>) : (
                                                'Nema kupaca'
                                             )}                           
                              </div>
                            ) : (
                              getKupciForGrad(grad.sifra_grada).map((kupac) => (
                                <button
                                  key={kupac.sifra_kupca}
                                  onClick={() => handleKupacClick(kupac)}
                                  className={`w-full px-3 py-2 rounded-lg text-sm transition-all text-left font-medium ${
                                    selectedKupac?.sifra_kupca === kupac.sifra_kupca
                                      ? 'text-white shadow-lg'
                                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                  }`}
                                  style={{
                                    backgroundColor: selectedKupac?.sifra_kupca === kupac.sifra_kupca ? '#8FC74A' : undefined,
                                  }}
                                >
                                  {kupac.naziv_kupca} {kupac.sifra_kupca > CUSTOMER_CODE_THRESHOLD && '⭐'}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== DESNA STRANA - SADRŽAJ ===== */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedCustomer ? (
              <>
                <div className="px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
                  <h3 className="text-lg font-semibold" style={{ color: '#785E9E' }}>
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Kod: {selectedCustomer.code} | {currentSchedule?.day} ({currentSchedule?.date})
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4 font-semibold text-gray-600 text-sm">
                      <div>Šifra</div>
                      <div className="md:col-span-2">Naziv proizvoda</div>
                      <div>JM</div>
                      <div>Količina</div>
                      <div>Akcije</div>
                    </div>
                    {selectedCustomer.orders.map((order) => (
                      <div key={order.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg items-center">
                        <div className="font-medium text-gray-700">{order.code}</div>
                        <div className="md:col-span-2 text-gray-700">{order.productName}</div>
                        <div className="text-gray-700">{order.unit}</div>
                        <div className="font-medium text-gray-700">{order.quantity}</div>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-blue-100 rounded-lg transition-all">
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button className="p-2 hover:bg-red-100 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50 flex justify-end gap-3">
                  <button
                    className="px-6 py-3 rounded-lg transition-all text-white font-medium"
                    style={{ backgroundColor: '#8FC74A' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7fb83a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8FC74A'}
                  >
                    Dodaj stavku
                  </button>
                  <button
                    className="px-6 py-3 rounded-lg transition-all text-white font-medium"
                    style={{ backgroundColor: '#785E9E' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6a4f8a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#785E9E'}
                  >
                    Spremi narudžbu
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {loadingNarudzbe ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader className="w-8 h-8 animate-spin text-purple-600" />
                      <span className="ml-3 text-gray-600">Učitavanje narudžbi...</span>
                    </div>
                  ) : narudzbePoKupcu.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">Nema aktivnih narudžbi za odabrani dan</p>
                      <p className="text-gray-400 text-sm mt-2">Odaberite dan da vidite narudžbe</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {narudzbePoKupcu.map((kupac) => (
                        <div key={kupac.sifra_kupca} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
                          {/* Zaglavlje sa nazivom kupca */}
                          <div className="bg-gradient-to-r from-purple-100 to-green-100 px-6 py-4 border-b-2 border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-xl font-bold" style={{ color: '#785E9E' }}>
                                  {kupac.naziv_kupca}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Šifra kupca: <span className="font-semibold">{kupac.sifra_kupca}</span>
                                  {kupac.sifra_kupca > CUSTOMER_CODE_THRESHOLD && <span className="ml-2">⭐</span>}
                                </p>
                              </div>
                              <div className="bg-white px-4 py-2 rounded-lg shadow">
                                <span className="text-sm text-gray-600">Ukupno stavki:</span>
                                <span className="ml-2 text-lg font-bold" style={{ color: '#8FC74A' }}>
                                  {kupac.proizvodi.length}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Tabela sa proizvodima */}
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ŠIF
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    NAZIV PROIZVODA
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    JM
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    KOLIČINA
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    NAPOMENA
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {kupac.proizvodi.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                      Nema proizvoda
                                    </td>
                                  </tr>
                                ) : (
                                  kupac.proizvodi.map((proizvod, index) => (
                                    <tr key={`${kupac.sifra_kupca}-${proizvod.sif}-${index}`} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {proizvod.sif}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-900">
                                        {proizvod.naziv_proizvoda}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {proizvod.jm}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: '#8FC74A' }}>
                                        {proizvod.kolicina}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-600">
                                        {proizvod.napomena || '-'}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODAL ZA KUPCA ===== */}
      {showKupacModal && selectedKupac && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#785E9E' }}>
                Odabrani kupac
              </h2>
              <button
                onClick={() => {
                  setShowKupacModal(false);
                  setSelectedKupac(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Šifra kupca:</div>
                <div className="text-2xl font-bold" style={{ color: '#785E9E' }}>
                  {selectedKupac.sifra_kupca}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-1">Naziv kupca:</div>
                <div className="text-xl font-semibold text-gray-800">
                  {selectedKupac.naziv_kupca}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Grad:</div>
                <div className="text-lg font-medium text-gray-800">
                  {selectedKupac.naziv_grada}
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Vrsta kupca:</div>
                <div className="text-lg font-medium text-gray-800">
                  {selectedKupac.vrsta_kupca}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  console.log('Odabrani kupac:', selectedKupac);
                  setShowKupacModal(false);
                }}
                className="flex-1 px-4 py-3 rounded-lg transition-all text-white font-medium"
                style={{ backgroundColor: '#8FC74A' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7fb83a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8FC74A'}
              >
                Kreiraj narudžbu
              </button>
              <button
                onClick={() => {
                  setShowKupacModal(false);
                  setSelectedKupac(null);
                }}
                className="flex-1 px-4 py-3 rounded-lg transition-all text-gray-700 font-medium border-2 border-gray-300 hover:bg-gray-50"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
