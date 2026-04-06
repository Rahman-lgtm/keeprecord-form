const API_URL = "https://script.google.com/macros/s/AKfycbw02vDrYaKFL3hA3XZBBf978uh5KrGuwKMbdSYAVPNbT5b6wFgM1EyV4RE_zHV0PRSQqQ/exec";

let fpsData = [];
let checkedAppNums = new Set();
let submitCounts = new Map();
let debounceTimer;
let currentAppType = '';

// ✅ Toast
function showToast(msg, ok = true) {
    const t = document.getElementById("toast");
    t.querySelector(".toast-message").textContent = msg;
    t.className = "toast show " + (ok ? "toast-success" : "toast-error");
    setTimeout(() => t.classList.remove("show"), 2500);
}

// ✅ Spinner Toggle (FINAL)
function toggle(btn, load) {
    if (load) {
        btn.classList.add("loading");
        btn.disabled = true;
    } else {
        btn.classList.remove("loading");
        btn.disabled = false;
    }
}

// ✅ App Type Change
document.getElementById("appType").addEventListener("change", function () {
    currentAppType = this.value;

    const mainForm = document.getElementById("mainForm");
    const appNumField = document.getElementById("applicationNumber");
    const status = document.getElementById("appStatus");

    if (this.value) {
        mainForm.style.display = "block";
        appNumField.value = "";
        status.textContent = "";
        checkedAppNums.clear();

        if (this.value === "NEW") {
            appNumField.maxLength = 20;
            appNumField.placeholder = "RC + 18 digits";
        } else {
            appNumField.maxLength = 21;
            appNumField.placeholder = "RC + 19 digits";
        }

        appNumField.focus();
    } else {
        mainForm.style.display = "none";
    }
});

// ✅ LIVE CHECK (PRO LEVEL)
document.getElementById("applicationNumber").addEventListener("input", function () {
    const value = this.value.trim();
    const status = document.getElementById("appStatus");

    clearTimeout(debounceTimer);
    status.textContent = "";
    status.className = "";
    this.style.borderColor = "";

    if (!value) return;

    status.textContent = "Typing...";
    status.className = "status-checking";

    if (!value.startsWith("RC")) {
        status.textContent = "Must start with RC";
        status.className = "status-dup";
        this.style.borderColor = "red";
        return;
    }

    const expectedLength = currentAppType === "NEW" ? 20 : 21;
    if (value.length < expectedLength) {
        status.textContent = `Incomplete (${value.length}/${expectedLength})`;
        return;
    }

    if (value.length > expectedLength) {
        status.textContent = "Too long!";
        status.className = "status-dup";
        this.style.borderColor = "red";
        return;
    }

    const pattern = currentAppType === "NEW" ? /^RC\d{18}$/ : /^RC\d{19}$/;
    if (!pattern.test(value)) {
        status.textContent = "Invalid format";
        status.className = "status-dup";
        this.style.borderColor = "red";
        return;
    }

    status.textContent = "Checking...";
    status.className = "status-checking";

    debounceTimer = setTimeout(() => {
        fetch(`${API_URL}?action=checkDuplicate&appNum=${encodeURIComponent(value)}`)
            .then(res => res.json())
            .then(data => {
                if (data.exists) {
                    status.textContent = "already been submitted";
                    status.className = "status-dup";
                    this.style.borderColor = "red";
                    checkedAppNums.add(value);
                } else {
                    status.textContent = "Available ✅";
                    status.className = "status-ok";
                    this.style.borderColor = "green";
                }
            })
            .catch(() => {
                status.textContent = "Server error!";
                status.className = "status-dup";
            });
    }, 300);
});

// ✅ FPS Load & Autofill
fetch(API_URL + "?action=getFPS")
    .then(r => r.json())
    .then(d => fpsData = d);

document.getElementById("fpsCode").oninput = function() {
    let f = fpsData.find(x => x.code == this.value);
    if (f) {
        document.getElementById("fpsName").value = f.fpsName;
        document.getElementById("gpss").value = f.gpss;
        document.getElementById("areaOfficer").value = f.areaOfficer;
        document.getElementById("lacManual").value = f.lac;
    }
}

// ✅ Date Auto
document.getElementById("date").valueAsDate = new Date();

// 🔥 UPDATED SUBMIT - Required fields + AppType fix
document.getElementById("dataForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const btn = document.getElementById("submitBtn");
    const appNum = document.getElementById("applicationNumber").value.trim();

    // ✅ Required fields validation
    const requiredFields = this.querySelectorAll("[required]");
    let hasError = false;

    requiredFields.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = "red";
            input.style.boxShadow = "0 0 5px rgba(255,0,0,0.5)";
            hasError = true;
        } else {
            input.style.borderColor = "";
            input.style.boxShadow = "";
        }
    });

    if (hasError) {
        showToast("सभी required fields भरें ❌", false);
        return;
    }

    // 🔥 FIX: Application Type hidden field में भरो
    document.getElementById("hiddenAppType").value = currentAppType; // "NEW" या "ADD"

    toggle(btn, true);

    const fd = new FormData(this);
    fd.append("action", "submit");

    fetch(API_URL, { method: "POST", body: fd })
        .then(r => r.json())
        .then(res => {
            if (res.status === "Success") {
                if (currentAppType === "ADD") {
                    const count = (submitCounts.get(appNum) || 0) + 1;
                    submitCounts.set(appNum, count);
                    showToast(`Saved (${count}/3) ✅`, true);
                } else {
                    showToast("Submitted Successfully ✅", true);
                }
                resetForm();
            } else {
                showToast("this application number has already been submitted", false);
            }
        })
        .catch(() => showToast("Server Error ❌", false))
        .finally(() => toggle(btn, false));
});

// ✅ Reset
function resetForm() {
    document.getElementById("dataForm").reset();
    document.getElementById("mainForm").style.display = "none";
    document.getElementById("appStatus").textContent = "";
    document.getElementById("appType").value = "";
    currentAppType = "";
    checkedAppNums.clear();
    document.getElementById("date").valueAsDate = new Date();
    
    // सभी fields को normal border दो
    document.querySelectorAll("[required]").forEach(input => {
        input.style.borderColor = "";
        input.style.boxShadow = "";
    });
}

document.querySelector(".reset-btn").addEventListener("click", resetForm);
    
