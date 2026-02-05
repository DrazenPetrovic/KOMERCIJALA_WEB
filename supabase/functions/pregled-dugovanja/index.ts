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
    console.log('Token prefix:', token.substring(0, 20));
    console.log('JWT_SECRET from env:', Deno.env.get('JWT_SECRET') ? 'exists' : 'using default');

    const secret = new TextEncoder().encode(
      Deno.env.get('JWT_SECRET') || 'karpas-jwt-secret-2024-secure-key-7x9m2p4q8n'
    );

    let sifraRadnika: number;
    try {
      const { payload } = await jwtVerify(token, secret);
      console.log('JWT payload:', payload);
      sifraRadnika = payload.sifraRadnika as number;
      if (!sifraRadnika) {
        throw new Error('Missing sifraRadnika in token');
      }
    } catch (error) {
      console.error('JWT verification error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      return new Response(
        JSON.stringify({ error: "Nevažeći token", details: error.message, errorName: error.name }),
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

    const [results] = await connection.execute(
      'CALL komercijala.dugovanje_partnera_zbirno(?)',
      [sifraRadnika]
    );

    await connection.end();

    const rawDugovanja = Array.isArray(results) && results.length > 0
      ? (Array.isArray(results[0]) ? results[0] : results)
      : [];

    // Log kolona za debugging
    if (rawDugovanja.length > 0) {
      console.log('Dostupne kolone:', Object.keys(rawDugovanja[0]));
    }

    const dugovanja = rawDugovanja
      .filter((d: any) =>
        d.sifra_kup_z && d.sifra_kup_z > 0 && d.Naziv_partnera && d.Naziv_partnera.trim() !== ''
      )
      .map((d: any) => ({
        sifra: d.sifra_kup_z || 0,
        naziv_partnera: d.Naziv_partnera || '',
        ukupan_dug: parseFloat(d.Ukupan_dug) || 0,
        dug_preko_24: parseFloat(d.Dug_dvadesetcetiri) || 0,
        dug_preko_30: parseFloat(d.Dug_trideset) || 0,
        dug_preko_60: parseFloat(d.Dug_sezdeset) || 0,
        dug_preko_120: parseFloat(d.Dug_stodvadeset) || 0,
        najstariji_racun: d.Najstariji_racun ? new Date(d.Najstariji_racun).toLocaleDateString('sr-RS') : '-'
      }));

    let ukupanDug = 0;
    let dugPreko24 = 0;
    let dugPreko30 = 0;
    let dugPreko60 = 0;
    let dugPreko120 = 0;

    dugovanja.forEach((d: any) => {
      ukupanDug += d.ukupan_dug || 0;
      dugPreko24 += d.dug_preko_24 || 0;
      dugPreko30 += d.dug_preko_30 || 0;
      dugPreko60 += d.dug_preko_60 || 0;
      dugPreko120 += d.dug_preko_120 || 0;
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: dugovanja,
        stats: {
          ukupanDug: ukupanDug,
          dugPreko24: dugPreko24,
          dugPreko30: dugPreko30,
          dugPreko60: dugPreko60,
          dugPreko120: dugPreko120
        },
        count: dugovanja.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Pregled dugovanja error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Greška pri učitavanju dugovanja"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});