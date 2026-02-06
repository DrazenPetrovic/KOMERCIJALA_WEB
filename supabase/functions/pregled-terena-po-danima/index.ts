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

    const [rows] = await connection.execute(
      'CALL pregled_aktivnih_terena_po_danima()'
    );

    await connection.end();

    const tereni = Array.isArray(rows) && rows.length > 0 ? rows[0] : [];

    // Return detailed debug info directly in response
    return new Response(
      JSON.stringify({
        debug_info: {
          raw_response_type: typeof rows,
          raw_is_array: Array.isArray(rows),
          raw_length: rows?.length,
          raw_data: rows
        },
        processed: {
          tereni_count: tereni.length,
          tereni_data: tereni
        }
      }, null, 2),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Pregled terena po danima error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Greška pri učitavanju terena"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
