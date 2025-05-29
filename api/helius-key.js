export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Load from environment variable
  const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
  if (!HELIUS_API_KEY) {
    return res.status(500).json({ error: 'Helius API key not set' });
  }

  try {
    // Return as JSON
    res.status(200).json({ heliusKey: HELIUS_API_KEY });
  } catch (error) {
    console.error("Error returning Helius API key:", error);
    res.status(500).json({ error: 'Failed to retrieve Helius API key' });
  }
}
