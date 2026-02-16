import { withConnection } from './db.service.js';

export const getAktivneNarudzbeGrupisano = async (sifraTerena) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.dostava_tereni_proizvodi_grupisano(?)',
      [sifraTerena]);
   
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
} );
};  


export const getAktivneNarudzbe = async (sifraTerena) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL komercijala.dostava_tereni_proizvodi(?)',
      [sifraTerena]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
} );
};  



// ✅ NOVA FUNKCIJA
export const createNarudzba = async (narudzbaData) => {
  const { sifraKupca, sifraTerenaDostava, vrstaPlacanja, proizvodi } = narudzbaData;

  return withConnection(async (connection) => {
    try {
      // Kreni transakciju
      await connection.beginTransaction();

      console.log('🔄 Transakcija pokrenuta - unos narudžbe za kupca:', sifraKupca);

      // Za svaki proizvod u narudžbi
      for (const proizvod of proizvodi) {
        const {
          sifraProizvoda,
          kolicina,
          napomena = ''
        } = proizvod;

        // Parametri za proceduru
        const params = [
          sifraTerenaDostava,           // p_sifra_terena_dostava
          sifraKupca,                   // p_sifra_partnera
          sifraProizvoda,               // p_sifra_proizvoda
          parseFloat(kolicina),         // p_kolicina_proizvoda (DECIMAL)
          napomena,                     // p_napomena
          0,                            // p_redosled_ispisa (DEFAULT)
          0,                            // p_notifikacija (DEFAULT)
          new Date(),                   // p_datum_unosa_narudzbe (SADA)
          vrstaPlacanja,                // p_nacin_placanja
          0,                            // p_sinhronizovano (DEFAULT)
          0,                            // p_stampano (DEFAULT)
          0                             // p_spremljena_kolicina (DEFAULT)
        ];

        console.log('📦 Unos proizvoda:', sifraProizvoda, 'Količina:', kolicina);

        // Pozovi proceduru
        await connection.execute(
          `CALL komercijala.dostava_unos_podataka_teren_proizvod(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params
        );
      }

      // Ako je sve ok, COMMIT
      await connection.commit();
      console.log('✅ Transakcija uspješna - narudžba unijeta');

      return {
        sifraKupca,
        sifraTerenaDostava,
        vrstaPlacanja,
        brojProizvoda: proizvodi.length,
        datumUnosa: new Date()
      };

    } catch (error) {
      // Ako je greška, ROLLBACK
      await connection.rollback();
      console.error('❌ Transakcija otkazana - greška:', error.message);
      throw new Error('Greška pri unošenju narudžbe: ' + error.message);
    }
  });
};