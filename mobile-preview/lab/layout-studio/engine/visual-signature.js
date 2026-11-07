(function(root) {
  'use strict';

  const SPECIFIC = {
    monumental_type_counterweight: 'mass_type_dark',
    ref_black_mass_title: 'mass_type_dark',

    monumental_type_edge_lock: 'cropped_type',
    ref_black_type_cut: 'cropped_type',

    monumental_type_background_word: 'background_huge_type',
    ref_white_huge_type: 'background_huge_type',

    monumental_type_vertical_stack: 'vertical_axis',
    ref_vertical_type_axis: 'vertical_axis',
    eastern_empty_vertical_title: 'vertical_axis',

    swiss_grid_left_ragged_title: 'line_grid',
    swiss_grid_annotation: 'line_grid',
    ref_multi_column_grid: 'line_grid',
    ref_blueprint_frame: 'line_grid',
    ref_margin_study: 'line_grid',

    frame_center_float: 'quiet_center_object',
    frame_whitespace_gallery: 'quiet_center_object',

    split_lower_caption_band: 'lower_caption_band',
    split_half_image_half_type: 'split_image_type',

    interleave_contour_follow: 'contour_caption',
    interleave_behind_subject_caption: 'subject_mask_type',
    interleave_subject_type: 'subject_mask_type',

    ref_nine_block_wall: 'modular_wall',
    ref_soft_color_grid: 'modular_wall',
    swiss_grid_modular_blocks: 'modular_wall',

    ref_commercial_module_board: 'module_board',
    ref_offset_annotation: 'offset_annotation',
    ref_japanese_vertical_collage: 'japanese_collage',
    ref_japanese_card_set: 'japanese_card_set',
    ref_editorial_image_columns: 'editorial_columns',

    eastern_product_stage: 'product_stage',
    eastern_seal_corner: 'eastern_seal',
    eastern_landscape_breathing: 'eastern_landscape'
  };

  const FAMILY_FALLBACK = {
    monumental_type: 'mass_type_dark',
    swiss_grid: 'line_grid',
    frame_whitespace: 'quiet_center_object',
    image_type_split: 'split_image_type',
    interpenetration: 'subject_mask_type',
    eastern_whitespace: 'vertical_axis',
    reference_black_type: 'mass_type_dark',
    reference_grid_system: 'line_grid',
    reference_wireframe: 'line_grid',
    reference_japanese_type: 'vertical_axis',
    reference_editorial: 'editorial_columns',
    reference_card_system: 'module_board'
  };

  function visualSignature(skeleton) {
    skeleton = skeleton || {};
    return skeleton.visualSignature ||
      SPECIFIC[skeleton.id] ||
      FAMILY_FALLBACK[skeleton.family] ||
      'generic';
  }

  const api = { visualSignature };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.VisualSignature = api;
})(typeof window !== 'undefined' ? window : globalThis);
