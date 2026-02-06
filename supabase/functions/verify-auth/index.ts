import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("authToken="))
      ?.split("=")[1];

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const secret = new TextEncoder().encode(
      Deno.env.get("JWT_SECRET") || "karpas-jwt-secret-2024-secure-key-7x9m2p4q8n"
    );

    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as any;

    return new Response(
      JSON.stringify({
        authenticated: true,
        username: payload.username,
        sifraRadnika: payload.sifraRadnika,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Auth verification error:", error);
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
