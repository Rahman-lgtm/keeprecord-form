const API_URL = "https://script.google.com/macros/s/AKfycbw02vDrYaKFL3hA3XZBBf978uh5KrGuwKMbdSYAVPNbT5b6wFgM1EyV4RE_zHV0PRSQqQ/exec";

let fpsData = [];
let checkedAppNums = new Set();
let submitCounts = new Map();
let debounceTimer;
let currentAppType = '';

document.addEventListener("DOMContentLoaded", function() {
    initForm();
    initEventListeners();
    loadFPSData();
});

function initForm() {
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById("date");
    if (dateInput) {
        dateInput.value = today;
        dateInput.min = today;
        dateInput.max = today;
    }
}

function initEventListeners() {
    // App Type Selection
    const appTypeSelect = document.getElementById("appType");
    if (appTypeSelect) {
        appTypeSelect.addEventListener("change", function() {
            handleAppTypeChange(this.value);
        });
        appTypeSelect.focus();
    }

    // Form Submission
    const dataForm = document.getElementById("dataForm");
    if (dataForm) {
        dataForm.addEventListener("submit", handleFormSubmit);
    }

    // Reset Button
    const resetBtn = document.querySelector(".reset-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", resetForm);
    }
}

function handleAppTypeChange(type) {
    currentAppType = type;
    const mainForm = document.getElementById("mainForm");
    const appNumField = document.getElementById("applicationNumber");
    const appFormat = document.getElementById("appFormat");
    const status = document.getElementById("appStatus");

    if (type) {
        mainForm.style.display = "block";
        if (appNumField) {
            appNumField.value = "";
            appNumField.maxLength = type === "NEW" ? 20 : 21;
            appNumField.placeholder = type === "NEW" ? 
                "RC + 18 digits (20 total)" : "RC + 19 digits (21 total)";
        }
        if (appFormat) appFormat.textContent = type === "NEW" ? "(20 digits)" : "(21 digits)";
        if (status) status.textContent = "";
        checkedAppNums.clear();
        appNumField.focus();
    } else {
        mainForm.style.display = "none";
    }
}

function loadFPSData() {
    fetch(`${API_URL}?action=getFPS`)
        .then(r => r.json())
        .then(data => fpsData = data)
        .catch(() => console.log("FPS data unavailable"));
}

function handleFPSInput() {
    const fpsCodeField = document.getElementById("fpsCode");
    if (fpsCodeField) {
        fpsCodeField.addEventListener("input", function() {
            const code = this.value.trim();
            if (code.length !== 12) return;

            const fps = fpsData.find(item => item.code === code);
            if (fps) {
                document.getElementById("fpsName").value = fps.fpsName || '';
                document.getElementById("gpss").value = fps.gpss || '';
                document.getElementById("areaOfficer").value = fps.areaOfficer || '';
                document.getElementById("lacManual").value = fps.lac || '';
                showToast("FPS details loaded successfully!", true);
            }
        });
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById("submitBtn");
    const form = e.target;
    const appNumField = document.getElementById("applicationNumber");

    // Validate required fields
    if (!validateRequiredFields(form)) {
        showToast("Please fill all required fields!", false);
        return;
    }

    // Set app type
    document.getElementById("hiddenAppType").value = currentAppType;

    toggleLoading(btn, true);
    showToast("Submitting data...", true);

    try {
        const formData = new FormData(form);
        formData.append("action", "submit");

        const response = await fetch(API_URL, {
            method: "POST",
            body: formData
        });
        
        const result = await response.json();
        console.log("Server response:", result);

        if (result.status === "Data Saved successfully ✔" || result.success || result.status === "success") {
            const appNum = appNumField.value.trim();
            const count = currentAppType === "ADD" ? 
                (submitCounts.get(appNum) || 0) + 1 : 1;
            
            submitCounts.set(appNum, count);
            showToast(`Success! ${currentAppType === "ADD" ? `Member ${count}/3` : 'Data saved'}`, true);
            resetForm();
        } else {
            showToast(result.message || result.error || "Submission failed!", false);
        }
    } catch (error) {
        console.error("Submit error:", error);
        showToast("Network error. Please try again.", false);
    } finally {
        toggleLoading(btn, false);
    }
}

function validateRequiredFields(form) {
    const requiredFields = form.querySelectorAll("[required]");
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = "#e74c3c";
            field.style.boxShadow = "0 0 0 3px rgba(231, 76, 60, 0.2)";
            isValid = false;
        } else {
            field.style.borderColor = "";
            field.style.boxShadow = "";
        }
    });

    return isValid;
}

function initAppNumValidation() {
    const appNumField = document.getElementById("applicationNumber");
    if (!appNumField) return;

    appNumField.addEventListener("input", function() {
        const value = this.value.trim();
        const status = document.getElementById("appStatus");

        clearTimeout(debounceTimer);
        
        if (status) {
            status.textContent = "";
            status.className = "status";
        }
        this.style.borderColor = "";

        if (!value || !currentAppType) return;

        if (!value.startsWith("RC")) {
            if (status) {
                status.textContent = "Must start with RC";
                status.className = "status status-dup";
            }
            return;
        }

        const expectedLength = currentAppType === "NEW" ? 20 : 21;
        if (value.length !== expectedLength) {
            if (status) status.textContent = `${value.length}/${expectedLength}`;
            return;
        }

        const pattern = currentAppType === "NEW" ? /^RC\d{18}$/ : /^RC\d{19}$/;
        if (!pattern.test(value)) {
            if (status) {
                status.textContent = "Invalid format";
                status.className = "status status-dup";
            }
            return;
        }

        if (status) {
            status.textContent = "Checking...";
            status.className = "status status-checking";
        }

        debounceTimer = setTimeout(() => {
            checkDuplicate(value);
        }, 800);
    });
}

async function checkDuplicate(appNum) {
    try {
        const response = await fetch(`${API_URL}?action=checkDuplicate&appNum=${encodeURIComponent(appNum)}`);
        const data = await response.json();
        
        const status = document.getElementById("appStatus");
        const appNumField = document.getElementById("applicationNumber");
        
        if (data.exists || data.duplicate) {
            if (status) {
                status.textContent = "Already submitted";
                status.className = "status status-dup";
            }
            appNumField.style.borderColor = "#e74c3c";
        } else {
            if (status) {
                status.textContent = "Available ✓";
                status.className = "status status-ok";
            }
            appNumField.style.borderColor = "#27ae60";
        }
    } catch (error) {
        console.error("Duplicate check failed:", error);
    }
}

function resetForm() {
    const form = document.getElementById("dataForm");
    const mainForm = document.getElementById("mainForm");
    const appType = document.getElementById("appType");

    if (form) form.reset();
    if (mainForm) mainForm.style.display = "none";
    if (appType) appType.value = "";

    currentAppType = "";
    checkedAppNums.clear();

    document.querySelectorAll("input, select").forEach(el => {
        el.style.borderColor = "";
        el.style.boxShadow = "";
    });

    const dateInput = document.getElementById("date");
    const today = new Date().toISOString().split('T')[0];
    if (dateInput) dateInput.value = today;
}

function showToast(message, isSuccess = true) {
    const toast = document.getElementById("toast");
    const messageEl = toast.querySelector(".toast-message");
    
    messageEl.textContent = message;
    toast.className = `toast ${isSuccess ? 'toast-success' : 'toast-error'} show`;
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

function toggleLoading(btn, show) {
    if (show) {
        btn.classList.add("loading");
        btn.disabled = true;
    } else {
        btn.classList.remove("loading");
        btn.disabled = false;
    }
}

// Initialize everything
setTimeout(() => {
    initAppNumValidation();
    handleFPSInput();
}, 200);
