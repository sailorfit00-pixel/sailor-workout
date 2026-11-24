// Contenuto della guida "Allenarsi con criterio" come dati
const DAYS = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];

const WEEK = {
  A: [
    {am:"—", pm:"18:00 CrossFit: squat snatch + squat clean & jerk", note:"Tecnica e potenza; evitare max frequenti", key:null},
    {am:"—", pm:"18–19:15 Sala pesi A: glutei + quadricipiti", note:"Seduta prioritaria", key:"A"},
    {am:"06:45 Corsa FACILE (opzionale in avvio)", pm:"18:00 Equitazione (piano)", note:"Se la corsa affatica, sostituisci con cammino", key:"RUN"},
    {am:"—", pm:"18:00 CrossFit: row/bike/corsa", note:"Aerobico facile-moderato", key:null},
    {am:"—", pm:"18–19:15 Sala pesi B: glutei + femorali", note:"Seduta prioritaria; no cedimento su hinge", key:"B"},
    {am:"CrossFit: aerobic + ginnastica", pm:"Equitazione (salto o piano)", note:"Doppia seduta: riduci CF se presa/core stanchi", key:null},
    {am:"Riposo / passeggiata", pm:"Riposo", note:"Almeno un giorno senza training strutturato", key:null},
  ],
  B: [
    {am:"—", pm:"18:00 CrossFit sollevamenti olimpici", note:"Tecnico, non gara di massimali", key:null},
    {am:"—", pm:"18:00 Sala pesi A: glutei + quadricipiti", note:"Priorità", key:"A"},
    {am:"Corsa facile SOLO se ben recuperata", pm:"18:00 Equitazione + 20:00 Pesi C upper/core 30–40'", note:"Se tre impegni sono troppi, niente corsa", key:"C"},
    {am:"—", pm:"18:00 CrossFit endurance", note:"RPE controllato; evita doppia corsa intensa", key:null},
    {am:"—", pm:"18:00 Sala pesi B: glutei + femorali", note:"Priorità", key:"B"},
    {am:"CrossFit aerobic/gymnastics", pm:"Equitazione pomeriggio", note:"Doppia seduta solo con recupero adeguato", key:null},
    {am:"Riposo", pm:"Riposo", note:"Non convertirlo in un WOD", key:null},
  ]
};

// reps: [min,max]; sets; per: "lato" opzionale
const WORKOUTS = {
  A: {name:"A — Glutei + quadricipiti", dur:"60–75 min",
    warm:"5–8 min leggeri + 2–4 serie di avvicinamento sui primi due esercizi (non contano). RIR 2–3 la prima settimana, poi 1–3. Se il lunedì CrossFit è stato molto pesante, riduci una serie di squat o Bulgarian.",
    ex:[
     {id:"hipthrust",n:"Hip thrust bilanciere",sets:3,reps:[6,10],rest:"2–3 min",tip:"Pausa breve in alto; bacino stabile; niente iperestensione lombare"},
     {id:"squat",n:"Squat oppure leg press",sets:3,reps:[8,12],rest:"2–3 min",tip:"Escursione controllata, profondità tollerata"},
     {id:"bulgarian",n:"Bulgarian split squat",sets:2,reps:[8,12],per:true,rest:"90–150 s",tip:"Passo e inclinazione stabili; non inseguire il bruciore"},
     {id:"abduz",n:"Abduzione macchina/cavo",sets:2,reps:[12,20],rest:"60–90 s",tip:"Controllo del bacino e dell'ultima parte del movimento"},
     {id:"crunch",n:"Crunch cavo",sets:2,reps:[10,15],rest:"60–90 s",tip:"Fletti il tronco, senza tirare con le braccia"}]},
  B: {name:"B — Glutei + femorali", dur:"60–70 min",
    warm:"Settimana di salto impegnativo: RDL a RIR 3–4, riduci da 2 a 1 serie di affondi o omettili.",
    ex:[
     {id:"rdl",n:"Romanian deadlift",sets:3,reps:[6,10],rest:"2–3 min",tip:"Anca indietro, bilanciere vicino, schiena neutra"},
     {id:"bridge",n:"Glute bridge / hip thrust variante",sets:2,reps:[8,12],rest:"2 min",tip:"Non replicare automaticamente il carico di martedì"},
     {id:"legcurl",n:"Leg curl",sets:3,reps:[10,15],rest:"90–120 s",tip:"Range controllato, senza slanci"},
     {id:"stepup",n:"Step-up oppure affondo indietro",sets:2,reps:[8,12],per:true,rest:"90–120 s",tip:"Spingi dal piede che lavora; equilibrio prima del carico"},
     {id:"pallof",n:"Pallof press",sets:2,reps:[10,12],per:true,rest:"60 s",tip:"Resisti alla rotazione, espira con controllo"}]},
  C: {name:"C — Upper body + core", dur:"30–40 min (Piano B)",
    warm:"Non è un altro allenamento pesante per le gambe.",
    ex:[
     {id:"lat",n:"Lat machine",sets:2,reps:[8,12],rest:"90 s",tip:"Controllo scapolare"},
     {id:"row",n:"Rematore seduta o cavo",sets:2,reps:[8,12],rest:"90 s",tip:"Stabile senza compensi lombari"},
     {id:"press",n:"Chest press o push-up",sets:2,reps:[8,12],rest:"90 s",tip:"Una spinta per equilibrio muscolare"},
     {id:"revcrunch",n:"Reverse crunch",sets:2,reps:[10,15],rest:"60 s",tip:"Retroversione pelvica, niente slancio"},
     {id:"sideplank",n:"Side plank / dead bug",sets:2,reps:[8,12],rest:"60 s",tip:"Antirotazione e controllo del tronco"}]}
};

const PHASES = [
  {w:"1–2",t:"Base",d:"Stessi esercizi; RIR 2–3; annota carichi, rep, tecnica e fatica. Finisci allenata, non distrutta."},
  {w:"3–4",t:"Costruzione",d:"Aumenta ripetizioni mantenendo forma; +2–5% carico solo quando chiudi l'intervallo."},
  {w:"5–6",t:"Consolidamento",d:"Mantieni 1–3 RIR; aumenta le serie solo se recuperi bene."},
  {w:"7",t:"Scarico flessibile",d:"Se fatica accumulata, riduci ~30–40% delle serie, mantieni tecnica."},
  {w:"8",t:"Valutazione",d:"Ripeti alcuni carichi di riferimento; confronta rep/RIR, vita, foto facoltative."}
];
const phaseFor = w => w<=2?PHASES[0]:w<=4?PHASES[1]:w<=6?PHASES[2]:w==7?PHASES[3]:PHASES[4];

// run: blocchi [n, corsa_s, cammino_s]
const RUN = [
 {w:1,n:8,r:60,c:120,tot:"34 min"},{w:2,n:8,r:90,c:90,tot:"34 min"},
 {w:3,n:6,r:120,c:120,tot:"34 min"},{w:4,n:5,r:180,c:120,tot:"35 min"},
 {w:5,n:4,r:300,c:120,tot:"38 min"},{w:6,n:3,r:420,c:120,tot:"37 min"},
 {w:7,n:2,r:720,c:180,tot:"37 min"},{w:8,n:1,r:1500,c:0,tot:"35–40 min",cont:true}
];

const TRAFFIC = {
  verde:{t:"Verde",d:"Sonno buono, DOMS lievi, carichi stabili → programma normale."},
  giallo:{t:"Giallo",d:"Sonno ridotto o gambe pesanti → togli 1–2 accessori, corsa facile o assente. Salto impegnativo domani → non cercare cedimento oggi."},
  rosso:{t:"Rosso",d:"Dolore, vertigini, calo marcato, malessere → interrompi e valuta supporto. Ciclo alterato, infortuni ripetuti o stanchezza persistente → verifica la salute."}
};

const TARGETS = {protein:[110,125], fat:[50,70]};
const MYTHS = ["Il peso stabile NON è un fallimento: vita, forza e forma cambiano.","Il progresso glutei = carichi/rep migliori a tecnica comparabile.","Il DOMS non misura la crescita.","1–3 RIR è spesso sufficiente: non serve sempre il cedimento.","Il recupero conta più del numero di sedute.","Non allenarti a digiuno per 'bruciare più pancia'."];
