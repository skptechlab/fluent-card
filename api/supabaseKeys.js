export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not set' });
  }

  // 🚀 Don’t worry – anon key is meant to be public (read access). It's fine to expose via API, but not directly in frontend.
  res.status(200).json({
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  });
}
