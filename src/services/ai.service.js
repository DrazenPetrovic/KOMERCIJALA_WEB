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

const buildTransakcijeLines = (transakcije, jm) =>
  (transakcije || [])
    .slice(0, 120)
    .map(
      (t) =>
        `- ${String(t.datum_racuna).slice(0, 10)} | ${t.naziv_partnera} | ${Number(t.kolicina).toFixed(2)} ${jm} | VPC: ${Number(t.vpc_vrednost).toFixed(2)} | Nab: ${Number(t.nabavna_vrednost).toFixed(2)}`,
    )
    .join("\n");

export const generateProizvodAnaliza = async ({
  naziv_proizvoda,
  jm,
  transakcije,
}) => {
  const system = `
Ti si analitičar prodaje. Piši na srpskom jeziku latiničnim pismom.
Odgovor kratko i konkretno, u tačkama. Ne izmišljaj podatke.
`.trim();

  const lines = buildTransakcijeLines(transakcije, jm);

  const user = `
PROIZVOD: ${naziv_proizvoda} (JM: ${jm})

TRANSAKCIJE PRODAJE (od najnovijeg):
${lines || "- nema podataka"}

ZADATAK:
1) Uoči trend kretanja količina i vrijednosti (rast, pad, stagnacija, sezonalnost)
2) Naznači najvažnije kupce i njihov udio u prodaji
3) Daj 2-3 moguća razloga za promjene u količinama
4) Preporuči kratku akciju komercijalisti
`.trim();

  const resp = await openai.responses.create({
    model: "gpt-4o-mini",
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_output_tokens: 500,
  });

  return resp.output_text?.trim() || "";
};

export const generateProizvodPitanje = async ({
  naziv_proizvoda,
  jm,
  transakcije,
  aiAnalysis,
  chatHistory,
  question,
}) => {
  const system = `
Ti si analitičar prodaje. Piši na srpskom jeziku latiničnim pismom.
Odgovaraj kratko i konkretno. Ne izmišljaj podatke.
`.trim();

  const lines = buildTransakcijeLines(transakcije, jm);

  const contextPrompt = `
PROIZVOD: ${naziv_proizvoda} (JM: ${jm})

TRANSAKCIJE PRODAJE (od najnovijeg):
${lines || "- nema podataka"}`.trim();

  const historyMessages = (chatHistory || []).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  const resp = await openai.responses.create({
    model: "gpt-4o-mini",
    input: [
      { role: "system", content: system },
      { role: "user", content: contextPrompt },
      { role: "assistant", content: aiAnalysis },
      ...historyMessages,
      { role: "user", content: question },
    ],
    max_output_tokens: 400,
  });

  return resp.output_text?.trim() || "";
};
