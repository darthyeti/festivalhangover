// Montagmorgen: Konstanten
// Kartengroesse, Sorten, Gebaeudetypen, Rezepte, Verbesserungen. Importiert nichts.

const W=1280,H=800,T=32,MW=80,MH=52,WW=MW*T,WH=MH*T,LS=1.25,PS=2;
const VIEW={x:0,y:46,w:1280,h:680};
const DX=[1,0,-1,0],DY=[0,1,0,-1];
const FONT='system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
const BSPD=3,AUTO_CAP=40,ST_CAP=30,ST_R=8*T,N_ITEMS=8000,N_CRATES=260,SAVE_KEY='montagmorgen2-v1';
// Sorten: 0-3 liegen auf der Wiese, 4-7 entstehen in Maschinen
const TY=[{n:'Dosen',val:25,col:'#c9d2d8'},{n:'PET',val:25,col:'#7fc4e8'},{n:'Glas',val:8,col:'#a8712f'},{n:'Leerkästen',val:150,col:'#d14b3c'},
 {n:'Dosenballen',val:450,col:'#e4eaed'},{n:'PET-Ballen',val:300,col:'#8fd0f0'},{n:'Volle Kästen',val:465,col:'#b23a2e'},{n:'Paletten',val:6750,col:'#c9a16a'}];
const RAW=4,TENT_COST=500; // Zelt oder Pavillon abbauen, in Cent
const BT={
 belt:{name:'Band',cost:50,w:1,h:1,info:['Trägt 3 Stück/s.','Ziehen legt eine Strecke.']},
 split:{name:'Verteiler',cost:300,w:1,h:1,info:['Verteilt reihum auf alle','Bänder, die wegführen.']},
 sort:{name:'Sortierer',cost:500,w:1,h:1,info:['Wirft seine Sorte in','Pfeilrichtung aus, der','Rest läuft weiter. Ist der','Auswurf voll, läuft auch','die Sorte weiter.']},
 station:{name:'Sammelstation',cost:1500,w:2,h:2,info:['Sammler räumen den','Umkreis leer und geben','bis 3 Stück/s aufs Band.']},
 pd:{name:'Dosenpresse',cost:4000,w:2,h:2,inp:{0:12},out:4,time:6,col:'#7d8a93'},
 pp:{name:'PET-Presse',cost:4000,w:2,h:2,inp:{1:8},out:5,time:8,col:'#3f86b8'},
 kp:{name:'Kistenpacker',cost:6000,w:2,h:2,inp:{2:20,3:1},out:6,time:10,col:'#a8553a'},
 pal:{name:'Palettierer',cost:15000,w:2,h:2,inp:{4:8,5:3},out:7,time:24,col:'#c98a2a'},
 auto:{name:'Leergutannahme',w:2,h:3}
};
const TOOLS=['walk','belt','split','sort','station','pd','pp','kp','pal','demo','rot'];
const UPS=[
 {k:'bag',name:'Größere Tüte',base:400,g:1.6,max:6,sub:l=>'fasst '+(25+10*l)},
 {k:'shoe',name:'Laufschuhe',base:500,g:1.6,max:5,sub:l=>'Tempo '+(110+18*l)},
 {k:'auto',name:'Annahme schneller',base:500,g:1.6,max:8,sub:l=>(1.5+l).toFixed(1).replace('.',',')+' Stück/s'},
 {k:'crew',name:'Mehr Sammler',base:3000,g:2,max:3,sub:l=>(3+l)+' je Station'}
];
const euro=c=>(c/100).toFixed(2).replace('.',',')+' €';
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

export {AUTO_CAP,BSPD,BT,DX,DY,FONT,H,LS,MH,MW,N_CRATES,N_ITEMS,PS,RAW,SAVE_KEY,ST_CAP,ST_R,T,TENT_COST,TOOLS,TY,UPS,VIEW,W,WH,WW,euro,rng};
