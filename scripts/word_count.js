import { cli, chapters, countWords } from './lib/project.js';

await cli(async () => {
  const list = (await chapters()).filter(c => !['planned', 'prepared'].includes(c.status));
  const counts = list.map(c => countWords(c.prose));
  list.forEach((c, i) => console.log(`C${c.stem} : ${counts[i]} mots`));
  const total = counts.reduce((sum, n) => sum + n, 0);
  console.log(`Chapitres rédigés : ${list.length}\nTotal : ${total}\nMoyenne : ${counts.length ? Math.round(total / counts.length) : 0}\nMinimum : ${counts.length ? Math.min(...counts) : 0}\nMaximum : ${counts.length ? Math.max(...counts) : 0}`);
});
