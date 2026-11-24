// Montagmorgen: Zustand
// Spielstand st, Bedienzustand ui, Kamera. Nur dieses Modul weist st neu zu (resetState).
import {OPEN,T,WH} from './konstanten.js';

let st;
function resetState(){st=newState()}
const ui={tool:'walk',rot:0,sel:null,topoDirty:true,orderDirty:true,mmT:0,resetArm:0,undo:[],step:null,undoing:false,move:null,planA:null,plan:null,menu:false,saved:false,groundDirty:false,planCross:true,toast:null,newT:-9,goalMin:false,busyT:0};
const cam={x:300,y:WH/2,z:1,follow:true};
function newState(){return{money:0,earned:0,t:0,done:false,up:{bag:0,shoe:0,crew:0,range:0,belt:0},ph:0,viaBelt:0,rest:null,left:[0,0,0,0],total:0,tl:0,tt:0,sold:[0,0,0,0,0,0,0,0,0,0,0,0],
  player:{x:5*T,y:26.5*T,tx:5*T,ty:26.5*T,bag:[],cool:0,ucool:0,ph:0,dir:0,walk:false},fly:[],pops:[],hint:0,lastMsg:-9}}
const upPrice=u=>Math.round(u.base*Math.pow(u.g,st.up[u.k])/10)*10;

// Abgeleitete Werte aus Verbesserungen und Zielen
// Abbautrupp: kein Umkreis, die Arbeiter laufen ueber die ganze Wiese (Wunsch von Till nach T-014). Weite Wege kosten Zeit, das ist die Grenze
const stR=()=>(8+3*st.up.range)*T,abR=()=>1e9,bspd=()=>3+1.5*st.up.belt,isOpen=k=>!(OPEN[k]>st.ph),isSt=b=>b.k==='station'||b.k==='ab';
// Sorten, die ein Sortierer waehlen kann. Mit jeder Presse kommt ihr Ballen dazu, mit dem Abbautrupp Plane und Gestaenge
const sorts=()=>{const a=[0,1,2,3];if(isOpen('pd'))a.push(4);if(isOpen('pp'))a.push(5);if(isOpen('ab'))a.push(8,9);return a},nSort=()=>sorts().length,nextSort=f=>{const a=sorts();return a[(a.indexOf(f)+1)%a.length]};
function toast(txt){ui.toast={txt,t:performance.now()}}

export {abR,bspd,cam,isOpen,isSt,nSort,nextSort,sorts,resetState,st,stR,toast,ui,upPrice};
