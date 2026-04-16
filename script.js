const app=document.getElementById("app");
app.innerHTML=`
<div class="page-wrapper">
<div class="top-title">This form is only for maintaining the DEO work record<br>It is not a SmartPDS portal data entry page</div>
<div class="title">Please complete the data entry process in the SmartPDS portal first<br><span class="subtitle">After generating the application number, enter it here and submit it</span></div>
<div class="container">
<div class="row">
<label>Application Type <span style="color:red;">*</span>:</label>
<select id="appType" name="appType" required style="width:350px;">
<option value="">Select</option>
<option value="NEW">NEW RC Application</option>
<option value="ADD">Existing RC Application</option>
</select>
</div>
<div id="mainForm" class="main-form">
<form id="dataForm" novalidate>
<input type="hidden" name="appType" id="hiddenAppType">
<div class="row">
<label>Application Number <span style="color:red;">*</span> <span id="appFormat"></span>:</label>
<div style="position:relative;display:inline-block;width:350px;">
<input type="text" id="applicationNumber" name="applicationNumber" placeholder="RCxxxxxxxxxxxxxxx" required style="width:100%;">
<span id="appStatus"></span>
</div>
</div>
<div class="row">
<label>Name of Inspector <span style="color:red;">*</span>:</label>
<select id="inspector" name="inspector" required style="width:350px;">
<option value="">Select</option>
<option>Abhijit Bora</option>
<option>Durga Bodo</option>
<option>Mausam Zinnat</option>
<option>Mausumi Bora</option>
<option>Sanjiv Sarma</option>
<option>Santonu Bordoloi</option>
</select>
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
<div class="field">
<label>GP/Ward No <span style="color:red;">*</span>:</label>
<select id="gp" name="gp" style="width:250px;" required>
<option value="">Loading...</option>
</select>
</div>
</div>
<div class="row">
<label>Total Members <span style="color:red;">*</span>:</label>
<input type="number" id="totalMembers" name="totalMembers" min="1" required style="width:90px;">
</div>
<div class="yellow-bar">Fair Price Shop Detail</div>
<div class="note"><b>N.B.:</b> Enter the FPS ID — the remaining fields will be auto-filled</div>
<div class="row flex">
<div class="field">
<label>F.P.S ID <span style="color:red;">*</span>:</label>
<input type="text" id="fpsCode" name="fpsCode" maxlength="12" inputmode="numeric" pattern="\\d{12}" oninput="this.value=this.value.replace(/[^0-9]/g,'')" placeholder="Enter 12 digit FPS ID">
</div>
<div class="field">
<label>FPS Name:</label>
<input type="text" id="fpsName" name="fpsName" readonly class="locked" required style="width:270px;">
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
<span class="btn-text">Save</span>
<span class="spinner"></span>
<input type="hidden" name="action" value="submit">
</button>
<button class="reset-btn" type="button">Clear</button>
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
const API_URL="/api/data";
const FPS_API="/api/fps";
let fpsData=[],debounceTimer,currentAppType='';document.addEventListener("DOMContentLoaded",function(){initForm();initEventListeners();loadFPSData();initFPSAutoFill();initAppNumValidation();});function loadFPSData(){fetch(FPS_API).then(res=>res.json()).then(data=>{fpsData=data;console.log("FPS data loaded:",fpsData.length);}).catch(err=>console.error("FPS load error:",err));}function initFPSAutoFill(){const fpsCodeField=document.getElementById("fpsCode");if(!fpsCodeField)return;fpsCodeField.addEventListener("input",function(){this.value=this.value.replace(/\D/g,"").slice(0,12);handleFPSInput.call(this);});}function handleFPSInput(){const code=this.value.trim();if(code.length!==12)return;
const fps=fpsData.find(item=>item.code&&item.code.toString().trim()===code);if(fps){document.getElementById("fpsName").value=fps.fpsName||'';document.getElementById("gpss").value=fps.gpss||'';document.getElementById("areaOfficer").value=fps.areaOfficer||'';document.getElementById("lacManual").value=fps.lac||'';showToast("FPS details loaded successfully!",true);}}function initAppNumValidation(){const appNumField=document.getElementById("applicationNumber");if(!appNumField)return;
appNumField.addEventListener("input",function(){const value=this.value.trim(),status=document.getElementById("appStatus");clearTimeout(debounceTimer);status.textContent="";status.className="status";if(!value||!currentAppType)return;if(!value.startsWith("RC")){status.textContent="Must start with RC";status.className="status status-dup";return;}const expectedLength=currentAppType==="NEW"?20:21;if(value.length!==expectedLength){status.textContent=`${value.length}/${expectedLength}`;
return;}const pattern=currentAppType==="NEW"?/^RC\d{18}$/:/^RC\d{19}$/;if(!pattern.test(value)){status.textContent="Invalid format";status.className="status status-dup";return;}status.textContent="Checking...";status.className="status status-checking";debounceTimer=setTimeout(()=>checkDuplicate(value),400);});}async function checkDuplicate(appNum){try{const res=await fetch(`${API_URL}?action=checkDuplicate&appNum=${encodeURIComponent(appNum)}`);const data=await res.json();
const status=document.getElementById("appStatus"),field=document.getElementById("applicationNumber");if(data.exists){status.textContent="Already submitted";status.className="status status-dup";field.style.borderColor="#e74c3c";}else{status.textContent="Available";status.className="status status-ok";field.style.borderColor="#27ae60";}}catch(e){console.error(e);}}function initForm(){const today=new Date().toISOString().split('T')[0],d=document.getElementById("date");if(d){d.value=today;d.min=today;d.max=today;}}
function initEventListeners(){const appTypeSelect=document.getElementById("appType");if(appTypeSelect)appTypeSelect.addEventListener("change",function(){handleAppTypeChange(this.value);});const form=document.getElementById("dataForm");if(form)form.addEventListener("submit",handleFormSubmit);const resetBtn=document.querySelector(".reset-btn");if(resetBtn)resetBtn.addEventListener("click",resetForm);}
function handleAppTypeChange(type){currentAppType=type;const main=document.getElementById("mainForm"),field=document.getElementById("applicationNumber"),status=document.getElementById("appStatus");if(type){main.style.display="block";field.value="";field.maxLength=type==="NEW"?20:21;field.placeholder=type==="NEW"?"RC + 18 digits":"RC + 19 digits";status.textContent="";status.className="status";field.focus();
}else main.style.display="none";}async function handleFormSubmit(e){e.preventDefault();const btn=document.getElementById("submitBtn"),form=e.target,status=document.getElementById("appStatus"),appTypeSelect=document.getElementById("appType");if(btn.classList.contains("loading"))return;if(!appTypeSelect||!appTypeSelect.value){showToast("Please select Application Type!",false);return;}if(!validateRequiredFields(form)){showToast("Please fill all required fields!",false);return;}
if(status&&status.classList.contains("status-dup")){showToast("Application already submitted!",false);return;}toggleLoading(btn,true);try{const fd=new FormData(form),params=new URLSearchParams();fd.forEach((v,k)=>params.append(k,v));params.set("appType",appTypeSelect.value);params.set("action","submit");const res=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:params.toString()});const text=await res.text();let result;try{result=JSON.parse(text);}catch{throw new Error("Invalid JSON");}if(result.status==="Success"){showToast("Form saved successfully!",true);resetForm();}else if(result.status==="Duplicate")showToast("Already submitted!",false);else showToast(result.message||"Submit failed!",false);
}catch(e){console.error(e);showToast("Server error!",false);}finally{toggleLoading(btn,false);}}function validateRequiredFields(form){let ok=true;form.querySelectorAll("[required]").forEach(f=>{if(!f.value.trim()){f.style.borderColor="#e74c3c";ok=false;}else f.style.borderColor="";});return ok;}function resetForm(){
const form=document.getElementById("dataForm"),main=document.getElementById("mainForm"),appType=document.getElementById("appType"),field=document.getElementById("applicationNumber"),status=document.getElementById("appStatus"),today=new Date().toISOString().split("T")[0];if(!form)return;form.reset();currentAppType="";clearTimeout(debounceTimer);if(main)main.style.display="none";
if(appType){appType.value="";appType.style.borderColor="";}if(field){field.value="";field.placeholder="";field.maxLength=20;field.style.borderColor="";}if(status){status.textContent="";status.className="status";}const d=document.getElementById("date");if(d){d.value=today;d.min=today;d.max=today;d.style.borderColor="";}form.querySelectorAll("input,select,textarea").forEach(f=>f.style.borderColor="");["fpsCode","fpsName","gpss","areaOfficer","lacManual","hof","mobile","gp","totalMembers","inspector","deo"].forEach(id=>{
const el=document.getElementById(id);if(el){el.value="";el.style.borderColor="";}});}function openReport(){window.location.href="report/report.html";}$(document).on("select2:open",function(){const s=document.querySelector(".select2-search__field");if(s)s.placeholder="Search here...";});function showToast(msg,ok=true){const t=document.getElementById("toast");t.querySelector(".toast-message").textContent=msg;t.className=`toast ${ok?'toast-success':'toast-error'} show`;setTimeout(()=>t.classList.remove("show"),4000);}function toggleLoading(btn,show){if(show){btn.classList.add("loading");btn.disabled=true;}
else{btn.classList.remove("loading");btn.disabled=false;}}async function loadGPDropdown(){const d=document.getElementById("gp");d.disabled=true;d.innerHTML='<option>Loading...</option>';try{const res=await fetch("/api/dropdown");if(!res.ok)throw new Error("API error");const data=await res.json();d.innerHTML='<option value="">Select GP/Ward No</option>';
const frag=document.createDocumentFragment();data.forEach(item=>{if(!item)return;let o=document.createElement("option");o.value=item.trim();o.textContent=item.trim();frag.appendChild(o);});d.appendChild(frag);d.disabled=false;}catch(err){console.error(err);d.innerHTML='<option>Error loading data</option>';}}window.addEventListener("DOMContentLoaded",loadGPDropdown);
