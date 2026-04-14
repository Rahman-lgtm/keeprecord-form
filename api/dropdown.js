export default async function handler(req, res) {
  try {
    const url = process.env.DROPDOWN_API_URL;

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dropdown data" });
  }
}
