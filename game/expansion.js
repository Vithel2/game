import {CHAPTERS,chapterStatus,claimChapter,advanceTime,startShift,answerShift,wageFor,claimWage,seasonFor,skyPhase} from './progression.js';
import {money} from './state.js';
import {FOOD} from './products.js';
const LABELS={battery:'Аккумулятор',charge:'Шлейф зарядки',ram:'Память',gpu:'Видеокарта',ssd:'SSD',phone:'Телефон'};
const itemName=id=>FOOD[id]?.name||LABELS[id]||id;
export class Expansion{
 constructor(api){Object.assign(this,api);this.journalTab='story';this.workPlace='grocery';this.clockSave=0;this.skill=null;}
 handle(action,id,el){
  const s=this.state(),w=this.world();
  if(action==='journalTab'){this.journalTab=id;this.open('quests');return true}
  if(action==='story'){this.journalTab='story';this.open('quests');return true}
  if(action==='storyChoice'){const c=claimChapter(s,id);if(c){this.dialogue={chapter:c,step:0};this.open('chapterDialogue');this.audio.play('reward');this.persist()}return true}
  if(action==='dialogueNext'){if(++this.dialogue.step>=2)this.open('quests');else this.persist();return true}
  if(action==='credits'){this.open('credits');return true}
  if(action==='map'){this.open('map');return true}
  if(action==='nav'){this.close();if(id==='park')this.handle('park');else this.walk(id);return true}
  if(action==='park'){
   this.close();const go=()=>w.walkTo([21.5,.05,2.35],async()=>{await w.transitionTo('park');s.stats.parkVisits++;this.tick(8,1);this.persist()});if(w.mode!=='street')w.transitionTo('street').then(go);else go();return true;
  }
  if(action==='parkExit'){this.close();w.transitionTo('street').then(()=>this.persist());return true}
  if(action==='salvage'){
   if(w.mode!=='park')return true;if(s.lastSalvageDay===s.day){this.toast('Сегодня коробку уже осмотрели.');return true}this.close();w.walkTo([-2.4,.05,-1.45],()=>w.performLife('salvage',()=>{s.lastSalvageDay=s.day;s.stats.salvaged++;const part=s.day%7===0?'display':s.day%2?'battery':'charge';s.parts[part]++;this.tick(25,5);this.audio.play('reward');this.persist();this.toast('Находка: '+itemName(part))}));return true;
  }
  if(action==='sofa'||action==='parkRest'){
   const home=action==='sofa',key=home?'lastRestDay':'lastParkRestDay';if(s[key]===s.day){this.toast('Сегодня уже отдыхали здесь.');return true}
   if(w.mode!==(home?'room':'park'))return true;this.close();w.walkTo(home?[4,.05,-.02]:[-2.8,.05,.42],()=>w.performLife('rest',()=>{s[key]=s.day;s.energy=Math.min(100,s.energy+(home?30:18));this.tick(home?45:30,0);this.persist()},{},{sofa:home,seat:home?null:[-2.8,-.08,-.30]}));return true;
  }
  if(action==='workMenu'){
   const place=s.work.active?.place||id;if(!['grocery','pickup'].includes(place))return true;if(s.shop.basket&&Object.keys(s.shop.items).length){this.toast('Сначала оплати покупки.');return true}this.workPlace=place;this.close();this.approachWork(place,()=>this.open('work'));return true;
  }
  if(action==='startShift'){
   if(w.mode!==this.workPlace)return true;if(!s.work.active)startShift(s,this.workPlace);if(!s.work.active){this.toast('На сегодня смена уже занята.');return true}this.open('work');this.persist();return true;
  }
  if(action==='shiftPick'){
   const a=s.work.active;if(!a||a.finished)return true;const ok=answerShift(s,id);if(!ok){this.audio.play('error');this.toast('Проверь заказ ещё раз.');this.persist();return true}
   w.performLife('work',()=>this.persist(),id,{place:a.place});this.persist();return true;
  }
  if(action==='finishShift'){if(s.work.active){s.work.active.finished=true;this.persist()}return true}
  if(action==='claimWage'){const wage=claimWage(s);if(wage!==null){this.tick(75,12);this.audio.play('coin');this.persist();this.toast('За смену: '+money(wage))}return true}
  if(action==='skillHit'){
   const a=this.skill;if(!a)return true;const p=this.phone();if(!p)return true;
   if(Math.abs(a.needle-a.target)>a.width/2){s.energy=Math.max(0,s.energy-1);this.audio.play('error');this.toast('Чуть точнее: нажми, когда отметка в зелёной зоне.');return true}
   a.hits++;p.skillScores||={};p.skillScores[a.action]=a.hits;this.audio.play('scan');
   if(a.hits>=3){this.close();this.skill=null;w.performRepair(a.action,0,()=>this.completeRepair(a.action,0));}else{a.target=[.34,.67,.46][a.hits];this.persist()}return true;
  }
  return false;
 }
 approachWork(place,done){const w=this.world(),target=place==='grocery'?[-2.16,.23,-.10]:[-.95,.23,-.05];const inside=()=>{w.staffWorking=true;w.walkTo(target,()=>{w.avatar.rotation.y=0;done()})};if(w.mode===place){inside();return}const outside=()=>w.walkTo(place==='grocery'?[6.59,.05,1.65]:[12.22,.05,1.65],async()=>{await w.transitionTo(place);this.persist();inside()});if(w.mode==='street')outside();else w.transitionTo('street').then(outside);}
 beginSkill(action){const p=this.phone();this.skill={action,hits:Math.min(2,p.skillScores?.[action]||0),needle:.5,target:.34,width:p.difficulty==='expert'?.19:.29,time:0};this.skill.target=[.34,.67,.46][this.skill.hits];this.open('repairSkill');}
 render(modal){const s=this.state(),b=this.button;
  if(modal==='quests'){
   const tabs=`<nav class="journal-tabs">${[['story','История'],['goals','Задания'],['jobs','Работа']].map(([id,label])=>b('journalTab',label,this.journalTab===id?'mint':'',`data-id="${id}"`)).join('')}</nav>`;
   if(this.journalTab==='story'){const c=chapterStatus(s);return tabs+(c?`<span class="eyebrow">ГЛАВА ${s.story.chapter+1} / ${CHAPTERS.length}</span><h2>${c.title}</h2><blockquote>${c.who}: «${c.line}»</blockquote><div class="chapter-goals">${c.goals.map(g=>`<div class="chapter-goal"><span>${g.done?'✓':'○'} ${g.label}</span><b>${Math.min(g.value,g.target)} / ${g.target}</b><progress value="${g.value}" max="${g.target}"></progress></div>`).join('')}</div><p>Награда: ${money(c.reward)} и один подарок на выбор.</p><div class="story-choices">${b('storyChoice','Деталь для мастерской','mint',`data-id="craft" ${c.ready?'':'disabled'}`)}${b('storyChoice','Поддержка канала','',`data-id="media" ${c.ready?'':'disabled'}`)}</div>`:`<h2>Своё дело. Своя история.</h2><p>Все главы пройдены. Район продолжает жить — новые сделки и смены будут завтра.</p>`)+`<details class="story-history"><summary>Пройдено глав: ${s.story.history.length}</summary>${s.story.history.map(h=>`<p>${CHAPTERS.find(c=>c.id===h.id)?.title} · день ${h.day}</p>`).join('')}</details>`;}
   if(this.journalTab==='jobs')return tabs+`<h2>Работа в районе</h2><div class="job-pair">${b('workMenu','Смена в Пятаке','mint','data-id="grocery"')}${b('workMenu','Смена в Azon','','data-id="pickup"')}</div><p class="note">Пять заказов за смену. Больше опыта — выше оплата.</p>${this.renderJobs()}`;
   return tabs+`<h2>Задания</h2>${this.renderGoals()}`;
  }
  if(modal==='chapterDialogue'){const d=this.dialogue;return `<span class="eyebrow">${d.chapter.who}</span><h2>${d.step===0?d.chapter.title:'Следующий шаг'}</h2><p class="dialogue-line">${d.step===0?d.chapter.line:(CHAPTERS[s.story.chapter]?.line||'Дальше история продолжается твоими решениями.')}</p>${b('dialogueNext',d.step===0?'Дальше':'К моим планам','wide mint')}`;}
  if(modal==='map')return `<span class="eyebrow">ТВОЙ РАЙОН</span><h2>Куда пойдём?</h2><div class="district-map">${[['goHome','Дом и мастерская','⌂'],['grocery','Пятак','▧'],['pickup','Azon','▣'],['park','Старый сквер','♧']].map(([id,name,icon])=>`<button data-action="nav" data-id="${id}"><b>${icon}</b><span>${name}</span></button>`).join('')}</div>`;
  if(modal==='work')return this.workHTML();
  if(modal==='repairSkill'){const a=this.skill;return `<span class="eyebrow">${a.action==='heat'?'КОНТРОЛЬ ПРОГРЕВА':a.action==='solder'?'ТОЧНАЯ ПАЙКА':'КАЛИБРОВКА'}</span><h2>${a.hits} / 3 контакта</h2><p>Нажми, когда отметка в зелёной зоне.</p><div class="skill-meter"><i class="skill-zone" style="left:${(a.target-a.width/2)*100}%;width:${a.width*100}%"></i><b class="skill-needle"></b></div>${b('skillHit',a.action==='heat'?'Прогреть':a.action==='solder'?'Контакт':'Проверить','wide mint')}<small>Промах расходует немного энергии. Прибор сохраняет успешные контакты.</small>`;}
  if(modal==='credits')return `<span class="eyebrow">С РУК · 0.6</span><h2>Vithel</h2><p>Разработчик: <strong>Vithel</strong></p><p>Создано с помощью <strong>GPT-6.1 Sol</strong></p><h3>Звук</h3><label class="volume-control">Музыка <output>${Math.round(s.options.music*100)}%</output><input id="music-volume" data-setting="music" type="range" min="0" max="100" value="${Math.round(s.options.music*100)}"></label><label class="volume-control">Эффекты <output>${Math.round(s.options.effects*100)}%</output><input id="effects-volume" data-setting="effects" type="range" min="0" max="100" value="${Math.round(s.options.effects*100)}"></label><details><summary>Музыка, звуки и лицензии</summary><p>HoliznaCC0 — MIdLife; I love Myself More Than Anyone Else.</p><p>Звуки: Kenney Interface Sounds и Impact Sounds (CC0).</p><p>Nunito и Russo One (SIL OFL). Three.js (MIT). Подробные источники и лицензии включены в архив игры.</p></details>`;
  return null;
 }
 counterButtons(modal){if(modal==='grocery'||modal==='pickup')return this.button('workMenu','Подработать здесь','wide',`data-id="${modal}"`);if(modal==='pause')return this.button('map','Карта района','wide')+this.button('credits','Звук и авторы','wide');return '';}
 workHTML(){const s=this.state(),a=s.work.active,b=this.button,place=a?.place||this.workPlace,title=place==='grocery'?'Пятак · касса':'Azon · выдача';
  if(!a)return `<span class="eyebrow">${title}</span><h2>Подработка</h2><p>Пять заказов. Базовая оплата — ${money(250+Math.min(5,Math.floor(s.work[place]/3))*50)}.</p><p class="note">Выбирай товар по запросу. Ошибки уменьшают оплату. Для зачётной смены нужны три заказа.</p><small>Смен: ${s.work[place]} · заработано всего ${money(s.work.earned)}</small>${b('startShift',s.work.last[place]===s.day?'На сегодня смена завершена':'Начать смену','wide mint',s.work.last[place]===s.day?'disabled':'')}`;
  if(a.finished)return `<span class="eyebrow">${title}</span><h2>Смена завершена</h2><div class="shift-total">${money(wageFor(s))}</div><p>${a.index} / 5 заказов · ${a.errors} ошибок</p>${b('claimWage','Получить оплату','wide mint')}`;
  const task=a.tasks[a.index];return `<span class="eyebrow">${title}</span><div class="shift-status"><strong>Заказ ${a.index+1} / 5</strong><span id="shift-time">${Math.ceil(a.remaining)} с</span></div><h2>${place==='grocery'?'Пробей покупку':'Найди посылку'}</h2><div class="shift-request">${this.img(task.item)}<div><strong>${itemName(task.item)}</strong><small>${place==='pickup'?'Ячейка '+task.cell:'Покупатель ждёт у кассы'}</small></div></div><div class="shift-options">${task.options.map(id=>b('shiftPick',itemName(id),'',`data-id="${id}"`)).join('')}</div><small>Ошибок: ${a.errors} · −15 ₽ за ошибку</small>${b('finishShift','Закончить раньше','wide subtle')}`;
 }
 afterPaint(title,modal){const s=this.state(),w=this.world();this.audio.setLevels(s.options);this.audio.duck(!!modal);w.friendConversing=modal==='friend';w.staffWorking=modal==='work';
  document.querySelectorAll('[data-setting]').forEach(el=>el.addEventListener('input',()=>{s.options[el.dataset.setting]=Number(el.value)/100;el.parentElement.querySelector('output').textContent=el.value+'%';this.audio.setLevels(s.options);this.save()}));
  if(!title&&s.training.complete){const c=chapterStatus(s),o=document.getElementById('objective');if(w.mode==='repair')o.classList.add('hidden');else if(c)o.innerHTML=`<span class="eyebrow">ГЛАВА ${s.story.chapter+1}</span><strong>${c.title}</strong><small>${c.goals.filter(g=>g.done).length} / ${c.goals.length} целей · журнал сверху</small>`;}
  const dock=document.querySelector('#dock .dock-actions');if(dock&&s.training.complete&&!['grocery','pickup'].includes(w.mode))dock.insertAdjacentHTML('beforeend',this.button('map',this.icon('street')+'<span>Карта</span>'));
 }
 frame(dt,title,modal){
  const s=this.state(),w=this.world();if(!title&&s.training.complete&&modal!=='pause'&&!['prologue','character','credits'].includes(modal)){
   const day=s.day;advanceTime(s,dt);s.food=Math.max(0,s.food-dt/75);s.water=Math.max(0,s.water-dt/60);this.clockSave+=dt;if(this.clockSave>12){this.clockSave=0;this.save()}if(s.day!==day){this.toast('Новый день · '+seasonFor(s.day).name);this.persist()}
  }
  const clock=document.querySelector('#hud .lilac span');if(clock&&w.lifeAction?.kind!=='sleep'){const value=String(Math.floor(s.time/60)%24).padStart(2,'0')+':'+String(Math.floor(s.time%60)).padStart(2,'0');if(clock.textContent!==value)clock.textContent=value;}
  const dayBadge=document.querySelector('#hud .day');if(dayBadge)dayBadge.dataset.season=seasonFor(s.day).name;
  this.audio.update();this.audio.setTheme(w.mode==='repair'?'repair':skyPhase(s.time).dark>.6?'night':'home');
  if(this.skill&&modal==='repairSkill'){const a=this.skill;a.time+=dt;a.needle=.5+.45*Math.sin(a.time*(this.phone()?.difficulty==='expert'?3.7:2.7));const el=document.querySelector('.skill-needle');if(el)el.style.left=(a.needle*100)+'%';}
  const a=s.work.active;if(a&&!a.finished&&modal==='work'&&!w.busy){a.remaining=Math.max(0,a.remaining-dt);const el=document.querySelector('#shift-time');if(el)el.textContent=Math.ceil(a.remaining)+' с';if(!a.remaining){a.finished=true;this.persist()}}
 }
}
