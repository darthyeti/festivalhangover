// Montagmorgen: Grafik
// Vorgerenderte Ebenen, Sprites, Zeichenfunktionen, Oberflaeche.
import {PROFIT,HOTKEY,LAST_TENTS,TENT_TIME,AUTO_CAP,AUTO_RATE,MEDALS,BT,DX,DY,FONT,H,LS,MH,MW,GOALS,OPEN,PS,RAW,SAVE_KEY,ST_CAP,T,TENT_COST,TOOLS,TY,UPS,VERSION,VIEW,W,WH,WIDE_COST,WW,euro,rng} from './konstanten.js';
import {bspd,cam,isOpen,isSt,nextSort,st,stR,toast,ui,upPrice} from './zustand.js';
import {belts,blds,blocked,camps,cells,foot,grid,items,near,pathDist,pathX,pathY} from './welt.js';
import {buyUp,canBuild,canMove,confirmPlan,demolish,freeTile,price,save,toggleCross,topo,undo} from './bauen.js';
import {jam} from './logik.js';
import {setVol,volName} from './ton.js';
import {start} from './eingabe.js';

const cv=document.getElementById('c'),ctx=cv.getContext('2d');
let S=1,DPR=1,offX=0,offY=0,groundL,itemL,itemG,mmL,spr=[];
function dropItemLayer(){itemG=null}
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c};
function rr(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function shade(hex,a){const n=parseInt(hex.slice(1),16),t=a<0?0:255,p=Math.abs(a);const c=v=>Math.round((t-v)*p+v);return'rgb('+c(n>>16)+','+c(n>>8&255)+','+c(n&255)+')'}
function lg(g,x0,y0,x1,y1,stops){const gr=g.createLinearGradient(x0,y0,x1,y1);stops.forEach((s,i)=>gr.addColorStop(i/(stops.length-1),s));return gr}
function itemShape(g,m,v){
  if(m===0){const band=['#c62f2f','#2a66b8','#e7b923','#2f9a55'][v];
    rr(g,-7.5,-4,15,8,1.7);g.fillStyle=lg(g,0,-4,0,4,['#f4f7f8','#b4bdc3','#6c757b']);g.fill();
    g.save();g.clip();g.fillStyle=band;g.globalAlpha=0.88;g.fillRect(-4.6,-4,8.4,8);g.globalAlpha=1;
    g.fillStyle='rgba(255,255,255,.6)';g.fillRect(-7,-2.7,14,1.1);g.fillStyle='rgba(0,0,0,.22)';g.fillRect(-7.5,2.2,15,1.8);g.restore();
    g.fillStyle='#e6ebee';g.fillRect(-7.5,-3.3,1.3,6.6);g.fillRect(6.2,-3.3,1.3,6.6);
    rr(g,-7.5,-4,15,8,1.7);g.strokeStyle='rgba(30,36,40,.55)';g.lineWidth=0.6;g.stroke()}
  else if(m===1){const lab=['#e2473a','#2d9a4c','#f08a1c','#3f6fd1'][v];
    g.beginPath();g.moveTo(-10,-1.5);g.quadraticCurveTo(-10,-3.9,-7.5,-3.9);g.lineTo(3.5,-3.9);g.quadraticCurveTo(6,-3.6,7,-1.9);g.lineTo(9,-1.9);g.lineTo(9,1.9);g.lineTo(7,1.9);
    g.quadraticCurveTo(6,3.6,3.5,3.9);g.lineTo(-7.5,3.9);g.quadraticCurveTo(-10,3.9,-10,1.5);g.closePath();
    g.fillStyle=lg(g,0,-4,0,4,['rgba(235,247,255,.92)','rgba(160,208,236,.8)','rgba(96,150,186,.85)']);g.fill();
    g.save();g.clip();g.fillStyle=lab;g.fillRect(-6,-4,6.5,8);g.fillStyle='rgba(255,255,255,.7)';g.fillRect(-9.5,-2.6,13,0.9);g.fillStyle='rgba(20,60,90,.2)';g.fillRect(-10,2.3,17,1.6);g.restore();
    g.strokeStyle='rgba(40,90,125,.7)';g.lineWidth=0.6;g.stroke();g.fillStyle=shade(lab,-0.15);rr(g,9,-2.2,2.3,4.4,0.8);g.fill()}
  else if(m===2){const body=v%2?'#7a4a1c':'#3f6b2c';
    g.beginPath();g.moveTo(-10,-2);g.quadraticCurveTo(-10,-3.4,-8.5,-3.4);g.lineTo(1.5,-3.4);g.quadraticCurveTo(4.5,-3,6,-1.5);g.lineTo(9.5,-1.5);g.lineTo(9.5,1.5);g.lineTo(6,1.5);
    g.quadraticCurveTo(4.5,3,1.5,3.4);g.lineTo(-8.5,3.4);g.quadraticCurveTo(-10,3.4,-10,2);g.closePath();
    g.fillStyle=lg(g,0,-3.4,0,3.4,[shade(body,0.35),body,shade(body,-0.45)]);g.fill();
    g.save();g.clip();g.fillStyle='#efe6cf';g.fillRect(-7,-3.4,6,6.8);g.fillStyle=v<2?'#b3261e':'#1f5fa8';g.fillRect(-5.6,-1.5,3.2,3);g.fillStyle='rgba(255,255,255,.5)';g.fillRect(-9.5,-2.4,18,0.8);g.restore();
    g.strokeStyle='rgba(25,18,8,.6)';g.lineWidth=0.6;g.stroke();g.fillStyle='#d9b23a';rr(g,9.3,-1.9,1.7,3.8,0.5);g.fill()}
  else if(m===3||m===6){const c=m===6?'#b23a2e':(v%2?'#d14b3c':'#d9a521');rr(g,-9,-7,18,14,1.5);g.fillStyle=lg(g,-9,-7,9,7,[shade(c,0.2),c,shade(c,-0.3)]);g.fill();g.strokeStyle='rgba(30,10,5,.6)';g.lineWidth=0.7;g.stroke();
    for(let j=0;j<3;j++)for(let i=0;i<4;i++){g.fillStyle=m===6?'#d9b23a':'rgba(20,10,5,.55)';g.beginPath();g.arc(-6+i*4,-4+j*4,1.45,0,6.3);g.fill()}
    g.fillStyle='rgba(255,255,255,.25)';g.fillRect(-8.5,-6.5,17,1.2)}
  else if(m===4||m===5){const a=m===4?['#f1f4f6','#aab3b9','#6c757b']:['#c4e8fa','#6fb3d9','#3d7fa8'];rr(g,-8.5,-8.5,17,17,1.5);g.fillStyle=lg(g,-8,-8,8,8,a);g.fill();g.strokeStyle='rgba(20,30,40,.6)';g.lineWidth=0.7;g.stroke();
    g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=0.6;for(let q=-5;q<=5;q+=3.3){g.beginPath();g.moveTo(-8,q);g.lineTo(8,q+(q>0?1.2:-1.2));g.stroke()}
    g.strokeStyle='#23282b';g.lineWidth=1.1;g.beginPath();g.moveTo(-3,-8.5);g.lineTo(-3,8.5);g.moveTo(3,-8.5);g.lineTo(3,8.5);g.stroke();
    if(m===4){g.fillStyle='#c62f2f';g.fillRect(-7,-5,2.5,2.5);g.fillStyle='#e7b923';g.fillRect(4.5,2,2.5,2.5);g.fillStyle='#2a66b8';g.fillRect(-1,3,2.5,2.5)}}
  else if(m===8){rr(g,-8.5,-6,17,12,2);g.fillStyle=lg(g,-8,-6,8,6,['#6fd0bd','#3fa392','#23695d']);g.fill();g.strokeStyle='rgba(10,50,44,.7)';g.lineWidth=0.7;g.stroke();
    g.strokeStyle='rgba(10,50,44,.45)';g.lineWidth=0.7;g.beginPath();g.moveTo(-8.5,-1.5);g.lineTo(8.5,-1.5);g.moveTo(-8.5,2.5);g.lineTo(8.5,2.5);g.stroke();g.fillStyle='rgba(255,255,255,.3)';g.fillRect(-7.5,-5.2,15,1.2);g.fillStyle='#d9dfe2';g.beginPath();g.arc(-6,4.3,0.9,0,6.3);g.arc(6,4.3,0.9,0,6.3);g.fill()}
  else if(m===9){for(let q=0;q<3;q++){const y=-3.6+q*3.6;rr(g,-10,y-1.2,20,2.4,1.2);g.fillStyle=lg(g,0,y-1.2,0,y+1.2,['#f1f4f6','#aab3b9','#6c757b']);g.fill();g.strokeStyle='rgba(30,36,40,.6)';g.lineWidth=0.5;g.stroke()}
    g.fillStyle='#23282b';g.fillRect(-5.5,-5.4,1.6,10.8);g.fillRect(3.9,-5.4,1.6,10.8)}
  else if(m===10){rr(g,-8.5,-8.5,17,17,2.5);g.fillStyle=lg(g,-8,-8,8,8,['#8be0cf','#3fa392','#1f5d52']);g.fill();g.strokeStyle='rgba(10,50,44,.7)';g.lineWidth=0.7;g.stroke();
    g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=0.6;for(let q=-5;q<=5;q+=2.5){g.beginPath();g.moveTo(-8,q);g.lineTo(8,q);g.stroke()}g.strokeStyle='#e9b91c';g.lineWidth=1.2;g.beginPath();g.moveTo(-3,-8.5);g.lineTo(-3,8.5);g.moveTo(3,-8.5);g.lineTo(3,8.5);g.stroke()}
  else if(m===11){rr(g,-9,-8,18,16,1.2);g.fillStyle='#3a4146';g.fill();for(let j=0;j<4;j++)for(let i=0;i<4;i++){g.fillStyle=lg(g,0,-7+j*3.8,0,-4+j*3.8,['#f1f4f6','#8a949a']);g.beginPath();g.arc(-6.2+i*4.1,-5.6+j*3.75,1.6,0,6.3);g.fill()}
    g.strokeStyle='rgba(20,24,26,.8)';g.lineWidth=0.7;rr(g,-9,-8,18,16,1.2);g.stroke();g.strokeStyle='#c2572b';g.lineWidth=1.3;g.beginPath();g.moveTo(-9,-2.2);g.lineTo(9,-2.2);g.moveTo(-9,3.4);g.lineTo(9,3.4);g.stroke()}
  else{g.fillStyle='#8a6238';g.fillRect(-12,-11,24,22);g.fillStyle='#6b4a2a';for(let q=-11;q<11;q+=5.5)g.fillRect(-12,q+4,24,1.2);
    const bl=(x,y,a)=>{rr(g,x,y,9.5,9.5,1);g.fillStyle=lg(g,x,y,x+9,y+9,a);g.fill();g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=0.6;g.stroke()};
    bl(-10.5,-9.5,['#f1f4f6','#7d888e']);bl(1,-9.5,['#f1f4f6','#7d888e']);bl(-10.5,0.5,['#c4e8fa','#3d7fa8']);bl(1,0.5,['#f1f4f6','#7d888e']);
    g.strokeStyle='#23282b';g.lineWidth=1;g.strokeRect(-11,-10,22,20.5)}}
function buildSprites(){spr=[];for(let m=0;m<TY.length;m++){spr[m]=[];const nv=m<4?4:1,nr=m<4?12:1;for(let v=0;v<nv;v++){spr[m][v]=[];for(let r=0;r<nr;r++){
  const c=mk(30*PS,30*PS),g=c.getContext('2d');g.setTransform(PS,0,0,PS,15*PS,15*PS);const a=r*Math.PI/6;
  g.save();g.translate(1.6,2.2);g.rotate(a);g.fillStyle='rgba(15,30,10,.33)';g.beginPath();if(m<3)g.ellipse(0,0,9.5,4.2,0,0,6.3);else g.rect(-9,-8,18,16);g.fill();g.restore();
  g.rotate(a);itemShape(g,m,v);spr[m][v][r]=c}}}}
const sp=(m,v,r)=>spr[m][(v||0)%spr[m].length][(r||0)%spr[m][0].length];
function blit(it){itemG.drawImage(sp(it.m,it.v,it.rot),Math.round((it.x-15)*LS),Math.round((it.y-15)*LS),30*LS,30*LS)}
function eraseItem(it){if(!itemG)return;const x0=Math.floor((it.x-16)*LS),y0=Math.floor((it.y-16)*LS),w=Math.ceil(32*LS);
  itemG.save();itemG.beginPath();itemG.rect(x0,y0,w,w);itemG.clip();itemG.clearRect(x0,y0,w,w);const l=[];near(it.x,it.y,36,o=>l.push(o));l.sort((a,b)=>a.i-b.i);l.forEach(blit);itemG.restore()}
function buildItemLayer(){itemL=mk(WW*LS,WH*LS);itemG=itemL.getContext('2d');for(const it of items)if(it.alive)blit(it);updFresh(true)}
// Saubere Wiese (E-020): Wo ein Feld und seine Nachbarn leer sind, erholt sich das Gras. fresh haelt je Feld 0 bis 1 und waechst langsam,
// freshL ist ein Bild mit einem Pixel je Feld. Weich hochskaliert ergibt es einen hellgruenen Schimmer ohne harte Kanten.
const fresh=new Float32Array(MW*MH);let freshL=null,freshD=null;
function updFresh(now){if(!freshL){freshL=mk(MW,MH);freshD=freshL.getContext('2d').createImageData(MW,MH)}const d=freshD.data,dirty=i=>cells[i].length>0||blocked[i];
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=y*MW+x;let t=1;if(dirty(i)||(x>0&&dirty(i-1))||(x<MW-1&&dirty(i+1))||(y>0&&dirty(i-MW))||(y<MH-1&&dirty(i+MW)))t=0;
    else if(pathDist(x*T+16,y*T+16)<22||(x<10&&y>20&&y<32))t=0; // Wege und Betriebshof bleiben, wie sie sind
    fresh[i]=now?t:fresh[i]+(t-fresh[i])*(t>fresh[i]?0.12:0.5);const p=i*4;d[p]=170;d[p+1]=235;d[p+2]=95;d[p+3]=Math.round(fresh[i]*58)}
  freshL.getContext('2d').putImageData(freshD,0,0);paintFlowers(now?1e9:60)}
function drawFresh(x0,y0,x1,y1){if(!freshL)return;const a=Math.max(0,((x0/T)|0)-1),b=Math.max(0,((y0/T)|0)-1),c=Math.min(MW,((x1/T)|0)+2),e=Math.min(MH,((y1/T)|0)+2);
  ctx.imageSmoothingEnabled=true;ctx.drawImage(freshL,a,b,c-a,e-b,a*T,b*T,(c-a)*T,(e-b)*T)} // nur der sichtbare Ausschnitt
// Blumen auf erholten Feldern werden einmal in die Bodenebene gemalt und kosten danach nichts mehr je Bild. flP merkt sich die bemalten Felder.
// Nach einem Neuaufbau des Bodens (ganz oder im Rechteck) sind sie dort weg, buildGround loescht dafuer die Merker.
const FLW=['#f6f3e3','#f2d34a','#f0a0c0','#ffffff'],flP=new Uint8Array(MW*MH);
function paintFlowers(max){if(!groundL)return;let g=null,n=0;for(let i=0;i<MW*MH&&n<max;i++){if(flP[i]||fresh[i]<0.8||grid[i])continue;flP[i]=1;let h=(i*2654435761)>>>0;const k=h%4;if(k>2)continue;n++;
    if(!g){g=groundL.getContext('2d');g.setTransform(LS,0,0,LS,0,0);g.globalAlpha=1}const tx=i%MW,ty=(i/MW)|0;
    for(let q=0;q<=k%2;q++){h=(h*1103515245+12345)>>>0;const x=tx*T+4+(h>>>8)%24,y=ty*T+5+(h>>>16)%22;g.fillStyle='rgba(40,90,30,.55)';g.fillRect(x-0.4,y,0.8,2.8);g.fillStyle=FLW[(h>>>24)%4];g.beginPath();g.arc(x,y,1.5,0,6.3);g.fill();g.fillStyle='rgba(150,110,20,.7)';g.fillRect(x-0.4,y-0.4,0.8,0.8)}}}
// Zeltabbau (E-020): Das Zelt sackt in 0,7 Sekunden zusammen, die Plane bleibt kurz liegen, Staub steigt auf. Die Eintraege kommen aus setTentGone.
function drawFalls(){const F=ui.falls;if(!F.length)return;const now=performance.now();for(let i=F.length-1;i>=0;i--){const e=F[i],k=(now-e.t)/700;if(k>=1.6||k<0){F.splice(i,1);continue}const o=e.o,by=o.y+10;
    if(k<1){const q=k*k;ctx.save();ctx.translate(o.x,by);ctx.rotate((o.flip?-1:1)*0.1*q);ctx.scale(1+0.22*q,1-0.86*q);ctx.translate(-o.x,-by);if(o.t==='pav')drawPav(ctx,o);else drawTent(ctx,o);ctx.restore()}
    else{ctx.globalAlpha=1-(k-1)/0.6;ctx.fillStyle=shade(o.col,-0.2);ctx.beginPath();ctx.ellipse(o.x,by-2,34*(o.s||1),7,0,0,6.3);ctx.fill();ctx.globalAlpha=1}
    if(k>0.5){const a=(1.6-k)/1.1*0.4,r=16+(k-0.5)*40;ctx.fillStyle='rgba(236,226,200,'+a.toFixed(3)+')';for(let j=0;j<6;j++){const g=j*1.05+o.x;ctx.beginPath();ctx.arc(o.x+Math.cos(g)*r*1.3,by+Math.sin(g)*r*0.45,5+(k-0.5)*9,0,6.3);ctx.fill()}}}}
// Tageslicht (E-020): Die Partie beginnt in kuehlem Morgenlicht mit tiefer Sonne von links und ist nach 22 Minuten taghell
// Ein einziger Verlauf: links das warme Licht ueber dem Blau, rechts nur das Blau. Zwei Flaechen uebereinander kosten auf dem Tablet doppelt.
function drawLight(){const k=Math.max(0,1-st.t/1320),q=k*k*(3-2*k);if(q<0.01)return;const a1=0.25*q,a2=0.24*q,A=a2+a1*(1-a2),m=(c1,c2)=>Math.round((c1*a1*(1-a2)+c2*a2)/A);
  const g=ctx.createLinearGradient(VIEW.x,0,VIEW.x+VIEW.w,0);g.addColorStop(0,'rgba('+m(22,255)+','+m(42,170)+','+m(96,90)+','+A.toFixed(3)+')');g.addColorStop(0.65,'rgba(22,42,96,'+a1.toFixed(3)+')');ctx.fillStyle=g;ctx.fillRect(VIEW.x,VIEW.y,VIEW.w,VIEW.h)}

function drawTent(g,o){g.save();g.translate(o.x,o.y);g.scale(o.s*(o.flip?-1:1),o.s);
  g.fillStyle='rgba(20,40,12,.28)';g.beginPath();g.ellipse(7,7,33,15,0,0,6.3);g.fill();
  g.strokeStyle='rgba(240,240,225,.55)';g.lineWidth=0.7;[[-27,2,-40,12],[27,2,40,12],[-16,-22,-34,-30],[16,-22,34,-30]].forEach(p=>{g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[2],p[3]);g.stroke();g.fillStyle='#d8d8d0';g.fillRect(p[2]-1,p[3]-1,2,2)});
  g.beginPath();g.moveTo(-29,3);g.bezierCurveTo(-27,-22,-12,-37,0,-37);g.bezierCurveTo(12,-37,27,-22,29,3);g.bezierCurveTo(18,13,-18,13,-29,3);g.closePath();
  g.fillStyle=lg(g,-24,-34,24,10,[shade(o.col,0.38),o.col,shade(o.col,-0.38)]);g.fill();g.strokeStyle=shade(o.col,-0.55);g.lineWidth=1;g.stroke();
  g.save();g.clip();g.strokeStyle=shade(o.col,-0.3);g.lineWidth=1.1;g.beginPath();g.moveTo(0,-37);g.quadraticCurveTo(-13,-12,-15,11);g.moveTo(0,-37);g.quadraticCurveTo(13,-12,15,11);g.stroke();
  g.fillStyle='rgba(255,255,255,.16)';g.beginPath();g.ellipse(-11,-18,7,15,0.5,0,6.3);g.fill();g.fillStyle=shade(o.col,-0.25);g.fillRect(-29,4,58,10);g.restore();
  g.beginPath();g.moveTo(-9,10);g.quadraticCurveTo(-2,-15,1,-17);g.quadraticCurveTo(7,-8,10,10);g.closePath();g.fillStyle='#1b2226';g.fill();
  g.beginPath();g.moveTo(1,-17);g.quadraticCurveTo(8,-6,10,10);g.lineTo(5,10);g.quadraticCurveTo(5,-4,1,-17);g.fillStyle=shade(o.col,-0.12);g.fill();g.restore()}
function drawPav(g,o){g.save();g.translate(o.x,o.y);
  g.fillStyle='rgba(20,40,12,.25)';g.beginPath();g.moveTo(-26,14);g.lineTo(8,4);g.lineTo(44,14);g.lineTo(10,25);g.closePath();g.fill();
  g.strokeStyle='#8f989c';g.lineWidth=1.6;[[-34,-12],[0,2],[34,-12]].forEach(p=>{g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0],p[1]+22);g.stroke()});
  const tri=(a,b,c,f)=>{g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(c[0],c[1]);g.closePath();g.fillStyle=f;g.fill();g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=0.6;g.stroke()};
  const P=[0,-38],A=[-34,-12],B=[0,-25],C=[34,-12],D=[0,2];tri(P,A,B,shade(o.col,-0.18));tri(P,B,C,shade(o.col,-0.06));tri(P,A,D,shade(o.col,-0.28));tri(P,D,C,shade(o.col,0.2));
  g.fillStyle=shade(o.col,-0.4);g.beginPath();g.moveTo(-34,-12);g.lineTo(0,2);g.lineTo(34,-12);g.lineTo(34,-8);g.lineTo(0,6);g.lineTo(-34,-8);g.closePath();g.fill();g.restore()}
function drawChair(g,o){g.save();g.translate(o.x,o.y);g.scale(o.flip?-1:1,1);g.fillStyle='rgba(20,40,12,.25)';g.beginPath();g.ellipse(2,5,8,3,0,0,6.3);g.fill();
  g.strokeStyle='#3a4246';g.lineWidth=1;g.beginPath();g.moveTo(-5,5);g.lineTo(-3,-1);g.moveTo(5,5);g.lineTo(3,-1);g.moveTo(-4,-1);g.lineTo(-6,-11);g.stroke();
  g.fillStyle=o.col;g.beginPath();g.moveTo(-5,-1);g.lineTo(5,-1);g.lineTo(6,2);g.lineTo(-4,2);g.closePath();g.fill();
  g.fillStyle=shade(o.col,-0.2);g.beginPath();g.moveTo(-7,-12);g.lineTo(-2,-12);g.lineTo(-1,-1);g.lineTo(-6,-1);g.closePath();g.fill();g.restore()}
function drawGrill(g,o){g.save();g.translate(o.x,o.y);g.fillStyle='rgba(20,40,12,.25)';g.beginPath();g.ellipse(2,8,9,3,0,0,6.3);g.fill();
  g.strokeStyle='#2b2f31';g.lineWidth=1.2;g.beginPath();g.moveTo(-4,-2);g.lineTo(-6,8);g.moveTo(4,-2);g.lineTo(6,8);g.moveTo(0,-2);g.lineTo(0,7);g.stroke();
  g.fillStyle='#1c1f21';g.beginPath();g.ellipse(0,-4,8,4,0,0,6.3);g.fill();g.fillStyle='#4a4f52';g.beginPath();g.ellipse(0,-5,6.5,2.8,0,0,6.3);g.fill();g.restore()}
function drawFire(g,o,r){g.save();g.translate(o.x,o.y);g.fillStyle='rgba(40,34,28,.55)';g.beginPath();g.ellipse(0,0,11,6,0,0,6.3);g.fill();g.fillStyle='#1d1a17';g.beginPath();g.ellipse(0,0,7,3.6,0,0,6.3);g.fill();
  for(let k=0;k<9;k++){const a=k/9*6.28;g.fillStyle=shade('#8d8a84',(r()-0.5)*0.4);g.beginPath();g.ellipse(Math.cos(a)*9,Math.sin(a)*5,2.4,1.8,0,0,6.3);g.fill()}g.restore()}
// R begrenzt den Neuaufbau auf ein Rechteck (nach dem Abbau eines Zelts). Die Zufallsfolge bleibt dieselbe, der Rest der Ebene bleibt unberuehrt.
let grassNear=null;
function buildGround(R){if(!groundL)groundL=mk(WW*LS,WH*LS);const g=groundL.getContext('2d');g.setTransform(LS,0,0,LS,0,0);g.globalAlpha=1;g.save();if(R){g.beginPath();g.rect(R.x,R.y,R.w,R.h);g.clip()}const r=rng(99),Q=R,inR=(x,y,m)=>!Q||(x>Q.x-m&&x<Q.x+Q.w+m&&y>Q.y-m&&y<Q.y+Q.h+m); // ausserhalb des Rechtecks wird nur gewuerfelt, nicht gezeichnet (Abbautrupps raeumen laufend Zelte)
  g.fillStyle=lg(g,0,0,WW,WH,['#7aa64a','#679a41','#5a8c3b']);g.fillRect(0,0,WW,WH);
  for(let k=0;k<700;k++){const x=r()*WW,y=r()*WH,R=30+r()*100,c=r()<0.5?'rgba(154,178,84,':'rgba(60,112,46,';const al=0.1+r()*0.16;if(!inR(x,y,R))continue;const gr=g.createRadialGradient(x,y,0,x,y,R);gr.addColorStop(0,c+al+')');gr.addColorStop(1,c+'0)');g.fillStyle=gr;g.fillRect(x-R,y-R,2*R,2*R)}
  for(const c of camps){const gr=g.createRadialGradient(c.x,c.y,10,c.x,c.y,95);gr.addColorStop(0,'rgba(176,160,96,.42)');gr.addColorStop(1,'rgba(176,160,96,0)');g.fillStyle=gr;g.save();g.translate(c.x,c.y);g.scale(1.25,0.8);g.translate(-c.x,-c.y);g.fillRect(c.x-100,c.y-100,200,200);g.restore()}
  const hp=k=>{g.beginPath();for(let x=-10;x<=WW+10;x+=10)g.lineTo(x,pathY(k,x))},vp=k=>{g.beginPath();for(let y=-10;y<=WH+10;y+=8)g.lineTo(pathX(k,y),y)};
  g.lineCap='round';g.lineJoin='round';
  [[44,'rgba(120,104,66,.35)'],[30,'rgba(126,100,62,.6)'],[20,'rgba(138,110,70,.55)']].forEach(p=>{g.lineWidth=p[0];g.strokeStyle=p[1];for(let k=0;k<2;k++){hp(k);g.stroke()}for(let k=0;k<3;k++){vp(k);g.stroke()}});
  g.lineWidth=2.2;g.strokeStyle='rgba(74,56,34,.45)';[-6,6].forEach(o=>{for(let k=0;k<2;k++){g.save();g.translate(0,o);hp(k);g.stroke();g.restore()}for(let k=0;k<3;k++){g.save();g.translate(o,0);vp(k);g.stroke();g.restore()}});
  for(let k=0;k<110;k++){let x,y;if(r()<0.5){x=r()*WW;y=pathY(r()*2|0,x)+(r()-0.5)*12}else{y=r()*WH;x=pathX(r()*3|0,y)+(r()-0.5)*12}const a=8+r()*16,b=3+r()*4;
    g.fillStyle='rgba(58,44,28,.7)';g.beginPath();g.ellipse(x,y,a,b,r()*0.5-0.25,0,6.3);g.fill();g.fillStyle='rgba(170,190,205,.4)';g.beginPath();g.ellipse(x-a*0.2,y-b*0.2,a*0.55,b*0.45,0,0,6.3);g.fill()}
  const GR=['#8fbf55','#4f8433','#a4c964','#3f7230','#6fa544'];
  const full=!Q||!grassNear;if(full)grassNear=new Uint8Array(70000); // merkt sich, welche Halme am Weg stehen: der Teilaufbau spart sich 70.000 Abstandsrechnungen
  for(let k=0;k<70000;k++){const x=r()*WW,y=r()*WH;if(full)grassNear[k]=pathDist(x,y)<13?1:0;if(grassNear[k]&&r()<0.85)continue;
    g.strokeStyle=GR[r()*5|0];g.globalAlpha=0.45+r()*0.4;g.lineWidth=0.8;const h=2.5+r()*3.5;if(!inR(x,y,8))continue;g.beginPath();g.moveTo(x,y);g.lineTo(x-1.4,y-h);g.moveTo(x,y);g.lineTo(x+0.4,y-h*1.2);g.moveTo(x,y);g.lineTo(x+1.8,y-h*0.8);g.stroke()}
  g.globalAlpha=1;for(let k=0;k<2200;k++){const x=r()*WW,y=r()*WH;const fc=r()<0.6?'#f6f3e3':'#f2d34a',fr=0.9+r()*0.5;if(!inR(x,y,3))continue;g.fillStyle=fc;g.beginPath();g.arc(x,y,fr,0,6.3);g.fill()}
  // Betriebshof an der Annahme
  const yx=9.5*T,y0=21.5*T,y1=31.5*T;const gy=g.createLinearGradient(yx-60,0,yx,0);gy.addColorStop(0,'rgba(150,146,134,.95)');gy.addColorStop(1,'rgba(150,146,134,0)');
  g.fillStyle='rgba(150,146,134,.95)';g.fillRect(0,y0,yx-60,y1-y0);g.fillStyle=gy;g.fillRect(yx-60,y0,60,y1-y0);
  for(let k=0;k<2600;k++){const x=r()*(yx-10),y=y0+r()*(y1-y0);const sh=(r()-0.5)*0.5;if(!inR(x,y,3))continue;g.fillStyle=shade('#9a968b',sh);g.globalAlpha=x>yx-70?0.4:1;g.fillRect(x,y,1.7,1.3)}g.globalAlpha=1;
  const objs=[];camps.forEach(c=>c.objs.forEach(o=>objs.push(o)));objs.sort((a,b)=>a.y-b.y);
  for(const o of objs){if(o.gone)continue;if(!inR(o.x,o.y,80)){if(o.t!=='tent'&&o.t!=='pav'&&o.t!=='chair'&&o.t!=='grill')for(let k=0;k<9;k++)r();continue}if(o.t==='tent')drawTent(g,o);else if(o.t==='pav')drawPav(g,o);else if(o.t==='chair')drawChair(g,o);else if(o.t==='grill')drawGrill(g,o);else drawFire(g,o,r)}
  const li=g.createLinearGradient(0,0,WW*0.7,WH);li.addColorStop(0,'rgba(255,226,150,.18)');li.addColorStop(0.6,'rgba(255,226,150,0)');li.addColorStop(1,'rgba(20,40,70,.16)');g.fillStyle=li;g.fillRect(0,0,WW,WH);g.restore();
  if(R){for(let ty=Math.max(0,(R.y/T)|0);ty<=Math.min(MH-1,((R.y+R.h)/T)|0);ty++)for(let tx=Math.max(0,(R.x/T)|0);tx<=Math.min(MW-1,((R.x+R.w)/T)|0);tx++)flP[ty*MW+tx]=0}else flP.fill(0)} // Blumen muessen dort neu gemalt werden
function buildMini(){if(!mmL)mmL=mk(MW*2,MH*2);const g=mmL.getContext('2d');
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=y*MW+x,o=grid[i],n=cells[i].length;
    g.fillStyle=o?(o.k==='belt'?'#1c2124':o.k==='auto'?'#57d06a':'#f0c21c'):blocked[i]?'#b9b4a4':n?(n>3?'#6e5f52':n>1?'#77705a':'#738552'):'#7fb04c';g.fillRect(x*2,y*2,2,2)}}

function resize(){DPR=Math.min(window.devicePixelRatio||1,2.5);const iw=window.innerWidth,ih=window.innerHeight;S=Math.min(iw/W,ih/H);offX=(iw-W*S)/2;offY=(ih-H*S)/2;
  cv.width=Math.round(iw*DPR);cv.height=Math.round(ih*DPR);cv.style.width=iw+'px';cv.style.height=ih+'px'}

let btns=[];
function button(x,y,w,h,cb,on){btns.push({x,y,w,h,cb,on:on!==false})}
function txt(s,x,y,size,col,align,bold){ctx.font=(bold?'600 ':'')+size+'px '+FONT;ctx.fillStyle=col;ctx.textAlign=align||'left';ctx.fillText(s,x,y)}
function mini(m,x,y,sc,rot,v){const c=sp(m,v,rot);ctx.drawImage(c,x-15*sc,y-15*sc,30*sc,30*sc)}
function lamp(x,y,col,blink){const on=!blink||(st.t*4%1)<0.6;ctx.fillStyle='#101314';ctx.beginPath();ctx.arc(x,y,4,0,6.3);ctx.fill();
  if(on){const g=ctx.createRadialGradient(x,y,0,x,y,8);g.addColorStop(0,col);g.addColorStop(0.45,col);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,8,0,6.3);ctx.fill()}}
function arrow(x,y,d,s,col){ctx.save();ctx.translate(x,y);ctx.rotate(d*Math.PI/2);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(s,0);ctx.lineTo(-s*0.5,-s*0.75);ctx.lineTo(-s*0.15,0);ctx.lineTo(-s*0.5,s*0.75);ctx.closePath();ctx.fill();ctx.restore()}

function beltStrip(len0,len1,off,h){h=h||10;// im gedrehten System: von x=len0 bis len1, h = halbe Breite (Doppelband 14)
  ctx.fillStyle='#14181a';ctx.fillRect(len0,-h,len1-len0,2*h);ctx.fillStyle=lg(ctx,0,2-h,0,h-2,['#3d464c','#343c42','#2a3136']);ctx.fillRect(len0,2-h,len1-len0,2*h-4);
  ctx.strokeStyle='rgba(255,255,255,.13)';ctx.lineWidth=1.3;ctx.beginPath();for(let px=len0-8+off;px<len1;px+=8){if(px<len0||px+3>len1)continue;if(h>10){ctx.moveTo(px,-11);ctx.lineTo(px+3,-6.5);ctx.lineTo(px,-2);ctx.moveTo(px,2);ctx.lineTo(px+3,6.5);ctx.lineTo(px,11)}else{ctx.moveTo(px,-5);ctx.lineTo(px+3,0);ctx.lineTo(px,5)}}ctx.stroke();if(h>10){ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(len0,-0.6,len1-len0,1.2)}
  ctx.fillStyle=h>10?'#c9a13a':'#7d878d';ctx.fillRect(len0,-h,len1-len0,1.6);ctx.fillRect(len0,h-1.6,len1-len0,1.6)}
// Haelften eines Bandfelds: f(anfang,waagerecht) je Zulauf und fuer den Ablauf
function beltHalves(t,f){const x=t.x*T,y=t.y*T;for(const d of t.feed){if(d%2)f(d===1?y:y+16,false);else f(d===0?x:x+16,true)}if(t.dir%2)f(t.dir===1?y+16:y,false);else f(t.dir===0?x+16:x,true)}
function drawBelt(t){const cx=t.x*T+16,cy=t.y*T+16,off=(st.t*bspd()*T)%8,h=t.b?14:10;
  for(const d of t.feed){ctx.save();ctx.translate(cx,cy);ctx.rotate(d*Math.PI/2);beltStrip(-16,0,off,h);ctx.restore()}
  ctx.save();ctx.translate(cx,cy);ctx.rotate(t.dir*Math.PI/2);beltStrip(0,16,off,h);ctx.restore();
  if(t.feed.length>1||t.feed[0]!==t.dir){ctx.fillStyle='#343c42';ctx.beginPath();ctx.arc(cx,cy,h-2,0,6.3);ctx.fill();arrow(cx,cy,t.dir,4,'rgba(255,255,255,.25)')}}
function beltItem(t,l){const cx=t.x*T+16,cy=t.y*T+16,p=Math.min(1,l.prog),f=l.from;let x,y;if(p<0.5){x=cx-DX[f]*(0.5-p)*T;y=cy-DY[f]*(0.5-p)*T}else{x=cx+DX[t.dir]*(p-0.5)*T;y=cy+DY[t.dir]*(p-0.5)*T}
  if(t.b){const s=l===t?-6.5:6.5;x+=s*(-DY[f]*(1-p)-DY[t.dir]*p);y+=s*(DX[f]*(1-p)+DX[t.dir]*p)}// Spur links oder rechts der Laufrichtung
  mini(l.item,x,y,(l.item>=RAW?0.95:0.85)*(t.b?0.82:1),(t.x*3+t.y)%12,(t.x+t.y)%4)}
function drawCross(b){const x=b.x*T,y=b.y*T,cx=x+16,cy=y+16,off=(st.t*24)%8;
  ctx.save();ctx.translate(cx,cy);if(b.dr&&b.dr[0]===2)ctx.rotate(Math.PI);beltStrip(-16,16,off);ctx.restore();if(b.it[0]>=0)mini(b.it[0],cx,cy,0.85,3,1);
  ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(x+29,y+3,6,29);ctx.fillStyle=lg(ctx,x,y,x+32,y,['#aab4ba','#6d777d']);ctx.fillRect(x+3,y,26,32);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(b.dr&&b.dr[1]===3?-Math.PI/2:Math.PI/2);beltStrip(-16,16,off);ctx.restore();if(b.it[1]>=0)mini(b.it[1],cx,cy,0.85,0,2);
  ctx.fillStyle='#f0c21c';ctx.fillRect(x+3,y,2,32);ctx.fillRect(x+27,y,2,32);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x+3,y,0.8,32);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x+28.2,y,0.8,32)}
function drawSmall(b){const x=b.x*T,y=b.y*T,cx=x+16,cy=y+16;
  const c0=b.k==='split'?'#7b868c':'#37707a';ctx.fillStyle='rgba(10,20,8,.3)';ctx.beginPath();ctx.moveTo(x+4,y+35);ctx.lineTo(x+31,y+35);ctx.lineTo(x+38,y+30);ctx.lineTo(x+38,y+6);ctx.lineTo(x+30,y+1);ctx.closePath();ctx.fill();
  rr(ctx,x+1,y+12,30,21,4);ctx.fillStyle=lg(ctx,0,y+24,0,y+33,[shade(c0,-0.35),shade(c0,-0.6)]);ctx.fill();ctx.strokeStyle=shade(c0,-0.75);ctx.lineWidth=1;ctx.stroke();ctx.translate(0,-5);
  if(b.k==='split'){rr(ctx,x+1,y+1,30,30,5);ctx.fillStyle=lg(ctx,x,y,x+32,y+32,['#9aa5ab','#5d676d']);ctx.fill();ctx.strokeStyle='#22282b';ctx.lineWidth=1.2;ctx.stroke();
    ctx.fillStyle='#22282b';ctx.beginPath();ctx.arc(cx,cy,10,0,6.3);ctx.fill();ctx.save();ctx.translate(cx,cy);ctx.rotate(st.t*3);ctx.strokeStyle='#f0c21c';ctx.lineWidth=2.5;for(let k=0;k<3;k++){ctx.rotate(2.094);ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(9,0);ctx.stroke()}ctx.restore()}
  else{rr(ctx,x+1,y+1,30,30,5);ctx.fillStyle=lg(ctx,x,y,x+32,y+32,['#4c8791','#24474e']);ctx.fill();ctx.strokeStyle='#162c31';ctx.lineWidth=1.2;ctx.stroke();
    ctx.fillStyle='#0f1517';ctx.beginPath();ctx.arc(cx,cy,10.5,0,6.3);ctx.fill();mini(b.filter,cx,cy,0.72,1,0);
    arrow(cx+DX[b.dir]*12,cy+DY[b.dir]*12,b.dir,5.5,'#f0c21c')}
  if(b.item>=0&&b.k==='split')mini(b.item,cx,cy,0.7,0,0);
  ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(x+5,y+1.6,22,1.1);ctx.translate(0,5)}
function drawMachine(b){const D=BT[b.k],x=b.x*T,y=b.y*T,work=b.t>=0,pr=work?b.t/D.time:0,c=D.col,k=b.k,Y=y-7;
  // Schlagschatten nach rechts unten, wie bei Zelten und Stationen
  ctx.fillStyle='rgba(10,20,8,.26)';ctx.beginPath();ctx.moveTo(x+6,y+66);ctx.lineTo(x+62,y+66);ctx.lineTo(x+75,y+57);ctx.lineTo(x+75,y+12);ctx.lineTo(x+60,y+2);ctx.lineTo(x+60,y+40);ctx.closePath();ctx.fill();
  // Bodenplatte, Vorderwand mit Warnstreifen, darueber die Deckflaeche: Das Gehaeuse hat Hoehe
  rr(ctx,x+1,y+12,62,51,4);ctx.fillStyle='#7c858a';ctx.fill();ctx.strokeStyle='#3d4549';ctx.lineWidth=1;ctx.stroke();
  rr(ctx,x+4,y+28,56,31,4);ctx.fillStyle=lg(ctx,0,y+40,0,y+59,[shade(c,-0.32),shade(c,-0.58)]);ctx.fill();ctx.strokeStyle=shade(c,-0.72);ctx.lineWidth=1.2;ctx.stroke();
  ctx.save();ctx.beginPath();ctx.rect(x+6,y+52,52,5.5);ctx.clip();ctx.fillStyle='#1d2224';ctx.fillRect(x+6,y+52,52,6);ctx.fillStyle='#e9b91c';for(let q=-8;q<60;q+=11){ctx.beginPath();ctx.moveTo(x+5+q,y+58);ctx.lineTo(x+10+q,y+52);ctx.lineTo(x+15+q,y+52);ctx.lineTo(x+10+q,y+58);ctx.closePath();ctx.fill()}ctx.restore();
  rr(ctx,x+4,Y-1,56,50,5);ctx.fillStyle=lg(ctx,x+4,Y,x+60,Y+50,[shade(c,0.42),c,shade(c,-0.2)]);ctx.fill();ctx.strokeStyle=shade(c,-0.62);ctx.lineWidth=1.2;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(x+8,Y+47.2,48,1.2);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(x+8,Y+0.4,48,1.3);ctx.fillRect(x+5.2,Y+4,1.3,41);
  ctx.fillStyle=shade(c,-0.5);[[8,3],[56,3],[8,45],[56,45]].forEach(q=>{ctx.beginPath();ctx.arc(x+q[0],Y+q[1],1.3,0,6.3);ctx.fill()});
  // Sichtfenster
  rr(ctx,x+14,Y+8,36,32,3);ctx.fillStyle='#0f1315';ctx.fill();ctx.save();rr(ctx,x+15,Y+9,34,30,2);ctx.clip();
  if(k==='pd'||k==='pp'||k==='pl'||k==='sc'){const p=work?0.5-0.5*Math.cos(b.anim*4):0,py=Y+10+p*14,col=TY[D.out].col;
    ctx.fillStyle=lg(ctx,0,py+5,0,Y+39,[col,shade(col,-0.4)]);ctx.fillRect(x+19,py+5,26,Y+39-py-5);
    ctx.fillStyle='#c5ced3';ctx.fillRect(x+30,Y+8,4,py-Y-8);ctx.fillStyle='#5d676d';ctx.fillRect(x+17,py,30,5);ctx.fillStyle='#e6ecef';ctx.fillRect(x+17,py,30,1.2)}
  else if(k==='kp'){ctx.fillStyle='#b23a2e';ctx.fillRect(x+17,Y+12,30,24);const n=work?Math.floor(pr*20)+1:0;for(let q=0;q<20;q++){ctx.fillStyle=q<n?'#d9b23a':'rgba(0,0,0,.45)';ctx.beginPath();ctx.arc(x+21+(q%5)*5.5,Y+16+((q/5)|0)*5.5,1.9,0,6.3);ctx.fill()}}
  else{ctx.fillStyle='#8a6238';ctx.fillRect(x+17,Y+30,30,6);const n=work?Math.floor(pr*11)+1:0;for(let q=0;q<Math.min(n,11);q++){const cc=q%4===3?TY[5].col:TY[4].col;ctx.fillStyle=cc;ctx.fillRect(x+18+(q%4)*7.2,Y+23-((q/4)|0)*7,6.4,6.4);ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=0.5;ctx.strokeRect(x+18+(q%4)*7.2,Y+23-((q/4)|0)*7,6.4,6.4)}}
  ctx.restore();ctx.strokeStyle='#b9c3c8';ctx.lineWidth=1.2;rr(ctx,x+14,Y+8,36,32,3);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.1)';ctx.beginPath();ctx.moveTo(x+16,Y+10);ctx.lineTo(x+30,Y+10);ctx.lineTo(x+16,Y+26);ctx.closePath();ctx.fill();
  let need=false;for(const q in D.inp)if(b.buf[q]<D.inp[q])need=true;
  lamp(x+9.5,y+44,b.out>=2?'#ff5b4d':work?'#57d06a':need?'#e8c03a':'#57d06a',b.out>=2);
  rr(ctx,x+16,y+42,40,4,2);ctx.fillStyle='#14181a';ctx.fill();if(pr>0){rr(ctx,x+16,y+42,40*pr,4,2);ctx.fillStyle='#57d06a';ctx.fill()}
  // Leben (E-020): Luefter dreht sich im Betrieb, nach jedem fertigen Stueck steigt Dampf auf und die Ware springt heraus
  {const now=performance.now();if(b.gm==null)b.gm=b.made;else if(b.gm!==b.made){b.gm=b.made;b.puT=now}const fx=x+9.3,fy=Y+13,pk=b.puT?(now-b.puT)/900:9;
    ctx.fillStyle='#14181a';ctx.beginPath();ctx.arc(fx,fy,4.6,0,6.3);ctx.fill();ctx.strokeStyle=work?'#f0c21c':'#6f7a80';ctx.lineWidth=1.7;ctx.lineCap='butt';for(let q=0;q<3;q++){const a=(work?b.anim*12:0.4)+q*2.094;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+Math.cos(a)*4.1,fy+Math.sin(a)*4.1);ctx.stroke()}
    if(b.out>0){const k=Math.min(1,pk*900/280);mini(D.out,x+54,y+50-Math.sin(k*Math.PI)*7,0.75*(0.55+0.45*k),0,0)}}
  if(cam.z>=0.7){let i=0;const ks=Object.keys(D.inp),tw=ks.length*34;for(const q of ks){const px=x+32-tw/2+i*34;rr(ctx,px,Y-15,32,12,4);ctx.fillStyle='rgba(16,20,22,.82)';ctx.fill();mini(+q,px+7,Y-9,0.42,1,0);
      txt(b.buf[q]+'/'+D.inp[q],px+30,Y-5.5,8,b.buf[q]>=D.inp[q]?'#9be28a':'#e6ecef','right',true);i++}}
  // Dampf zuletzt, damit er ueber den Zaehlern liegt. Im Betrieb zieht ein duenner Faden aus dem Luefter, nach jedem fertigen Stueck kommt eine dicke Wolke.
  // Die erste Fassung (Version 35) war so klein und blass, dass Till sie gar nicht bemerkt hat.
  {const now=performance.now(),fx=x+9.3,fy=Y+9,pk=b.puT?(now-b.puT)/1500:9;
    if(work)for(let q=0;q<3;q++){const kk=((b.anim*0.7+q/3)%1);ctx.fillStyle='rgba(240,244,246,'+(0.42*(1-kk)).toFixed(3)+')';ctx.beginPath();ctx.arc(fx-kk*7+Math.sin(kk*6+q)*2,fy-kk*26,2.5+kk*5,0,6.3);ctx.fill()}
    if(pk<1)for(let q=0;q<6;q++){const kk=Math.min(1,pk*1.25+q*0.07);if(kk>=1)continue;ctx.fillStyle='rgba(246,248,250,'+(0.85*(1-kk)*(1-kk)).toFixed(3)+')';ctx.beginPath();ctx.arc(fx+10+Math.sin(q*2.4)*13-kk*10,fy-6-kk*(38+q*5),6+kk*15,0,6.3);ctx.fill()}}}
function drawStation(b){const x=b.x*T,y=b.y*T,cx=x+32,cy=y+32,ab=b.k==='ab';
  ctx.fillStyle='rgba(10,20,8,.3)';rr(ctx,x+6,y+10,60,58,6);ctx.fill();
  rr(ctx,x+2,y+6,60,56,4);ctx.fillStyle='#a37a48';ctx.fill();ctx.strokeStyle='#5a3d20';ctx.lineWidth=1;ctx.stroke();ctx.strokeStyle='rgba(60,40,20,.5)';for(let q=1;q<6;q++){ctx.beginPath();ctx.moveTo(x+2,y+6+q*9.3);ctx.lineTo(x+62,y+6+q*9.3);ctx.stroke()}
  const n=Math.min(14,Math.ceil(b.buf.length/2));for(let q=0;q<n;q++)mini(b.buf[(q*2)%b.buf.length],x+12+(q%5)*10,y+50-((q/5)|0)*7,0.6,(q*5)%12,q%4);
  // Dach
  const A=[x+4,y+2],B=[x+60,y+2],C=[x+60,y+40],Dd=[x+4,y+40],P=[cx,y+16];
  const tri=(a,b2,f)=>{ctx.beginPath();ctx.moveTo(P[0],P[1]);ctx.lineTo(a[0],a[1]);ctx.lineTo(b2[0],b2[1]);ctx.closePath();ctx.fillStyle=f;ctx.fill();ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=0.6;ctx.stroke()};
  tri(A,B,ab?'#4f9be0':'#ff9a3a');tri(B,C,'#f6f1e4');tri(C,Dd,ab?'#2a66b8':'#e0650a');tri(Dd,A,'#f6f1e4');
  ctx.strokeStyle='#5d676d';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+58,y+2);ctx.lineTo(x+58,y-16);ctx.stroke();
  const w=Math.sin(st.t*5+b.x)*2;ctx.fillStyle=ab?'#ffd23e':'#57d06a';ctx.beginPath();ctx.moveTo(x+58,y-16);ctx.quadraticCurveTo(x+50,y-18+w,x+44,y-13+w);ctx.quadraticCurveTo(x+50,y-10+w,x+58,y-9);ctx.closePath();ctx.fill();
  lamp(x+9,y+47,b.buf.length>=ST_CAP?'#ff5b4d':b.empty?'#e8c03a':'#57d06a',b.buf.length>=ST_CAP);
  if(cam.z>=0.7){rr(ctx,cx-17,y+62,34,11,4);ctx.fillStyle='rgba(16,20,22,.82)';ctx.fill();txt(b.empty&&!b.buf.length?'leer':b.buf.length+'/'+ST_CAP,cx,y+70.5,8,b.empty&&!b.buf.length?'#e8c03a':'#e6ecef','center',true)}}
function drawAuto(b){const x=b.x*T,y0=b.y*T,y=y0-9;
  ctx.fillStyle='rgba(10,20,8,.3)';ctx.beginPath();ctx.moveTo(x+6,y0+99);ctx.lineTo(x+62,y0+99);ctx.lineTo(x+78,y0+88);ctx.lineTo(x+78,y0+10);ctx.lineTo(x+60,y0-2);ctx.closePath();ctx.fill();
  rr(ctx,x+1,y0+60,62,35,6);ctx.fillStyle=lg(ctx,0,y0+84,0,y0+95,['#232a2e','#14181a']);ctx.fill();ctx.strokeStyle='#0c0f10';ctx.lineWidth=1.5;ctx.stroke();
  ctx.save();ctx.beginPath();ctx.rect(x+4,y0+88.5,56,4.5);ctx.clip();ctx.fillStyle='#e9b91c';for(let q=-8;q<64;q+=11){ctx.beginPath();ctx.moveTo(x+3+q,y0+93);ctx.lineTo(x+8+q,y0+88.5);ctx.lineTo(x+13+q,y0+88.5);ctx.lineTo(x+8+q,y0+93);ctx.closePath();ctx.fill()}ctx.restore();
  rr(ctx,x+1,y+1,62,94,6);ctx.fillStyle=lg(ctx,x,y,x+64,y+96,['#56616a','#2a3136']);ctx.fill();ctx.strokeStyle='#14181a';ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(x+6,y+2.2,52,1.3);ctx.fillStyle='#2f9a55';ctx.fillRect(x+2,y+6,60,12);txt('ANNAHME',x+32,y+15.5,8.5,'#eaffee','center',true);
  const cx=x+32,cy=y+44;ctx.fillStyle='#0b0e0f';ctx.beginPath();ctx.arc(cx,cy,19,0,6.3);ctx.fill();ctx.strokeStyle='#aab4ba';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,19,0,6.3);ctx.stroke();
  ctx.strokeStyle=b.q.length?'#57d06a':'#3c5a40';ctx.lineWidth=2.2;for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(cx,cy,13.5,b.spin+k*2.094,b.spin+k*2.094+1.2);ctx.stroke()}
  if(b.q.length)mini(b.q[0],cx,cy,0.85,((b.spin*2)|0)%12,0);
  rr(ctx,x+8,y+68,48,13,3);ctx.fillStyle='#0f2414';ctx.fill();txt(b.q.length+'/'+AUTO_CAP,x+32,y+78,9,'#7dfc92','center',true);
  rr(ctx,x+8,y+84,48,5,2.5);ctx.fillStyle='#14181a';ctx.fill();const f=b.q.length/AUTO_CAP;if(f>0){rr(ctx,x+8,y+84,48*f,5,2.5);ctx.fillStyle=f>=1?'#ff7a6b':'#57d06a';ctx.fill()}}
function drawFigure(x,y,dir,ph,walk,vest,cap,reach){const bob=walk?Math.sin(ph)*1.2:0,fx=Math.cos(dir);
  ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(15,30,10,.32)';ctx.beginPath();ctx.ellipse(1.5,2.5,7,3,0,0,6.3);ctx.fill();
  const l=walk?Math.sin(ph)*2.6:0;ctx.fillStyle='#2b3550';ctx.fillRect(-3.2+l*0.4,-5,2.6,6+Math.max(0,-l*0.5));ctx.fillRect(0.6-l*0.4,-5,2.6,6+Math.max(0,l*0.5));
  ctx.fillStyle='#20242b';ctx.fillRect(-3.6+l*0.4,0.4,3.3,1.8);ctx.fillRect(0.4-l*0.4,0.4,3.3,1.8);
  rr(ctx,-4.6,-14+bob,9.2,10,2.5);ctx.fillStyle=lg(ctx,-4,0,5,0,[shade(vest,0.15),shade(vest,-0.15)]);ctx.fill();ctx.fillStyle='#f6f08a';ctx.fillRect(-4.6,-9.5+bob,9.2,1.5);
  ctx.strokeStyle='#e9b48f';ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(fx>0?4:-4,-12+bob);ctx.lineTo((fx>0?4:-4)+fx*4,-7+bob+(reach?5:0));ctx.stroke();
  ctx.fillStyle='#e9b48f';ctx.beginPath();ctx.arc(0,-17.2+bob,3.5,0,6.3);ctx.fill();ctx.fillStyle=cap;ctx.beginPath();ctx.arc(0,-18.2+bob,3.6,Math.PI,0);ctx.fill();ctx.fillRect(fx>0?0:-5.5,-18.6+bob,5.5,1.3);ctx.restore()}
function drawHelper(h){ctx.save();ctx.translate(h.wx,h.wy);ctx.fillStyle='rgba(15,30,10,.3)';ctx.beginPath();ctx.ellipse(2,5,13,5,0,0,6.3);ctx.fill();
  ctx.fillStyle='#22272a';[[-8,4],[8,4],[-8,-3],[8,-3]].forEach(p=>{ctx.beginPath();ctx.ellipse(p[0],p[1]+2,2.6,3.2,0,0,6.3);ctx.fill()});
  ctx.fillStyle='#7a5630';ctx.fillRect(-10,-6,20,10);ctx.fillStyle='#a37a48';ctx.fillRect(-10,-8,20,4);
  const ln=Math.ceil(h.load.length/10*7);for(let k=0;k<ln;k++){ctx.fillStyle=TY[h.load[(k*3)%h.load.length]].col;ctx.beginPath();ctx.arc(-7+((k*5)%15),-9-((k/3)|0)*2.6,2.4,0,6.3);ctx.fill()}
  ctx.restore();ctx.strokeStyle='#3a2c1c';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(h.wx,h.wy-4);ctx.lineTo(h.x-Math.cos(h.dir)*3,h.y-9);ctx.stroke();
  drawFigure(h.x,h.y,h.dir,h.ph,h.walk,h.ab?'#2f7fd6':'#ff8a1f',h.ab?'#ffd23e':'#2f6b3a',h.state==='pick'&&(!h.ab||Math.sin(h.ph)>0));
  if(h.ab&&h.state==='pick'&&h.target){const f=h.target,k=Math.max(0,1-h.cool/TENT_TIME);rr(ctx,f.x-18,f.y-46,36,6,3);ctx.fillStyle='rgba(16,20,22,.8)';ctx.fill();if(k>0){rr(ctx,f.x-18,f.y-46,Math.max(6,36*k),6,3);ctx.fillStyle='#ffd23e';ctx.fill()}}}
function drawPlayer(){const p=st.player,cap=25+10*st.up.bag,f=p.bag.length/cap;
  ctx.fillStyle='rgba(15,30,10,.3)';ctx.beginPath();ctx.ellipse(p.x-Math.cos(p.dir)*7+1,p.y+2,6,3,0,0,6.3);ctx.fill();
  ctx.fillStyle='#2a6fd6';ctx.beginPath();ctx.ellipse(p.x-Math.cos(p.dir)*7,p.y-7,4+f*3.5,5+f*4,0,0,6.3);ctx.fill();ctx.strokeStyle='#164a9a';ctx.lineWidth=0.8;ctx.stroke();
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(1.2,1.2);ctx.translate(-p.x,-p.y);drawFigure(p.x,p.y,p.dir,p.ph,p.walk,'#2fb9c9','#d9482b',p.cool>0.03);ctx.restore();
  rr(ctx,p.x-15,p.y-36,30,5,2.5);ctx.fillStyle='rgba(16,20,22,.75)';ctx.fill();if(f>0){rr(ctx,p.x-15,p.y-36,30*f,5,2.5);ctx.fillStyle=f>=1?'#ff7a6b':'#ffe27a';ctx.fill()}
  if(p.walk){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.tx,p.ty,5+Math.sin(st.t*8)*1.5,0,6.3);ctx.stroke()}}

const ptr={x:0,y:0,wx:0,wy:0,inView:false};
const toW=(x,y)=>({x:cam.x+(x-VIEW.x-VIEW.w/2)/cam.z,y:cam.y+(y-VIEW.y-VIEW.h/2)/cam.z});
function movePos(){const b=ui.move;return{x:Math.floor(ptr.wx/T-(b.w-1)/2),y:Math.floor(ptr.wy/T-(b.h-1)/2)}}
function warnBadge(x,y){const s=Math.max(1,0.75/cam.z),k=0.5+0.5*Math.sin(st.t*5);ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(10.5,8);ctx.lineTo(-10.5,8);ctx.closePath();
  ctx.fillStyle='rgb(255,'+Math.round(176+40*k)+',40)';ctx.fill();ctx.strokeStyle='#3a2a08';ctx.lineWidth=1.6;ctx.lineJoin='round';ctx.stroke();ctx.fillStyle='#3a2a08';ctx.fillRect(-1.3,-5,2.6,7.5);ctx.fillRect(-1.3,4,2.6,2.4);ctx.restore()}
function ghostPos(){const D=BT[ui.tool]||{w:1,h:1};return{x:Math.floor(ptr.wx/T-(D.w-1)/2),y:Math.floor(ptr.wy/T-(D.h-1)/2)}}
function clampCam(){const hw=VIEW.w/2/cam.z,hh=VIEW.h/2/cam.z;cam.x=Math.max(Math.min(hw,WW/2)-16,Math.min(WW-Math.min(hw,WW/2)+16+(ui.sel?240/cam.z:0),cam.x));cam.y=Math.max(Math.min(hh,WH/2)-16-130/cam.z,Math.min(WH-Math.min(hh,WH/2)+16+56/cam.z,cam.y))}// oben und unten Luft, damit Zielanzeige, Karte und Planleiste nichts von der Wiese verdecken. Ist das Auswahlfenster offen, auch rechts
function drawWorld(){ctx.save();ctx.beginPath();ctx.rect(VIEW.x,VIEW.y,VIEW.w,VIEW.h);ctx.clip();ctx.fillStyle='#1b2420';ctx.fillRect(VIEW.x,VIEW.y,VIEW.w,VIEW.h);
  ctx.translate(VIEW.x+VIEW.w/2,VIEW.y+VIEW.h/2);ctx.scale(cam.z,cam.z);ctx.translate(-cam.x,-cam.y);
  const hw=VIEW.w/2/cam.z,hh=VIEW.h/2/cam.z,x0=Math.max(0,cam.x-hw),y0=Math.max(0,cam.y-hh),x1=Math.min(WW,cam.x+hw),y1=Math.min(WH,cam.y+hh);
  if(x1>x0&&y1>y0){ctx.drawImage(groundL,x0*LS,y0*LS,(x1-x0)*LS,(y1-y0)*LS,x0,y0,x1-x0,y1-y0);drawFresh(x0,y0,x1,y1);ctx.drawImage(itemL,x0*LS,y0*LS,(x1-x0)*LS,(y1-y0)*LS,x0,y0,x1-x0,y1-y0);drawFalls()}
  const vis=(x,y,m)=>x>x0-m&&x<x1+m&&y>y0-m&&y<y1+m,building=ui.tool!=='walk'||!!ui.move;
  if(building&&cam.z>=0.6){ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1/cam.z;ctx.beginPath();for(let x=Math.ceil(x0/T)*T;x<=x1;x+=T){ctx.moveTo(x,y0);ctx.lineTo(x,y1)}for(let y=Math.ceil(y0/T)*T;y<=y1;y+=T){ctx.moveTo(x0,y);ctx.lineTo(x1,y)}ctx.stroke();
    ctx.fillStyle='rgba(255,70,50,.16)';for(let ty=Math.max(0,(y0/T)|0);ty<=Math.min(MH-1,(y1/T)|0);ty++)for(let tx=Math.max(0,(x0/T)|0);tx<=Math.min(MW-1,(x1/T)|0);tx++){const i=ty*MW+tx;if(!grid[i]&&(blocked[i]||cells[i].length))ctx.fillRect(tx*T,ty*T,T,T)}}
  ctx.fillStyle='rgba(10,20,8,.3)';for(const t of belts)if(vis(t.x*T,t.y*T,40))beltHalves(t,(hx,hz)=>{const e=t.b?4:0;if(hz)ctx.fillRect(hx,t.y*T+9-e,16,23+2*e);else ctx.fillRect(t.x*T+9-e,hx,23+2*e,16)});
  for(const t of belts)if(vis(t.x*T,t.y*T,40))beltHalves(t,(hx,hz)=>{const e=t.b?4:0;if(hz){ctx.fillStyle='#4b5459';ctx.fillRect(hx,t.y*T+26+e,16,3.5);ctx.fillStyle='#262c2f';ctx.fillRect(hx,t.y*T+28.6+e,16,0.9)}});
  for(const t of belts)if(vis(t.x*T,t.y*T,40))drawBelt(t);
  for(const t of belts)if(vis(t.x*T,t.y*T,40)){if(t.item>=0)beltItem(t,t);if(t.b&&t.b.item>=0)beltItem(t,t.b)}
  const ents=[];for(const b of blds){if(!vis(b.x*T,b.y*T,360))continue;ents.push([(b.y+b.h)*T-6,0,b]);if(isSt(b))for(const h of b.helpers)ents.push([h.y,1,h])}
  ents.push([st.player.y,2,null]);ents.sort((a,b)=>a[0]-b[0]);
  for(const e of ents){if(e[1]===1)drawHelper(e[2]);else if(e[1]===2)drawPlayer();else{const b=e[2];if(b.k==='cross')drawCross(b);else if(b.k==='split'||b.k==='sort')drawSmall(b);else if(isSt(b))drawStation(b);else if(b.k==='auto')drawAuto(b);else drawMachine(b)}}
  {const last=lastItems();if(last){const k=0.5+0.5*Math.sin(performance.now()/160);ctx.strokeStyle='rgba(255,70,50,'+(0.85-0.45*k)+')';ctx.lineWidth=2.5/cam.z;for(const it of last)if(vis(it.x,it.y,40)){ctx.beginPath();ctx.arc(it.x,it.y,16+8*k,0,6.3);ctx.stroke()}}}
  {const last=lastTents();if(last){const k=0.5+0.5*Math.sin(performance.now()/160);ctx.strokeStyle='rgba(255,70,50,'+(0.85-0.45*k)+')';ctx.lineWidth=2.5/cam.z;for(const f of last)if(vis(f.x,f.y,60)){ctx.beginPath();ctx.arc(f.x,f.y-10,34+8*k,0,6.3);ctx.stroke()}}}
  for(const b of blds)if(vis(b.x*T,b.y*T,80)&&jam(b))warnBadge((b.x+b.w)*T-5,b.y*T+3);
  for(const b of blds)if(b.k==='station'&&(building||ui.sel===b)){ctx.strokeStyle=ui.sel===b?'rgba(255,226,122,.9)':'rgba(255,255,255,.3)';ctx.lineWidth=1.5/cam.z;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc((b.x+1)*T,(b.y+1)*T,stR(),0,6.3);ctx.stroke();ctx.setLineDash([])}
  if(ui.sel){ctx.strokeStyle='#ffe27a';ctx.lineWidth=2/cam.z;rr(ctx,ui.sel.x*T-2,ui.sel.y*T-2,ui.sel.w*T+4,ui.sel.h*T+4,6);ctx.stroke()}
  for(const f of st.fly){const k=f.t/f.d,x=f.x0+(f.x1-f.x0)*k,y=f.y0+(f.y1-f.y0)*k-Math.sin(k*Math.PI)*14;ctx.save();ctx.translate(x,y);ctx.rotate(f.rot+k*4);const c=sp(f.ty,0,0);ctx.drawImage(c,-13,-13,26,26);ctx.restore()}
  // Bauvorschau
  if(ui.move&&ptr.inView){const b=ui.move,g=movePos(),ok=canMove(b,g.x,g.y);ctx.fillStyle=ok?'rgba(110,230,120,.35)':'rgba(255,80,60,.4)';ctx.fillRect(g.x*T,g.y*T,b.w*T,b.h*T);ctx.strokeStyle=ok?'#9be28a':'#ff7a6b';ctx.lineWidth=2/cam.z;ctx.strokeRect(g.x*T,g.y*T,b.w*T,b.h*T);
    ctx.strokeStyle='rgba(255,226,122,.8)';ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo((b.x+b.w/2)*T,(b.y+b.h/2)*T);ctx.lineTo((g.x+b.w/2)*T,(g.y+b.h/2)*T);ctx.stroke();ctx.setLineDash([]);
    if(b.k==='station'){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc((g.x+1)*T,(g.y+1)*T,stR(),0,6.3);ctx.stroke();ctx.setLineDash([])}}
  if(ui.tool==='wide'&&ptr.inView){const tx=(ptr.wx/T)|0,ty=(ptr.wy/T)|0,o=tx<MW&&ty<MH?grid[ty*MW+tx]:null;ctx.strokeStyle=o&&o.k==='belt'&&!o.b?'#ffe27a':'rgba(255,255,255,.35)';ctx.lineWidth=2/cam.z;ctx.strokeRect(tx*T,ty*T,T,T)}
  if(building&&!ui.move&&ptr.inView&&ui.tool!=='demo'&&ui.tool!=='wide'){const D=BT[ui.tool],g=ghostPos(),onBelt=g.x>=0&&g.y>=0&&g.x<MW&&g.y<MH&&grid[g.y*MW+g.x]&&grid[g.y*MW+g.x].k==='belt',ok=ui.tool==='belt'?(freeTile(g.x,g.y)||onBelt):((ui.tool==='cross'||ui.tool==='split'||ui.tool==='sort')&&onBelt)||canBuild(g.x,g.y,D.w,D.h);
    ctx.fillStyle=ok?'rgba(110,230,120,.35)':'rgba(255,80,60,.4)';ctx.fillRect(g.x*T,g.y*T,D.w*T,D.h*T);ctx.strokeStyle=ok?'#9be28a':'#ff7a6b';ctx.lineWidth=2/cam.z;ctx.strokeRect(g.x*T,g.y*T,D.w*T,D.h*T);
    if(ui.tool==='belt'||ui.tool==='sort')arrow(g.x*T+16,g.y*T+16,ui.rot,9,'#fff');
    if(ui.tool==='station'){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc((g.x+1)*T,(g.y+1)*T,stR(),0,6.3);ctx.stroke();ctx.setLineDash([])}}
  if(ui.tool==='belt'){const A=ui.planA,P=ui.plan;
    if(P)for(const t of P.path){ctx.fillStyle=t.cross?'rgba(255,140,50,.7)':'rgba(255,226,122,.42)';ctx.fillRect(t.x*T+2,t.y*T+2,T-4,T-4);ctx.strokeStyle='rgba(255,240,170,.9)';ctx.lineWidth=1.2/cam.z;ctx.strokeRect(t.x*T+2,t.y*T+2,T-4,T-4);arrow(t.x*T+16,t.y*T+16,t.d,8,'#fff')}
    if(A){const o=grid[A.y*MW+A.x],b=o&&o.k!=='belt'?o:{x:A.x,y:A.y,w:1,h:1};ctx.strokeStyle='#ffe27a';ctx.lineWidth=2.5/cam.z;ctx.setLineDash([6,4]);ctx.strokeRect(b.x*T+1,b.y*T+1,b.w*T-2,b.h*T-2);ctx.setLineDash([])}}
  if(ui.tool==='demo'&&ptr.inView){const tx=(ptr.wx/T)|0,ty=(ptr.wy/T)|0;ctx.strokeStyle='#ff7a6b';ctx.lineWidth=2/cam.z;ctx.strokeRect(tx*T,ty*T,T,T)}
  for(const p of st.pops){const k=p.t/1.3;ctx.globalAlpha=k<0.7?1:1-(k-0.7)/0.3;const fs=(p.big?15:11.5)/Math.max(0.7,cam.z);ctx.font='700 '+fs+'px '+FONT;ctx.textAlign='center';ctx.lineWidth=3/cam.z;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.strokeText(p.txt,p.x,p.y-k*26);ctx.fillStyle=p.col;ctx.fillText(p.txt,p.x,p.y-k*26);ctx.globalAlpha=1}
  ctx.restore()}
// Zielanzeige oben links. Antippen klappt sie ein.
function wrap(str,maxW){const out=[];let cur='';for(const w of str.split(' ')){const t=cur?cur+' '+w:w;if(cur&&ctx.measureText(t).width>maxW){out.push(cur);cur=w}else cur=t}if(cur)out.push(cur);return out}
function drawGoal(){const G=GOALS[st.ph],x=20,y=VIEW.y+10,w=404,v=Math.min(G.need,G.val(st)),k=v/G.need,min=ui.goalMin;ctx.font='11px '+FONT;const L=min?[]:wrap(G.how,w-24),h=(min?44:52)+L.length*14;
  rr(ctx,x,y,w,h,10);ctx.fillStyle='rgba(16,22,20,.88)';ctx.fill();ctx.strokeStyle='rgba(155,226,138,.35)';ctx.lineWidth=1;ctx.stroke();
  const neu=Object.keys(OPEN).filter(q=>OPEN[q]===st.ph+1).map(q=>BT[q]?BT[q].name:'Doppelband');
  txt('ZIEL '+(st.ph+1)+' VON '+GOALS.length,x+12,y+16,9.5,'#9be28a','left',true);if(neu.length)txt('schaltet frei: '+neu.join(', '),x+w-12,y+16,9.5,'#ffe27a','right');
  txt(G.t,x+12,y+33,14,'#f3efe2','left',true);
  const pt=G.money?euro(v)+' von '+euro(G.need):G.pct?(k*100).toFixed(1).replace('.',',')+' %':v+' von '+G.need+' '+G.unit;txt(pt,x+w-12,y+33,11.5,'#cfd8cf','right',true);
  L.forEach((q,i)=>txt(q,x+12,y+50+i*14,11,'#b8c2c6'));const by=y+h-11;
  if(G.pct){const md=MEDALS.find(q=>st.t<q.m*60);txt(md?md.n+' bis '+md.m+':00':'Zeit für eine Medaille abgelaufen',x+w-12,y+16,9.5,md?md.col:'#8f9aa0','right',true)}rr(ctx,x+12,by,w-24,5,2.5);ctx.fillStyle='#0d1011';ctx.fill();if(k>0){rr(ctx,x+12,by,Math.max(5,(w-24)*k),5,2.5);ctx.fillStyle='#8fc15a';ctx.fill()}
  button(x,y,w,h,()=>{ui.goalMin=!ui.goalMin})}
function drawToast(){const t=ui.toast;if(!t)return;const a=(performance.now()-t.t)/1000;if(a>4.5){ui.toast=null;return}ctx.globalAlpha=a>3.8?(4.5-a)/0.7:1;ctx.font='600 14px '+FONT;const w=ctx.measureText(t.txt).width+36;
  rr(ctx,W/2-w/2,VIEW.y+118,w,34,17);ctx.fillStyle='rgba(40,62,38,.95)';ctx.fill();ctx.strokeStyle='#9be28a';ctx.lineWidth=1.5;ctx.stroke();txt(t.txt,W/2,VIEW.y+140,14,'#f3efe2','center',true);ctx.globalAlpha=1}
function toolIcon(id,x,y){ctx.save();ctx.translate(x,y);
  if(id==='walk')drawFigure(0,9,0,0,false,'#2fb9c9','#d9482b',false);
  else if(id==='belt'){ctx.translate(-14,0);beltStrip(0,28,(st.t*24)%8)}
  else if(id==='wide'){ctx.translate(-14,0);beltStrip(0,28,(st.t*24)%8,14)}
  else if(id==='cross'){ctx.scale(0.85,0.85);ctx.translate(-16,-16);drawCross({x:0,y:0,it:[-1,-1]})}
  else if(id==='split'||id==='sort'){ctx.scale(0.85,0.85);ctx.translate(-16,-16);const s=cam.z;drawSmall({k:id,x:0,y:0,item:-1,filter:0,dir:ui.rot})}
  else if(id==='station'||id==='ab'){const ab=id==='ab';ctx.fillStyle=ab?'#4f9be0':'#ff9a3a';ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(-14,-12);ctx.lineTo(14,-12);ctx.closePath();ctx.fill();ctx.fillStyle='#f6f1e4';ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(14,-12);ctx.lineTo(14,12);ctx.closePath();ctx.fill();ctx.fillStyle=ab?'#2a66b8':'#e0650a';ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(14,12);ctx.lineTo(-14,12);ctx.closePath();ctx.fill();ctx.fillStyle='#f6f1e4';ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(-14,12);ctx.lineTo(-14,-12);ctx.closePath();ctx.fill()}
  else if(id==='demo'){ctx.strokeStyle='#ff7a6b';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-9,-9);ctx.lineTo(9,9);ctx.moveTo(9,-9);ctx.lineTo(-9,9);ctx.stroke()}
  else if(id==='rot'){ctx.strokeStyle='#e6ecef';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,10,0.6,5.4);ctx.stroke();arrow(0,0,ui.rot,7,'#f0c21c')}
  else{const D=BT[id];rr(ctx,-14,-13,28,24,3);ctx.fillStyle=lg(ctx,-14,-13,14,11,[shade(D.col,0.3),shade(D.col,-0.3)]);ctx.fill();ctx.fillStyle='#0f1315';ctx.fillRect(-8,-9,16,13);mini(D.out,0,-2,0.6,0,0)}
  ctx.restore()}
function drawToolbar(){ctx.fillStyle=lg(ctx,0,726,0,800,['#232a2c','#161b1a']);ctx.fillRect(0,726,W,74);
  const now=performance.now();TOOLS.forEach((id,i)=>{const tw=(W-4)/TOOLS.length,x=3+i*tw,y=730,w=tw-2,h=66,cx=x+w/2,on=ui.tool===id,D=BT[id],p=id==='wide'?WIDE_COST:D?price(id):0,can=!D||st.money>=p,open=isOpen(id),fresh=open&&OPEN[id]===st.ph&&now-ui.newT<9000;
    rr(ctx,x,y,w,h,8);ctx.fillStyle=on?lg(ctx,0,y,0,y+h,['#3f7a8a','#2a5561']):open?'#2c3338':'#1f2427';ctx.fill();ctx.strokeStyle=fresh?'#ffe27a':on?'#7fd0e2':'#3c454b';ctx.lineWidth=fresh?2+Math.sin(now/150):on?2:1;ctx.stroke();
    if(HOTKEY[id])txt(HOTKEY[id],x+6,y+13,9.5,open?'#8f9aa0':'#4f585d','left',true);
    ctx.globalAlpha=open?1:0.28;ctx.save();ctx.translate(cx,y+17);ctx.scale(0.86,0.86);toolIcon(id,0,0);ctx.restore();ctx.globalAlpha=1;
    const nm=id==='walk'?'Laufen':id==='demo'?'Abriss':id==='rot'?'Drehen':id==='wide'?'Doppelband':D.name;
    ctx.font='600 11px '+FONT;const parts=({wide:['Doppel-','band'],split:['Ver-','teiler'],sort:['Sor-','tierer'],cross:['Kreu-','zung'],station:['Sammel-','station'],pd:['Dosen-','presse'],pp:['PET-','Presse'],kp:['Kisten-','packer'],pal:['Palet-','tierer'],ab:['Abbau-','trupp'],pl:['Planen-','presse'],sc:['Schrott-','presse']})[id]||[nm];
    parts.forEach((s,j)=>txt(s,cx,y+(parts.length>1?39:44)+j*10.5,10,open?'#fff':'#727c82','center',true));
    if(!open){txt('nach Ziel '+OPEN[id],cx,y+62,9,'#727c82','center');button(x,y,w,h,()=>toast(nm+' kommt nach Ziel '+OPEN[id]));return}
    if(D||id==='wide')txt((D?'':'+')+euro(p),cx,y+62,9.5,can?'#ffe27a':'#8a949a','center',true);else txt(id==='rot'?'Taste R':id==='walk'?'Esc':'erstattet',cx,y+62,9,'#8f9aa0','center');
    button(x,y,w,h,()=>{if(id==='rot')ui.rot=(ui.rot+1)%4;else{ui.tool=id;ui.move=null;if(id!=='walk')ui.sel=null}})})}
function drawTop(){ctx.fillStyle=lg(ctx,0,0,0,46,['#232a2c','#161b1a']);ctx.fillRect(0,0,W,46);
  txt('FESTIVALHANGOVER',14,22,14.5,'#f3efe2','left',true);txt('Montagmorgen',14,38,10.5,'#8f9aa0');
  rr(ctx,176,8,56,30,6);ctx.fillStyle='#2c3338';ctx.fill();txt('Menü',204,28,11.5,'#e6ecef','center',true);button(176,8,56,30,()=>{ui.menu=true;ui.saved=false;ui.resetArm=0});
  const left=st.left[0]+st.left[1]+st.left[2]+st.left[3],pr=st.total?(st.total-left)/st.total:0,bx=240,bw=270;
  rr(ctx,bx,13,bw,12,6);ctx.fillStyle='#0d1011';ctx.fill();if(pr>0){rr(ctx,bx,13,Math.max(12,bw*pr),12,6);ctx.fillStyle=lg(ctx,bx,0,bx+bw,0,['#6fa544','#a4c964']);ctx.fill()}
  txt('Wiese '+(pr*100).toFixed(1).replace('.',',')+' % sauber',bx+bw/2,39,11,'#cfd8cf','center');
  for(let m=0;m<4;m++){mini(m,536+m*66,20,1,1,m);txt(String(st.left[m]),551+m*66,25,12.5,'#e6ecef','left',true)}
  {const x=800;ctx.beginPath();ctx.moveTo(x-11,27);ctx.quadraticCurveTo(x-9,11,x,10);ctx.quadraticCurveTo(x+9,11,x+11,27);ctx.closePath();ctx.fillStyle='#e0703a';ctx.fill();ctx.strokeStyle='#7a3414';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#1b2226';ctx.beginPath();ctx.moveTo(x-3,27);ctx.lineTo(x,17);ctx.lineTo(x+3,27);ctx.closePath();ctx.fill();txt(String(st.tl),x+15,25,12.5,'#e6ecef','left',true)}
  const mm=Math.floor(st.t/60),ss=Math.floor(st.t%60);txt(mm+':'+(ss<10?'0':'')+ss,912,25,12,'#8f9aa0','right');
  [['−',930,()=>{cam.z=Math.max(0.4,cam.z/1.25)}],['+',966,()=>{cam.z=Math.min(2.2,cam.z*1.25)}]].forEach(b=>{rr(ctx,b[1],8,30,30,6);ctx.fillStyle='#2c3338';ctx.fill();txt(b[0],b[1]+15,29,18,'#e6ecef','center',true);button(b[1],8,30,30,b[2])});
  {const n=ui.undo.length;rr(ctx,1004,8,92,30,6);ctx.fillStyle=n?'#2c3338':'#22282b';ctx.fill();txt('Rückgängig',1050,28,11.5,n?'#e6ecef':'#6f7a80','center',true);button(1004,8,92,30,()=>undo(),n>0)}
  txt(euro(st.money),W-14,31,24,'#ffe27a','right',true)}
// Die letzten Stuecke auf der Wiese: ab LAST_N werden sie auf Karte und Minikarte markiert, sonst sucht man sie von Hand
const LAST_N=40;
function lastItems(){const L=st.left,n=L[0]+L[1]+L[2]+L[3];if(n<1||n>LAST_N||st.done)return null;const out=[];for(const it of items)if(it.alive)out.push(it);return out}
// Die letzten Zelte: ab LAST_TENTS blinken sie wie die letzten Stuecke
function lastTents(){if(st.tl<1||st.tl>LAST_TENTS||st.done)return null;return foot.filter(f=>!f.o.gone)}
function drawMiniMap(){const x=1112,y=VIEW.y+8,w=160,h=104;rr(ctx,x-3,y-3,w+6,h+6,5);ctx.fillStyle='rgba(16,20,22,.85)';ctx.fill();ctx.imageSmoothingEnabled=false;ctx.drawImage(mmL,x,y,w,h);ctx.imageSmoothingEnabled=true;
  const p=st.player;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+p.x/WW*w,y+p.y/WH*h,2.5,0,6.3);ctx.fill();
  const last=lastItems();if(last){const k=0.5+0.5*Math.sin(performance.now()/160);for(const it of last){const px=x+it.x/WW*w,py=y+it.y/WH*h;ctx.strokeStyle='rgba(255,60,40,'+(0.9-0.5*k)+')';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(px,py,3+4*k,0,6.3);ctx.stroke();ctx.fillStyle='#ff4a36';ctx.beginPath();ctx.arc(px,py,2.2,0,6.3);ctx.fill()}}
  const lt=lastTents();if(lt){const k=0.5+0.5*Math.sin(performance.now()/160);for(const f of lt){const px=x+f.x/WW*w,py=y+f.y/WH*h;ctx.strokeStyle='rgba(255,60,40,'+(0.9-0.5*k)+')';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(px,py,3+4*k,0,6.3);ctx.stroke();ctx.fillStyle='#ff4a36';ctx.fillRect(px-2.2,py-2.2,4.4,4.4)}}
  const hw=VIEW.w/2/cam.z,hh=VIEW.h/2/cam.z;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.strokeStyle='#ffe27a';ctx.lineWidth=1.2;ctx.strokeRect(x+(cam.x-hw)/WW*w,y+(cam.y-hh)/WH*h,2*hw/WW*w,2*hh/WH*h);ctx.restore()}
const MM={x:1112,y:VIEW.y+8,w:160,h:104};
function panelBtn(x,y,w,label,cb,col,on){rr(ctx,x,y,w,28,6);ctx.fillStyle=on===false?'#3c454b':col||'#3f7a8a';ctx.fill();txt(label,x+w/2,y+18.5,11.5,on===false?'#8a949a':'#fff','center',true);button(x,y,w,28,cb,on)}
let panelRect=null;
function drawPanel(){panelRect=null;const b=ui.sel;if(!b)return;const x=1052,y=VIEW.y+124,w=220,D=BT[b.k];let lines=[],h;
  if(b.k==='auto'){h=64+UPS.length*52+6;rr(ctx,x,y,w,h,8);ctx.fillStyle='rgba(22,28,30,.94)';ctx.fill();ctx.strokeStyle='#4a5257';ctx.lineWidth=1;ctx.stroke();
    txt('Leergutannahme',x+12,y+22,14,'#fff','left',true);txt('zählt '+AUTO_RATE.toFixed(1).replace('.',',')+' Stück/s · Ballen,',x+12,y+40,10.5,'#aeb7bc');txt('Kästen und Paletten sofort',x+12,y+53,10.5,'#aeb7bc');
    UPS.forEach((u,i)=>{const by=y+64+i*52,l=st.up[u.k],mx=l>=u.max,p=upPrice(u),lock=u.ph>st.ph,can=!mx&&!lock&&st.money>=p;rr(ctx,x+10,by,w-20,46,6);ctx.fillStyle=can?'#2a5561':'#2c3338';ctx.fill();ctx.strokeStyle=can?'#7fd0e2':'#3c454b';ctx.stroke();
      txt(u.name,x+20,by+19,12,can?'#fff':'#aeb7bc','left',true);txt(lock?'nach Ziel '+u.ph:u.sub(l),x+20,by+35,10.5,'#8f9aa0');txt(mx?'max.':lock?'':euro(p),x+w-20,by+28,12.5,mx?'#7d878d':can?'#ffe27a':'#8a949a','right',true);button(x+10,by,w-20,46,()=>buyUp(i),can)})}
  else{if(D.inp){const rate=k=>(D.inp[k]/D.time).toFixed(2).replace('.',',');lines.push(Object.keys(D.inp).map(k=>D.inp[k]+' '+TY[k].n).join(' + '));lines.push('→ 1 '+TY[D.out].n+' in '+D.time+' s');
      lines.push('Bedarf: '+Object.keys(D.inp).map(k=>rate(k)+' '+TY[k].n+'/s').join(', '));lines.push('Wert: '+euro(TY[D.out].val)+' · gefertigt: '+b.made)}
    else lines=D.info.slice();
    if(b.k==='sort')lines.push('Sorte: '+TY[b.filter].n);
    if(b.k==='station'){let n=0;near((b.x+1)*T,(b.y+1)*T,stR(),()=>{n++});lines.push('Lager '+b.buf.length+'/'+ST_CAP+' · im Umkreis: '+n+' Stück')}
    if(b.k==='ab')lines.push('Lager '+b.buf.length+'/'+ST_CAP+' · Zelte übrig: '+st.tl);
    const why=jam(b);lines.push(why?'Achtung: '+why:'');// Zeile bleibt immer frei, sonst springt die Fensterhoehe
    const nb=b.k==='sort'?4:2;h=36+lines.length*15+nb*34+6;rr(ctx,x,y,w,h,8);ctx.fillStyle='rgba(22,28,30,.94)';ctx.fill();ctx.strokeStyle='#4a5257';ctx.lineWidth=1;ctx.stroke();
    txt(D.name,x+12,y+22,14,'#fff','left',true);lines.forEach((s,i)=>txt(s,x+12,y+42+i*15,10.5,s.startsWith('Achtung')?'#ffc94a':'#cfd8dc'));let by=y+36+lines.length*15;
    if(b.k==='sort'){panelBtn(x+10,by,w-20,'Sorte wechseln',()=>{b.filter=nextSort(b.filter)});by+=34;panelBtn(x+10,by,w-20,'Auswurf drehen',()=>{b.dir=(b.dir+1)%4});by+=34}
    panelBtn(x+10,by,w-20,ui.move===b?'Versetzen abbrechen':'Versetzen',()=>{ui.move=ui.move===b?null:b;ui.tool='walk'},ui.move===b?'#8a6a2a':undefined);by+=34;
    panelBtn(x+10,by,w-20,'Abreißen (+'+euro(b.paid)+')',()=>demolish(b.x,b.y),'#6a4a44')}
  rr(ctx,x+w-32,y+7,24,24,6);ctx.fillStyle='#3c454b';ctx.fill();txt('×',x+w-20,y+25,17,'#e6ecef','center',true);button(x+w-32,y+7,24,24,()=>{ui.sel=null;ui.move=null}); // Fenster schliessen
  panelRect={x,y,w,h}}
function drawPlanBar(){if(ui.tool!=='belt')return;const P=ui.plan,y=VIEW.y+VIEW.h-48,x=W/2-275,cr=isOpen('cross');if(!P&&!cr)return;
  rr(ctx,P?x-8:x+422,y-7,P?(cr?566:436):136,48,11);ctx.fillStyle='rgba(16,22,20,.9)';ctx.fill();
  if(P){const n=P.path.length-P.crosses,can=st.money>=P.cost,label='Bauen · '+n+(n===1?' Feld':' Felder')+(P.crosses?' · '+P.crosses+(P.crosses===1?' Kreuzung':' Kreuzungen'):'')+' · '+euro(P.cost);
    rr(ctx,x,y,300,34,7);ctx.fillStyle=can?'#3f8f4f':'#3c454b';ctx.fill();txt(label,x+150,y+22,12.5,can?'#fff':'#9aa4aa','center',true);button(x,y,300,34,()=>confirmPlan());
    rr(ctx,x+310,y,110,34,7);ctx.fillStyle='#6a4a44';ctx.fill();txt('Abbrechen',x+365,y+22,12.5,'#fff','center',true);button(x+310,y,110,34,()=>{ui.plan=null;ui.planA=null})}
  if(!cr)return;
  rr(ctx,x+430,y,120,34,7);ctx.fillStyle=ui.planCross?'#8a6a2a':'#3c454b';ctx.fill();txt(ui.planCross?'Kreuzen: an':'Kreuzen: aus',x+490,y+22,12,'#fff','center',true);button(x+430,y,120,34,()=>toggleCross())}
function drawMenu(){if(!ui.menu)return;btns=[];ctx.fillStyle='rgba(10,16,14,.72)';ctx.fillRect(0,0,W,H);const w=340,h=372,x=W/2-w/2,y=H/2-h/2;
  rr(ctx,x,y,w,h,14);ctx.fillStyle='#222b2d';ctx.fill();ctx.strokeStyle='#4a5257';ctx.lineWidth=1.5;ctx.stroke();
  txt('Menü',W/2,y+42,22,'#f3efe2','center',true);txt('Das Spiel ist angehalten.',W/2,y+64,11.5,'#8f9aa0','center');
  const mb=(k,label,col,cb)=>{const by=y+84+k*60;rr(ctx,x+30,by,w-60,48,9);ctx.fillStyle=col;ctx.fill();txt(label,W/2,by+30,14.5,'#fff','center',true);button(x+30,by,w-60,48,cb)};
  mb(0,'Weiterspielen','#3f7a8a',()=>{ui.menu=false;ui.resetArm=0});
  mb(1,ui.saved?'Gespeichert':'Jetzt speichern','#3c5a48',()=>{save();ui.saved=true});
  mb(2,ui.resetArm>0?'Wirklich? Der Spielstand wird gelöscht':'Spiel neu starten',ui.resetArm>0?'#a8553a':'#4a3f3c',()=>{if(ui.resetArm>0){try{localStorage.removeItem(SAVE_KEY)}catch(e){}start(true)}else ui.resetArm=3});
  [['s','Geräusche'],['a','Ambiente'],['m','Musik']].forEach((q,i)=>{const bw=(w-76)/3,bx=x+30+i*(bw+8),by=y+264;rr(ctx,bx,by,bw,44,8);ctx.fillStyle=volName(q[0])==='aus'?'#3c454b':'#3a5a66';ctx.fill();txt(q[1],bx+bw/2,by+18,11.5,'#fff','center',true);txt(volName(q[0]),bx+bw/2,by+34,11.5,'#cfe3ea','center');button(bx,by,bw,44,()=>setVol(q[0]))});
  txt('Musik: Kistol (Etirwer), SeventhSeeker (Apple Cider), gemeinfrei',W/2,y+h-42,9.5,'#6f7a80','center');
  txt('Der Spielstand wird alle 15 Sekunden automatisch gespeichert.',W/2,y+h-26,10.5,'#8f9aa0','center');txt('Version '+VERSION,W/2,y+h-11,10,'#6f7a80','center')}
// Endbildschirm (E-020): gezeichnete Medaille, Konfetti, Zeit und Bestzeit, was verkauft wurde
function medalIcon(x,y,md){ctx.save();ctx.translate(x,y);ctx.fillStyle='#b23a2e';ctx.beginPath();ctx.moveTo(-17,-44);ctx.lineTo(-5,-44);ctx.lineTo(3,-10);ctx.lineTo(-9,-10);ctx.closePath();ctx.fill();ctx.fillStyle='#2a66b8';ctx.beginPath();ctx.moveTo(17,-44);ctx.lineTo(5,-44);ctx.lineTo(-3,-10);ctx.lineTo(9,-10);ctx.closePath();ctx.fill();
  const c=md?md.col:'#6f7a80';ctx.beginPath();ctx.arc(0,10,27,0,6.3);ctx.fillStyle=lg(ctx,-22,-14,22,34,[shade(c,0.45),c,shade(c,-0.4)]);ctx.fill();ctx.strokeStyle=shade(c,-0.55);ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(0,10,20,0,6.3);ctx.strokeStyle=shade(c,0.5);ctx.lineWidth=1.5;ctx.stroke();
  if(md){ctx.fillStyle=shade(c,-0.5);ctx.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?6:14;ctx.lineTo(Math.cos(a)*r,10+Math.sin(a)*r)}ctx.closePath();ctx.fill()}else{ctx.strokeStyle='#3c454b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-9,10);ctx.lineTo(9,10);ctx.stroke()}ctx.restore()}
const tm=t=>{const m=Math.floor(t/60),s=Math.floor(t%60);return m+':'+(s<10?'0':'')+s};
// Zwei Wertungen (E-021): links die Zeit mit Medaille, rechts der Gewinn (Geld in der Kasse) mit Muenze. Beide haben Gold, Silber, Bronze.
function coinIcon(x,y,pf){const c=pf?pf.col:'#6f7a80';ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.ellipse(0,14,27,27,0,0,6.3);ctx.fillStyle=shade(c,-0.5);ctx.fill();ctx.beginPath();ctx.arc(0,10,27,0,6.3);ctx.fillStyle=lg(ctx,-22,-14,22,34,[shade(c,0.45),c,shade(c,-0.4)]);ctx.fill();ctx.strokeStyle=shade(c,-0.55);ctx.lineWidth=2;ctx.stroke();
  ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(0,10,21,0,6.3);ctx.strokeStyle=shade(c,-0.3);ctx.lineWidth=1.3;ctx.stroke();ctx.setLineDash([]);txt('€',0,21,30,pf?shade(c,-0.55):'#3c454b','center',true);ctx.restore()}
function drawEnd(){if(!st.done)return;const a=(performance.now()-ui.endT)/1000,md=MEDALS.find(q=>st.t<=q.m*60),pf=PROFIT.find(q=>st.money>=q.e),w=640,h=420,x=W/2-w/2,y=H/2-h/2,L=W/2-150,R=W/2+150;ctx.fillStyle='rgba(10,16,14,.72)';ctx.fillRect(0,0,W,H);
  if((md||pf)&&a<9){const C=['#ffd23e','#ff7a6b','#7fd0e2','#9be28a','#f0a0c0','#ffffff'];for(let k=0;k<90;k++){const sd=(k*2654435761)>>>0,px=(sd%1280),sp=90+(sd>>>8)%140,py=((a*sp+(sd>>>16)%800)%900)-50,r=a*3+k;ctx.save();ctx.translate(px+Math.sin(a*2+k)*18,py);ctx.rotate(r);ctx.globalAlpha=a>7?(9-a)/2:1;ctx.fillStyle=C[k%6];ctx.fillRect(-4,-2.2,8,4.4);ctx.restore()}ctx.globalAlpha=1}
  rr(ctx,x,y,w,h,18);ctx.fillStyle='#22302a';ctx.fill();ctx.strokeStyle=md?md.col:pf?pf.col:'#a4c964';ctx.lineWidth=2.5;ctx.stroke();
  txt('Die Wiese ist besenrein.',W/2,y+50,28,'#f3efe2','center',true);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(W/2-0.5,y+78,1,170);
  medalIcon(L,y+128,md);txt('ZEIT',L,y+186,10.5,'#8f9aa0','center',true);txt(tm(st.t),L,y+222,36,'#f3efe2','center',true);txt(md?md.n:'ohne Medaille',L,y+244,15,md?md.col:'#8f9aa0','center',true);txt(ui.newBest?'Neue Bestzeit':'Bestzeit '+tm(ui.best||st.t),L,y+262,11.5,ui.newBest?'#ffd23e':'#8f9aa0','center',true);
  coinIcon(R,y+118,pf);txt('GEWINN',R,y+186,10.5,'#8f9aa0','center',true);txt(euro(st.money),R,y+222,32,'#f3efe2','center',true);txt(pf?pf.n:'unter '+euro(PROFIT[PROFIT.length-1].e),R,y+244,15,pf?pf.col:'#8f9aa0','center',true);txt(ui.newBestM?'Neuer Bestwert':'Bestwert '+euro(ui.bestM||st.money),R,y+262,11.5,ui.newBestM?'#ffd23e':'#8f9aa0','center',true);
  if(md&&pf&&md.n==='Gold'&&pf.n==='Gold')txt('Gold in beiden Wertungen. Besser geht es nicht.',W/2,y+290,13,'#ffd23e','center',true);else txt('Tempo kostet Gewinn, Gewinn kostet Tempo. Gold in beiden ist die Königsdisziplin.',W/2,y+290,11.5,'#8f9aa0','center');
  txt('eingenommen '+euro(st.earned)+'  ·  Paletten '+st.sold[7]+' · Ballen '+(st.sold[4]+st.sold[5])+' · volle Kästen '+st.sold[6]+' · Planenballen '+st.sold[10]+' · Schrottbündel '+st.sold[11],W/2,y+314,11.5,'#9be28a','center');
  if(st.rest&&st.rest.n)txt('Reste in der Anlage: '+st.rest.n+' Stück, '+euro(st.rest.v)+' gutgeschrieben',W/2,y+332,11,'#aeb7bc','center');
  rr(ctx,W/2-100,y+352,200,48,10);ctx.fillStyle='#58b765';ctx.fill();txt('Nochmal',W/2,y+383,17,'#fff','center',true);button(W/2-100,y+352,200,48,()=>{try{localStorage.removeItem(SAVE_KEY)}catch(e){}start(true)})}
// Startbildschirm (E-020): Titel, Sonnenaufgang, Zelte. Haelt das Spiel an, bis ein Knopf getippt wird (ui.start).
function drawStart(){if(!ui.start)return;btns=[];const w=720,h=470,x=W/2-w/2,y=H/2-h/2,has=st.t>1,now=performance.now();ctx.fillStyle='rgba(8,14,12,.78)';ctx.fillRect(0,0,W,H);
  ctx.save();rr(ctx,x,y,w,h,20);ctx.clip();ctx.fillStyle=lg(ctx,0,y,0,y+h,['#1d2b4a','#3f4f7a','#e89a5a','#f4c56a']);ctx.fillRect(x,y,w,h);
  const sy=y+250;{const g=ctx.createRadialGradient(W/2,sy,10,W/2,sy,230);g.addColorStop(0,'rgba(255,236,170,.95)');g.addColorStop(0.18,'rgba(255,214,120,.75)');g.addColorStop(1,'rgba(255,190,90,0)');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.fillStyle='#fff3c4';ctx.beginPath();ctx.arc(W/2,sy,46+Math.sin(now/900)*1.5,0,6.3);ctx.fill()}
  ctx.fillStyle=lg(ctx,0,sy,0,y+h,['#5d8f3e','#3f6f30']);ctx.fillRect(x,sy,w,y+h-sy);ctx.fillStyle='rgba(20,40,12,.25)';ctx.fillRect(x,sy,w,3);
  [[x+92,sy+34,'#e0703a',1.5,false],[x+196,sy+22,'#3f9a8a',1.15,true],[x+w-104,sy+36,'#e7b923',1.55,true],[x+w-212,sy+20,'#b0509a',1.1,false]].forEach(q=>drawTent(ctx,{x:q[0],y:q[1],col:q[2],s:q[3],flip:q[4]}));
  for(let k=0;k<26;k++){const sd=(k*2654435761)>>>0;mini(k%3,x+30+(sd%(w-60)),sy+52+((sd>>>12)%34),1.1,k%12,k%4)}ctx.restore();
  rr(ctx,x,y,w,h,20);ctx.strokeStyle='rgba(255,236,170,.55)';ctx.lineWidth=2;ctx.stroke();
  txt('MONTAGMORGEN, 6 UHR',W/2,y+58,13,'#ffe9b0','center',true);ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=14;ctx.shadowOffsetY=3;txt('FESTIVALHANGOVER',W/2,y+122,58,'#fff6e0','center',true);ctx.restore();
  txt('Das Festival ist vorbei. Die Wiese räumt sich nicht von selbst.',W/2,y+156,15,'#fff0d0','center');
  const bb=(bx,bw,label,col,cb)=>{rr(ctx,bx,y+h-112,bw,52,11);ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1.5;ctx.stroke();txt(label,bx+bw/2,y+h-79,17,'#fff','center',true);button(bx,y+h-112,bw,52,cb)};
  if(has){bb(W/2-250,300,'Weiterspielen · '+tm(st.t),'#3f8f4f',()=>{ui.start=false;ui.resetArm=0});bb(W/2+70,180,ui.resetArm>0?'Wirklich neu?':'Neue Partie',ui.resetArm>0?'#a8553a':'#4a5560',()=>{if(ui.resetArm>0){try{localStorage.removeItem(SAVE_KEY)}catch(e){}start(true);ui.start=false}else ui.resetArm=3})}
  else bb(W/2-130,260,"Los geht's",'#3f8f4f',()=>{ui.start=false});
  if(ui.resetArm>0)ui.resetArm-=1/60;
  txt('Tippen oder ziehen sammelt  ·  Tasten 1 bis 0 wählen Bauteile  ·  Enter startet',W/2,y+h-36,11.5,'#e9f2e0','center');txt('Version '+VERSION,W/2,y+h-18,10,'#cfe0c0','center')}
function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#161b1a';ctx.fillRect(0,0,cv.width,cv.height);ctx.setTransform(S*DPR,0,0,S*DPR,offX*DPR,offY*DPR);btns=[];
  if(ui.tool!=='belt'&&(ui.planA||ui.plan)){ui.planA=null;ui.plan=null}
  if(ui.groundDirty){const R=ui.groundDirty;ui.groundDirty=false;buildGround(R===true?null:R)}
  if(ui.topoDirty)topo();if(st.t-ui.mmT>0.6||st.t<ui.mmT){ui.mmT=st.t;buildMini();updFresh(false)}
  if(cam.follow&&ui.tool==='walk'){cam.x+=(st.player.x-cam.x)*0.08;cam.y+=(st.player.y-cam.y)*0.08}clampCam();
  const w=toW(ptr.x,ptr.y);ptr.wx=w.x;ptr.wy=w.y;
  drawWorld();drawLight();
  drawGoal();
  if(ui.move||ui.tool!=='walk'){const tip=ui.move?'Neuen Platz antippen · Laufen oder Esc bricht ab':ui.tool==='belt'?(ui.plan?'Vorschlag prüfen · anderes Ziel ändert ihn':ui.planA?'Ziel antippen · Start nochmal: Einzelfeld':'Start antippen, dann Ziel · Ziehen legt direkt'):ui.tool==='demo'?'Tippen oder ziehen reißt ab · Zelt antippen baut es für '+euro(TENT_COST)+' ab':ui.tool==='sort'?'Tippen setzt, auch direkt auf ein Band · auf vorhandenen Sortierer tippen wechselt die Sorte, mit den Pressen auch Ballen, mit dem Abbautrupp Planen und Gestänge':ui.tool==='ab'?'Tippen setzt · der Trupp baut Zelte auf der ganzen Wiese ab, nahe zuerst · ein Band führt Planen und Gestänge zu den Pressen':ui.tool==='split'?'Tippen setzt, auch direkt auf ein Band':ui.tool==='wide'?'Über vorhandene Bänder tippen oder ziehen: zweite Spur, doppelte Menge':'Tippen setzt · Karte mit zwei Fingern, rechter Maustaste oder WASD verschieben';
    ctx.font='11px '+FONT;const tw=ctx.measureText(tip).width+24;rr(ctx,20,VIEW.y+VIEW.h-32,tw,22,11);ctx.fillStyle='rgba(16,22,20,.8)';ctx.fill();txt(tip,32,VIEW.y+VIEW.h-17,11,'#cfd8dc')}
  drawMiniMap();drawPanel();drawTop();drawToolbar();drawPlanBar();drawToast();
  drawEnd();
  drawStart();
  drawMenu()}

export {MM,S,movePos,btns,buildGround,buildItemLayer,buildMini,buildSprites,cv,draw,dropItemLayer,eraseItem,ghostPos,groundL,offX,offY,panelRect,ptr,resize,spr,toW};
