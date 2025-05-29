import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

let supabase = null;

async function initSupabase() {
  if (!supabase) {
    const response = await fetch('/api/supabaseKeys');
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = await response.json();

    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

await initSupabase(); // Initialize once on load

export { supabase };
