
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Edit2, Trash2, Loader, Search } from 'lucide-react';

// Prag za šifru kupca - ako je šifra veća od ovog broja, prikazuje se simbol
const CUSTOMER_CODE_THRESHOLD = 10000;

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
  sifra_kupca: number;
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

interface Artikal {
  sifra_proizvoda: number;
  naziv_proizvoda: string;
  jm: string;
  VPC: number;
  mpc: number;
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


interface TerenDostaveInfo  {
  sifraTerenaDostava: number;
  datum_dostave: string;
  dan_dostave: string;
  // dodaj ostale svojstva ako ih ima
}

// interface OrdersListProps {
//   onBack: () => void;
// }

export function OrdersList() {
  // ===== STATE =====
  const [tereniData, setTereniData] = useState<TerenoData[]>([]);
  const [terenGradData, setTerenGradData] = useState<TerenGrad[]>([]);
  const [kupciData, setKupciData] = useState<Kupac[]>([]);
  const [loading, setLoading] = useState(true);
  const [terenGradLoading, setTerenGradLoading] = useState(true);
  const [kupciLoading, setKupciLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTerenaSifra, setSelectedTerenaSifra] = useState<number | null>(null);
  const [selectedTerenInfo, setSelectedTerenInfo] = useState<TerenDostaveInfo | null>(null);
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
  const [artikli, setArtikli] = useState<Artikal[]>([]);
  const [searchArtikli, setSearchArtikli] = useState('');


  const [selectedArtiklModal, setSelectedArtiklModal] = useState<Artikal | null>(null);
  const [novaArtiklUNarudzbi, setNovaArtiklUNarudzbi] = useState<(Artikal & { kolicina: number; napomena: string })[]>([]);
  const [artiklKolicina, setArtiklKolicina] = useState<number>(1);
  const [artiklNapomena, setArtiklNapomena] = useState<string>('');

  const [selectedVrstaPlacanja, setSelectedVrstaPlacanja] = useState<number | null>(null);

  const getSelectedTerenInfo = (): TerenDostaveInfo | null => {
    if (selectedDay === null) return null;

    // uniqueDays već ima: sifraTerenaDostava, day, date
    const d = uniqueDays.find(x => x.sifraTerenaDostava === selectedDay);
    if (!d) return null;

    return {
      sifraTerenaDostava: d.sifraTerenaDostava,
      datum_dostave: d.date, // već je dd.MM.yyyy
      dan_dostave: d.day,
    };
  };


  // DODAJ OVAJ RED ISPOD:
  const [headerCollapsed, setHeaderCollapsed] = useState<boolean>(false);




  const handleSelectArtikl = (artikal: Artikal) => {
    setSelectedArtiklModal(artikal);
    setArtiklKolicina(1);
    setArtiklNapomena('');
    };
  

      const formatPrice = (price: number | string | undefined | null): string => {
        if (price === null || price === undefined) return '0.00';
        const numPrice = typeof price === 'number' ? price : parseFloat(String(price));
        return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
      };

      const getPrice = (price: number | string | undefined | null): number => {
        if (price === null || price === undefined) return 0;
        const numPrice = typeof price === 'number' ? price : parseFloat(String(price));
        return isNaN(numPrice) ? 0 : numPrice;
      };


      const getVrstePaymentaZaKupca = (sifraKupca: number): { kod: number; naziv: string }[] => {
          if (sifraKupca >= 10000) {
            return [
              { kod: 4, naziv: 'Gotovina RK' },
              { kod: 3, naziv: 'Keš' }
            ];
          } else {
            return [
              { kod: 1, naziv: 'Žiralni' },
              { kod: 2, naziv: 'Gotovina knjiženje' }
            ];
          }
        };

    // const calculateModalTotalPrice = () => {
    //   return novaArtiklUNarudzbi.reduce((total, a) => {
    //   const price = typeof a.mpc === 'number' ? a.mpc : parseFloat(String(a.mpc) || '0');
    //   return total + (isNaN(price) ? 0 : price * a.kolicina);
    //       }, 0);
    // };

  const mockSchedule: Record<number, DaySchedule> = {};


  // ===== FUNKCIJE VEZAN ZA NARUDZBE  =====
const handleAddArtiklToModalOrder = () => {
  if (!selectedArtiklModal || artiklKolicina <= 0) return;

  // Provjeri da li artikal već postoji u OVOJ narudžbi (samo u modalu)
  const existingIndex = novaArtiklUNarudzbi.findIndex(
    (a) => a.sifra_proizvoda === selectedArtiklModal.sifra_proizvoda
  );

  if (existingIndex >= 0) {
    // Ako postoji, ažuriraj količinu
    const updatedList = [...novaArtiklUNarudzbi];
    updatedList[existingIndex] = {
      ...updatedList[existingIndex],
      kolicina: updatedList[existingIndex].kolicina + artiklKolicina,
      napomena: artiklNapomena || updatedList[existingIndex].napomena,
    };
    setNovaArtiklUNarudzbi(updatedList);
  } else {
    // Ako ne postoji, dodaj novi
    setNovaArtiklUNarudzbi([
      ...novaArtiklUNarudzbi,
      {
        ...selectedArtiklModal,
        kolicina: artiklKolicina,
        napomena: artiklNapomena,
      },
    ]);
  }

  // Resetuj formu
  setSelectedArtiklModal(null);
  setArtiklKolicina(1);
  setArtiklNapomena('');
};

const handleRemoveArtiklFromModalOrder = (sifraProizvoda: number) => {
  setNovaArtiklUNarudzbi(
    novaArtiklUNarudzbi.filter((a) => a.sifra_proizvoda !== sifraProizvoda)
  );
};

const handleUpdateModalArtiklKolicina = (sifraProizvoda: number, novaKolicina: number) => {
  if (novaKolicina <= 0) {
    handleRemoveArtiklFromModalOrder(sifraProizvoda);
    return;
  }

  const updatedList = novaArtiklUNarudzbi.map((a) =>
    a.sifra_proizvoda === sifraProizvoda ? { ...a, kolicina: novaKolicina } : a
  );
  setNovaArtiklUNarudzbi(updatedList);
};

const calculateModalTotalPrice = () => {
  return novaArtiklUNarudzbi.reduce(
    (total, a) => total + a.VPC * a.kolicina,
    0
  );
};

// Funkcija za slanje narudžbe
const handleSaveNewOrder = async () => {
  if (!selectedKupac || novaArtiklUNarudzbi.length === 0) {
    alert('Odaberi kupca i dodaj najmanje jedan proizvod!');
    return;
  }
  if (!selectedVrstaPlacanja) {
    alert('❌ OBAVEZNO odaberi vrstu plaćanja!');
    return;
  }

try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // ✅ PRIPREMI PODATKE
    const orderData = {
      sifraKupca: selectedKupac.sifra_kupca,
      sifraTerenaDostava: selectedTerenInfo?.sifraTerenaDostava,
      vrstaPlacanja: selectedVrstaPlacanja,
      proizvodi: novaArtiklUNarudzbi.map((a) => ({
      sifraProizvoda: a.sifra_proizvoda,
      kolicina: a.kolicina,
      napomena: a.napomena || '',
      })),
    };

    console.log('📤 Šaljem narudžbu:', orderData);

    // ✅ POST ZAHTJEV
    const response = await fetch(`${apiUrl}/api/narudzbe/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // ✅ PROVJERI REZULTAT
    if (result.success) {
      alert('✅ Narudžba uspješno spremljena!');
      
      // RESETUJ SVE STATE-ove
      setNovaArtiklUNarudzbi([]);
      setSelectedArtiklModal(null);
      setArtiklKolicina(1);
      setArtiklNapomena('');
      setShowKupacModal(false);
      setSelectedKupac(null);
      setSelectedVrstaPlacanja(null);
      setSelectedTerenInfo(null);
      setSearchArtikli('');
      
      // OSVJEŽI NARUDŽBE
      if (selectedDay) {
        fetchAktivneNarudzbe(selectedDay);
      }
    } else {
      alert('❌ ' + (result.error || result.message || 'Greška pri spremanju narudžbe'));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Greška:', errorMessage);
    alert('❌ Greška pri spremanju narudžbe: ' + errorMessage);

  }
};




  // ===== KRAJ FUNKCIJE VEZAN ZA NARUDZBE =====

  // ===== GLAVNA PROCEDURA - TERENI PO DANIMA =====
  useEffect(() => {
    fetchTerenPoDanima();
  }, []);


useEffect(() => {
  const fetchArtikli = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/artikli`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ovo prikuplja JWT token iz cookies
      });

      if (!response.ok) {
        console.warn('⚠️ Greška pri učitavanju artikala:', response.status);
        setArtikli([]);
        return;
      }

      const data = await response.json();
      
      console.log('📦 Odgovor sa servera:', data);
      
      if (data.success && data.data) {
        setArtikli(data.data);
        console.log('✅ Artikli uspješno učitani:', data.data.length, 'artikala');
      } else if (Array.isArray(data)) {
        // Ako server direktno vraća niz
        setArtikli(data);
        console.log('✅ Artikli uspješno učitani:', data.length, 'artikala');
      } else {
        console.warn('⚠️ Neočekivan format podataka:', data);
        setArtikli([]);
      }
    } catch (error) {
      console.error('❌ Greška pri učitavanju artikala:', error);
      setArtikli([]);
    }
  };

  if (showKupacModal) {
    console.log('📥 Učitavanje artikala...');
    fetchArtikli();
  }
}, [showKupacModal]);

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
        //console.log('✅ Tereni po danima učitani:', tereniResult.data);

        if (tereniResult.data.length > 0) {
          const firstDay = tereniResult.data[0];
          setSelectedDay(firstDay.sifra_terena_dostava);
          setSelectedTerenaSifra(firstDay.sifra_terena);

          // Učitaj narudžbe za prvi dan
          if (firstDay.sifra_terena_dostava) {
            fetchAktivneNarudzbe(firstDay.sifra_terena_dostava);
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
        //console.log('✅ Teren-grad učitan:', terenGradResult.data);
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
        //console.log('✅ Kupci učitani:', kupciResult.data);
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
      //console.log(`⏳ Učitavanje narudžbi za teren ${sifraTerena}...`);

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



      // Kombiniraj podatke - grupisane sadrže kupce, aktivne proizvode
      if (grupisaneResult.success && aktivneResult.success) {
        const grupisaneData = grupisaneResult.data || [];
        const aktivneData = aktivneResult.data || [];

        // Kreiraj mapu kupaca sa proizvodima
        const kupciMap = new Map<number, NarudzbaKupac>();

        // Prvo dodaj sve kupce iz grupisanih
        grupisaneData.forEach((item: { sifra_partnera: number; naziv_partnera: string; partnera: string }) => {
          if (!kupciMap.has(item.sifra_partnera)) {
            kupciMap.set(item.sifra_partnera, {
              sifra_kupca: item.sifra_partnera,
              naziv_kupca: item.naziv_partnera || item.partnera || 'Nepoznat kupac',
              proizvodi: []
            });
          }
        });

        // Dodaj proizvode iz aktivnih narudžbi
        aktivneData.forEach((item: { 
          sifra_patnera: number;
          sifra_partnera: number;
          sifra_proizvoda: string;
          naziv_proizvoda: string;
          jm: string;
          kolicina_proizvoda: number;
          napomena: string;
        }) => {
          const kupac = kupciMap.get(item.sifra_patnera || item.sifra_partnera);
          if (kupac) {
            kupac.proizvodi.push({
              sif: item.sifra_proizvoda || item.sifra_proizvoda,
              naziv_proizvoda: item.naziv_proizvoda,
              jm: item.jm,
              kolicina: item.kolicina_proizvoda,
              napomena: item.napomena || ' ',
              sifra_kupca:item.sifra_partnera
            });
          }
        });

        const narudzbe = Array.from(kupciMap.values());
        setNarudzbePoKupcu(narudzbe);
       
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
      console.log(`📅 Odabran dan: ${day.day} (${day.date}), šifra terena: ${day.sifraTerenaDostava}`);
      fetchAktivneNarudzbe(day.sifraTerenaDostava);
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

    const handleKupacClick = (kupac: Kupac, terenInfo: TerenDostaveInfo) => {
      setSelectedKupac(kupac);
      setSelectedTerenInfo(terenInfo); // ← Šifra
      setShowKupacModal(true);
    };
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

           {/* HEADER - KOLAPSIBILAN */}
      <div className={`border-b-2 border-gray-200 bg-white transition-all duration-300 relative  ${
        headerCollapsed ? 'max-h-8' : 'max-h-24'
      }`}>
                  {/* STRELICA U DESNOM UGLU - UVIJEK VIDLJIVA */}
          <div className="absolute top-1 left-3 z-20">
            <button
              onClick={() => setHeaderCollapsed(!headerCollapsed)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0"
              title={headerCollapsed ? 'Proširi header' : 'Smanji header'}
            >
              {headerCollapsed ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        <div className="flex items-center justify-between gap-3 px-6 md:px-8 py-2 md:py-4">
          {/* TEKST - VIDLJIV SAMO KADA NIJE KOLABIRAN */}
          {!headerCollapsed && (
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#785E9E' }}>
              Pregled narudžbi
            </h2>
          )}
        </div>
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
                      onClick={() => {
                        // console.log('Sifra narudzbe:', d.sifraTerenaDostava);
                        handleDayClick(d);
                      }}
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

              {/* SEARCH BOX ZA KUPCE - POMAKNUT ISPOD DUGMADI */}
              <div className="border-t-2 border-gray-200 p-3">
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

                      {/* <div className="mb-4">
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
                      </div> */}

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
                                  onClick={() => {
                                    
                                              const terenInfo = getSelectedTerenInfo();
                                              if (!terenInfo) {
                                                alert('Odaberi dan prije nego što odabereš kupca!');
                                                return;
                                              }
                                              handleKupacClick(kupac, terenInfo);
                                     }}
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
                                   // console.log('Proizvod:', proizvod.kolicina),
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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-[5px]">
    <div className="bg-white rounded-xl shadow-2xl w-full max-h-[95vh] flex flex-col overflow-hidden">
      {/* HEADER SA ZAGLAVJEM I PODACIMA */}   
      <div className="border-b-2 p-3 md:p-4 flex items-start justify-between gap-4" style={{ backgroundColor: '#785E9E', borderColor: '#8FC74A' }}>
        <div className="flex justify-start">
          {/* INFORMATIVNA KARTCA SA PODACIMA */}
          <div className="bg-white rounded-lg p-3 border-2 shadow-sm max-w-xs" style={{ borderColor: '#8FC74A' }}>
            <div className="space-y-3">
              {/* DAN */}
              <div className="rounded-lg p-2" style={{ backgroundColor: '#F5F3FF', borderLeft: '3px solid #8FC74A' }}>
                <div className="text-xs font-semibold" style={{ color: '#785E9E' }}>DAN DOSTAVE</div>
                   <div className="text-lg font-bold" style={{ color: '#8FC74A' }}>
                        {selectedTerenInfo?.dan_dostave} - {selectedTerenInfo?.datum_dostave}
                  </div>
                  {/* NOVO: šifra terena */}
                    <div className="text-xs text-gray-600 mt-1">
                      Šifra terena:{" "}
                      <span className="font-semibold text-gray-800">
                        {selectedTerenInfo?.sifraTerenaDostava}
                      </span>
                    </div>
              </div>

              {/* KUPAC */}
    
                  {/* KUPAC */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* ŠIFRA */}
                    <div>
                      <div className="text-xs font-semibold" style={{ color: '#785E9E' }}>
                        ŠIFRA KUPCA
                      </div>
                      <div className="text-lg font-bold" style={{ color: '#785E9E' }}>
                        {selectedKupac.sifra_kupca}
                      </div>
                    </div>

                    {/* GRAD */}
                    <div>
                      <div className="text-xs font-semibold" style={{ color: '#785E9E' }}>
                        GRAD
                      </div>
                      <div className="text-gray-700 text-sm">
                        {selectedKupac.naziv_grada}
                      </div>
                    </div>
                  </div>

                  {/* NAZIV ISPOD */}
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#785E9E' }}>
                      NAZIV KUPCA
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      {selectedKupac.naziv_kupca}
                    </div>
                  </div>
        
        
            </div>
           <div style={{ borderTop: '1px solid #E0E0E0', margin: '0.5rem 0' }}></div>
              <div className="flex gap-2 flex-wrap">
                      {getVrstePaymentaZaKupca(selectedKupac?.sifra_kupca || 0).map((vrsta) => (
                        <button
                          key={vrsta.kod}
                          onClick={() => setSelectedVrstaPlacanja(vrsta.kod)}
                          className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                            selectedVrstaPlacanja === vrsta.kod
                              ? 'text-white shadow-lg scale-105'
                              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                          }`}
                          style={{
                            backgroundColor: selectedVrstaPlacanja === vrsta.kod ? '#8FC74A' : undefined,
                          }}
                        >
                          {vrsta.naziv}
                        </button>
                      ))}
                    </div>
            
          </div>
        </div>


      </div>

                  {/* MAIN CONTENT AREA - DVIJE KOLONE */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-3 md:gap-4 p-3 md:p-4" style={{ opacity: selectedVrstaPlacanja ? 1 : 0.5, pointerEvents: selectedVrstaPlacanja ? 'auto' : 'none' }}>
      
        {/* LIJEVA STRANA - ARTIKLI (30%) */}
        <div className="w-[30%] flex flex-col border-r-2 pr-4" style={{ borderColor: '#8FC74A' }}>
          {/* PRETRAGA ARTIKALA */}
          <div className="mb-4 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži artikle..."
                value={searchArtikli}
                onChange={(e) => setSearchArtikli(e.target.value)}
                className="w-full px-3 py-2 pl-10 border-2 rounded-lg focus:outline-none transition-all text-sm"
                style={{ borderColor: '#8FC74A' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#785E9E'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#8FC74A'}
              />
            </div>
          </div>
              {/* LISTA ARTIKALA - 2 KOLONE (kartica ~50% širine) */}
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-2">
                  {artikli
                    .filter((artikal) =>
                      artikal.naziv_proizvoda?.toLowerCase().includes(searchArtikli.toLowerCase()) ||
                      artikal.sifra_proizvoda?.toString().includes(searchArtikli)
                    )
                    .map((artikal) => (
                      <div
                        key={artikal.sifra_proizvoda}

                          onClick={() => {
                            if (!selectedVrstaPlacanja) {
                              alert('⚠️ Prvo odaberi vrstu plaćanja!');
                              return;
                            }
                            handleSelectArtikl(artikal);
                          }}

                        className="bg-white border-2 rounded-lg p-2 hover:shadow-md transition-all cursor-pointer"
                        style={{ borderColor: '#DDD' }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#8FC74A')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#DDD')}
                      >
                        <div className="flex flex-col gap-2">
                          {/* Gornji dio */}
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold" style={{ color: '#785E9E' }}>
                              {artikal.sifra_proizvoda}
                            </div>
                            <div className="text-xs font-semibold text-gray-800 truncate">
                              {artikal.naziv_proizvoda}
                            </div>
                            <div className="text-[11px] font-bold mt-1" style={{ color: '#8FC74A' }}>
                              JM: {artikal.jm}
                            </div>
                          </div>

                          {/* CIJENE - VERTIKALNO (MPC ispod VPC) */}
                          <div className="space-y-2 text-xs">
                            <div className="rounded p-2" style={{ backgroundColor: '#F0F4FF' }}>
                              <div className="font-semibold" style={{ color: '#785E9E' }}>
                                VPC
                              </div>
                              <div className="font-bold mt-1" style={{ color: '#8FC74A' }}>
                                {formatPrice(artikal.VPC)} BAM
                              </div>
                            </div>

                            <div className="rounded p-2" style={{ backgroundColor: '#F0FFF4' }}>
                              <div className="font-semibold" style={{ color: '#785E9E' }}>
                                MPC
                              </div>
                              <div className="font-bold mt-1" style={{ color: '#8FC74A' }}>
                                {formatPrice(artikal.mpc)} BAM
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {artikli.filter((a) =>
                    a.naziv_proizvoda?.toLowerCase().includes(searchArtikli.toLowerCase()) ||
                    a.sifra_proizvoda?.toString().includes(searchArtikli)
                  ).length === 0 && (
                    <div className="col-span-2 text-center text-gray-400 py-8">
                      <p className="text-sm">Nema pronađenih artikala</p>
                    </div>
                  )}
                </div>
              </div>


         </div>

        {/* DESNA STRANA - SADRŽAJ (70%) */}
        <div className="flex-1 overflow-y-auto flex flex-col bg-gray-50">
          {selectedArtiklModal ? (
            <>
              {/* FORMA ZA DODAVANJE ARTIKLA U NOVU NARUDŽBU */}
              <div className="p-4 border-b-2 flex-shrink-0 bg-white" style={{ borderColor: '#8FC74A' }}>
                <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#F5F3FF', borderLeft: '4px solid #8FC74A' }}>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#785E9E' }}>
                    {selectedArtiklModal.naziv_proizvoda}
                  </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">

                        {/* ŠIFRA */}
                        <div>
                          <span className="font-semibold" style={{ color: '#785E9E' }}>Šifra:</span>
                          <p className="font-semibold text-gray-700">
                            {selectedArtiklModal.sifra_proizvoda}
                          </p>
                        </div>

                        {/* JEDINICA MJERE */}
                        <div>
                          <span className="font-bold" style={{ color: '#785E9E' }}>Jedinica mjere:</span>
                          <p className="font-bold text-base" style={{ color: '#8FC74A' }}>
                            {selectedArtiklModal.jm}
                          </p>
                        </div>

                        {/* VPC */}
                        <div>
                          <span className="font-semibold" style={{ color: '#785E9E' }}>VPC:</span>
                          <p className="font-semibold" style={{ color: '#8FC74A' }}>
                            {formatPrice(selectedArtiklModal.VPC)} BAM
                          </p>
                        </div>

                        {/* MPC */}
                        <div>
                          <span className="font-semibold" style={{ color: '#785E9E' }}>MPC:</span>
                          <p className="font-semibold" style={{ color: '#8FC74A' }}>
                            {formatPrice(selectedArtiklModal.mpc)} BAM
                          </p>
                        </div>

                      </div>



                </div>

                {/* INPUT POLJA */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#785E9E' }}>
                      Količina ({selectedArtiklModal.jm}) *
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setArtiklKolicina(Math.max(1, artiklKolicina - 1))}
                        className="px-3 py-2 rounded-lg transition-all font-bold text-white"
                        style={{ backgroundColor: '#8FC74A' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={artiklKolicina}
                        onChange={(e) => setArtiklKolicina(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none text-center font-semibold"
                        style={{ borderColor: '#8FC74A' }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#785E9E'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#8FC74A'}
                      />
                      <button
                        onClick={() => setArtiklKolicina(artiklKolicina + 1)}
                        className="px-3 py-2 rounded-lg transition-all font-bold text-white"
                        style={{ backgroundColor: '#8FC74A' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#785E9E' }}>
                      Napomena (opciono)
                    </label>
                    <textarea
                      value={artiklNapomena}
                      onChange={(e) => setArtiklNapomena(e.target.value)}
                      placeholder="Unesite napomenu..."
                      rows={3}
                      className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none resize-none"
                      style={{ borderColor: '#8FC74A' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#785E9E'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#8FC74A'}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddArtiklToModalOrder}
                      className="flex-1 px-4 py-3 rounded-lg transition-all text-white font-medium"
                      style={{ backgroundColor: '#8FC74A' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      Dodaj u narudžbu
                    </button>
                    <button
                      onClick={() => setSelectedArtiklModal(null)}
                      className="flex-1 px-4 py-3 rounded-lg transition-all font-medium border-2"
                      style={{ color: '#785E9E', borderColor: '#785E9E' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F3FF'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Otkazi
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>

            {/* LISTA STAVKI U NOVANOJ NARUDŽBI */}
            <div className="flex-1 overflow-y-auto p-4">
              {novaArtiklUNarudzbi.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <p className="text-sm">Odaberi artikal sa lijeve strane da ga dodaš u narudžbu</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {novaArtiklUNarudzbi.map((artikal) => (
                    <div
                      key={artikal.sifra_proizvoda}
                      className="bg-white border-2 rounded-lg p-2 hover:shadow-md transition-all flex flex-col"
                      style={{ borderColor: '#8FC74A' }}
                    >
                      {/* HEADER - NAZIV I CLOSE */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-[11px] truncate">{artikal.naziv_proizvoda}</h4>
                          <p className="text-[10px] text-gray-500 mt-1">
                            Šifra: <span className="font-bold">{artikal.sifra_proizvoda}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveArtiklFromModalOrder(artikal.sifra_proizvoda)}
                          className="p-1 rounded-lg transition-all flex-shrink-0 ml-1"
                          style={{ backgroundColor: '#FFE5E5' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFD5D5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFE5E5'}
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>

                      {/* JM */}
                      <div className="text-[10px] font-bold mb-2" style={{ color: '#8FC74A' }}>
                        JM: {artikal.jm}
                      </div>

                      {/* CIJENE - VERTIKALNO */}
                      <div className="space-y-1 mb-2 pb-2 border-b" style={{ borderColor: '#E0E0E0' }}>
                        <div className="rounded p-1" style={{ backgroundColor: '#F5F3FF' }}>
                          <span className="text-[10px] font-semibold" style={{ color: '#785E9E' }}>VPC:</span>
                          <p className="font-bold text-[10px]" style={{ color: '#8FC74A' }}>{formatPrice(artikal.VPC)} BAM</p>
                        </div>
                        <div className="rounded p-1" style={{ backgroundColor: '#F0FFF4' }}>
                          <span className="text-[10px] font-semibold" style={{ color: '#785E9E' }}>MPC:</span>
                          <p className="font-bold text-[10px]" style={{ color: '#8FC74A' }}>{formatPrice(artikal.mpc)} BAM</p>
                        </div>
                      </div>

                      {/* KOLIČINA */}
                      <div className="mb-2">
                        <span className="text-[10px] font-semibold" style={{ color: '#785E9E' }}>Količina:</span>
                        <div className="flex items-center gap-0.5 mt-1">
                          <button
                            onClick={() =>
                              handleUpdateModalArtiklKolicina(artikal.sifra_proizvoda, artikal.kolicina - 1)
                            }
                            className="px-1 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: '#8FC74A' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            value={artikal.kolicina}
                            onChange={(e) =>
                              handleUpdateModalArtiklKolicina(
                                artikal.sifra_proizvoda,
                                parseFloat(e.target.value) || 1
                              )
                            }
                            className="flex-1 px-1 py-0.5 border rounded text-center text-[10px] font-semibold"
                            style={{ borderColor: '#8FC74A' }}
                          />
                          <button
                            onClick={() =>
                              handleUpdateModalArtiklKolicina(artikal.sifra_proizvoda, artikal.kolicina + 1)
                            }
                            className="px-1 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: '#8FC74A' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* UKUPNO */}
                      <div className="rounded-lg p-2 mb-2" style={{ backgroundColor: '#F5F3FF', borderLeft: '3px solid #8FC74A' }}>
                        <span className="text-[10px] font-semibold" style={{ color: '#785E9E' }}>UKUPNO:</span>
                        <p className="font-bold text-[11px]" style={{ color: '#8FC74A' }}>
                          {formatPrice((getPrice(artikal.mpc) * artikal.kolicina))} BAM
                        </p>
                      </div>

                        {/* NAPOMENA */}
                        {artikal.napomena && (
                          <div className="rounded p-1 text-[10px] mt-auto" style={{ backgroundColor: '#FFFEF0', borderLeft: '3px solid #FFD700' }}>
                            <p className="text-gray-700 font-semibold">📝</p>
                            <p className="text-gray-600 mt-0.5 break-words">{artikal.napomena}</p>
                          </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                  </>
              )}
            </div>
          </div>

                  {/* FOOTER SA DUGMIĆIMA - FIKSNA POZICIJA */}
                  <div className="border-t-2 bg-white p-3 md:p-4 flex-shrink-0" style={{ borderColor: '#8FC74A' }}>
                    <div className="flex items-center justify-between gap-4">
                      
                      {/* LIJEVA STRANA - DUGMIĆI */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveNewOrder}
                          className="px-6 py-3 rounded-lg transition-all text-white font-medium whitespace-nowrap"
                          style={{ backgroundColor: '#8FC74A' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          disabled={novaArtiklUNarudzbi.length === 0 || !selectedVrstaPlacanja}
                        >
                          Spremi sve
                        </button>

                        <button
                          onClick={() => {
                            setShowKupacModal(false);
                            setSelectedKupac(null);
                            setNovaArtiklUNarudzbi([]);
                            setSelectedArtiklModal(null);
                            setSelectedVrstaPlacanja(null);
                          }}
                          className="px-6 py-3 rounded-lg transition-all font-medium border-2 whitespace-nowrap"
                          style={{ color: '#785E9E', borderColor: '#785E9E' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F3FF'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Zatvori
                        </button>
                      </div>

                      {/* DESNA STRANA - SUMMARY */}
                      {novaArtiklUNarudzbi.length > 0 && (
                        <div className="flex items-center gap-6 ml-auto">
                          <div className="border-l-2 h-12" style={{ borderColor: '#E0E0E0' }}></div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: '#785E9E' }}>Stavki:</span>
                            <span className="font-bold text-lg text-white px-2 py-1 rounded" style={{ backgroundColor: '#8FC74A' }}>
                              {novaArtiklUNarudzbi.length}
                            </span>
                          </div>

                          <div className="border-l-2 h-12" style={{ borderColor: '#E0E0E0' }}></div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: '#785E9E' }}>UKUPNO:</span>
                            <span className="text-xl font-bold" style={{ color: '#8FC74A' }}>
                              {calculateModalTotalPrice().toFixed(2)} BAM
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

        </div>
      </div>
)}
    </div>
  );
}
