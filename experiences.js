// Self-contained, replaceable interactions for the project rooms. No portfolio assets are required.
const productionSteps = [
  ['01 / 想法', '先问清楚用途、尺寸与限制。图纸上的线，最后要成为能被使用的东西。'],
  ['02 / 拆解', '把材料、工艺和配合关系摆到桌面上；每个选择都会影响下一步。'],
  ['03 / 成形', '让分开的部分合在一起，再回头检查做出来的结果。']
];

function productionRoom() {
  return `<section class="experience experience-production" aria-labelledby="production-room-title">
    <div class="experience-heading"><span class="experience-kicker">03 / IDEA INTO OBJECT</span><h2 id="production-room-title">把想法，推到实物。</h2><p>拖动进度，让三个阶段在画面里合起来。这是过程的视觉示意，不代表某个具体模具结构。</p></div>
    <div class="production-workbench">
      <div class="assembly-scene" id="assembly-scene" style="--assembly:0" aria-hidden="true">
        <div class="assembly-grid"></div><span class="assembly-coordinate">D / 03<br>PROCESS STUDY</span>
        <svg class="assembly-drawing" viewBox="0 0 800 450" role="img" aria-label="产品从草图分解，再逐步组合的抽象示意">
          <defs><pattern id="assembly-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#e5b28a" opacity=".23"/></pattern></defs>
          <rect width="800" height="450" fill="url(#assembly-dots)"/>
          <g class="drawing-guide" fill="none" stroke="currentColor" stroke-width="1"><circle cx="400" cy="225" r="158"/><circle cx="400" cy="225" r="112"/><path d="M400 25v400M92 225h616M162 76l476 298M162 374 638 76"/></g>
          <g class="assembly-top" fill="none" stroke="currentColor" stroke-width="2"><path d="m268 158 132-64 132 64-132 65z"/><path d="m268 158 132 65 132-65v54l-132 65-132-65z"/><path d="m400 223 0 44m-132-55 132 65 132-65"/><path d="m350 159 50-24 50 24-50 25z"/></g>
          <g class="assembly-object" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m351 203 49-25 49 25v66l-49 25-49-25z"/><path d="m351 203 49 25 49-25M400 228v66"/><circle cx="400" cy="217" r="8"/></g>
          <g class="assembly-bottom" fill="none" stroke="currentColor" stroke-width="2"><path d="m260 276 140-68 140 68-140 69z"/><path d="m260 276 140 69 140-69v46l-140 69-140-69z"/><path d="M400 345v46"/><path d="m365 273 35-17 35 17-35 17z"/></g>
          <g class="assembly-measures" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M208 139v196m-8-196h16m-16 196h16M592 139v196m-8-196h16m-16 196h16"/></g>
        </svg>
        <div class="assembly-stamp"><span>FROM IDEA</span><strong id="assembly-stamp">01</strong><span>TO OBJECT</span></div>
      </div>
      <div class="production-controls"><div class="production-step"><span id="production-step-number">01 / 想法</span><p id="production-step-copy">${productionSteps[0][1]}</p></div><label for="assembly-range">推一推进度 <span id="assembly-progress">0%</span></label><input id="assembly-range" type="range" min="0" max="100" value="0" step="1" aria-describedby="production-step-copy"><div class="production-milestones" aria-hidden="true"><span>想法</span><span>拆解</span><span>成形</span></div></div>
    </div>
  </section>`;
}

function avatarRoom() {
  return `<section class="experience experience-avatar" aria-labelledby="avatar-room-title">
    <div class="experience-heading"><span class="experience-kicker">04 / WORKFLOW LAB</span><h2 id="avatar-room-title">算一次真正做完的成本。</h2><p>调整视频时长、单次生成投入与重试次数，看每分钟可用成片的成本怎样变化。下面是可修改的情景估算。</p></div>
    <div class="avatar-workbench"><div class="avatar-controls">
      <label for="avatar-duration">成片时长 <output id="avatar-duration-value">35 秒</output></label><input id="avatar-duration" type="range" min="15" max="180" step="5" value="35">
      <label for="avatar-cost">单次生成花费 <output id="avatar-cost-value">¥1.80</output></label><input id="avatar-cost" type="range" min="0.1" max="4" step="0.1" value="1.8">
      <label for="avatar-time">单次等待 <output id="avatar-time-value">40 分钟</output></label><input id="avatar-time" type="range" min="1" max="90" step="1" value="40">
      <div class="avatar-retries"><span>失败重试</span><div><button type="button" id="retry-less" aria-label="减少一次重试">−</button><output id="retry-count" aria-live="polite">0 次</output><button type="button" id="retry-more" aria-label="增加一次重试">＋</button></div></div>
      <p class="avatar-disclaimer">初始的 35 秒、约 40 分钟、¥1.80 来自一次早期使用记录（当时花费约 ¥1.5–2）。拖动后的值是情景输入，不是实测成果。</p>
    </div><div class="avatar-result" aria-live="polite"><div class="avatar-meter"><span>每分钟可用成片</span><div class="avatar-orbit"><div class="avatar-orbit-core"><small>总成本</small><strong id="avatar-total-cost">¥1.80</strong></div></div></div><div class="avatar-numbers"><div><span>折算成本 / 分钟</span><strong id="avatar-minute-cost">¥3.09</strong></div><div><span>完成这段的等待</span><strong id="avatar-total-time">40 分钟</strong></div><div class="avatar-target"><span>我的实验目标</span><strong>低于 ¥0.30 / 分钟</strong><small id="avatar-target-note">目标，尚未稳定验证</small></div></div><div class="avatar-attempts" id="avatar-attempts" aria-hidden="true"></div></div></div>
  </section>`;
}

const cases = [
  {
    title: '点击按钮，什么也没有发生。',
    clues: [
      ['画面', '按钮有按下的反馈，点击事件确实触发。'],
      ['控制台', '报错：ReferenceError: player is not defined。'],
      ['网络', '相关资源请求返回 200。']
    ],
    choices: ['改按钮的配色', '检查脚本里的 player 变量', '重新上传图片'],
    answer: 1,
    explanation: '事件已经触发；控制台给出了变量未定义的直接证据。先定位报错的脚本和变量来源。'
  },
  {
    title: '页面出现空白，封面没有加载。',
    clues: [
      ['画面', '文字和其他元素都正常出现。'],
      ['网络', '封面图片请求返回 404。'],
      ['路径', '部署后的路径里，文件名大小写和引用不一致。']
    ],
    choices: ['核对图片路径与文件名', '调高图片透明度', '换一套字体'],
    answer: 0,
    explanation: '404 表示请求的资源没找到。先核对引用路径和实际文件名，特别是大小写。'
  },
  {
    title: '按钮看得见，却怎么也点不到。',
    clues: [
      ['画面', '按钮上方有一层透明的装饰。'],
      ['检查元素', '指针命中的是装饰层，不是按钮。'],
      ['控制台', '没有出现脚本错误。']
    ],
    choices: ['增加重试次数', '检查遮挡层的指针事件', '压缩封面图片'],
    answer: 1,
    explanation: '透明元素仍可能接收点击。检查层级，或让纯装饰层使用 pointer-events: none。'
  }
];

function detectiveRoom() {
  return `<section class="experience experience-detective" aria-labelledby="detective-room-title">
    <div class="experience-heading"><span class="experience-kicker">06 / A SMALL CASE</span><h2 id="detective-room-title">先找证据，再动手修。</h2><p>这是一段可玩的排错样片。点开至少两条线索，再选你会先检查的方向。</p></div>
    <div class="detective-board"><div class="detective-case"><div class="detective-case-top"><span>CASE <strong id="case-number">01</strong> / 03</span><span id="clue-progress">0 / 3 条线索</span></div><h3 id="case-title"></h3><div class="detective-clues" id="detective-clues"></div></div><div class="detective-decision"><span class="control-label">你的第一步</span><div id="detective-choices" class="detective-choices"></div><p id="detective-feedback" class="detective-feedback" role="status">先看看线索。乱点，可能会离问题越来越远。</p><button type="button" id="next-case" class="detective-next" hidden>下一件案子 <span aria-hidden="true">↗</span></button></div></div>
  </section>`;
}

export function experienceMarkup(id) {
  if(id==='production')return productionRoom();
  if(id==='avatar')return avatarRoom();
  if(id==='detective')return detectiveRoom();
  return '';
}

export function initExperience(id, {signal, playSound, reducedMotion}) {
  if(id==='production') {
    const range=document.getElementById('assembly-range'),scene=document.getElementById('assembly-scene');
    let current=-1;
    const update=()=>{
      const value=Number(range.value),step=value<30?0:value<70?1:2;
      scene.style.setProperty('--assembly',String(value/100));
      scene.style.setProperty('--top-shift',`${-95*(1-value/100)}px`);
      scene.style.setProperty('--bottom-shift',`${75*(1-value/100)}px`);
      scene.style.setProperty('--object-shift',`${-15*(1-value/100)}px`);
      scene.style.setProperty('--part-opacity',String(.42+.58*value/100));
      document.getElementById('assembly-progress').textContent=`${value}%`;
      document.getElementById('assembly-stamp').textContent=`0${step+1}`;
      document.getElementById('production-step-number').textContent=productionSteps[step][0];
      document.getElementById('production-step-copy').textContent=productionSteps[step][1];
      if(current!==step && current!==-1)playSound('production');
      current=step;
    };
    range.addEventListener('input',update,{signal});update();
  }
  if(id==='avatar') {
    const duration=document.getElementById('avatar-duration'),cost=document.getElementById('avatar-cost'),time=document.getElementById('avatar-time');
    const attempts=document.getElementById('avatar-attempts');let retries=0;
    const update=()=>{
      const seconds=Number(duration.value),unitCost=Number(cost.value),minutes=Number(time.value),runs=retries+1;
      const total=unitCost*runs,perMinute=total*60/seconds;
      document.getElementById('avatar-duration-value').textContent=`${seconds} 秒`;
      document.getElementById('avatar-cost-value').textContent=`¥${unitCost.toFixed(2)}`;
      document.getElementById('avatar-time-value').textContent=`${minutes} 分钟`;
      document.getElementById('retry-count').textContent=`${retries} 次`;
      document.getElementById('avatar-total-cost').textContent=`¥${total.toFixed(2)}`;
      document.getElementById('avatar-minute-cost').textContent=`¥${perMinute.toFixed(2)}`;
      document.getElementById('avatar-total-time').textContent=`${minutes*runs} 分钟`;
      document.getElementById('avatar-target-note').textContent=perMinute<.3?'这个情景低于目标；仍需实测验证':'目标，尚未稳定验证';
      attempts.innerHTML=Array.from({length:runs},(_,i)=>`<span class="${i===runs-1?'successful':''}" style="--delay:${reducedMotion?0:i*70}ms"></span>`).join('');
      document.getElementById('retry-less').disabled=retries===0;
      document.getElementById('retry-more').disabled=retries===3;
    };
    [duration,cost,time].forEach(input=>input.addEventListener('input',update,{signal}));
    document.getElementById('retry-less').addEventListener('click',()=>{retries=Math.max(0,retries-1);playSound('avatar');update();},{signal});
    document.getElementById('retry-more').addEventListener('click',()=>{retries=Math.min(3,retries+1);playSound('avatar');update();},{signal});update();
  }
  if(id==='detective') {
    let index=0,opened=new Set(),solved=false;
    const title=document.getElementById('case-title'),clues=document.getElementById('detective-clues'),choices=document.getElementById('detective-choices'),feedback=document.getElementById('detective-feedback'),next=document.getElementById('next-case');
    const draw=()=>{
      const current=cases[index];opened=new Set();solved=false;
      document.getElementById('case-number').textContent=`0${index+1}`;
      document.getElementById('clue-progress').textContent='0 / 3 条线索';title.textContent=current.title;
      clues.innerHTML=current.clues.map(([label],i)=>`<button type="button" class="detective-clue" data-clue="${i}" aria-expanded="false"><span>0${i+1} / ${label}</span><strong>点开线索 ＋</strong><em></em></button>`).join('');
      choices.innerHTML=current.choices.map((label,i)=>`<button type="button" data-choice="${i}" disabled>${label}</button>`).join('');
      feedback.textContent='先看看线索。乱点，可能会离问题越来越远。';feedback.dataset.result='';next.hidden=true;
    };
    clues.addEventListener('click',event=>{
      const button=event.target.closest('[data-clue]');if(!button||!clues.contains(button))return;
      const clueIndex=Number(button.dataset.clue),wasOpen=opened.has(clueIndex);if(wasOpen)return;
      opened.add(clueIndex);button.classList.add('opened');button.setAttribute('aria-expanded','true');
      button.querySelector('strong').textContent=cases[index].clues[clueIndex][1];
      document.getElementById('clue-progress').textContent=`${opened.size} / 3 条线索`;
      if(opened.size>=2)choices.querySelectorAll('button').forEach(choice=>choice.disabled=solved);
      playSound('detective');
    },{signal});
    choices.addEventListener('click',event=>{
      const button=event.target.closest('[data-choice]');if(!button||button.disabled||solved)return;
      const correct=Number(button.dataset.choice)===cases[index].answer;
      if(correct){solved=true;button.classList.add('correct');choices.querySelectorAll('button').forEach(choice=>choice.disabled=true);next.hidden=false;next.textContent=index===cases.length-1?'重新接案 ↗':'下一件案子 ↗';}
      else button.classList.add('incorrect');
      feedback.dataset.result=correct?'correct':'incorrect';
      feedback.textContent=correct?cases[index].explanation:'这条证据还不能支持这个方向。再看一眼线索。';
      playSound(correct?'land':'detective');
    },{signal});
    next.addEventListener('click',()=>{index=(index+1)%cases.length;draw();playSound('detective');},{signal});draw();
  }
}
