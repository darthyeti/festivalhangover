// Montagmorgen: Zustand
// Spielstand st, Bedienzustand ui, Kamera. Nur dieses Modul weist st neu zu (resetState).
import {T,WH} from './konstanten.js';

let st;
function resetState(){st=newState()}
const ui={tool:'walk',rot:0,sel:null,topoDirty:true,mmT:0,resetArm:0};
const cam={x:300,y:WH/2,z:1,follow:true};
function newState(){return{money:0,earned:0,t:0,done:false,up:{bag:0,shoe:0,auto:0,crew:0},left:[0,0,0,0],total:0,sold:[0,0,0,0,0,0,0,0],
  player:{x:5*T,y:26.5*T,tx:5*T,ty:26.5*T,bag:[],cool:0,ucool:0,ph:0,dir:0,walk:false},fly:[],pops:[],hint:0,lastMsg:-9}}
const upPrice=u=>Math.round(u.base*Math.pow(u.g,st.up[u.k])/10)*10;

export {cam,resetState,st,ui,upPrice};
