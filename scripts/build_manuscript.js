import { cli, ROOT } from './lib/project.js';
import { build } from './lib/build.js';

await cli(async args => console.log(await build(ROOT, args.includes('--final'))), ['--final']);
