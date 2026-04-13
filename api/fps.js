export default async function handler(req, res) {

  const FPS_URL = process.env.FPS_URL;

  try {
    const response = await fetch(`${FPS_URL}?action=getFPS`);
    const data = await response.json();

    res.status(200).json(data);

  } catch {
    res.status(500).json({ error: "FPS fetch failed" });
  }
}
