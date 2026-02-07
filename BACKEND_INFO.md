# Backend Arhitektura

## Trenutni Backend: MySQL + Express.js

Projekat **SADA KORISTI** lokalni MySQL backend kroz Express.js server.

### Backend Server: `server.mjs`

**Tehnologije:**
- Express.js (Node.js web framework)
- MySQL2 (mysql2/promise) - za pristup MySQL bazi
- JWT (jsonwebtoken) - za autentifikaciju
- Cookie-based authentication - koristi httpOnly cookies

**Port:** 3001 (default)

**MySQL Konekcija:**
- Host: definisan u `.env` fajlu (DB_HOST)
- Port: 3306 (default MySQL port)
- User: definisan u `.env` fajlu (DB_USER)
- Password: definisan u `.env` fajlu (DB_PASSWORD)
- Database: definisan u `.env` fajlu (DB_NAME)

### API Endpoints

Svi endpoint-i su zaštićeni JWT autentifikacijom (osim login/logout):

1. **Authentication:**
   - `POST /api/auth/login` - Prijava korisnika (poziva MySQL stored procedure `logovanje_korisnika`)
   - `GET /api/auth/verify` - Verifikacija tokena
   - `POST /api/auth/logout` - Odjava korisnika

2. **Data Endpoints:**
   - `GET /api/health` - Health check endpoint
   - `GET /api/artikli` - Lista artikala (poziva `komercijala.pregled_artikli()`)
   - `GET /api/dugovanja` - Dugovanja partnera (poziva `komercijala.dugovanje_partnera_zbirno()`)
   - `GET /api/partneri` - Lista partnera (poziva `komercijala.pregled_svih_partnera()`)
   - `GET /api/teren-grad` - Tereni po gradovima (poziva `komercijala.pregled_terena_grad()`)
   - `GET /api/terena-po-danima` - Tereni po danima (poziva `komercijala.pregled_terena_po_danima()`)
   - `GET /api/uplate` - Uplate (poziva `komercijala.pregled_uplata()`)

### Frontend Komponente

Sve komponente sada koriste lokalni API:

- **ArtikliList.tsx** → `/api/artikli`
- **DugovanjaList.tsx** → `/api/dugovanja`, `/api/uplate`
- **PartneriList.tsx** → `/api/partneri`
- **OrdersList.tsx** → `/api/teren-grad`, `/api/terena-po-danima`
- **auth.ts** → `/api/auth/login`, `/api/auth/verify`, `/api/auth/logout`

### Autentifikacija

**Metod:** Cookie-based JWT authentication

1. Korisnik se prijavljuje kroz `/api/auth/login`
2. Server kreira JWT token i šalje ga kao httpOnly cookie
3. Frontend automatski šalje cookie sa svakim request-om (`credentials: 'include'`)
4. Server validira token kroz `verifyToken` middleware

**Prednosti:**
- Sigurnije od localStorage (httpOnly cookies ne mogu biti pristupljeni iz JavaScript-a)
- Automatsko slanje sa svakim request-om
- XSS zaštita

### Supabase Status

❌ **Supabase je POTPUNO UKLONJEN** iz projekta:
- `@supabase/supabase-js` npm paket je uklonjen
- Svi Supabase URL-ovi su zamenjeni lokalnim endpoint-ima
- Nema više Bearer token autentifikacije

### Pokretanje

1. **Backend:**
   ```bash
   npm run dev:server
   # ili
   node server.mjs
   ```

2. **Frontend:**
   ```bash
   npm run dev
   ```

3. **Build:**
   ```bash
   npm run build
   ```

### Environment Variables

Sve credentials su sada u `.env` fajlu (nije u Git-u):

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-database-name

# JWT Secret
JWT_SECRET=your-jwt-secret
```

### Sigurnost

✅ **Implementirano:**
- Environment variables za sve credentials
- JWT autentifikacija
- httpOnly cookies
- CORS konfiguracija
- Input validacija
- Error handling

---

**Zaključak:** Projekat koristi **MySQL bazu** kao jedini izvor podataka, pristupajući joj kroz **Express.js backend** sa **stored procedures**.
