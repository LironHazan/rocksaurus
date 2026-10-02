import { createStage } from './engine/stage.js';
import { createPlayer } from './engine/player.js';
import { recordEpisode } from './engine/recorder.js';
import { CAPTION_FONT } from './engine/captions.js';
import { FORMATS } from './engine/formats.js';
import { episodes } from './episodes/index.js';

const $ = id => document.getElementById(id);

// Episode and format come from the URL (?episode=<id>&format=shorts|landscape).
// Switching reloads, so every render starts from a clean scene.
const params = new URLSearchParams(location.search);
const episode = episodes.find(e => e.id === params.get('episode')) ?? episodes[0];
const formatId = FORMATS[params.get('format')] ? params.get('format') : 'shorts';
const format = FORMATS[formatId];

function picker(select, items, current, key) {
  for (const [value, label] of items) select.add(new Option(label, value, false, value === current));
  select.onchange = () => { params.set(key, select.value); location.search = params; };
}
picker($('episode'), episodes.map(e => [e.id, e.title]), episode.id, 'episode');
picker($('format'), Object.entries(FORMATS).map(([id, f]) => [id, f.label]), formatId, 'format');
document.title = `${episode.title} · Dino Studio`;

$('stage').dataset.format = formatId;
const stage = createStage($('stage'), format);

// Debug: ?cam=x,y,z,lookX,lookY,lookZ overrides the episode camera (handy for close-up checks)
if (params.get('cam')) {
  const [x, y, z, lx, ly, lz] = params.get('cam').split(',').map(Number);
  const render = stage.render;
  stage.render = overlay => { stage.camera.position.set(x, y, z); stage.camera.lookAt(lx, ly, lz); render(overlay); };
}
const scrub = $('scrub');
scrub.max = episode.duration;
let scrubbing = false;
const player = createPlayer(stage, episode, {
  onTime: t => {
    $('time').textContent = `${t.toFixed(1)}s`;
    if (!scrubbing) scrub.value = t;
  },
});
scrub.oninput = () => { scrubbing = true; player.seek(Number(scrub.value)); updateSoundLabel(); };
scrub.onchange = () => { scrubbing = false; };

const updateSoundLabel = () => ($('sound').textContent = player.soundOn ? '🔊 Sound on' : '🔈 Sound off');
$('sound').onclick = async () => { await player.setSound(!player.soundOn); updateSoundLabel(); };
$('restart').onclick = () => player.restart();

$('rec').onclick = async () => {
  $('rec').disabled = true;
  $('status').textContent = 'Recording…';
  try {
    await document.fonts.load(`700 80px ${CAPTION_FONT}`); // never record fallback fonts
    await document.fonts.ready;
    await player.setSound(true);
    updateSoundLabel();
    const file = await recordEpisode(player, stage.canvas, { name: `${episode.id}-${formatId}` });
    $('status').textContent = `Saved ${file}`;
  } catch (err) {
    $('status').textContent = err.message;
  } finally {
    $('rec').disabled = false;
  }
};
