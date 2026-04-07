import * as Poslovanje from "../services/poslovanje.service.js";

export const getPoslovanjeIzdaniRacuni = async (req, res) => {
  try {
    const { sifraRadnika } = req.user;
    const partneri = await Poslovanje.getPoslovanjeIzdaniRacuni(sifraRadnika);
    return res.json({ success: true, data: partneri, count: partneri.length });
  } catch (error) {
    console.error("Učitavanje poslovanja izdani računi error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri učitavanju izdani računi" });
  }
};

export const getPoslovanjeIzdaniRacuniAdmin = async (req, res) => {
  try {
    const partneri = await Poslovanje.getPoslovanjeIzdaniRacuniAdmin();
    return res.json({ success: true, data: partneri, count: partneri.length });
  } catch (error) {
    console.error("Učitavanje poslovanja izdani računi error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri učitavanju izdani računi" });
  }
};

export const getPoslovanjeNaplataRacuna = async (req, res) => {
  try {
    const { sifraRadnika } = req.user;
    const partneri = await Poslovanje.getPoslovanjeNaplataRacuna(sifraRadnika);
    return res.json({ success: true, data: partneri, count: partneri.length });
  } catch (error) {
    console.error("Učitavanje poslovanja naplata računa error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri učitavanju naplata računa" });
  }
};

export const getPoslovanjeNaplataRacunaAdmin = async (req, res) => {
  try {
    const partneri = await Poslovanje.getPoslovanjeNaplataRacunaAdmin();
    return res.json({ success: true, data: partneri, count: partneri.length });
  } catch (error) {
    console.error("Učitavanje poslovanja naplata računa error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri učitavanju naplata računa" });
  }
};

export const getKretanjeProizvoda = async (req, res) => {
  try {
    const partneri = await Poslovanje.getKretanjeProizvoda();
    return res.json({ success: true, data: partneri, count: partneri.length });
  } catch (error) {
    console.error("Učitavanje kretanja proizvoda error:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: "Greška pri učitavanju kretanja proizvoda",
      });
  }
};
