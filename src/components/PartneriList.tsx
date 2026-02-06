import React, { useEffect, useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';

interface Partner {
  sifra_partnera: number;
  Naziv_partnera: string;
  Naziv_grada: string;
  sifra_grada: number;
  pripada_radniku: number;
  Naziv_radnika: string;
}

interface PartneriListProps {
  onBack: () => void;
}

export default function PartneriList({ onBack }: PartneriListProps) {
  const [partneri, setPartneri] = useState<Partner[]>([]);
  const [filteredPartneri, setFilteredPartneri] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const fetchPartneri = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Niste prijavljeni');
        return;
      }

      const apiUrl = 'https://cakjyadlsfpdsrunpkyh.supabase.co/functions/v1/pregled-partnera';
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
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
        console.log('Broj partnera:', dataArray.length);
        console.log('Prvi partner:', dataArray[0]);

        setPartneri(dataArray);
        setFilteredPartneri(dataArray);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Nazad</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-semibold text-slate-800 mb-6">Partneri</h1>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Pretraži po nazivu partnera..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
              <p className="mt-4 text-slate-600">Učitavanje partnera...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchPartneri}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Pokušaj ponovo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Šifra</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Naziv partnera</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Grad</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartneri.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-500">
                        {searchTerm ? 'Nema rezultata pretrage' : 'Nema partnera'}
                      </td>
                    </tr>
                  ) : (
                    filteredPartneri.map((partner, index) => (
                      <tr
                        key={partner.sifra_partnera || index}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-slate-700">{partner.sifra_partnera || '-'}</td>
                        <td className="py-3 px-4 text-sm text-slate-900 font-medium">{partner.Naziv_partnera || '-'}</td>
                        <td className="py-3 px-4 text-sm text-slate-700">{partner.Naziv_grada || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filteredPartneri.length > 0 && (
                <div className="mt-4 text-sm text-slate-600">
                  Prikazano: {filteredPartneri.length} od {partneri.length} partnera
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
