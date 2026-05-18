import * as DugovanjaService from "../services/dugovovanja.service.js";

export const getDugovanja = async (req, res) => {
  try {
    const { sifraRadnika } = req.user;
    const { dugovanja, stats } =
      await DugovanjaService.getDugovanja(sifraRadnika);

    //console.log("Dugovanja retrieved successfully:", dugovanja);
    return res.json({
      success: true,
      data: dugovanja,
      stats,
      count: dugovanja.length,
    });
  } catch (error) {
    console.error("Pregled dugovanja error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri učitavanju dugovanja" });
  }
};

export const getStatusIzvoda = async (req, res) => {
  try {
    //const { sifraRadnika } = req.user;
    const data = await DugovanjaService.getStatusIzvoda();
    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error("Pregled status izvoda error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri učitavanju statusa izvoda" });
  }
};
