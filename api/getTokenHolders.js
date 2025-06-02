export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mintAddress } = req.body;
    const heliusKey = process.env.HELIUS_API_KEY;

    const heliusUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
    const requestBody = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccounts",
      params: {
        mint: mintAddress,
        page: 1,
        limit: 1000
      }
    };

    const response = await fetch(heliusUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("Helius API error:", err);
    res.status(500).json({ error: "Failed to fetch token holders" });
  }
}
