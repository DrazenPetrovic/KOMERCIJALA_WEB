import { useEffect, useState } from 'react';
import { Search, ArrowLeft, Users, MapPin, X, FileText, Phone } from 'lucide-react';


export interface DodatniPodaci {
  sifra_tabele: number;
  sifra_partnera: number;
  dodatni_podaci_opis: string;
  dodatni_podaci: string;  // TELEFON
  sifra_radnika: number;
  naziv_radnika: string;
  datum_unosa: string;
}

interface Partner {
  sifra_partnera: number;
  Naziv_partnera: string;
  Naziv_grada: string;
  sifra_grada: number;
  pripada_radniku: number;
   Naziv_radnika: string;
  dodatniPodaci?: DodatniPodaci[];
 
}
// OVO JE VEZANO ZA DODAVANJE DODATNIH PODATAKA - opcionalno, može se ukloniti ako se ne koristi




interface PartneriListProps {
  onBack: () => void;
}

export default function PartneriList({ onBack }: PartneriListProps) {
  const [partneri, setPartneri] = useState<Partner[]>([]);
  const [filteredPartneri, setFilteredPartneri] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPartneri();
  }, []);

  useEffect(() => {
    try {
      if (searchTerm.trim() === '') {
        setFilteredPartneri(partneri);
      } else {
        const filtered = partneri.filter(partner => {
          try {
            const naziv = partner?.Naziv_partnera?.toString() || '';
            return naziv.toLowerCase().includes(searchTerm.toLowerCase());
          } catch (err) {
            console.error('Error filtering partner:', partner, err);
            return false;
          }
        });
        setFilteredPartneri(filtered);
      }
    } catch (err) {
      console.error('Error in search filter:', err);
      setFilteredPartneri([]);
    }
  }, [searchTerm, partneri]);



// -------------------------------------

const fetchPartneri = async () => {
  try {
    setLoading(true);
    setError('');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // ✅ OSNOVNO - Partneri kako su bili
    const response = await fetch(`${apiUrl}/api/partneri`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Greška pri učitavanju partnera');
    }

    const result = await response.json();
    console.log('API Response:', result);

    if (result.success && result.data) {
      const dataArray = Array.isArray(result.data) ? result.data : [];
      
      setPartneri(dataArray);
      setFilteredPartneri(dataArray);
      
      // ✅ DODATNI PODACI U POZADINI - opciono
      fetchDodatniPodaci(dataArray);
    } else {
      console.error('API Error:', result);
      setError(result.error || 'Greška pri učitavanju partnera');
    }
  } catch (err) {
    setError('Greška pri učitavanju podataka');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

// ✅ NOVA FUNKCIJA - Učitaj dodatne podatke u pozadini
const fetchDodatniPodaci = async (partneriList: Partner[]) => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/partneri/dodatni-podaci`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return;

    const result = await response.json();
    
    if (result.success && result.data) {
      // Kombinuj partnere sa dodatnim podacima
      const partneriSaDodacima = partneriList.map(partner => ({
        ...partner,
        dodatniPodaci: result.data.filter(
          (p: any) => p.sifra_partnera === partner.sifra_partnera
        )
      }));
      
      setPartneri(partneriSaDodacima);
      setFilteredPartneri(partneriSaDodacima);
    }
  } catch (err) {
    console.error('Greška pri učitavanju dodatnih podataka:', err);
    // Nije kritično - partneri su već učitani
  }
};



const [showAddForm, setShowAddForm] = useState(false);
const [formData, setFormData] = useState({
  dodatni_podaci_opis: '',
  dodatni_podaci: '', // TELEFON
});
const [submitLoading, setSubmitLoading] = useState(false);

const handleAddDodatniPodaci = async () => {
  if (!formData.dodatni_podaci_opis.trim() || !formData.dodatni_podaci.trim()) {
    alert('Popunite oba polja!');
    return;
  }

  if (!selectedPartner) return;

  try {
    setSubmitLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/api/partneri/dodatni-podaci-unos`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sifra_partnera: selectedPartner.sifra_partnera,
        dodatni_podaci_opis: formData.dodatni_podaci_opis,
        dodatni_podaci: formData.dodatni_podaci,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Osvježi podatke
      const updatedPartner = {
        ...selectedPartner,
        dodatniPodaci: [
          ...(selectedPartner.dodatniPodaci || []),
          result.data, // Novi unos
        ],
      };
      setSelectedPartner(updatedPartner);

      // Osvježi listu
      fetchPartneri();

      // Očisti formu
      setFormData({
        dodatni_podaci_opis: '',
        dodatni_podaci: '',
      });
      setShowAddForm(false);

      alert('Podaci su uspješno dodani!');
    } else {
      alert('Greška: ' + result.error);
    }
  } catch (err) {
    console.error('Greška pri dodavanju:', err);
    alert('Greška pri dodavanju podataka');
  } finally {
    setSubmitLoading(false);
  }
};














//---------------------------------


  const openModal = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPartner(null);
  };

  // Provjera da li partner ima dodatne podatke
  const hasAdditionalData = (partner: Partner) => {
    return partner.dodatniPodaci && partner.dodatniPodaci.length > 0;
  };

  // Provjera je li šifra veća od 10000
  const isLargeCode = (sifra: number) => sifra >= 10000;

  return (
    <div className="min-h-screen" style={{ backgroundImage: 'linear-gradient(to bottom right, #ffffff, #ffffff, #f0fdf4)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* NAZAD DUGME */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-8 transition-all hover:gap-3 font-medium"
          style={{ color: '#785E9E' }}
        >
          <ArrowLeft size={22} />
          <span>Nazad</span>
        </button>

        {/* GLAVNI CONTAINER */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* HEADER */}
          <div className="px-6 md:px-8 py-6 md:py-8" style={{ backgroundImage: `linear-gradient(to right, #785E9E, #6a4f8a)` }}>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Partneri</h1>
                <p className="text-white text-opacity-80 mt-1">Prikaz svih registrovanih partnera</p>
              </div>
            </div>
          </div>

          {/* SEARCH SEKCIJA */}
          <div className="px-6 md:px-8 py-6 md:py-8 border-b border-gray-200 bg-gray-50">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={22} />
              <input
                type="text"
                placeholder="Pretraži po nazivu partnera..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-5 py-3 md:py-4 border-2 border-gray-300 rounded-xl focus:outline-none transition-all text-base md:text-lg"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#785E9E';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(120, 94, 158, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* SADRŽAJ */}
          <div className="p-6 md:p-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300" style={{ borderTopColor: '#785E9E' }}></div>
                <p className="mt-6 text-gray-600 text-lg">Učitavanje partnera...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-red-50 rounded-xl border-2 border-red-200">
                <p className="text-red-600 text-lg font-medium">{error}</p>
                <button
                  onClick={fetchPartneri}
                  className="mt-6 px-6 py-3 rounded-lg transition-all text-white font-medium"
                  style={{ backgroundColor: '#785E9E' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6a4f8a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#785E9E'}
                >
                  Pokušaj ponovo
                </button>
              </div>
            ) : (
              <div>
                {filteredPartneri.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">
                      {searchTerm ? 'Nema rezultata pretrage' : 'Nema partnera'}
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* GRID KARTICE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredPartneri.map((partner, index) => {
                        const hasData = hasAdditionalData(partner);
                        const isLarge = isLargeCode(partner.sifra_partnera);
                        
                        return (
                          <div
                            key={partner.sifra_partnera || index}
                            onClick={() => openModal(partner)}
                            className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 md:p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                            style={{
                              borderWidth: '3px',
                              borderStyle: 'solid',
                              borderColor: hasData ? '#8FC74A' : '#d1d5db', // Zelena ako ima podataka, siva ako nema
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = hasData ? '#7ab830' : '#785E9E';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = hasData ? '#8FC74A' : '#d1d5db';
                            }}
                          >
                            {/* ŠIFRA SA SIMBOLOM */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
                                {isLarge ? (
                                  <span className="text-lg font-bold" style={{ color: '#785E9E' }}>★</span>
                                ) : (
                                  <span className="text-lg font-bold" style={{ color: '#785E9E' }}>#</span>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Šifra</p>
                                <p className="text-lg font-bold" style={{ color: '#785E9E' }}>
                                  {partner.sifra_partnera || '-'}
                                </p>
                              </div>
                            </div>

                            {/* NAZIV PARTNERA */}
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Naziv</p>
                              <p className="text-base md:text-lg font-bold text-gray-900 group-hover:text-white transition-colors group-hover:px-2 group-hover:py-1 group-hover:rounded" style={{ color: '#000000' }}>
                                {partner.Naziv_partnera || '-'}
                              </p>
                            </div>

                            {/* GRAD */}
                            <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: hasData ? '#8FC74A' : '#d1d5db' }}>
                              <MapPin className="w-4 h-4" style={{ color: '#8FC74A' }} />
                              <p className="text-sm font-medium text-gray-700">
                                {partner.Naziv_grada || '-'}
                              </p>
                            </div>

                            {/* BADGE ZA DODATNE PODATKE */}
                            {hasData && (
                              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#8FC74A' }}>
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#8FC74A' }}>
                                  {partner.dodatniPodaci!.length} dodatni podaci
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* STATISTIKA */}
                    <div className="mt-8 p-4 md:p-6 rounded-xl border-2" style={{ backgroundImage: 'linear-gradient(to right, #f3e8ff, #f0fdf4)', borderColor: '#785E9E' }}>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <p className="text-gray-600 text-sm">Prikazano</p>
                          <p className="text-2xl font-bold" style={{ color: '#785E9E' }}>
                            {filteredPartneri.length}
                          </p>
                        </div>
                        <div className="hidden md:block w-px h-12" style={{ backgroundColor: 'rgba(120, 94, 158, 0.2)' }}></div>
                        <div>
                          <p className="text-gray-600 text-sm">Ukupno partnera</p>
                          <p className="text-2xl font-bold" style={{ color: '#8FC74A' }}>
                            {partneri.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
// Sada zamijenit modal sa ovim:

{/* MODAL - DODATNI PODACI */}
{showModal && selectedPartner && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      {/* MODAL HEADER */}
      <div className="px-6 md:px-8 py-6 md:py-8 flex items-center justify-between sticky top-0" style={{ backgroundImage: `linear-gradient(to right, #785E9E, #6a4f8a)` }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
            {isLargeCode(selectedPartner.sifra_partnera) ? (
              <span className="text-lg font-bold text-white">★</span>
            ) : (
              <span className="text-lg font-bold text-white">#</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-white truncate">{selectedPartner.Naziv_partnera}</h2>
            <p className="text-white text-opacity-80 mt-1">Šifra: {selectedPartner.sifra_partnera}</p>
          </div>
        </div>
        <button
          onClick={closeModal}
          className="text-white hover:opacity-75 transition-opacity flex-shrink-0 ml-4"
        >
          <X size={28} />
        </button>
      </div>

      {/* MODAL BODY */}
      <div className="p-6 md:p-8">
        {/* OSNOVNI PODACI */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ color: '#785E9E' }}>Osnovni podaci</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Grad</p>
              <p className="text-base font-medium text-gray-900">{selectedPartner.Naziv_grada || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Radnik</p>
              <p className="text-base font-medium text-gray-900">{selectedPartner.Naziv_radnika || '-'}</p>
            </div>
          </div>
        </div>

        {/* DODATNI PODACI */}
        {selectedPartner.dodatniPodaci && selectedPartner.dodatniPodaci.length > 0 ? (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ color: '#8FC74A' }}>
              <FileText className="w-5 h-5" />
              Dodatni podaci ({selectedPartner.dodatniPodaci.length})
            </h3>
            <div className="space-y-4">
              {selectedPartner.dodatniPodaci.map((podatak, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border-l-4"
                  style={{
                    backgroundColor: '#f0fdf4',
                    borderColor: '#8FC74A',
                    borderWidth: '3px',
                    borderLeft: '4px solid #8FC74A'
                  }}
                >
                  {/* BROJ UNOSA */}
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#8FC74A' }}>
                      Unos {idx + 1}
                    </span>
                  </div>

                  {/* OPIS */}
                  {podatak.dodatni_podaci_opis && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4" style={{ color: '#785E9E' }} />
                        <p className="text-xs font-semibold text-gray-500 uppercase">Opis</p>
                      </div>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                        {podatak.dodatni_podaci_opis}
                      </p>
                    </div>
                  )}

                  {/* TELEFON */}
                  {podatak.dodatni_podaci && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4" style={{ color: '#8FC74A' }} />
                        <p className="text-xs font-semibold text-gray-500 uppercase">Telefon</p>
                      </div>
                      <p className="text-sm font-medium text-gray-700 bg-white p-3 rounded border border-gray-200">
                        {podatak.dodatni_podaci}
                      </p>
                    </div>
                  )}

                  {/* KORISNIK I DATUM */}
                  <div className="pt-3 border-t border-gray-300 space-y-1">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Unesen od:</span> {podatak.naziv_radnika}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(podatak.datum_unosa).toLocaleDateString('sr-RS')} u {new Date(podatak.datum_unosa).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mb-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nema dodatnih podataka za ovog partnera</p>
          </div>
        )}

        {/* ✅ FORMA ZA DODAVANJE PODATAKA */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-6 py-3 rounded-lg transition-all text-white font-medium"
            style={{ backgroundColor: '#8FC74A' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7ab830'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8FC74A'}
          >
            + Dodaj novi unos
          </button>
        ) : (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4" style={{ color: '#785E9E' }}>Dodaj nove podatke</h4>

            {/* OPIS - Veće tekstualno polje */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dodatni podaci (opis) *
              </label>
              <textarea
                value={formData.dodatni_podaci_opis}
                onChange={(e) =>
                  setFormData({ ...formData, dodatni_podaci_opis: e.target.value })
                }
                placeholder="Unesite opis ili dodatne informacije..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* TELEFON - Manje tekstualno polje */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefon *
              </label>
              <input
                type="text"
                value={formData.dodatni_podaci}
                onChange={(e) =>
                  setFormData({ ...formData, dodatni_podaci: e.target.value })
                }
                placeholder="Unesite telefonski broj..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* DUGMIĆI */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ dodatni_podaci_opis: '', dodatni_podaci: '' });
                }}
                disabled={submitLoading}
                className="px-6 py-2 rounded-lg transition-all text-gray-700 font-medium border-2 border-gray-300 hover:bg-gray-100"
              >
                Otkaži
              </button>
              <button
                onClick={handleAddDodatniPodaci}
                disabled={submitLoading}
                className="px-6 py-2 rounded-lg transition-all text-white font-medium"
                style={{ backgroundColor: '#8FC74A' }}
                onMouseEnter={(e) => !submitLoading && (e.currentTarget.style.backgroundColor = '#7ab830')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#8FC74A')}
              >
                {submitLoading ? 'Sprema se...' : 'Spremi'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FOOTER */}
      <div className="px-6 md:px-8 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
        <button
          onClick={closeModal}
          className="px-6 py-2 rounded-lg transition-all text-white font-medium"
          style={{ backgroundColor: '#785E9E' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6a4f8a'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#785E9E'}
        >
          Zatvori
        </button>
      </div>
    </div>
  </div>
)}// Sada zamijenit modal sa ovim:

{/* MODAL - DODATNI PODACI */}
{showModal && selectedPartner && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      {/* MODAL HEADER */}
      <div className="px-6 md:px-8 py-6 md:py-8 flex items-center justify-between sticky top-0" style={{ backgroundImage: `linear-gradient(to right, #785E9E, #6a4f8a)` }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
            {isLargeCode(selectedPartner.sifra_partnera) ? (
              <span className="text-lg font-bold text-white">★</span>
            ) : (
              <span className="text-lg font-bold text-white">#</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-white truncate">{selectedPartner.Naziv_partnera}</h2>
            <p className="text-white text-opacity-80 mt-1">Šifra: {selectedPartner.sifra_partnera}</p>
          </div>
        </div>
        <button
          onClick={closeModal}
          className="text-white hover:opacity-75 transition-opacity flex-shrink-0 ml-4"
        >
          <X size={28} />
        </button>
      </div>

      {/* MODAL BODY */}
      <div className="p-6 md:p-8">
        {/* OSNOVNI PODACI */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ color: '#785E9E' }}>Osnovni podaci</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Grad</p>
              <p className="text-base font-medium text-gray-900">{selectedPartner.Naziv_grada || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Radnik</p>
              <p className="text-base font-medium text-gray-900">{selectedPartner.Naziv_radnika || '-'}</p>
            </div>
          </div>
        </div>

        {/* DODATNI PODACI */}
        {selectedPartner.dodatniPodaci && selectedPartner.dodatniPodaci.length > 0 ? (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ color: '#8FC74A' }}>
              <FileText className="w-5 h-5" />
              Dodatni podaci ({selectedPartner.dodatniPodaci.length})
            </h3>
            <div className="space-y-4">
              {selectedPartner.dodatniPodaci.map((podatak, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border-l-4"
                  style={{
                    backgroundColor: '#f0fdf4',
                    borderColor: '#8FC74A',
                    borderWidth: '3px',
                    borderLeft: '4px solid #8FC74A'
                  }}
                >
                  {/* BROJ UNOSA */}
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#8FC74A' }}>
                      Unos {idx + 1}
                    </span>
                  </div>

                  {/* OPIS */}
                  {podatak.dodatni_podaci_opis && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4" style={{ color: '#785E9E' }} />
                        <p className="text-xs font-semibold text-gray-500 uppercase">Opis</p>
                      </div>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                        {podatak.dodatni_podaci_opis}
                      </p>
                    </div>
                  )}

                  {/* TELEFON */}
                  {podatak.dodatni_podaci && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4" style={{ color: '#8FC74A' }} />
                        <p className="text-xs font-semibold text-gray-500 uppercase">Telefon</p>
                      </div>
                      <p className="text-sm font-medium text-gray-700 bg-white p-3 rounded border border-gray-200">
                        {podatak.dodatni_podaci}
                      </p>
                    </div>
                  )}

                  {/* KORISNIK I DATUM */}
                  <div className="pt-3 border-t border-gray-300 space-y-1">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Unesen od:</span> {podatak.naziv_radnika}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(podatak.datum_unosa).toLocaleDateString('sr-RS')} u {new Date(podatak.datum_unosa).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mb-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nema dodatnih podataka za ovog partnera</p>
          </div>
        )}

        {/* ✅ FORMA ZA DODAVANJE PODATAKA */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-6 py-3 rounded-lg transition-all text-white font-medium"
            style={{ backgroundColor: '#8FC74A' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7ab830'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8FC74A'}
          >
            + Dodaj novi unos
          </button>
        ) : (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4" style={{ color: '#785E9E' }}>Dodaj nove podatke</h4>

            {/* OPIS - Veće tekstualno polje */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dodatni podaci (opis) *
              </label>
              <textarea
                value={formData.dodatni_podaci_opis}
                onChange={(e) =>
                  setFormData({ ...formData, dodatni_podaci_opis: e.target.value })
                }
                placeholder="Unesite opis ili dodatne informacije..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* TELEFON - Manje tekstualno polje */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefon *
              </label>
              <input
                type="text"
                value={formData.dodatni_podaci}
                onChange={(e) =>
                  setFormData({ ...formData, dodatni_podaci: e.target.value })
                }
                placeholder="Unesite telefonski broj..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* DUGMIĆI */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ dodatni_podaci_opis: '', dodatni_podaci: '' });
                }}
                disabled={submitLoading}
                className="px-6 py-2 rounded-lg transition-all text-gray-700 font-medium border-2 border-gray-300 hover:bg-gray-100"
              >
                Otkaži
              </button>
              <button
                onClick={handleAddDodatniPodaci}
                disabled={submitLoading}
                className="px-6 py-2 rounded-lg transition-all text-white font-medium"
                style={{ backgroundColor: '#8FC74A' }}
                onMouseEnter={(e) => !submitLoading && (e.currentTarget.style.backgroundColor = '#7ab830')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#8FC74A')}
              >
                {submitLoading ? 'Sprema se...' : 'Spremi'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FOOTER */}
      <div className="px-6 md:px-8 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
        <button
          onClick={closeModal}
          className="px-6 py-2 rounded-lg transition-all text-white font-medium"
          style={{ backgroundColor: '#785E9E' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6a4f8a'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#785E9E'}
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