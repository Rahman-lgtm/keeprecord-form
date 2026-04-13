exports.handler = async function () {
const API_KEY = process.env.API_KEY;
const REPORT_URL = process.env.REPORT_URL; 
try {const res = await fetch(`${REPORT_URL}?key=${API_KEY}`);
const data = await res.json();
return {statusCode: 200, body: JSON.stringify(data)};} catch (err) {return {statusCode: 500, body: "Error fetching report data" };  }};
