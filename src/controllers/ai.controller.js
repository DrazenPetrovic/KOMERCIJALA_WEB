import * as AiService from "../services/ai.service.js";
import * as PoslovanjeService from "../services/poslovanje.service.js";

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
    const { sifra_proizvoda, naziv_proizvoda, jm } = req.body || {};

    if (!sifra_proizvoda || !naziv_proizvoda) {
      return res.status(400).json({
        success: false,
        error: "sifra_proizvoda i naziv_proizvoda su obavezni.",
      });
    }

    const transakcije = await PoslovanjeService.getKretanjeProizvodaAi(sifra_proizvoda);

    const text = await AiService.generateProizvodAnaliza({
      naziv_proizvoda,
      jm,
      transakcije,
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
    const { sifra_proizvoda, naziv_proizvoda, jm, aiAnalysis, chatHistory, question } =
      req.body || {};

    if (!sifra_proizvoda || !question) {
      return res.status(400).json({
        success: false,
        error: "sifra_proizvoda i question su obavezni.",
      });
    }

    const transakcije = await PoslovanjeService.getKretanjeProizvodaAi(sifra_proizvoda);

    const text = await AiService.generateProizvodPitanje({
      naziv_proizvoda,
      jm,
      transakcije,
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
