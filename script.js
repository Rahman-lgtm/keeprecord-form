const API_URL = "/api/data";
const FPS_API = "/api/fps";

let fpsData = [];
let debounceTimer;
let currentAppType = '';

document.addEventListener("DOMContentLoaded", function () {
    initForm();
    initEventListeners();
    loadFPSData();
    initFPSAutoFill();
    initAppNumValidation();
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


// ✅ FPS AUTO FILL
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

    if (fps) {
        document.getElementById("fpsName").value = fps.fpsName || '';
        document.getElementById("gpss").value = fps.gpss || '';
        document.getElementById("areaOfficer").value = fps.areaOfficer || '';
        document.getElementById("lacManual").value = fps.lac || '';

        showToast("FPS details loaded successfully!", true);
    }
}


// ✅ APPLICATION NUMBER VALIDATION
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
        }, 400);
    });
}


// ✅ DUPLICATE CHECK
async function checkDuplicate(appNum) {
    try {
        const response = await fetch(
            `${API_URL}?action=checkDuplicate&appNum=${encodeURIComponent(appNum)}`
        );

        const data = await response.json();

        const status = document.getElementById("appStatus");
        const appNumField = document.getElementById("applicationNumber");

        if (data.exists) {
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


// ✅ EVENTS
function initEventListeners() {
    const appTypeSelect = document.getElementById("appType");

    if (appTypeSelect) {
        appTypeSelect.addEventListener("change", function () {
            handleAppTypeChange(this.value);
        });
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
        appNumField.placeholder =
            type === "NEW" ? "RC + 18 digits" : "RC + 19 digits";

        status.textContent = "";
        appNumField.focus();
    } else {
        mainForm.style.display = "none";
    }
}


// ✅ SUBMIT (🔥 FULL FIXED)
async function handleFormSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById("submitBtn");
    const form = e.target;
    const status = document.getElementById("appStatus");

    // ❌ already loading
    if (btn.classList.contains("loading")) return;

    // ❌ validation fail
    if (!validateRequiredFields(form)) {
        showToast("Please fill all required fields!", false);
        return;
    }

    // ❌ duplicate block
    if (status && status.classList.contains("status-dup")) {
        showToast("Application already submitted!", false);
        return;
    }

    toggleLoading(btn, true);

    try {
        // 🔥 FORM DATA
        const formData = new FormData(form);
        formData.append("action", "submit");
        formData.append("appType", currentAppType);
        // 🔥 CONVERT (IMPORTANT FIX)
        const params = new URLSearchParams();
        formData.forEach((value, key) => {
            params.append(key, value);
        });

        // 🔥 API CALL
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });

        const text = await response.text();

        let result;
        try {
            result = JSON.parse(text);
        } catch {
            console.log("Raw:", text);
            throw new Error("Invalid JSON");
        }

        console.log("Server response:", result);

        if (result.status === "Success") {
            showToast("Form saved successfully!", true);
            resetForm();
        }
        else if (result.status === "Duplicate") {
            showToast("Already submitted!", false);
        }
        else {
            showToast(result.message || "Submit failed!", false);
        }

    } catch (error) {
        console.error("Submit error:", error);
        showToast("Server error!", false);
    } finally {
        toggleLoading(btn, false);
    }
}


// ✅ VALIDATION
function validateRequiredFields(form) {
    let isValid = true;

    form.querySelectorAll("[required]").forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = "#e74c3c";
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


// ✅ LOADING (🔥 FIXED)
function toggleLoading(btn, show) {
    if (show) {
        btn.classList.add("loading");
        btn.disabled = true;
    } else {
        btn.classList.remove("loading");
        btn.disabled = false;
    }
}
