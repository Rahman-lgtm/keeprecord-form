export default async function handler(req, res) {
  const SHEET_URL = process.env.SHEET_URL;

  try {
    if (!SHEET_URL) {
      return res.status(500).json({ error: "SHEET_URL not set" });
    }

    if (req.method === "GET") {
      const { action = "", appNum = "" } = req.query;

      const url = `${SHEET_URL}?action=${encodeURIComponent(action)}&appNum=${encodeURIComponent(appNum)}`;

      const response = await fetch(url);
      const text = await response.text();

      return res.status(200).send(text);
    }

    if (req.method === "POST") {
      console.log("REQ BODY:", req.body);

      const params = new URLSearchParams();

      Object.entries(req.body || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value ?? "");
        }
      });

      const forwardBody = params.toString();
      console.log("FORWARD BODY:", forwardBody);

      const response = await fetch(SHEET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: forwardBody
      });

      const text = await response.text();
      console.log("GAS RESPONSE:", text);

      return res.status(200).send(text);
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
