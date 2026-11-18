// Montagmorgen: Welt
// Erzeugt Lager, Hindernisse und Stuecke aus festen Zufallssamen. Haelt die Weltdaten und die raeumliche Suche.
import {MH,MW,N_CRATES,N_ITEMS,T,WH,WW,rng} from './konstanten.js';
import {st} from './zustand.js';
import {placeB} from './bauen.js';
import {eraseItem} from './grafik.js';

let grid,belts,blds,items,cells,blocked,camps,foot,AUTO;
const PYS=[WH*0.27,WH*0.74],PXS=[WW*0.22,WW*0.52,WW*0.83];
const pathY=(k,x)=>PYS[k]+26*Math.sin(x/160+k*2),pathX=(k,y)=>PXS[k]+20*Math.sin(y/90+k);
function pathDist(x,y){let d=1e9;for(let k=0;k<2;k++)d=Math.min(d,Math.abs(y-pathY(k,x)));for(let k=0;k<3;k++)d=Math.min(d,Math.abs(x-pathX(k,y)));return d}
const inYard=(x,y)=>x<9.5*T&&y>21.5*T&&y<31.5*T;
function genWorld(){
  const r=rng(11);camps=[];foot=[];let tries=0;
  const HUES=['#d9482b','#2f7fc1','#e2a21d','#4d9b54','#7b4fa8','#d8d2c0','#1f9c9c','#e06a9a'];
  while(camps.length<105&&tries++<40000){
    const x=80+r()*(WW-160),y=70+r()*(WH-140);
    if(pathDist(x,y)<56||inYard(x-70,y)||inYard(x,y))continue;
    if(camps.some(c=>Math.hypot(c.x-x,c.y-y)<150))continue;
    const c={x,y,objs:[]},nt=1+(r()*2.4|0);
    for(let k=0;k<nt;k++){const a=r()*6.28,d=k?34+r()*12:0;
      const o={t:'tent',x:x+Math.cos(a)*d*1.3,y:y+Math.sin(a)*d*0.8,col:HUES[r()*HUES.length|0],s:0.85+r()*0.3,flip:r()<0.5};
      c.objs.push(o);foot.push({x:o.x,y:o.y-7*o.s,r:25*o.s})}
    if(r()<0.5){const a=r()*6.28,o={t:'pav',x:x+Math.cos(a)*52,y:y+Math.sin(a)*34,col:r()<0.5?'#f1efe6':'#3c78b4'};c.objs.push(o);foot.push({x:o.x,y:o.y-8,r:24})}
    const nc=1+(r()*3|0);for(let k=0;k<nc;k++){const a=r()*6.28;c.objs.push({t:'chair',x:x+Math.cos(a)*(40+r()*18),y:y+Math.sin(a)*(26+r()*12),col:HUES[r()*HUES.length|0],flip:r()<0.5})}
    if(r()<0.45){const a=r()*6.28;c.objs.push({t:'grill',x:x+Math.cos(a)*50,y:y+Math.sin(a)*32})}
    if(r()<0.4){const a=r()*6.28;c.objs.push({t:'fire',x:x+Math.cos(a)*58,y:y+Math.sin(a)*36})}
    camps.push(c)}
  blocked=new Uint8Array(MW*MH);
  for(const f of foot){const x0=Math.max(0,((f.x-f.r)/T)|0),x1=Math.min(MW-1,((f.x+f.r)/T)|0),y0=Math.max(0,((f.y-f.r)/T)|0),y1=Math.min(MH-1,((f.y+f.r)/T)|0);
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(Math.hypot(tx*T+16-f.x,(ty*T+16-f.y)*1.2)<f.r*0.95)blocked[ty*MW+tx]=1}
  items=[];cells=[];for(let i=0;i<MW*MH;i++)cells.push([]);
  const gauss=()=>(r()+r()+r()-1.5)/1.5;let guard=0;const NT=N_ITEMS+N_CRATES;
  while(items.length<NT&&guard++<NT*40){
    let x,y;const crate=items.length>=N_ITEMS,mode=crate?0:r();
    if(mode<0.66){const c=camps[r()*camps.length|0],a=r()*6.28,d=26+Math.abs(gauss())*(crate?30:52);x=c.x+Math.cos(a)*d*1.3;y=c.y+Math.sin(a)*d*0.85}
    else if(mode<0.84){if(r()<0.5){x=r()*WW;y=pathY(r()*2|0,x)+gauss()*28}else{y=r()*WH;x=pathX(r()*3|0,y)+gauss()*28}}
    else{x=r()*WW;y=r()*WH}
    if(x<10||y<12||x>WW-10||y>WH-10||inYard(x,y))continue;
    if(foot.some(f=>Math.hypot(f.x-x,(f.y-y)*1.35)<f.r))continue;
    const t=r(),m=crate?3:t<0.45?0:t<0.75?1:2;
    const it={i:items.length,x,y,m,v:r()*4|0,rot:r()*12|0,alive:true,claimed:false,c:((y/T)|0)*MW+((x/T)|0)};
    items.push(it);cells[it.c].push(it)}
  st.left=[0,0,0,0];items.forEach(it=>st.left[it.m]++);st.total=items.length;
  grid=new Array(MW*MH).fill(null);belts=[];blds=[];
  AUTO={k:'auto',x:1,y:25,w:2,h:3,q:[],acc:0,spin:0,bon:0,rr:0};placeB(AUTO);
}
function near(x,y,R,fn){const x0=Math.max(0,((x-R)/T)|0),x1=Math.min(MW-1,((x+R)/T)|0),y0=Math.max(0,((y-R)/T)|0),y1=Math.min(MH-1,((y+R)/T)|0);
  for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){const c=cells[gy*MW+gx];for(let k=c.length-1;k>=0;k--){const it=c[k];if(Math.hypot(it.x-x,it.y-y)<=R)fn(it)}}}
function nearestIn(px,py,cx,cy,R){let best=null,bd=1e9;near(cx,cy,R,it=>{if(it.claimed)return;const d=Math.hypot(it.x-px,it.y-py);if(d<bd){bd=d;best=it}});return best}
function removeItem(it){if(!it.alive)return;it.alive=false;const c=cells[it.c];c.splice(c.indexOf(it),1);st.left[it.m]--;eraseItem(it)}

export {AUTO,belts,blds,blocked,camps,cells,genWorld,grid,items,near,nearestIn,pathDist,pathX,pathY,removeItem};
