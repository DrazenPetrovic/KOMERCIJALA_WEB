import * as NarudzbeService from "../services/aktivneNarudzbe.service.js";

export const getAktivneNarudzbeGrupisano = async (req, res) => {
  try {
    const sifraTerena = req.query.sifraTerena || req.params.sifraTerena;

    if (!sifraTerena) {
      return res
        .status(400)
        .json({ success: false, error: "Sifra terena je obavezna" });
    }

    const narudzbeGrupisane =
      await NarudzbeService.getAktivneNarudzbeGrupisano(sifraTerena);
    return res.json({
      success: true,
      data: narudzbeGrupisane,
      count: narudzbeGrupisane.length,
    });
  } catch (error) {
    console.error("Pregled grupisanih narudžbi error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri učitavanju narudžbi" });
  }
};

export const getRanijeUzimano = async (req, res) => {
  try {
    const sifraPartnera = req.query.sifraPartnera || req.params.sifraPartnera;
    if (!sifraPartnera) {
      return res
        .status(400)
        .json({ success: false, error: "Sifra partnera je obavezna" });
    }

    const nazivPartnera = req.query.nazivPartnera || req.params.nazivPartnera;

    const ranijeUzimano = await NarudzbeService.getRanijeUzimano(
      sifraPartnera,
      nazivPartnera,
    );
    // console.log('Ranije uzimano:', ranijeUzimano);
    return res.json({
      success: true,
      data: ranijeUzimano,
      count: ranijeUzimano.length,
    });
  } catch (error) {
    console.error("Pregled ranije uzimanih narudžbi error:", error);
    return res.status(500).json({
      success: false,
      error: "Greška pri učitavanju ranije uzimanih narudžbi",
    });
  }
};

export const getAktivneNarudzbe = async (req, res) => {
  try {
    const sifraTerena = req.query.sifraTerena || req.params.sifraTerena;

    if (!sifraTerena) {
      return res
        .status(400)
        .json({ success: false, error: "Sifra terena je obavezna" });
    }

    const narudzbeAktivne =
      await NarudzbeService.getAktivneNarudzbe(sifraTerena);
    return res.json({
      success: true,
      data: narudzbeAktivne,
      count: narudzbeAktivne.length,
    });
  } catch (error) {
    console.error("Pregled narudžbi error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Greška pri učitavanju narudžbi" });
  }
};

export const createNarudzba = async (req, res) => {
  try {
    const {
      referentniBroj,
      sifraKupca,
      sifraTerenaDostava,
      vrstaPlacanja,
      proizvodi,
    } = req.body;

    // Validacija
    if (
      !sifraKupca ||
      !sifraTerenaDostava ||
      !vrstaPlacanja ||
      !proizvodi ||
      proizvodi.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          "❌ Nedostaju obavezni podaci (sifraKupca, sifraTerenaDostava, vrstaPlacanja, proizvodi)",
      });
    }

    // console.log('📝 Primljena narudžba:', {
    //   sifraKupca,
    //   sifraTerenaDostava,
    //   vrstaPlacanja,
    //   brojProizvoda: proizvodi.length
    // });

    // Pozovi service za unos
    const rezultat = await NarudzbeService.createNarudzba({
      referentniBroj,
      sifraKupca,
      sifraTerenaDostava,
      vrstaPlacanja,
      proizvodi,
    });

    return res.json({
      success: true,
      message: "✅ Narudžba uspješno unijeta",
      data: rezultat,
    });
  } catch (error) {
    console.error("❌ Greška pri kreiranju narudžbe:", error);
    return res.status(500).json({
      success: false,
      error: "Greška pri spremanju narudžbe: " + error.message,
    });
  }
};

export const narudzbaBrisanjePartnera = async (req, res) => {
  try {
    const { sifraKupca, sifraTerenaDostava } = req.body;

    // Validacija
    if (!sifraKupca || !sifraTerenaDostava) {
      return res.status(400).json({
        success: false,
        error: "❌ Nedostaju obavezni podaci (sifraKupca, sifraTerenaDostava)",
      });
    }

    // 🗑️ Briši stare podatke za partnera prije unosa novih
    await NarudzbeService.obrisiNarudzbuPartnera({
      p_sifra_terena: sifraTerenaDostava,
      p_sifra_partnera: sifraKupca,
    });

    return res.json({
      success: true,
      message: "✅ Narudžba uspješno obrisana",
    });
  } catch (error) {
    console.error("❌ Greška pri brisanju narudžbe:", error);
    return res.status(500).json({
      success: false,
      error: "Greška pri brisanju narudžbe: " + error.message,
    });
  }
};

export const narudzbaBrisanjePartneraProizvoda = async (req, res) => {
  try {
    const { sifraKupca, sifraTerenaDostava, sifraProizvoda } = req.body;

    // Validacija
    if (!sifraKupca || !sifraTerenaDostava || !sifraProizvoda) {
      return res.status(400).json({
        success: false,
        error:
          "❌ Nedostaju obavezni podaci (sifraKupca, sifraTerenaDostava, sifraProizvoda)",
      });
    }

    // 🗑️ Briši stare podatke za partnera i proizvod prije unosa novih
    await NarudzbeService.obrisiNarudzbuPartneraProizvoda({
      p_sifra_terena: sifraTerenaDostava,
      p_sifra_partnera: sifraKupca,
      p_sifra_proizvoda: sifraProizvoda,
    });

    return res.json({
      success: true,
      message: "✅ Narudžba uspješno obrisana",
    });
  } catch (error) {
    console.error("❌ Greška pri brisanju narudžbe:", error);
    return res.status(500).json({
      success: false,
      error: "Greška pri brisanju narudžbe: " + error.message,
    });
  }
};

export const getZadnjiDanNarudzbe = async (req, res) => {
  try {
    const zadnjiDan = await NarudzbeService.getZadnjiDanNarudzbe();
    return res.json({
      success: true,
      data: zadnjiDan,
      count: zadnjiDan.length,
    });
  } catch (error) {
    console.error("Pregled zadnjeg dana narudžbe error:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: "Greška pri učitavanju zadnjeg dana narudžbe",
      });
  }
};
