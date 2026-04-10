#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { multiReplace } from '@jonahsnider/util';
import meow from 'meow';
import pc from 'picocolors';
import updateNotifier from 'update-notifier';
import pkg from '../package.json' with { type: 'json' };
import { loadConfig } from './config.js';
import { transform } from './transform.js';

const notifier = updateNotifier({ pkg });
notifier.notify({ defer: true });

const cli = meow(
	`
  ${pc.bold('Usage')}
    $ pathflip <input-file> [--config path]

  ${pc.bold('Options')}
    --config, -c   Path to pathflip.config.pkl (auto-discovered if omitted)
    --version, -v  Show version number

  ${pc.bold('Examples')}
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

if (!fs.existsSync(inputPath)) {
	console.error(pc.red(`File not found: ${inputPath}`));
	process.exit(1);
}

const config = await loadConfig(cli.flags.config, inputPath);
const source = fs.readFileSync(inputPath, 'utf-8');
const { output, warnings } = transform(source, config);

for (const warning of warnings) {
	console.error(pc.yellow(`Warning: ${warning.message}`));
}

// Derive output path by applying replacements to the full path
const outputPath = multiReplace(inputPath, config.replacements);

if (outputPath === inputPath) {
	console.error(pc.red('Output path is the same as input path. Check your replacements config.'));
	process.exit(1);
}

// Ensure output directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);

console.log(
	`${pc.green('✔')} ${path.relative(process.cwd(), inputPath)} → ${path.relative(process.cwd(), outputPath)}`,
);
