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
      const inspector = row["Inspector Name"] || "Unknown";
      const type = (row["Application type (NEW or ADD RC)"] || "").toUpperCase();
      const members = Number(row["Total Number of included Members"] || 0);

      if (!result[inspector]) {
        result[inspector] = {
          inspector: inspector,   // 👈 important
          rc: 0,
          new_units: 0,
          add_units: 0,
          total_units: 0
        };
      }

      // NEW
      if (type.includes("NEW")) {
        result[inspector].rc += 1;
        result[inspector].new_units += members;
      }

      // ADD
      if (type.includes("ADD")) {
        result[inspector].add_units += members;
      }

      // TOTAL
      result[inspector].total_units =
        result[inspector].new_units + result[inspector].add_units;
    });

    const finalData = Object.values(result).sort(
      (a, b) => b.total_units - a.total_units
    );

    return res.status(200).json(finalData);

  } catch (err) {
    return res.status(500).json({ error: "Inspector-wise failed" });
  }
}
