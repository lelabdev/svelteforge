import { generateTemplatesFile } from '../../../scripts/prebuild-utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

generateTemplatesFile(
join(__dirname, '../templates/src'),
join(__dirname, '../src/templates.ts')
);
