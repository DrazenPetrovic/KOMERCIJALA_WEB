import * as ArtikliService from "../services/artikli.service.js";

export const getArtikli = async (req, res) => {
  try {
    const artikli = await ArtikliService.getArtikli();
    return res.json({ success: true, data: artikli, count: artikli.length });
  } catch (error) {
    console.error("Pregled artikala error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri učitavanju artikala" });
  }
};

export const getArtikliGrupe = async (req, res) => {
  try {
    const artikliGrupe = await ArtikliService.getArtikliGrupe();
    return res.json({
      success: true,
      data: artikliGrupe,
      count: artikliGrupe.length,
    });
  } catch (error) {
    console.error("Pregled artikala grupe error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri učitavanju artikala grupe" });
  }
};
