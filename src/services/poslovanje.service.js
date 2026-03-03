import { withConnection } from "./db.service.js";

export const getPoslovanjeIzdaniRacuni = async (sifraRadnika) => {
  // Provjera da li je parametar prosleđen
  if (sifraRadnika === undefined || sifraRadnika === null) {
    throw new Error("sifraRadnika parametar je obavezan");
  }

  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL komercijala.analitika_poslovanje_izdani_racuni(?)",
      [sifraRadnika],
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};

export const getPoslovanjeNaplataRacuna = async (sifraRadnika) => {
  // Provjera da li je parametar prosleđen
  if (sifraRadnika === undefined || sifraRadnika === null) {
    throw new Error("sifraRadnika parametar je obavezan");
  }

  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL komercijala.analitika_poslovanje_naplata_racuna(?)",
      [sifraRadnika],
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : [];
  });
};
