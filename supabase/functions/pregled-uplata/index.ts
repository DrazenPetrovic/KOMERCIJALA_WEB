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

    try {
      const { payload } = await jwtVerify(token, secret);
      console.log('JWT payload (pregled-uplata):', payload);
    } catch (error) {
      console.error('JWT verification error (pregled-uplata):', error);
      return new Response(
        JSON.stringify({ error: "Nevažeći token", details: error.message }),
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
      'CALL komercijala.dostava_provjera_uplata()'
    );

    await connection.end();

    const rawUplate = Array.isArray(results) && results.length > 0
      ? (Array.isArray(results[0]) ? results[0] : results)
      : [];

    const uplate = rawUplate.map((u: any) => ({
      sifra_partnera: u.sifra_partnera || 0,
      napomena: u.napomena || '',
      sifra: u.sifra || 0
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: uplate,
        count: uplate.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Pregled uplata error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Greška pri učitavanju uplata"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
