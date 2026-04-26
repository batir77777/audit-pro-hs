import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const callerJwt = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: "Bearer " + callerJwt } },
    });

    const { data: roleData, error: roleError } = await callerClient.rpc("get_my_role");
    const callerRole = Array.isArray(roleData) ? roleData[0] : roleData;
    if (roleError || callerRole !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: caller is not super_admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, full_name, role, organisation_id } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email is required and must be a string" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return new Response(JSON.stringify({ error: "password is required and must be at least 8 characters" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!full_name || typeof full_name !== "string") {
      return new Response(JSON.stringify({ error: "full_name is required and must be a string" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const allowedRoles = ["client_admin", "client_user"];
    if (!role || typeof role !== "string" || !allowedRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "role must be one of: " + allowedRoles.join(", ") }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!organisation_id || typeof organisation_id !== "string") {
      return new Response(JSON.stringify({ error: "organisation_id is required and must be a UUID string" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organisation_id)) {
      return new Response(JSON.stringify({ error: "organisation_id must be a valid UUID" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, organisation_id },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id, email: newUser.user.email }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
