import { cli, ROOT } from './lib/project.js';
import { projectStatus } from './lib/status.js';

await cli(async args => console.log(await projectStatus(ROOT, args.includes('--write'))), ['--write']);
