import * as AiService from "../services/ai.service.js";

export const kupacAnaliza = async (req, res) => {
  try {
    const {
      sifraKupca,
      nazivKupca,
      grad,
      vrstaPlacanjaNaziv,
      trenutnaNarudzba,
    } = req.body || {};

    if (!sifraKupca || !nazivKupca) {
      return res
        .status(400)
        .json({
          success: false,
          error: "sifraKupca i nazivKupca su obavezni.",
        });
    }

    const ctx = await AiService.buildKupacContext({ sifraKupca, nazivKupca });

    const text = await AiService.generateKupacAnaliza({
      sifraKupca,
      nazivKupca,
      grad,
      vrstaPlacanjaNaziv,
      ranijeUzimano: ctx.ranijeUzimano,
      izvjestaji: ctx.izvjestaji,
      trenutnaNarudzba: Array.isArray(trenutnaNarudzba) ? trenutnaNarudzba : [],
    });

    return res.json({ success: true, text });
  } catch (e) {
    console.error("AI kupacAnaliza error:", e);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri generisanju AI analize." });
  }
};
