// Output formats. `safe` = vertical positions (0..1) for top/bottom captions that stay clear of
// YouTube's own UI (Shorts covers the bottom ~25% and right edge with buttons and the title).
export const FORMATS = {
  shorts: { label: 'Shorts 9:16', width: 1080, height: 1920, fov: 50, safe: { top: 0.17, bottom: 0.745 } },
  landscape: { label: 'YouTube 16:9', width: 1920, height: 1080, fov: 35, safe: { top: 0.14, bottom: 0.86 } },
};
