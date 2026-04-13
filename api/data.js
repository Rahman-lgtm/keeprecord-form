export default async function handler(req, res) {

  const API_KEY = process.env.API_KEY;
  const SHEET_URL = process.env.SHEET_URL;

  try {
    const response = await fetch(`${SHEET_URL}?key=${API_KEY}`);
    const data = await response.json();

    // duplicate check
    if (req.query.action === "checkDuplicate") {
      const appNum = (req.query.appNum || "").trim();

      const exists = data.some(row =>
        (row["Application Number"] || "").toString().trim() === appNum
      );

      return res.status(200).json({ exists });
    }

    // submit
    if (req.method === "POST") {
      await fetch(SHEET_URL, {
        method: "POST",
        body: JSON.stringify(req.body),
        headers: { "Content-Type": "application/json" }
      });

      return res.status(200).json({ success: true });
    }

    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
