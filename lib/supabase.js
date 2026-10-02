import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Cliente único (a chave "anon" é pública; a segurança vem das regras RLS do banco)
export const supabase = createClient(url || "http://localhost", key || "missing", {
  auth: { persistSession: typeof window !== "undefined" },
});
