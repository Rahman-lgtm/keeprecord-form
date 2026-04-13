exports.handler = async function () {

  const API_KEY = process.env.API_KEY;
  const FPS_URL = process.env.FPS_URL;

  try {
    const res = await fetch(`${FPS_URL}?key=${API_KEY}`);
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
