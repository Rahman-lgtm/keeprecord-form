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
      const operator = row["Name of DEO"] || "Unknown";
      const type = (row["Application type (NEW or ADD RC)"] || "").toUpperCase();
      const members = Number(row["Total Number of included Members"] || 0);

      if (!result[operator]) {
        result[operator] = {
          operator: operator,
          rc: 0,
          new_units: 0,
          add_units: 0,
          total_units: 0
        };
      }

      // NEW
      if (type.includes("NEW")) {
        result[operator].rc += 1;
        result[operator].new_units += members;
      }

      // ADD
      if (type.includes("ADD")) {
        result[operator].add_units += members;
      }

      // TOTAL
      result[operator].total_units =
        result[operator].new_units + result[operator].add_units;
    });

    // sort highest to lowest
    const finalData = Object.values(result).sort(
      (a, b) => b.total_units - a.total_units
    );

    return res.status(200).json(finalData);

  } catch (err) {
    return res.status(500).json({ error: "Operator-wise failed" });
  }
}
