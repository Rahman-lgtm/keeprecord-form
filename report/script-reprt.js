// Yeh pehle ka helper function wahi rhega
function groupByAndSum(arr, groupKey, sumKey) {
  const groups = {};
  for (const row of arr) {
    const key = row[groupKey];
    if (!groups[key]) groups[key] = { count: 0, members: 0 };
    groups[key].count += 1;
    groups[key].members += parseInt(row[sumKey], 10) || 0;
  }
  return groups;
}

// 1. Sheet se CSV‑style JSON fetch karein
async function loadSheetData() {
  const sheetUrl = "PASTE_YOUR_PUBLISHED_CSV_URL_HERE"; // e.g. from Publish to Web

  const response = await fetch(sheetUrl);
  const text = await response.text();

  // CSV text ko parse karna (simple; assuming comma & no quotes mangled)
  const lines = text.split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = lines[i].split(",").map(cell => cell.trim());
    const row = {};
    headers.forEach((key, idx) => {
      row[key] = cells[idx] || "";
    });
    rows.push(row);
  }

  // DEBUG: browser console me ek row print karke check karein
  console.log("Sample row:", rows[0]);

  return rows;
}

// 2. aggregated data render karein
async function renderDashboard() {
  const data = await loadSheetData();

  const addData = data.filter(r => r["Application Type"] === "ADD");
  const newData = data.filter(r => r["Application Type"] === "NEW");

  const addAgg = addData.reduce((acc, r) => {
    acc.count += 1;
    acc.members += parseInt(r["Total Members"], 10) || 0;
    return acc;
  }, { count: 0, members: 0 });

  const newAgg = newData.reduce((acc, r) => {
    acc.count += 1;
    acc.members += parseInt(r["Total Members"], 10) || 0;
    return acc;
  }, { count: 0, members: 0 });

  document.getElementById("totalAddCount").textContent = addAgg.count;
  document.getElementById("totalAddMembers").textContent = addAgg.members;
  document.getElementById("totalNewCount").textContent = newAgg.count;
  document.getElementById("totalNewMembers").textContent = newAgg.members;

  const lacNew = groupByAndSum(newData, "LAC", "Total Members");
  const lacNewSorted = Object.entries(lacNew).sort((a, b) => b[1].count - a[1].count);
  const lacNewBody = document.querySelector("#lacNewTable tbody");
  lacNewSorted.forEach(([lac, stats]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${lac}</td><td>${stats.count}</td><td>${stats.members}</td>`;
    lacNewBody.appendChild(tr);
  });

  const lacAdd = groupByAndSum(addData, "LAC", "Total Members");
  const lacAddSorted = Object.entries(lacAdd).sort((a, b) => b[1].count - a[1].count);
  const lacAddBody = document.querySelector("#lacAddTable tbody");
  lacAddSorted.forEach(([lac, stats]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${lac}</td><td>${stats.count}</td><td>${stats.members}</td>`;
    lacAddBody.appendChild(tr);
  });

  const gpAdd = groupByAndSum(addData, "GP/Ward No", "Total Members");
  const gpAddSorted = Object.entries(gpAdd).sort((a, b) => b[1].count - a[1].count);
  const gpAddBody = document.querySelector("#gpAddTable tbody");
  gpAddSorted.forEach(([gp, stats]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${gp}</td><td>${stats.count}</td><td>${stats.members}</td>`;
    gpAddBody.appendChild(tr);
  });

  const gpNew = groupByAndSum(newData, "GP/Ward No", "Total Members");
  const gpNewSorted = Object.entries(gpNew).sort((a, b) => b[1].count - a[1].count);
  const gpNewBody = document.querySelector("#gpNewTable tbody");
  gpNewSorted.forEach(([gp, stats]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${gp}</td><td>${stats.count}</td><td>${stats.members}</td>`;
    gpNewBody.appendChild(tr);
  });
}

// Page load pe dashboard load karein
window.addEventListener("load", renderDashboard);
