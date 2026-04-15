export default async function handler(req, res) {
  const REPORT_URL = process.env.REPORT_URL;
  const API_KEY = process.env.API_KEY;

  try {
    const response = await fetch(`${REPORT_URL}?key=${API_KEY}`, {
      cache: "no-store"
    });

    const data = await response.json();

    const result = {};

    data.forEach(row => {
      let date = row["Date of Entry"] || "Unknown";
      const type = (row["Application type (NEW or ADD RC)"] || "").toUpperCase();
      const members = Number(row["Total Number of included Members"] || 0);

      // 👉 date format clean (optional)
      date = date.toString().split("T")[0]; // ISO fix

      if (!result[date]) {
        result[date] = {
          date: date,
          rc: 0,
          new_units: 0,
          add_units: 0,
          total_units: 0
        };
      }

      // NEW
      if (type.includes("NEW")) {
        result[date].rc += 1;
        result[date].new_units += members;
      }

      // ADD
      if (type.includes("ADD")) {
        result[date].add_units += members;
      }

      // TOTAL
      result[date].total_units =
        result[date].new_units + result[date].add_units;
    });

    // 🔥 sort highet to lowest
    const finalData = Object.values(result).sort(
      (a, b) => b.total_units - a.total_units
    );

    return res.status(200).json(finalData);

  } catch (err) {
    return res.status(500).json({ error: "Date-wise failed" });
  }
}
