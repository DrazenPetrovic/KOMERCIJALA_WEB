# Database Configuration

**VAŽNO: Ovaj projekat NE koristi Supabase!**

## MySQL Baza

Projekat koristi **MySQL bazu** koja se nalazi na eksternom serveru.

Svi database pozivi se izvršavaju preko **Supabase Edge Functions** koje pozivaju MySQL bazu:

- `supabase/functions/login-radnika/` - Autentifikacija radnika
- `supabase/functions/pregled-artikala/` - Lista artikala
- `supabase/functions/pregled-dugovanja/` - Pregled dugovanja
- `supabase/functions/pregled-partnera/` - Lista partnera
- `supabase/functions/pregled-teren-grad/` - Teren po gradu
- `supabase/functions/pregled-terena-po-danima/` - Teren po danima
- `supabase/functions/pregled-uplata/` - Uplate

## Frontend

Frontend poziva Edge Functions direktno preko `fetch` API-ja.

**NIKADA ne instalirati @supabase/supabase-js paket!**
