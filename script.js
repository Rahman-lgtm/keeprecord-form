const API_URL = "https://script.google.com/macros/s/AKfycbycMuof0Ip2ZMZeZQjn1bPk8_B_HeM6EvUpNGNF7u21UH69Tk9v0lZLnT9tH_qSMgINlA/exec";

let fpsData = [];
let checkedAppNums = new Set(); // already submitted app numbers

// आज की तारीख set करो
function setToday() {
  const dt = new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  const today = `${y}-${m}-${d}`;
  dateInput.value = today;
  dateInput.min = today;
  dateInput.max = today;
}

// Toast show करने का function
function showToast(message, success = true) {
  const toast = document.getElementById("toast");
  const msg = toast.querySelector(".toast-message");
  msg.textContent = message;
  toast.classList.remove("error", "success");
  toast.classList.add(success ? "success" : "error");
  toast.style.display = "block";
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => { toast.style.display = "none"; }, 300);
  }, 3500);
}

// RC नंबर की लंबाई और फॉर्मेट check
function isValidAppNum(value) {
  const trimmed = value.trim();
  return /^RC\d{18,19}$/.test(trimmed) && trimmed.length === 20;
}

// Application number की दोहराव check API call
function checkDuplicateAppNum(appNum, callback) {
  fetch(`${API_URL}?action=checkDuplicate&appNum=${encodeURIComponent(appNum)}`)
    .then(res => res.json())
    .then(data => {
      if (data.exists) {
        callback(true);
      } else {
        callback(false);
      }
    })
    .catch(() => {
      callback(false); // error न हो तो भी submit allow कर दो
    });
}

// लोडर दिखाओ / छुपाओ
function toggleLoader(btn, loading = true) {
  btn.disabled = loading;
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner");
  text.style.display = loading ? "none" : "inline";
  spinner.style.display = loading ? "inline" : "none";
}

// FPS data load
fetch(`${API_URL}?action=getFPS`)
  .then((res) => res.json())
  .then((data) => {
    fpsData = data;
  })
  .catch(() => {
    alert("Unable to load FPS Data");
  });

// Elements
const inspector = document.getElementById("inspector");
const applicationNumber = document.getElementById("applicationNumber");
const deo = document.getElementById("deo");
const dateInput = document.getElementById("date");
const hof = document.getElementById("hof");
const appType = document.getElementById("appType");
const gp = document.getElementById("gp");
const totalMembers = document.getElementById("totalMembers");
const fpsCode = document.getElementById("fpsCode");
const fpsName = document.getElementById("fpsName");
const lacManual = document.getElementById("lacManual");
const gpss = document.getElementById("gpss");
const areaOfficer = document.getElementById("areaOfficer");
const mobile = document.getElementById("mobile");
const submitBtn = document.getElementById("submitBtn");

// FPS Code change → auto fill fields
fpsCode.addEventListener("change", function () {
  const code = this.value.trim();
  const found = fpsData.find((item) => item.code === code);

  if (found) {
    fpsName.value = found.fpsName;
    gpss.value = found.gpss;
    areaOfficer.value = found.areaOfficer;
    lacManual.value = found.lac;
    fpsCode.style.border = "1px solid black";
  } else {
    fpsName.value = "";
    gpss.value = "";
    areaOfficer.value = "";
    lacManual.value = "";
    fpsCode.style.border = "2px solid red";
    alert("FPS Code not found");
  }
});

// Application number input (right side indicator + validation)
applicationNumber.addEventListener("input", function () {
  const value = this.value.trim();
  const isValid = isValidAppNum(value);
  const isDuplicate = checkedAppNums.has(value);

  const borderColor = isValid && !isDuplicate ? "#198754" : "#dc3545";
  const boxShadow = isValid && !isDuplicate
    ? "0 0 6px rgba(25,135,84,0.3)"
    : "0 0 6px rgba(220,53,69,0.3)";

  this.style.borderColor = borderColor;
  this.style.boxShadow = boxShadow;

  if (isValid && value.length === 20) {
    // Check if already submitted once
    if (!checkedAppNums.has(value)) {
      checkDuplicateAppNum(value, (exists) => {
        if (exists) {
          checkedAppNums.add(value);
          this.style.borderColor = "#dc3545";
          this.style.boxShadow = "0 0 6px rgba(220,53,69,0.3)";
        }
      });
    }
  }
});

// Form submit
document.getElementById("dataForm").addEventListener("submit", function (e) {
  e.preventDefault();

  if (!/^\d{10}$/.test(mobile.value)) {
    showToast("Enter valid mobile number", false);
    return;
  }

  const appNum = applicationNumber.value.trim();

  if (!isValidAppNum(appNum)) {
    showToast("Application number must be 20‑digit RC", false);
    return;
  }

  if (checkedAppNums.has(appNum)) {
    showToast("Application number already submitted", false);
    return;
  }

  const fps = fpsCode.value.trim();
  const foundFps = fpsData.find((item) => item.code === fps);

  if (!foundFps) {
    showToast("Invalid FPS Code", false);
    return;
  }

  // Start loader
  toggleLoader(submitBtn, true);

  const formData = new URLSearchParams({
    action: "submit",
    inspector: inspector.value,
    applicationNumber: appNum,
    deo: deo.value,
    date: dateInput.value,
    hof: hof.value,
    mobile: mobile.value,
    appType: appType.value,
    gp: gp.value,
    totalMembers: totalMembers.value,
    fpsCode: fps,
    fpsName: fpsName.value,
    lacManual: lacManual.value,
    gpss: gpss.value,
    areaOfficer: areaOfficer.value,
  });

  fetch(API_URL, { method: "POST", body: formData })
    .then((res) => res.text())
    .then((response) => {
      if (response === "Success") {
        checkedAppNums.add(appNum); // दोबारा submit न हो
        showToast("Data Saved Successfully", true);
        document.getElementById("dataForm").reset();
        setToday(); // date फिर से आज की कर दो
      } else {
        showToast("Submission Failed: " + response, false);
      }
    })
    .catch((err) => {
      showToast("Submission Failed", false);
      console.error(err);
    })
    .finally(() => {
      toggleLoader(submitBtn, false); // loader बंद
    });
});

// Script चलते ही आज की तारीख set करो
setToday();
