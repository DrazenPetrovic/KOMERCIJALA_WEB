# Database Configuration

## MySQL Baza

Projekat koristi **MySQL bazu** koja se nalazi na eksternom serveru.

Svi database pozivi se izvršavaju preko **Express.js backend servera** koji koristi `mysql2` biblioteku:

## Backend API Endpoints

- `POST /api/auth/login` - Autentifikacija radnika
- `GET /api/artikli` - Lista artikala
- `GET /api/dugovanja` - Pregled dugovanja
- `GET /api/partneri` - Lista partnera
- `GET /api/teren-grad` - Teren po gradu
- `GET /api/terena-po-danima` - Teren po danima
- `GET /api/uplate` - Uplate
- `POST /api/izvjestaji/save` - Spremanje izvještaja o partneru
- `GET /api/izvjestaji/:sifraPartnera` - Učitavanje izvještaja za partnera

## Frontend

Frontend poziva Express.js backend API direktno preko `fetch` API-ja sa `credentials: 'include'` za slanje HTTP-only cookies.

## Autentifikacija

Autentifikacija se vrši preko JWT tokena koji se čuvaju kao HTTP-only cookies na klijentu.
