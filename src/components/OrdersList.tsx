import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';

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

interface City {
  id: string;
  name: string;
  customers: Customer[];
}

interface DaySchedule {
  day: string;
  date: string;
  cities: City[];
}

interface OrdersListProps {
  onBack: () => void;
}

export function OrdersList({ onBack }: OrdersListProps) {
  const [selectedDay, setSelectedDay] = useState<string>('tuesday');
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const schedule: Record<string, DaySchedule> = {
    tuesday: {
      day: 'Utorak',
      date: '03.02.2026',
      cities: [
        {
          id: 'novo-grad',
          name: 'Novi Grad',
          customers: [
            {
              id: '10000',
              code: '10000',
              name: 'OSTALI / RAZNO',
              orders: [
                { id: '1', code: '142', productName: 'HD vrećica 280+(2x80)x550x00100', unit: 'pak', quantity: 4000 },
              ],
            },
            {
              id: '10040',
              code: '10040',
              name: 'Kupac NIKOLAJ / Teren',
              orders: [
                { id: '2', code: '83', productName: 'Kutija pizza 52 BT/E LOGO', unit: 'kom', quantity: 100000 },
              ],
            },
            {
              id: '130',
              code: '130',
              name: 'ADEPTIO s.p /vl Bojan Pl...',
              orders: [
                { id: '3', code: '861', productName: 'Vreće za smeće 150 l LDPE', unit: 'kom', quantity: 10000 },
              ],
            },
          ],
        },
      ],
    },
    wednesday: {
      day: 'Srijeda',
      date: '04.02.2026',
      cities: [
        {
          id: 'kolor-varos',
          name: 'Kolor Varoš',
          customers: [
            {
              id: '10000-w',
              code: '10000',
              name: 'OSTALI / RAZNO',
              orders: [
                { id: '1w', code: '74', productName: 'Kutija pizza 32 BT/E LOGO', unit: 'kom', quantity: 1000000 },
              ],
            },
            {
              id: '10040-w',
              code: '10040',
              name: 'Kupac NIKOLA / Teren',
              orders: [
                { id: '2w', code: '78', productName: 'Kutija pizza 41 BT/E LOGO', unit: 'kom', quantity: 1000000 },
              ],
            },
            {
              id: '5344',
              code: '5344',
              name: 'PETROVIĆ pekara / s.p Rist...',
              orders: [
                { id: '3w', code: '756', productName: 'PVC CLING FOLIJA 450 mm / 300 m', unit: 'kom', quantity: 10000 },
              ],
            },
          ],
        },
      ],
    },
  };

  const days = [
    { id: 'tuesday', label: 'Utorak', date: '03.02.2026' },
    { id: 'wednesday', label: 'Srijeda', date: '04.02.2026' },
    { id: 'thursday', label: 'Četvrtak', date: '05.02.2026' },
    { id: 'friday', label: 'Petak', date: '06.02.2026' },
    { id: 'saturday', label: 'Subota', date: '07.02.2026' },
  ];

  const currentSchedule = schedule[selectedDay] as DaySchedule | undefined;

  const toggleCity = (cityId: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(cityId)) {
      newExpanded.delete(cityId);
    } else {
      newExpanded.add(cityId);
    }
    setExpandedCities(newExpanded);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 md:px-8 py-4 md:py-5 border-b-2 border-gray-200">
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

      <div className="flex flex-col lg:flex-row h-[calc(100vh-220px)]">
        <div className="w-full lg:w-32 border-r-2 border-gray-200 bg-gray-50 p-4 md:p-6 flex lg:flex-col">
          <button
            className="w-full px-4 py-3 rounded-lg transition-all text-white font-medium text-sm md:text-base"
            style={{ backgroundColor: '#785E9E' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6a4f8a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#785E9E'}
          >
            Opcije
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-96 border-r-2 border-gray-200 overflow-y-auto bg-gray-50">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 z-10">
              <div className="flex overflow-x-auto gap-1 p-3">
                {days.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDay(d.id);
                      setExpandedCities(new Set());
                      setSelectedCustomer(null);
                    }}
                    className={`px-3 py-2 rounded-lg whitespace-nowrap text-xs md:text-sm font-medium transition-all ${
                      selectedDay === d.id
                        ? 'text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedDay === d.id ? '#8FC74A' : 'transparent',
                    }}
                  >
                    <div>{d.label}</div>
                    <div className="text-xs">{d.date}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-3">
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
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p className="text-lg">Izaberite kupca da biste vidjeli narudžbe</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
