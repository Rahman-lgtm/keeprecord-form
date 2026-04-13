exports.handler = async function (event) {

  const API_KEY = process.env.API_KEY;
  const SHEET_URL = process.env.SHEET_URL;

  try {
    // 🔥 Fetch data from Google Script
    const res = await fetch(`${SHEET_URL}?key=${API_KEY}`);
    const text = await res.text();

    // ❗ अगर JSON नहीं आया तो भी crash नहीं होगा
    let data = [];
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Invalid JSON from Google:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid JSON from source" })
      };
    }

    // ✅ DUPLICATE CHECK
    if (event.queryStringParameters?.action === "checkDuplicate") {

      const appNum = (event.queryStringParameters.appNum || "").trim();

      console.log("Checking duplicate for:", appNum);

      const exists = data.some(row => {
        const sheetValue = (row["Application Number"] || "").toString().trim();
        return sheetValue === appNum;
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ exists })
      };
    }

    // ✅ NORMAL GET
    if (event.httpMethod === "GET") {
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      };
    }

    // ✅ TEMP POST (safe fallback)
    if (event.httpMethod === "POST") {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request" })
    };

  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server crash" })
    };
  }
};
