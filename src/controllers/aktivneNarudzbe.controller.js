import * as NarudzbeService from '../services/aktivneNarudzbe.service.js';

export const getAktivneNarudzbeGrupisano = async (req, res) => {
  try {
    const sifraTerena = req.query.sifraTerena || req.params.sifraTerena;


    if (!sifraTerena) {
      return res.status(400).json({ success: false, error: 'Sifra terena je obavezna' });
    }

    const narudzbeGrupisane = await NarudzbeService.getAktivneNarudzbeGrupisano(sifraTerena);
    return res.json({ success: true, data: narudzbeGrupisane, count: narudzbeGrupisane.length });
  } catch (error) {
    console.error('Pregled grupisanih narudžbi error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju narudžbi' });
  }
};



export const getRanijeUzimano = async (req, res) => {
  try {
    const sifraPartnera = req.query.sifraPartnera || req.params.sifraPartnera;
    if (!sifraPartnera) {
      return res.status(400).json({ success: false, error: 'Sifra partnera je obavezna' });
    }

    const nazivPartnera = req.query.nazivPartnera || req.params.nazivPartnera;

    const ranijeUzimano = await NarudzbeService.getRanijeUzimano(sifraPartnera, nazivPartnera);
    // console.log('Ranije uzimano:', ranijeUzimano);
    return res.json({ success: true, data: ranijeUzimano, count: ranijeUzimano.length });
  } catch (error) {
    console.error('Pregled ranije uzimanih narudžbi error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju ranije uzimanih narudžbi' });
  }
};



export const getAktivneNarudzbe = async (req, res) => {
  try {
    const sifraTerena = req.query.sifraTerena || req.params.sifraTerena;
  

    if (!sifraTerena) {
      return res.status(400).json({ success: false, error: 'Sifra terena je obavezna' });
    }
    
    const narudzbeAktivne = await NarudzbeService.getAktivneNarudzbe(sifraTerena);
    return res.json({ success: true, data: narudzbeAktivne, count: narudzbeAktivne.length });
  } catch (error) {
    console.error('Pregled narudžbi error:', error);
    return res.status(500).json({ success: false, error: 'Greška pri učitavanju narudžbi' });
  }
};




// ✅ NOVA FUNKCIJA
export const createNarudzba = async (req, res) => {
  try {
    const { sifraKupca, sifraTerenaDostava, vrstaPlacanja, proizvodi } = req.body;

    // Validacija
    if (!sifraKupca || !sifraTerenaDostava || !vrstaPlacanja || !proizvodi || proizvodi.length === 0) {
      return res.status(400).json({
        success: false,
        error: '❌ Nedostaju obavezni podaci (sifraKupca, sifraTerenaDostava, vrstaPlacanja, proizvodi)'
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
      sifraKupca,
      sifraTerenaDostava,
      vrstaPlacanja,
      proizvodi
    });

    return res.json({
      success: true,
      message: '✅ Narudžba uspješno unijeta',
      data: rezultat
    });

  } catch (error) {
    console.error('❌ Greška pri kreiranju narudžbe:', error);
    return res.status(500).json({
      success: false,
      error: 'Greška pri spremanju narudžbe: ' + error.message
    });
  }
};