import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import mysql from "npm:mysql2@3.6.5/promise";

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

    console.log('Full rows response:', JSON.stringify(rows));
    console.log('rows[0]:', JSON.stringify(rows[0]));

    const result = rows[0];
    console.log('Result:', result);

    let loginSuccess = false;
    let message = 'Pogrešno korisničko ime ili šifra';

    if (Array.isArray(result) && result.length > 0) {
      const firstRow = result[0];
      console.log('First row:', firstRow);

      if (typeof firstRow === 'object' && firstRow !== null) {
        const keys = Object.keys(firstRow);
        console.log('Keys in first row:', keys);
        const value = Object.values(firstRow)[0];
        console.log('First value:', value);
        loginSuccess = value === 1 || value === '1';
      } else {
        loginSuccess = firstRow === 1 || firstRow === '1';
      }
    }

    return new Response(
      JSON.stringify({
        success: loginSuccess,
        message: loginSuccess ? 'Uspešno logovanje' : message,
        debug: {
          rowsLength: Array.isArray(rows) ? rows.length : 'not array',
          firstElement: rows[0],
          type: typeof rows[0]
        }
      }),
      {
        status: 200,
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
