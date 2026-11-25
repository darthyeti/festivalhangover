// Montagmorgen: Ton
// Geraeusche und Ambiente per Code erzeugt (Web Audio). Nur die Musik kommt aus zwei Dateien in musik/ (E-020). Importiert nur konstanten.js und zustand.js.
// Ohne Tonkontext (kein Tippen bisher, Testlauf, alter Browser) tut jede Funktion nichts.
import {VIEW} from './konstanten.js';
import {cam} from './zustand.js';

const KEY='montagmorgen2-ton',LV=[0,0.3,0.6,1],LN=['aus','leise','mittel','laut'];
const MS=1.1,MA=0.8; // Grundpegel fuer Geraeusche und Ambiente
const MM=0.55; // Grundpegel der Musik
const vol={s:2,a:2,m:1}; // Stufen fuer Geraeusche, Ambiente und Musik, Index in LV
try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d){if(d.s>=0&&d.s<4)vol.s=d.s|0;if(d.a>=0&&d.a<4)vol.a=d.a|0;if(d.m>=0&&d.m<4)vol.m=d.m|0}}catch(e){}
let ac=null,sG=null,aG=null,nBuf=null,ambOn=false,birdT=3,windT=8;
const last={};

// Der Browser erlaubt Ton erst nach einer Eingabe. eingabe.js ruft das bei jedem Tippen und Tastendruck auf.
function wake(){if(ac){if(ac.state==='suspended')ac.resume();return}
  const AC=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);if(!AC)return;try{setup(new AC())}catch(e){ac=null}}
// ctx darf auch ein OfflineAudioContext sein: So prueft der Rauchtest, dass jedes Geraeusch klingt und nicht uebersteuert.
function setup(ctx,noAmb){ac=ctx;// Weiche Begrenzung statt Kompressor: Der Kompressor des Browsers macht kurze, leise Geraeusche um den Faktor vier leiser.
  const out=ac.createWaveShaper(),cv=new Float32Array(1025);for(let i=0;i<1025;i++){const x=(i-512)/512*2;cv[i]=Math.tanh(x)}out.curve=cv;const pre=ac.createGain();pre.gain.value=0.5;pre.connect(out);out.connect(ac.destination);
  sG=ac.createGain();sG.gain.value=LV[vol.s]*MS;sG.connect(pre);aG=ac.createGain();aG.gain.value=LV[vol.a]*MA;aG.connect(pre);
  nBuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=nBuf.getChannelData(0);let s=12345;for(let i=0;i<d.length;i++){s=(s*1103515245+12345)&0x7fffffff;d[i]=s/0x3fffffff-1}
  ambOn=!noAmb}
function setVol(k){vol[k]=(vol[k]+3)%4;try{localStorage.setItem(KEY,JSON.stringify(vol))}catch(e){}if(k==='m'){if(mu)mu.volume=LV[vol.m]*MM;if(!vol.m&&mu)mu.pause();sfx('click');return}if(ac){(k==='s'?sG:aG).gain.setTargetAtTime(LV[vol[k]]*(k==='s'?MS:MA),ac.currentTime,0.05)}if(k==='s')sfx('click')}
const volName=k=>LN[vol[k]];
function pause(on){if(mu&&on)mu.pause();if(!ac||!ac.suspend)return;try{if(on)ac.suspend();else ac.resume()}catch(e){}}

// Bausteine: Ton mit Tonhoehenverlauf und Rauschen durch einen Filter, beide mit kurzer Huellkurve
// Huellkurve: kurzer Anstieg, dann faellt der Ton bis zum Ende auf ein Zwanzigstel und blendet in 20 ms aus. Ein Abfall auf fast null klingt nur wie ein Klick.
function env(g,t,dur,v,att){att=att||0.006;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+att);g.gain.exponentialRampToValueAtTime(v*0.05,t+Math.max(att+0.01,dur));g.gain.linearRampToValueAtTime(0.0001,t+Math.max(att+0.01,dur)+0.02)}
function chain(src,t,dur,v,pan,dest,att){const g=ac.createGain();env(g,t,dur,v,att);src.connect(g);let n=g;if(pan&&ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=pan;g.connect(p);n=p}n.connect(dest||sG);src.start(t);src.stop(t+dur+0.06)}
function tone(type,f0,f1,dur,v,o){o=o||{};const t=ac.currentTime+(o.d||0),os=ac.createOscillator();os.type=type;os.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)os.frequency.exponentialRampToValueAtTime(f1,t+dur);chain(os,t,dur,v,o.pan,o.dest,o.att)}
function noise(ftype,f0,f1,q,dur,v,o){o=o||{};const t=ac.currentTime+(o.d||0),src=ac.createBufferSource();src.buffer=nBuf;src.loop=true;const f=ac.createBiquadFilter();f.type=ftype;f.Q.value=q||1;
  f.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)f.frequency.exponentialRampToValueAtTime(f1,t+dur);src.connect(f);
  const g=ac.createGain();env(g,t,dur,v,o.att);f.connect(g);let n=g;if(o.pan&&ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=o.pan;g.connect(p);n=p}n.connect(o.dest||sG);src.start(t,Math.random()*1.5);src.stop(t+dur+0.06)}

// Lautstaerke und Seite aus dem Ort auf der Karte: ausserhalb des Bilds bleibt es still, weit herausgezoomt wird es leiser
function at(x,y){if(x==null)return{v:1,pan:0};const sx=(x-cam.x)*cam.z/(VIEW.w/2),sy=(y-cam.y)*cam.z/(VIEW.h/2);if(Math.abs(sx)>1.25||Math.abs(sy)>1.25)return null;return{v:Math.max(0.35,Math.min(1,cam.z)),pan:Math.max(-1,Math.min(1,sx))*0.6}}

// Kleinster Abstand zwischen zwei gleichen Geraeuschen in Millisekunden. Hunderte Verkaeufe duerfen kein Laerm werden.
const GAP={pick:45,coin:110,sale:140,pal:300,press:160,belt:35,build:60,demo:60,tent:120,err:350,click:40,sel:60,warn:6000,buy:100,goal:500,win:500};
// Antippen: jede Bauteilart hat ihren eigenen Klang
const SEL={
  auto:o=>{tone('square',1320,1320,0.07,0.1,o);tone('square',1760,1760,0.16,0.1,{d:0.08})}, // Kasse
  station:o=>{noise('bandpass',420,420,3,0.07,1.3,o);noise('bandpass',520,520,3,0.09,1.2,{d:0.11});tone('sine',210,180,0.06,0.12,o)}, // Holz, zweimal geklopft
  ab:o=>{noise('lowpass',900,300,1,0.22,0.4,o);noise('lowpass',700,250,1,0.2,0.3,{d:0.16})}, // Plane flattert
  pd:o=>{tone('square',310,290,0.12,0.12,o);noise('highpass',3000,3000,1,0.08,0.16,o);tone('triangle',930,900,0.2,0.08,o)}, // Blech
  pp:o=>{for(let k=0;k<4;k++)noise('highpass',4200+k*500,4200,1,0.035,0.15,{d:k*0.045})}, // Plastik knistert
  kp:o=>{tone('sine',2100,2090,0.22,0.14,o);tone('sine',3150,3140,0.16,0.08,o);tone('sine',2500,2490,0.2,0.1,{d:0.09})}, // Glas klirrt
  pal:o=>{tone('sine',150,70,0.2,0.28,o);noise('bandpass',350,350,3,0.08,0.4,o)}, // Holz, schwer
  pl:o=>{noise('lowpass',1200,400,1,0.16,0.4,o);tone('sine',180,110,0.16,0.25,{d:0.05})},
  sc:o=>{tone('square',220,200,0.1,0.1,o);tone('triangle',1480,1440,0.3,0.09,o);tone('triangle',2210,2180,0.24,0.06,o)}, // Rohre scheppern
  sort:o=>{tone('square',900,900,0.03,0.1,o);tone('square',1200,1200,0.03,0.1,{d:0.07})},
  split:o=>{tone('sawtooth',260,520,0.16,0.16,o)},
  cross:o=>{tone('square',700,700,0.03,0.1,o)}};
const FX={
  pick:o=>tone('sine',520+Math.random()*120,860,0.07,0.18*o.v,o),
  coin:o=>tone('triangle',1500+Math.random()*250,1500,0.05,0.07,o),
  sale:o=>{tone('triangle',990,990,0.09,0.2,o);tone('triangle',1485,1485,0.16,0.18,{d:0.07})},
  pal:o=>{[660,880,1320].forEach((f,i)=>tone('triangle',f,f,0.3,0.13,{d:i*0.07}));tone('sine',165,165,0.35,0.2,o)},
  press:o=>{tone('sine',120,48,0.16,0.24*o.v,o);noise('lowpass',900,200,1,0.09,0.25*o.v,o)},
  belt:o=>tone('square',640,640,0.025,0.06,o),
  build:o=>{noise('bandpass',700,500,4,0.07,0.5,o);tone('sine',230,170,0.09,0.22,o)},
  demo:o=>{noise('lowpass',1600,180,1,0.2,0.4,o);tone('sine',170,70,0.18,0.2,o)},
  tent:o=>{noise('lowpass',1400,220,1,0.38,0.38*o.v,{pan:o.pan,att:0.05});tone('triangle',1100,1050,0.12,0.05*o.v,{d:0.3,pan:o.pan})}, // Plane sackt zusammen, Gestaenge klappert nach
  err:o=>{tone('square',150,140,0.09,0.13,o);tone('square',130,120,0.13,0.13,{d:0.11})},
  click:o=>tone('square',820,820,0.02,0.05,o),
  buy:o=>{tone('triangle',660,660,0.08,0.2,o);tone('triangle',990,990,0.14,0.2,{d:0.08})},
  warn:o=>{tone('sine',740,740,0.14,0.22,o);tone('sine',554,554,0.22,0.22,{d:0.16})},
  goal:o=>[523,659,784,1047].forEach((f,i)=>tone('triangle',f,f,i===3?0.5:0.16,0.3,{d:i*0.11})),
  win:o=>{[523,659,784,1047,1319].forEach((f,i)=>tone('triangle',f,f,i===4?1.2:0.2,0.17,{d:i*0.13}));[262,392,523].forEach(f=>tone('sine',f,f,1.6,0.1,{d:0.52}))}};
// name: Schluessel aus FX, oder 'sel' mit der Bauteilart in k. x,y in Weltkoordinaten, ohne Ort klingt es ueberall.
const off=()=>!ac||(ac.state==='suspended'&&!ac.length); // ein OfflineAudioContext (hat length) gilt als wach, er rechnet erst spaeter
function sfx(name,x,y,k){if(off()||!vol.s)return;const now=typeof performance!=='undefined'?performance.now():0,id=name==='sel'?'sel':name;
  if(now-(last[id]||-1e9)<(GAP[id]||0))return;const o=at(x,y);if(!o)return;last[id]=now;try{if(name==='sel')(SEL[k]||SEL.cross)(o);else if(FX[name])FX[name](o)}catch(e){}}

// Ambiente: einzelne Windboeen und Voegel als kurze Pfiffe
// Kein Dauerton und kein Dauerrauschen (Till, 25.11.2026: erst Wummern, dann zu starkes Rauschen). Im Ambiente laeuft nichts durchgehend:
// ab und zu eine Windboe, die an- und abschwillt, dazwischen Voegel und Stille.
function gust(){const len=3+Math.random()*3,v=0.05+Math.random()*0.05,pan=Math.random()*1.2-0.6;noise('bandpass',700+Math.random()*500,1100+Math.random()*900,0.6,len,v,{pan,dest:aG,att:len*0.45})}
function bird(){const n=2+(Math.random()*4|0),base=2600+Math.random()*1800,pan=Math.random()*1.6-0.8,v=0.09+Math.random()*0.09;let d=0;
  for(let i=0;i<n;i++){const up=Math.random()<0.6,f=base*(0.9+Math.random()*0.25),len=0.05+Math.random()*0.07;tone('sine',f,f*(up?1.35:0.75),len,v,{d,pan,dest:aG,att:0.012});d+=len+0.03+Math.random()*0.05}}
// dt in Sekunden. work und quiet werden derzeit nicht gebraucht, die Schleife uebergibt sie weiter
function amb(dt,work,quiet){if(off()||!ambOn)return;
  windT-=dt;if(windT<=0){windT=14+Math.random()*26;if(vol.a)try{gust()}catch(e){}}
  birdT-=dt;if(birdT<=0){birdT=1.5+Math.random()*6;if(vol.a)try{bird()}catch(e){}}music(dt)}

// Musik: zwei gemeinfreie Stuecke im Wechsel (Till, 25.11.2026), dazwischen ein bis zwei Minuten ohne Musik. Quellen in musik/LIZENZ.md.
// Ein Audio-Element statt Web Audio: Es laedt im Hintergrund nach und haelt das Stueck nicht entpackt im Speicher.
const MUSIC=[['musik/etirwer.mp3','Etirwer'],['musik/apple-cider.mp3','Apple Cider']];
let mu=null,muI=0,muT=12,muGo=false;
function music(dt){if(!vol.m||typeof Audio==='undefined')return;
  if(muGo){if(mu.paused&&!mu.ended)mu.play().catch(()=>{});return} // nach Pause oder stumm geschaltet: weiter, wo es war
  muT-=dt;if(muT>0)return;
  try{if(!mu){mu=new Audio();mu.preload='auto';mu.addEventListener('ended',()=>{muGo=false;muI=(muI+1)%MUSIC.length;muT=60+Math.random()*60});mu.addEventListener('error',()=>{muGo=false;muT=120})}
    mu.src=MUSIC[muI][0];mu.volume=LV[vol.m]*MM;muGo=true;mu.play().catch(()=>{})}catch(e){muGo=false;muT=120}}
const musicNow=()=>muGo&&mu&&!mu.paused?MUSIC[muI][1]:'';

export {MUSIC,musicNow,FX,SEL,amb,pause,setVol,setup,sfx,volName,wake};
