export default async function handler(req, res) {
  try {

    const { action } = req.method === "POST"
      ? req.body
      : req.query;

    if (!action) {
      return res.status(400).json({ error: "Invalid action" });
    }

    // ✅ DUPLICATE CHECK
    if (action === "checkDuplicate") {

      const { appNum } = req.query;

      const url = process.env.SHEET_URL;

      const response = await fetch(
        url + "?action=checkDuplicate&appNum=" + encodeURIComponent(appNum)
      );

      const data = await response.json();
      return res.json(data);
    }

    // ✅ SUBMIT
    if (action === "submit") {

      const formData = req.body;

      const url = process.env.SHEET_URL;

      const params = new URLSearchParams(formData);

      const response = await fetch(url, {
        method: "POST",
        body: params
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return res.status(500).json({ error: "Invalid response from sheet" });
      }

      return res.json(data);
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
