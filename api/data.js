export default async function handler(req, res) {

  const SHEET_URL = process.env.SHEET_URL;

  try {

    // ✅ GET
    if (req.method === "GET") {
      const { action, appNum } = req.query;

      const url = `${SHEET_URL}?action=${action}&appNum=${encodeURIComponent(appNum || "")}`;

      const response = await fetch(url);
      const text = await response.text();

      return res.status(200).send(text);
    }

    // ✅ POST
    if (req.method === "POST") {

      let body = "";

      await new Promise((resolve) => {
        req.on("data", chunk => {
          body += chunk.toString();
        });
        req.on("end", resolve);
      });

      console.log("BODY SENT:", body);

      const response = await fetch(SHEET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body
      });

      const text = await response.text();

      return res.status(200).send(text);
    }

    return res.status(400).json({ error: "Invalid request" });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
