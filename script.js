/* =========================================================
   Emergency Doctor Simulator — script.js (v3.1.0)
   =========================================================
   ✔ Intro com typewriter (Diretor do Hospital)
   ✔ Consultório (hub) restaurado
   ✔ Casos reais via cases.json (título + vitais + resumo)
   ✔ Persistência total (save) + ranking Top 20 (localStorage)
   ✔ Cronômetro + óbito automático
   ✔ Progressão de cargo
   ========================================================= */

(() => {
  "use strict";

  /* =========================
     CONFIG
  ========================= */
  const APP_VERSION = "3.1.0";
  const STORAGE_SAVE = "eds_save_v3_1";
  const STORAGE_RANK = "eds_rank_v3_1";

  const CASE_TIME_DEFAULT = 120;

  /* =========================
     HELPERS
  ========================= */
  const $ = (id) => document.getElementById(id);

  function showScreen(name){
    document.querySelectorAll(".screen").forEach(s=>{
      s.classList.toggle("active", s.dataset.screen === name);
    });
  }

  function formatTime(sec){
    sec = Math.max(0, Math.floor(sec));
    const m = String(Math.floor(sec / 60)).padStart(2,"0");
    const s = String(sec % 60).padStart(2,"0");
    return `${m}:${s}`;
  }

  function safeText(v){
    if(v === null || v === undefined) return "";
    return String(v);
  }

  function nowTs(){ return Date.now(); }

  function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }

  function qs(sel){ return document.querySelector(sel); }

  /* =========================
     ESTADO
  ========================= */
  const state = {
    doctor: {
      name: "",
      avatar: "",
      rank: "Interno",
      createdAt: null,
      introSeen: false
    },
    stats: {
      points: 0,
      cases: 0,
      deaths: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      bestStreak: 0
    },
    timer: {
      max: CASE_TIME_DEFAULT,
      remaining: 0,
      interval: null,
      startedAt: null
    },
    data: {
      cases: []
    },
    gameplay: {
      currentCase: null
    },
    typewriter: {
      running: false,
      skip: false
    }
  };

  /* =========================
     SAVE / LOAD
  ========================= */
  function serializeSave(){
    return {
      v: APP_VERSION,
      doctor: state.doctor,
      stats: state.stats
    };
  }

  function saveGame(){
    try{
      localStorage.setItem(STORAGE_SAVE, JSON.stringify(serializeSave()));
    }catch(e){}
    updateRanking();
  }

  function loadGame(){
    try{
      const raw = localStorage.getItem(STORAGE_SAVE);
      if(!raw) return false;
      const obj = JSON.parse(raw);
      if(!obj || typeof obj !== "object") return false;

      if(obj.doctor){
        state.doctor.name = safeText(obj.doctor.name || "");
        state.doctor.avatar = safeText(obj.doctor.avatar || "");
        state.doctor.rank = safeText(obj.doctor.rank || "Interno") || "Interno";
        state.doctor.createdAt = obj.doctor.createdAt ?? null;
        state.doctor.introSeen = !!obj.doctor.introSeen;
      }
      if(obj.stats){
        state.stats.points = Number(obj.stats.points || 0);
        state.stats.cases = Number(obj.stats.cases || 0);
        state.stats.deaths = Number(obj.stats.deaths || 0);
        state.stats.correct = Number(obj.stats.correct || 0);
        state.stats.wrong = Number(obj.stats.wrong || 0);
        state.stats.streak = Number(obj.stats.streak || 0);
        state.stats.bestStreak = Number(obj.stats.bestStreak || 0);
      }
      return true;
    }catch(e){
      return false;
    }
  }

  function hasProfile(){
    return !!(state.doctor.name && state.doctor.avatar);
  }

  function resetGame(){
    state.doctor = { name:"", avatar:"", rank:"Interno", createdAt:null, introSeen:false };
    state.stats = { points:0, cases:0, deaths:0, correct:0, wrong:0, streak:0, bestStreak:0 };
    state.gameplay.currentCase = null;
    clearTimer();
    saveGame();
  }

  /* =========================
     RANKING
  ========================= */
  function getRanking(){
    try{
      const raw = localStorage.getItem(STORAGE_RANK);
      if(!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }catch(e){
      return [];
    }
  }

  function setRanking(arr){
    try{
      localStorage.setItem(STORAGE_RANK, JSON.stringify(arr));
    }catch(e){}
  }

  function updateRanking(){
    if(!hasProfile()) return;

    const list = getRanking();
    const nameKey = state.doctor.name.trim();

    const entry = {
      name: nameKey,
      rank: state.doctor.rank,
      points: state.stats.points,
      cases: state.stats.cases,
      deaths: state.stats.deaths,
      bestStreak: state.stats.bestStreak,
      updatedAt: nowTs()
    };

    const idx = list.findIndex(x => x && x.name === nameKey);
    if(idx >= 0) list[idx] = entry;
    else list.push(entry);

    list.sort((a,b) => (b.points||0) - (a.points||0) || (b.bestStreak||0) - (a.bestStreak||0));
    setRanking(list.slice(0, 20));
  }

  function renderRanking(){
    const listWrap = $("rankingList");
    if(!listWrap) return;

    const list = getRanking();
    if(!list.length){
      listWrap.innerHTML = `<div style="color:rgba(233,238,252,.7);padding:8px 0;">Sem ranking ainda.</div>`;
      return;
    }

    listWrap.innerHTML = "";
    list.forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "rankRow";
      row.innerHTML = `
        <div class="rankPos">${i+1}º</div>
        <div class="rankName">${safeText(r.name)}</div>
        <div class="rankMeta">${safeText(r.rank)} • ${safeText(r.cases)} casos • ${safeText(r.deaths)} óbitos</div>
        <div class="rankPts">${safeText(r.points)} pts</div>
      `;
      listWrap.appendChild(row);
    });
  }

  function openRanking(){
    renderRanking();
    $("rankingModal")?.classList.remove("hidden");
  }
  function closeRanking(){
    $("rankingModal")?.classList.add("hidden");
  }

  /* =========================
     AJUDA
  ========================= */
  function openHelp(){ $("helpModal")?.classList.remove("hidden"); }
  function closeHelp(){ $("helpModal")?.classList.add("hidden"); }

  /* =========================
     PROGRESSÃO DE CARGO
  ========================= */
  function updateRank(){
    const p = state.stats.points;

    let rank = "Interno";
    if(p >= 160) rank = "Pleno";
    else if(p >= 90) rank = "Titular";
    else if(p >= 40) rank = "Residente";

    state.doctor.rank = rank;
  }

  /* =========================
     HUD / UI
  ========================= */
  function updateOfficeHUD(){
    if($("uiName")) $("uiName").textContent = state.doctor.name || "—";
    if($("uiRank")) $("uiRank").textContent = state.doctor.rank || "Interno";
    if($("uiAvatar")) $("uiAvatar").src = state.doctor.avatar || "images/avatar1.png";

    if($("uiPoints")) $("uiPoints").textContent = String(state.stats.points);
    if($("uiCases")) $("uiCases").textContent = String(state.stats.cases);
    if($("uiDeaths")) $("uiDeaths").textContent = String(state.stats.deaths);

    // timer no consultório fica 00:00 se não está em caso
    if(!$("caseTimer")) return;
    const txt = state.timer.interval ? formatTime(state.timer.remaining) : "00:00";
    $("caseTimer").textContent = txt;
  }

  function setCaseUI(c){
    if(!c) return;
    const title = c.title ? `${c.title}` : "Paciente em atendimento";
    const patient = c.patient || {};
    const vitals = Array.isArray(c.vitals) ? c.vitals.join(" • ") : "—";

    const resumo =
      `Paciente: ${safeText(patient.name || "—")} (${safeText(patient.age ?? "—")} anos, ${safeText(patient.sex || "—")}). ` +
      `Queixa: ${safeText(c.complaint || "—")}. ` +
      (c.history ? `História: ${safeText(c.history)}.` : "");

    if($("caseTitle")) $("caseTitle").textContent = title;
    if($("caseStatus")) $("caseStatus").textContent = resumo;
    if($("caseVitals")) $("caseVitals").textContent = vitals;
  }

  function setDeathReason(text){
    const el = $("deathReason");
    if(el) el.textContent = safeText(text || "O paciente não resistiu.");
  }

  /* =========================
     DATA: cases.json
  ========================= */
  async function loadCases(){
    const url = `cases.json?v=${encodeURIComponent(APP_VERSION)}&t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) throw new Error(`Falha ao carregar cases.json (HTTP ${res.status})`);
    const data = await res.json();
    if(!Array.isArray(data)) throw new Error("cases.json inválido (esperado array).");
    state.data.cases = data;
  }

  function getRandomCase(){
    const list = state.data.cases || [];
    if(!list.length) return null;
    const idx = Math.floor(Math.random() * list.length);
    return list[idx] || null;
  }

  /* =========================
     TIMER / ÓBITO
  ========================= */
  function clearTimer(){
    if(state.timer.interval){
      clearInterval(state.timer.interval);
      state.timer.interval = null;
    }
  }

  function startTimer(seconds){
    clearTimer();
    state.timer.max = seconds;
    state.timer.remaining = seconds;
    state.timer.startedAt = nowTs();

    if($("caseTimer")) $("caseTimer").textContent = formatTime(state.timer.remaining);

    state.timer.interval = setInterval(()=>{
      state.timer.remaining--;
      if($("caseTimer")) $("caseTimer").textContent = formatTime(state.timer.remaining);

      if(state.timer.remaining <= 0){
        clearTimer();
        registerDeath("Tempo esgotado. O paciente não resistiu.");
      }
    }, 1000);
  }

  /* =========================
     INTRO TYPEWRITER
  ========================= */
  async function runTypewriter(text){
    const box = $("directorText");
    if(!box) return;
    state.typewriter.running = true;
    state.typewriter.skip = false;

    box.textContent = "";

    for(let i=0; i<text.length; i++){
      if(state.typewriter.skip){
        box.textContent = text;
        break;
      }
      box.textContent += text[i];
      // velocidade de digitação
      await new Promise(r => setTimeout(r, 18));
    }

    state.typewriter.running = false;
  }

  function skipTypewriter(){
    state.typewriter.skip = true;
  }

  function introText(){
    const name = state.doctor.name || "Doutor(a)";
    return (
`Bem-vindo(a), ${name}.

Você está iniciando seu plantão no pronto-socorro.
Aqui, tempo e precisão salvam vidas.

Regras do plantão:
• Cada caso possui um cronômetro. Se zerar, o risco de óbito é alto.
• Atenda com rapidez para ganhar bônus.
• Óbitos reduzem sua pontuação.
• Suba de cargo: Interno → Residente → Titular → Pleno.

Quando estiver pronto(a), entre no consultório e inicie o atendimento.`
    );
  }

  async function goIntro(){
    showScreen("intro");
    await runTypewriter(introText());
  }

  /* =========================
     GAMEPLAY
  ========================= */
  function startCase(){
    if(!state.data.cases.length){
      alert("cases.json ainda não carregou. Confira se o arquivo está na raiz do projeto.");
      return;
    }

    const c = getRandomCase();
    if(!c){
      alert("Nenhum caso disponível.");
      return;
    }

    state.gameplay.currentCase = c;
    state.stats.cases += 1;

    const caseTime = Number(c.timeLimitSec || CASE_TIME_DEFAULT);
    startTimer(caseTime);

    setCaseUI(c);

    updateRank();
    updateOfficeHUD();
    saveGame();

    showScreen("case");
  }

  function finalizeCase(){
    clearTimer();

    const c = state.gameplay.currentCase;
    if(!c){
      updateOfficeHUD();
      showScreen("office");
      return;
    }

    // Pontuação atual (fase 1):
    // - atender a tempo já soma
    // - bônus por tempo restante
    // - se o caso for marcado como "death" no JSON, soma pouco (alta letalidade)
    const expected = safeText(c.expectedOutcome || "survive").toLowerCase();

    let gained = 0;

    if(expected === "death"){
      gained = 8;
      state.stats.wrong += 1;
      state.stats.streak = 0;
    } else {
      gained = 20;
      state.stats.correct += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    }

    const bonus = Math.floor(Math.max(0, state.timer.remaining) / 10);
    gained += bonus;

    state.stats.points = clamp(state.stats.points + gained, 0, 999999);

    updateRank();
    updateOfficeHUD();
    saveGame();

    state.gameplay.currentCase = null;

    showScreen("office");
  }

  function registerDeath(reason){
    clearTimer();

    state.stats.deaths += 1;
    state.stats.wrong += 1;
    state.stats.streak = 0;

    state.stats.points = clamp(state.stats.points - 15, 0, 999999);

    updateRank();
    updateOfficeHUD();
    saveGame();

    state.gameplay.currentCase = null;

    setDeathReason(reason);
    showScreen("death");
  }

  /* =========================
     BIND UI
  ========================= */
  function bindHome(){
    $("btnNewGame")?.addEventListener("click", () => {
      resetGame();
      document.querySelectorAll(".avatarCard").forEach(c => c.classList.remove("selected"));
      const input = $("inputName");
      if(input) input.value = "";
      showScreen("profile");
    });

    $("btnContinue")?.addEventListener("click", () => {
      if(hasProfile()){
        updateRank();
        updateOfficeHUD();
        // se não viu intro ainda, mostra intro
        if(!state.doctor.introSeen){
          goIntro();
        }else{
          showScreen("office");
        }
      }else{
        showScreen("profile");
      }
    });
  }

  function bindProfile(){
    const input = $("inputName");
    const cards = document.querySelectorAll(".avatarCard");

    cards.forEach(card=>{
      card.addEventListener("click", ()=>{
        cards.forEach(c=>c.classList.remove("selected"));
        card.classList.add("selected");
        state.doctor.avatar = card.dataset.avatar || "";
      });
    });

    $("btnProfileBack")?.addEventListener("click", ()=> showScreen("home"));

    $("btnStartFromProfile")?.addEventListener("click", ()=>{
      const name = (input?.value || "").trim();
      if(!name){
        alert("Digite seu nome.");
        return;
      }
      if(!state.doctor.avatar){
        alert("Selecione um avatar.");
        return;
      }

      state.doctor.name = name;
      if(!state.doctor.createdAt) state.doctor.createdAt = nowTs();

      updateRank();
      updateOfficeHUD();
      saveGame();

      // sempre passa pela intro na primeira vez
      goIntro();
    });
  }

  function bindIntro(){
    // clicar no texto acelera/skip
    $("directorText")?.addEventListener("click", ()=>{
      if(state.typewriter.running) skipTypewriter();
    });

    $("btnIntroHelp")?.addEventListener("click", openHelp);
    $("btnIntroContinue")?.addEventListener("click", ()=>{
      state.doctor.introSeen = true;
      saveGame();
      updateOfficeHUD();
      showScreen("office");
    });

    // ESC para pular intro
    document.addEventListener("keydown", (e)=>{
      if(qs('.screen.active')?.dataset?.screen === "intro"){
        if(e.key === "Escape"){
          skipTypewriter();
        }
      }
    });
  }

  function bindOffice(){
    $("btnNextCase")?.addEventListener("click", startCase);
    $("btnOfficeRanking")?.addEventListener("click", openRanking);
  }

  function bindCase(){
    $("btnFinalize")?.addEventListener("click", finalizeCase);
  }

  function bindDeath(){
    $("btnBackOffice")?.addEventListener("click", ()=>{
      updateOfficeHUD();
      showScreen("office");
    });
  }

  function bindRanking(){
    $("btnRanking")?.addEventListener("click", openRanking);
    $("btnCloseRanking")?.addEventListener("click", closeRanking);

    $("rankingModal")?.addEventListener("click", (e)=>{
      if(e.target && e.target.id === "rankingModal") closeRanking();
    });
  }

  function bindHelp(){
    $("btnHelp")?.addEventListener("click", openHelp);
    $("btnCloseHelp")?.addEventListener("click", closeHelp);

    $("helpModal")?.addEventListener("click", (e)=>{
      if(e.target && e.target.id === "helpModal") closeHelp();
    });
  }

  function bindFullscreen(){
    $("btnFullScreen")?.addEventListener("click", async ()=>{
      try{
        if(!document.fullscreenElement){
          await document.documentElement.requestFullscreen();
        }else{
          await document.exitFullscreen();
        }
      }catch(e){}
    });
  }

  /* =========================
     BOOT
  ========================= */
  async function boot(){
    bindHome();
    bindProfile();
    bindIntro();
    bindOffice();
    bindCase();
    bindDeath();
    bindRanking();
    bindHelp();
    bindFullscreen();

    const ok = loadGame();
    updateRank();
    updateOfficeHUD();
    if(ok) updateRanking();

    try{
      await loadCases();
    }catch(err){
      console.error(err);
      alert("Não foi possível carregar cases.json. Confirme: o arquivo está na raiz e o nome é cases.json.");
    }

    showScreen("home");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
