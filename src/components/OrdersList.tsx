import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';

interface Supplier {
  id: string;
  code: string;
  name: string;
}

interface OrderItem {
  id: string;
  code: string;
  productName: string;
  unit: string;
  quantity: number;
  notes: string;
}

interface OrdersListProps {
  onBack: () => void;
}

export function OrdersList({ onBack }: OrdersListProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [orderItems] = useState<OrderItem[]>([]);

  const suppliers: Supplier[] = [
    { id: '1', code: '84', name: 'Prijedor' },
    { id: '2', code: '14', name: 'Cazin' },
    { id: '3', code: '10', name: 'Kostajnica' },
    { id: '4', code: '7', name: 'Velika Kladuša' },
    { id: '5', code: '8', name: 'Bužim' },
    { id: '6', code: '9', name: 'Novi Grad' },
    { id: '7', code: '127', name: 'Bosanska Krupa' },
    { id: '8', code: '11', name: 'Bihač' },
  ];

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

      <div className="flex flex-col lg:flex-row h-[calc(100vh-220px)] lg:h-auto">
        <div className="w-full lg:w-80 border-r-2 border-gray-200 overflow-y-auto bg-gray-50">
          <div className="p-4 md:p-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-700">Proizvođači</h3>
            {suppliers.map((supplier) => (
              <button
                key={supplier.id}
                onClick={() => setSelectedSupplier(supplier.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all font-medium ${
                  selectedSupplier === supplier.id
                    ? 'bg-white text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:shadow-md'
                }`}
                style={{
                  backgroundColor: selectedSupplier === supplier.id ? '#8FC74A' : 'white',
                  color: selectedSupplier === supplier.id ? 'white' : '#374151',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{
                      backgroundColor: selectedSupplier === supplier.id ? 'rgba(255,255,255,0.3)' : '#8FC74A',
                    }}
                  >
                    {supplier.code}
                  </div>
                  <span className="truncate">{supplier.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedSupplier ? (
            <>
              <div className="px-6 md:px-8 py-4 md:py-5 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
                <h3 className="text-lg font-semibold text-gray-700">
                  {suppliers.find(s => s.id === selectedSupplier)?.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Šifra: {suppliers.find(s => s.id === selectedSupplier)?.code}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {orderItems.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-lg mb-4">Nema stavki u narudžbi</p>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-white font-medium"
                      style={{ backgroundColor: '#8FC74A' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7fb83a'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8FC74A'}
                    >
                      <Plus className="w-5 h-5" />
                      Dodaj stavku
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4 font-semibold text-gray-600 text-sm">
                      <div>Šifra</div>
                      <div className="md:col-span-2">Naziv proizvoda</div>
                      <div>JM</div>
                      <div>Količina</div>
                      <div>Akcije</div>
                    </div>
                    {orderItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg items-center">
                        <div className="font-medium text-gray-700">{item.code}</div>
                        <div className="md:col-span-2 text-gray-700">{item.productName}</div>
                        <div className="text-gray-700">{item.unit}</div>
                        <div className="font-medium text-gray-700">{item.quantity}</div>
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
                )}
              </div>

              <div className="px-6 md:px-8 py-4 md:py-5 border-t-2 border-gray-200 bg-gray-50 flex justify-between items-center">
                <button
                  className="px-6 py-3 rounded-lg transition-all text-white font-medium inline-flex items-center gap-2"
                  style={{ backgroundColor: '#8FC74A' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7fb83a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8FC74A'}
                >
                  <Plus className="w-5 h-5" />
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
              <p className="text-lg">Izaberite proizvođača da biste počeli sa narudžbom</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
