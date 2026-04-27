import { withConnection } from "./db.service.js";

export const getAktivneNarudzbeGrupisano = async (sifraTerena) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL komercijala.dostava_tereni_proizvodi_grupisano(?)",
      [sifraTerena],
    );

    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};

export const getAktivneNarudzbe = async (sifraTerena) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL komercijala.dostava_tereni_proizvodi(?)",
      [sifraTerena],
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};

// ✅ NOVA FUNKCIJA
export const createNarudzba = async (narudzbaData) => {
  const {
    referentniBroj,
    sifraKupca,
    sifraTerenaDostava,
    vrstaPlacanja,
    proizvodi,
    dodatnaLokacija,
  } = narudzbaData;

  console.log("📥 Primljena narudžba sa dodatnom lokacijom:", {
    referentniBroj,
    sifraKupca,
    sifraTerenaDostava,
    vrstaPlacanja,
    brojProizvoda: proizvodi?.length || 0,
    dodatnaLokacija: dodatnaLokacija || null,
  });

  return withConnection(async (connection) => {
    try {
      // Kreni transakciju
      await connection.beginTransaction();

      // console.log('🔄 Transakcija pokrenuta - unos narudžbe za kupca:', sifraKupca);

      // Za svaki proizvod u narudžbi
      for (const proizvod of proizvodi) {
        const {
          sifraProizvoda,
          kolicina,
          napomena = "",
          trazenaCijena = 0,
        } = proizvod;
        const cleanNote = String(napomena || " ").trim() || " ";
        const finalNote = dodatnaLokacija
          ? `${cleanNote} ${dodatnaLokacija.naziv_lokacije}`.trim()
          : cleanNote;
        const poslovnaJedinicaSifra = Number(
          dodatnaLokacija?.sifra_lokacije ?? dodatnaLokacija?.sifra ?? 0,
        );

        // Parametri za proceduru
        const params = [
          sifraTerenaDostava, // p_sifra_terena_dostava
          sifraKupca, // p_sifra_partnera
          sifraProizvoda, // p_sifra_proizvoda
          parseFloat(kolicina), // p_kolicina_proizvoda (DECIMAL)
          finalNote, // p_napomena
          0, // p_redosled_ispisa (DEFAULT)
          0, // p_notifikacija (DEFAULT)
          new Date(), // p_datum_unosa_narudzbe (SADA)
          vrstaPlacanja, // p_nacin_placanja
          0, // p_sinhronizovano (DEFAULT)
          0, // p_stampano (DEFAULT)
          0, // p_spremljena_kolicina (DEFAULT)
          referentniBroj || null, // p_referentni_broj
          Number(trazenaCijena) || 0, // p_trazena_cijena
          Number.isFinite(poslovnaJedinicaSifra) ? poslovnaJedinicaSifra : 0, // p_poslovna_jedinica
        ];

        // console.log('📦 Unos proizvoda:', sifraProizvoda, 'Količina:', kolicina);

        // Pozovi proceduru
        await connection.execute(
          `CALL komercijala.dostava_unos_podataka_teren_proizvod(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params,
        );
      }

      // Ako je sve ok, COMMIT
      await connection.commit();
      // console.log('✅ Transakcija uspješna - narudžba unijeta');

      return {
        referentniBroj,
        sifraKupca,
        sifraTerenaDostava,
        vrstaPlacanja,
        brojProizvoda: proizvodi.length,
        datumUnosa: new Date(),
      };
    } catch (error) {
      // Ako je greška, ROLLBACK
      await connection.rollback();
      console.error("❌ Transakcija otkazana - greška:", error.message);
      throw new Error("Greška pri unošenju narudžbe: " + error.message);
    }
  });
};

export const obrisiNarudzbuPartnera = async ({
  p_sifra_terena,
  p_sifra_partnera,
  p_referentni_broj,
}) => {
  const sifraTerena = Number(p_sifra_terena);
  const sifraPartnera = Number(p_sifra_partnera);
  const referentniBroj = String(p_referentni_broj);

  if (!Number.isFinite(sifraTerena) || !Number.isFinite(sifraPartnera)) {
    throw new Error("Parametri moraju biti validni brojevi.");
  }

  return withConnection(async (conn) => {
    await conn.query("SET @p_poruka = ''");
    await conn.query(
      "CALL komercijala.dostava_brisanje_podataka_za_partnera(?, ?, ?, @p_poruka)",
      [sifraTerena, sifraPartnera, referentniBroj],
    );
    const [[row]] = await conn.query("SELECT @p_poruka AS poruka");
    return row.poruka;
  });
};
export const obrisiNarudzbuPartneraProizvoda = async ({
  p_sifra_terena,
  p_sifra_partnera,
  p_sifra_proizvoda,
  p_referentni_broj,
}) => {
  const sifraTerena = Number(p_sifra_terena);
  const sifraPartnera = Number(p_sifra_partnera);
  const sifraProizvoda = Number(p_sifra_proizvoda);
  const referentniBroj = String(p_referentni_broj);

  if (
    !Number.isFinite(sifraTerena) ||
    !Number.isFinite(sifraPartnera) ||
    !Number.isFinite(sifraProizvoda)
  ) {
    throw new Error("Parametri moraju biti validni brojevi.");
  }

  return withConnection(async (conn) => {
    await conn.query("SET @p_poruka = ''");
    await conn.query(
      "CALL komercijala.dostava_brisanje_podataka_za_partnera_i_proizvod(?, ?, ?, ?, @p_poruka)",
      [sifraTerena, sifraPartnera, sifraProizvoda, referentniBroj],
    );
    const [[row]] = await conn.query("SELECT @p_poruka AS poruka");
    return row.poruka;
  });
};

export const getRanijeUzimano = async (sifraPartnera, nazivPartnera) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL komercijala.dostava_provjera_uzimanih_artikala_grupisano(?, ?)",
      [sifraPartnera, nazivPartnera],
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};

export const getZadnjiDanNarudzbe = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL komercijala.dostava_provjera_zadnjeg_dana_provjere_izvrsene_narudzbe()",
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};
