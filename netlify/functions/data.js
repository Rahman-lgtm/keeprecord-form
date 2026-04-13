exports.handler = async function (event) {

  const API_KEY = process.env.API_KEY;
  const SHEET_URL = process.env.SHEET_URL;

  try {

    // 🔥 GET DATA FROM GOOGLE SHEET
    const res = await fetch(`${SHEET_URL}?key=${API_KEY}`);
    const text = await res.text();

    let data = [];
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Invalid JSON:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid JSON from Google Script" })
      };
    }

    // ===============================
    // ✅ DUPLICATE CHECK
    // ===============================
    if (event.queryStringParameters?.action === "checkDuplicate") {

      const appNum = (event.queryStringParameters.appNum || "").trim();

      const exists = data.some(row => {
        const val = (row["Application Number"] || "").toString().trim();
        return val === appNum;
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ exists })
      };
    }

    // ===============================
    // ✅ FORM SUBMIT (POST)
    // ===============================
    if (event.httpMethod === "POST") {

      // 🔥 form data parse
      const body = event.body;

      // Netlify forms send as URL encoded
      const params = new URLSearchParams(body);

      const formData = {};
      for (const [key, value] of params.entries()) {
        formData[key] = value;
      }

      console.log("FORM DATA:", formData);

      // 🔥 SEND TO GOOGLE SCRIPT
      const submitRes = await fetch(SHEET_URL, {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json"
        }
      });

      const resultText = await submitRes.text();

      console.log("Google response:", resultText);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    // ===============================
    // ✅ NORMAL GET
    // ===============================
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server crash" })
    };
  }
};
