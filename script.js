const API_URL = "https://script.google.com/macros/s/AKfycbxTbYw912i1BbKm_BL8USYV5suO2d2hb7ahw95fbO4ftwzyoaImknOI23Uvzjv4aeXdBA/exec";

let fpsData = [];
let checkedAppNums = new Set();
let debounceTimer;

// Toast
function showToast(msg, ok=true){
  const t = document.getElementById("toast");
  t.querySelector(".toast-message").textContent = msg;
  t.className = "toast show " + (ok ? "toast-success" : "toast-error");
  setTimeout(()=>t.classList.remove("show"),3000);
}

// Validation
function isValid(val){
  return /^RC\d{18,19}$/.test(val);
}

// Loader
function toggle(btn,load){
  btn.disabled=load;
  btn.querySelector(".btn-text").style.display=load?"none":"inline";
  btn.querySelector(".spinner").style.display=load?"inline":"none";
}

// FPS Load
fetch(API_URL+"?action=getFPS")
.then(r=>r.json()).then(d=>fpsData=d);

// Elements
const app = document.getElementById("applicationNumber");
const status = document.getElementById("appStatus");

// LIVE CHECK
app.addEventListener("input",function(){
  const v=this.value.trim();
  clearTimeout(debounceTimer);

  if(!isValid(v)){
    status.textContent="";
    return;
  }

  status.textContent="Checking...";
  status.className="status-checking";

  debounceTimer=setTimeout(()=>{
    fetch(API_URL+`?action=checkDuplicate&appNum=${v}`)
    .then(r=>r.json())
    .then(d=>{
      if(d.exists){
        status.textContent="Duplicate ❌";
        status.className="status-dup";
        checkedAppNums.add(v);
      } else {
        status.textContent="Available ✅";
        status.className="status-ok";
      }
    });
  },400);
});

// Submit
document.getElementById("dataForm").addEventListener("submit",function(e){
  e.preventDefault();

  const btn=document.getElementById("submitBtn");
  const appNum=app.value.trim();
  const mobile=document.getElementById("mobile").value;

  if(!/^\d{10}$/.test(mobile)) return showToast("Invalid Mobile",false);
  if(!isValid(appNum)) return showToast("Invalid App No",false);
  if(checkedAppNums.has(appNum)) return showToast("Duplicate",false);

  toggle(btn,true);

  const fd=new URLSearchParams(new FormData(this));
  fd.append("action","submit");

  fetch(API_URL,{method:"POST",body:fd})
  .then(r=>r.json())
  .then(res=>{
    if(res.status==="Success"){
      showToast("Saved ✅",true);
      this.reset();
      status.textContent="";
    } else {
      showToast("Duplicate ❌",false);
    }
  })
  .catch(()=>showToast("Error ❌",false))
  .finally(()=>toggle(btn,false));
});
