export default async function handler(req,res){
const REPORT_URL=process.env.REPORT_URL;
const API_KEY=process.env.API_KEY;

try{
const response=await fetch(`${REPORT_URL}?key=${API_KEY}`);
const data=await response.json();

const result={};

data.forEach(row=>{

const approved=(row["Approved ( YES/NO)"]||"").toUpperCase().trim();
if(approved!=="YES")return; // 🔥 ONLY APPROVED

const gp=row["Name of the G.P/ Ward No of Nagaon MB."]||"Unknown";
const type=(row["Application type (NEW or ADD RC)"]||"").toUpperCase();
const members=Number(row["Total Number of included Members"]||0);

if(!result[gp]){
result[gp]={
gp,
rc:0,
new_units:0,
add_units:0,
total_units:0
};
}

// ✅ RC count only NEW
if(type.includes("NEW")){
result[gp].rc+=1;
result[gp].new_units+=members;
}

// ✅ ADD units
if(type.includes("ADD")){
result[gp].add_units+=members;
}

// ✅ TOTAL
result[gp].total_units=result[gp].new_units+result[gp].add_units;

});

// 🔥 sort highest → lowest
const finalData=Object.values(result).sort(
(a,b)=>b.total_units-a.total_units
);

return res.status(200).json(finalData);

}catch(err){
console.error(err);
return res.status(500).json({error:"GP-wise processing failed"});
}
}
