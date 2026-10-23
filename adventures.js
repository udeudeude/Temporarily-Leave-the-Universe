(()=>{'use strict';
const $=id=>document.getElementById(id),screen=$('screen'),out=$('output'),input=$('command'),entry=$('entry'),splash=$('splash');
const key='tltu-museum-2',modeKey='tltu-theme';
const names=['THE FORTY-SEVENTH EXIT','THE VERB MERCHANT',"THE MONSTER'S ADVENTURE",'THE INVENTORY OF LOST THINGS',"THE CARTOGRAPHER'S ERROR",'THE DUNGEON OF UNFINISHED SENTENCES','THE LAST HIT POINT','THE ADVENTURE THAT WAS ALREADY WON'];
const intro=[
'FORTY-SEVEN EXITS ARE CUT INTO THE WALL OF A SINGLE ROOM. THE ROOM HAS NO WINDOWS. A MAN WITH A BELL SAYS HE HAS BEEN WAITING FOR THE FORTY-EIGHTH.',
'A MERCHANT HAS A SHOP FULL OF WORDS. THE PRICE TAGS ARE WRITTEN IN A LANGUAGE YOU CAN ALMOST SPEAK.',
'A MONSTER IS PREPARING TO BEGIN ITS ADVENTURE. YOU ARE LISTED UNDER EQUIPMENT.',
'YOU ARE IN A CLOAKROOM. YOUR POCKETS ARE FULL OF THINGS YOU DO NOT RECALL ACQUIRING.',
'A CARTOGRAPHER HAS NAILED A MAP TO THE WALL. THE MAP IS PERFECT. THE ROOM IS CLEARLY NOT WHERE THE MAP SAYS IT IS.',
'YOU ENTER A DUNGEON WHOSE DESCRIPTION ENDS IN THE MIDDLE OF A...',
'YOU LIE UPON A SLAB. A CHALK NOTICE READS: DECEASED. REMAINING HIT POINTS: 1.',
'THE TYRANT IS DEAD. THE TREASURE IS GONE. A PARADE HAS BEEN ARRANGED FOR THE PERSON WHO WON. NOBODY CAN REMEMBER WHO THAT WAS.'
];
const hints=[
['THE BELL IS NOT FOR THE EXITS.','COUNT SOMETHING OTHER THAN THE DOORS. TRY COUNT ROOM.'],
['SOME WORDS ARE FREE, BUT YOU MUST TAKE THEM.','TALK MERCHANT, THEN TAKE REMEMBER. RETURN TO THE MUSEUM AND USE REMEMBER.'],
['THE MONSTER WANTS AN ENCOUNTER, NOT A VICTIM.','TALK MONSTER, THEN PLAY VILLAIN OR GIVE MONSTER A QUEST.'],
['THE INVENTORY IS A RECORD OF SOMEONE ELSE.','EXAMINE YOUR OBJECTS, THEN RETURN THE KEY TO ITS OWNER.'],
['DO NOT REPAIR THE MAP.','MOVE THE ROOM, NOT THE MAP. TRY MOVE ROOM.'],
['THE ROOM IS WAITING FOR ITS NOUN.','COMPLETE THE SENTENCE WITH A WORD. TRY COMPLETE DOOR.'],
['YOU HAVE ONE HIT POINT. SPEND IT WISELY.','GIVE YOUR LAST HIT POINT TO THE FERRYMAN.'],
['THE ANSWER IS NOT A PERSON.','EXAMINE TROPHY, THEN NAME NOBODY AS THE WINNER.']
];
const objects=[[],['REMEMBER'],['A SCRIPT'],['A SMALL KEY','A RECEIPT FOR RAIN','A CHILDHOOD YOU NEVER HAD'],['A PERFECT MAP'],['A PERIOD'],['ONE HIT POINT'],['A TROPHY']];
let state,history=[],hi=0,splashOn=true,mode='green',hintStep=0;
function fresh(){return {room:'museum',done:[],flags:{},visits:0,history:[]}}
function load(){try{let x=JSON.parse(localStorage.getItem(key));return x&&Array.isArray(x.done)&&x.flags?x:fresh()}catch{return fresh()}}
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
function print(t=''){out.textContent+=(out.textContent?'\n':'')+t;requestAnimationFrame(()=>screen.scrollTop=screen.scrollHeight)}
function status(){return 'EXHIBITS COMPLETED: '+state.done.length+'/8'+(state.done.length?'\n'+state.done.map(n=>(n+1)+'. '+names[n]).join('\n'):'')}
function museum(){
let lines=['THE MUSEUM OF IMPOSSIBLE ADVENTURES','','A CURATOR IS ASLEEP BEHIND A DESK.','EIGHT DOORS STAND IN A SEMICIRCLE.',''];
for(let i=0;i<8;i++)lines.push((i+1)+'. '+names[i]+(state.done.includes(i)?' [COMPLETE]':''));
lines.push('','A BRASS PLATE READS:','"EVERYTHING HERE MAY BE FINISHED.','NOTHING HERE IS ENTIRELY OVER."','','TYPE A NUMBER TO ENTER AN EXHIBIT.','LOOK, TALK CURATOR, INVENTORY, JOURNAL, HELP.');
if(state.done.length)lines.push('','THE DESK HOLDS '+state.done.length+' UNEXPECTED SOUVENIR'+(state.done.length===1?'':'S')+'.');
if(state.done.length===8)lines.push('','THE CURATOR HAS LEFT A NINTH DOOR AJAR.','TYPE NINE.');
return lines.join('\n');
}
function showRoom(){return state.room==='museum'?museum():names[state.room]+'\n\n'+intro[state.room]+(state.flags['progress'+state.room]?'\n\n'+state.flags['progress'+state.room]:'')+'\n\nTYPE LOOK, EXAMINE, TALK, INVENTORY, HELP, OR LEAVE.'}
function finish(i,text){if(!state.done.includes(i))state.done.push(i);state.flags['finished'+i]=true;save();print(text+'\n\n*** ADVENTURE COMPLETE ***\n\nSOMETHING HAS CHANGED IN THE MUSEUM.\nTYPE LEAVE TO RETURN.')}
function normalize(s){return s.toLowerCase().trim().replace(/\s+/g,' ').replace(/[.!?]+$/,'')}
function control(t){
const v=normalize(t);
if(['green','amber','tv','t.v.','display green','display amber','display tv','display t.v.'].includes(v)){mode=v.includes('amber')?'amber':v.includes('green')?'green':'tv';applyMode();return 'DISPLAY: '+mode.toUpperCase()}
if(['ctrl','controls','settings'].includes(v))return 'DISPLAY: GREEN  AMBER  TV\nSCANLINES '+$('scan').value+' (0-300)\nGLOW '+$('glow').value+' (0-300)\nSIZE '+$('size').value+' (6-24)\n\nE.G. GLOW 200';
const m=v.match(/^(scanlines|glow|size)\s+(\d+)$/);
if(m){const el=$(m[1]==='scanlines'?'scan':m[1]);let n=+m[2];if(n<+el.min||n>+el.max)return 'RANGE: '+el.min+'-'+el.max;el.value=n;el.dispatchEvent(new Event('input'));return m[1].toUpperCase()+': '+n}
return null;
}
function help(){return 'LOOK  EXAMINE  TALK  TAKE  GIVE\nINVENTORY  JOURNAL  HINT  LEAVE\nRESTART  CLEAR  CTRL\n\nAT THE MUSEUM: TYPE 1-8 TO ENTER.\nIN AN EXHIBIT: TRY ITS OWN WORDS.'}
function exhibit(v){
const i=state.room,flag=state.flags,progress=x=>{flag['progress'+i]=x;save();return x};
if(state.done.includes(i)&&['look','l'].includes(v))return showRoom()+'\n\nTHIS ADVENTURE HAS ALREADY BEEN COMPLETED.';
switch(i){
case 0:
 if(/^(count|examine|look at) (room|walls|doors|exits)$/.test(v))return progress('THE MAN COUNTS FORTY-SEVEN DOORS. THEN HE COUNTS YOU. HE LOOKS PLEASED.');
 if(v==='ring bell'||v==='take bell')return 'THE BELL RINGS ONCE. EVERY DOOR OPENS ONTO THIS ROOM.';
 if(['count myself','count me','count adventurer','count the room','count room','forty eight','48','count 48'].includes(v))return finish(i,'THE MAN RINGS HIS BELL. "FORTY-EIGHT," HE SAYS. ALL THE DOORS VANISH. THERE IS NOW AN EXIT WHERE YOU WERE STANDING.');
 if(/^go |^enter |^\d+$/.test(v))return 'YOU PASS THROUGH AN EXIT AND ARRIVE IN THE SAME ROOM. THE MAN MARKS A SMALL TICK ON HIS CUFF.';
 if(v.startsWith('talk'))return '"THE DOORS ARE ALL ACCOUNTED FOR," SAYS THE MAN. "BUT THE ROOM IS NOT."';
 break;
case 1:
 if(v.startsWith('talk'))return progress('"THE WORD REMEMBER IS FREE," SAYS THE MERCHANT. "THE WORD BUY COSTS MORE THAN YOU HAVE."');
 if(['take remember','take word','take jar','buy remember'].includes(v)){flag.remember=true;save();return 'YOU TAKE REMEMBER. THE MERCHANT GIVES YOU NO RECEIPT. "TRY IT WHERE THINGS ARE FORGOTTEN."'}
 if(v==='remember'){if(!flag.remember)return 'YOU CANNOT REMEMBER A WORD YOU DO NOT POSSESS.';return finish(i,'YOU SPEAK REMEMBER. THE SHOP REMEMBERS BEING A DOOR. THE MERCHANT BOWS AND STEPS ASIDE.')}
 if(v.startsWith('buy'))return 'YOU DO NOT YET OWN THE VERB BUY. THIS MAKES TRANSACTIONS DIFFICULT.';
 if(v.startsWith('examine'))return 'A JAR LABELED OPEN IS EMPTY. A JAR LABELED REMEMBER CONTAINS A WORD THAT WILL NOT STAY STILL.';
 break;
case 2:
 if(v.startsWith('talk'))return progress('"I AM TO RESCUE A PRINCESS," THE MONSTER SAYS. "BUT I HAVE NO VILLAIN. WILL YOU BE ONE?"');
 if(['play villain','be villain','be the villain','act villain','give monster a quest','give quest','help monster'].includes(v))return finish(i,'YOU STAND BEFORE THE MONSTER AND ANNOUNCE THAT THE PRINCESS IS IN ANOTHER CASTLE. THE MONSTER ROARS WITH DELIGHT. ITS ADVENTURE HAS FINALLY BEGUN. IT THANKS YOU FOR BEING SO THOROUGHLY OBJECTIONABLE.');
 if(v.startsWith('attack')||v.startsWith('kill'))return 'THE MONSTER ASKS WHETHER YOU HAVE READ YOUR PART. IT HAS NOT YET LEARNED TO FIGHT.';
 if(v.startsWith('examine'))return 'THE MONSTER IS WEARING A HEROIC CAPE. THE SCRIPT LISTS YOU AS "MINOR OBSTACLE, OPTIONAL."';
 break;
case 3:
 if(v.startsWith('examine')||v==='inventory'||v==='i')return progress('YOU HAVE A SMALL KEY, A RECEIPT FOR RAIN, AND A CHILDHOOD YOU NEVER HAD. THE KEY IS ENGRAVED: PROPERTY OF THE CLOAKROOM ATTENDANT.');
 if(v.startsWith('talk'))return '"I LOST MY KEY," SAYS A VOICE FROM INSIDE A COAT. "I HAVE BEEN LOOKING FOR IT SINCE BEFORE YOU WERE BORN."';
 if(['give key','return key','give key to attendant','give small key','give key to coat'].includes(v))return finish(i,'YOU GIVE THE KEY TO THE VOICE IN THE COAT. THE CLOAKROOM OPENS. A VERY OLD CHILD THANKS YOU AND HANDS BACK THE CHILDHOOD, NOW PROPERLY FOLDED.');
 if(v.startsWith('take'))return 'YOU ARE ALREADY CARRYING IT. THE DIFFICULT PART IS KNOWING WHY.';
 break;
case 4:
 if(v.startsWith('examine')||v==='map'||v==='read map')return progress('THE MAP MARKS YOUR POSITION IN A ROOM DIRECTLY NORTH OF THIS ONE. THE MAP HAS NEVER BEEN WRONG. THE ROOM IS EMBARRASSED.');
 if(['move room','move the room','push room','move dungeon','shift room','go north'].includes(v))return finish(i,'YOU PUSH AGAINST THE WALL. THE ROOM SLIDES ONE SQUARE SOUTH. THE MAP AND THE WORLD AGREE. SOMEWHERE FAR AWAY, A CARTOGRAPHER WEEPS WITH RELIEF.');
 if(v.startsWith('draw')||v.startsWith('change map'))return 'THE MAP REFUSES TO BE ALTERED. A SMALL INK HAND SLAPS YOUR FINGERS.';
 break;
case 5:
 if(v.startsWith('examine')||v==='read')return progress('THE DESCRIPTION ENDS: "YOU ENTER A DUNGEON WHOSE DESCRIPTION ENDS IN THE MIDDLE OF A..." THERE IS A BLANK SPACE WHERE THE WALL SHOULD BE.');
 if(['complete door','finish door','say door','door','write door'].includes(v))return finish(i,'YOU SUPPLY THE WORD DOOR. A DOOR APPEARS WHERE THE SENTENCE ENDS. IT OPENS INTO THE MUSEUM, BUT THE HINGES ARE MADE OF COMMAS.');
 if(v.startsWith('complete ')||v.startsWith('finish ')||v.startsWith('say ')){const word=v.split(' ').slice(1).join(' ');return progress('YOU COMPLETE THE SENTENCE WITH "'+word.toUpperCase()+'." A '+word.toUpperCase()+' APPEARS, THEN VANISHES. THE DUNGEON WANTS A WAY OUT.')}
 break;
case 6:
 if(v.startsWith('examine')||v==='status')return progress('THE FERRYMAN WAITS BY A RIVER. YOUR PULSE IS ABSENT, BUT YOUR LAST HIT POINT HAS NOT YET BEEN SPENT.');
 if(v.startsWith('talk'))return '"ONE POINT TO CROSS," SAYS THE FERRYMAN. "NO CHANGE GIVEN."';
 if(['give hit point','give point','give last hit point','pay ferryman','give point to ferryman','give hit point to ferryman'].includes(v))return finish(i,'YOU PAY THE FERRYMAN YOUR LAST HIT POINT. YOU NOW HAVE ZERO. "THAT IS HOW IT WORKS," HE SAYS, AND FERRIES YOU BACK TO THE LIVING.');
 if(v.startsWith('heal'))return 'YOU CANNOT HEAL WHAT THE WORLD INSISTS IS ALREADY FINISHED.';
 break;
case 7:
 if(v.startsWith('examine')||v==='look at trophy'||v==='read trophy')return progress('THE TROPHY HAS NO NAME ON IT. ON ITS BASE IS WRITTEN: "VICTORY BELONGS TO THOSE WHO DO NOT CLAIM IT."');
 if(v.startsWith('talk'))return '"THE WINNER MUST BE NAMED BEFORE SUNSET," SAYS THE MASTER OF CEREMONIES. "THE PARADE HAS ALREADY STARTED."';
 if(['name nobody','nobody','declare nobody','winner nobody','name no one','no one won'].includes(v))return finish(i,'YOU INSCRIBE NOBODY ON THE TROPHY. THE CROWD CHEERS FOR NOBODY. THE PARADE MARCHES THROUGH EMPTY STREETS, AND AT LAST THE CITY IS AT PEACE.');
 if(v.startsWith('name ')||v.startsWith('claim'))return 'THE TROPHY GROWS HEAVIER. THE CROWD LOOKS AT YOU WITH DEEP SUSPICION.';
 break;
}
return "THAT DOESN'T SEEM TO WORK HERE. TRY EXAMINING SOMETHING, TALKING, OR USING HINT.";
}
function run(raw){
const v=normalize(raw);
if(splashOn){splashOn=false;splash.classList.remove('visible');out.textContent='';print(museum());return}
if(!v)return;
print('> '+raw.toUpperCase().trim());
const setting=control(v);if(setting!==null){print(setting);return}
if(v==='clear'){out.textContent='';return}
if(v==='restart'){if(confirm('START OVER AND ERASE COMPLETED EXHIBITS?')){state=fresh();save();out.textContent='';print(museum())}return}
if(v==='help'||v==='?'){print(help());return}
if(v==='journal'||v==='status'){print(status());return}
if(v==='hint'){let i=state.room;if(i==='museum'){print('EACH DOOR HAS ITS OWN RULES. TYPE A NUMBER TO ENTER.');return}let n=flagHint(i);print(hints[i][n]);return}
if(v==='inventory'||v==='i'){print(state.room==='museum'?(state.done.length?'YOU CARRY '+state.done.length+' IMPOSSIBLE SOUVENIRS.':'YOU ARE CARRYING AN UNFINISHED ADVENTURE.'):objects[state.room].length?'YOU CARRY:\n'+objects[state.room].join('\n'):'YOU CARRY YOURSELF.');return}
if(v==='leave'||v==='exit'||v==='museum'||v==='back'||v==='south'&&state.room!=='museum'){state.room='museum';hintStep=0;save();print(museum());return}
if(state.room==='museum'){
if(/^[1-8]$/.test(v)||/^enter [1-8]$/.test(v)){const i=Number(v.slice(-1))-1;state.room=i;hintStep=0;state.visits++;save();print(showRoom());return}
if(v==='9'||v==='nine'){print(state.done.length===8?'BEHIND THE NINTH DOOR IS A CHAIR. IT IS STILL WARM. A NOTE READS: "THE CURATOR HAS TEMPORARILY LEFT THE UNIVERSE."':'THERE ARE ONLY EIGHT DOORS. THE CURATOR SEEMS TO BE SAVING A SPACE.');return}
if(v==='look'||v==='l'){print(museum());return}
if(v.startsWith('talk')){print(state.done.length===8?'"I WAS NEVER ASLEEP," SAYS THE EMPTY CHAIR.':'THE CURATOR OPENS ONE EYE. "COMPLETION IS A PECULIAR FORM OF DEPARTURE," HE SAYS.');return}
if(v==='remember'){print(state.done.includes(1)?'THE MUSEUM REMEMBERS ITS FIRST DOOR. A NINTH HINGE CREAKS SOMEWHERE.':'YOU HAVE NOT YET LEARNED HOW.');return}
print('THE MUSEUM WAITS. TYPE A NUMBER FROM 1 TO 8, OR HELP.');return;
}
if(v==='look'||v==='l'){print(showRoom());return}
if(v==='help'){print(help());return}
print(exhibit(v));
}
function flagHint(i){const k='hint'+i,n=state.flags[k]||0;state.flags[k]=Math.min(1,n+1);save();return n}
function applyMode(){
document.getElementById('shell').classList.toggle('amber',mode==='amber');
document.getElementById('shell').classList.toggle('tv',mode==='tv');
const ink=mode==='amber'?'#ffbf00':mode==='tv'?'#f5f5f5':'#77ef70';
const rgb=mode==='amber'?'255,176,0':mode==='tv'?'245,245,245':'85,235,75';
document.documentElement.style.setProperty('--ink',ink);
document.documentElement.style.setProperty('--glow','rgba('+rgb+','+Math.min(1,Number($('glow').value)/180)+')');
document.documentElement.style.setProperty('--dragon-ink',ink);
try{localStorage.setItem(modeKey,mode)}catch{}
}
function start(){
state=load();mode=['green','amber','tv'].includes(localStorage.getItem(modeKey))?localStorage.getItem(modeKey):'green';
$('scan').oninput=e=>document.documentElement.style.setProperty('--scan-dark',(+e.target.value/300*.94).toFixed(3));
$('glow').oninput=applyMode;
$('size').oninput=e=>{screen.style.fontSize=e.target.value+'px'};
$('scan').dispatchEvent(new Event('input'));applyMode();
entry.addEventListener('submit',e=>{e.preventDefault();let t=input.value;input.value='';entry.classList.remove('has-text');if(t.trim()){history.push(t);hi=history.length}run(t);input.focus()});
input.addEventListener('input',()=>entry.classList.toggle('has-text',!!input.value));
input.addEventListener('keydown',e=>{if(e.key==='ArrowUp'){e.preventDefault();input.value=history[Math.max(0,--hi)]||''}if(e.key==='ArrowDown'){e.preventDefault();input.value=history[Math.min(history.length,++hi)]||''}entry.classList.toggle('has-text',!!input.value)});
screen.addEventListener('click',e=>{if(splashOn){run('');input.focus()}else if(e.target===screen||e.target===out){input.focus()}});
splash.addEventListener('click',e=>{e.stopPropagation();run('');input.focus()});
if(window.visualViewport){const resize=()=>{let sh=$('shell');sh.style.height=window.visualViewport.height+'px';sh.style.top=window.visualViewport.offsetTop+'px';screen.scrollTop=screen.scrollHeight};window.visualViewport.addEventListener('resize',resize);window.visualViewport.addEventListener('scroll',resize);resize()}
splash.classList.add('visible');
}
start();
})();