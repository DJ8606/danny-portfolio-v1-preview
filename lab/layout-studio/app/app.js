(function() {
  'use strict';

  const state = {
    pack: null,
    image: null,
    imageAnalysis: null,
    selections: [],
    selectedIndex: 0
  };

  const $ = id => document.getElementById(id);
  const els = {
    imageInput: $('imageInput'),
    title: $('titleInput'),
    subtitle: $('subtitleInput'),
    subject: $('subjectSelect'),
    tone: $('toneSelect'),
    goal: $('goalSelect'),
    count: $('countSelect'),
    generate: $('generateBtn'),
    facts: $('factsList'),
    mainCanvas: $('mainCanvas'),
    cards: $('cards'),
    selectedFamily: $('selectedFamily'),
    selectedName: $('selectedName'),
    selectedReason: $('selectedReason')
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  function analyzeImage(img) {
    if (!img) {
      return { brightness: 0.62, complexity: 0.24, warmth: 0.02, subjectZone: 'center', quietZones: ['left', 'right'] };
    }

    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 128;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let lum = 0, sat = 0, warmth = 0, edge = 0;
    const thirds = [0, 0, 0];
    const thirdCounts = [0, 0, 0];

    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        const i = (y * canvas.width + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        lum += l;
        sat += (max - min) / 255;
        warmth += (r - b) / 255;
        const t = Math.min(2, Math.floor((x / canvas.width) * 3));
        thirds[t] += sat + Math.abs(l - 0.55);
        thirdCounts[t]++;
        if (x > 1 && y > 1) {
          const j = ((y - 2) * canvas.width + (x - 2)) * 4;
          edge += (Math.abs(r - data[j]) + Math.abs(g - data[j + 1]) + Math.abs(b - data[j + 2])) / 765;
        }
      }
    }

    const samples = (canvas.width / 2) * (canvas.height / 2);
    const weights = thirds.map((v, i) => v / Math.max(1, thirdCounts[i]));
    const zone = ['left', 'center', 'right'][weights.indexOf(Math.max(...weights))];
    const quiet = ['left', 'center', 'right']
      .map((name, i) => ({ name, value: weights[i] }))
      .sort((a, b) => a.value - b.value)
      .map(item => item.name);

    return {
      brightness: clamp(lum / samples, 0, 1),
      complexity: clamp((edge / samples) * 5 + (sat / samples) * 0.6, 0, 1),
      warmth: clamp(warmth / samples, -1, 1),
      subjectZone: zone,
      quietZones: quiet.slice(0, 2)
    };
  }

  function analyzeCopy() {
    const title = els.title.value.trim();
    const subtitle = els.subtitle.value.trim();
    const chars = (title + subtitle).replace(/\s/g, '').length;
    return {
      title,
      subtitle,
      titleLength: title.replace(/\s/g, '').length,
      density: chars < 38 ? 'low' : chars < 90 ? 'medium' : 'high',
      hasLatin: /[A-Za-z]/.test(title + subtitle),
      hasCJK: /[\u3400-\u9fff]/.test(title + subtitle),
      tone: els.tone.value
    };
  }

  function buildEvidence() {
    const image = state.imageAnalysis || analyzeImage(null);
    const selectedSubject = els.subject.value;
    return {
      visual: {
        subjectType: selectedSubject === 'auto' ? inferSubject(image) : selectedSubject,
        subjectZone: image.subjectZone,
        framing: selectedSubject === 'portrait' ? 'half_body' : selectedSubject === 'product' ? 'single_product' : 'background',
        brightness: image.brightness,
        complexity: image.complexity,
        quietZones: image.quietZones
      },
      copy: analyzeCopy(),
      goal: els.goal.value
    };
  }

  function inferSubject(image) {
    if (image.complexity > 0.58) return 'texture';
    if (image.brightness > 0.66 && image.complexity < 0.35) return 'product';
    return 'portrait';
  }

  function fitText(ctx, text, maxWidth, startSize, minSize) {
    let size = startSize;
    while (size > minSize) {
      ctx.font = `900 ${size}px Arial, sans-serif`;
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 3;
    }
    return minSize;
  }

  function coverImage(ctx, img, x, y, w, h) {
    if (!img) {
      drawFallbackImage(ctx, x, y, w, h);
      return;
    }
    const scale = Math.max(w / img.width, h / img.height);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawFallbackImage(ctx, x, y, w, h) {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#24312f');
    grad.addColorStop(0.48, '#8c907f');
    grad.addColorStop(1, '#d8c589');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#f4f0df';
    ctx.lineWidth = Math.max(1, w * 0.01);
    for (let i = -2; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w * (i / 7), y + h);
      ctx.bezierCurveTo(x + w * (i / 7 + 0.28), y + h * 0.72, x + w * (i / 7 - 0.18), y + h * 0.3, x + w * (i / 7 + 0.18), y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#10120f';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.58, y + h * 0.46, w * 0.28, h * 0.18, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function wrapLines(ctx, text, maxWidth, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const lines = [];
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !line) {
        line = next;
      } else {
        lines.push(line);
        line = word;
      }
      if (lines.length === maxLines - 1) break;
    }
    if (line && lines.length < maxLines) lines.push(line);
    return lines;
  }

  function drawVerticalText(ctx, text, x, y, size, gap) {
    ctx.font = `700 ${size}px "Noto Serif SC", "Times New Roman", serif`;
    Array.from(String(text || '')).forEach((char, index) => {
      ctx.fillText(char, x, y + index * (size + gap));
    });
  }

  function drawReferencePoster(ctx, template, img, title, subtitle, W, H) {
    const t = title || 'TYPE STUDY';
    const s = subtitle || 'Reference driven layout skeleton';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = 1;

    if (template === 'ref-black-mass-title') {
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#efe9dc';
      ctx.font = `900 ${W * 0.18}px Arial Black, Arial, sans-serif`;
      wrapLines(ctx, t.toUpperCase(), W * 0.84, 4).forEach((line, i) => ctx.fillText(line, W * 0.07, H * 0.08 + i * W * 0.15));
      coverImage(ctx, img, W * 0.58, H * 0.52, W * 0.26, H * 0.28);
      ctx.font = `${W * 0.022}px Arial, sans-serif`;
      wrapLines(ctx, s, W * 0.33, 4).forEach((line, i) => ctx.fillText(line, W * 0.08, H * 0.72 + i * W * 0.032));
    } else if (template === 'ref-black-type-cut') {
      ctx.fillStyle = '#f1efe6';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#050505';
      ctx.font = `900 ${W * 0.22}px Arial Black, Arial, sans-serif`;
      wrapLines(ctx, t.toUpperCase(), W * 1.08, 4).forEach((line, i) => ctx.fillText(line, -W * 0.08, H * 0.02 + i * W * 0.18));
      ctx.fillStyle = '#f1efe6';
      ctx.fillRect(W * 0.72, H * 0.08, W * 0.18, H * 0.78);
      ctx.fillStyle = '#050505';
      ctx.font = `${W * 0.02}px Arial, sans-serif`;
      wrapLines(ctx, s, W * 0.15, 6).forEach((line, i) => ctx.fillText(line, W * 0.75, H * 0.16 + i * W * 0.03));
    } else if (template === 'ref-white-huge-type') {
      ctx.fillStyle = '#fbfaf5';
      ctx.fillRect(0, 0, W, H);
      coverImage(ctx, img, W * 0.62, H * 0.18, W * 0.22, H * 0.22);
      ctx.fillStyle = '#111111';
      ctx.font = `900 ${W * 0.21}px Arial Black, Arial, sans-serif`;
      wrapLines(ctx, t.toUpperCase(), W * 0.82, 3).forEach((line, i) => ctx.fillText(line, W * 0.08, H * 0.43 + i * W * 0.18));
      ctx.font = `${W * 0.021}px Arial, sans-serif`;
      ctx.fillText(s, W * 0.1, H * 0.12, W * 0.42);
    } else if (template === 'ref-vertical-type-axis') {
      ctx.fillStyle = '#f4f0e6';
      ctx.fillRect(0, 0, W, H);
      coverImage(ctx, img, W * 0.16, H * 0.18, W * 0.36, H * 0.36);
      ctx.strokeStyle = '#1d1d1b';
      ctx.strokeRect(W * 0.13, H * 0.15, W * 0.42, H * 0.42);
      ctx.fillStyle = '#1d1d1b';
      drawVerticalText(ctx, t, W * 0.72, H * 0.12, W * 0.058, W * 0.011);
      ctx.font = `${W * 0.022}px Arial, sans-serif`;
      wrapLines(ctx, s, W * 0.36, 5).forEach((line, i) => ctx.fillText(line, W * 0.16, H * 0.68 + i * W * 0.032));
    } else if (template === 'ref-multi-column-grid') {
      ctx.fillStyle = '#f7f6f1';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 1;
      for (let x = 0.08; x <= 0.92; x += 0.14) {
        ctx.beginPath();
        ctx.moveTo(W * x, H * 0.08);
        ctx.lineTo(W * x, H * 0.9);
        ctx.stroke();
      }
      ctx.fillStyle = '#111111';
      ctx.font = `900 ${W * 0.08}px Arial, sans-serif`;
      wrapLines(ctx, t, W * 0.34, 4).forEach((line, i) => ctx.fillText(line, W * 0.09, H * 0.1 + i * W * 0.085));
      ctx.font = `${W * 0.018}px Arial, sans-serif`;
      for (let col = 0; col < 4; col++) {
        wrapLines(ctx, s, W * 0.13, 5).forEach((line, i) => ctx.fillText(line, W * (0.38 + col * 0.13), H * 0.18 + i * W * 0.027));
      }
      coverImage(ctx, img, W * 0.38, H * 0.58, W * 0.46, H * 0.18);
    } else if (template === 'ref-nine-block-wall') {
      ctx.fillStyle = '#eeeeea';
      ctx.fillRect(0, 0, W, H);
      const gap = W * 0.018;
      const cellW = (W * 0.78 - gap * 2) / 3;
      const cellH = (H * 0.72 - gap * 2) / 3;
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2;
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const xx = W * 0.11 + x * (cellW + gap);
          const yy = H * 0.12 + y * (cellH + gap);
          ctx.strokeRect(xx, yy, cellW, cellH);
          if ((x + y) % 3 === 0) coverImage(ctx, img, xx + 4, yy + 4, cellW - 8, cellH - 8);
          ctx.fillStyle = '#111111';
          ctx.font = `900 ${W * 0.035}px Arial, sans-serif`;
          ctx.fillText(String(y * 3 + x + 1).padStart(2, '0'), xx + W * 0.012, yy + W * 0.012);
        }
      }
      ctx.font = `900 ${W * 0.045}px Arial, sans-serif`;
      ctx.fillText(t, W * 0.11, H * 0.88, W * 0.72);
    } else if (template === 'ref-split-frame-numbers') {
      ctx.fillStyle = '#f2f0ea';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = W * 0.012;
      ctx.strokeRect(W * 0.08, H * 0.1, W * 0.84, H * 0.78);
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.45);
      ctx.lineTo(W * 0.92, H * 0.45);
      ctx.moveTo(W * 0.52, H * 0.1);
      ctx.lineTo(W * 0.52, H * 0.88);
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.font = `900 ${W * 0.18}px Arial Black, Arial, sans-serif`;
      ctx.fillText('01', W * 0.12, H * 0.16);
      coverImage(ctx, img, W * 0.56, H * 0.16, W * 0.28, H * 0.22);
      ctx.font = `900 ${W * 0.055}px Arial, sans-serif`;
      wrapLines(ctx, t, W * 0.34, 3).forEach((line, i) => ctx.fillText(line, W * 0.12, H * 0.52 + i * W * 0.064));
      ctx.font = `${W * 0.022}px Arial, sans-serif`;
      wrapLines(ctx, s, W * 0.28, 5).forEach((line, i) => ctx.fillText(line, W * 0.58, H * 0.54 + i * W * 0.032));
    } else if (template === 'ref-blueprint-frame') {
      ctx.fillStyle = '#f7f9fb';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#2c7fe5';
      ctx.lineWidth = 2;
      for (let x = W * 0.1; x <= W * 0.9; x += W * 0.1) {
        ctx.beginPath();
        ctx.moveTo(x, H * 0.08);
        ctx.lineTo(x, H * 0.9);
        ctx.stroke();
      }
      for (let y = H * 0.1; y <= H * 0.88; y += H * 0.1) {
        ctx.beginPath();
        ctx.moveTo(W * 0.08, y);
        ctx.lineTo(W * 0.92, y);
        ctx.stroke();
      }
      coverImage(ctx, img, W * 0.14, H * 0.2, W * 0.34, H * 0.32);
      ctx.fillStyle = '#1a1d21';
      ctx.font = `900 ${W * 0.06}px Arial, sans-serif`;
      wrapLines(ctx, t, W * 0.34, 4).forEach((line, i) => ctx.fillText(line, W * 0.54, H * 0.18 + i * W * 0.068));
      ctx.font = `${W * 0.019}px Arial, sans-serif`;
      ctx.fillText(s, W * 0.16, H * 0.68, W * 0.58);
    } else if (template === 'ref-japanese-vertical-collage') {
      ctx.fillStyle = '#f3efe3';
      ctx.fillRect(0, 0, W, H);
      coverImage(ctx, img, W * 0.14, H * 0.14, W * 0.28, H * 0.24);
      coverImage(ctx, img, W * 0.48, H * 0.42, W * 0.28, H * 0.26);
      ctx.fillStyle = '#111111';
      drawVerticalText(ctx, t, W * 0.8, H * 0.12, W * 0.047, W * 0.012);
      ctx.font = `${W * 0.02}px Arial, sans-serif`;
      wrapLines(ctx, s, W * 0.34, 5).forEach((line, i) => ctx.fillText(line, W * 0.16, H * 0.62 + i * W * 0.031));
      ctx.strokeStyle = '#111111';
      ctx.strokeRect(W * 0.1, H * 0.1, W * 0.72, H * 0.68);
    } else if (template === 'ref-japanese-card-set') {
      ctx.fillStyle = '#eee9d9';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1d1d1b';
      drawVerticalText(ctx, t, W * 0.1, H * 0.12, W * 0.04, W * 0.01);
      for (let i = 0; i < 4; i++) {
        const xx = W * (0.28 + (i % 2) * 0.28);
        const yy = H * (0.14 + Math.floor(i / 2) * 0.32);
        ctx.fillStyle = '#f9f7ef';
        ctx.fillRect(xx, yy, W * 0.22, H * 0.24);
        coverImage(ctx, img, xx + W * 0.02, yy + H * 0.02, W * 0.18, H * 0.11);
        ctx.fillStyle = '#111111';
        ctx.font = `${W * 0.017}px Arial, sans-serif`;
        ctx.fillText(s, xx + W * 0.02, yy + H * 0.16, W * 0.16);
      }
    } else if (template === 'ref-editorial-image-columns') {
      ctx.fillStyle = '#f8f6ee';
      ctx.fillRect(0, 0, W, H);
      coverImage(ctx, img, W * 0.1, H * 0.12, W * 0.34, H * 0.44);
      ctx.fillStyle = '#111111';
      ctx.font = `800 ${W * 0.058}px Georgia, serif`;
      wrapLines(ctx, t, W * 0.36, 4).forEach((line, i) => ctx.fillText(line, W * 0.52, H * 0.13 + i * W * 0.067));
      ctx.font = `${W * 0.02}px Arial, sans-serif`;
      for (let col = 0; col < 2; col++) {
        wrapLines(ctx, s, W * 0.16, 7).forEach((line, i) => ctx.fillText(line, W * (0.12 + col * 0.22), H * 0.65 + i * W * 0.029));
      }
    } else if (template === 'ref-commercial-module-board') {
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f4f1e8';
      ctx.font = `900 ${W * 0.06}px Arial, sans-serif`;
      ctx.fillText(t, W * 0.08, H * 0.08, W * 0.68);
      for (let i = 0; i < 6; i++) {
        const xx = W * (0.08 + (i % 2) * 0.43);
        const yy = H * (0.22 + Math.floor(i / 2) * 0.2);
        ctx.fillStyle = '#f4f1e8';
        ctx.fillRect(xx, yy, W * 0.35, H * 0.15);
        ctx.fillStyle = '#111111';
        ctx.font = `900 ${W * 0.026}px Arial, sans-serif`;
        ctx.fillText(String(i + 1).padStart(2, '0'), xx + W * 0.02, yy + W * 0.018);
        ctx.font = `${W * 0.018}px Arial, sans-serif`;
        ctx.fillText(s, xx + W * 0.09, yy + W * 0.02, W * 0.2);
      }
    } else if (template === 'ref-soft-color-grid') {
      ctx.fillStyle = '#f6f0e6';
      ctx.fillRect(0, 0, W, H);
      const colors = ['#e9c7c9', '#b8d7d2', '#eadca8', '#c8cde8', '#d9c4a9', '#c9d8b8'];
      for (let i = 0; i < 9; i++) {
        const xx = W * (0.09 + (i % 3) * 0.28);
        const yy = H * (0.12 + Math.floor(i / 3) * 0.24);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(xx, yy, W * 0.22, H * 0.17);
        ctx.fillStyle = '#333333';
        ctx.font = `900 ${W * 0.024}px Arial, sans-serif`;
        ctx.fillText(i === 0 ? t : String(i + 1).padStart(2, '0'), xx + W * 0.018, yy + W * 0.018, W * 0.17);
      }
      ctx.font = `${W * 0.021}px Arial, sans-serif`;
      ctx.fillText(s, W * 0.1, H * 0.86, W * 0.64);
    } else if (template === 'ref-offset-annotation') {
      ctx.fillStyle = '#f1eee5';
      ctx.fillRect(0, 0, W, H);
      coverImage(ctx, img, W * 0.16, H * 0.22, W * 0.44, H * 0.34);
      ctx.fillStyle = 'rgba(17,17,17,.9)';
      ctx.fillRect(W * 0.44, H * 0.12, W * 0.34, H * 0.2);
      ctx.fillStyle = '#f7f1e7';
      ctx.font = `900 ${W * 0.055}px Arial, sans-serif`;
      wrapLines(ctx, t, W * 0.28, 3).forEach((line, i) => ctx.fillText(line, W * 0.47, H * 0.15 + i * W * 0.062));
      ctx.strokeStyle = '#111111';
      ctx.beginPath();
      ctx.moveTo(W * 0.2, H * 0.66);
      ctx.lineTo(W * 0.78, H * 0.58);
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.font = `${W * 0.021}px Arial, sans-serif`;
      ctx.fillText(s, W * 0.2, H * 0.7, W * 0.48);
    } else if (template === 'ref-margin-study') {
      ctx.fillStyle = '#faf9f4';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#d34c69';
      ctx.lineWidth = 1;
      ctx.strokeRect(W * 0.18, H * 0.12, W * 0.64, H * 0.7);
      ctx.strokeRect(W * 0.28, H * 0.22, W * 0.44, H * 0.44);
      coverImage(ctx, img, W * 0.3, H * 0.25, W * 0.4, H * 0.26);
      ctx.fillStyle = '#111111';
      ctx.font = `800 ${W * 0.048}px Georgia, serif`;
      ctx.fillText(t, W * 0.28, H * 0.58, W * 0.44);
      ctx.font = `${W * 0.019}px Arial, sans-serif`;
      ctx.fillText(s, W * 0.28, H * 0.68, W * 0.42);
    }
  }

  function drawPoster(canvas, selection, scale) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const sk = selection.skeleton;
    const role = selection.role || { name: '方向' };
    const title = els.title.value.trim() || sk.name;
    const subtitle = els.subtitle.value.trim();
    const plan = RenderPlan.planForSkeleton(sk);

    ctx.fillStyle = '#ebe4d4';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    if (plan.template.indexOf('ref-') === 0) {
      drawReferencePoster(ctx, plan.template, state.image, title, subtitle, W, H);
    } else if (plan.template === 'monumental-counterweight') {
      coverImage(ctx, state.image, 0, 0, W, H);
      ctx.fillStyle = 'rgba(12, 15, 12, .50)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(116, 224, 111, .82)';
      ctx.fillRect(W * 0.06, H * 0.06, W * 0.08, H * 0.74);
      ctx.fillStyle = '#eef0df';
      const size = fitText(ctx, title.toUpperCase(), W * 0.76, W * 0.16, 42);
      ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
      ctx.textBaseline = 'top';
      wrapLines(ctx, title.toUpperCase(), W * 0.76, 3).forEach((line, i) => ctx.fillText(line, W * 0.19, H * 0.1 + i * size * 0.9));
      ctx.fillStyle = '#11120f';
      ctx.fillRect(W * 0.2, H * 0.64, W * 0.58, H * 0.035);
      ctx.fillStyle = '#eef0df';
      ctx.font = `${W * 0.035}px Arial, sans-serif`;
      wrapLines(ctx, subtitle, W * 0.45, 3).forEach((line, i) => ctx.fillText(line, W * 0.2, H * 0.7 + i * W * 0.05));
    } else if (plan.template === 'background-word') {
      ctx.fillStyle = '#efe8d9';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d2b98a';
      ctx.globalAlpha = 0.34;
      ctx.font = `900 ${W * 0.25}px Arial Black, Arial, sans-serif`;
      ctx.textBaseline = 'top';
      wrapLines(ctx, title.toUpperCase(), W * 1.2, 3).forEach((line, i) => ctx.fillText(line, -W * 0.08, H * (0.02 + i * 0.22)));
      ctx.globalAlpha = 1;
      coverImage(ctx, state.image, W * 0.18, H * 0.28, W * 0.64, H * 0.36);
      ctx.fillStyle = 'rgba(239,232,217,.76)';
      ctx.fillRect(W * 0.12, H * 0.63, W * 0.76, H * 0.18);
      ctx.fillStyle = '#12130f';
      ctx.font = `800 ${W * 0.061}px Georgia, "Noto Serif SC", serif`;
      wrapLines(ctx, title, W * 0.58, 2).forEach((line, i) => ctx.fillText(line, W * 0.16, H * 0.66 + i * W * 0.07));
      ctx.font = `${W * 0.023}px Arial, sans-serif`;
      wrapLines(ctx, subtitle, W * 0.55, 3).forEach((line, i) => ctx.fillText(line, W * 0.16, H * 0.76 + i * W * 0.035));
    } else if (plan.template === 'edge-lock') {
      coverImage(ctx, state.image, 0, 0, W, H);
      ctx.fillStyle = 'rgba(9, 12, 10, .44)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f2efdf';
      ctx.font = `900 ${W * 0.18}px Arial Black, Arial, sans-serif`;
      ctx.textBaseline = 'top';
      wrapLines(ctx, title.toUpperCase(), W * 1.05, 3).forEach((line, i) => ctx.fillText(line, -W * 0.035, H * 0.02 + i * W * 0.155));
      ctx.fillStyle = '#74e06f';
      ctx.fillRect(W * 0.86, 0, W * 0.055, H * 0.78);
      ctx.fillStyle = 'rgba(17,18,15,.82)';
      ctx.fillRect(0, H * 0.76, W * 0.82, H * 0.15);
      ctx.fillStyle = '#f7f0de';
      ctx.font = `${W * 0.026}px Arial, sans-serif`;
      wrapLines(ctx, subtitle, W * 0.58, 3).forEach((line, i) => ctx.fillText(line, W * 0.08, H * 0.8 + i * W * 0.038));
    } else if (plan.template === 'vertical-stack') {
      coverImage(ctx, state.image, W * 0.42, 0, W * 0.58, H);
      ctx.fillStyle = '#11130f';
      ctx.fillRect(0, 0, W * 0.48, H);
      ctx.fillStyle = '#74e06f';
      ctx.fillRect(W * 0.39, H * 0.08, W * 0.018, H * 0.78);
      ctx.fillStyle = '#f3f0e5';
      ctx.textBaseline = 'top';
      const hasCjk = /[\u3400-\u9fff]/.test(title);
      if (hasCjk) {
        drawVerticalText(ctx, title.slice(0, 8), W * 0.16, H * 0.09, W * 0.105, W * 0.012);
        drawVerticalText(ctx, title.slice(8, 16), W * 0.27, H * 0.17, W * 0.078, W * 0.01);
      } else {
        ctx.font = `900 ${W * 0.083}px Arial Black, Arial, sans-serif`;
        title.toUpperCase().split(/\s+/).slice(0, 5).forEach((word, i) => ctx.fillText(word, W * 0.06, H * 0.09 + i * W * 0.092, W * 0.31));
      }
      ctx.font = `${W * 0.023}px Arial, sans-serif`;
      wrapLines(ctx, subtitle, W * 0.28, 5).forEach((line, i) => ctx.fillText(line, W * 0.07, H * 0.68 + i * W * 0.034));
    } else if (plan.template === 'lower-caption-band') {
      coverImage(ctx, state.image, 0, 0, W, H * 0.66);
      ctx.fillStyle = '#10120f';
      ctx.fillRect(0, H * 0.62, W, H * 0.38);
      ctx.fillStyle = '#74e06f';
      ctx.fillRect(W * 0.06, H * 0.62, W * 0.2, H * 0.025);
      ctx.fillStyle = '#f3f0e5';
      ctx.font = `900 ${W * 0.075}px Arial, sans-serif`;
      ctx.textBaseline = 'top';
      wrapLines(ctx, title, W * 0.58, 3).forEach((line, i) => ctx.fillText(line, W * 0.07, H * 0.69 + i * W * 0.083));
      ctx.font = `${W * 0.027}px Arial, sans-serif`;
      wrapLines(ctx, subtitle, W * 0.28, 5).forEach((line, i) => ctx.fillText(line, W * 0.68, H * 0.7 + i * W * 0.04));
    } else if (plan.template === 'half-image-half-type') {
      coverImage(ctx, state.image, 0, 0, W * 0.58, H);
      ctx.fillStyle = '#208f76';
      ctx.fillRect(W * 0.54, 0, W * 0.46, H);
      ctx.fillStyle = '#f3f0e5';
      ctx.font = `800 ${W * 0.072}px Arial, sans-serif`;
      wrapLines(ctx, title, W * 0.32, 4).forEach((line, i) => ctx.fillText(line, W * 0.62, H * 0.12 + i * W * 0.084));
      ctx.font = `${W * 0.026}px Arial, sans-serif`;
      wrapLines(ctx, subtitle, W * 0.3, 5).forEach((line, i) => ctx.fillText(line, W * 0.62, H * 0.48 + i * W * 0.04));
    } else if (plan.template === 'center-float') {
      ctx.fillStyle = '#ece7dd';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#11120f';
      ctx.font = `700 ${W * 0.052}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title, W * 0.5, H * 0.12, W * 0.72);
      ctx.textAlign = 'left';
      coverImage(ctx, state.image, W * 0.23, H * 0.25, W * 0.54, H * 0.34);
      ctx.strokeStyle = '#11120f';
      ctx.lineWidth = 2;
      ctx.strokeRect(W * 0.2, H * 0.22, W * 0.6, H * 0.4);
      ctx.font = `${W * 0.024}px Arial, sans-serif`;
      ctx.fillText(subtitle, W * 0.26, H * 0.72, W * 0.48);
    } else if (plan.template === 'gallery-whitespace') {
      ctx.fillStyle = '#ece7dd';
      ctx.fillRect(0, 0, W, H);
      coverImage(ctx, state.image, W * 0.16, H * 0.16, W * 0.68, H * 0.44);
      ctx.strokeStyle = '#11120f';
      ctx.lineWidth = 2;
      ctx.strokeRect(W * 0.13, H * 0.13, W * 0.74, H * 0.5);
      ctx.fillStyle = '#11120f';
      ctx.font = `700 ${W * 0.052}px Georgia, serif`;
      ctx.fillText(title, W * 0.16, H * 0.72, W * 0.68);
      ctx.font = `${W * 0.025}px Arial, sans-serif`;
      ctx.fillText(subtitle, W * 0.16, H * 0.79, W * 0.56);
    } else if (plan.template === 'contour-follow') {
      coverImage(ctx, state.image, 0, 0, W, H);
      ctx.fillStyle = 'rgba(11, 16, 18, .48)';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(116, 224, 111, .85)';
      ctx.lineWidth = W * 0.012;
      ctx.beginPath();
      ctx.moveTo(W * 0.15, H * 0.16);
      ctx.bezierCurveTo(W * 0.54, H * 0.25, W * 0.34, H * 0.65, W * 0.82, H * 0.76);
      ctx.stroke();
      ctx.fillStyle = '#f7f0de';
      ctx.font = `900 ${W * 0.105}px Arial Black, Arial, sans-serif`;
      wrapLines(ctx, title.toUpperCase(), W * 0.72, 3).forEach((line, i) => ctx.fillText(line, W * 0.1, H * 0.68 + i * W * 0.105));
      ctx.font = `${W * 0.028}px Arial, sans-serif`;
      wrapLines(ctx, subtitle, W * 0.36, 4).forEach((line, i) => ctx.fillText(line, W * 0.14 + i * W * 0.055, H * 0.2 + i * W * 0.07));
    } else if (plan.template === 'behind-subject-caption') {
      coverImage(ctx, state.image, 0, 0, W, H);
      ctx.fillStyle = 'rgba(13, 16, 15, .36)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f4efd9';
      ctx.globalAlpha = 0.82;
      ctx.font = `900 ${W * 0.128}px Arial Black, Arial, sans-serif`;
      ctx.textBaseline = 'middle';
      wrapLines(ctx, title.toUpperCase(), W * 0.9, 2).forEach((line, i) => ctx.fillText(line, W * 0.05, H * 0.38 + i * W * 0.12));
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(15,18,16,.76)';
      ctx.beginPath();
      ctx.ellipse(W * 0.56, H * 0.47, W * 0.23, H * 0.28, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#74e06f';
      ctx.lineWidth = W * 0.012;
      ctx.beginPath();
      ctx.moveTo(W * 0.18, H * 0.72);
      ctx.bezierCurveTo(W * 0.38, H * 0.61, W * 0.59, H * 0.79, W * 0.83, H * 0.66);
      ctx.stroke();
      ctx.fillStyle = '#f7f0de';
      ctx.font = `${W * 0.028}px Arial, sans-serif`;
      ctx.textBaseline = 'top';
      wrapLines(ctx, subtitle, W * 0.42, 4).forEach((line, i) => ctx.fillText(line, W * 0.12, H * 0.77 + i * W * 0.04));
    } else if (plan.template === 'subject-type-stack') {
      coverImage(ctx, state.image, 0, 0, W, H);
      ctx.fillStyle = 'rgba(11, 16, 18, .36)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#edece3';
      ctx.font = `900 ${W * 0.17}px Arial Black, Arial, sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(title.toUpperCase(), -W * 0.02, H * 0.92, W * 1.08);
      ctx.fillStyle = 'rgba(116, 224, 111, .88)';
      ctx.fillRect(W * 0.08, H * 0.1, W * 0.08, H * 0.72);
      ctx.fillStyle = '#f7f0de';
      ctx.font = `${W * 0.03}px Arial, sans-serif`;
      wrapLines(ctx, subtitle, W * 0.38, 4).forEach((line, i) => ctx.fillText(line, W * 0.2, H * 0.12 + i * W * 0.04));
    } else if (plan.template === 'swiss-left-ragged') {
      ctx.fillStyle = '#f1efe7';
      ctx.fillRect(0, 0, W, H);
      coverImage(ctx, state.image, W * 0.08, H * 0.12, W * 0.24, H * 0.62);
      ctx.strokeStyle = 'rgba(17,18,15,.18)';
      for (let x = W * 0.08; x < W * 0.92; x += W * 0.07) {
        ctx.beginPath();
        ctx.moveTo(x, H * 0.08);
        ctx.lineTo(x, H * 0.92);
        ctx.stroke();
      }
      ctx.fillStyle = '#11120f';
      ctx.font = `900 ${W * 0.066}px Arial, sans-serif`;
      wrapLines(ctx, title, W * 0.5, 5).forEach((line, i) => ctx.fillText(line, W * 0.42, H * 0.14 + i * W * 0.074));
      ctx.fillStyle = '#74e06f';
      ctx.fillRect(W * 0.42, H * 0.48, W * 0.32, H * 0.018);
      ctx.fillStyle = '#11120f';
      ctx.font = `${W * 0.022}px Arial, sans-serif`;
      wrapLines(ctx, subtitle, W * 0.35, 5).forEach((line, i) => ctx.fillText(line, W * 0.42, H * 0.56 + i * W * 0.035));
    } else if (plan.template === 'swiss-annotation') {
      ctx.fillStyle = '#f4f2ea';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(17,18,15,.14)';
      ctx.lineWidth = 1;
      for (let x = W * 0.08; x <= W * 0.92; x += W * 0.084) {
        ctx.beginPath();
        ctx.moveTo(x, H * 0.08);
        ctx.lineTo(x, H * 0.9);
        ctx.stroke();
      }
      for (let y = H * 0.1; y <= H * 0.88; y += H * 0.07) {
        ctx.beginPath();
        ctx.moveTo(W * 0.08, y);
        ctx.lineTo(W * 0.92, y);
        ctx.stroke();
      }
      coverImage(ctx, state.image, W * 0.45, H * 0.18, W * 0.38, H * 0.42);
      ctx.strokeStyle = '#11120f';
      ctx.lineWidth = 2;
      ctx.strokeRect(W * 0.45, H * 0.18, W * 0.38, H * 0.42);
      ctx.fillStyle = '#11120f';
      ctx.font = `900 ${W * 0.057}px Arial, sans-serif`;
      ctx.textBaseline = 'top';
      wrapLines(ctx, title, W * 0.32, 5).forEach((line, i) => ctx.fillText(line, W * 0.12, H * 0.16 + i * W * 0.064));
      ctx.font = `${W * 0.019}px Arial, sans-serif`;
      ctx.fillText('01', W * 0.45, H * 0.14);
      ctx.fillText('02', W * 0.78, H * 0.65);
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.14);
      ctx.lineTo(W * 0.56, H * 0.22);
      ctx.moveTo(W * 0.78, H * 0.64);
      ctx.lineTo(W * 0.71, H * 0.56);
      ctx.stroke();
      ctx.fillStyle = '#208f76';
      ctx.fillRect(W * 0.12, H * 0.58, W * 0.24, H * 0.014);
      ctx.fillStyle = '#11120f';
      wrapLines(ctx, subtitle, W * 0.66, 4).forEach((line, i) => ctx.fillText(line, W * 0.12, H * 0.68 + i * W * 0.03));
    } else if (plan.template === 'eastern-vertical-title') {
      ctx.fillStyle = '#f3ead9';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(155, 91, 55, .08)';
      ctx.fillRect(W * 0.08, H * 0.08, W * 0.84, H * 0.84);
      coverImage(ctx, state.image, W * 0.22, H * 0.28, W * 0.46, H * 0.34);
      ctx.fillStyle = '#1a1b17';
      drawVerticalText(ctx, title, W * 0.76, H * 0.16, W * 0.062, W * 0.012);
      ctx.font = `${W * 0.026}px Arial, sans-serif`;
      wrapLines(ctx, subtitle, W * 0.42, 4).forEach((line, i) => ctx.fillText(line, W * 0.16, H * 0.72 + i * W * 0.04));
      ctx.fillStyle = '#b93528';
      ctx.fillRect(W * 0.78, H * 0.08, W * 0.055, W * 0.055);
    } else if (plan.template === 'product-stage') {
      ctx.fillStyle = '#f2e7d2';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(31,35,28,.08)';
      ctx.fillRect(W * 0.1, H * 0.12, W * 0.8, H * 0.72);
      ctx.fillStyle = '#1a1b17';
      drawVerticalText(ctx, title, W * 0.78, H * 0.14, W * 0.055, W * 0.011);
      ctx.fillStyle = 'rgba(180, 45, 32, .9)';
      ctx.fillRect(W * 0.68, H * 0.12, W * 0.055, W * 0.055);
      ctx.fillStyle = 'rgba(26,27,23,.14)';
      ctx.beginPath();
      ctx.ellipse(W * 0.43, H * 0.67, W * 0.26, H * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      coverImage(ctx, state.image, W * 0.22, H * 0.28, W * 0.42, H * 0.32);
      ctx.strokeStyle = 'rgba(26,27,23,.38)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.18, H * 0.68);
      ctx.lineTo(W * 0.68, H * 0.68);
      ctx.stroke();
      ctx.fillStyle = '#1a1b17';
      ctx.font = `${W * 0.024}px Arial, sans-serif`;
      wrapLines(ctx, subtitle, W * 0.38, 4).forEach((line, i) => ctx.fillText(line, W * 0.18, H * 0.75 + i * W * 0.036));
    } else {
      ctx.fillStyle = '#f3ead9';
      ctx.fillRect(0, 0, W, H);
      coverImage(ctx, state.image, W * 0.18, H * 0.18, W * 0.64, H * 0.42);
      ctx.fillStyle = '#1a1b17';
      ctx.font = `800 ${W * 0.06}px Arial, sans-serif`;
      ctx.fillText(title, W * 0.14, H * 0.72, W * 0.72);
      ctx.font = `${W * 0.026}px Arial, sans-serif`;
      ctx.fillText(subtitle, W * 0.14, H * 0.8, W * 0.6);
    }

    ctx.fillStyle = 'rgba(17,18,15,.72)';
    ctx.fillRect(W * 0.045, H * 0.935, W * 0.34, H * 0.03);
    ctx.fillStyle = '#f3f0e5';
    ctx.font = `${Math.max(9, W * 0.018)}px Arial, sans-serif`;
    ctx.fillText(`${role.name} / ${sk.family}`, W * 0.055, H * 0.943);

    if (scale) {
      ctx.fillStyle = 'rgba(0,0,0,0)';
    }
  }

  function renderFacts(evidence) {
    const rows = [
      ['素材', evidence.visual.subjectType],
      ['主体区域', evidence.visual.subjectZone],
      ['复杂度', evidence.visual.complexity.toFixed(2)],
      ['明度', evidence.visual.brightness.toFixed(2)],
      ['文案密度', evidence.copy.density],
      ['气质', evidence.copy.tone]
    ];
    els.facts.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  }

  function selectCard(index) {
    state.selectedIndex = index;
    const item = state.selections[index];
    if (!item) return;
    drawPoster(els.mainCanvas, item);
    els.selectedFamily.textContent = `${item.role.name} · ${item.skeleton.family}`;
    els.selectedName.textContent = item.skeleton.name;
    els.selectedReason.textContent = `${item.role.intent} / ${item.reason.slice(0, 2).join(' / ')}`;
    [...els.cards.children].forEach((card, i) => card.classList.toggle('on', i === index));
  }

  function renderCards() {
    els.cards.innerHTML = '';
    state.selections.forEach((item, index) => {
      const card = document.createElement('article');
      card.className = 'card' + (index === state.selectedIndex ? ' on' : '');
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 400;
      drawPoster(canvas, item, true);
      const body = document.createElement('div');
      body.innerHTML = `
        <div class="meta">${item.role.name} · ${item.skeleton.family} · ${Math.round(item.score)}</div>
        <h3>${item.skeleton.name}</h3>
        <p>${item.role.intent}</p>
        <p>${item.reason.slice(0, 2).join(' / ')}</p>
        <div class="risks">风险：${item.skeleton.risks.slice(0, 2).join(' / ')}</div>
      `;
      card.append(canvas, body);
      card.addEventListener('click', () => selectCard(index));
      els.cards.appendChild(card);
    });
  }

  function generate() {
    if (!state.pack) return;
    const evidence = buildEvidence();
    const count = ChoicePolicy.resolveChoiceCount(els.count.value);
    renderFacts(evidence);
    state.selections = SkeletonSelector.selectSkeletons(evidence, state.pack.skeletons, { count });
    state.selectedIndex = 0;
    renderCards();
    selectCard(0);
  }

  async function init() {
    state.pack = window.LAYOUT_SKELETON_PACK || await fetch('../skeletons/skeleton-pack-v1.json').then(res => res.json());
    state.imageAnalysis = analyzeImage(null);
    renderFacts(buildEvidence());
    drawPoster(els.mainCanvas, {
      skeleton: state.pack.skeletons[0],
      reason: ['默认预览'],
      score: 0
    });

    els.imageInput.addEventListener('change', async event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      state.image = await loadImage(file);
      state.imageAnalysis = analyzeImage(state.image);
      renderFacts(buildEvidence());
      generate();
    });
    [els.title, els.subtitle, els.subject, els.tone, els.goal, els.count].forEach(el => el.addEventListener('input', generate));
    els.generate.addEventListener('click', generate);
    generate();
  }

  init().catch(error => {
    console.error(error);
    els.selectedName.textContent = '初始化失败';
    els.selectedReason.textContent = error.message;
  });
})();
