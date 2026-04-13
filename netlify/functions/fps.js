exports.handler = async function () {

  const API_KEY = process.env.API_KEY;
  const FPS_URL = process.env.FPS_URL;

  console.log("API_KEY:", API_KEY);
  console.log("FPS_URL:", FPS_URL);

  try {
    const res = await fetch(`${FPS_URL}?key=${API_KEY}`);
    const text = await res.text(); // 👈 JSON नहीं, text

    console.log("RAW RESPONSE:", text);

    return {
      statusCode: 200,
      body: text   // 👈 direct return
    };

  } catch (err) {
    console.error("ERROR:", err);

    return {
      statusCode: 500,
      body: "Error fetching FPS data"
    };
  }
};
