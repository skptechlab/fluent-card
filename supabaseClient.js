// // supabaseClient.js
// import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// // Replace these with your actual values from Supabase dashboard
// const SUPABASE_URL = "https://pklmlttcycefshwxqcwu.supabase.co";
// const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbG1sdHRjeWNlZnNod3hxY3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMDE0OTQsImV4cCI6MjA1ODY3NzQ5NH0.1NxMlj8YvWHpntGXRlXjB4ntxW5aO-uJH8USLvlGm4Y";

// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


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
