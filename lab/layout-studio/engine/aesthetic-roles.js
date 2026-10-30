(function(root) {
  'use strict';

  const ROLE_DEFS = {
    safe: {
      id: 'safe',
      name: '稳妥',
      intent: '优先清晰、可读、商业可用'
    },
    expressive: {
      id: 'expressive',
      name: '表达',
      intent: '加强标题和主体的视觉张力'
    },
    structured: {
      id: 'structured',
      name: '秩序',
      intent: '用网格和信息层级建立秩序'
    },
    quiet: {
      id: 'quiet',
      name: '留白',
      intent: '用克制、呼吸感和主体空间建立高级感'
    },
    commercial: {
      id: 'commercial',
      name: '商业',
      intent: '保持识别度和转化信息，适合产品/活动'
    },
    exploratory: {
      id: 'exploratory',
      name: '探索',
      intent: '提供更实验的结构可能'
    }
  };

  const FAMILY_ROLE = {
    monumental_type: 'expressive',
    interpenetration: 'exploratory',
    swiss_grid: 'structured',
    frame_whitespace: 'quiet',
    image_type_split: 'commercial',
    eastern_whitespace: 'safe',
    reference_black_type: 'expressive',
    reference_grid_system: 'structured',
    reference_wireframe: 'structured',
    reference_japanese_type: 'quiet',
    reference_editorial: 'exploratory',
    reference_card_system: 'commercial'
  };

  function roleFor(item, evidence) {
    const skeleton = item.skeleton || item;
    const family = skeleton.family;
    const copy = (evidence && evidence.copy) || {};
    const visual = (evidence && evidence.visual) || {};
    const goal = String((evidence && evidence.goal) || '');

    let id = FAMILY_ROLE[family] || 'exploratory';

    if (family === 'eastern_whitespace' && (copy.tone === 'eastern' || visual.subjectType === 'product')) id = 'quiet';
    if (family === 'image_type_split' && goal === 'clear') id = 'safe';
    if (family === 'monumental_type' && goal === 'expressive') id = 'expressive';
    if (family === 'swiss_grid' && copy.density === 'medium') id = 'structured';

    return ROLE_DEFS[id] || ROLE_DEFS.exploratory;
  }

  function withRoles(items, evidence) {
    return (items || []).map(item => Object.assign({}, item, { role: roleFor(item, evidence) }));
  }

  const api = { ROLE_DEFS, roleFor, withRoles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AestheticRoles = api;
})(typeof window !== 'undefined' ? window : globalThis);
