const API_URL = "https://script.google.com/macros/s/AKfycbxTbYw912i1BbKm_BL8USYV5suO2d2hb7ahw95fbO4ftwzyoaImknOI23Uvzjv4aeXdBA/exec";

let fpsData = [];
let checkedAppNums = new Set();
let debounceTimer;

// ✅ Toast
function showToast(message, success = true) {
  const toast = document.getElementById("toast");
  const msg = toast.querySelector(".toast-message");

  msg.textContent = message;
  toast.className = "toast show " + (success ? "toast-success" : "toast-error");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ✅ Regex
function isValidAppNum(value) {
  return /^RC\d{18,19}$/.test(value);
}

// ✅ Loader
function toggleLoader(btn, loading = true) {
  btn.disabled = loading;
  btn.querySelector(".btn-text").style.display = loading ? "none" : "inline";
  btn.querySelector(".spinner").style.display = loading ? "inline" : "none";
}

// ✅ FPS Load
fetch(`${API_URL}?action=getFPS`)
  .then(res => res.json())
  .then(data => fpsData = data);

// ✅ Elements
const applicationNumber = document.getElementById("applicationNumber");
const statusEl = document.getElementById("appStatus"); // 🔥 new
const fpsCode = document.getElementById("fpsCode");
const fpsName = document.getElementById("fpsName");
const gpss = document.getElementById("gpss");
const areaOfficer = document.getElementById("areaOfficer");
const lacManual = document.getElementById("lacManual");

// ✅ FPS Autofill
fpsCode.addEventListener("change", function () {
  const code = this.value.trim();
  const found = fpsData.find(item => item.code === code);

  if (found) {
    fpsName.value = found.fpsName;
    gpss.value = found.gpss;
    areaOfficer.value = found.areaOfficer;
    lacManual.value = found.lac;
  } else {
    showToast("FPS Code not found", false);
    fpsName.value = gpss.value = areaOfficer.value = lacManual.value = "";
  }
});

// ✅ 🔥 LIVE DUPLICATE CHECK (UPDATED)
applicationNumber.addEventListener("input", function () {
  const val = this.value.trim();

  clearTimeout(debounceTimer);

  if (!isValidAppNum(val)) {
    if (statusEl) statusEl.textContent = "";
    this.style.borderColor = "";
    return;
  }

  if (statusEl) {
    statusEl.textContent = "Checking...";
    statusEl.className = "status-checking";
  }

  debounceTimer = setTimeout(() => {

    fetch(`${API_URL}?action=checkDuplicate&appNum=${val}`)
      .then(res => res.json())
      .then(data => {

        if (data.exists) {
          checkedAppNums.add(val);
          this.style.borderColor = "red";

          if (statusEl) {
            statusEl.textContent = "Duplicate";
            statusEl.className = "status-dup";
          }

        } else {
          this.style.borderColor = "green";

          if (statusEl) {
            statusEl.textContent = "Available";
            statusEl.className = "status-ok";
          }
        }

      })
      .catch(() => {
        if (statusEl) {
          statusEl.textContent = "Error";
          statusEl.className = "status-dup";
        }
      });

  }, 500); // ⚡ fast
});

// ✅ Submit
document.getElementById("dataForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const appNum = applicationNumber.value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const submitBtn = document.getElementById("submitBtn");

  if (!/^\d{10}$/.test(mobile)) {
    showToast("Invalid mobile number", false);
    return;
  }

  if (!isValidAppNum(appNum)) {
    showToast("Invalid Application Number", false);
    return;
  }

  if (checkedAppNums.has(appNum)) {
    showToast("Duplicate Application Number", false);
    return;
  }

  toggleLoader(submitBtn, true);

  const formData = new URLSearchParams(new FormData(this));
  formData.append("action", "submit");

  fetch(API_URL, {
    method: "POST",
    body: formData
  })
    .then(res => res.json()) // 🔥 FIXED
    .then(res => {

      if (res.status === "Success") {
        showToast("Saved Successfully", true);
        checkedAppNums.add(appNum);
        this.reset();

        if (statusEl) statusEl.textContent = "";
      } 
      else if (res.status === "Duplicate") {
        showToast("Already exists in system", false);
      } 
      else {
        showToast(res.message || "Failed", false);
      }

    })
    .catch(() => showToast("Error submitting", false))
    .finally(() => toggleLoader(submitBtn, false));
});
