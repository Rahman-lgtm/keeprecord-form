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
      const fpsId = row["F.P.S Code 13050050......."] || "Unknown";
      const fpsName = row["FPS Name"] || "Unknown";

      const type = (row["Application type (NEW or ADD RC)"] || "").toUpperCase();
      const members = Number(
  String(row["Total Number of included Members"] || 0).replace(/[^0-9]/g, "")
);

      // only NEW
      if (!type.includes("NEW")) return;

      if (!result[fpsId]) {
        result[fpsId] = {
          fps_id: fpsId,
          fps_name: fpsName,

          below_rc: 0,
          below_units: 0,

          above_rc: 0,
          above_units: 0
        };
      }

      // 🔥 split logic
      if (members < 4) {
        result[fpsId].below_rc += 1;
        result[fpsId].below_units += members;
      } else {
        result[fpsId].above_rc += 1;
        result[fpsId].above_units += members;
      }
    });

    // sort by total units
    const finalData = Object.values(result).sort(
      (a, b) =>
        (Number(b.below_units) + Number(b.above_units)) -
(Number(a.below_units) + Number(a.above_units));

    return res.status(200).json(finalData);

  } catch (err) {
    return res.status(500).json({ error: "FPS split failed" });
  }
}
