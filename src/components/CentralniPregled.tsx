import { ArrowLeft } from 'lucide-react';

interface CentralniPregledProps {
  onBack: () => void;
}

interface StavkaPregleda {
  sif_tabele: string;
  sif: string;
  naziv_proizvoda: string;
  jm: string;
  kolicina: number;
  napomena: string;
}

export function CentralniPregled({ onBack }: CentralniPregledProps) {
  const stavke: StavkaPregleda[] = [];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Nazad</span>
        </button>
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#785E9E' }}>
          Centralni pregled
        </h2>
        <div className="w-24"></div>
      </div>

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
            {stavke.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Nema podataka
                </td>
              </tr>
            ) : (
              stavke.map((stavka, index) => (
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
  );
}
