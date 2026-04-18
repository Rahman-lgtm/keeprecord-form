export default async function handler(req,res){
const REPORT_URL=process.env.REPORT_URL;
const API_KEY=process.env.API_KEY;

try{
const response=await fetch(`${REPORT_URL}?key=${API_KEY}`);
const data=await response.json();

const result={};

data.forEach(row=>{

// 🔥 SAFE COLUMN ACCESS
const approved=String(
row["Approved ( YES/NO)"]||
row["Approved"]||
""
).toUpperCase().trim();

// ❗ only approved
if(!approved.includes("YES"))return;

const fpsId=row["F.P.S Code 13050050......."]||"";
const fpsName=row["FPS Name"]||"";
const lac=row["Name of LAC"]||"";

const type=String(
row["Application type (NEW or ADD RC)"]||""
).toUpperCase();

const members=parseInt(row["Total Number of included Members"])||0;

// unique key (FPS + LAC)
const key=fpsId+"_"+lac;

if(!result[key]){
result[key]={
fpsId,
fpsName,
lac,
newCount:0,
newUnits:0,
addCount:0,
addUnits:0
};
}

// NEW
if(type.includes("NEW")){
result[key].newCount+=1;
result[key].newUnits+=members;
}

// ADD
if(type.includes("ADD")){
result[key].addCount+=1;
result[key].addUnits+=members;
}

});

return res.status(200).json(Object.values(result));

}catch(err){
console.error(err);
return res.status(500).json({error:"LAC report failed"});
}
}
