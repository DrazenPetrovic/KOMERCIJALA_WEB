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
      'CALL pregled_partnera(?)',
      [sifraRadnika]
    );

    await connection.end();

    console.log('Raw rows:', JSON.stringify(rows, null, 2));
    console.log('Rows type:', typeof rows);
    console.log('Rows is array:', Array.isArray(rows));
    console.log('Rows length:', Array.isArray(rows) ? rows.length : 'N/A');

    if (Array.isArray(rows) && rows.length > 0) {
      console.log('Rows[0] type:', typeof rows[0]);
      console.log('Rows[0] is array:', Array.isArray(rows[0]));
      console.log('Rows[0]:', JSON.stringify(rows[0], null, 2));
    }

    let partneri: any[] = [];

    if (Array.isArray(rows)) {
      if (Array.isArray(rows[0])) {
        partneri = rows[0];
      } else if (rows.length > 0 && typeof rows[0] === 'object') {
        partneri = rows;
      }
    }

    console.log('Final partneri count:', partneri.length);
    if (partneri.length > 0) {
      console.log('First partner:', JSON.stringify(partneri[0], null, 2));
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: partneri,
        count: partneri.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Pregled partnera error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Greška pri učitavanju partnera"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
