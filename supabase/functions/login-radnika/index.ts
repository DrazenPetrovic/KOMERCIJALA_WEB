import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import mysql from "npm:mysql2@3.6.5/promise";
import { SignJWT } from "npm:jose@5.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LoginRequest {
  username: string;
  password: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { username, password }: LoginRequest = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Korisničko ime i šifra su obavezni" }),
        {
          status: 400,
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
      'CALL logovanje_korisnika(?, ?)',
      [username, password]
    );

    await connection.end();

    const result = rows[0];
    let sifraRadnika: number | null = null;

    if (Array.isArray(result) && result.length > 0) {
      const firstRow = result[0];

      if (typeof firstRow === 'object' && firstRow !== null) {
        const value = Object.values(firstRow)[0];
        const numValue = typeof value === 'number' ? value : parseInt(value as string);
        if (!isNaN(numValue) && numValue > 0) {
          sifraRadnika = numValue;
        }
      } else {
        const numValue = typeof firstRow === 'number' ? firstRow : parseInt(firstRow as string);
        if (!isNaN(numValue) && numValue > 0) {
          sifraRadnika = numValue;
        }
      }
    }

    if (sifraRadnika) {
      const secret = new TextEncoder().encode(
        Deno.env.get('JWT_SECRET') || 'karpas-jwt-secret-2024-secure-key-7x9m2p4q8n'
      );

      const token = await new SignJWT({
        username,
        sifraRadnika,
        loginTime: new Date().toISOString()
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(secret);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Uspešno logovanje',
          token,
          user: { username, sifraRadnika }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Pogrešno korisničko ime ili šifra'
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Greška pri povezivanju sa bazom"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
