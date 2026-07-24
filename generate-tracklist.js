import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, parse } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const AUDIO_DIR = join(__dirname, 'public', 'audio');
const OUT_DIR = join(__dirname, 'src', 'data');
const OUT_FILE = join(OUT_DIR, 'tracklist.json');

// Stem type labels mapped from filename suffixes
const STEM_LABELS = {
  bass: 'Bass',
  drums: 'Drums',
  guitar: 'Guitar',
  piano: 'Piano',
  vocals: 'Vocals',
  'pro-other': 'Pro Other',
  instrumental: 'Instrumental',
};

/**
 * Parse a filename into { baseName, type, stemLabel } or null if unparseable.
 */
function parseFile(filename) {
  // Broadcast Clear: Broadcast_Clear_{name}.wav
  let m = filename.match(/^Broadcast_Clear_(.+)\.wav$/);
  if (m) return { baseName: m[1], type: 'broadcast_clear', stemLabel: 'Broadcast Clear' };

  // Serviced Instrumental: Serviced_Instrumental_{name}.wav
  m = filename.match(/^Serviced_Instrumental_(.+)\.wav$/);
  if (m) return { baseName: m[1], type: 'serviced_instrumental', stemLabel: 'Serviced Instrumental' };

  // TV Mix: {name}_TV.wav
  m = filename.match(/^(.+)_TV\.wav$/);
  if (m) return { baseName: m[1], type: 'tv_mix', stemLabel: 'TV Mix' };

  // Stem: {name}.wav-{stem}.wav
  m = filename.match(/^(.+)\.wav-(.+)\.wav$/);
  if (m) {
    const stemKey = m[2].toLowerCase();
    return {
      baseName: m[1],
      type: 'stem',
      stemLabel: STEM_LABELS[stemKey] || stemKey.charAt(0).toUpperCase() + stemKey.slice(1),
    };
  }

  // Master: {name}.wav (must not match any above)
  m = filename.match(/^(.+)\.wav$/);
  if (m) return { baseName: m[1], type: 'master', stemLabel: 'Master' };

  return null;
}

function generate() {
  if (!existsSync(AUDIO_DIR)) {
    console.error(`Audio directory not found: ${AUDIO_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(AUDIO_DIR).filter(f => f.endsWith('.wav'));
  const groups = new Map();

  for (const file of files) {
    const parsed = parseFile(file);
    if (!parsed) continue;

    const { baseName, type, stemLabel } = parsed;
    if (!groups.has(baseName)) {
      groups.set(baseName, {
        id: `trk_${String(groups.size + 1).padStart(2, '0')}`,
        title: baseName,
        master: null,
        stems: [],
        tvMix: null,
        broadcastClear: null,
        servicedInstrumental: null,
      });
    }

    const entry = groups.get(baseName);
    const filePath = `/audio/${file}`;

    switch (type) {
      case 'master':
        entry.master = filePath;
        break;
      case 'stem':
        entry.stems.push({ label: stemLabel, file: filePath });
        break;
      case 'tv_mix':
        entry.tvMix = filePath;
        break;
      case 'broadcast_clear':
        entry.broadcastClear = filePath;
        break;
      case 'serviced_instrumental':
        entry.servicedInstrumental = filePath;
        break;
    }
  }

  // Convert Map to array, filter out entries without a master file
  const tracklist = Array.from(groups.values())
    .filter(t => t.master !== null)
    .sort((a, b) => a.title.localeCompare(b.title));

  // Ensure output directory exists
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  writeFileSync(OUT_FILE, JSON.stringify(tracklist, null, 2), 'utf-8');
  console.log(`✓ Generated tracklist.json with ${tracklist.length} tracks`);
}

generate();