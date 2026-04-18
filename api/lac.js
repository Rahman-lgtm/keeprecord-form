export default async function handler(req,res){
const REPORT_URL=process.env.REPORT_URL;
const API_KEY=process.env.API_KEY;

try{
const response=await fetch(`${REPORT_URL}?key=${API_KEY}`);
const data=await response.json();

const result={};

data.forEach(row=>{

const approved=String(
row["Approved ( YES/NO)"]||
row["Approved"]||
""
).toUpperCase();

if(!approved.includes("YES"))return;

const fpsId=row["F.P.S Code 13050050......."]||"";
const fpsName=row["FPS Name"]||"";
const lac=row["Name of LAC"]||"Unknown";

const type=String(
row["Application type (NEW or ADD RC)"]||""
).toUpperCase();

const members=parseInt(row["Total Number of included Members"])||0;

const key=fpsId+"_"+lac;

if(!result[key]){
result[key]={
fpsId,
fpsName,
lac,
newCount:0,
newUnits:0,
addCount:0,
addUnits:0,
totalRC:0,
totalUnits:0
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

// TOTAL
result[key].totalRC=result[key].newCount+result[key].addCount;
result[key].totalUnits=result[key].newUnits+result[key].addUnits;

});

// 🔥 GROUP + SORT
const grouped={};

Object.values(result).forEach(item=>{
if(!grouped[item.lac])grouped[item.lac]=[];
grouped[item.lac].push(item);
});

// 🔥 sort inside each LAC (highest units first)
Object.keys(grouped).forEach(lac=>{
grouped[lac].sort((a,b)=>b.totalUnits-a.totalUnits);
});

// 🔥 final array
const finalData=[];
Object.keys(grouped).sort().forEach(lac=>{
finalData.push(...grouped[lac]);
});

return res.status(200).json(finalData);

}catch(err){
console.error(err);
return res.status(500).json({error:"Report failed"});
}
}
