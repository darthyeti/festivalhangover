// Montagmorgen: Bauen
// Bauen, Abriss, Verbesserungen, Speichern und Laden.
import {BT,DX,DY,MH,MW,SAVE_KEY,T,TENT_COST,UPS,euro} from './konstanten.js';
import {cam,st,ui,upPrice} from './zustand.js';
import {belts,blds,blocked,cells,goneTents,grid,items,loadTents,setTentGone,tentAt,tentTiles} from './welt.js';
import {msg,pop} from './logik.js';

function price(k){if(k==='station')return Math.round(1500*Math.pow(1.12,blds.filter(b=>b.k==='station').length)/10)*10;return BT[k].cost}
function freeTile(x,y){if(x<0||y<0||x>=MW||y>=MH)return false;const i=y*MW+x;return!grid[i]&&!blocked[i]&&!cells[i].length}
function canBuild(x,y,w,h){for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(!freeTile(x+i,y+j))return false;return true}
function placeB(b){for(let j=0;j<b.h;j++)for(let i=0;i<b.w;i++)grid[(b.y+j)*MW+b.x+i]=b;blds.push(b);ui.topoDirty=true}
function mkB(k,x,y,paid){const D=BT[k],b={k,x,y,w:D.w,h:D.h,paid,rr:0};
  if(k==='split'||k==='sort'){b.item=-1;b.wait=0;b.dir=ui.rot;b.filter=0;b.from=0}
  else if(k==='station'){b.buf=[];b.cool=0;b.helpers=[];b.empty=false}
  else{b.buf={};for(const t in D.inp)b.buf[t]=0;b.out=0;b.t=-1;b.anim=0;b.made=0}
  return b}
function build(k,x,y){const D=BT[k],p=price(k),mx=(x+D.w/2)*T,my=y*T-4;if(!canBuild(x,y,D.w,D.h)){msg(blockReason(x,y,D.w,D.h),mx,my);return null}if(st.money<p){msg('Zu wenig Geld',mx,my);return null}
  st.money-=p;const b=mkB(k,x,y,p);placeB(b);rec({t:'add',o:b});return b}
function blockReason(x,y,w,h,ign){for(let j=0;j<h;j++)for(let i=0;i<w;i++){const X=x+i,Y=y+j;if(X<0||Y<0||X>=MW||Y>=MH)return'Außerhalb';const q=Y*MW+X;if(grid[q]&&grid[q]!==ign)return'Belegt';if(blocked[q])return'Hier steht ein Zelt';if(cells[q].length)return'Erst sauber machen'}return''}
function setBelt(x,y,d){if(x<0||y<0||x>=MW||y>=MH)return false;const o=grid[y*MW+x];if(o){if(o.k==='belt'&&o.dir!==d){rec({t:'dir',o,d:o.dir});o.dir=d;ui.topoDirty=true}return o.k==='belt'}
  if(!freeTile(x,y)){msg(blockReason(x,y,1,1),x*T+16,y*T-4);return false}if(st.money<50){msg('Zu wenig Geld',x*T+16,y*T-4);return false}
  st.money-=50;const t={k:'belt',x,y,dir:d,item:-1,prog:0,from:d,feed:[d]};grid[y*MW+x]=t;belts.push(t);ui.topoDirty=true;rec({t:'add',o:t});return true}
// Zelt oder Pavillon abbauen: kostet TENT_COST, keine Erstattung, gibt die Felder frei. Nur beim Antippen, nicht beim Ziehen.
function removeTent(f,x,y){if(st.money<TENT_COST){msg('Abbauen kostet '+euro(TENT_COST),x*T+16,y*T-4);return false}st.money-=TENT_COST;setTentGone(f,true);pop(f.x,f.y-20,'−'+euro(TENT_COST),'#ff9a7a');rec({t:'tent',o:f});return true}
function demolish(x,y,noTent){if(x<0||y<0||x>=MW||y>=MH)return;const o=grid[y*MW+x];if(!o){const f=noTent?null:tentAt(x,y);if(f)removeTent(f,x,y);return}if(o.k==='auto')return;
  if(o.k==='belt'){grid[y*MW+x]=null;belts.splice(belts.indexOf(o),1);st.money+=50}
  else{for(let j=0;j<o.h;j++)for(let i=0;i<o.w;i++)grid[(o.y+j)*MW+o.x+i]=null;blds.splice(blds.indexOf(o),1);st.money+=o.paid;
    if(o.k==='station')for(const h of o.helpers)if(h.target)h.target.claimed=false}
  if(ui.sel===o)ui.sel=null;if(ui.move===o)ui.move=null;ui.topoDirty=true;rec({t:'del',o})}
// Rueckgaengig: Ein Schritt sammelt alles, was eine Geste gebaut, gedreht, abgerissen oder versetzt hat.
// Ohne offenen Schritt (Knopf im Panel, Skript ueber __G) ist jede Aenderung ein eigener Schritt.
function pushStep(s){ui.undo.push(s);if(ui.undo.length>40)ui.undo.shift()}
function stepEnd(){const s=ui.step;ui.step=null;if(s&&s.length)pushStep(s)}
function stepBegin(){stepEnd();ui.step=[]}
function rec(e){if(ui.undoing)return;if(ui.step)ui.step.push(e);else pushStep([e])}
function restore(o){const px=(o.x+(o.w||1)/2)*T,py=o.y*T-4;
  if(o.k==='belt'){if(!freeTile(o.x,o.y)){msg('Platz ist nicht mehr frei',px,py);return}if(st.money<50){msg('Zu wenig Geld',px,py);return}st.money-=50;grid[o.y*MW+o.x]=o;belts.push(o);ui.topoDirty=true;return}
  if(!canBuild(o.x,o.y,o.w,o.h)){msg('Platz ist nicht mehr frei',px,py);return}if(st.money<o.paid){msg('Zu wenig Geld',px,py);return}
  st.money-=o.paid;if(o.k==='station')for(const h of o.helpers){h.target=null;if(h.state==='walk'||h.state==='pick')h.state='seek'}placeB(o)}
function undo(){stepEnd();const s=ui.undo.pop();if(!s)return false;ui.undoing=true;
  for(let i=s.length-1;i>=0;i--){const e=s[i],o=e.o;
    if(e.t==='tent'){if(tentTiles(o).some(q=>grid[q]))msg('Platz ist nicht mehr frei',o.x,o.y-20);else{setTentGone(o,false);st.money+=TENT_COST}continue}
    const here=grid[o.y*MW+o.x]===o;
    if(e.t==='add'){if(here)demolish(o.x,o.y)}else if(e.t==='dir'){if(here){o.dir=e.d;ui.topoDirty=true}}else if(e.t==='del'){if(!here)restore(o)}else if(e.t==='move'){if(here)moveB(o,e.x,e.y)}}
  ui.undoing=false;return true}
// Versetzen: Gebaeude behaelt Inhalt und Einstellungen, kostet nichts. Baender und die Annahme lassen sich nicht versetzen.
function canMove(b,x,y){return b.k!=='belt'&&b.k!=='auto'&&blockReason(x,y,b.w,b.h,b)===''}
function moveB(b,x,y){if(!canMove(b,x,y))return false;for(let j=0;j<b.h;j++)for(let i=0;i<b.w;i++)grid[(b.y+j)*MW+b.x+i]=null;b.x=x;b.y=y;
  for(let j=0;j<b.h;j++)for(let i=0;i<b.w;i++)grid[(y+j)*MW+x+i]=b;ui.topoDirty=true;return true}
function moveTo(b,x,y){const ox=b.x,oy=b.y;if(ox===x&&oy===y)return false;if(!moveB(b,x,y)){msg(blockReason(x,y,b.w,b.h,b)||'Lässt sich nicht versetzen',(x+b.w/2)*T,y*T-4);return false}rec({t:'move',o:b,x:ox,y:oy});return true}
// Bandplaner. Ein Ende ist ein freies Feld, ein Band oder ein Gebaeude. planEnds liefert die moeglichen ersten bzw. letzten
// Bandfelder, d ist die dort erzwungene Bandrichtung (-1 = frei). An Gebaeuden schliessen Baender nur im rechten Winkel an.
function planEnds(x,y,start){if(x<0||y<0||x>=MW||y>=MH)return[];const o=grid[y*MW+x],r=[];
  if(!o){if(freeTile(x,y))r.push({x,y,d:-1});return r}
  if(o.k==='belt'){if(start){const nx=x+DX[o.dir],ny=y+DY[o.dir];if(freeTile(nx,ny))r.push({x:nx,y:ny,d:-1})}
    else for(let d=0;d<4;d++){if(d===(o.dir+2)%4)continue;const nx=x-DX[d],ny=y-DY[d];if(freeTile(nx,ny))r.push({x:nx,y:ny,d})}return r}
  if(start&&o.k==='auto')return r;
  for(let d=0;d<4;d++){const n=d%2?o.w:o.h;for(let k=0;k<n;k++){const nx=d===0?o.x+o.w:d===2?o.x-1:o.x+k,ny=d===1?o.y+o.h:d===3?o.y-1:o.y+k;
    if(freeTile(nx,ny))r.push({x:nx,y:ny,d:start?d:(d+2)%4})}}return r}
// Kuerzester freier Weg, bei gleicher Laenge der mit den wenigsten Knicken. Zustand = Feld*9+h:
// h 0..3 Fahrtrichtung, 4..7 erzwungener erster Schritt (Ausgang eines Gebaeudes), 8 freier Start.
function planBelt(ax,ay,bx,by){const S=planEnds(ax,ay,true),G=planEnds(bx,by,false);if(!S.length||!G.length)return null;
  const goal=new Map();for(const g of G){const i=g.y*MW+g.x;if(!goal.has(i))goal.set(i,[]);goal.get(i).push(g.d)}
  const dist=new Float64Array(MW*MH*9).fill(1e18),par=new Int32Array(MW*MH*9).fill(-1),hc=[],hn=[];
  const put=(n,c)=>{let i=hc.length;hc.push(c);hn.push(n);while(i>0){const p=(i-1)>>1;if(hc[p]<=c)break;hc[i]=hc[p];hn[i]=hn[p];i=p}hc[i]=c;hn[i]=n};
  const take=()=>{const n=hn[0],c=hc.pop(),m=hn.pop(),L=hc.length;if(L){let i=0;for(;;){let k=2*i+1;if(k>=L)break;if(k+1<L&&hc[k+1]<hc[k])k++;if(hc[k]>=c)break;hc[i]=hc[k];hn[i]=hn[k];i=k}hc[i]=c;hn[i]=m}return n};
  for(const s of S){const n=(s.y*MW+s.x)*9+(s.d<0?8:4+s.d);dist[n]=0;put(n,0)}
  let end=-1,endDir=-1,best=1e18;
  while(hc.length){const c=hc[0],n=take();if(c>dist[n])continue;if(c>=best)break;const i=(n/9)|0,h=n%9,x=i%MW,y=(i/MW)|0,gs=goal.get(i);
    if(gs)for(const e of gs){let ok=true,extra=0,dir=e;if(e<0)dir=h<4?h:h<8?h-4:ui.rot;else if(h<4){if(e===(h+2)%4)ok=false;else if(e!==h)extra=1}else if(h<8&&e!==h-4)ok=false;
      if(ok&&c+extra<best){best=c+extra;end=n;endDir=dir}}
    for(let d=0;d<4;d++){if(h<4&&d===(h+2)%4)continue;if(h>=4&&h<8&&d!==h-4)continue;const nx=x+DX[d],ny=y+DY[d];if(!freeTile(nx,ny))continue;
      const m=(ny*MW+nx)*9+d,nc=c+1000+(h<4&&d!==h?1:0);if(nc<dist[m]){dist[m]=nc;par[m]=n;put(m,nc)}}}
  if(end<0)return null;const path=[];for(let n=end,d=endDir;n>=0;){const i=(n/9)|0;path.push({x:i%MW,y:(i/MW)|0,d});d=n%9;n=par[n]}
  path.reverse();return{ax,ay,bx,by,path,cost:path.length*50}}
// Baut den Vorschlag als einen Rueckgaengig-Schritt. 'stale' heisst: Ein Feld des Wegs ist inzwischen belegt.
function buildPlan(p){const e=p.path[p.path.length-1];if(!p.path.every(t=>freeTile(t.x,t.y)))return'stale';if(st.money<p.cost){msg('Zu wenig Geld',e.x*T+16,e.y*T-4);return'money'}
  stepBegin();for(const t of p.path)setBelt(t.x,t.y,t.d);stepEnd();return'ok'}
function confirmPlan(){const p=ui.plan;if(!p)return;const r=buildPlan(p);if(r==='ok'){ui.plan=null;ui.planA=null}
  else if(r==='stale'){ui.plan=planBelt(p.ax,p.ay,p.bx,p.by);msg(ui.plan?'Weg neu berechnet':'Kein freier Weg mehr',p.bx*T+16,p.by*T-4)}}
function topo(){ui.topoDirty=false;for(const t of belts){t.feed=[];for(let d=0;d<4;d++){if(d===(t.dir+2)%4)continue;const x=t.x-DX[d],y=t.y-DY[d];if(x<0||y<0||x>=MW||y>=MH)continue;const o=grid[y*MW+x];
      if(o&&((o.k==='belt'&&o.dir===d)||(o.k!=='belt'&&t.dir===d)))t.feed.push(d)}if(!t.feed.length)t.feed.push(t.dir)}}
function buyUp(i){const u=UPS[i],p=upPrice(u);if(st.up[u.k]>=u.max||st.money<p)return false;st.money-=p;st.up[u.k]++;return true}
function save(){try{const bits=new Uint8Array(Math.ceil(items.length/8));items.forEach((it,i)=>{if(!it.alive)bits[i>>3]|=1<<(i&7)});let s='';for(let i=0;i<bits.length;i++)s+=String.fromCharCode(bits[i]);
  localStorage.setItem(SAVE_KEY,JSON.stringify({v:1,money:st.money,earned:st.earned,t:st.t,up:st.up,sold:st.sold,hint:st.hint,px:st.player.x,py:st.player.y,bag:st.player.bag,dead:btoa(s),tents:goneTents(),
    belts:belts.map(t=>[t.x,t.y,t.dir]),blds:blds.filter(b=>b.k!=='auto').map(b=>({k:b.k,x:b.x,y:b.y,dir:b.dir,filter:b.filter,paid:b.paid,buf:b.buf,out:b.out,made:b.made}))}))}catch(e){}}
function load(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return;const d=JSON.parse(raw);if(d.v!==1)return;
  st.money=d.money;st.earned=d.earned;st.t=d.t;Object.assign(st.up,d.up);st.sold=d.sold;st.hint=d.hint||0;const p=st.player;p.x=p.tx=d.px;p.y=p.ty=d.py;p.bag=d.bag||[];
  loadTents(d.tents);const s=atob(d.dead);items.forEach((it,i)=>{if(s.charCodeAt(i>>3)&(1<<(i&7))){it.alive=false;const c=cells[it.c];c.splice(c.indexOf(it),1);st.left[it.m]--}});
  for(const t of d.belts){const o={k:'belt',x:t[0],y:t[1],dir:t[2],item:-1,prog:0,from:t[2],feed:[t[2]]};grid[o.y*MW+o.x]=o;belts.push(o)}
  for(const q of d.blds){const b=mkB(q.k,q.x,q.y,q.paid);if(q.dir!=null)b.dir=q.dir;if(q.filter!=null)b.filter=q.filter;if(q.k==='station')b.buf=q.buf||[];else if(BT[q.k].inp){Object.assign(b.buf,q.buf);b.out=q.out||0;b.made=q.made||0}placeB(b)}
  cam.x=p.x;cam.y=p.y}catch(e){}}

export {build,buildPlan,buyUp,canBuild,canMove,confirmPlan,planBelt,planEnds,demolish,freeTile,load,moveTo,placeB,price,rec,save,setBelt,stepBegin,stepEnd,topo,undo};
