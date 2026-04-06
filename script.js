const API_URL = "https://script.google.com/macros/s/AKfycbw02vDrYaKFL3hA3XZBBf978uh5KrGuwKMbdSYAVPNbT5b6wFgM1EyV4RE_zHV0PRSQqQ/exec";

let fpsData = [];
let checkedAppNums = new Set();
let submitCounts = new Map();
let debounceTimer;
let currentAppType = '';

// ✅ Toast Function
function showToast(msg, ok = true) {
    const t = document.getElementById("toast");
    t.querySelector(".toast-message").textContent = msg;
    t.className = `toast show ${ok ? 'toast-success' : 'toast-error'}`;
    setTimeout(() => t.classList.remove("show"), 3000);
}

// ✅ Spinner Toggle
function toggle(btn, load) {
    if (load) {
        btn.classList.add("loading");
        btn.disabled = true;
    } else {
        btn.classList.remove("loading");
        btn.disabled = false;
    }
}

// ✅ App Type Change Handler
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
            appNumField.placeholder = "RCxxxxxxxxxxxxxxx (20 chars)";
            document.getElementById("appFormat").textContent = "(20 chars)";
        } else {
            appNumField.maxLength = 21;
            appNumField.placeholder = "RCxxxxxxxxxxxxxxxxx (21 chars)";
            document.getElementById("appFormat").textContent = "(21 chars)";
            document.getElementById("submitWarning").style.display = "block";
        }

        appNumField.focus();
    } else {
        mainForm.style.display = "none";
        document.getElementById("submitWarning").style.display = "none";
    }
});

// ✅ Real-time Application Number Validation
document.getElementById("applicationNumber").addEventListener("input", function () {
    const value = this.value.trim();
    const status = document.getElementById("appStatus");

    clearTimeout(debounceTimer);
    status.textContent = "";
    status.className = "";
    this.style.borderColor = "";

    if (!value) return;

    if (!value.startsWith("RC")) {
        status.textContent = "RC से शुरू होना चाहिए";
        status.className = "status-dup";
        this.style.borderColor = "red";
        return;
    }

    const expectedLength = currentAppType === "NEW" ? 20 : 21;
    if (value.length < expectedLength) {
        status.textContent = `${value.length}/${expectedLength}`;
        return;
    }

    const pattern = currentAppType === "NEW" ? /^RC\d{18}$/ : /^RC\d{19}$/;
    if (!pattern.test(value)) {
        status.textContent = "गलत format";
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
                    status.textContent = "이미 submit हुआ";
                    status.className = "status-dup";
                    this.style.borderColor = "red";
                    checkedAppNums.add(value);
                } else {
                    status.textContent = "Available ✅";
                    status.className = "status-ok";
                    this.style.borderColor = "#28a745";
                }
            })
            .catch(() => {
                status.textContent = "Network error!";
                status.className = "status-dup";
            });
    }, 500);
});

// ✅ FPS Auto-fill
fetch(`${API_URL}?action=getFPS`)
    .then(r => r.json())
    .then(d => fpsData = d)
    .catch(console.error);

document.getElementById("fpsCode").addEventListener("input", function() {
    const code = this.value.trim();
    if (code.length !== 12) return;

    const f = fpsData.find(x => x.code === code);
    if (f) {
        document.getElementById("fpsName").value = f.fpsName || '';
        document.getElementById("gpss").value = f.gpss || '';
        document.getElementById("areaOfficer").value = f.areaOfficer || '';
        document.getElementById("lacManual").value = f.lac || '';
        showToast("FPS details loaded ✅", true);
    }
});

// ✅ Today's Date Only
const today = new Date().toISOString().split('T')[0];
const dateInput = document.getElementById("date");
dateInput.value = today;
dateInput.min = today;
dateInput.max = today;

// 🔥 Form Submit with Validation
document.getElementById("dataForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const btn = document.getElementById("submitBtn");
    const appNum = document.getElementById("applicationNumber").value.trim();

    // ✅ All required fields check
    const required = this.querySelectorAll("[required]");
    let emptyFields = [];

    required.forEach(field => {
        if (!field.value.trim()) {
            emptyFields.push(field);
            field.style.borderColor = "#dc3545";
            field.style.boxShadow = "0 0 5px rgba(220,53,69,0.3)";
        } else {
            field.style.borderColor = "";
            field.style.boxShadow = "";
        }
    });

    if (emptyFields.length > 0) {
        showToast("सभी * वाले fields भरें ❌", false);
        emptyFields[0].focus();
        return;
    }

    // ✅ AppType hidden field set
    document.getElementById("hiddenAppType").value = currentAppType;

    toggle(btn, true);
    showToast("Submitting...", true);

    const formData = new FormData(this);
    formData.append("action", "submit");

    fetch(API_URL, { 
        method: "POST", 
        body: formData 
    })
    .then(r => r.json())
    .then(res => {
        if (res.status === "Success") {
            const count = currentAppType === "ADD" ? 
                (submitCounts.get(appNum) || 0) + 1 : 0;
            
            if (currentAppType === "ADD" && count >= 3) {
                showToast(`ADD limit reached (3/3) ❌`, false);
            } else {
                submitCounts.set(appNum, count);
                showToast(`Saved successfully! ${currentAppType === "ADD" ? `(${count}/3)` : ''} ✅`, true);
                resetForm();
            }
        } else {
            showToast(res.message || "Duplicate application!", false);
        }
    })
    .catch(err => {
        console.error(err);
        showToast("Network/Server error ❌", false);
    })
    .finally(() => toggle(btn, false));
});

// ✅ Reset Form
function resetForm() {
    document.getElementById("dataForm").reset();
    document.getElementById("mainForm").style.display = "none";
    document.getElementById("appStatus").textContent = "";
    document.getElementById("appType").value = "";
    document.getElementById("submitWarning").style.display = "none";
    
    currentAppType = "";
    checkedAppNums.clear();
    
    // Reset styles
    document.querySelectorAll("input, select").forEach(el => {
        el.style.borderColor = "";
        el.style.boxShadow = "";
    });
    
    dateInput.value = today;
    document.getElementById("applicationNumber").focus();
}

document.querySelector(".reset-btn").addEventListener("click", resetForm);

// ✅ Page Load - Inspector focus
window.addEventListener("load", () => {
    document.getElementById("appType").focus();
});
