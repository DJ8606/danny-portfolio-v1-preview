// Small, asset-independent opening scenes. Each chapter has its own action.
const chapters={
  illustration:{number:'01',hint:'一笔一笔，走进长卷。',button:'再添一笔',sound:'land'},
  layout:{number:'02',hint:'同样的字，换个位置看看。',button:'换个站位',sound:'land'},
  production:{number:'03',hint:'按下去，再松开看结构。',button:'压合 / 松开',sound:'production'},
  avatar:{number:'04',hint:'让这一段信号先跑起来。',button:'发出信号',sound:'avatar'},
  motion:{number:'05',hint:'拨动一帧，改变画面的时间。',button:'拨下一帧',sound:'motion'},
  detective:{number:'06',hint:'移动光束，找一找藏着的线索。',button:'照亮线索',sound:'detective'}
};

const scenes={
  illustration:`<div class="front-paper" aria-hidden="true"><svg viewBox="0 0 800 360" preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="front-hull"><stop stop-color="#ff5a3d"/><stop offset=".48" stop-color="#ffb03a"/><stop offset="1" stop-color="#4b7dff"/></linearGradient><linearGradient id="front-sail-a" x2="1" y2="1"><stop stop-color="#fff7cb"/><stop offset=".55" stop-color="#ff7fb2"/><stop offset="1" stop-color="#7b5cff"/></linearGradient><linearGradient id="front-sail-b" x2="1" y2="1"><stop stop-color="#f4ff9d"/><stop offset=".48" stop-color="#36d6c8"/><stop offset="1" stop-color="#2d78ff"/></linearGradient></defs>
    <path class="front-ink-line ink-one" d="M45 278Q158 244 250 268T455 254Q583 221 755 260"/><path class="front-ink-line ink-two" d="M65 219Q160 160 250 198T421 190Q513 135 607 183T755 158"/><path class="front-ink-line ink-three" d="M78 293Q195 273 318 301T549 286Q664 275 750 296"/><path class="front-ink-line ink-four" d="M115 126Q193 101 272 130M594 105Q666 83 729 114"/>
    <g class="front-boat" transform="translate(480 238)" stroke="#17191c" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4"><path d="M-46 29Q-18 22 1 29M8 31Q34 23 52 29" fill="none" stroke="#39c4ff" stroke-width="2"/><path d="M-34 10Q-5 22 36 9L29 26Q4 35-25 26Z" fill="url(#front-hull)"/><path d="M-5-43V22M18-31V20" fill="none" stroke-width="2"/><path d="M-5-40Q-28-13-23 8L-5 8Z" fill="url(#front-sail-a)"/><path d="M-2-38Q15-14 14 6L-2 8Z" fill="url(#front-sail-b)"/><path d="M18-30Q34-12 32 7L18 7Z" fill="#fff3a9"/><path d="M-5-43L9-40L-5-47ZM18-31L30-29L18-35Z" fill="#ff6946"/></g>
  </svg><span class="front-paper-mark">DRAW / 01</span></div>`,
  layout:`<div class="front-layout-board" aria-hidden="true"><div class="front-layout-image"></div><span class="front-layout-word">让字<br>找到位置<span>。</span></span><span class="front-layout-small">COMPOSITION<br>IS A CHOICE</span><i class="front-layout-guide guide-one"></i><i class="front-layout-guide guide-two"></i></div>`,
  production:`<div class="front-press" aria-hidden="true"><span class="front-measure measure-left">A / 01</span><span class="front-measure measure-right">B / 02</span><div class="front-press-top"><i></i><i></i><i></i></div><div class="front-press-object"><span>IDEA</span></div><div class="front-press-bottom"><i></i><i></i><i></i></div><div class="front-press-contact"></div><span class="front-press-note">PROCESS / NOT A SPECIFIC MOLD</span></div>`,
  avatar:`<div class="front-signal" aria-hidden="true"><div class="front-signal-rings"><i></i><i></i><i></i></div><div class="front-wave">${Array.from({length:27},(_,i)=>`<i style="--delay:-${i*41}ms;--size:${14+Math.round((Math.sin(i*.78)+1)*34+(Math.sin(i*1.83)+1)*15)}px"></i>`).join('')}</div><span class="front-signal-time">00:35 <b>→</b> 01:00+</span><span class="front-signal-mark">VOICE / TIME / COST</span></div>`,
  motion:`<div class="front-frames" aria-hidden="true"><div class="front-film-frame frame-back"><span>01</span><i></i></div><div class="front-film-frame frame-middle"><span>02</span><i></i></div><div class="front-film-frame frame-front"><span>03</span><i></i></div><div class="front-film-playhead"></div><span class="front-film-time">00:00:01:24</span></div>`,
  detective:`<div class="front-case" aria-hidden="true"><div class="front-case-dashes"></div><span class="front-case-tag">CASE / 06</span><div class="front-case-secret"><strong>报错藏在哪一层？</strong><span>先查证据，再动手。</span></div><div class="front-case-light"></div><span class="front-case-coordinate">X 042 / Y 017</span></div>`
};

export function chapterFront(project){
  const data=chapters[project.id];if(!data)return '';
  const scene=project.id==='illustration'?`<button type="button" class="chapter-front-scene chapter-front-canvas" aria-label="点击画纸添一笔，完成后进入长卷">${scenes[project.id]}</button>`:`<div class="chapter-front-scene">${scenes[project.id]}</div>`;
  return `<section class="chapter-front chapter-front--${project.id}" data-step="0" aria-label="${project.label}开场互动">
    <div class="chapter-front-top"><span>SIDE / ${data.number}</span><span>${project.english}</span></div>
    ${scene}
    <div class="chapter-front-bottom"><p id="front-hint">${data.hint}</p><div><button type="button" class="chapter-front-action">${data.button}<span aria-hidden="true">↗</span></button><button type="button" class="chapter-front-continue">${project.id==='illustration'?'先看作品 ↓':'继续看这一面 ↓'}</button></div></div>
  </section>`;
}

export function initChapterFront(project,{signal,reducedMotion=false,onSound=()=>{},onEnter=()=>{}}={}){
  const root=document.querySelector(`.chapter-front--${project.id}`);if(!root)return;
  const action=root.querySelector('.chapter-front-action'),hint=root.querySelector('#front-hint');let step=0,entering=false;
  const advance=()=>{
    if(project.id==='illustration'){
      if(entering)return;
      if(step===3){entering=true;root.classList.add('front-departing');setTimeout(onEnter,680);return;}
      step+=1;root.dataset.step=String(step);
      hint.textContent=step===3?'小船来了，进入长卷。':`第 ${step+1} 笔出现了。`;
      if(step===3)action.firstChild.textContent='进入长卷';
      onSound(chapters[project.id].sound);
      return;
    }
    step=project.id==='production'||project.id==='avatar'||project.id==='detective'?(step+1)%2:(step+1)%4;
    root.dataset.step=String(step);
    if(project.id==='production')hint.textContent=step?'结构压合了。松开，再看它怎样分开。':'分开的部分，等着下一次压合。';
    else if(project.id==='avatar')hint.textContent=step?'信号正在走。完成一次，还要算等待与重试。':'停下来，看看完成这段的真实投入。';
    else if(project.id==='detective')hint.textContent=step?'找到一条线索。下面还有完整的案子。':'光束收回了。再照一次，或往下查案。';
    else if(project.id==='layout')hint.textContent=['字又回到起点。','画面给字让出空间。','让字穿进画面。','把字留在边界里。'][step];
    else hint.textContent=['回到第一帧。','镜头推近。','画面切开。','停在这一帧。'][step];
    onSound(chapters[project.id].sound);
  };
  action.addEventListener('click',advance,{signal});
  if(project.id==='illustration')root.querySelector('.chapter-front-canvas').addEventListener('click',advance,{signal});
  root.querySelector('.chapter-front-continue').addEventListener('click',()=>{
    const target=root.nextElementSibling;
    target?.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'});
  },{signal});
  if(project.id==='detective'){
    const scene=root.querySelector('.front-case');
    const move=e=>{const rect=scene.getBoundingClientRect();scene.style.setProperty('--light-x',`${Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100))}%`);scene.style.setProperty('--light-y',`${Math.max(0,Math.min(100,(e.clientY-rect.top)/rect.height*100))}%`);};
    scene.addEventListener('pointermove',move,{signal});scene.addEventListener('pointerdown',move,{signal});
  }
}
