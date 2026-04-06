const API_URL = "https://script.google.com/macros/s/AKfycbw02vDrYaKFL3hA3XZBBf978uh5KrGuwKMbdSYAVPNbT5b6wFgM1EyV4RE_zHV0PRSQqQ/exec";

let fpsData = [];
let checkedAppNums = new Set();
let submitCounts = new Map();
let debounceTimer;
let currentAppType = '';

// ✅ Toast Function
function showToast(msg, ok = true) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.querySelector(".toast-message").textContent = msg;
    t.className = `toast show ${ok ? 'toast-success' : 'toast-error'}`;
    setTimeout(() => {
        if (t) t.classList.remove("show");
    }, 3000);
}

// ✅ Spinner Toggle
function toggle(btn, load) {
    if (!btn) return;
    if (load) {
        btn.classList.add("loading");
        btn.disabled = true;
    } else {
        btn.classList.remove("loading");
        btn.disabled = false;
    }
}

// ✅ App Type Change Handler
document.addEventListener("DOMContentLoaded", function() {
    const appTypeSelect = document.getElementById("appType");
    if (!appTypeSelect) return;

    appTypeSelect.addEventListener("change", function () {
        currentAppType = this.value;
        const mainForm = document.getElementById("mainForm");
        const appNumField = document.getElementById("applicationNumber");
        const status = document.getElementById("appStatus");
        const appFormat = document.getElementById("appFormat");
        const submitWarning = document.getElementById("submitWarning");

        if (!mainForm || !appNumField) return;

        if (this.value) {
            mainForm.style.display = "block";
            appNumField.value = "";
            if (status) status.textContent = "";
            checkedAppNums.clear();

            if (this.value === "NEW") {
                appNumField.maxLength = 20;
                appNumField.placeholder = "RCxxxxxxxxxxxxxxx (20 chars)";
                if (appFormat) appFormat.textContent = "";
                if (submitWarning) submitWarning.style.display = "none";
            } else {
                appNumField.maxLength = 21;
                appNumField.placeholder = "RCxxxxxxxxxxxxxxxxx (21 chars)";
                if (appFormat) appFormat.textContent = "";
                if (submitWarning) submitWarning.style.display = "block";
            }

            appNumField.focus();
        } else {
            mainForm.style.display = "none";
            if (submitWarning) submitWarning.style.display = "none";
        }
    });
});

// ✅ Real-time Application Number Validation
function initAppNumValidation() {
    const appNumField = document.getElementById("applicationNumber");
    if (!appNumField) return;

    appNumField.addEventListener("input", function () {
        const value = this.value.trim();
        const status = document.getElementById("appStatus");

        clearTimeout(debounceTimer);
        if (status) {
            status.textContent = "";
            status.className = "";
        }
        this.style.borderColor = "";

        if (!value) return;

        if (!value.startsWith("RC")) {
            if (status) {
                status.textContent = "It should start with RC";
                status.className = "status-dup";
            }
            this.style.borderColor = "red";
            return;
        }

        const expectedLength = currentAppType === "NEW" ? 20 : 21;
        if (value.length < expectedLength) {
            if (status) status.textContent = `${value.length}/${expectedLength}`;
            return;
        }

        const pattern = currentAppType === "NEW" ? /^RC\d{18}$/ : /^RC\d{19}$/;
        if (!pattern.test(value)) {
            if (status) {
                status.textContent = "Wrong format";
                status.className = "status-dup";
            }
            this.style.borderColor = "red";
            return;
        }

        if (status) {
            status.textContent = "Checking...";
            status.className = "status-checking";
        }

        debounceTimer = setTimeout(() => {
            fetch(`${API_URL}?action=checkDuplicate&appNum=${encodeURIComponent(value)}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.exists) {
                        if (status) {
                            status.textContent = "already submitted";
                            status.className = "status-dup";
                        }
                        this.style.borderColor = "red";
                        checkedAppNums.add(value);
                    } else {
                        if (status) {
                            status.textContent = "Available";
                            status.className = "status-ok";
                        }
                        this.style.borderColor = "#28a745";
                    }
                })
                .catch(() => {
                    if (status) {
                        status.textContent = "Network error!";
                        status.className = "status-dup";
                    }
                });
        }, 500);
    });
}

// ✅ FPS Auto-fill
fetch(`${API_URL}?action=getFPS`)
    .then(r => r.json())
    .then(d => fpsData = d)
    .catch(console.error);

const fpsCodeField = document.getElementById("fpsCode");
if (fpsCodeField) {
    fpsCodeField.addEventListener("input", function() {
        const code = this.value.trim();
        if (code.length !== 12) return;

        const f = fpsData.find(x => x.code === code);
        if (f) {
            const fpsName = document.getElementById("fpsName");
            const gpss = document.getElementById("gpss");
            const areaOfficer = document.getElementById("areaOfficer");
            const lacManual = document.getElementById("lacManual");
            
            if (fpsName) fpsName.value = f.fpsName || '';
            if (gpss) gpss.value = f.gpss || '';
            if (areaOfficer) areaOfficer.value = f.areaOfficer || '';
            if (lacManual) lacManual.value = f.lac || '';
            showToast("FPS details are now displayed", true);
        }
    });
}

// ✅ Today's Date
const today = new Date().toISOString().split('T')[0];
const dateInput = document.getElementById("date");
if (dateInput) {
    dateInput.value = today;
    dateInput.min = today;
    dateInput.max = today;
}

// 🔥 Form Submit
const dataForm = document.getElementById("dataForm");
if (dataForm) {
    dataForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const btn = document.getElementById("submitBtn");
        const appNumField = document.getElementById("applicationNumber");
        const appNum = appNumField ? appNumField.value.trim() : '';

        // Required validation
        const requiredFields = this.querySelectorAll("[required]");
        let hasError = false;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                hasError = true;
                field.style.borderColor = "#dc3545";
                field.style.boxShadow = "0 0 5px rgba(220,53,69,0.3)";
            } else {
                field.style.borderColor = "";
                field.style.boxShadow = "";
            }
        });

        if (hasError) {
            showToast("All fields marked with * are mandatory", false);
            return;
        }

        const hiddenAppType = document.getElementById("hiddenAppType");
        if (hiddenAppType) hiddenAppType.value = currentAppType;

        toggle(btn, true);
        showToast("Submitting...", true);

        const formData = new FormData(this);
        formData.append("action", "submit");

        fetch(API_URL, { method: "POST", body: formData })
            .then(r => r.json())
            .then(res => {
                if (res.status === "Data Saved successfully ✔") {
                    const count = currentAppType === "ADD" ? 
                        (submitCounts.get(appNum) || 0) + 1 : 0;
                    
                    submitCounts.set(appNum, count);
                    showToast(`Data Saved successfully ✔! ${currentAppType === "ADD" ? `(${count}/3)` : ''} `, true);
                    resetForm();
                } else {
                    showToast(res.message || "Duplicate!", false);
                }
            })
            .catch(() => showToast("Server error plz try after sometime", false))
            .finally(() => toggle(btn, false));
    });
}

// ✅ Reset
function resetForm() {
    const form = document.getElementById("dataForm");
    const mainForm = document.getElementById("mainForm");
    const appStatus = document.getElementById("appStatus");
    const appType = document.getElementById("appType");
    const submitWarning = document.getElementById("submitWarning");
    
    if (form) form.reset();
    if (mainForm) mainForm.style.display = "none";
    if (appStatus) appStatus.textContent = "";
    if (appType) appType.value = "";
    if (submitWarning) submitWarning.style.display = "none";
    
    currentAppType = "";
    checkedAppNums.clear();
    
    document.querySelectorAll("input, select").forEach(el => {
        el.style.borderColor = "";
        el.style.boxShadow = "";
    });
    
    if (dateInput) dateInput.value = today;
}

const resetBtn = document.querySelector(".reset-btn");
if (resetBtn) {
    resetBtn.addEventListener("click", resetForm);
}

// ✅ Initialize
initAppNumValidation();
document.getElementById("appType")?.focus();
