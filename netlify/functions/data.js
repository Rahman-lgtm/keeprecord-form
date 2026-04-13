exports.handler = async function () {

  const API_KEY = process.env.API_KEY;
  const SHEET_URL = process.env.SHEET_URL;

  try {
    const response = await fetch(`${SHEET_URL}?key=${API_KEY}`);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: "Error fetching data"
    };
  }
};
