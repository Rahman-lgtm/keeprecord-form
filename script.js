const API_URL="https://script.google.com/macros/s/AKfycbygU1kvPdNDa-c0r_iRBNXdMqU1LNTqXhCNEkwSPnanvDqOCTo6JF00Tw0ojHW6LWGC5Q/exec";

let fpsData=[];

fetch(`${API_URL}?action=getFPS`)
.then(res=>res.json())
.then(data=>fpsData=data)
.catch(()=>alert("Unable to load FPS Data"));

const inspector=document.getElementById("inspector");
const applicationNumber=document.getElementById("applicationNumber");
const deo=document.getElementById("deo");
const dateInput=document.getElementById("date");
const hof=document.getElementById("hof");
const appType=document.getElementById("appType");
const gp=document.getElementById("gp");
const totalMembers=document.getElementById("totalMembers");
const fpsCode=document.getElementById("fpsCode");
const fpsName=document.getElementById("fpsName");
const lacManual=document.getElementById("lacManual");
const gpss=document.getElementById("gpss");
const areaOfficer=document.getElementById("areaOfficer");
const mobile=document.getElementById("mobile");

fpsCode.addEventListener("change",function(){

const code=this.value.trim();
const found=fpsData.find(item=>item.code===code);

if(found){
fpsName.value=found.fpsName;
gpss.value=found.gpss;
areaOfficer.value=found.areaOfficer;
lacManual.value=found.lac;
fpsCode.style.border="1px solid black";
}
else{
fpsName.value="";
gpss.value="";
areaOfficer.value="";
lacManual.value="";
fpsCode.style.border="2px solid red";
alert("FPS Code not found");
}

});

document.getElementById("dataForm").addEventListener("submit",function(e){

e.preventDefault();

if(!/^\d{10}$/.test(mobile.value)){
alert("Enter valid mobile number");
return;
}

if(!fpsData.find(item=>item.code===fpsCode.value.trim())){
alert("Invalid FPS Code");
return;
}

const formData=new URLSearchParams({

action:"submit",
inspector:inspector.value,
applicationNumber:applicationNumber.value,
deo:deo.value,
date:dateInput.value,
hof:hof.value,
mobile:mobile.value,
appType:appType.value,
gp:gp.value,
totalMembers:totalMembers.value,
fpsCode:fpsCode.value,
fpsName:fpsName.value,
lacManual:lacManual.value,
gpss:gpss.value,
areaOfficer:areaOfficer.value

});

fetch(API_URL,{method:"POST",body:formData})
.then(res=>res.text())
.then(response=>{

if(response==="Success"){
alert("Data Saved Successfully");
document.getElementById("dataForm").reset();
}
else{
alert("Submission Failed");
}

})
.catch(()=>alert("Submission Failed"));

});

document.getElementById("applicationNumber").addEventListener("input",function(){

const value=this.value.trim();
const pattern=/^RC\d{18,19}$/;

if(pattern.test(value)){
this.style.borderColor="#198754";
this.style.boxShadow="0 0 6px rgba(25,135,84,0.3)";
}
else{
this.style.borderColor="#dc3545";
this.style.boxShadow="0 0 6px rgba(220,53,69,0.3)";
}

});
