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
      const members = Number(row["Total Number of included Members"] || 0);

      // 🔥 FINAL CONDITION
      if (!(type.includes("NEW") && members < 4)) return;

      if (!result[fpsId]) {
        result[fpsId] = {
          fps_id: fpsId,
          fps_name: fpsName,
          rc: 0,
          new_units: 0
        };
      }

      // ✅ 1 application = 1 RC
      result[fpsId].rc += 1;

      // ✅ members sum
      result[fpsId].new_units += members;
    });

    // 🔥 sort highest to lowest
    const finalData = Object.values(result).sort(
      (a, b) => b.new_units - a.new_units
    );

    return res.status(200).json(finalData);

  } catch (err) {
    return res.status(500).json({ error: "FPS filter failed" });
  }
}
