#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { styleText } from 'node:util';
import { multiReplace } from '@jonahsnider/util';
import meow from 'meow';
import updateNotifier from 'update-notifier';
import pkg from '../package.json' with { type: 'json' };
import { loadConfig } from './config.js';
import { transform } from './transform.js';

const notifier = updateNotifier({ pkg });
notifier.notify({ defer: true });

const cli = meow(
	`
  ${styleText('bold', 'Usage')}
    $ pathflip <input-file> [--config path]

  ${styleText('bold', 'Options')}
    --config, -c   Path to pathflip.config.pkl (auto-discovered if omitted)
    --version, -v  Show version number

  ${styleText('bold', 'Examples')}
    $ pathflip src/main/java/com/team581/autos/RightIntegratedAuto.java
    $ pathflip RightAuto.java --config ./pathflip.config.pkl
`,
	{
		importMeta: import.meta,
		argv: process.argv.slice(2).map((arg) => (arg === '-v' ? '--version' : arg)),
		flags: {
			config: {
				type: 'string',
				shortFlag: 'c',
			},
		},
	},
);

const inputFile = cli.input.at(0);

if (!inputFile) {
	cli.showHelp(1);
	process.exit(1);
}

const inputPath = path.resolve(inputFile);

let source: string;

try {
	source = await fs.readFile(inputPath, 'utf-8');
} catch {
	console.error(styleText('red', `File not found: ${inputPath}`, { stream: process.stderr }));
	process.exit(1);
}

const config = await loadConfig(cli.flags.config, inputPath);
const { output, warnings } = transform(source, config);

for (const warning of warnings) {
	console.error(styleText('yellow', `Warning: ${warning.message}`, { stream: process.stderr }));
}

// Derive output path by applying replacements to the full path
const outputPath = multiReplace(inputPath, config.replacements);

if (outputPath === inputPath) {
	console.error(
		styleText('red', 'Output path is the same as input path. Check your replacements config.', {
			stream: process.stderr,
		}),
	);
	process.exit(1);
}

// Ensure output directory exists
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, output);

console.log(
	`${styleText('green', '✔')} ${path.relative(process.cwd(), inputPath)} → ${path.relative(process.cwd(), outputPath)}`,
);
