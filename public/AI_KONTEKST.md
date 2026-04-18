## Arhitektura rješenja

### Korak 1 - JS (prije AI poziva)

Pokreni analizirajKupce(transakcije) koja vraća:
{
prestali: [...],
novi: [...],
povremeni: [...],
stabilni: [...]
}

### Korak 2 - AI poziv

AI-ju ne šalji sirove transakcije nego:

- Agregirane količine po kupcu/mjesecu (buildTransakcijeLines)
- Već kategorizirane kupce iz analizirajKupce()
- AI se fokusira samo na interpretaciju i preporuke

### Rezultat

- Drastično manje tokena (ispod 30,000 TPM limita)
- Preciznija analiza jer JS radi egzaktnu matematiku
- AI troši tokene samo na ono što jedino AI može — interpretaciju
