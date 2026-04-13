const API_URL = "/.netlify/functions/data";
let fpsData = [];
let checkedAppNums = new Set();
let submitCounts = new Map();
let debounceTimer;
let currentAppType = '';
document.addEventListener("DOMContentLoaded", function () {
initForm();
initEventListeners();
loadFPSData();
initFPSAutoFill();});
function initFPSAutoFill() {const fpsCodeField = document.getElementById("fpsCode");
if (!fpsCodeField) return;
fpsCodeField.removeEventListener("input", handleFPSInput);    
fpsCodeField.addEventListener("input", function () {
this.value = this.value.replace(/\D/g, "").slice(0, 12);        
handleFPSInput.call(this);});}
function initForm() {const today = new Date().toISOString().split('T')[0];
const dateInput = document.getElementById("date");
if (dateInput) {
dateInput.value = today;
dateInput.min = today;
dateInput.max = today;}}
function initEventListeners() {
const appTypeSelect = document.getElementById("appType");
if (appTypeSelect) {appTypeSelect.addEventListener("change", function () {handleAppTypeChange(this.value);});appTypeSelect.focus();}
const dataForm = document.getElementById("dataForm");
if (dataForm) {dataForm.addEventListener("submit", handleFormSubmit);}
const resetBtn = document.querySelector(".reset-btn");
if (resetBtn) {resetBtn.addEventListener("click", resetForm);}}
function loadFPSData() {fetch(`${API_URL}?action=getFPS`)
.then(r => r.json())
.then(data => {
fpsData = data;
console.log("FPS data loaded:", fpsData.length, "records");})
.catch(() => console.log("FPS data unavailable"));}
function handleFPSInput() {
const code = this.value.trim();
if (code.length !== 12) return;
const fps = fpsData.find(item => item.code === code);
if (fps) {
document.getElementById("fpsName").value = fps.fpsName || '';
document.getElementById("gpss").value = fps.gpss || '';
document.getElementById("areaOfficer").value = fps.areaOfficer || '';
document.getElementById("lacManual").value = fps.lac || '';
showToast("FPS details loaded successfully!", true);} else {    }}
function handleAppTypeChange(type) {    currentAppType = type;
const mainForm = document.getElementById("mainForm");
const appNumField = document.getElementById("applicationNumber");
const appFormat = document.getElementById("appFormat");
const status = document.getElementById("appStatus");
if (type) {mainForm.style.display = "block";
appNumField.value = "";
appNumField.maxLength = type === "NEW" ? 20 : 21;
appNumField.placeholder =type === "NEW" ? "RC + 18 digits" : "RC + 19 digits";
appFormat.textContent = type === "NEW" ? "" : "";
status.textContent = "";
checkedAppNums.clear();
appNumField.focus();    } else {mainForm.style.display = "none";    }}
async function handleFormSubmit(e) { e.preventDefault();
const btn = document.getElementById("submitBtn");
const form = e.target;
const appNumField = document.getElementById("applicationNumber");
if (!validateRequiredFields(form)) {showToast("Please fill all required fields!", false); return; }
document.getElementById("hiddenAppType").value = currentAppType;
toggleLoading(btn, true);
try {const formData = new FormData(form);formData.append("action", "submit");
const response = await fetch(API_URL, {
method: "POST",
body: formData});
let result;
try {result = await response.json();} catch {const text = await response.text(); console.log("Raw response:", text); result = { status: text };}
console.log("Server response:", result);
const isSuccess =result.success === true ||
(result.status && result.status.toLowerCase().includes("success")) ||
(result.message && result.message.toLowerCase().includes("success"));
if (isSuccess) {const appNum = appNumField.value.trim();
const count =currentAppType === "ADD"? (submitCounts.get(appNum) || 0) + 1: 1;
submitCounts.set(appNum, count);
showToast(currentAppType === "ADD"? `Form saved successfully!`: "Form saved successfully!", true);
resetForm();
} else {showToast(result.message || result.error || "Check your input once!", false);}
} catch (error) {console.error("Submit error:", error);showToast("Network error. Please try again.", false); } finally {toggleLoading(btn, false);    }}
function validateRequiredFields(form) {
const requiredFields = form.querySelectorAll("[required]");
let isValid = true;
requiredFields.forEach(field => {
if (!field.value.trim()) {
field.style.borderColor = "#e74c3c";
field.style.boxShadow = "0 0 0 3px rgba(231, 76, 60, 0.2)";
isValid = false;
} else {field.style.borderColor = "";field.style.boxShadow = ""; }});
return isValid;}
function initAppNumValidation() {
const appNumField = document.getElementById("applicationNumber");
if (!appNumField) return;
appNumField.addEventListener("input", function () {
const value = this.value.trim();
const status = document.getElementById("appStatus");
clearTimeout(debounceTimer);
status.textContent = "";
status.className = "status";
this.style.borderColor = "";
if (!value || !currentAppType) return;
if (!value.startsWith("RC")) {
status.textContent = "Must start with RC";
status.className = "status status-dup";
return; }
const expectedLength = currentAppType === "NEW" ? 20 : 21;
if (value.length !== expectedLength) {
status.textContent = `${value.length}/${expectedLength}`;
return;}
const pattern =
currentAppType === "NEW"? /^RC\d{18}$/: /^RC\d{19}$/;
if (!pattern.test(value)) {
status.textContent = "Invalid format";
status.className = "status status-dup";
return;}
status.textContent = "Checking...";
status.className = "status status-checking";
debounceTimer = setTimeout(() => {
checkDuplicate(value);}, 300); });}
async function checkDuplicate(appNum) {
try { const response = await fetch(
`${API_URL}?action=checkDuplicate&appNum=${encodeURIComponent(appNum)}`);
const data = await response.json();
const status = document.getElementById("appStatus");
const appNumField = document.getElementById("applicationNumber");
if (data.exists || data.duplicate) {
status.textContent = "already submitted";
status.className = "status status-dup";
appNumField.style.borderColor = "#e74c3c";
} else {status.textContent = "Available";
status.className = "status status-ok";
appNumField.style.borderColor = "#27ae60";}
} catch (error) {
console.error("Duplicate check failed:", error);}}
function resetForm() {
const form = document.getElementById("dataForm");
const mainForm = document.getElementById("mainForm");
const appType = document.getElementById("appType");
form.reset();mainForm.style.display = "none";appType.value = "";
currentAppType = "";
checkedAppNums.clear();
document.querySelectorAll("input, select").forEach(el => {
el.style.borderColor = "";
el.style.boxShadow = ""; });
const today = new Date().toISOString().split('T')[0];
document.getElementById("date").value = today;
$('#gp').val(null).trigger('change');}
function showToast(message, isSuccess = true) {
const toast = document.getElementById("toast");
const messageEl = toast.querySelector(".toast-message");
messageEl.textContent = message;toast.className = `toast ${isSuccess ? 'toast-success' : 'toast-error'} show`;
setTimeout(() => {toast.classList.remove("show");}, isSuccess ? 5000 : 7000);}
function toggleLoading(btn, show) {if (show) {btn.classList.add("loading");btn.disabled = true;} else {
btn.classList.remove("loading");
btn.disabled = false;}}
setTimeout(() => {
initAppNumValidation();
}, 200);
