export default async function handler(req, res) {

  const REPORT_URL = process.env.REPORT_URL;
  const API_KEY = process.env.API_KEY;

  try {

    const response = await fetch(`${REPORT_URL}?key=${API_KEY}`);
    const data = await response.text();

    return res.status(200).send(data);

  } catch (err) {
    return res.status(500).json({ error: "Report fetch failed" });
  }
}
