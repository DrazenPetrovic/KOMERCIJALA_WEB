import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import mysql from "npm:mysql2@3.6.5/promise";
import { jwtVerify } from "npm:jose@5.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Nedostaje autorizacija" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.substring(7);
    const secret = new TextEncoder().encode(
      Deno.env.get('JWT_SECRET') || 'karpas-jwt-secret-2024-secure-key-7x9m2p4q8n'
    );

    let sifraRadnika: number;
    try {
      const { payload } = await jwtVerify(token, secret);
      sifraRadnika = payload.sifraRadnika as number;
      if (!sifraRadnika) {
        throw new Error('Missing sifraRadnika in token');
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Nevažeći token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const connection = await mysql.createConnection({
      host: '94.130.111.127',
      port: 3306,
      user: 'komercijala1',
      password: 'TeletabisI!123',
      database: 'komercijala'
    });

    console.log('[SKORASNJE-UPLATE] Sifra radnika:', sifraRadnika);

    const [results] = await connection.execute(
      'CALL komercijala.dostava_provjera_uplata(?)',
      [sifraRadnika]
    );

    await connection.end();

    console.log('[SKORASNJE-UPLATE] MySQL results:', JSON.stringify(results, null, 2));

    // MySQL stored procedures vraćaju array of arrays
    // Prvi element je actual result set
    const uplateData = Array.isArray(results) && results.length > 0
      ? (Array.isArray(results[0]) ? results[0] : results)
      : [];

    const uplatePartneri = uplateData.map((row: any) => row.sifra_partnera || row.SIFRA_PARTNERA);

    console.log('[SKORASNJE-UPLATE] Mapped uplatePartneri:', uplatePartneri);
    console.log('[SKORASNJE-UPLATE] Number of partners with recent payments:', uplatePartneri.length);

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
    console.error('[SKORASNJE-UPLATE] Error:', error);
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
