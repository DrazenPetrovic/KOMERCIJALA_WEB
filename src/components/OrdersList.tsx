import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Edit2, Trash2, Loader } from 'lucide-react';

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

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
  id: string;
  sifra_kupca: number;
  ime: string;
  adresa: string;
}

interface Customer {
  id: string;
  code: string;
  name: string;
  orders: Order[];
}

interface Order {
  id: string;
  code: string;
  productName: string;
  unit: string;
  quantity: number;
  note?: string;
}

interface CentralnaStavka {
  sif_tabele: string;
  sif: string;
  naziv_proizvoda: string;
  jm: string;
  kolicina: number;
  napomena: string;
}

interface City {
  id: string;
  name: string;
  customers: Customer[];
}

interface DaySchedule {
  sifraTerenaDostava: number;
  sifraTermena: number;
  date: string;
  day: string;
  cities: City[];
}

interface OrdersListProps {
  onBack: () => void;
}

export function OrdersList({ onBack }: OrdersListProps) {
  // ===== DUMMY PODACI =====
  const dummyCustomers: Kupac[] = [
    { id: '1', sifra_kupca: 101, ime: 'Kupac 1', adresa: 'Adresa 1' },
    { id: '2', sifra_kupca: 102, ime: 'Kupac 2', adresa: 'Adresa 2' },
    { id: '3', sifra_kupca: 103, ime: 'Kupac 3', adresa: 'Adresa 3' },
  ];

  // ===== STATE =====
  const [tereniData, setTereniData] = useState<TerenoData[]>([]);
  const [terenGradData, setTerenGradData] = useState<TerenGrad[]>([]);
  const [loading, setLoading] = useState(true);
  const [terenGradLoading, setTerenGradLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTerenaSifra, setSelectedTerenaSifra] = useState<number | null>(null);
  const [selectedGrad, setSelectedGrad] = useState<number | null>(null);
  const [selectedKupac, setSelectedKupac] = useState<Kupac | null>(null);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [centralneStavke] = useState<CentralnaStavka[]>([]);
  const [terenGradError, setTerenGradError] = useState<string | null>(null);

  const mockSchedule: Record<number, DaySchedule> = {};

  // ===== GLAVNA PROCEDURA - TERENI PO DANIMA (OBAVEZNA) =====
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
        }
      }
    } catch (error) {
      console.error('❌ Greška pri učitavanju terena:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== SEKUNDARNA PROCEDURA - TEREN GRAD (OPCIONA) =====
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

  // Filtriraj teren-grad podatke po odabranoj šifri
  const getGradesForSelectedTeren = (): TerenGrad[] => {
    if (!selectedTerenaSifra) return [];
    return terenGradData.filter(tg => tg.sifra_terena === selectedTerenaSifra);
  };

  const uniqueDays = Array.from(
    new Map(
      tereniData.map(t => [
        t.sifra_terena_dostava,
        {
          sifraTerenaDostava: t.sifra_terena_dostava,
          sifraTermena: t.sifra_terena,
          day: t.naziv_dana,
          date: formatDate(t.datum_dostave)
        }
      ])
    ).values()
  ).sort((a, b) => a.sifraTerenaDostava - b.sifraTerenaDostava);

  const currentSchedule = selectedDay ? mockSchedule[selectedDay] : undefined;

  const toggleCity = (cityId: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(cityId)) {
      newExpanded.delete(cityId);
    } else {
      newExpanded.add(cityId);
    }
    setExpandedCities(newExpanded);
  };

  const handleDayClick = (day: any) => {
    setSelectedDay(day.sifraTerenaDostava);
    setSelectedTerenaSifra(day.sifraTermena);
    setSelectedGrad(null); // ← RESETUJ GRAD
    setSelectedKupac(null); // ← RESETUJ KUPCA
    setExpandedCities(new Set());
    setSelectedCustomer(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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
          <div className="w-full md:w-96 border-r-2 border-gray-200 overflow-y-auto bg-gray-50">
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
            </div>

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
                <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-4">
                  <div className="font-semibold mb-3" style={{ color: '#8FC74A' }}>
                    📍 Gradovi
                  </div>
                  <div className="space-y-3">
                    {getGradesForSelectedTeren().map((grad) => (
                      <div key={grad.sifra_tabele} className="space-y-2">
                        {/* DUGME ZA GRAD */}
                        <button
                          onClick={() => {
                            setSelectedGrad(grad.sifra_grada);
                            setSelectedKupac(null);
                          }}
                          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all text-left ${
                            selectedGrad === grad.sifra_grada
                              ? 'text-white shadow-lg'
                              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                          }`}
                          style={{
                            backgroundColor: selectedGrad === grad.sifra_grada ? '#8FC74A' : undefined,
                          }}
                        >
                          {grad.naziv_grada}
                        </button>

                        {/* KUPCI ZA ODABRANI GRAD */}
                        {selectedGrad === grad.sifra_grada && (
                          <div className="pl-4 space-y-2 border-l-4 border-green-300">
                            {dummyCustomers.map((kupac) => (
                              <button
                                key={kupac.id}
                                onClick={() => setSelectedKupac(kupac)}
                                className={`w-full px-3 py-2 rounded-lg text-sm transition-all text-left ${
                                  selectedKupac?.id === kupac.id
                                    ? 'bg-blue-100 border-l-4 border-blue-500'
                                    : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                              >
                                <div className="font-medium">{kupac.ime}</div>
                                <div className="text-xs text-gray-600">{kupac.adresa}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

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
            ) : selectedKupac ? (
              <>
                <div className="px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
                  <h3 className="text-lg font-semibold" style={{ color: '#785E9E' }}>
                    {selectedKupac.ime}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Šifra: {selectedKupac.sifra_kupca} | Adresa: {selectedKupac.adresa}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="text-lg">Kupac je odabran</p>
                    <p className="text-sm mt-2">Narudžbe će se učitati kad bude dostupna API logika</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
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
                        {centralneStavke.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                              Nema podataka
                            </td>
                          </tr>
                        ) : (
                          centralneStavke.map((stavka, index) => (
                            <tr key={`${stavka.sif_tabele}-${index}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {stavka.sif}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {stavka.naziv_proizvoda}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {stavka.jm}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {stavka.kolicina}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {stavka.napomena}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}