import OpenAI from "openai";

// OVE importe zamijeni prema tvom projektu (kako se zovu fajlovi servisa)
import * as NarudzbeService from "./aktivneNarudzbe.service.js";
import * as IzvjestajiService from "./izvjestaji.service.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const takeTop = (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []);

export const buildKupacContext = async ({ sifraKupca, nazivKupca }) => {
  const ranije = await NarudzbeService.getRanijeUzimano(sifraKupca, nazivKupca);
  const izvjestaji = await IzvjestajiService.getIzvjestajiIstorija(sifraKupca);

  return {
    ranijeUzimano: takeTop(ranije, 40),
    izvjestaji: takeTop(izvjestaji, 5), // npr. zadnjih 5
  };
};

export const generateKupacAnaliza = async ({
  sifraKupca,
  nazivKupca,
  grad,
  vrstaPlacanjaNaziv,
  ranijeUzimano,
  izvjestaji,
  trenutnaNarudzba,
}) => {
  const system = `
Ti si asistent za komercijalistu.
Piši na srpskom jeziku latiničnim pismom.
Odgovor kratko i konkretno, u tačkama.
Ne izmišljaj podatke.
`.trim();

  const recentLines = (ranijeUzimano || [])
    .map(
      (x) =>
        `- ${x.sifra || x.sif || x.sifra_proizvoda} | ${x.naziv || x.naziv_proizvoda}`,
    )
    .join("\n");
  const reportLines = (izvjestaji || [])
    .map(
      (r) =>
        `- ${String(r.datum_razgovora || "").slice(0, 10)}: ${String(r.podaci || r.tekst || "").slice(0, 400)}`,
    )
    .join("\n");
  const orderLines = (trenutnaNarudzba || [])
    .map(
      (x) =>
        `- ${x.sifra_proizvoda} | ${x.naziv_proizvoda} | ${x.kolicina} ${x.jm}`,
    )
    .join("\n");

  const user = `
KUPAC:
- Šifra: ${sifraKupca}
- Naziv: ${nazivKupca}
- Grad: ${grad || "nije dostupno"}
- Vrsta plaćanja: ${vrstaPlacanjaNaziv || "nije odabrana"}

RANIJE UZIMANO:
${recentLines || "- nema"}

IZVJEŠTAJI (zadnji):
${reportLines || "- nema"}

TRENUTNA NARUDŽBA:
${orderLines || "- nema"}

ZADATAK:
1) Kratko sažmi kupca (1-2 rečenice)
2) Izdvoji 3 preporuke šta ponuditi danas (na osnovu ranije uzimanog)
3) Izdvoji 2-3 važne napomene iz izvještaja i kada je obavljan razgovor
4) Uoči rizik / upozorenje (ako postoji)
`.trim();

  const resp = await openai.responses.create({
    model: "gpt-4o-mini",
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_output_tokens: 350,
  });

  return resp.output_text?.trim() || "";
};
