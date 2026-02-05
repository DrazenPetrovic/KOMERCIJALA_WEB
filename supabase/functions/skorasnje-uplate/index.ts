import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DecodedToken {
  sifra_radnika?: number;
}

function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1]);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nedostaje autorizacija'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = decodeToken(token);

    if (!decoded?.sifra_radnika) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nevalidan token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sifraRadnika = decoded.sifra_radnika;

    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    const client = new Client(dbUrl);
    await client.connect();

    const result = await client.queryObject(`
      SELECT DISTINCT
        uu.sifra_kupac_iz_uplata as sifra_partnera
      FROM
        utg_uplata uu
      INNER JOIN
        kupci k ON uu.sifra_kupac_iz_uplata = k.sifra_partnera
      WHERE
        k.pripada_radniku = $1
        AND uu.datum_uplate >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY
        uu.sifra_kupac_iz_uplata
    `, [sifraRadnika]);

    await client.end();

    const uplatePartneri = result.rows.map((row: any) => row.sifra_partnera);

    return new Response(JSON.stringify({
      success: true,
      data: uplatePartneri
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Greška pri učitavanju uplata'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });
  }
});
