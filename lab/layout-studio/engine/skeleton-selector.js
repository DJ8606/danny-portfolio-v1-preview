(function(root) {
  'use strict';

  const Roles = root.AestheticRoles || (typeof require === 'function'
    ? require('./aesthetic-roles.js')
    : null);
  const Signature = root.VisualSignature || (typeof require === 'function'
    ? require('./visual-signature.js')
    : null);

  function normalized(value) {
    return String(value || '').toLowerCase().replace(/[_-]+/g, ' ');
  }

  function containsAny(text, terms) {
    const haystack = normalized(text);
    return terms.some(term => haystack.includes(normalized(term)));
  }

  function add(points, reason, value, label) {
    if (!value) return points;
    reason.push(label);
    return points + value;
  }

  function scoreSkeleton(skeleton, evidence) {
    const visual = evidence.visual || {};
    const copy = evidence.copy || {};
    const goal = normalized(evidence.goal);
    const bestFor = (skeleton.bestFor || []).join(' ');
    const needs = [].concat(skeleton.backgroundNeeds || [], skeleton.fontNeeds || []).join(' ');
    const family = skeleton.family || '';
    const reason = [];
    let score = 0;

    const shortTitle = Number(copy.titleLength || 0) <= 14;
    const mediumTitle = Number(copy.titleLength || 0) <= 24;
    const lowDensity = copy.density === 'low';
    const mediumDensity = copy.density === 'medium';
    const cleanImage = Number(visual.complexity || 0.5) < 0.42;
    const denseImage = Number(visual.complexity || 0.5) > 0.58;
    const brightImage = Number(visual.brightness || 0.5) > 0.62;
    const portrait = containsAny(visual.subjectType, ['portrait', 'person']) || containsAny(visual.framing, ['half']);
    const product = containsAny(visual.subjectType, ['product']);
    const texture = containsAny(visual.subjectType, ['texture', 'landscape', 'abstract']);
    const referenceFamily = containsAny(family, ['reference']);

    if (referenceFamily) {
      score = add(score, reason, 9, '参考骨架种子，优先验证新版式方向');
    }

    if (shortTitle && containsAny(bestFor + ' ' + needs, ['短标题', '短词', 'short'])) {
      score = add(score, reason, 18, '标题短，适合强标题骨架');
    }
    if (mediumTitle && containsAny(bestFor, ['中短标题', 'medium'])) {
      score = add(score, reason, 8, '标题长度适中');
    }
    if (lowDensity && containsAny(bestFor, ['少量文案', '低密度', 'low'])) {
      score = add(score, reason, 12, '信息密度低，可用留白或巨字');
    }
    if (mediumDensity && containsAny(bestFor, ['说明', '多信息', 'medium', '参数'])) {
      score = add(score, reason, 10, '信息密度适合网格组织');
    }
    if (copy.hasLatin && containsAny(needs, ['condensed', 'wide', 'display', 'mono'])) {
      score = add(score, reason, 7, '英文标题适合展示型字体');
    }
    if (copy.hasCJK && containsAny(needs, ['songti', 'calligraphy', '中文'])) {
      score = add(score, reason, 11, '中文文案适合宋体/书写气质');
    }
    if (portrait && containsAny(bestFor + ' ' + needs, ['人物', 'portrait', 'half body', 'half_body'])) {
      score = add(score, reason, 14, '人物素材匹配');
    }
    if (product && containsAny(bestFor + ' ' + needs, ['产品', 'product', 'single product', 'single_product'])) {
      score = add(score, reason, 18, '产品主体匹配');
    }
    if (product && containsAny(skeleton.id + ' ' + skeleton.name + ' ' + bestFor, ['product stage', '器物台座', '单产品'])) {
      score = add(score, reason, 16, '单产品需要台座式主视觉');
    }
    if (texture && containsAny(bestFor + ' ' + needs, ['风景', '纹理', 'texture', 'landscape', 'abstract'])) {
      score = add(score, reason, 10, '底图气质匹配');
    }
    if (cleanImage && containsAny(bestFor + ' ' + needs, ['干净', 'clean', '留白', 'low detail', 'low_detail'])) {
      score = add(score, reason, 10, '画面干净，可承受精致排版');
    }
    if (denseImage && family === 'swiss_grid') {
      score = add(score, reason, 6, '复杂底图用网格建立秩序');
    }
    if (brightImage && family === 'eastern_whitespace') {
      score = add(score, reason, 4, '偏亮画面适合留白气质');
    }
    if (containsAny(copy.tone, ['eastern', '国风', '东方']) && family === 'eastern_whitespace') {
      score = add(score, reason, 28, '文案气质偏东方');
    }
    if (containsAny(copy.tone, ['technical', '科技', '参数']) && family === 'swiss_grid') {
      score = add(score, reason, 24, '技术/参数内容适合瑞士网格');
    }
    if (containsAny(copy.tone, ['editorial', '编辑']) && containsAny(family, ['monumental', 'interpenetration', 'swiss', 'reference'])) {
      score = add(score, reason, 12, '编辑感内容需要结构张力');
    }
    if (containsAny(goal, ['premium', '高级']) && containsAny(family, ['eastern', 'frame'])) {
      score = add(score, reason, 8, '高级目标需要克制留白');
    }
    if (containsAny(goal, ['expressive', '冲击', '表达']) && containsAny(family, ['monumental', 'interpenetration'])) {
      score = add(score, reason, 10, '表达目标需要更强图文关系');
    }

    if (reason.length === 0) {
      reason.push('作为探索骨架保留');
      score += 1;
    }

    return { skeleton, score, reason };
  }

  function selectSkeletons(evidence, skeletons, options) {
    const count = Math.max(1, (options && options.count) || 3);
    const ranked = (skeletons || [])
      .map(item => scoreSkeleton(item, evidence || {}))
      .sort((a, b) => b.score - a.score || a.skeleton.id.localeCompare(b.skeleton.id));

    const selected = [];
    const usedFamilies = new Set();
    const usedSignatures = new Set();
    const familyBest = [];

    for (const item of ranked) {
      if (!usedFamilies.has(item.skeleton.family)) {
        familyBest.push(item);
        usedFamilies.add(item.skeleton.family);
      }
    }

    usedFamilies.clear();
    for (const item of familyBest) {
      if (selected.length >= count) break;
      const signature = Signature.visualSignature(item.skeleton);
      if (usedSignatures.has(signature)) continue;
      selected.push(item);
      usedFamilies.add(item.skeleton.family);
      usedSignatures.add(signature);
    }

    for (const item of ranked) {
      if (selected.length >= count) break;
      const signature = Signature.visualSignature(item.skeleton);
      if (!selected.includes(item) && !usedSignatures.has(signature)) {
        selected.push(item);
        usedSignatures.add(signature);
      }
    }

    for (const item of ranked) {
      if (selected.length >= count) break;
      if (!selected.includes(item)) selected.push(item);
    }

    if (count >= 6) {
      const desiredRoles = ['safe', 'expressive', 'structured', 'quiet', 'commercial', 'exploratory'];
      for (const desired of desiredRoles) {
        const selectedRoles = selected.map(item => Roles.roleFor(item, evidence || {}).id);
        if (selectedRoles.includes(desired)) continue;

        const currentSignatures = new Set(selected.map(item => Signature.visualSignature(item.skeleton)));
        const candidate = ranked.find(item => {
          return !selected.includes(item) &&
            Roles.roleFor(item, evidence || {}).id === desired &&
            !currentSignatures.has(Signature.visualSignature(item.skeleton));
        }) || ranked.find(item => !selected.includes(item) && Roles.roleFor(item, evidence || {}).id === desired);
        if (!candidate) continue;

        const roleCounts = selectedRoles.reduce((memo, id) => {
          memo[id] = (memo[id] || 0) + 1;
          return memo;
        }, {});
        let replaceIndex = -1;
        for (let i = selected.length - 1; i >= 0; i--) {
          const roleId = selectedRoles[i];
          if (roleCounts[roleId] > 1) {
            replaceIndex = i;
            break;
          }
        }
        if (replaceIndex !== -1) selected[replaceIndex] = candidate;
      }
    }

    enforceSignatureDiversity(selected, ranked);

    return Roles.withRoles(selected, evidence || {});
  }

  function enforceSignatureDiversity(selected, ranked) {
    const seen = new Set();
    for (let i = 0; i < selected.length; i++) {
      const signature = Signature.visualSignature(selected[i].skeleton);
      if (!seen.has(signature)) {
        seen.add(signature);
        continue;
      }

      const replacement = ranked.find(item => {
        const nextSignature = Signature.visualSignature(item.skeleton);
        return !selected.includes(item) && !seen.has(nextSignature);
      });

      if (replacement) {
        selected[i] = replacement;
        seen.add(Signature.visualSignature(replacement.skeleton));
      }
    }
  }

  const api = { selectSkeletons, scoreSkeleton };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SkeletonSelector = api;
})(typeof window !== 'undefined' ? window : globalThis);
