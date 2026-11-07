export const ipSeries = [
  { name: 'RINGER', type: '角色 / 品牌延展', color: '#69d5cd', ink: '#102f34', focus: '0%', pages: [[4, '角色亮相'], [7, '三视图'], [8, '动态拓展'], [12, '车身应用'], [15, 'TRENDLY 视觉']] },
  { name: '尚朋高科', type: '科技 / 场景应用', color: '#0875db', ink: '#ffffff', focus: '49%', pages: [[19, '角色亮相'], [27, '场景应用']] },
  { name: '金诺达', type: '角色 / 产品应用', color: '#5834d2', ink: '#ffffff', focus: '85%', pages: [[34, '角色亮相'], [37, '3D 四视图'], [49, '产品应用']] },
  { name: '欣冠', type: '科技 / 品牌空间', color: '#1f4ca1', ink: '#ffffff', focus: '70%', pages: [[62, '空间应用'], [53, '平面三视图'], [55, '动态展示']] },
  { name: 'BLUBBY', type: '角色 / 衍生设计', color: '#0878d8', ink: '#ffffff', focus: '50%', pages: [[63, '角色亮相'], [66, '3D 三视图'], [70, '贴纸应用'], [74, '造型探索']] }
];

const pageImage=page=>`assets/ip-stage/p${page}.jpg`;
export const ringerMoods=[
  ['你好丫','hello','先打个招呼'],['哈哈','laugh','笑出声'],['好开心','happy','今天很开心'],
  ['比心','heart','送你一颗心'],['加油','cheer','再试一次'],['看我的','show','开始表演'],
  ['你真棒','praise','为你鼓掌'],['好无聊啊','bored','等点新鲜事'],['人呢？','where','你在哪里'],
  ['我太难了','hard','需要喘口气'],['生气了','angry','也有小脾气'],['辛苦了','care','今天辛苦了'],
  ['OK','ok','收到'],['溜了溜了','leave','先走一步'],['晚安','night','明天见']
];
export const ipStories=[
  [
    ['角色设定','从角色介绍到三视图',[[5,'角色介绍'],[6,'视觉设定'],[7,'三视图']]],
    ['动作延展','用动作、造型和表情建立性格',[[8,'动态拓展 01'],[9,'动态拓展 02'],[10,'造型变化']]],
    ['品牌应用','把林格带进平面与真实场景',[[11,'平面应用'],[12,'车身应用'],[15,'系列海报']]]
  ],
  [
    ['角色设定','从品牌原点到立体造型',[[20,'角色介绍'],[21,'创作原点'],[22,'平面三视图'],[23,'3D 三视图']]],
    ['动作与情绪','姿态和表情的完整延展',[[24,'动作拓展 01'],[25,'动作拓展 02'],[26,'表情设计']]],
    ['场景应用','进入空间、广告与传播画面',[[27,'场景应用'],[28,'户外广告'],[29,'展览空间'],[32,'主题海报']]]
  ],
  [
    ['角色设定','平面造型与立体呈现',[[35,'角色介绍'],[36,'平面四视图'],[37,'3D 四视图']]],
    ['形象延展','动作、服装与表情',[[38,'动作设计'],[40,'换装设计'],[42,'表情设计']]],
    ['产品应用','包装、空间与产品视觉',[[43,'包装应用'],[44,'手提袋应用'],[45,'户外广告'],[49,'产品主视觉']]]
  ],
  [
    ['角色设定','从角色定位到 3D 造型',[[52,'角色介绍'],[53,'平面三视图'],[54,'3D 四视图']]],
    ['动作与表情','让角色进入日常交流',[[55,'动态展示'],[56,'表情设计 01'],[57,'表情设计 02']]],
    ['品牌应用','画册、海报与活动空间',[[58,'画册封面'],[59,'画册内页'],[60,'系列海报'],[62,'活动场景']]]
  ],
  [
    ['角色设定','从平面轮廓到立体角色',[[64,'角色亮相'],[65,'平面三视图'],[66,'3D 三视图']]],
    ['表情系统','建立有辨识度的日常语言',[[67,'表情设计 01'],[68,'表情设计 02'],[69,'表情设计 03']]],
    ['文创与产品','从贴纸走向实物和品牌画面',[[70,'文创贴纸'],[73,'新年主题'],[74,'材质与配色'],[75,'实物产品'],[78,'品牌主视觉']]]
  ]
];
const namedStickers=(prefix,names)=>({prefix,moods:names.map((name,i)=>[name,String(i+1).padStart(2,'0')])});
export const ipStickerSets=[
  {prefix:'ringer',moods:ringerMoods},
  namedStickers('sp',['爱心','拜拜啦','抱抱','悲伤','比心','磁悬浮充电','飞翔','鼓掌','开心','撒花','修理','眨眼']),
  null,
  namedStickers('xg',['搬砖中','抱抱','比心','点赞','加载中','连接 WiFi','拍照','开心','难过','生气了','求关注','我很好']),
  namedStickers('bl',['你好','惊讶','裂开了','灵感闪现','工作进行中','时间有点紧','好困','加油','合作愉快','晚安','谢谢','OK'])
];
const stickerImage=(set,index,reducedMotion)=>`assets/ip-stage/${set.prefix}-${set.moods[index][1]}.${reducedMotion?'png':'gif'}`;
export const ipDetailContent=(index,reducedMotion)=>{
  const series=ipSeries[index],stickers=ipStickerSets[index];
  const story=ipStories[index].map(([title,description,pages],chapter)=>`<section class="ip-story-chapter" aria-label="${title}">
    <header class="ip-story-head"><span>0${chapter+1} / 03</span><h3>${title}</h3><p>${description}</p></header>
    <div class="ip-story-grid">${pages.map(([page,caption],i)=>`<figure><button type="button" class="ip-story-zoom" aria-label="放大查看${series.name}：${caption}" aria-haspopup="dialog"><img src="${pageImage(page)}" alt="${series.name}：${caption}" loading="${chapter||i?'lazy':'eager'}"></button><figcaption><span>${String(i+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}</span>${caption}</figcaption></figure>`).join('')}</div>
  </section>`).join('');
  if(!stickers)return story;
  return `${story}<section class="ip-ringer-theatre" aria-label="${series.name}动态表情体验" style="--ip-sticker-color:${series.color}">
    <div class="ip-ringer-title"><span>FINAL / EXPRESSIONS</span><h3>让角色，真的动起来。</h3><p>${stickers.moods.length} 种表情，构成它自己的日常语言。</p></div>
    <div class="ip-ringer-live" data-name="${series.name}"><span class="ip-ringer-live-index">${series.name} / STICKERS</span><img src="${stickerImage(stickers,0,reducedMotion)}" alt="${series.name}表情：${stickers.moods[0][0]}" width="240" height="240" loading="lazy"><span class="ip-ringer-live-caption">${stickers.moods[0][2]||stickers.moods[0][0]}</span></div>
    <div class="ip-ringer-moods" data-count="${stickers.moods.length}" aria-label="选择${series.name}的表情">${stickers.moods.map(([name],i)=>`<button type="button" data-ip-mood="${i}" aria-pressed="${i===0}"><span>${String(i+1).padStart(2,'0')}</span>${name}</button>`).join('')}</div>
  </section>`;
};

export function ipPage(){
  const first=ipSeries[0];
  return `<article class="ip-page">
    <div class="ip-topline"><a class="back-link" href="#/projects">项目目录</a><span>SIDE 02 / CHARACTER WORLDS</span></div>
    <header class="ip-heading"><span>IP / 角色与世界</span><h1>让角色，自己登场。</h1><p>五组角色。看一眼还不够，就走近一点。</p></header>
    <section class="ip-exhibit" aria-label="IP 系列展台">
      <div class="ip-stage" style="--ip-color:${first.color};--ip-ink:${first.ink};--ip-focus:${first.focus}">
        <span class="ip-stage-index" aria-hidden="true">01 / 05</span>
        <button class="ip-art" type="button" aria-label="打开 RINGER 作品详情"><img src="${pageImage(first.pages[0][0])}" alt="RINGER 角色主视觉"><span class="ip-art-open">展开作品 ↗</span></button>
        <div class="ip-navigation"><button type="button" class="ip-prev" aria-label="上一个角色系列" title="上一个角色系列">←</button><button type="button" class="ip-next" aria-label="下一个角色系列" title="下一个角色系列">→</button></div>
        <span class="ip-stage-side" aria-hidden="true">DANNY / SELECTED IP WORKS</span>
      </div>
      <div class="ip-console"><div class="ip-series-meta"><span class="ip-fraction">01 <i></i> 05</span><div><h2 class="ip-series-name">${first.name}</h2><p class="ip-series-type">${first.type}</p></div></div><span class="ip-console-note">DRAG / SWIPE TO EXPLORE</span></div>
      <nav class="ip-lineup" aria-label="选择角色系列">${ipSeries.map((series,index)=>`<button type="button" data-ip-series="${index}" aria-current="${index===0?'true':'false'}"><span>0${index+1}</span>${series.name}</button>`).join('')}</nav>
    </section>
    <section class="ip-detail ip-detail-story" hidden aria-label="角色系列详情"><div class="ip-detail-bar"><button type="button" class="ip-detail-back">← 返回角色展台</button><span class="ip-detail-count"></span></div><div class="ip-detail-head"><span>IP / SELECTED WORK</span><h2></h2><p></p></div><div class="ip-detail-pages"></div><div class="ip-detail-end"><button type="button" class="ip-detail-back">← 返回角色展台</button><span>END OF SERIES</span></div><dialog class="ip-image-dialog" aria-label="作品大图"><div class="ip-image-tools"><button class="ip-image-zoom-toggle" type="button" aria-pressed="false">放大</button><button class="ip-image-close" type="button">关闭</button></div><img alt=""><p></p></dialog></section>
  </article>`;
}

export function initIpPage({signal,reducedMotion=false}={}){
  const root=document.querySelector('.ip-page');
  if(!root)return;
  const exhibit=root.querySelector('.ip-exhibit'),detail=root.querySelector('.ip-detail'),stage=root.querySelector('.ip-stage'),art=root.querySelector('.ip-art'),image=art.querySelector('img'),lineup=[...root.querySelectorAll('[data-ip-series]')];
  let current=0,dragStart=null,returnY=0;
  const show=index=>{
    current=(index+ipSeries.length)%ipSeries.length;
    const series=ipSeries[current];
    stage.style.setProperty('--ip-color',series.color);stage.style.setProperty('--ip-ink',series.ink);stage.style.setProperty('--ip-focus',series.focus);
    stage.querySelector('.ip-stage-index').textContent=`0${current+1} / 0${ipSeries.length}`;
    image.src=pageImage(series.pages[0][0]);image.alt=`${series.name} 作品主视觉`;
    art.setAttribute('aria-label',`打开 ${series.name} 作品详情`);
    root.querySelector('.ip-fraction').innerHTML=`0${current+1} <i></i> 0${ipSeries.length}`;
    root.querySelector('.ip-series-name').textContent=series.name;root.querySelector('.ip-series-type').textContent=series.type;
    lineup.forEach((button,i)=>button.setAttribute('aria-current',String(i===current)));
    root.querySelector('.ip-lineup').scrollTo({left:lineup[current].offsetLeft-lineup[0].offsetLeft,behavior:reducedMotion?'instant':'smooth'});
    if(!reducedMotion){art.classList.remove('ip-arriving');void art.offsetWidth;art.classList.add('ip-arriving');}
  };
  root.querySelector('.ip-prev').addEventListener('click',()=>show(current-1),{signal});
  root.querySelector('.ip-next').addEventListener('click',()=>show(current+1),{signal});
  lineup.forEach((button,index)=>button.addEventListener('click',()=>show(index),{signal}));
  stage.addEventListener('pointerdown',event=>{dragStart=event.clientX;},{signal});
  stage.addEventListener('pointerup',event=>{if(dragStart===null)return;const distance=event.clientX-dragStart;dragStart=null;if(Math.abs(distance)>55){event.preventDefault();show(current+(distance<0?1:-1));stage.dataset.dragged='true';setTimeout(()=>delete stage.dataset.dragged,0);}},{signal});
  stage.addEventListener('pointercancel',()=>{dragStart=null;},{signal});
  art.addEventListener('click',()=>{
    if(stage.dataset.dragged)return;
    const series=ipSeries[current];returnY=window.scrollY;
    detail.querySelector('.ip-detail-count').textContent=`0${current+1} / 0${ipSeries.length}`;
    detail.querySelector('h2').textContent=series.name;detail.querySelector('.ip-detail-head p').textContent=series.type;
    detail.querySelector('.ip-detail-pages').innerHTML=ipDetailContent(current,reducedMotion);
    exhibit.hidden=true;root.querySelector('.ip-heading').hidden=true;detail.hidden=false;window.scrollTo(0,0);detail.querySelector('.ip-detail-back').focus({preventScroll:true});
  },{signal});
  detail.addEventListener('click',event=>{
    if(event.target.matches('.ip-image-dialog')){event.target.close();return;}
    if(event.target.closest('.ip-image-close')){detail.querySelector('.ip-image-dialog').close();return;}
    if(event.target.closest('.ip-image-zoom-toggle')){const dialog=detail.querySelector('.ip-image-dialog'),button=dialog.querySelector('.ip-image-zoom-toggle'),zoomed=dialog.classList.toggle('is-zoomed');button.textContent=zoomed?'适应屏幕':'放大';button.setAttribute('aria-pressed',String(zoomed));return;}
    const zoom=event.target.closest('.ip-story-zoom');
    if(zoom){const dialog=detail.querySelector('.ip-image-dialog'),image=zoom.querySelector('img');dialog.classList.remove('is-zoomed');dialog.querySelector('.ip-image-zoom-toggle').textContent='放大';dialog.querySelector('.ip-image-zoom-toggle').setAttribute('aria-pressed','false');dialog.querySelector('img').src=image.src;dialog.querySelector('img').alt=image.alt;dialog.querySelector('p').textContent=image.alt;dialog.showModal();return;}
    const mood=event.target.closest('[data-ip-mood]');
    if(mood){
      const set=ipStickerSets[current],index=Number(mood.dataset.ipMood),[name,,caption]=set.moods[index];
      const live=detail.querySelector('.ip-ringer-live'),sticker=live.querySelector('img');
      sticker.src=stickerImage(set,index,reducedMotion);sticker.alt=`${ipSeries[current].name}表情：${name}`;
      live.querySelector('.ip-ringer-live-caption').textContent=caption||name;
      detail.querySelectorAll('[data-ip-mood]').forEach(button=>button.setAttribute('aria-pressed',String(button===mood)));
      if(!reducedMotion){live.classList.remove('ip-ringer-pop');void live.offsetWidth;live.classList.add('ip-ringer-pop');}
    }
  },{signal});
  root.querySelectorAll('.ip-detail-back').forEach(button=>button.addEventListener('click',()=>{detail.hidden=true;exhibit.hidden=false;root.querySelector('.ip-heading').hidden=false;detail.querySelector('.ip-detail-pages').replaceChildren();window.scrollTo(0,returnY);art.focus({preventScroll:true});},{signal}));
  root.addEventListener('keydown',event=>{
    if(!detail.hidden){if(event.key==='Escape')detail.querySelector('.ip-detail-back').click();return;}
    if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}
    if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}
  },{signal});
}
