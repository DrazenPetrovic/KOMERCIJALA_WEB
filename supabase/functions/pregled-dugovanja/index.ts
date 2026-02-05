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

    const [results] = await connection.execute(
      'CALL komercijala.dugovanje_partnera_zbirno(?)',
      [sifraRadnika]
    );

    await connection.end();

    console.log('[DUGOVANJA] MySQL raw results type:', typeof results);
    console.log('[DUGOVANJA] MySQL raw results is array:', Array.isArray(results));
    console.log('[DUGOVANJA] MySQL raw results length:', Array.isArray(results) ? results.length : 'N/A');
    console.log('[DUGOVANJA] MySQL results:', JSON.stringify(results, null, 2));
    console.log('[DUGOVANJA] Sifra radnika:', sifraRadnika);

    // MySQL stored procedures vraćaju array of arrays
    // Prvi element je actual result set
    const dugovanja = Array.isArray(results) && results.length > 0
      ? (Array.isArray(results[0]) ? results[0] : results)
      : [];

    console.log('[DUGOVANJA] Processed dugovanja:', JSON.stringify(dugovanja, null, 2));
    console.log('[DUGOVANJA] First row keys:', dugovanja.length > 0 ? Object.keys(dugovanja[0]) : 'none');
    console.log('[DUGOVANJA] First row:', dugovanja.length > 0 ? JSON.stringify(dugovanja[0], null, 2) : 'none');

    let ukupanDug = 0;
    let dugPreko30 = 0;
    let dugPreko60 = 0;

    dugovanja.forEach((d: any) => {
      ukupanDug += parseFloat(d.ukupan_dug) || 0;
      dugPreko30 += parseFloat(d.dug_preko_30) || 0;
      dugPreko60 += parseFloat(d.dug_preko_60) || 0;
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: dugovanja,
        stats: {
          ukupanDug: ukupanDug,
          dugPreko30: dugPreko30,
          dugPreko60: dugPreko60
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
