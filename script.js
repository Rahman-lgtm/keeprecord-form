const app = document.getElementById("app");

app.innerHTML = `
<div class="page-wrapper">
<div class="top-title">
This form is only for maintaining the DEO work record<br>
It is not a SmartPDS portal data entry page
</div>

<div class="title">
Please complete the data entry process in the SmartPDS portal first<br>
<span class="subtitle">After generating the application number, enter it here and submit it</span>
</div>

<div class="container">

<div class="row">
<label>Application Type <span style="color:red;">*</span>:</label>
<select id="appType" style="width:350px;">
<option value="">Select</option>
<option value="NEW">NEW RC Application</option>
<option value="ADD">Existing RC Application</option>
</select>
</div>

<div class="row">
<label>Name of Inspector <span style="color:red;">*</span>:</label>
<select id="inspector" style="width:350px;">
<option value="">Select</option>
<option>Abhijit Bora</option>
<option>Durga Bodo</option>
<option>Mausam Zinnat</option>
<option>Mausumi Bora</option>
<option>Sanjiv Sarma</option>
<option>Santonu Bordoloi</option>
</select>
</div>
</div>
<div class="row flex">
<div class="field">
<label>Name of DEO <span style="color:red;">*</span>:</label>
<input type="text" id="deo" name="deo" placeholder="Name of Data Entry Operator" required style="width:280px;">
</div>
<div class="field">
<label>Date <span style="color:red;">*</span>:</label>
<input type="date" id="date" name="date" required style="width:150px;">
</div>
</div>
<div class="row">
<label>Mobile Number <span style="color:red;">*</span>:</label>
<input type="tel" id="mobile" name="mobile" maxlength="10" placeholder="10 digit mobile no" required style="width:200px;">
</div>
<div class="row flex">
<div class="field">
<label>Name of HOF<span style="color:red;">*</span>:</label>
<input type="text" id="hof" name="hof" placeholder="Head of the Family" required style="width:250px;">
</div>

<div class="row">
<label>GP/Ward No <span style="color:red;">*</span>:</label>
<select id="gp" style="width:250px;">
<option>Loading...</option>
</select>
</div>
<div class="row">
<label>Total Members <span style="color:red;">*</span>:</label>
<input type="number" id="totalMembers" name="totalMembers" min="1" required style="width:90px;">
</div>
<div class="yellow-bar">Fair Price Shop Detail</div>
<div class="note">
<b>N.B.:</b> Enter the FPS ID — the remaining fields will be auto-filled
</div>
<div class="row flex">
<div class="field">
<label>F.P.S ID <span style="color:red;">*</span>:</label>
<input type="text" id="fpsCode" name="fpsCode" maxlength="12" inputmode="numeric" pattern="\d{12}" oninput="this.value=this.value.replace(/[^0-9]/g,'')" placeholder="Enter 12 digit FPS ID">
</div>
<div class="field">
<label>FPS Name:</label>
<input type="text" id="fpsName" name="fpsName" readonly class="locked"required style="width:270px;">
</div>
</div>
<div class="row flex">
<div class="field">
<label>Name of GPSS:</label>
<input type="text" id="gpss" name="gpss" readonly class="locked" required style="width:350px;">
</div>
<div class="field">
<label>Area Officer:</label>
<input type="text" id="areaOfficer" name="areaOfficer" readonly class="locked" required style="width:190px;">
</div>
</div>
<div class="row">
<div class="field">
<label>LAC Name:</label>
<input type="text" id="lacManual" name="lacManual" readonly class="locked">
</div>
</div>
<div class="button-area">
<button id="submitBtn" type="submit">
<span class="btn-text">Submit</span>
<span class="spinner"></span>
 <input type="hidden" name="action" value="submit">
</button>
<button class="reset-btn" type="button">Reset</button> 
</div>
<div class="caution-bar">
<b>Important:</b><br>
    Ensure all information is accurate and complete, as any incorrect, duplicate, or missing data may result in rejection and deduction in the data entry bill.
</div>
</form>
</div>
</div>
</div>

`;
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
        appNumField.placeholder = type === "NEW" ? "RC + 18 digits" : "RC + 19 digits";

        status.textContent = "";
        status.className = "status";
        appNumField.focus();
    } else {
        mainForm.style.display = "none";
    }

    console.log("Selected appType:", type);
}


// ✅ SUBMIT (🔥 FULL FIXED)
async function handleFormSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById("submitBtn");
    const form = e.target;
    const status = document.getElementById("appStatus");
    const appTypeSelect = document.getElementById("appType");

    if (btn.classList.contains("loading")) return;

    if (!appTypeSelect || !appTypeSelect.value) {
        showToast("Please select Application Type!", false);
        return;
    }

    if (!validateRequiredFields(form)) {
        showToast("Please fill all required fields!", false);
        return;
    }

    if (status && status.classList.contains("status-dup")) {
        showToast("Application already submitted!", false);
        return;
    }

    toggleLoading(btn, true);

    try {
        const formData = new FormData(form);

        const params = new URLSearchParams();
        formData.forEach((value, key) => {
            params.append(key, value);
        });

        params.set("appType", appTypeSelect.value);   // ✅ force correct value
        params.set("action", "submit");               // ✅ only one action

        console.log("Form data:", params.toString());

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params.toString()
        });

        const text = await response.text();

        let result;
        try {
            result = JSON.parse(text);
        } catch {
            console.log("Raw response:", text);
            throw new Error("Invalid JSON");
        }

        if (result.status === "Success") {
            showToast("Form saved successfully!", true);
            resetForm();
        } else if (result.status === "Duplicate") {
            showToast("Already submitted!", false);
        } else {
            showToast(result.message || "Submit failed!", false);
            console.log("Server response:", result);
        }

    } catch (error) {
        console.error(error);
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
    const mainForm = document.getElementById("mainForm");
    const appType = document.getElementById("appType");
    const appNumField = document.getElementById("applicationNumber");
    const status = document.getElementById("appStatus");
    const today = new Date().toISOString().split("T")[0];

    if (!form) return;

    form.reset();

    currentAppType = "";
    clearTimeout(debounceTimer);

    if (mainForm) mainForm.style.display = "none";

    if (appType) {
        appType.value = "";
        appType.style.borderColor = "";
    }

    if (appNumField) {
        appNumField.value = "";
        appNumField.placeholder = "";
        appNumField.maxLength = 20;
        appNumField.style.borderColor = "";
    }

    if (status) {
        status.textContent = "";
        status.className = "status";
    }

    const dateField = document.getElementById("date");
    if (dateField) {
        dateField.value = today;
        dateField.min = today;
        dateField.max = today;
        dateField.style.borderColor = "";
    }

    form.querySelectorAll("input, select, textarea").forEach(field => {
        field.style.borderColor = "";
    });

    const fieldsToClear = [
        "fpsCode",
        "fpsName",
        "gpss",
        "areaOfficer",
        "lacManual",
        "hof",
        "mobile",
        "gp",
        "totalMembers",
        "inspector",
        "deo"
    ];

    fieldsToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = "";
            el.style.borderColor = "";
        }
    });
}

function openReport() {
    window.location.href = "report/report.html";
}

$(document).on("select2:open", function() {
    const searchField = document.querySelector(".select2-search__field");
    if (searchField) {
        searchField.placeholder = "Search here...";
    }
});


// ✅ TOAST
function showToast(message, isSuccess = true) {
    const toast = document.getElementById("toast");

    toast.querySelector(".toast-message").textContent = message;

    toast.className = `toast ${isSuccess ? 'toast-success' : 'toast-error'} show`;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}


// ✅ LOADING BUTTON (same as yours)
function toggleLoading(btn, show) {
    if (show) {
        btn.classList.add("loading");
        btn.disabled = true;
    } else {
        btn.classList.remove("loading");
        btn.disabled = false;
    }
}

async function loadGPDropdown() {
  const dropdown = document.getElementById("gp");

  // disable dropdown while loading
  dropdown.disabled = true;
  dropdown.innerHTML = '<option>Loading...</option>';

  try {
    const res = await fetch("/api/dropdown");

    if (!res.ok) throw new Error("API error");

    const data = await res.json();

    // clear & default option
    dropdown.innerHTML = '<option value="">Select GP/Ward No</option>';

    // ✅ use document fragment (faster for 200+ items)
    const fragment = document.createDocumentFragment();

    data.forEach(item => {
      if (!item) return; // skip empty

      let option = document.createElement("option");
      option.value = item.trim();
      option.textContent = item.trim();

      fragment.appendChild(option);
    });

    dropdown.appendChild(fragment);

    dropdown.disabled = false; // enable after load

  } catch (err) {
    console.error(err);
    dropdown.innerHTML = '<option>Error loading data</option>';
  }
}

// ✅ page fully load hone ke baad run (safe)
window.addEventListener("DOMContentLoaded", loadGPDropdown);
