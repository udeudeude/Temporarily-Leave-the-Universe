(()=>{'use strict';
const $=id=>document.getElementById(id),screen=$('screen'),out=$('output'),input=$('command'),entry=$('entry'),splash=$('splash'),typed=$('typed');
const key='tltu-museum-2',modeKey='tltu-theme';
const playerKey='tltu-adventurer-1';
let player=null,stage='hall',pendingDisk=null,booting=false;
const diskLabels=['THE FORTY-SEVENTH EXIT','THE VERB MERCHANT','THE MONSTER\'S ADVENTURE','THE INVENTORY OF LOST THINGS','THE CARTOGRAPHER\'S ERROR','THE DUNGEON OF UNFINISHED SENTENCES','THE LAST HIT POINT','THE ADVENTURE THAT WAS ALREADY WON'];
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
function loadPlayer(){try{return JSON.parse(localStorage.getItem(playerKey))}catch{return null}}
function savePlayer(){try{localStorage.setItem(playerKey,JSON.stringify(player))}catch{}}
function factoryReset(){
 if(!confirm('INITIALIZE ALL DISKS?\n\nTHIS ERASES YOUR ADVENTURER, ALL EIGHT ADVENTURE RECORDS, JOURNAL, COMMAND HISTORY, AND DISPLAY PREFERENCES.\n\nTHIS CANNOT BE UNDONE.'))return;
 try{[key,playerKey,modeKey].forEach(k=>localStorage.removeItem(k))}catch{}
 state=fresh();player=null;history=[];hi=0;pendingDisk=null;booting=false;
 stage='register';splashOn=true;mode='green';input.value='';syncCursor();entry.classList.remove('has-text');
 $('scan').value='150';$('glow').value='150';$('size').value='12';screen.style.fontSize='';
 $('scan').dispatchEvent(new Event('input'));applyMode();
 try{localStorage.removeItem(modeKey)}catch{}
 out.textContent='';syncCursor();splash.classList.add('visible');screen.scrollTop=0;
}
function playerName(){return player&&player.name?player.name:'ADVENTURER'}
function hall(){return [
'THE MAIN HALL',
'OF THE GUILD OF FREE ADVENTURERS',
'',
'WELCOME, '+playerName()+'.',
'',
'A BURLY IRISHMAN POLISHES A GLASS.',
...(state.done.includes(6)?['A FIRE BURNS IN THE HEARTH.','NO ONE REMEMBERS LIGHTING IT.']:['THE FIREPLACE HAS NOT BEEN LIT SINCE 1985.']),...(state.done.length?['','ON THE MANTEL: '+state.done.length+' OBJECT'+(state.done.length===1?'':'S')+' THAT SHOULD NOT EXIST.']:[]),
'',
'1. GO ON AN ADVENTURE',
'2. VISIT THE WEAPON SHOP',
'3. LEARN MAGIC',
'4. VISIT THE BANK',
'5. EXAMINE YOUR ABILITIES',
'6. TEMPORARILY LEAVE THE UNIVERSE',
'',
'CHOOSE 1-6.'].join('\n')}
function shelf(){return [
'DRIVE 1 IS EMPTY.',
'',
'THE GUILD KEEPS A WOODEN CASE OF',
'ADVENTURE DISKETTES.',
'',
...diskLabels.map((n,i)=>String(i+1).padStart(2,'0')+'  '+n+(state.done.includes(i)?' *':'')),
'',
'TYPE A NUMBER TO INSERT A DISK.',
'OR TYPE HALL TO RETURN.',
'',
'* COMPLETED ADVENTURE',...(state.done.length===8?['','09  [UNLABELED DISKETTE]']:[])].join('\n')}
function character(){return ['ADVENTURER: '+playerName()+(player.title?' / '+player.title:''),'HARDINESS: '+player.hardiness,'AGILITY: '+player.agility,'CHARISMA: '+player.charisma,'GOLD: '+player.gold,'WEAPON: '+player.weapon,'SPELL: '+player.spell,'','ADVENTURES COMPLETED: '+state.done.length,'','TYPE HALL TO RETURN.'].join('\n')}
function bootDisk(i){
 pendingDisk=i;stage='loading';booting=true;out.textContent='';
 print('INSERTING DISKETTE INTO DRIVE 1...\n\n'+String(i+1).padStart(2,'0')+' / '+diskLabels[i]+'\n\nAPPLE DOS 3.3\n\nCATALOG');
 const lines=['\n*DISK VOLUME '+String(i+1).padStart(3,'0'),' A 002 HELLO',' B 015 ADVENTURE',' T 004 READ.ME','\nBRUN ADVENTURE'];
 let n=0;const step=()=>{if(stage!=='loading'||pendingDisk!==i)return;if(n<lines.length){print(lines[n++]);setTimeout(step,n===lines.length?350:115)}else{stage='adventure';booting=false;state.room=i;state.visits++;save();out.textContent='';print('THE WONDERFUL WORLD OF EAMON\n\n'+diskLabels[i]+'\n\n'+showRoom());}};setTimeout(step,260)
}
function finishAdventure(){stage='hall';state.room='museum';save();out.textContent='';print('THE DISK DRIVE STOPS.\n\nYOUR ADVENTURER RETURNS TO THE MAIN HALL.'+(state.done.includes(6)&&!state.flags.fireNoticed?'\n\nA SOFT CRACKLE COMES FROM THE HEARTH.\nFOR THE FIRST TIME SINCE 1985, THERE IS A FIRE.':'')+'\n\n'+hall());if(state.done.includes(6)&&!state.flags.fireNoticed){state.flags.fireNoticed=true;save()}}
function hallCommand(v){
 if(v==='1'||v==='adventure'||v==='adventures'||v==='go adventuring'){stage='shelf';print(shelf());return true}
 if(v==='2'||v==='shop'||v==='weapon shop'){print('THE WEAPON SHOP\n\nA SWORD COSTS 40 GOLD.\nA CLUB COSTS 15 GOLD.\nTYPE BUY SWORD OR BUY CLUB.\nTYPE HALL TO RETURN.');stage='shop';return true}
 if(v==='3'||v==='magic'||v==='wizard'){stage='magic';print('A WIZARD OFFERS TO TEACH YOU BLAST.\nTUITION: 60 GOLD.\n\nTYPE LEARN BLAST OR HALL.');return true}
 if(v==='4'||v==='bank'){stage='bank';print('THE BANKER IS COUNTING GOLD.\nYOU HAVE '+player.gold+' GOLD.\n\nTYPE HALL TO RETURN.');return true}
 if(v==='5'||v==='abilities'||v==='character'){print(character());stage='abilities';return true}
 if(v==='6'||v==='quit'||v==='leave universe'){stage='departed';print('THE BURLY IRISHMAN SLAPS YOU ON THE BACK.\n\n"Y\'ALL COME BACK REAL SOON, YA HEAH?"\n\nYOUR ADVENTURER HAS BEEN SAVED.\n\nTYPE RETURN WHEN YOU COME BACK.');return true}
 if(v==='look'||v==='l'){print(hall());return true}
 if(v==='examine fireplace'||v==='look fireplace'||v==='look at fireplace'){print(state.done.includes(6)?'A SMALL FIRE BURNS WITHOUT FUEL. ITS LIGHT MAKES THE HALL SEEM OLDER AND NEWER AT ONCE.':'THE ASHES ARE COLD. SOMEONE HAS LEFT A SINGLE EMPTY SPACE AMONG THE COALS, AS THOUGH EXPECTING AN EMBER.');return true}
 if(v.startsWith('talk')){print('"ADVENTURES DON\'T COME TO YOU," SAYS THE BARTENDER. "UNLESS SOMETHING HAS GONE VERY WRONG."');return true}
 return false
}
function load(){try{let x=JSON.parse(localStorage.getItem(key));return x&&Array.isArray(x.done)&&x.flags?x:fresh()}catch{return fresh()}}
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
function syncCursor(){typed.textContent=input.value.toUpperCase()}
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
if(['ctrl','controls','settings'].includes(v))return 'TYPE ONE OF THESE COMMANDS:\n\nGREEN / AMBER / TV\nSCANLINES 0-300  [NOW '+$('scan').value+']\nGLOW 0-300       [NOW '+$('glow').value+']\nSIZE 6-24        [NOW '+$('size').value+']\n\nEXAMPLE: GLOW 200\n\nINITIALIZE  [ERASE ALL HISTORY]';
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
 if(/^(examine|look at) (room|walls|doors|exits)$/.test(v))return progress('THE MAN COUNTS FORTY-SEVEN DOORS. THEN HE COUNTS YOU. HE LOOKS PLEASED.');
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
if(splashOn){splashOn=false;splash.classList.remove('visible');out.textContent='';if(!player){stage='register';print('THE WONDERFUL WORLD OF EAMON\n\nTHE GUILD REGISTRAR LOOKS UP.\n\nWHAT IS YOUR NAME?')}else{stage='hall';print(hall())}return}
if(!v)return;
print('> '+raw.toUpperCase().trim());
if(stage==='register'){player={name:raw.trim().toUpperCase().slice(0,24),hardiness:16,agility:13,charisma:11,gold:200,weapon:'NONE',spell:'NONE'};savePlayer();stage='hall';print('WELCOME TO THE GUILD, '+player.name+'.\n\n'+hall());return}
if(stage==='loading')return;
if(stage==='departed'){if(v==='initialize'||v==='init'||v==='reset all'||v==='factory reset'){factoryReset();return}if(['return','enter','restart','hall'].includes(v)){stage='hall';print(hall())}else print('THE GUILD IS WAITING. TYPE RETURN.');return}
const setting=control(v);if(setting!==null){print(setting);return}
if(v==='clear'){out.textContent='';return}
if(v==='restart'){print('TO RETURN TO THE MAIN HALL, TYPE HALL.\nFOR SYSTEM OPTIONS, TYPE CTRL.');return}
if(v==='initialize'||v==='init'||v==='reset all'||v==='factory reset'){factoryReset();return}
if(v==='help'||v==='?'){print(stage==='hall'?'CHOOSE 1-6.\nLOOK  TALK  INVENTORY  CTRL':stage==='shelf'?'TYPE A DISK NUMBER, OR HALL.':help().replace('RESTART  CLEAR  CTRL','RESTART  CLEAR  CTRL'));return}
if(v==='journal'||v==='status'){print(status());return}
if((v==='inventory'||v==='inv'||v==='i')&&stage==='hall'){print('WEAPON: '+player.weapon+'\nGOLD: '+player.gold+'\nSPELL: '+player.spell);return}
if((v==='inventory'||v==='inv'||v==='i')&&stage==='abilities'){print('WEAPON: '+player.weapon+'\nGOLD: '+player.gold+'\nSPELL: '+player.spell);return}
if(v==='initialize'||v==='init'||v==='reset all'||v==='factory reset'){factoryReset();return}
if(v==='hall'&&stage!=='adventure'){stage='hall';print(hall());return}
if(stage==='hall'){if(v==='initialize'||v==='init'||v==='reset all'||v==='factory reset'){factoryReset();return}if(!hallCommand(v))print('CHOOSE 1-6, OR TYPE HELP.');return}
if(stage==='shop'){if(v==='buy sword'||v==='buy club'){let cost=v==='buy sword'?40:15;if(player.gold<cost){print('NOT ENOUGH GOLD.');return}player.gold-=cost;player.weapon=v==='buy sword'?'SWORD':'CLUB';savePlayer();print('PURCHASED '+player.weapon+'. GOLD REMAINING: '+player.gold);return}print('TYPE BUY SWORD, BUY CLUB, OR HALL.');return}
if(stage==='magic'){if(v==='learn blast'){if(player.gold<60){print('NOT ENOUGH GOLD.');return}player.gold-=60;player.spell='BLAST';savePlayer();print('YOU LEARN BLAST. THE WIZARD ASKS YOU NOT TO PRACTICE IN THE HALL.');return}print('TYPE LEARN BLAST OR HALL.');return}
if(stage==='ninth'){if(v==='accept'){stage='hall';player.title='CURATOR';savePlayer();print('THE GUILD REGISTRY ADDS A NEW LINE:\n\n'+playerName()+', CURATOR OF IMPOSSIBLE ADVENTURES.\n\nTHE NINTH DISKETTE IS BLANK. IT IS WAITING FOR SOMEONE TO WRITE IT.\n\n'+hall());return}if(v==='decline'){stage='hall';print('THE DISK DRIVE FALLS SILENT.\n\n'+hall());return}print('TYPE ACCEPT OR DECLINE.');return}
if(stage==='bank'||stage==='abilities'){print('TYPE HALL TO RETURN.');return}
if(stage==='shelf'){if(v==='initialize'||v==='init'||v==='reset all'||v==='factory reset'){factoryReset();return}if((v==='9'||v==='09'||v==='disk 9')&&state.done.length===8){stage='ninth';print('DISK DRIVE 1 WHIRS WITHOUT A DISK.\n\nTHE SCREEN READS:\n\nTHE CURATOR HAS TEMPORARILY LEFT THE UNIVERSE.\n\nSOMEONE MUST MIND THE HALL.\n\nTYPE ACCEPT OR DECLINE.');return}let m=v.match(/^(?:insert |disk |load )?0?([1-8])$/);if(m){bootDisk(Number(m[1])-1);return}if(v==='look'){print(shelf());return}print('CHOOSE A DISK NUMBER (1-8), OR HALL.');return}
if(v==='hint'){if(stage!=='adventure'){print('THE GUILD OFFERS NO HINTS.');return}let i=state.room;if(i==='museum'){print('EACH DOOR HAS ITS OWN RULES. TYPE A NUMBER TO ENTER.');return}let n=flagHint(i);print(hints[i][n]);return}
if(v==='inventory'||v==='inv'||v==='i'){print(stage==='hall'?'WEAPON: '+player.weapon+'\nGOLD: '+player.gold:state.room==='museum'?(state.done.length?'YOU CARRY '+state.done.length+' IMPOSSIBLE SOUVENIRS.':'YOU ARE CARRYING AN UNFINISHED ADVENTURE.'):objects[state.room].length?'YOU CARRY:\n'+objects[state.room].join('\n'):'YOU CARRY YOURSELF.');return}
if(v==='leave'||v==='exit'||v==='museum'||v==='back'||v==='south'&&state.room!=='museum'){finishAdventure();return}
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
state=load();player=loadPlayer();mode=['green','amber','tv'].includes(localStorage.getItem(modeKey))?localStorage.getItem(modeKey):'green';
$('scan').oninput=e=>document.documentElement.style.setProperty('--scan-dark',(+e.target.value/300*.94).toFixed(3));
$('glow').oninput=applyMode;
$('size').oninput=e=>{screen.style.fontSize=e.target.value+'px'};
$('scan').dispatchEvent(new Event('input'));applyMode();
entry.addEventListener('submit',e=>{e.preventDefault();let t=input.value;input.value='';syncCursor();entry.classList.remove('has-text');if(t.trim()){history.push(t);hi=history.length}run(t);input.focus()});
input.addEventListener('input',()=>{syncCursor();entry.classList.toggle('has-text',!!input.value)});
input.addEventListener('keydown',e=>{if(e.key==='ArrowUp'){e.preventDefault();input.value=history[Math.max(0,--hi)]||''}if(e.key==='ArrowDown'){e.preventDefault();input.value=history[Math.min(history.length,++hi)]||''}syncCursor();entry.classList.toggle('has-text',!!input.value)});
screen.addEventListener('click',e=>{if(splashOn){run('');input.focus()}else if(e.target===screen||e.target===out){input.focus()}});
splash.addEventListener('click',e=>{e.stopPropagation();run('');input.focus()});
if(window.visualViewport){const resize=()=>{let sh=$('shell');sh.style.height=window.visualViewport.height+'px';sh.style.top=window.visualViewport.offsetTop+'px';screen.scrollTop=screen.scrollHeight};window.visualViewport.addEventListener('resize',resize);window.visualViewport.addEventListener('scroll',resize);resize()}
syncCursor();splash.classList.add('visible');
}
start();
})();