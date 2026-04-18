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

export const proizvodAnaliza = async (req, res) => {
  try {
    const { naziv_proizvoda, jm, sifra, agregirano, kategorizirani } = req.body || {};

    if (!naziv_proizvoda || !agregirano) {
      return res.status(400).json({
        success: false,
        error: "naziv_proizvoda i agregirano su obavezni.",
      });
    }

    const text = await AiService.generateProizvodAnaliza({
      naziv_proizvoda,
      jm,
      sifra,
      agregirano,
      kategorizirani,
    });

    return res.json({ success: true, text });
  } catch (e) {
    console.error("AI proizvodAnaliza error:", e);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri generisanju AI analize." });
  }
};

export const proizvodPitanje = async (req, res) => {
  try {
    const { naziv_proizvoda, jm, sifra, agregirano, kategorizirani, aiAnalysis, chatHistory, question } =
      req.body || {};

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "question je obavezan.",
      });
    }

    const text = await AiService.generateProizvodPitanje({
      naziv_proizvoda,
      jm,
      sifra,
      agregirano,
      kategorizirani,
      aiAnalysis: aiAnalysis || "",
      chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
      question,
    });

    return res.json({ success: true, text });
  } catch (e) {
    console.error("AI proizvodPitanje error:", e);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri generisanju odgovora." });
  }
};
