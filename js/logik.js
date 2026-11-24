// Montagmorgen: Logik
// Spielregeln: Baender, Maschinen, Sammelstationen, Spielfigur. Zeichnet nichts.
import {JUNK,TENT_LOAD,TENT_TIME,AUTO_CAP,AUTO_RATE,BT,DX,DY,GOALS,MH,MW,OPEN,RAW,ST_CAP,T,TY,euro} from './konstanten.js';
import {abR,bspd,isSt,st,stR,toast,ui} from './zustand.js';
import {AUTO,belts,blds,findPath,foot,grid,los,near,nearTent,nearestIn,removeItem,setTentGone,tentsLeft} from './welt.js';

function pop(x,y,txt,col,big){st.pops.push({x,y,txt,col:col||'#ffe27a',t:0,big:!!big})}
function msg(txt,x,y){if(st.t-st.lastMsg>1){st.lastMsg=st.t;st.pops.push({x:x==null?st.player.x:x,y:y==null?st.player.y-34:y,txt,col:'#ff9a7a',t:0})}}
function pay(c,x,y,col,big){ui.busyT=st.t;st.money+=c;st.earned+=c;if(x!=null)pop(x,y,'+'+euro(c),col,big)}
function fly(ty,x0,y0,x1,y1,d){st.fly.push({ty,x0,y0,x1,y1,t:0,d:d||0.3,rot:Math.random()*6.28})}
// Ein Stueck kommt in Fahrtrichtung dir auf Feld x,y an
// Doppelband: Die zweite Spur haengt als b am Feld. pref waehlt sie zuerst, lane merkt sich die belegte Spur
let lane=null;
function tryPush(x,y,ty,dir,pref){if(x<0||y<0||x>=MW||y>=MH)return false;const o=grid[y*MW+x];if(!o)return false;
  if(o.k==='belt'){if(o.dir===(dir+2)%4)return false;const l=o.b&&pref&&o.b.item<0?o.b:o.item<0?o:o.b&&o.b.item<0?o.b:null;if(!l||((o.lf==null?o.from:o.lf)===dir&&rival(o,dir)))return false;l.item=ty;l.prog=0;l.from=dir;o.lf=dir;lane=l;return true}
  return accept(o,ty,dir)}
// Reissverschluss: Kam das letzte Stueck aus derselben Richtung und wartet ein anderes Band fertig am Feld, ist das zuerst dran
function rival(o,dir){for(let d=0;d<4;d++){if(d===dir)continue;const x=o.x-DX[d],y=o.y-DY[d];if(x<0||y<0||x>=MW||y>=MH)continue;const n=grid[y*MW+x];if(n&&n.k==='belt'&&n.dir===d&&((n.item>=0&&n.prog>=1)||(n.b&&n.b.item>=0&&n.b.prog>=1)))return true}return false}
function accept(b,ty,dir){
  if(b.k==='auto'){if(ty>=RAW&&!JUNK(ty)){st.viaBelt++;st.sold[ty]++;pay(TY[ty].val,b.x*T+50,b.y*T+20,'#ffd23e',true);return true}if(b.q.length<AUTO_CAP){st.viaBelt++;b.q.push(ty);return true}return false}
  if(b.k==='cross'){const a=dir%2;if(b.it[a]>=0)return false;b.it[a]=ty;b.dr[a]=dir;b.wt[a]=0.45/bspd();return true}
  if(b.k==='split'||b.k==='sort'){if(b.item>=0)return false;b.item=ty;b.wait=0.45/bspd();b.from=dir;return true}
  const R=BT[b.k].inp;if(R&&R[ty]!=null&&b.buf[ty]<R[ty]*2){b.buf[ty]++;return true}return false}
// Ausgang = angrenzendes Band, das vom Gebaeude wegfuehrt. Ein Sortierer reicht an einen Nachbarn nur geradeaus weiter,
// in eine Kreuzung ebenso, sonst landet ein Stueck in einem Nachbarn ohne Ausweg. Haengt es laenger als zwei Sekunden fest, ist jeder Nachbar recht.
function pushOut(b,ty,ex){const c=[],pass=b.k==='split'||b.k==='sort';
  for(let d=0;d<4;d++){if(d===ex)continue;const n=d%2?b.w:b.h;for(let k=0;k<n;k++){const x=d===0?b.x+b.w:d===2?b.x-1:b.x+k,y=d===1?b.y+b.h:d===3?b.y-1:b.y+k;
    if(x<0||y<0||x>=MW||y>=MH)continue;const o=grid[y*MW+x];if(o&&((o.k==='belt'&&o.dir===d)||(pass&&(o.k==='split'||o.k==='sort')&&(b.wait<-2||(b.k==='sort'?d===b.from:d!==(b.from+2)%4)))||(pass&&o.k==='cross'&&d===b.from)))c.push(x,y,d)}}
  if(pass&&!c.length)c.push(...sideOuts(b,ex));
  const n=c.length/3;for(let i=0;i<n;i++){const j=((b.rr+i)%n)*3;if(tryPush(c[j],c[j+1],ty,c[j+2])){b.rr=(b.rr+i+1)%n;return true}}return false}
// Kurve direkt am Verteiler oder Sortierer: Ohne geraden Ausgang nimmt auch ein Band daneben, das quer wegfuehrt
function sideOuts(b,ex){const c=[];for(let d=0;d<4;d++){if(d===ex)continue;const x=b.x+DX[d],y=b.y+DY[d];if(x<0||y<0||x>=MW||y>=MH)continue;const o=grid[y*MW+x];if(o&&o.k==='belt'&&o.dir%2!==d%2)c.push(x,y,d)}return c}
// Hat ein Verteiler oder Sortierer einen geraden Ausgang fuer durchlaufende Ware? Sonst gilt die Kurve
function straightOut(b){const ex=b.k==='sort'?b.dir:-1;for(let d=0;d<4;d++){if(d===ex)continue;const x=b.x+DX[d],y=b.y+DY[d];if(x<0||y<0||x>=MW||y>=MH)continue;const o=grid[y*MW+x];if(o&&((o.k==='belt'&&o.dir===d)||o.k==='split'||o.k==='sort'||o.k==='cross'))return true}return false}
// Zahl der moeglichen Ausgaenge eines Gebaeudes, gleiche Nachbarschaft wie pushOut
function outCount(b){let c=0;const pass=b.k==='split'||b.k==='sort';
  for(let d=0;d<4;d++){const n=d%2?b.w:b.h;for(let k=0;k<n;k++){const x=d===0?b.x+b.w:d===2?b.x-1:b.x+k,y=d===1?b.y+b.h:d===3?b.y-1:b.y+k;
    if(x<0||y<0||x>=MW||y>=MH)continue;const o=grid[y*MW+x];if(o&&((o.k==='belt'&&o.dir===d)||(pass&&(o.k==='split'||o.k==='sort'||o.k==='cross'))))c++}}return c+(pass?sideOuts(b,-1).length/3:0)}
// Warum ein Gebaeude gerade nicht weiterkommt, leer wenn alles laeuft. Aendert nichts am Zustand.
function jam(b){const stuck=()=>outCount(b)?'Stau am Ausgang':'Kein Ausgang: Band wegführen';
  if(b.k==='auto')return b.q.length>=AUTO_CAP?(st.ph>=2?'Voll. Pressen entlasten':'Warteschlange voll'):'';
  if(b.k==='station')return b.buf.length>=ST_CAP?stuck():b.empty&&!b.buf.length&&st.left[0]+st.left[1]+st.left[2]+st.left[3]>0?'Umkreis leer: versetzen':''; // ist die Wiese leer, gibt es nichts mehr zu warnen
  if(b.k==='ab')return b.buf.length>=ST_CAP?stuck():'';
  if(b.k==='split'||b.k==='sort')return b.item>=0&&b.wait<-1?stuck():'';
  if(b.k==='cross')return(b.it[0]>=0&&b.wt[0]<-1)||(b.it[1]>=0&&b.wt[1]<-1)?'Stau hinter der Kreuzung':'';
  return BT[b.k].inp&&b.out>=2?stuck():''}
// Baender werden vom Ende jeder Kette her abgearbeitet. So rueckt eine volle Strecke im selben Takt dicht auf,
// unabhaengig davon, in welcher Reihenfolge sie gebaut wurde.
let order=[];
function beltOrder(){ui.orderDirty=false;order=[];const seen=new Set(),stack=[];
  for(const t0 of belts){let t=t0;while(t&&!seen.has(t)){seen.add(t);stack.push(t);const x=t.x+DX[t.dir],y=t.y+DY[t.dir],o=x<0||y<0||x>=MW||y>=MH?null:grid[y*MW+x];t=o&&o.k==='belt'?o:null}
    while(stack.length)order.push(stack.pop())}}
function updBelts(dt){if(ui.orderDirty||order.length!==belts.length)beltOrder();const v=bspd();for(const t of order){if(!t.b)mvLane(t,t,v,dt);else if(t.alt=!t.alt){mvLane(t,t,v,dt);mvLane(t,t.b,v,dt)}else{mvLane(t,t.b,v,dt);mvLane(t,t,v,dt)}}}
function mvLane(t,l,v,dt){if(l.item<0)return;l.prog+=v*dt;if(l.prog<0.999999)return;
    // Der Ueberschuss geht mit aufs naechste Feld, sonst haengt der Durchsatz an der Bildrate
    const c=Math.max(0,Math.min(t.prog-1,v*dt)),x=t.x+DX[t.dir],y=t.y+DY[t.dir];if(tryPush(x,y,l.item,t.dir,l!==t)){l.item=-1;ui.busyT=st.t;const o=grid[y*MW+x];if(o.k==='belt')lane.prog=c}else l.prog=1}
function updBld(b,dt){
  // Kreuzung: je Achse ein Platz, das Stueck faehrt in seiner Richtung geradeaus weiter
  if(b.k==='cross'){for(let a=0;a<2;a++){if(b.it[a]<0)continue;b.wt[a]-=dt;if(b.wt[a]<=0&&tryPush(b.x+DX[b.dr[a]],b.y+DY[b.dr[a]],b.it[a],b.dr[a]))b.it[a]=-1}return}
  if(b.k==='split'||b.k==='sort'){if(b.item<0)return;b.wait-=dt;if(b.wait>0)return;
    if(b.k==='sort'&&b.item===b.filter){if(tryPush(b.x+DX[b.dir],b.y+DY[b.dir],b.item,b.dir))b.item=-1;else if(b.wait<-0.5&&pushOut(b,b.item,b.dir))b.item=-1}
    else if(pushOut(b,b.item,b.k==='sort'?b.dir:-1))b.item=-1;return}
  if(isSt(b)){updStation(b,dt);return}
  if(b.k==='auto'){b.acc+=AUTO_RATE*dt;if(b.bon>0)b.bon-=dt;
    if(b.q.length){b.spin+=dt*9;while(b.acc>=1&&b.q.length){const m=b.q.shift();b.acc-=1;b.bon=0.5;st.sold[m]++;pay(TY[m].val,b.x*T+40+Math.random()*24,b.y*T+34,'#e9eef0')}}else b.acc=Math.min(b.acc,1);return}
  const R=BT[b.k];
  if(b.t<0){if(b.out<2){let ok=true;for(const k in R.inp)if(b.buf[k]<R.inp[k])ok=false;if(ok){for(const k in R.inp)b.buf[k]-=R.inp[k];b.t=0}}}
  else{ui.busyT=st.t;b.t+=dt;b.anim+=dt;if(b.t>=R.time){b.t=-1;b.out++;b.made++}}
  if(b.out>0&&pushOut(b,R.out,-1))b.out--}
// Naechster Wegpunkt fuer eine Figur m auf dem Weg nach tx,ty. null heisst: geradeaus, kein Zelt im Weg.
// Sonst fuehrt ein Weg aussen um die Zelte (E-004). Der Weg haengt an der Figur und wird neu gesucht, wenn das Ziel das Feld wechselt.
function wayTo(m,tx,ty){if(los(m.x,m.y,tx,ty)){m.path=null;return null}const q=((ty/T)|0)*MW+((tx/T)|0);let p=m.path;
  if(!p||p.q!==q||(p.pts.length&&!los(m.x,m.y,p.pts[0].x,p.pts[0].y)))p=m.path={q,pts:findPath(m.x,m.y,tx,ty)};const a=p.pts;
  while(a.length>1&&los(m.x,m.y,a[1].x,a[1].y))a.shift();if(a.length&&Math.hypot(a[0].x-m.x,a[0].y-m.y)<3)a.shift();
  if(!a.length){if(p.ex==null){p.ex=m.x;p.ey=m.y}else if(Math.hypot(m.x-p.ex,m.y-p.ey)>40){m.path=null;return wayTo(m,tx,ty)}return null}return a[0]}
function mkHelper(b){const cx=(b.x+1)*T,cy=(b.y+1)*T;return{ab:b.k==='ab',x:cx+20,y:cy+26,wx:cx,wy:cy+30,state:'seek',load:[],target:null,cool:0,ph:Math.random()*6,dir:0,walk:false}}
function updStation(b,dt){const cx=(b.x+1)*T,cy=(b.y+1)*T,want=b.k==='ab'?2:3+st.up.crew;while(b.helpers.length<want)b.helpers.push(mkHelper(b));
  b.cool=Math.max(-dt,b.cool-dt);if(b.buf.length&&b.cool<=0&&pushOut(b,b.buf[b.buf.length-1],-1)){b.buf.pop();b.cool+=1/bspd()}
  let idle=0;for(const h of b.helpers){updHelper(h,b,cx,cy,dt);if(h.state==='idle')idle++}
  b.empty=idle===b.helpers.length}
function updHelper(h,b,cx,cy,dt){const cap=10,sp=85;h.walk=false;
  const go=(tx,ty,stop)=>{const w=wayTo(h,tx,ty);if(w){const dx=w.x-h.x,dy=w.y-h.y,d=Math.hypot(dx,dy),s=Math.min(d,sp*dt);h.x+=dx/d*s;h.y+=dy/d*s;h.dir=Math.atan2(dy,dx);h.walk=true;h.ph+=dt*11;return false}
    const dx=tx-h.x,dy=ty-h.y,d=Math.hypot(dx,dy);if(d<=stop)return true;const s=Math.min(d-stop,sp*dt);h.x+=dx/d*s;h.y+=dy/d*s;h.dir=Math.atan2(dy,dx);h.walk=true;h.ph+=dt*11;return d-s<=stop+0.01};
  // Abbautrupp (E-019): Ziel ist ein Zelt statt eines Stuecks. Der Abbau dauert TENT_TIME, das Material kommt als Ladung zurueck
  if(h.ab&&(h.state==='seek'||h.state==='walk'||h.state==='pick')){const f=h.target;
    if(h.state==='seek'){if(h.load.length)h.state='return';else{const n=nearTent(h.x,h.y,cx,cy,abR());if(n){n.cl=true;h.target=n;h.state='walk'}else h.state='idle'}}
    else if(f.o.gone){f.cl=false;h.target=null;h.state='seek'}
    else if(h.state==='walk'){if(go(f.x,f.y+6,f.r+10)){h.state='pick';h.cool=TENT_TIME}}
    else{h.cool-=dt;ui.busyT=st.t;h.ph+=dt*9;if(h.cool<=0){setTentGone(f,true);f.cl=false;for(const m of TENT_LOAD[f.o.t]||TENT_LOAD.tent){h.load.push(m);fly(m,f.x,f.y-10,h.wx,h.wy-4,0.3)}h.target=null;h.state='return'}}}
  else if(h.state==='seek'){if(h.load.length>=cap)h.state='return';else{const it=nearestIn(h.x,h.y,cx,cy,stR());
      if(it){it.claimed=true;h.target=it;h.state='walk'}else h.state=h.load.length?'return':'idle'}}
  else if(h.state==='walk'){const it=h.target;if(!it.alive)h.state='seek';else if(go(it.x,it.y,13)){h.state='pick';h.cool=0.2}}
  else if(h.state==='pick'){h.cool-=dt;if(h.cool<=0){const it=h.target;if(it.alive){removeItem(it);h.load.push(it.m);fly(it.m,it.x,it.y,h.wx,h.wy-4,0.2)}h.target=null;h.state='seek'}}
  else if(h.state==='return'){if(go(cx+8,cy+38,3)){h.state='unload';h.cool=0.1}}
  else if(h.state==='unload'){h.cool-=dt;if(h.cool<=0){if(!h.load.length)h.state='seek';else if(b.buf.length<ST_CAP){const m=h.load.pop();b.buf.push(m);fly(m,h.wx,h.wy-4,cx,cy-6,0.25);h.cool=0.08}else h.cool=0.3}}
  else{h.idleT=(h.idleT||0)+dt;if(h.idleT>2){h.idleT=0;h.state='seek'}else go(cx-26+(h.ph%4)*16,cy+44,4)}
  const dx=h.x-h.wx,dy=h.y-h.wy,d=Math.hypot(dx,dy);if(d>21){const k=(d-21)/d;h.wx+=dx*k;h.wy+=dy*k}}
function updPlayer(dt){const p=st.player,sp=110+18*st.up.shoe,cap=25+10*st.up.bag,dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);p.walk=false;
  if(d>3){const w=wayTo(p,p.tx,p.ty),ex=w?w.x-p.x:dx,ey=w?w.y-p.y:dy,e=Math.hypot(ex,ey)||1,s=Math.min(e,sp*dt);p.x+=ex/e*s;p.y+=ey/e*s;p.dir=Math.atan2(ey,ex);p.walk=true;p.ph+=dt*12}
  p.cool-=dt;if(p.cool<=0&&p.bag.length<cap){let best=null,bd=1e9;near(p.x,p.y,28,it=>{const q=Math.hypot(it.x-p.x,it.y-p.y);if(q<bd){bd=q;best=it}});
    if(best){removeItem(best);p.bag.push(best.m);fly(best.m,best.x,best.y,p.x,p.y-12,0.18);p.cool=0.085}}
  else if(p.cool<=0&&p.bag.length>=cap){let any=false;near(p.x,p.y,28,()=>{any=true});if(any)msg('Tüte voll')}
  p.ucool-=dt;if(p.ucool<=0&&p.bag.length){const ax=(AUTO.x+1)*T,ay=(AUTO.y+1.5)*T;
    if(Math.hypot(p.x-ax,p.y-ay)<88){if(AUTO.q.length<AUTO_CAP){const m=p.bag.pop();AUTO.q.push(m);fly(m,p.x,p.y-12,ax,ay-10,0.3);p.ucool=0.07}}
    else for(const b of blds){if(!isSt(b))continue;const cx=(b.x+1)*T,cy=(b.y+1)*T;if(Math.hypot(p.x-cx,p.y-cy)<62&&b.buf.length<ST_CAP){const m=p.bag.pop();b.buf.push(m);fly(m,p.x,p.y-12,cx,cy-6,0.25);p.ucool=0.07;break}}}}
// Spielende: Die Wiese ist leer, kein Zelt steht mehr (E-019), Tuete, Stationen und Annahme auch, und seit drei Sekunden bewegt sich nichts mehr
// (kein Band, keine Maschine, kein Verkauf). Was dann noch in der Anlage haengt, wird zu seinem Wert gutgeschrieben.
function finish(){let n=0,v=0;const add=(ty,k)=>{if(ty>=0&&k>0){n+=k;v+=TY[ty].val*k;st.sold[ty]+=k}};
  for(const t of belts){add(t.item,1);t.item=-1;if(t.b){add(t.b.item,1);t.b.item=-1}}
  for(const b of blds){if(b.k==='cross'){add(b.it[0],1);add(b.it[1],1);b.it=[-1,-1]}else if(b.k==='split'||b.k==='sort'){add(b.item,1);b.item=-1}
    else if(BT[b.k].inp){for(const k in b.buf){add(+k,b.buf[k]);b.buf[k]=0}add(BT[b.k].out,b.out);b.out=0}}
  st.money+=v;st.earned+=v;st.rest={n,v};st.done=true}
// Ziele: Ist das aktuelle erreicht, beginnt das naechste und schaltet seine Bauteile frei.
function goals(){st.tl=tentsLeft();st.tt=foot.length;while(st.ph<GOALS.length-1&&GOALS[st.ph].val(st)>=GOALS[st.ph].need){st.ph++;const neu=Object.keys(OPEN).filter(k=>OPEN[k]===st.ph).map(k=>BT[k]?BT[k].name:'Doppelband');
    toast('Ziel erreicht'+(neu.length?' · Neu: '+neu.join(', '):''));ui.newT=performance.now()}}
function update(dt){if(st.done)return;st.t+=dt;updBelts(dt);for(const b of blds)updBld(b,dt);updPlayer(dt);
  for(let k=st.fly.length-1;k>=0;k--){st.fly[k].t+=dt;if(st.fly[k].t>=st.fly[k].d)st.fly.splice(k,1)}
  for(let k=st.pops.length-1;k>=0;k--){st.pops[k].t+=dt;if(st.pops[k].t>1.3)st.pops.splice(k,1)}
  if(ui.resetArm>0)ui.resetArm-=dt;
  goals();
  if(ui.busyT>st.t)ui.busyT=st.t;
  if(st.left[0]+st.left[1]+st.left[2]+st.left[3]===0&&!st.tl&&!st.player.bag.length&&!AUTO.q.length&&st.t-ui.busyT>3&&blds.every(b=>!isSt(b)||(!b.buf.length&&b.helpers.every(h=>!h.load.length))))finish()}

export {jam,msg,pop,straightOut,tryPush,update};
