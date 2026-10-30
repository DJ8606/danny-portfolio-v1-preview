(function(root) {
  'use strict';

  const SPECIFIC = {
    monumental_type_counterweight: {
      template: 'monumental-counterweight',
      intent: 'large type balances the subject mass'
    },
    monumental_type_background_word: {
      template: 'background-word',
      intent: 'oversized background type becomes the composition field'
    },
    monumental_type_edge_lock: {
      template: 'edge-lock',
      intent: 'type locks to the canvas edge for poster tension'
    },
    monumental_type_vertical_stack: {
      template: 'vertical-stack',
      intent: 'stacked vertical title creates a strong reading axis'
    },
    swiss_grid_left_ragged_title: {
      template: 'swiss-left-ragged',
      intent: 'left aligned title and measured grid build order'
    },
    swiss_grid_annotation: {
      template: 'swiss-annotation',
      intent: 'small annotations and grid marks turn content into a system'
    },
    interleave_contour_follow: {
      template: 'contour-follow',
      intent: 'caption follows a soft contour rather than sitting in a block'
    },
    interleave_behind_subject_caption: {
      template: 'behind-subject-caption',
      intent: 'type sits partially behind the implied subject zone'
    },
    interleave_subject_type: {
      template: 'subject-type-stack',
      intent: 'subject and title form a foreground/background stack'
    },
    frame_center_float: {
      template: 'center-float',
      intent: 'subject floats in a quiet centered field'
    },
    frame_whitespace_gallery: {
      template: 'gallery-whitespace',
      intent: 'image is treated like a gallery object with measured captions'
    },
    split_lower_caption_band: {
      template: 'lower-caption-band',
      intent: 'image leads while a lower band carries structured text'
    },
    split_half_image_half_type: {
      template: 'half-image-half-type',
      intent: 'image and typography divide the page asymmetrically'
    },
    eastern_empty_vertical_title: {
      template: 'eastern-vertical-title',
      intent: 'vertical CJK title creates a quiet eastern axis'
    },
    eastern_product_stage: {
      template: 'product-stage',
      intent: 'product sits on a visual stage with restrained inscription'
    },
    ref_black_mass_title: {
      template: 'ref-black-mass-title',
      intent: 'heavy black editorial type dominates the poster'
    },
    ref_black_type_cut: {
      template: 'ref-black-type-cut',
      intent: 'oversized cut type becomes the main graphic'
    },
    ref_white_huge_type: {
      template: 'ref-white-huge-type',
      intent: 'white field and huge type create minimalist pressure'
    },
    ref_vertical_type_axis: {
      template: 'ref-vertical-type-axis',
      intent: 'vertical title axis organizes smaller text and image blocks'
    },
    ref_multi_column_grid: {
      template: 'ref-multi-column-grid',
      intent: 'dense information is divided into measured columns'
    },
    ref_nine_block_wall: {
      template: 'ref-nine-block-wall',
      intent: 'modular cells create an information wall'
    },
    ref_split_frame_numbers: {
      template: 'ref-split-frame-numbers',
      intent: 'thick frames and numbers divide content into strong zones'
    },
    ref_blueprint_frame: {
      template: 'ref-blueprint-frame',
      intent: 'blue construction lines expose the layout system'
    },
    ref_japanese_vertical_collage: {
      template: 'ref-japanese-vertical-collage',
      intent: 'vertical Japanese editorial rhythm with staggered image blocks'
    },
    ref_japanese_card_set: {
      template: 'ref-japanese-card-set',
      intent: 'small cards create a restrained series layout'
    },
    ref_editorial_image_columns: {
      template: 'ref-editorial-image-columns',
      intent: 'magazine image and text columns build a reading surface'
    },
    ref_commercial_module_board: {
      template: 'ref-commercial-module-board',
      intent: 'commercial card modules organize selling points'
    },
    ref_soft_color_grid: {
      template: 'ref-soft-color-grid',
      intent: 'soft color cells create a light knowledge-card grid'
    },
    ref_offset_annotation: {
      template: 'ref-offset-annotation',
      intent: 'offset image and annotation blocks create editorial movement'
    },
    ref_margin_study: {
      template: 'ref-margin-study',
      intent: 'visible margins and guides make whitespace deliberate'
    }
  };

  const FAMILY_FALLBACK = {
    monumental_type: { template: 'monumental-counterweight', intent: 'strong title-led poster structure' },
    image_type_split: { template: 'half-image-half-type', intent: 'image and text split the page' },
    frame_whitespace: { template: 'gallery-whitespace', intent: 'quiet framed object with whitespace' },
    interpenetration: { template: 'subject-type-stack', intent: 'type and subject interact spatially' },
    swiss_grid: { template: 'swiss-grid', intent: 'grid-led information order' },
    eastern_whitespace: { template: 'eastern-vertical-title', intent: 'quiet eastern whitespace composition' },
    reference_black_type: { template: 'ref-black-mass-title', intent: 'black and white display type skeleton' },
    reference_grid_system: { template: 'ref-multi-column-grid', intent: 'reference grid skeleton' },
    reference_wireframe: { template: 'ref-blueprint-frame', intent: 'wireframe reference skeleton' },
    reference_japanese_type: { template: 'ref-vertical-type-axis', intent: 'Japanese vertical type skeleton' },
    reference_editorial: { template: 'ref-editorial-image-columns', intent: 'editorial reference skeleton' },
    reference_card_system: { template: 'ref-commercial-module-board', intent: 'card module reference skeleton' }
  };

  function planForSkeleton(skeleton) {
    skeleton = skeleton || {};
    return SPECIFIC[skeleton.id] || FAMILY_FALLBACK[skeleton.family] || {
      template: 'generic-poster',
      intent: 'generic poster fallback'
    };
  }

  const api = { planForSkeleton };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RenderPlan = api;
})(typeof window !== 'undefined' ? window : globalThis);
