export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.PLANT_ID_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { action, images, accessToken, question, prompt, temperature, app_name } = req.body;

    let url;
    let body;

    if (action === "identify") {
      url = "https://plant.id/api/v3/identification";
      body = JSON.stringify({ images, similar_images: true });
    } else if (action === "care" || action === "careFull") {
      if (!accessToken) {
        return res.status(400).json({ error: "Missing accessToken" });
      }
      url = `https://plant.id/api/v3/identification/${accessToken}/conversation`;
      body = JSON.stringify({ question, prompt, temperature: temperature || 0.5, app_name: app_name || "Canopy" });
    } else if (action === "health") {
      url = "https://plant.id/api/v3/health_assessment";
      body = JSON.stringify({
        images,
        similar_images: true,
        latitude: req.body.latitude || undefined,
        longitude: req.body.longitude || undefined,
      });
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("API proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
