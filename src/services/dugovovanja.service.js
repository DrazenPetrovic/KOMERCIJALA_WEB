import { withConnection } from "./db.service.js";

export const getDugovanja = async (sifraRadnika) => {
  return withConnection(async (connection) => {
    const [results] = await connection.execute(
      "CALL komercijala.dugovanje_partnera_zbirno(?)",
      [sifraRadnika],
    );

    const raw =
      Array.isArray(results) && results.length > 0
        ? Array.isArray(results[0])
          ? results[0]
          : results
        : [];

    const dugovanja = raw
      .filter((d) => {
        const sifra = Number(d.sifra_kup ?? d.sifra_kup_z);
        const naziv = (d.naziv_partnera ?? d.Naziv_partnera ?? "").toString();
        return sifra > 0 && naziv.trim() !== "";
      })
      .map((d) => {
        const sifra = Number(d.sifra_kup ?? d.sifra_kup_z) || 0;
        const naziv_partnera = (
          d.naziv_partnera ??
          d.Naziv_partnera ??
          ""
        ).toString();

        return {
          sifra,
          naziv_partnera,
          ukupan_dug: parseFloat(d.Ukupan_dug) || 0,
          dug_preko_24: parseFloat(d.Dug_dvadesetcetiri) || 0,
          dug_preko_30: parseFloat(d.Dug_trideset) || 0,
          dug_preko_60: parseFloat(d.Dug_sezdeset) || 0,
          dug_preko_120: parseFloat(d.Dug_stodvadeset) || 0,

          // VRATI ISO string da frontend formatira pouzdano
          // (tvoj formatDate() očekuje date string)
          najstariji_racun: d.Najstariji_racun
            ? new Date(d.Najstariji_racun).toISOString()
            : "",
        };
      });

    const stats = dugovanja.reduce(
      (acc, d) => {
        acc.ukupanDug += d.ukupan_dug || 0;
        acc.dugPreko24 += d.dug_preko_24 || 0;
        acc.dugPreko30 += d.dug_preko_30 || 0;
        acc.dugPreko60 += d.dug_preko_60 || 0;
        acc.dugPreko120 += d.dug_preko_120 || 0;
        return acc;
      },
      {
        ukupanDug: 0,
        dugPreko24: 0,
        dugPreko30: 0,
        dugPreko60: 0,
        dugPreko120: 0,
      },
    );

    return { dugovanja, stats };
  });
};

export const getStatusIzvoda = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL komercijala.pregled_otvorenih_izvoda",
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};
