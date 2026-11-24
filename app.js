const KEY="sailor-workout-v1";
const iso=d=>{const x=new Date(d);return new Date(x.getTime()-x.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const today=()=>iso(new Date());
const defState=()=>({plan:"A",start:today(),logs:{},checkins:[],runDone:{},traffic:{},tab:"oggi",theme:"auto",openW:null,mob:{}});
let S;try{S=Object.assign(defState(),JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){S=defState()}
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dow=()=>(new Date().getDay()+6)%7;
const rawWeek=()=>Math.floor((new Date(today())-new Date(S.start))/6048e5)+1;
const cycleWeek=()=>Math.max(1,Math.min(8,rawWeek()));
const ICON={check:'<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',moon:"🌙",sun:"☀️",auto:"🌓"};
const FACE={
verde:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20"/><path d="M16 29c2 5 14 5 16 0"/><circle cx="17" cy="20" r="1.5" fill="currentColor"/><circle cx="31" cy="20" r="1.5" fill="currentColor"/></svg>',
giallo:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20"/><path d="M17 31h14"/><circle cx="17" cy="20" r="1.5" fill="currentColor"/><circle cx="31" cy="20" r="1.5" fill="currentColor"/></svg>',
rosso:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20"/><path d="M16 33c2-5 14-5 16 0"/><circle cx="17" cy="20" r="1.5" fill="currentColor"/><circle cx="31" cy="20" r="1.5" fill="currentColor"/></svg>'};
const num=v=>v===""||v==null?NaN:parseFloat(String(v).replace(",","."));

// ---------- tema ----------
const mq=matchMedia("(prefers-color-scheme: dark)");
function applyTheme(){
  const t=S.theme==="auto"?(mq.matches?"dark":"light"):S.theme;
  document.documentElement.dataset.theme=t;
  $('meta[name=theme-color]').content=t==="dark"?"#0b0f0e":"#f2f4f3";
  $("#themeBtn").textContent=ICON[S.theme==="auto"?"auto":t==="dark"?"moon":"sun"];
}
mq.addEventListener?.("change",applyTheme);
$("#themeBtn").onclick=()=>{S.theme={auto:"dark",dark:"light",light:"auto"}[S.theme];save();applyTheme();toast({auto:"Tema automatico",dark:"Tema scuro",light:"Tema chiaro"}[S.theme])};
$("#gearBtn").onclick=()=>go("setup");

// ---------- suoni / toast / wake lock ----------
let AC;
document.addEventListener("pointerdown",()=>{if(!AC)try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}if(AC&&AC.state==="suspended")AC.resume()});
function beep(n=1){if(AC)for(let i=0;i<n;i++){const o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.frequency.value=880;g.gain.value=.25;const t=AC.currentTime+i*.3;o.start(t);o.stop(t+.18)}navigator.vibrate?.(200)}
let tt;function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),1600)}
let wl;async function wake(on){try{if(on&&!wl){wl=await navigator.wakeLock.request("screen");wl.addEventListener("release",()=>wl=null)}else if(!on&&wl){await wl.release();wl=null}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)wake(wantWake())});
const wantWake=()=>!!run||(S.tab==="pesi"&&!!S.openW);

// ---------- navigazione ----------
function go(t,keep){if(t==="oggi")viewDay=null;S.tab=t;if(t!=="pesi"&&!keep)S.openW=S.openW;save();render(false)}
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{if(b.dataset.t==="pesi"&&S.tab==="pesi")S.openW=null;go(b.dataset.t)});
const TITLES={oggi:"Oggi",settimana:"Settimana",pesi:"Pesi",corsa:"Corsa",checkin:"Check-in",setup:"Impostazioni"};
function render(keepScroll=true){
  const y=scrollY;
  document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===S.tab));
  const w=cycleWeek(),ph=phaseFor(w);
  $("#ttl").textContent=TITLES[S.tab];
  $("#sub").textContent=`Piano ${S.plan} · sett. ${rawWeek()>8?"8+":w} · ${ph.t}`;
  $("#view").innerHTML=VIEWS[S.tab]()+'<div class="pad"></div>';
  scrollTo(0,keepScroll?y:0);
  wake(wantWake());
}

// ---------- utilità dati ----------
const prevLog=id=>{const a=(S.logs[id]||[]).filter(e=>e.d<today()&&e.sets.some(s=>s.done));return a.length?a[a.length-1]:null};
const doneSets=e=>e.sets.filter(s=>s.done&&num(s.kg)>0);
const draft={};
function getDraft(ex){
  if(draft[ex.id])return draft[ex.id];
  const t=(S.logs[ex.id]||[]).find(e=>e.d===today());
  if(t)return draft[ex.id]={sets:t.sets.map(s=>({...s})),rir:t.rir};
  const p=prevLog(ex.id),ps=p?p.sets.filter(s=>s.done):[];
  const sets=Array.from({length:ex.sets},(_,i)=>{const s=ps[i]||ps[ps.length-1];return{kg:s?s.kg:"",rep:s?s.rep:"",done:false}});
  return draft[ex.id]={sets,rir:null};
}
function persist(id){
  const d=draft[id],arr=S.logs[id]=S.logs[id]||[],i=arr.findIndex(e=>e.d===today());
  if(!d.sets.some(s=>s.done)){if(i>=0)arr.splice(i,1)}else{const e={d:today(),sets:d.sets,rir:d.rir};if(i>=0)arr[i]=e;else arr.push(e)}
  save();
}
function suggest(ex){
  const p=prevLog(ex.id);if(!p)return null;
  const ds=doneSets(p);if(!ds.length)return null;
  const [lo,hi]=ex.reps,kg=Math.max(...ds.map(s=>num(s.kg)));
  if(ds.length>=ex.sets&&ds.every(s=>num(s.rep)>=hi)){const nk=Math.round(kg*1.03*2)/2;return{up:true,kg:Math.max(nk,kg+.5),txt:`Hai chiuso ${hi} rep a ${kg} kg → prova ${Math.max(nk,kg+.5)} kg (+2–5%) e riparti da ${lo}–${lo+2} rep.`}}
  return{up:false,txt:`Resta a ${kg} kg e punta a ${hi} rep su tutte le serie.`};
}
function progress(k,dt=today()){
  let d=0,t=0;WORKOUTS[k].ex.forEach(ex=>{t+=ex.sets;const e=(S.logs[ex.id]||[]).find(e=>e.d===dt);if(e)d+=e.sets.filter(s=>s.done).length});
  return{d,t,pct:t?Math.round(d/t*100):0};
}
const restSecs=ex=>{const m=String(ex.rest).match(/(\d+)/);return m?(/min/.test(ex.rest)?+m[1]*60:+m[1]):90};
const fmt=s=>{s=Math.max(0,Math.ceil(s));return`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`};
const fdate=d=>new Date(d).toLocaleDateString("it-IT",{day:"numeric",month:"short"});
function chart(pts,color,unit){
  if(pts.length<2)return `<div class="mut" style="margin-top:8px">Servono almeno 2 registrazioni per il grafico.</div>`;
  const W=300,H=130,p=16,xs=pts.map((_,i)=>p+i*(W-2*p)/(pts.length-1)),ys=pts.map(q=>q.v);
  const mn=Math.min(...ys),mx=Math.max(...ys),r=mx-mn||1,y=v=>H-22-(v-mn)/r*(H-44);
  const d=pts.map((q,i)=>`${i?"L":"M"}${xs[i].toFixed(1)} ${y(q.v).toFixed(1)}`).join("");
  const area=`${d}L${xs[xs.length-1].toFixed(1)} ${H-12}L${xs[0].toFixed(1)} ${H-12}Z`;
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" style="color:${color}"><path d="${area}" fill="${color}" opacity=".12" stroke="none"/><path d="${d}" stroke="${color}" stroke-width="2.5" fill="none"/>${pts.map((q,i)=>`<circle cx="${xs[i].toFixed(1)}" cy="${y(q.v).toFixed(1)}" r="3.5" fill="${color}" stroke="none"/>`).join("")}<text x="${p}" y="12" font-size="10" fill="var(--mut)" stroke="none">${mx}${unit}</text><text x="${p}" y="${H-1}" font-size="10" fill="var(--mut)" stroke="none">${pts[0].d?fdate(pts[0].d):""}</text><text x="${W-p}" y="${H-1}" font-size="10" fill="var(--mut)" stroke="none" text-anchor="end">${pts[pts.length-1].d?fdate(pts[pts.length-1].d):""} · ${ys[ys.length-1]}${unit}</text></svg>`;
}

// ---------- OGGI ----------
function weekDates(){const n=new Date(),m=new Date(n);m.setDate(n.getDate()-dow());return Array.from({length:7},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return iso(d)})}
function trained(date){return Object.values(S.logs).some(a=>a.some(e=>e.d===date&&e.sets.some(s=>s.done)))}
let viewDay=null,viewDate=today();
function curDay(){if(viewDate!==today()){viewDay=null;viewDate=today()}return viewDay??dow()}
function oggi(){
  const vi=curDay(),isT=vi===dow(),wd=weekDates(),vdate=wd[vi];
  const d=WEEK[S.plan][vi],tr=S.traffic[today()],k=d.key&&WORKOUTS[d.key]&&!(d.key==="RUN")?d.key:null;
  const dt=new Date(vdate+"T12:00").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"});
  let hero;
  if(k){const p=progress(k,vdate),w=WORKOUTS[k];
    hero=`<div class="card hero"><div class="mut">${esc(dt)}</div><h3 style="font-size:22px;margin-top:4px">Scheda ${esc(w.name)}</h3><div class="mut">${esc(w.dur)} · ${w.ex.length} esercizi</div>
    <div class="bar"><i style="width:${p.pct}%"></i></div><div class="mut" style="margin-top:4px">${p.d}/${p.t} serie${p.pct===100?" · completata 🎉":""}</div>
    <button class="btn" data-a="open" data-w="${k}">${!isT?"Vedi scheda":p.d?(p.pct===100?"Rivedi scheda":"Continua allenamento"):"Inizia allenamento"}</button></div>`}
  else hero=`<div class="card hero"><div class="mut">${esc(dt)}</div><h3 style="font-size:22px;margin-top:4px">${d.key==="RUN"?"Giorno corsa facile (opzionale)":"Oggi niente pesi"}</h3><div class="mut">${esc(d.note)}</div>${d.key==="RUN"?`<button class="btn" data-a="tab" data-t="corsa">Vai alla corsa</button>`:""}</div>`;
  return `${hero}
  <div class="card"><div class="ln" style="display:grid;gap:6px"><div><span class="mut">Mattina</span><br>${esc(d.am)}</div><div><span class="mut">Sera</span><br>${esc(d.pm)}</div></div></div>
  <h2>Questa settimana</h2><div class="strip">${wd.map((x,i)=>`<button data-a="day" data-i="${i}" class="${i===dow()?"today":""} ${trained(x)?"done":""} ${i===vi?"sel":""}">${DAYS[i]}<b>${+x.slice(8)}</b><u></u></button>`).join("")}</div>
  <h2>Come ti senti oggi?</h2><div class="tl">${Object.entries(TRAFFIC).map(([key,v])=>`<button class="${key} ${tr===key?"on":""}" data-a="tr" data-k="${key}">${FACE[key]}${v.t}</button>`).join("")}</div>
  ${tr?`<div class="hint">${esc(TRAFFIC[tr].d)}</div>`:`<div class="mut" style="margin:8px 4px">Un tocco: lo registro per aiutarti a capire come vai nel tempo.</div>`}
  <h2>Fase del ciclo</h2><div class="card"><span class="tag">${esc(phaseFor(cycleWeek()).t)}</span><div class="mut" style="margin-top:6px">${esc(phaseFor(cycleWeek()).d)}</div>${rawWeek()>8?`<div class="hint">Ciclo di 8 settimane completato: valuta i progressi e riparti dalle impostazioni.</div>`:""}</div>
  <div class="card mut">💡 ${esc(MYTHS[new Date().getDate()%MYTHS.length])}</div>`;
}

// ---------- SETTIMANA ----------
function settimana(){
  return `<div class="seg"><button data-a="plan" data-p="A" class="${S.plan==="A"?"on":""}">Piano A · 2 pesi</button><button data-a="plan" data-p="B" class="${S.plan==="B"?"on":""}">Piano B · 3 pesi</button></div>
  <p class="mut" style="margin:10px 4px">Parti dal Piano A per 6–8 settimane. Se la settimana è troppo piena, elimina la corsa opzionale prima di sacrificare i glutei.</p>
  ${WEEK[S.plan].map((d,i)=>`<div class="card day ${i===dow()?"today":""}"><div class="row sp"><b>${["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"][i]}</b>${i===dow()?'<span class="tag today" style="flex:none">oggi</span>':""}</div>
  <div class="ln"><span>Mattina</span><span>${esc(d.am)}</span></div><div class="ln"><span>Sera</span><span>${esc(d.pm)}</span></div><div class="mut" style="margin-top:6px">${esc(d.note)}</div></div>`).join("")}
  <h2>Ciclo di 8 settimane</h2>${PHASES.map(p=>`<div class="card ${phaseFor(cycleWeek())===p?"":"ok"}"><span class="tag">Sett. ${p.w}</span> <b>${p.t}</b><div class="mut" style="margin-top:4px">${p.d}</div></div>`).join("")}`;
}

// ---------- PESI ----------
function pesi(){
  const k=S.openW;
  if(!k){const td=WEEK[S.plan][dow()].key;
    return Object.entries(WORKOUTS).map(([key,w])=>{const p=progress(key);return `<div class="card"><div class="row sp"><h3>${esc(w.name)}</h3>${td===key?'<span class="tag today" style="flex:none">oggi</span>':key==="C"&&S.plan==="A"?'<span class="tag" style="flex:none">Piano B</span>':""}</div><div class="mut">${esc(w.dur)} · ${w.ex.length} esercizi${p.d?` · ${p.d}/${p.t} serie oggi`:""}</div><div style="height:12px"></div><button class="btn ${td===key?"":"s"}" data-a="open" data-w="${key}">Apri scheda</button></div>`}).join("");}
  const w=WORKOUTS[k],deload=cycleWeek()===7,p=progress(k);
  return `<button class="back" data-a="back">‹ Schede</button><h3 style="font-size:22px;margin:0 4px">${esc(w.name)}</h3>
  <div class="bar" style="margin:10px 4px;background:var(--line)"><i style="width:${p.pct}%"></i></div><div class="mut" style="margin:0 4px">${p.d}/${p.t} serie completate</div>
  ${mobBlock(k,w)}
  ${deload?`<div class="hint warn">Settimana 7 – scarico: riduci di circa 30–40% le serie (es. ${Math.max(1,w.ex[0].sets-1)} invece di ${w.ex[0].sets}).</div>`:""}
  ${w.ex.map(ex=>{
    const d=getDraft(ex),sg=suggest(ex),fin=d.sets.every(s=>s.done),pr=prevLog(ex.id);
    const pts=(S.logs[ex.id]||[]).map(e=>({d:e.d,v:Math.max(0,...doneSets(e).map(s=>num(s.kg)))})).filter(q=>q.v);
    if(fin&&d.rir!=null&&!exOpen[ex.id])return `<div class="card ex fin" data-a="exopen" data-e="${ex.id}"><div class="hd"><div><h3 style="font-size:16px">${esc(ex.n)}</h3><div class="mut">${d.sets.map(s=>`${s.kg}×${s.rep}`).join(" · ")} · RIR ${d.rir} · tocca per modificare</div></div><div class="chk">✓</div></div></div>`;
    return `<div class="card ex ${fin?"fin":""}"><div class="hd"><div><h3>${esc(ex.n)}</h3><div class="mut">${ex.sets} × ${ex.reps[0]}–${ex.reps[1]}${ex.per?" per lato":""} · recupero ${ex.rest}</div></div><div class="chk">${fin?"✓":""}</div></div>
    ${pr?`<div class="mut" style="margin-top:6px">Ultima volta (${fdate(pr.d)}): ${doneSets(pr).map(s=>`${s.kg}×${s.rep}`).join(" · ")}</div>`:""}
    ${sg?`<div class="hint">${esc(sg.txt)}${sg.up?` <b data-a="apply" data-e="${ex.id}" data-kg="${sg.kg}" style="text-decoration:underline;white-space:nowrap">Applica ${sg.kg} kg</b>`:""}</div>`:""}
    <div class="sets h"><span></span><span>KG</span><span>${ex.per?"REP/LATO":"REP"}</span><span></span></div>
    ${d.sets.map((s,i)=>`<div class="sets ${s.done?"dn":""}"><span class="mut">${i+1}</span><input type="number" inputmode="decimal" step="0.5" placeholder="kg" value="${esc(s.kg)}" data-c="set" data-e="${ex.id}" data-i="${i}" data-f="kg"><input type="number" inputmode="numeric" placeholder="rep" value="${esc(s.rep)}" data-c="set" data-e="${ex.id}" data-i="${i}" data-f="rep"><button class="ck ${s.done?"on":""}" aria-label="Serie ${i+1} fatta" data-a="done" data-e="${ex.id}" data-i="${i}">${ICON.check}</button></div>`).join("")}
    <div class="mut" style="margin:12px 2px 6px">Quante ripetizioni ti restavano? (RIR)</div>
    <div class="chips">${[0,1,2,3,4].map(r=>`<button class="${d.rir===r?"on":""}" data-a="rir" data-e="${ex.id}" data-r="${r}">${r===4?"4+":r}</button>`).join("")}</div>
    <details><summary>Consigli tecnici e andamento</summary><div class="mut">${esc(ex.tip)}</div>${chart(pts,"var(--pri)"," kg")}</details></div>`}).join("")}`;
}

function mobBlock(k,w){
  const m=(S.mob[today()]||{})[k]||{},list=MOBILITY[k]||[],n=list.filter((_,i)=>m[i]).length;
  return `<div class="card"><div class="row sp"><h3>Riscaldamento e mobilità</h3><span class="tag" style="flex:none">${n}/${list.length}</span></div><div class="mut" style="margin-bottom:6px">${esc(w.warm)}</div>
  ${list.map((x,i)=>`<button class="mob ${m[i]?"on":""}" data-a="mob" data-w="${k}" data-i="${i}"><span class="mk">${m[i]?ICON.check:""}</span><span><b>${esc(x[0])}</b> · ${esc(x[1])}<br><span class="mut">${esc(x[2])}</span></span></button>`).join("")}</div>`;
}

// ---------- CORSA ----------
let run=null,runTimer=null,rest=null,restTimer=null;
const rdesc=r=>r.cont?"25–30 min corsa facile continua (se le settimane precedenti sono agevoli)":`${r.n} × (${r.r>=60&&r.r%60===0?r.r/60+" min":r.r+" s"} corsa + ${r.c>=60&&r.c%60===0?r.c/60+" min":r.c+" s"} cammino)`;
function corsa(){
  const nxt=(RUN.find(r=>!S.runDone[r.w])||{}).w;
  return `<p class="mut" style="margin:6px 4px">Corsa davvero facile: riesci a dire una frase intera (RPE 3–4/10). Ogni sessione include 5 min di cammino iniziale e finale. Ripeti la settimana se hai fiato affannoso, dolori o poco recupero.</p>
  ${RUN.map(r=>`<div class="card ${S.runDone[r.w]?"ok":""}" ${r.w===nxt?'style="border:2px solid var(--pri)"':""}><div class="row sp"><h3>Settimana ${r.w}</h3><span class="tag" style="flex:none">${r.tot}</span></div><div class="mut">${rdesc(r)}</div><div style="height:12px"></div>
  <div class="row"><button class="btn sm" data-a="run" data-w="${r.w}">▶ Avvia</button><button class="btn sm ${S.runDone[r.w]?"":"s"} line" data-a="rundone" data-w="${r.w}">${S.runDone[r.w]?"✓ Fatta":"Segna fatta"}</button></div></div>`).join("")}`;
}
function runSteps(wk){const r=RUN.find(x=>x.w==wk),s=[["Cammino di riscaldamento",300,"walk"]];for(let i=0;i<r.n;i++){s.push(["CORRI",r.r,"run"]);if(r.c)s.push(["Cammina",r.c,"walk"])}s.push(["Defaticamento",300,"walk"]);return s}
function startRun(wk){
  const steps=runSteps(wk);run={wk,steps,total:steps.reduce((a,s)=>a+s[1],0),t0:Date.now(),acc:0,paused:false,idx:0,done:false};
  const o=$("#overlay");o.hidden=false;o.className="walk";
  o.innerHTML=`<div class="mut" style="text-align:center" id="rStep"></div><div class="ph" id="rPh"></div><div class="big" id="rT"></div><div class="mut" style="text-align:center" id="rNext"></div><div class="bar" style="background:var(--line)"><i id="rBar" style="width:0"></i></div><div class="mut" style="text-align:center" id="rTot"></div><div style="flex:1"></div><div id="rBtns"></div>`;
  $("#rBtns").innerHTML=`<button class="btn" data-a="rpause" id="rP">⏸ Pausa</button><div style="height:10px"></div><button class="btn line" data-a="rstop">Ferma</button>`;
  clearInterval(runTimer);runTimer=setInterval(tick,250);tick();wake(true);beep(1);
}
function elapsed(){return run.acc+(run.paused?0:(Date.now()-run.t0)/1000)}
function tick(){
  if(!run)return;
  const el=elapsed();let c=0,idx=run.steps.length-1,left=0;
  if(el>=run.total){run.done=true;clearInterval(runTimer);beep(3);
    $("#overlay").className="";$("#rPh").textContent="Fatto! 🎉";$("#rT").textContent="";$("#rNext").textContent="";$("#rStep").textContent="";$("#rBar").style.width="100%";
    $("#rBtns").innerHTML=`<button class="btn" data-a="rfinish">Segna settimana ${run.wk} completata</button><div style="height:10px"></div><button class="btn line" data-a="rstop">Chiudi</button>`;return}
  for(let i=0;i<run.steps.length;i++){if(el<c+run.steps[i][1]){idx=i;left=c+run.steps[i][1]-el;break}c+=run.steps[i][1]}
  if(idx!==run.idx){run.idx=idx;beep(run.steps[idx][2]==="run"?2:1)}
  const s=run.steps[idx],n=run.steps[idx+1];
  $("#overlay").className=s[2];$("#rPh").textContent=s[0];$("#rT").textContent=fmt(left);
  $("#rStep").textContent=`Fase ${idx+1} di ${run.steps.length}`;$("#rNext").textContent=n?`Poi: ${n[0]} ${fmt(n[1])}`:"Ultima fase";
  $("#rBar").style.width=(el/run.total*100)+"%";$("#rTot").textContent=`${fmt(el)} / ${fmt(run.total)}`;
}
function endRun(){clearInterval(runTimer);run=null;$("#overlay").hidden=true;$("#overlay").innerHTML="";wake(wantWake())}

// ---------- recupero tra le serie ----------
function startRest(sec){rest={end:Date.now()+sec*1000,fin:false};clearInterval(restTimer);restTimer=setInterval(restTick,250);restTick()}
function restTick(){
  const el=$("#rest");if(!rest){el.hidden=true;return}
  const l=(rest.end-Date.now())/1000;el.hidden=false;
  if(l<=0){if(!rest.fin){rest.fin=true;beep(2);rest.hide=Date.now()+4000}
    if(Date.now()>rest.hide){stopRest();return}
    el.innerHTML=`<b>Via! 💪</b><button data-a="rstop2">OK</button>`;return}
  el.innerHTML=`<div style="flex:1"><span>Recupero</span><br><b>${fmt(l)}</b></div><button data-a="radd">+30s</button><button data-a="rstop2">✕</button>`;
}
function stopRest(){rest=null;clearInterval(restTimer);$("#rest").hidden=true}

// ---------- CHECK-IN ----------
const todayC=()=>S.checkins.find(c=>c.d===today())||{};
function setC(k,v){let e=S.checkins.find(c=>c.d===today());if(!e){e={d:today()};S.checkins.push(e);S.checkins.sort((a,b)=>a.d<b.d?-1:1)}e[k]=v;save()}
let metric="weight";
const METRICS={weight:["Peso","kg","var(--pri)"],waist:["Vita","cm","var(--y)"],protein:["Proteine","g","var(--g)"],sleep:["Sonno","h","var(--b)"]};
function stepper(k,l,step,unit,ph){const v=todayC()[k]??"";return `<label class="l">${l}</label><div class="stp"><button data-a="step" data-k="${k}" data-s="${-step}">−</button><input type="number" inputmode="decimal" step="any" placeholder="${ph||unit}" value="${esc(v)}" data-c="ci" data-k="${k}"><button data-a="step" data-k="${k}" data-s="${step}">+</button></div>`}
function chips5(k,l){const v=todayC()[k];return `<label class="l">${l}</label><div class="chips">${[1,2,3,4,5].map(n=>`<button class="${v==n?"on":""}" data-a="chip" data-k="${k}" data-v="${n}">${n}</button>`).join("")}</div>`}
function checkin(){
  const c=todayC(),pts=S.checkins.filter(x=>x[metric]!==""&&x[metric]!=null&&!isNaN(num(x[metric]))).map(x=>({d:x.d,v:num(x[metric])}));
  const last7=S.checkins.slice(-7).map(x=>num(x[metric])).filter(v=>!isNaN(v)),av=last7.length?(last7.reduce((a,b)=>a+b,0)/last7.length).toFixed(1):"–";
  const tp=TARGETS.protein;
  return `<div class="card"><h3>Oggi</h3><div class="mut">Si salva da solo mentre scrivi.</div>
  ${stepper("weight","Peso (kg)",.1,"kg")}${stepper("sleep","Sonno (ore)",.5,"h")}${chips5("energy","Energia (1 = a terra, 5 = al top)")}${chips5("hunger","Fame (1–5)")}
  ${stepper("protein",`Proteine (obiettivo ${tp[0]}–${tp[1]} g)`,10,"g")}${stepper("water","Acqua (litri)",.25,"L")}
  <details><summary>Misure (ogni 2–4 settimane)</summary>${stepper("waist","Vita (cm)",.5,"cm")}${stepper("hips","Fianchi (cm)",.5,"cm")}</details>
  <label class="l">Note / ciclo (facoltativo)</label><input type="text" value="${esc(c.note||"")}" data-c="ci" data-k="note" placeholder="Es. gambe pesanti"></div>
  <h2>Come ti sei sentito negli ultimi 14 giorni</h2><div class="card"><div class="moods">${moodStrip()}</div>${moodNote()}</div>
  <h2>Andamento</h2><div class="seg">${Object.entries(METRICS).map(([k,m])=>`<button class="${metric===k?"on":""}" data-a="metric" data-k="${k}">${m[0]}</button>`).join("")}</div>
  <div class="card"><div class="mut">Media ultimi 7: <b>${av} ${METRICS[metric][1]}</b></div>${chart(pts,METRICS[metric][2]," "+METRICS[metric][1])}</div>
  <div class="hint">Peso stabile ≠ fallimento. Dopo 8–12 settimane valuta carichi/rep, misure e foto. Se la forza cala e la fatica sale, controlla recupero e alimentazione prima di tagliare calorie.</div>`;
}

function moodStrip(){
  const out=[];for(let i=13;i>=0;i--){const dt=iso(new Date(Date.now()-i*864e5)),v=S.traffic[dt];out.push(`<span title="${dt}">${v?FACE[v]:'<i></i>'}</span>`.replace("<svg",`<svg class="m ${v||""}"`))}
  return out.join("");
}
function moodNote(){
  const e=Object.entries(S.traffic);if(e.length<14)return `<div class="mut" style="margin-top:8px">Dopo 2 settimane di dati qui vedrai come cambia il tuo stato di forma.</div>`;
  const c={verde:0,giallo:0,rosso:0};e.forEach(([,v])=>c[v]++);
  return `<div class="mut" style="margin-top:8px">Finora: ${c.verde} giorni Top, ${c.giallo} Così così, ${c.rosso} Non in forma.</div>`;
}

// ---------- IMPOSTAZIONI ----------
function setup(){
  return `<label class="l">Tema</label><div class="seg">${[["auto","Auto"],["light","Chiaro"],["dark","Scuro"]].map(([k,n])=>`<button data-a="theme" data-k="${k}" class="${S.theme===k?"on":""}">${n}</button>`).join("")}</div>
  <label class="l">Piano attivo</label><div class="seg"><button data-a="plan" data-p="A" class="${S.plan==="A"?"on":""}">A · 2 pesi</button><button data-a="plan" data-p="B" class="${S.plan==="B"?"on":""}">B · 3 pesi</button></div>
  <label class="l">Data di inizio ciclo</label><input type="date" id="st" value="${S.start}" data-c="start">
  <h2>Dati</h2><div class="card"><div class="mut">I dati restano solo su questo dispositivo. Esporta un backup ogni tanto.</div><div style="height:12px"></div><button class="btn s" data-a="export">Esporta backup</button><div style="height:10px"></div><button class="btn s" data-a="import">Importa backup</button><input type="file" id="fi" accept="application/json" hidden><div style="height:10px"></div><button class="btn d" data-a="reset">Azzera tutto</button></div>
  <p class="mut" style="margin:10px 4px">Proposta pratica, non prescrizione medica.</p>`;
}

const VIEWS={oggi,settimana,pesi,corsa,checkin,setup};

// ---------- azioni (delegation) ----------
const A={
  open:d=>{S.openW=d.w;S.tab="pesi";save();render(false)},
  back:()=>{S.openW=null;save();render(false)},
  tab:d=>go(d.t),
  day:d=>{viewDay=+d.i;viewDate=today();render()},
  mob:d=>{const m=((S.mob[today()]=S.mob[today()]||{})[d.w]=S.mob[today()][d.w]||{});m[d.i]=!m[d.i];save();render()},
  tr:d=>{S.traffic[today()]=d.k;save();render()},
  plan:d=>{S.plan=d.p;save();render()},
  theme:d=>{S.theme=d.k;save();applyTheme();render()},
  apply:d=>{const ex=allEx(d.e),dr=getDraft(ex);dr.sets.forEach(s=>{if(!s.done){s.kg=d.kg;s.rep=ex.reps[0]}});persist(d.e);render();toast(`Impostato ${d.kg} kg`)},
  done:d=>{const ex=allEx(d.e),dr=getDraft(ex),s=dr.sets[+d.i];
    if(!s.done&&!(num(s.kg)>0&&num(s.rep)>0)){toast("Inserisci kg e rep");return}
    s.done=!s.done;persist(d.e);
    if(s.done&&dr.sets.some(x=>!x.done))startRest(restSecs(ex));
    if(dr.sets.every(x=>x.done)){stopRest();toast("Esercizio completato ✓")}
    render()},
  rir:d=>{const ex=allEx(d.e),dr=getDraft(ex);dr.rir=dr.rir===+d.r?null:+d.r;persist(d.e);render()},
  run:d=>startRun(d.w),
  rundone:d=>{S.runDone[d.w]=!S.runDone[d.w];save();render()},
  rpause:()=>{if(run.paused){run.t0=Date.now();run.paused=false;$("#rP").textContent="⏸ Pausa"}else{run.acc=elapsed();run.paused=true;$("#rP").textContent="▶ Riprendi"}},
  rstop:()=>{if(run&&!run.done&&!confirm("Fermare la sessione?"))return;endRun()},
  rfinish:()=>{S.runDone[run.wk]=true;save();endRun();render();toast("Settimana segnata ✓")},
  radd:()=>{if(rest){rest.end+=30000;rest.fin=false}},
  rstop2:()=>stopRest(),
  exopen:d=>{exOpen[d.e]=true;render()},
  step:(d,b)=>{const inp=b.parentElement.querySelector("input"),cur=num(inp.value);
    let v;if(isNaN(cur)){const base=num(lastVal(d.k))||DEFC[d.k]||0;v=base+(DEFC[d.k]===0?+d.s:0)}else v=cur+ +d.s;
    const r=Math.max(0,Math.round(v*100)/100);inp.value=r;setC(d.k,r);toast("Salvato")},
  chip:d=>{setC(d.k,+d.v);render()},
  metric:d=>{metric=d.k;render()},
  export:()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:"application/json"}));a.download=`allenamenti-${today()}.json`;a.click()},
  import:()=>$("#fi").click(),
  reset:()=>{if(confirm("Cancellare tutti i dati? Non si può annullare.")){S=defState();S.tab="setup";save();applyTheme();render(false)}}
};
const DEFC={weight:60,sleep:7,protein:100,water:0,waist:70,hips:95},exOpen={};
const lastVal=k=>{const a=S.checkins.filter(c=>c[k]);return a.length?a[a.length-1][k]:""};
const allEx=id=>Object.values(WORKOUTS).flatMap(w=>w.ex).find(e=>e.id===id);
const CH={
  set:t=>{const ex=allEx(t.dataset.e),dr=getDraft(ex),i=+t.dataset.i,f=t.dataset.f;dr.sets[i][f]=t.value;
    // propaga ai set successivi non ancora fatti
    for(let j=i+1;j<dr.sets.length;j++){if(!dr.sets[j].done){dr.sets[j][f]=t.value;const o=document.querySelector(`[data-e="${ex.id}"][data-i="${j}"][data-f="${f}"]`);if(o)o.value=t.value}}
    if(dr.sets[i].done||dr.sets.some(s=>s.done))persist(ex.id)},
  ci:t=>{setC(t.dataset.k,t.dataset.k==="note"?t.value:t.value===""?"":num(t.value));toast("Salvato")},
  start:t=>{S.start=t.value||today();save();render()}
};
$("#view").addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(b)A[b.dataset.a]?.(b.dataset,b)});
$("#overlay").addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(b)A[b.dataset.a]?.(b.dataset,b)});
$("#rest").addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(b)A[b.dataset.a]?.(b.dataset,b)});
$("#view").addEventListener("change",e=>{const c=e.target.dataset.c;if(c)CH[c]?.(e.target);if(e.target.id==="fi"||false){}});
document.addEventListener("change",async e=>{if(e.target.id==="fi"){try{S=Object.assign(defState(),JSON.parse(await e.target.files[0].text()),{tab:"setup"});save();applyTheme();render(false);toast("Backup importato")}catch(x){alert("File non valido")}}});

applyTheme();render(false);
if("serviceWorker"in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("sw.js").catch(()=>{});
