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

// 🔥 MAIN INITIALIZATION - SINGLE DOMContentLoaded
document.addEventListener("DOMContentLoaded", function() {
    // Today's Date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById("date");
    if (dateInput) {
        dateInput.value = today;
        dateInput.min = today;
        dateInput.max = today;
    }

    // App Type Change Handler
    const appTypeSelect = document.getElementById("appType");
    if (appTypeSelect) {
        appTypeSelect.addEventListener("change", function() {
            currentAppType = this.value;
            const mainForm = document.getElementById("mainForm");
            const appNumField = document.getElementById("applicationNumber");
            const status = document.getElementById("appStatus");
            const appFormat = document.getElementById("appFormat");

            if (!mainForm || !appNumField) return;

            if (this.value) {
                mainForm.style.display = "block";
                appNumField.value = "";
                if (status) status.textContent = "";
                checkedAppNums.clear();

                if (this.value === "NEW") {
                    appNumField.maxLength = 20;
                    appNumField.placeholder = "RC + 18 digits (20 chars total)";
                    if (appFormat) appFormat.textContent = "";
                } else {
                    appNumField.maxLength = 21;
                    appNumField.placeholder = "RC + 19 digits (21 chars total)";
                    if (appFormat) appFormat.textContent = "";
                }

                appNumField.focus();
            } else {
                mainForm.style.display = "none";
            }
        });
        appTypeSelect.focus();
    }

    // FPS Data Load
    fetch(`${API_URL}?action=getFPS`)
        .then(r => r.json())
        .then(d => fpsData = d)
        .catch(() => console.log("FPS data load failed"));

    // FPS Auto-fill
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
                showToast("FPS details loaded successfully", true);
            }
        });
    }

    // Form Submit - FIXED SUCCESS CHECK
    const dataForm = document.getElementById("dataForm");
    if (dataForm) {
        dataForm.addEventListener("submit", function(e) {
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
                showToast("Please fill all required fields marked with *", false);
                return;
            }

            const hiddenAppType = document.getElementById("hiddenAppType");
            if (hiddenAppType) hiddenAppType.value = currentAppType;

            toggle(btn, true);
            showToast("Submitting data...", true);

            const formData = new FormData(this);
            formData.append("action", "submit");

            fetch(API_URL, { method: "POST", body: formData })
                .then(r => r.json())
                .then(res => {
                    console.log("Server response:", res); // DEBUG
                    // FIXED: Check multiple success conditions
                    if (res.status === "Data Saved successfully ✔" || 
                        res.success || 
                        res.message === "Data saved successfully" ||
                        res.status === "success") {
                        
                        const count = currentAppType === "ADD" ? 
                            (submitCounts.get(appNum) || 0) + 1 : 0;
                        
                        submitCounts.set(appNum, count);
                        showToast(`Data saved successfully! ${currentAppType === "ADD" ? `Member ${count}/3` : ''}`, true);
                        resetForm(); // ✅ AUTO RESET FIXED
                    } else {
                        showToast(res.message || res.error || "Submission failed!", false);
                    }
                })
                .catch(err => {
                    console.error("Submit error:", err);
                    showToast("Server error. Please try again later.", false);
                })
                .finally(() => toggle(btn, false));
        });
    }

    // Reset Button
    const resetBtn = document.querySelector(".reset-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", resetForm);
    }
});

// ✅ Real-time Application Number Validation - FIXED REGEX & TIMING
let appNumValidationInitialized = false;
function initAppNumValidation() {
    if (appNumValidationInitialized) return;
    appNumValidationInitialized = true;

    const appNumField = document.getElementById("applicationNumber");
    if (!appNumField) return;

    appNumField.addEventListener("input", function() {
        const value = this.value.trim();
        const status = document.getElementById("appStatus");

        clearTimeout(debounceTimer);
        if (status) {
            status.textContent = "";
            status.className = "";
        }
        this.style.borderColor = "";

        if (!value || !currentAppType) return;

        if (!value.startsWith("RC")) {
            if (status) {
                status.textContent = "Must start with RC";
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

        // ✅ FIXED REGEX - Single backslash
        const pattern = currentAppType === "NEW" ? /^RC\d{18}$/ : /^RC\d{19}$/;
        if (!pattern.test(value)) {
            if (status) {
                status.textContent = "Invalid format";
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
            // Skip if already checked today
            if (checkedAppNums.has(value)) {
                if (status) {
                    status.textContent = "Already checked - duplicate";
                    status.className = "status-dup";
                }
                return;
            }

            fetch(`${API_URL}?action=checkDuplicate&appNum=${encodeURIComponent(value)}`)
                .then(res => res.json())
                .then(data => {
                    console.log("Duplicate check:", data);
                    if (data && (data.exists || data.duplicate)) {
                        if (status) {
                            status.textContent = "Already submitted";
                            status.className = "status-dup";
                        }
                        this.style.borderColor = "red";
                        checkedAppNums.add(value);
                    } else {
                        if (status) {
                            status.textContent = "Available ✓";
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
        }, 800); // Increased debounce
    });
}

// ✅ Reset Form - FIXED
function resetForm() {
    const form = document.getElementById("dataForm");
    const mainForm = document.getElementById("mainForm");
    const appStatus = document.getElementById("appStatus");
    const appType = document.getElementById("appType");

    if (form) form.reset();
    if (mainForm) mainForm.style.display = "none";
    if (appStatus) appStatus.textContent = "";
    if (appType) appType.value = "";

    currentAppType = "";
    checkedAppNums.clear();

    // Clear styles
    document.querySelectorAll("input, select").forEach(el => {
        el.style.borderColor = "";
        el.style.boxShadow = "";
    });

    // Reset date
    const dateInput = document.getElementById("date");
    const today = new Date().toISOString().split('T')[0];
    if (dateInput) dateInput.value = today;
}

// 🔥 Initialize validation after short delay
setTimeout(initAppNumValidation, 100);
