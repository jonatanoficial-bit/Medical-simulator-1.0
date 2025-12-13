const screens=document.querySelectorAll(".screen");
function show(id){screens.forEach(s=>s.classList.remove("active"));document.getElementById(id).classList.add("active")}

let game={
  name:"",
  avatar:"",
  score:0,
  cases:0,
  rank:"Médico Residente",
  current:null
};

const cases=[
{
 patient:{name:"Carlos Silva",age:58,sex:"M",photo:"assets/patients/patient_m1.jpg"},
 complaint:"Dor torácica intensa",
 history:"Dor em aperto irradiando para braço esquerdo, sudorese.",
 questions:["Irradiação","Dispneia","Histórico familiar"],
 exams:[
  {label:"ECG",result:"ST elevado",essential:true},
  {label:"Troponina",result:"Elevada",essential:true},
  {label:"Raio-X",result:"Normal",essential:false}
 ],
 diagnosis:[
  {label:"Infarto Agudo do Miocárdio",correct:true},
  {label:"Ansiedade",correct:false},
  {label:"Pneumonia",correct:false},
  {label:"Refluxo",correct:false}
 ],
 medications:[
  {label:"AAS + Heparina",correct:true},
  {label:"Antibiótico",correct:false},
  {label:"Broncodilatador",correct:false}
 ],
 outcome:{
  success:"Paciente encaminhado à hemodinâmica com sucesso.",
  fail:"Erro grave levou a choque cardiogênico."
 }
}
];

document.getElementById("newGame").onclick=()=>{localStorage.clear();show("screen-avatar")}
document.getElementById("continueGame").onclick=()=>{const s=localStorage.getItem("save");if(s){game=JSON.parse(s);updateOffice();show("screen-office")}}

document.getElementById("startGame").onclick=()=>{
 game.name=document.getElementById("doctorName").value;
 const sel=document.querySelector(".selected");
 if(!game.name||!sel){alert("Complete tudo");return}
 game.avatar=sel.src;
 localStorage.setItem("save",JSON.stringify(game));
 briefing();
 show("screen-briefing")
}

document.querySelectorAll(".grid img").forEach(i=>{
 i.onclick=()=>{document.querySelectorAll(".grid img").forEach(x=>x.classList.remove("selected"));i.classList.add("selected")}
})

function briefing(){
 const t=document.getElementById("briefingText");
 const msg=`Bem-vindo ${game.name}. Temos várias emergências aguardando. Assuma seu posto imediatamente.`;
 let i=0;t.innerHTML="";
 const inter=setInterval(()=>{
  t.innerHTML+=msg[i++];
  if(i>=msg.length)clearInterval(inter)
 },30)
}

document.getElementById("goOffice").onclick=()=>{updateOffice();show("screen-office")}

function updateOffice(){
 document.getElementById("docAvatar").src=game.avatar;
 document.getElementById("docName").innerText=game.name;
 document.getElementById("score").innerText=game.score;
 document.getElementById("cases").innerText=game.cases;
 document.getElementById("docRank").innerText=game.rank;
 localStorage.setItem("save",JSON.stringify(game))
}

document.getElementById("nextCase").onclick=()=>{
 game.current=cases[0];
 renderCase();
 show("screen-case")
}

function renderCase(){
 const c=game.current;
 document.getElementById("patientImg").src=c.patient.photo;
 document.getElementById("patientName").innerText=c.patient.name;
 document.getElementById("patientData").innerText=`${c.patient.age} anos`;
 document.getElementById("complaint").innerText=c.complaint;
 document.getElementById("history").innerText=c.history;

 const q=document.getElementById("questions");q.innerHTML="";
 c.questions.forEach(x=>{const b=document.createElement("button");b.innerText=x;q.appendChild(b)})

 const e=document.getElementById("exams");e.innerHTML="";
 c.exams.forEach(ex=>{
  const b=document.createElement("button");
  b.innerText=ex.label;
  b.onclick=()=>document.getElementById("examResults").innerText=ex.result;
  e.appendChild(b)
 })

 const d=document.getElementById("diagnosis");d.innerHTML="";
 c.diagnosis.forEach((dx,i)=>{
  d.innerHTML+=`<label><input type="radio" name="dx" value="${i}">${dx.label}</label><br>`
 })

 const m=document.getElementById("medications");m.innerHTML="";
 c.medications.forEach((med,i)=>{
  m.innerHTML+=`<label><input type="checkbox" value="${i}">${med.label}</label><br>`
 })
}

document.getElementById("submit").onclick=()=>{
 const dx=document.querySelector("input[name='dx']:checked");
 if(!dx){alert("Selecione diagnóstico");return}
 const correct=game.current.diagnosis[dx.value].correct;
 game.score+=correct?100:-100;
 game.cases++;
 document.getElementById("resultText").innerText=correct?game.current.outcome.success:game.current.outcome.fail;
 show("screen-result");
 updateOffice();
}

document.getElementById("backOffice").onclick=()=>show("screen-office");
