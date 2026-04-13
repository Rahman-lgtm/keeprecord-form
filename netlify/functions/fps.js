exports.handler = async function () {

  const FPS_URL = process.env.FPS_URL;

  try {
    // 🔥 action जोड़ दिया
    const res = await fetch(`${FPS_URL}?action=getFPS`);
    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: "Error fetching FPS data"
    };
  }
};
