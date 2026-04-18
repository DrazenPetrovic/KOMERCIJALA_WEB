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

const buildKontekstPrompt = ({ naziv_proizvoda, jm, sifra, agregirano, kategorizirani }) => {
  const agLines = (agregirano || [])
    .map(
      (a) =>
        `- ${a.period}: ${Number(a.kolicina).toFixed(2)} ${jm} | VPC avg: ${Number(a.vpc_avg).toFixed(2)} | Nab avg: ${Number(a.nab_avg).toFixed(2)}`,
    )
    .join("\n");

  const fmt = (lista, fn) => (lista?.length ? lista.map(fn).join(", ") : "-");

  const k = kategorizirani || {};
  return `PROIZVOD: ${naziv_proizvoda}${sifra ? ` (šifra: ${sifra})` : ""}${jm ? ` (JM: ${jm})` : ""}

AGREGIRANE KOLIČINE PO PERIODU (od najstarijeg):
${agLines || "- nema podataka"}

KATEGORIZACIJA KUPACA (JS analiza):
Stabilni: ${fmt(k.stabilni, (x) => x.kupac)}
Povremeni (<50% aktivnih mj): ${fmt(k.povremeni, (x) => `${x.kupac} (${x.aktivnostPosto}%)`)}
Novi (u zadnja 3 mj): ${fmt(k.novi, (x) => `${x.kupac} [od ${x.prvi}]`)}
Prestali (>6 mj bez narudžbe): ${fmt(k.prestali, (x) => `${x.kupac} [zadnji ${x.zadnji}]`)}`;
};

export const generateProizvodAnaliza = async ({
  naziv_proizvoda,
  jm,
  sifra,
  agregirano,
  kategorizirani,
}) => {
  const system = `
Ti si senior analitičar prodaje sa 15 godina iskustva.
Piši isključivo na srpskom jeziku latiničnim pismom.
Budi konkretan, navodi brojeve i procente iz podataka.
Nikada ne izmišljaj podatke — ako nešto nije u podacima, kaži to eksplicitno.
Struktuiraj odgovor po sekcijama sa jasnim naslovima.
`.trim();

  const user = `
${buildKontekstPrompt({ naziv_proizvoda, jm, sifra, agregirano, kategorizirani })}

## ZADATAK — odgovori na svako pitanje sa konkretnim brojevima:

### 1. TREND KOLIČINA I VRIJEDNOSTI
Godišnji zbirovi i % rast/pad između godina. Uoči sezonske obrasce.

### 2. CJENOVNI TREND
Kako se kretala prodajna (VPC) i nabavna cijena? Koja je marža na početku vs. kraju perioda?

### 3. INTERPRETACIJA KUPACA
Na osnovu kategorizacije: zašto su prestali prestali? Šta privlači nove? Zašto su povremeni nestabilni?

### 4. KONKRETNE PREPORUKE (3-5)
Šta komercijalista treba uraditi sljedeće?
`.trim();

  const resp = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_output_tokens: 2000,
  });

  return resp.output_text?.trim() || "";
};

export const generateProizvodPitanje = async ({
  naziv_proizvoda,
  jm,
  sifra,
  agregirano,
  kategorizirani,
  aiAnalysis,
  chatHistory,
  question,
}) => {
  const system = `
Ti si analitičar prodaje. Piši na srpskom jeziku latiničnim pismom.
Odgovaraj kratko i konkretno. Ne izmišljaj podatke.
`.trim();

  const contextPrompt = buildKontekstPrompt({ naziv_proizvoda, jm, sifra, agregirano, kategorizirani });

  const historyMessages = (chatHistory || []).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  const resp = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      { role: "system", content: system },
      { role: "user", content: contextPrompt },
      { role: "assistant", content: aiAnalysis },
      ...historyMessages,
      { role: "user", content: question },
    ],
    max_output_tokens: 800,
  });

  return resp.output_text?.trim() || "";
};
