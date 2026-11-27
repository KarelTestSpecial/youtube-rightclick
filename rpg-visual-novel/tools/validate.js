#!/usr/bin/env node
/* Controleert js/storyData.js op fouten.  Gebruik:  node tools/validate.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/storyData.js'), 'utf8'), sandbox, { filename: 'storyData.js' });
const { validateStory } = require(path.join(root, 'js/validator.js'));

const S = sandbox.window.STORY_DATA;
const { errors, warnings } = validateStory(S);
warnings.forEach((w) => console.warn('⚠  ' + w));
errors.forEach((e) => console.error('✖  ' + e));
const n = (o) => Object.keys(o || {}).length;
console.log(`\n${n(S.scenes)} scènes · ${n(S.locations)} locaties · ${n(S.characters)} personages · ${n(S.items)} voorwerpen · ${n(S.lore)} lore · ${n(S.endings)} eindes`);
if (errors.length) { console.error(`\n${errors.length} fout(en) gevonden.`); process.exit(1); }
console.log(warnings.length ? `OK, met ${warnings.length} waarschuwing(en).` : 'OK — geen fouten gevonden. ✔');
