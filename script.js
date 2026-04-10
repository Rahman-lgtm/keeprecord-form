const API_URL="https://script.google.com/macros/s/AKfycbw02vDrYaKFL3hA3XZBBf978uh5KrGuwKMbdSYAVPNbT5b6wFgM1EyV4RE_zHV0PRSQqQ/exec";
let fpsData=[],checkedAppNums=new Set(),submitCounts=new Map(),debounceTimer,currentAppType="";
document.addEventListener("DOMContentLoaded",function(){
initForm();
initEventListeners();
loadFPSData();
initFPSAutoFill();
initAppNumValidation();
});
function initFPSAutoFill(){
const el=document.getElementById("fpsCode");
if(!el)return;
el.addEventListener("input",function(){
this.value=this.value.replace(/\D/g,"").slice(0,12);
handleFPSInput.call(this);
});
}
function initForm(){
const d=new Date().toISOString().split("T")[0];
const el=document.getElementById("date");
if(el){el.value=d;el.min=d;el.max=d;}
}
function initEventListeners(){
const app=document.getElementById("appType");
if(app){
app.addEventListener("change",function(){handleAppTypeChange(this.value);});
app.focus();
}
const form=document.getElementById("dataForm");
if(form)form.addEventListener("submit",handleFormSubmit);
const reset=document.querySelector(".reset-btn");
if(reset)reset.addEventListener("click",resetForm);
}
function loadFPSData(){
fetch(`${API_URL}?action=getFPS`)
.then(r=>r.json())
.then(d=>fpsData=d)
.catch(()=>console.log("FPS data unavailable"));
}
function handleFPSInput(){
const code=this.value.trim();
if(code.length!==12)return;
const fps=fpsData.find(x=>x.code===code);
if(fps){
document.getElementById("fpsName").value=fps.fpsName||"";
document.getElementById("gpss").value=fps.gpss||"";
document.getElementById("areaOfficer").value=fps.areaOfficer||"";
document.getElementById("lacManual").value=fps.lac||"";
showToast("FPS details loaded successfully!",true);
}
}
function handleAppTypeChange(type){
currentAppType=type;
const form=document.getElementById("mainForm");
const app=document.getElementById("applicationNumber");
const status=document.getElementById("appStatus");
if(type){
form.style.display="block";
app.value="";
app.maxLength=type==="NEW"?20:21;
app.placeholder=type==="NEW"?"RC + 18 digits":"RC + 19 digits";
status.textContent="";
checkedAppNums.clear();
app.focus();
}else form.style.display="none";
}
async function handleFormSubmit(e){
e.preventDefault();
const btn=document.getElementById("submitBtn");
const form=e.target;
const app=document.getElementById("applicationNumber");
if(!validateRequiredFields(form)){
showToast("Please fill all required fields!",false);
return;
}
document.getElementById("hiddenAppType").value=currentAppType;
toggleLoading(btn,true);
showToast("Submitting data...",true);
try{
const fd=new FormData(form);
fd.append("action","submit");
const res=await fetch(API_URL,{method:"POST",body:fd});
let data;
try{data=await res.json();}
catch{data={status:await res.text()};}
const ok=data.success===true||(data.status&&data.status.toLowerCase().includes("success"))||(data.message&&data.message.toLowerCase().includes("success"));
if(ok){
const num=app.value.trim();
const c=currentAppType==="ADD"?(submitCounts.get(num)||0)+1:1;
submitCounts.set(num,c);
showToast(currentAppType==="ADD"?`submitted successfully`:"Data saved successfully ✔",true);
resetForm();
}else showToast(data.message||data.error||"Submission failed!",false);
}catch(err){
console.error(err);
showToast("Network error. Please try again.",false);
}finally{
toggleLoading(btn,false);
}
}
function validateRequiredFields(form){
let ok=true;
form.querySelectorAll("[required]").forEach(f=>{
if(!f.value.trim()){
f.style.borderColor="#e74c3c";
f.style.boxShadow="0 0 0 3px rgba(231,76,60,.2)";
ok=false;
}else{
f.style.borderColor="";
f.style.boxShadow="";
}
});
return ok;
}
function initAppNumValidation(){
const el=document.getElementById("applicationNumber");
if(!el)return;
el.addEventListener("input",function(){
const v=this.value.trim();
const s=document.getElementById("appStatus");
clearTimeout(debounceTimer);
s.textContent="";
this.style.borderColor="";
if(!v||!currentAppType)return;
if(!v.startsWith("RC")){s.textContent="Must start with RC";return;}
const len=currentAppType==="NEW"?20:21;
if(v.length!==len){s.textContent=`${v.length}/${len}`;return;}
const ok=currentAppType==="NEW"?/^RC\d{18}$/.test(v):/^RC\d{19}$/.test(v);
if(!ok){s.textContent="Invalid format";return;}
s.textContent="Checking...";
debounceTimer=setTimeout(()=>checkDuplicate(v),300);
});
}
async function checkDuplicate(num){
try{
const r=await fetch(`${API_URL}?action=checkDuplicate&appNum=${encodeURIComponent(num)}`);
const d=await r.json();
const s=document.getElementById("appStatus");
const f=document.getElementById("applicationNumber");
if(d.exists||d.duplicate){
s.textContent="already submitted";
f.style.borderColor="#e74c3c";
}else{
s.textContent="Available ✓";
f.style.borderColor="#27ae60";
}
}catch(e){console.log(e);}
}
function resetForm(){
const form=document.getElementById("dataForm");
const main=document.getElementById("mainForm");
const app=document.getElementById("appType");
form.reset();
main.style.display="none";
app.value="";
currentAppType="";
checkedAppNums.clear();
document.querySelectorAll("input,select").forEach(el=>{
el.style.borderColor="";
el.style.boxShadow="";
});
document.getElementById("date").value=new Date().toISOString().split("T")[0];
}
function showToast(msg,ok=true){
const t=document.getElementById("toast");
t.querySelector(".toast-message").textContent=msg;
t.className=`toast ${ok?"toast-success":"toast-error"} show`;
setTimeout(()=>t.classList.remove("show"),4000);
}
function toggleLoading(btn,show){
if(show){btn.classList.add("loading");btn.disabled=true;}
else{btn.classList.remove("loading");btn.disabled=false;}
}
