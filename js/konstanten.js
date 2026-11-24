// Montagmorgen: Konstanten
// Kartengroesse, Sorten, Gebaeudetypen, Rezepte, Verbesserungen. Importiert nichts.

const W=1280,H=800,T=32,MW=80,MH=52,WW=MW*T,WH=MH*T,LS=1.25,PS=2;
const VIEW={x:0,y:46,w:1280,h:680};
const DX=[1,0,-1,0],DY=[0,1,0,-1];
const FONT='system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
const AUTO_CAP=40,AUTO_RATE=1.5,ST_CAP=30,SAVE_KEY='montagmorgen2-v1';
// Menge an Pfand auf der Wiese. Zum Ausprobieren laesst sie sich ueber die Adresse aendern (?items=12000), der Spielstand merkt sich die Menge.
const QI=typeof location!=='undefined'?+new URLSearchParams(location.search).get('items'):0,N_ITEMS=QI>=500&&QI<=40000?Math.round(QI):12000,N_CRATES=Math.round(N_ITEMS*0.0325);
// Sorten: 0-3 liegen auf der Wiese, 4-7 entstehen in Maschinen. 8 und 9 kommen aus abgebauten Zelten (E-019), 10 und 11 aus ihren Pressen
const TY=[{n:'Dosen',val:25,col:'#c9d2d8'},{n:'PET',val:25,col:'#7fc4e8'},{n:'Glas',val:8,col:'#a8712f'},{n:'Leerkästen',val:150,col:'#d14b3c'},
 {n:'Dosenballen',val:450,col:'#e4eaed'},{n:'PET-Ballen',val:300,col:'#8fd0f0'},{n:'Volle Kästen',val:465,col:'#b23a2e'},{n:'Paletten',val:6750,col:'#c9a16a'},
 {n:'Planen',val:5,col:'#3fa392'},{n:'Gestänge',val:10,col:'#b9c2c8'},{n:'Planenballen',val:400,col:'#58b8a6'},{n:'Schrottbündel',val:600,col:'#9aa4aa'}];
// Sperrmuell aus Zelten: zaehlt in der Annahme wie Rohware (Warteschlange), bringt ungepresst fast nichts
const JUNK=t=>t===8||t===9,TENT_LOAD={tent:[8,8,8,9,9],pav:[8,8,9,9,9,9]},TENT_TIME=6,LAST_TENTS=12;
const VERSION=30,WORLD_SEED=11; // VERSION bei jeder Auslieferung erhoehen, auch in index.html
const RAW=4,TENT_COST=500,MORE=1.2; // MORE: jede weitere Maschine derselben Art kostet so viel mal mehr (E-014, gesenkt mit E-015) // Zelt oder Pavillon abbauen, in Cent
const BT={
 belt:{name:'Band',cost:50,w:1,h:1,info:['Ziehen legt eine Strecke.']},
 split:{name:'Verteiler',cost:300,w:1,h:1,info:['Verteilt reihum auf alle','Bänder, die wegführen.']},
 cross:{name:'Kreuzung',cost:400,w:1,h:1,info:['Zwei Bänder kreuzen sich,','ohne sich zu mischen.','Es geht nur geradeaus','weiter, nie um die Ecke.']},
 sort:{name:'Sortierer',cost:500,w:1,h:1,info:['Wirft seine Sorte in','Pfeilrichtung aus, der','Rest läuft weiter. Ist der','Auswurf voll, läuft auch','die Sorte weiter. Braucht','darum immer einen Weiterweg.']},
 station:{name:'Sammelstation',cost:1500,w:2,h:2,info:['Sammler räumen den','Umkreis leer und geben','so viel ab, wie ein Band trägt.']},
 pd:{name:'Dosenpresse',cost:4000,w:2,h:2,inp:{0:12},out:4,time:6,col:'#7d8a93'},
 pp:{name:'PET-Presse',cost:4000,w:2,h:2,inp:{1:8},out:5,time:8,col:'#3f86b8'},
 kp:{name:'Kistenpacker',cost:6000,w:2,h:2,inp:{2:20,3:1},out:6,time:10,col:'#a8553a'},
 pal:{name:'Palettierer',cost:15000,w:2,h:2,inp:{4:8,5:3},out:7,time:24,col:'#c98a2a'},
 ab:{name:'Abbautrupp',cost:30000,w:2,h:2,info:['Zwei Arbeiter bauen Zelte','und Pavillons ab, auf der','ganzen Wiese. Nahe Zelte','gehen schneller.']},
 pl:{name:'Planenpresse',cost:40000,w:2,h:2,inp:{8:6},out:10,time:5,col:'#2f8f80'},
 sc:{name:'Schrottpresse',cost:40000,w:2,h:2,inp:{9:8},out:11,time:6,col:'#69737a'},
 auto:{name:'Leergutannahme',w:2,h:3}
};
const TOOLS=['walk','belt','wide','split','sort','cross','station','pd','pp','kp','pal','ab','pl','sc','demo','rot'];
// Tasten fuer die Werkzeuge am PC: 1 bis 0 fuer die ersten zehn Bauteile, Q, E, T fuer die Zeltkette, X fuer den Abriss. W, A, S, D bleiben der Kamera
const HOT={};'1234567890qet'.split('').forEach((c,i)=>{HOT[c]=TOOLS[i+1]});HOT.x='demo';
const HOTKEY={};for(const c in HOT)HOTKEY[HOT[c]]=c.toUpperCase();
const UPS=[
 {k:'bag',name:'Größere Tüte',base:400,g:1.6,max:6,sub:l=>'fasst '+(25+10*l)},
 {k:'shoe',name:'Laufschuhe',base:500,g:1.6,max:5,sub:l=>'Tempo '+(110+18*l)},
 {k:'crew',name:'Mehr Sammler',base:3000,g:2.2,max:5,ph:2,sub:l=>(3+l)+' je Station'},
 {k:'range',name:'Größerer Umkreis',base:2500,g:2.6,max:3,ph:2,sub:l=>(8+3*l)+' Felder'},
 {k:'belt',name:'Schnellere Bänder',base:6000,g:2.5,max:2,ph:3,sub:l=>(3+1.5*l).toFixed(1).replace('.',',')+' Stück/s'}
];
// Ziele: Jedes erreichte Ziel schaltet Bauteile frei (OPEN). val liest den Fortschritt aus dem Spielstand.
// Die Reihenfolge ist die Lernkurve: von Hand, Station und Band, Sortieren und Pressen, dann die uebrigen Maschinen.
const TENT_W=12; // ein Zelt zaehlt im letzten Ziel so viel wie zwoelf Stueck Pfand
const GOALS=[
 {t:'Sammle Pfand von Hand',how:'Tippe oder ziehe auf der Wiese. Bring die volle Tüte zur Annahme links.',need:600,val:s=>s.earned,money:true},
 {t:'Lass sammeln',how:'Stelle eine Sammelstation an die Wiese und führe ein Band von ihr in die Annahme.',need:40,val:s=>s.viaBelt,unit:'Stück per Band'},
 {t:'Presse Dosen',how:'Sortierer auf Dosen ins Band setzen, sein Pfeil zeigt in die Dosenpresse. Von der Presse ein Band zur Annahme.',need:3,val:s=>s.sold[4],unit:'Dosenballen'},
 {t:'Presse PET',how:'Ein zweiter Sortierer auf PET füttert die PET-Presse. Ballen entlasten die Annahme.',need:3,val:s=>s.sold[5],unit:'PET-Ballen'},
 {t:'Packe Kästen',how:'Der Kistenpacker braucht Glas und Leerkästen: zwei Sortierer, zwei Eingänge.',need:3,val:s=>s.sold[6],unit:'volle Kästen'},
 {t:'Stapel Paletten',how:'Der Palettierer nimmt Dosenballen und PET-Ballen statt sie zu verkaufen. Sortierer können auch Ballen aus dem Band holen.',need:1,val:s=>s.sold[7],unit:'Palette'},
 {t:'Liefere Paletten in Serie',how:'Eine Kette reicht dafür kaum. Pressen direkt bei den Stationen entlasten die Bänder: Ein Ballen ersetzt zwölf Dosen. Nebenbei: Abbautrupps räumen die Zelte, die am Ende auch weg müssen.',need:10,val:s=>s.sold[7],unit:'Paletten'},
 {t:'Mach die Wiese besenrein',how:'Pfand einsammeln und alle Zelte abbauen. Abbautrupps zerlegen Zelte und Pavillons, Planenpresse und Schrottpresse machen Ballen daraus. Die letzten Stücke und Zelte blinken rot auf der Minikarte.',need:1,val:s=>s.total?(s.total-s.left[0]-s.left[1]-s.left[2]-s.left[3]+TENT_W*((s.tt||0)-(s.tl||0)))/(s.total+TENT_W*(s.tt||0)):0,pct:true}
];
// Zeitwertung am Ende, Grenzen in Minuten
const MEDALS=[{m:38,n:'Gold',col:'#ffd23e'},{m:45,n:'Silber',col:'#cfd8dc'},{m:60,n:'Bronze',col:'#d08a4a'}]; // E-017, aus vier Partien von Till (39:00 bis 45:15)
const WIDE_COST=100; // Aufpreis je Bandfeld fuer die zweite Spur (E-015), in Cent
const OPEN={wide:3,belt:1,station:1,sort:2,pd:2,pp:3,split:3,cross:3,kp:4,pal:5,ab:5,pl:5,sc:5};
const euro=c=>(c/100).toFixed(2).replace('.',',')+' €';
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

export {HOT,HOTKEY,JUNK,LAST_TENTS,TENT_LOAD,TENT_TIME,AUTO_CAP,AUTO_RATE,MEDALS,MORE,BT,DX,DY,FONT,H,LS,MH,MW,N_CRATES,N_ITEMS,GOALS,OPEN,PS,RAW,SAVE_KEY,ST_CAP,T,TENT_COST,TOOLS,WIDE_COST,TY,UPS,VERSION,VIEW,W,WH,WORLD_SEED,WW,euro,rng};
