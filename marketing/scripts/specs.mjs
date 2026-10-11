// Single list of every deliverable: used by render-video.mjs, render-stills.mjs and verify.mjs.
// min/max = accepted duration window in seconds.
export const VIDEO_SPECS = [
  { name: 'logo-reveal-1080x1080', scene: 'logo-reveal.html', w: 1080, h: 1080, min: 3.9, max: 4.1 },
  { name: 'logo-reveal-1920x1080', scene: 'logo-reveal.html', w: 1920, h: 1080, min: 3.9, max: 4.1 },
  { name: 'grid-loop-1080x1920', scene: 'grid-loop.html', w: 1080, h: 1920, min: 7.9, max: 8.1, webm: true, gif: 360,
    extras: [{ file: 'grid-loop-1080x1920.webm', w: 1080, h: 1920 }, { file: 'grid-loop-360w.gif', w: 360, h: 640 }] },
  { name: 'explainer-hidden-single-1080x1920', scene: 'explainer.html', w: 1080, h: 1920, q: 'tech=hidden-single', min: 20, max: 35 },
  { name: 'explainer-naked-pair-1080x1920', scene: 'explainer.html', w: 1080, h: 1920, q: 'tech=naked-pair', min: 20, max: 35 },
  { name: 'explainer-x-wing-1080x1920', scene: 'explainer.html', w: 1080, h: 1920, q: 'tech=x-wing', min: 20, max: 35 },
  { name: 'feature-showcase-1080x1920', scene: 'showcase.html', w: 1080, h: 1920, min: 24, max: 26 },
  { name: 'launch-teaser-1080x1920', scene: 'teaser.html', w: 1080, h: 1920, min: 11.9, max: 12.1 },
  { name: 'launch-teaser-1920x1080', scene: 'teaser.html', w: 1920, h: 1080, min: 11.9, max: 12.1 },
  { name: 'progression-1080x1920', scene: 'progression.html', w: 1080, h: 1920, min: 14.9, max: 15.1 },
];

export const STILL_NAMES = [
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ name: `play-screenshot-0${n}-1080x1920`, page: 'store-screenshot.html', w: 1080, h: 1920, q: `n=${n}` })),
  ...['x-wing', 'naked-pair', 'hidden-single'].map((t) => ({ name: `yt-thumbnail-${t}-1280x720`, page: 'yt-thumbnail.html', w: 1280, h: 720, q: `tech=${t}` })),
  ...['x-wing', 'naked-pair', 'hidden-single'].map((t) => ({ name: `shorts-cover-${t}-1080x1920`, page: 'shorts-cover.html', w: 1080, h: 1920, q: `tech=${t}` })),
  { name: 'x-header-1500x500', page: 'social-header.html', w: 1500, h: 500 },
  { name: 'facebook-cover-1640x624', page: 'social-header.html', w: 1640, h: 624 },
  { name: 'facebook-cover-851x315', page: 'social-header.html', w: 851, h: 315 },
  ...['light', 'dark', 'brand'].flatMap((th) => [
    { name: `background-${th}-1920x1080`, page: 'background.html', w: 1920, h: 1080, q: `theme=${th}` },
    { name: `background-${th}-1080x1920`, page: 'background.html', w: 1080, h: 1920, q: `theme=${th}` },
  ]),
];
