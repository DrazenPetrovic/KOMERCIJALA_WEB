# Arhitektura Aplikacije

## Kako Radi

Svi podaci ostaju **samo u MySQL bazi**. Nikada se ne čuvaju lokalno u pregledniku.

- **Frontend** (Vite + React) - Vizuelni interfejs, radi na portu 5173
- **Backend** (Express.js) - Middleware između frontend-a i MySQL baze, radi na portu 3001
- **MySQL** - Baza podataka na 94.130.111.127

## Pokretanje

Trebate pokrenuti **dva procesa** istovremeno:

### Terminal 1 - Backend (Express Server)
```bash
npm run dev:server
```
Server će biti dostupan na `http://localhost:3001`

### Terminal 2 - Frontend (Vite Dev Server)
```bash
npm run dev
```
Frontend će biti dostupan na `http://localhost:5173`

## Šta Se Promenilo

✅ Uklonjen `localStorage` - nema lokalnog čuvanja podataka
✅ JWT tokeni čuvaju se kao HTTP-only cookies
✅ Svi podaci dolaze samo iz MySQL baze
✅ Supabase edge funkcije zamenjene Express server-om
✅ Nema troškova - Express server je besplatan

## API Endpoints

### Autentifikacija
- `POST /api/auth/login` - Prijava korisnika
- `GET /api/auth/verify` - Verifikacija sesije
- `POST /api/auth/logout` - Odjavljivanje

### Podaci (zahtevaju autentifikaciju)
- `GET /api/artikli` - Pregled artikala
- `GET /api/dugovanja` - Pregled dugovanja
- `GET /api/partneri` - Pregled partnera
- `GET /api/teren-grad` - Pregled terena grad
- `GET /api/terena-po-danima` - Pregled terena po danima
- `GET /api/uplate` - Pregled uplata

## Production Deploy

Za production, trebate da:
1. Pokrenete Express server na javnom serveru sa `NODE_ENV=production`
2. Ažurirate `FRONTEND_URL` u `.env` sa stvarnom URL adresom frontend-a
3. Kompajlirate frontend sa `npm run build`
4. Servujete `dist` folder sa Web servera (nginx, Apache, itd.)
