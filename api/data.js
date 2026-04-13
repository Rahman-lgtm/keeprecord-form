export default async function handler(req, res) {
  try {

    const action = req.method === "POST"
      ? req.body?.action
      : req.query?.action;

    if (!action) {
      return res.status(400).json({ error: "Missing action" });
    }

    const url = process.env.SHEET_URL;

    // ✅ DUPLICATE CHECK
    if (action === "checkDuplicate") {

      const appNum = req.query.appNum;

      const response = await fetch(
        url + "?action=checkDuplicate&appNum=" + encodeURIComponent(appNum)
      );

      const text = await response.text();

      try {
        const data = JSON.parse(text);
        return res.json(data);
      } catch {
        console.log("Duplicate RAW:", text);
        return res.status(500).json({ error: text });
      }
    }


    // ✅ SUBMIT
    if (action === "submit") {

      let body = "";

      await new Promise((resolve) => {
        req.on("data", chunk => body += chunk);
        req.on("end", resolve);
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body
      });

      const text = await response.text();

      try {
        const data = JSON.parse(text);
        return res.json(data);
      } catch {
        console.log("Submit RAW:", text);
        return res.status(500).json({ error: text });
      }
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Server crash" });
  }
}
