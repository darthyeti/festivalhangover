// Montagmorgen: Eingabe und Schleife
// Einstiegspunkt: Zeigerereignisse, Tastatur, Spielschleife, Testzugang window.__G.
import {PROFIT,DX,DY,HOT,MH,MW,RAW,T,TOOLS,VIEW,WH,WW} from './konstanten.js';
import {cam,isOpen,nSort,nextSort,resetState,st,ui} from './zustand.js';
import {AUTO,belts,blds,blocked,cells,findPath,foot,genWorld,grid,los,removeItem} from './welt.js';
import {jam,msg,tryPush,update} from './logik.js';
import {FX,SEL,amb,pause,setup,sfx,wake} from './ton.js';
import {beltSwap,build,buildPlan,buyUp,crossOver,demolish,load,moveTo,planBelt,planEnds,rec,save,setBelt,stepBegin,stepEnd,undo,widen} from './bauen.js';
import {MM,S,movePos,btns,buildGround,buildItemLayer,buildMini,buildSprites,cv,draw,dropItemLayer,ghostPos,groundL,offX,offY,panelRect,ptr,resize,spr,toW} from './grafik.js';

const toL=e=>({x:(e.clientX-offX)/S,y:(e.clientY-offY)/S});
const inRect=(p,r)=>r&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
const pts=new Map();let act=null,gest=null;
function beltTo(nx,ny){const a=act;let n=0;while((a.lx!==nx||a.ly!==ny)&&n++<200){const dx=nx-a.lx,dy=ny-a.ly,d=Math.abs(dx)>=Math.abs(dy)?(dx>0?0:2):(dy>0?1:3);setBelt(a.lx,a.ly,d);a.lx+=DX[d];a.ly+=DY[d];a.dir=d;a.moved=true}}
// Bandwerkzeug, Tippen: erster Tipp setzt den Start, zweiter das Ziel und holt einen Vorschlag.
// Derselbe Punkt nochmal: einzelnes Feld setzen oder vorhandenes Band drehen.
function beltSingle(x,y){const o=grid[y*MW+x];if(o&&o.k==='belt'){rec({t:'dir',o,d:o.dir});o.dir=(o.dir+1)%4;ui.topoDirty=ui.orderDirty=true}else setBelt(x,y,ui.rot)}
function beltTap(x,y){if(x<0||y<0||x>=MW||y>=MH)return;const A=ui.planA,o=grid[y*MW+x],same=A&&((A.x===x&&A.y===y)||(o&&o.k!=='belt'&&o===grid[A.y*MW+A.x]));
  if(same){ui.planA=null;ui.plan=null;if(!o||o.k==='belt')beltSingle(x,y);return}
  if(!A){if(planEnds(x,y,true).length)ui.planA={x,y};else msg('Hier kann kein Band beginnen',x*T+16,y*T-4);return}
  const p=planBelt(A.x,A.y,x,y);ui.plan=p;if(!p)msg('Kein freier Weg',x*T+16,y*T-4)}
function miniTo(p){cam.x=(p.x-MM.x)/MM.w*WW;cam.y=(p.y-MM.y)/MM.h*WH;cam.follow=false}
cv.addEventListener('pointerdown',e=>{e.preventDefault();wake();const p=toL(e);pts.set(e.pointerId,p);ptr.x=p.x;ptr.y=p.y;ptr.inView=inRect(p,VIEW);try{cv.setPointerCapture(e.pointerId)}catch(_){}
  if(pts.size===2){act=null;stepEnd();const a=[...pts.values()];gest={cx:(a[0].x+a[1].x)/2,cy:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),camx:cam.x,camy:cam.y,z:cam.z};cam.follow=false;return}
  if(e.button===1||e.button===2){act={type:'pan',x:p.x,y:p.y,camx:cam.x,camy:cam.y};cam.follow=false;return}
  for(let k=btns.length-1;k>=0;k--){const b=btns[k];if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h){if(b.on){sfx('click');b.cb()}return}}
  if(ui.menu||ui.start)return;
  if(inRect(p,MM)){act={type:'mini'};miniTo(p);return}
  if(inRect(p,panelRect)||!ptr.inView||st.done)return;
  const w=toW(p.x,p.y),tx=Math.floor(w.x/T),ty=Math.floor(w.y/T),o=tx>=0&&ty>=0&&tx<MW&&ty<MH?grid[ty*MW+tx]:null;ptr.wx=w.x;ptr.wy=w.y;
  if(ui.move){act={type:'move'};return}
  if(ui.tool!=='walk')stepBegin();
  if(ui.tool==='walk'){if(o&&o.k!=='belt'){ui.sel=o;sfx('sel',null,null,o.k);return}ui.sel=null;act={type:'walk'};st.player.tx=Math.max(8,Math.min(WW-8,w.x));st.player.ty=Math.max(8,Math.min(WH-8,w.y));cam.follow=true}
  else if(ui.tool==='belt')act={type:'belt',lx:tx,ly:ty,dir:ui.rot,moved:false}
  else if(ui.tool==='demo'){act={type:'demo'};demolish(tx,ty)}
  else if(ui.tool==='wide'){act={type:'wide'};widen(tx,ty)}
  else act={type:'place'}});
cv.addEventListener('pointermove',e=>{const p=toL(e);if(pts.has(e.pointerId))pts.set(e.pointerId,p);ptr.x=p.x;ptr.y=p.y;ptr.inView=inRect(p,VIEW)&&!inRect(p,MM)&&!inRect(p,panelRect);
  if(gest&&pts.size===2){const a=[...pts.values()],cx=(a[0].x+a[1].x)/2,cy=(a[0].y+a[1].y)/2,d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);cam.z=Math.max(0.4,Math.min(2.2,gest.z*d/Math.max(20,gest.d)));cam.x=gest.camx-(cx-gest.cx)/cam.z;cam.y=gest.camy-(cy-gest.cy)/cam.z;return}
  if(!act)return;const w=toW(p.x,p.y);
  if(act.type==='pan'){cam.x=act.camx-(p.x-act.x)/cam.z;cam.y=act.camy-(p.y-act.y)/cam.z}
  else if(act.type==='mini')miniTo(p)
  else if(act.type==='walk'){st.player.tx=Math.max(8,Math.min(WW-8,w.x));st.player.ty=Math.max(8,Math.min(WH-8,w.y))}
  else if(act.type==='belt')beltTo(Math.floor(w.x/T),Math.floor(w.y/T))
  else if(act.type==='demo')demolish(Math.floor(w.x/T),Math.floor(w.y/T),true)
  else if(act.type==='wide')widen(Math.floor(w.x/T),Math.floor(w.y/T),true)});
function pUp(e){const had=pts.has(e.pointerId);pts.delete(e.pointerId);if(pts.size<2)gest=null;if(!act||!had)return;const a=act;act=null;
  if(a.type==='belt'){if(a.moved){ui.planA=null;ui.plan=null;setBelt(a.lx,a.ly,a.dir)}else beltTap(a.lx,a.ly)}
  else if(a.type==='place'&&ptr.inView){const w=toW(ptr.x,ptr.y);ptr.wx=w.x;ptr.wy=w.y;const g=ghostPos(),o=g.x>=0&&g.y>=0&&g.x<MW&&g.y<MH?grid[g.y*MW+g.x]:null;
    if(ui.tool==='sort'&&o&&o.k==='sort')o.filter=nextSort(o.filter);else if(ui.tool==='cross'&&o&&o.k==='belt')crossOver(g.x,g.y);else if((ui.tool==='split'||ui.tool==='sort')&&o&&o.k==='belt')beltSwap(ui.tool,g.x,g.y);else build(ui.tool,g.x,g.y)}
  else if(a.type==='move'&&ui.move&&ptr.inView){const w=toW(ptr.x,ptr.y);ptr.wx=w.x;ptr.wy=w.y;const b=ui.move,g=movePos();if(moveTo(b,g.x,g.y)){ui.move=null;ui.sel=b}}
  stepEnd();if(e.pointerType!=='mouse')ptr.inView=false}
cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',pUp);cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{e.preventDefault();const p=toL(e),w0=toW(p.x,p.y);cam.z=Math.max(0.4,Math.min(2.2,cam.z*(e.deltaY<0?1.12:1/1.12)));const w1=toW(p.x,p.y);cam.x+=w0.x-w1.x;cam.y+=w0.y-w1.y;cam.follow=false},{passive:false});
const keys={};window.addEventListener('keydown',e=>{wake();const k=e.key.toLowerCase();keys[k]=true;if(ui.start){if(k==='enter'||k===' ')ui.start=false;return}if(k==='escape'&&ui.menu){ui.menu=false;ui.resetArm=0}else if(k==='r')ui.rot=(ui.rot+1)%4;else if(k==='escape'){ui.tool='walk';ui.move=null}else if(k==='z')undo();else if(HOT[k]&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&isOpen(HOT[k])){ui.tool=HOT[k];ui.sel=null;ui.move=null}});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
let rz;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(resize,120)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();pause(document.hidden)});
const BEST_KEY='festivalhangover-best';
function start(fresh){ui.trk=0;ui.trkS=null;ui.endT=0;ui.newBest=false;ui.newBestM=false;resetState();dropItemLayer();ui.tool='walk';ui.falls=[];ui.sel=null;ui.undo=[];ui.step=null;ui.move=null;ui.planA=null;ui.plan=null;ui.menu=false;ui.resetArm=0;ui.toast=null;ui.newT=-9;genWorld();if(!fresh)load();st.tt=foot.length;st.tl=foot.filter(f=>!f.o.gone).length;ui.busyT=st.t;cam.x=st.player.x+200;cam.y=st.player.y;cam.follow=true;resize();if(!spr.length)buildSprites();ui.groundDirty=false;buildGround();buildItemLayer();buildMini();ui.topoDirty=ui.orderDirty=true}
let last=0,saveT=0;function frame(t){const dt=Math.min(0.05,(t-last)/1000||0);last=t;
  const pv=260*dt/cam.z;if(keys.a||keys.arrowleft){cam.x-=pv;cam.follow=false}if(keys.d||keys.arrowright){cam.x+=pv;cam.follow=false}if(keys.w||keys.arrowup){cam.y-=pv;cam.follow=false}if(keys.s||keys.arrowdown){cam.y+=pv;cam.follow=false}
  if(!ui.menu&&!ui.start)update(dt);
  if(st.done&&!ui.endT){ui.endT=performance.now();try{const b=+localStorage.getItem(BEST_KEY)||0;ui.newBest=!b||st.t<b;ui.best=ui.newBest?st.t:b;if(ui.newBest)localStorage.setItem(BEST_KEY,String(st.t));const m=+localStorage.getItem(BEST_KEY+'-geld')||0;ui.newBestM=st.money>m;ui.bestM=Math.max(m,st.money);if(ui.newBestM)localStorage.setItem(BEST_KEY+'-geld',String(st.money))}catch(e){ui.best=st.t;ui.bestM=st.money}} // Bestzeit, einmal je Partie
  draw();{let n=0;const hw=VIEW.w/2/cam.z+64,hh=VIEW.h/2/cam.z+64;for(const b of blds)if(b.t>=0&&Math.abs((b.x+1)*T-cam.x)<hw&&Math.abs((b.y+1)*T-cam.y)<hh)n++;amb(dt,n,ui.menu||st.done)}saveT+=dt;if(saveT>15){saveT=0;save()}requestAnimationFrame(frame)}
start(false);ui.start=!navigator.webdriver; // Startbildschirm, im Testlauf uebersprungen
requestAnimationFrame(frame);
window.__G={PROFIT,ton:{FX,SEL,setup,sfx,wake},widen,draw,nSort,nextSort,get foot(){return foot},get st(){return st},get ui(){return ui},crossOver,beltSwap,save,get blds(){return blds},get belts(){return belts},get grid(){return grid},get cells(){return cells},get AUTO(){return AUTO},get blocked(){return blocked},cam,MW,MH,T,isOpen,los,findPath,
  step(sec,dt){dt=dt||1/60;for(let t=0;t<sec;t+=dt)update(dt)},build,setBelt,demolish,buyUp,tryPush,undo,moveTo,jam,planBelt,buildPlan,setTool(t){ui.tool=t},setRot(r){ui.rot=r},
  clear(x0,y0,x1,y1){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)for(const it of cells[y*MW+x].slice())removeItem(it)}};

export {start};
