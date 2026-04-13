export default async function handler(req, res) {

  const REPORT_URL = process.env.REPORT_URL;

  try {
    const response = await fetch(REPORT_URL);
    const text = await response.text();

    res.status(200).send(text);

  } catch (err) {
    res.status(500).json({ error: "Report fetch failed" });
  }
}
