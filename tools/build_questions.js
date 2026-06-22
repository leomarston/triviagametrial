// Generate scripts/questions.js from assets/data/questions_source.json
// Source format per item: [questionText, [4 choices], correctAnswerText]
// Difficulty keys in source: easy | normal | hard
const fs = require('fs');
const path = require('path');

const SRC = path.resolve('assets/data/questions_source.json');
const OUT = path.resolve('scripts/questions.js');
const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const META = {
  science:           {name:'Science',   color:'#39C16C', art:'assets/art/characters/science.svg',           blurb:'Atoms, space & the natural world'},
  general_knowledge: {name:'General',    color:'#EC4B57', art:'assets/art/characters/general_knowledge.svg', blurb:'A little bit of everything'},
  art:               {name:'Arts',       color:'#A45BD6', art:'assets/art/characters/arts.svg',              blurb:'Painters, styles & masterpieces'},
  geography:         {name:'Geography',  color:'#2E9BD6', art:'assets/art/characters/geography.svg',         blurb:'Capitals, rivers & far-off places'},
  sports:            {name:'Sports',     color:'#F3973F', art:'assets/art/characters/sports.svg',            blurb:'Champions, rules & records'},
  history:           {name:'History',    color:'#F4C63E', art:'assets/art/characters/history.svg',           blurb:'Empires, leaders & turning points'},
};
const ORDER = ['science','general_knowledge','art','geography','sports','history'];
const DIFFS = ['easy','normal','hard'];

const bank = {};
let total = 0, problems = [];
for (const cid of ORDER) {
  if (!data[cid]) { problems.push('missing category in source: '+cid); continue; }
  const arr = [];
  for (const d of DIFFS) {
    for (const [q, choices, correct] of (data[cid][d] || [])) {
      if (!Array.isArray(choices) || choices.length !== 4) { problems.push(`bad choices: ${cid}/${d}: ${q}`); continue; }
      const answer = choices.indexOf(correct);
      if (answer < 0) { problems.push(`correct not in choices: ${cid}/${d}: ${q}`); continue; }
      arr.push({ q, choices, answer, d });
      total++;
    }
  }
  bank[cid] = arr;
}

const cats = ORDER.map(id => Object.assign({ id }, META[id]));

// pretty-print compactly: one question object per line
function dumpBank(b){
  const cats = Object.keys(b).map(cid => {
    const items = b[cid].map(o =>
      `    { q:${JSON.stringify(o.q)}, choices:${JSON.stringify(o.choices)}, answer:${o.answer}, d:${JSON.stringify(o.d)} }`
    ).join(',\n');
    return `  ${JSON.stringify(cid)}: [\n${items}\n  ]`;
  }).join(',\n');
  return `{\n${cats}\n}`;
}

const out =
`/* ============================================================
   Trivia Quest — categories + question bank
   AUTO-GENERATED from assets/data/questions_source.json
   (run: node tools/build_questions.js) — do not hand-edit.
   Each question: { q, choices:[4], answer:index, d:'easy'|'normal'|'hard' }
   ============================================================ */
window.CATEGORIES = ${JSON.stringify(cats, null, 2)};

window.QUESTION_BANK = ${dumpBank(bank)};
`;

fs.writeFileSync(OUT, out);
const counts = ORDER.map(c => `${c}:${(bank[c]||[]).length}`).join('  ');
console.log('wrote', OUT);
console.log('total questions:', total);
console.log('per category:', counts);
if (problems.length) { console.log('PROBLEMS:\n - ' + problems.join('\n - ')); process.exitCode = 1; }
else console.log('no problems — every correct answer matched a choice.');
