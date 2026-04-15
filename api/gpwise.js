export default async function handler(req, res) {
  const REPORT_URL = process.env.REPORT_URL;
  const API_KEY = process.env.API_KEY;

  try {
    const response = await fetch(`${REPORT_URL}?key=${API_KEY}`);
    const data = await response.json(); // ✅ important

    // 👇 format data for table
    const formatted = data.map(row => ({
      gp: row.GP || "",
      rc: Number(row.RC || 0),
      new_units: Number(row.NEW || 0),
      add_units: Number(row.ADD || 0),
      total_units: Number(row.TOTAL || 0)
    }));

    return res.status(200).json(formatted);

  } catch (err) {
    return res.status(500).json({ error: "GP-wise fetch failed" });
  }
}
