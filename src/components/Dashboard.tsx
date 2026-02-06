import { useState } from 'react';
import { LogOut, FileText, Briefcase, Users, Book, Package, TrendingUp, Award, CheckCircle, BarChart3 } from 'lucide-react';
import PartneriList from './PartneriList';
import ArtikliList from './ArtikliList';
import DugovanjaList from './DugovanjaList';
import { OrdersList } from './OrdersList';
import { CentralniPregled } from './CentralniPregled';

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

type MenuSection = 'narudzbe' | 'dugovanja' | 'izvestaji' | 'poslovanje' | 'partneri' | 'dodatni' | 'artikli' | null;

export function Dashboard({ username, onLogout }: DashboardProps) {
  const [activeSection, setActiveSection] = useState<MenuSection>(null);

  const menuItems = [
    { id: 'narudzbe', label: 'Narudžbe', icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { id: 'dugovanja', label: 'Dugovanja', icon: TrendingUp, color: 'bg-red-100 text-red-600' },
    { id: 'izvestaji', label: 'Izveštaji', icon: BarChart3, color: 'bg-green-100 text-green-600' },
    { id: 'poslovanje', label: 'Poslovanje', icon: Briefcase, color: 'bg-purple-100 text-purple-600' },
    { id: 'partneri', label: 'Partneri', icon: Users, color: 'bg-orange-100 text-orange-600' },
    { id: 'dodatni', label: 'Dodatni podaci', icon: Package, color: 'bg-teal-100 text-teal-600' },
    { id: 'artikli', label: 'Artikli', icon: Book, color: 'bg-indigo-100 text-indigo-600' },
  ];

  const renderContent = () => {
    if (activeSection === null) return null;

    if (activeSection === 'narudzbe') {
      return <OrdersList onBack={() => setActiveSection(null)} />;
    }

    if (activeSection === 'partneri') {
      return <PartneriList onBack={() => setActiveSection(null)} />;
    }

    if (activeSection === 'artikli') {
      return <ArtikliList onBack={() => setActiveSection(null)} />;
    }

    if (activeSection === 'dugovanja') {
      return <DugovanjaList onBack={() => setActiveSection(null)} />;
    }

    if (activeSection === 'poslovanje') {
      return <CentralniPregled onBack={() => setActiveSection(null)} />;
    }

    const contentMap: Record<Exclude<MenuSection, null>, string> = {
      narudzbe: 'Pregled narudžbi',
      dugovanja: 'Pregled dužovanja',
      izvestaji: 'Izveštaji',
      poslovanje: 'Poslovanje',
      partneri: 'Partneri',
      dodatni: 'Dodatni podaci',
      artikli: 'Artikli',
    };

    return contentMap[activeSection as Exclude<MenuSection, null>] || 'Sadržaj';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md" style={{ borderBottom: '3px solid #785E9E' }}>
        <div className="max-w-full mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Karpas Logo"
              className="w-12 h-12 md:w-16 md:h-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: '#785E9E' }}>
                Karpas ambalaže doo
              </h1>
              <p className="text-base md:text-lg text-gray-600 mt-1">Korisnik: {username}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 md:gap-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-5 md:px-6 py-3 md:py-4 rounded-xl transition-all text-base md:text-lg font-medium shadow-lg hover:shadow-xl transform active:scale-95"
          >
            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
            Odjava
          </button>
        </div>
      </header>

      <nav className="bg-white border-b-2 border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-full mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-2 md:gap-3 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as MenuSection)}
                  className={`flex flex-col items-center gap-2 md:gap-3 px-5 md:px-6 py-3 md:py-4 rounded-xl transition-all whitespace-nowrap min-w-[100px] md:min-w-[120px] transform active:scale-95 ${
                    isActive
                      ? 'text-white font-semibold shadow-lg scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-md'
                  }`}
                  style={isActive ? { backgroundColor: '#785E9E' } : {}}
                >
                  <Icon className="w-7 h-7 md:w-8 md:h-8" />
                  <span className="text-xs md:text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-full mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
        {activeSection === null ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4" style={{ color: '#785E9E' }}>
              Dobrodošli!
            </h2>
            <p className="text-gray-600 text-base md:text-lg lg:text-xl">
              Izaberite stavku iz menija da biste nastavili
            </p>
          </div>
        ) : activeSection === 'narudzbe' || activeSection === 'partneri' || activeSection === 'artikli' || activeSection === 'dugovanja' || activeSection === 'poslovanje' ? (
          renderContent()
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <CheckCircle className="w-8 h-8 md:w-10 md:h-10" style={{ color: '#8FC74A' }} />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: '#785E9E' }}>
                {renderContent()}
              </h2>
            </div>
            <p className="text-gray-600 text-base md:text-lg lg:text-xl">
              Izabrali ste: <span className="font-semibold" style={{ color: '#785E9E' }}>
                {menuItems.find(m => m.id === activeSection)?.label}
              </span>
            </p>
            <div className="mt-8 md:mt-10 p-8 md:p-10 lg:p-12 bg-gray-50 rounded-2xl border-2 border-dashed text-center text-gray-600 text-base md:text-lg lg:text-xl"
              style={{ borderColor: '#785E9E33' }}>
              Sadržaj sekcije će biti prikazan ovdje
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
