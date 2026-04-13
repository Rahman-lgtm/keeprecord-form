export default async function handler(req, res) {

  const API_KEY = process.env.API_KEY;
  const SHEET_URL = process.env.SHEET_URL;

  try {

    // ✅ GET REQUEST
    if (req.method === "GET") {

      const { action, appNum } = req.query;

      // 🔥 FETCH DATA FROM GOOGLE SHEET
      const response = await fetch(`${SHEET_URL}?key=${API_KEY}`);
      const data = await response.json();

      // ✅ DUPLICATE CHECK
      if (action === "checkDuplicate") {
        const exists = data.some(row =>
          row["Application Number"] === appNum
        );

        return res.status(200).json({ exists });
      }

      // ✅ DEFAULT RETURN (jab direct open kare)
      return res.status(200).json(data);
    }

    // ✅ POST (FORM SUBMIT)
    if (req.method === "POST") {

      const response = await fetch(`${SHEET_URL}?key=${API_KEY}`, {
        method: "POST",
        body: req.body
      });

      const text = await response.text();

      return res.status(200).json({
        success: true,
        message: text
      });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
