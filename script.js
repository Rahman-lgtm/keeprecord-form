const API_URL = "/.netlify/functions/data";   // submit + duplicate
const FPS_API = "/.netlify/functions/fps";    // auto-fill

let fpsData = [];
let checkedAppNums = new Set();
let submitCounts = new Map();
let debounceTimer;
let currentAppType = '';

document.addEventListener("DOMContentLoaded", function () {
    initForm();
    initEventListeners();
    loadFPSData();
    initFPSAutoFill();
    initAppNumValidation();   // 🔥 duplicate check ON
});


// ✅ LOAD FPS DATA
function loadFPSData() {
    fetch(FPS_API)
        .then(res => res.json())
        .then(data => {
            fpsData = data;
            console.log("FPS data loaded:", fpsData.length);
        })
        .catch(err => {
            console.error("FPS load error:", err);
        });
}


// ✅ AUTO FILL FPS
function initFPSAutoFill() {
    const fpsCodeField = document.getElementById("fpsCode");
    if (!fpsCodeField) return;

    fpsCodeField.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 12);
        handleFPSInput.call(this);
    });
}

function handleFPSInput() {
    const code = this.value.trim();
    if (code.length !== 12) return;

    const fps = fpsData.find(item =>
        item.code && item.code.toString().trim() === code
    );

    console.log("MATCH:", fps);

    if (fps) {
        document.getElementById("fpsName").value = fps.fpsName || '';
        document.getElementById("gpss").value = fps.gpss || '';
        document.getElementById("areaOfficer").value = fps.areaOfficer || '';
        document.getElementById("lacManual").value = fps.lac || '';

        showToast("FPS details loaded successfully!", true);
    }
}


// ✅ APPLICATION NUMBER VALIDATION + DUPLICATE CHECK
function initAppNumValidation() {
    const appNumField = document.getElementById("applicationNumber");
    if (!appNumField) return;

    appNumField.addEventListener("input", function () {

        const value = this.value.trim();
        const status = document.getElementById("appStatus");

        clearTimeout(debounceTimer);

        status.textContent = "";
        status.className = "status";

        if (!value || !currentAppType) return;

        // RC check
        if (!value.startsWith("RC")) {
            status.textContent = "Must start with RC";
            status.className = "status status-dup";
            return;
        }

        // length check
        const expectedLength = currentAppType === "NEW" ? 20 : 21;

        if (value.length !== expectedLength) {
            status.textContent = `${value.length}/${expectedLength}`;
            return;
        }

        // format check
        const pattern = currentAppType === "NEW"
            ? /^RC\d{18}$/
            : /^RC\d{19}$/;

        if (!pattern.test(value)) {
            status.textContent = "Invalid format";
            status.className = "status status-dup";
            return;
        }

        // checking...
        status.textContent = "Checking...";
        status.className = "status status-checking";

        debounceTimer = setTimeout(() => {
            checkDuplicate(value);
        }, 300);
    });
}


// ✅ CHECK DUPLICATE
async function checkDuplicate(appNum) {
    try {
        const response = await fetch(
            `${API_URL}?action=checkDuplicate&appNum=${encodeURIComponent(appNum)}`
        );

        const data = await response.json();

        const status = document.getElementById("appStatus");
        const appNumField = document.getElementById("applicationNumber");

        if (data.exists || data.duplicate) {
            status.textContent = "Already submitted";
            status.className = "status status-dup";
            appNumField.style.borderColor = "#e74c3c";
        } else {
            status.textContent = "Available";
            status.className = "status status-ok";
            appNumField.style.borderColor = "#27ae60";
        }

    } catch (error) {
        console.error("Duplicate check failed:", error);
    }
}


// ✅ FORM INIT
function initForm() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById("date");

    if (dateInput) {
        dateInput.value = today;
        dateInput.min = today;
        dateInput.max = today;
    }
}


// ✅ EVENT LISTENERS
function initEventListeners() {
    const appTypeSelect = document.getElementById("appType");

    if (appTypeSelect) {
        appTypeSelect.addEventListener("change", function () {
            handleAppTypeChange(this.value);
        });
        appTypeSelect.focus();
    }

    const dataForm = document.getElementById("dataForm");
    if (dataForm) {
        dataForm.addEventListener("submit", handleFormSubmit);
    }

    const resetBtn = document.querySelector(".reset-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", resetForm);
    }
}


// ✅ APP TYPE CHANGE
function handleAppTypeChange(type) {
    currentAppType = type;

    const mainForm = document.getElementById("mainForm");
    const appNumField = document.getElementById("applicationNumber");
    const status = document.getElementById("appStatus");

    if (type) {
        mainForm.style.display = "block";

        appNumField.value = "";
        appNumField.maxLength = type === "NEW" ? 20 : 21;
        appNumField.placeholder =
            type === "NEW" ? "RC + 18 digits" : "RC + 19 digits";

        status.textContent = "";
        checkedAppNums.clear();
        appNumField.focus();
    } else {
        mainForm.style.display = "none";
    }
}


// ✅ SUBMIT
async function handleFormSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById("submitBtn");
    const form = e.target;

    if (!validateRequiredFields(form)) {
        showToast("Please fill all required fields!", false);
        return;
    }

    toggleLoading(btn, true);

    try {
        const formData = new FormData(form);
        formData.append("action", "submit");

        const response = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showToast("Form saved successfully!", true);
            resetForm();
        } else {
            showToast(result.message || "Error!", false);
        }

    } catch (error) {
        console.error(error);
        showToast("Network error", false);
    } finally {
        toggleLoading(btn, false);
    }
}


// ✅ VALIDATION
function validateRequiredFields(form) {
    let isValid = true;

    form.querySelectorAll("[required]").forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = "red";
            isValid = false;
        } else {
            field.style.borderColor = "";
        }
    });

    return isValid;
}


// ✅ RESET
function resetForm() {
    const form = document.getElementById("dataForm");
    form.reset();

    document.getElementById("mainForm").style.display = "none";

    const today = new Date().toISOString().split('T')[0];
    document.getElementById("date").value = today;
}


// ✅ TOAST
function showToast(message, isSuccess = true) {
    const toast = document.getElementById("toast");
    toast.querySelector(".toast-message").textContent = message;

    toast.className = `toast ${isSuccess ? 'toast-success' : 'toast-error'} show`;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}


// ✅ LOADING
function toggleLoading(btn, show) {
    btn.disabled = show;
}
