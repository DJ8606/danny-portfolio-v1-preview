const escapeText=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const groupNames=['月夜与数字','原作与场景','立体与城市','节日与动势','文字与角色','太空与肖像','组合与设定'];
const showcaseOrder=['月夜山鹿','彩兔','梦 · 新信仰','烈焰虎','长城之龙','梦幻旅程','立体龙','蓝色鱼群','古城街景','节日之城','彩羽凤凰','龙虎对峙','兔年字画 I','宇航员','兔年字画 II','太空兔 I','太空兔 II','霓虹肖像','角色组合 II','机甲草图','角色组合 I'];

const orderedItems=items=>{
  const byTitle=new Map(items.map(item=>[item.title,item]));
  const picked=showcaseOrder.map(title=>byTitle.get(title)).filter(Boolean);
  return picked.concat(items.filter(item=>!picked.includes(item)));
};

export function journeyMarkup(items){
  const displayItems=orderedItems(items),total=String(displayItems.length).padStart(2,'0');
  const pieces=displayItems.map((item,index)=>{
    const number=String(index+1).padStart(2,'0'),title=escapeText(item.title);
    return `<button type="button" class="journey-piece journey-work" data-space-piece="${index}" data-source-index="${items.indexOf(item)}" data-work-index="${index}" data-kind="${escapeText(item.kind||'插画原作')}" aria-label="查看作品 ${title}"><span class="journey-work-frame"><img src="${item.src}" alt="${escapeText(item.alt||item.title)}" loading="${index<3?'eager':'lazy'}" decoding="async"></span><span class="journey-piece-index" aria-hidden="true">${number}</span><span class="journey-piece-name">${title}</span></button>`;
  }).join('');
  const indexItems=displayItems.map((item,index)=>`<button type="button" data-journey-target="${index}" aria-label="查看 ${escapeText(item.title)}">${String(index+1).padStart(2,'0')} <span>${escapeText(item.title)}</span></button>`).join('');
  return `<section class="illustration-journey" aria-labelledby="journey-title"><header class="journey-head"><span class="eyebrow">ILLUSTRATION / A MOVING SPACE</span><h2 id="journey-title">让作品自己<br>带你走。</h2><p>滚动或拖动，画面才会移动。每张作品在靠近你时展开，停下就停下。</p></header><div class="journey-space" data-space-state="ready" data-space-interaction="scroll" aria-live="polite"><div class="journey-rail" tabindex="0" aria-label="可横向滚动的插画作品轨道">${pieces}</div><div class="journey-space-caption"><span data-space-status>01 / ${total} · ${total} 幅作品</span><strong data-space-title>月夜山鹿</strong><small data-space-kind>滚动或拖动，查看下一幅</small></div></div><div class="journey-space-controls"><button type="button" class="journey-index-toggle" aria-expanded="false" aria-controls="journey-index">浏览全部 ${total} 幅</button></div><div class="journey-detail" hidden role="dialog" aria-modal="true" aria-labelledby="journey-detail-title"><button type="button" class="journey-detail-close" aria-label="关闭作品大图">×</button><div class="journey-detail-frame"><div class="journey-detail-media"><img data-detail-image src="" alt=""></div><div class="journey-detail-copy"><span data-detail-meta>ILLUSTRATION / 01</span><h3 id="journey-detail-title" data-detail-title></h3><p data-detail-kind></p><small>按 Esc 或点击右上角返回作品空间。</small></div></div></div><div class="journey-end"><span class="eyebrow">THE LINE CONTINUES</span><p>看完作品，再沿着“一笔一笔”的入口进入长卷。</p><a class="text-link" href="#/voyage">进入线刻长卷 →</a></div><nav class="journey-index" id="journey-index" hidden aria-label="插画作品索引">${indexItems}</nav></section>`;
}
