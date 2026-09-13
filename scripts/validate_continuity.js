import { cli } from './lib/project.js';
import { validate } from './lib/validation.js';

await cli(async () => {
  const result = await validate();
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  console.log('Structure et références valides. La cohérence narrative nécessite les audits éditoriaux.');
});
