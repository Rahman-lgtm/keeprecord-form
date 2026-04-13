exports.handler = async function (event) {

  const API_KEY = process.env.API_KEY;
  const SHEET_URL = process.env.SHEET_URL;

  try {
    // 🔥 fetch data from Google Sheet
    const res = await fetch(`${SHEET_URL}?key=${API_KEY}`);
    const data = await res.json();

    // ✅ अगर duplicate check है
    if (event.queryStringParameters?.action === "checkDuplicate") {

      const appNum = event.queryStringParameters.appNum;

      const exists = data.some(row =>
        row["Application Number"] &&
        row["Application Number"].toString().trim() === appNum
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ exists })
      };
    }

    // ✅ normal GET (full data)
    if (event.httpMethod === "GET") {
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      };
    }

    // ❌ अगर POST logic नहीं है अभी
    if (event.httpMethod === "POST") {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }) // temp
      };
    }

    return {
      statusCode: 400,
      body: "Invalid request"
    };

  } catch (err) {
    console.error("Server Error:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }) // 🔥 FIXED JSON
    };
  }
};
