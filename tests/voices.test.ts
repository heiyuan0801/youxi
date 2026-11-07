import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { AQUATIC, ANIMALS } from '../assets/scripts/FarmCatalog';
import { ANIMAL_VOICES, AQUATIC_VOICES, SOUND_KEYS } from '../assets/scripts/AnimalVoices';

const wav = (key: string) => readFileSync(`assets/resources/audio/${key}.wav`);

test('every land animal keeps a dedicated voice file', () => {
  const splash = wav('pondSplash');
  for (const animal of ANIMALS) {
    const key = ANIMAL_VOICES[animal.id];
    assert.equal(typeof key, 'string');
    assert.ok(wav(key).byteLength > 1000, key);
    assert.notDeepEqual(wav(key), splash);
  }
  assert.equal(new Set(Object.values(ANIMAL_VOICES)).size, ANIMALS.length);
});

test('aquatic species no longer share one splash placeholder', () => {
  const hashes = AQUATIC.map(fish => {
    const key = AQUATIC_VOICES[fish.id];
    assert.equal(key, fish.id);
    const bytes = wav(key);
    assert.ok(bytes.byteLength > 1000);
    return createHash('sha256').update(bytes).digest('hex');
  });
  hashes.push(createHash('sha256').update(wav('pondSplash')).digest('hex'));
  assert.equal(new Set(hashes).size, AQUATIC.length + 1);
  assert.equal(new Set(SOUND_KEYS).size, SOUND_KEYS.length);
  assert.equal(SOUND_KEYS.length, ANIMALS.length + AQUATIC.length + 5);
});
