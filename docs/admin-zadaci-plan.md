# Admin zadaci za komercijaliste — Planiranje funkcionalnosti

## Kontekst projekta

Web aplikacija za upravljanje komercijalnim aktivnostima.  
Stack: React + TypeScript (frontend), Node.js API (backend).

### Relevantni fajlovi

- `src/components/IzvlestajList.tsx` — forma za komercijaliste (unos izvještaja po partneru, glasovni unos, istorija)
- `src/components/IzvjestajAdmin.tsx` — admin pregled izvještaja (filteri po datumu/periodu/komercijalisti, modal po partneru)

---

## Trenutno stanje sistema

### Komercijalista (`IzvlestajList.tsx`)
- Bira partnera s lijeve liste (pretraga po imenu/gradu/šifri)
- Upisuje tekst izvještaja (ručno ili glasovnim unosom)
- Snima izvještaj via `POST /api/izvjestaji/save`
- Vidi istoriju izvještaja za odabranog partnera

### Admin (`IzvjestajAdmin.tsx`)
- Filtrira izvještaje po datumu (dan ili period) i komercijalisti
- Prikazuje kartice s izvještajima (partner, datum, komercijalista, tekst)
- Klik na partnera otvara modal sa svom historijom tog partnera
- **Samo čitanje — ne može dodavati zadatke**

---

## Planirana funkcionalnost: Admin zadaci

### Ideja
Admin kreira zadatak (opći tekst, bez vezivanja za konkretnog partnera).  
Komercijalista vidi aktivne zadatke pri radu u svom izvještaju.

### Zaključci iz diskusije
- Zadaci su **univerzalni** — nisu vezani za konkretnog partnera/kupca
- Zadatak može biti dodijeljen **jednom komercijalisti** ili **svim** (NULL = svi)
- Jedna tabela je dovoljna

---

## Prijedlog strukture tabele

```sql
admin_zadaci (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  tekst_zadatka    TEXT NOT NULL,
  sifra_radnika    INT NULL,         -- NULL = za sve komercijaliste
  rok              DATE NULL,         -- opcioni rok izvršenja
  status           ENUM('aktivan', 'rijesen') DEFAULT 'aktivan',
  datum_kreiranja  DATETIME DEFAULT NOW(),
  datum_rjesavanja DATETIME NULL,
  napomena         TEXT NULL          -- komentar komercijaliste pri zatvaranju
)
```

---

## Otvorena pitanja (još nisu odlučena)

1. **Ko može označiti zadatak kao riješen?**  
   Opcije: samo komercijalista / samo admin / oboje

2. **Da li zadatak ima rok i upozorenje?**  
   Treba li komercijalista vidjet vizuelno upozorenje ako rok prođe?

3. **Da li admin vidi ko je i kada riješio zadatak?**  
   Ili samo status da/ne?

4. **Više zadataka istovremeno?**  
   Može li biti više aktivnih zadataka u isto vrijeme?

---

## Zaključci (dodavati ovdje)

_[ Ovdje dodavati zaključke iz daljnje diskusije ]_

---
