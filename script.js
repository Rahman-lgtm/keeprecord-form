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
    loadFPSData();          // ✅ fixed
    initFPSAutoFill();
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


// ✅ AUTO FILL
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

    // 🔥 IMPORTANT: column name check karo
    const fps = fpsData.find(item => item["FPS ID"] == code);

    console.log("MATCH:", fps);

    if (fps) {
        document.getElementById("fpsName").value = fps["FPS Name"] || '';
        document.getElementById("gpss").value = fps["Name of GPSS"] || '';
        document.getElementById("areaOfficer").value = fps["Area Officer"] || '';
        document.getElementById("lacManual").value = fps["LAC Name"] || '';

        showToast("FPS details loaded successfully!", true);
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


// ✅ APP TYPE
function handleAppTypeChange(type) {
    currentAppType = type;

    const mainForm = document.getElementById("mainForm");
    const appNumField = document.getElementById("applicationNumber");
    const status = document.getElementById("appStatus");

    if (type) {
        mainForm.style.display = "block";

        appNumField.value = "";
        appNumField.maxLength = type === "NEW" ? 20 : 21;
        appNumField.placeholder = type === "NEW"
            ? "RC + 18 digits"
            : "RC + 19 digits";

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


// ✅ DUPLICATE CHECK
async function checkDuplicate(appNum) {
    try {
        const response = await fetch(
            `${API_URL}?action=checkDuplicate&appNum=${encodeURIComponent(appNum)}`
        );

        const data = await response.json();
        const status = document.getElementById("appStatus");

        if (data.exists) {
            status.textContent = "Already submitted";
            status.className = "status status-dup";
        } else {
            status.textContent = "Available";
            status.className = "status status-ok";
        }

    } catch (error) {
        console.error(error);
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
