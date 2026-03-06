import { withConnection } from "./db.service.js";

function getPartnerCode(d) {
  return d.sifra_kup || d.sifra_kup_z;
}

// Assuming the existing mappings are in place
const exampleMapping = data.map((d) => ({
  ...d,
  sifra_kup: getPartnerCode(d),
  // Keep other existing mappings intact
}));

// Filter usage updated to reflect the new partner code key
const filteredData = exampleMapping.filter((d) => {
  return d.sifra_kup === someValue; // Replace 'someValue' with the actual filter condition
});
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
      .filter(
        (d) =>
          d.sifra_kup_z &&
          d.sifra_kup_z > 0 &&
          d.Naziv_partnera &&
          d.Naziv_partnera.trim() !== "",
      )
      .map((d) => ({
        sifra: d.sifra_kup_z || 0,
        naziv_partnera: d.Naziv_partnera || "",
        ukupan_dug: parseFloat(d.Ukupan_dug) || 0,
        dug_preko_24: parseFloat(d.Dug_dvadesetcetiri) || 0,
        dug_preko_30: parseFloat(d.Dug_trideset) || 0,
        dug_preko_60: parseFloat(d.Dug_sezdeset) || 0,
        dug_preko_120: parseFloat(d.Dug_stodvadeset) || 0,
        najstariji_racun: d.Najstariji_racun
          ? new Date(d.Najstariji_racun).toLocaleDateString("sr-RS")
          : "-",
      }));

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
