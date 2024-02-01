import { intro } from '@clack/prompts';

import pkg from '../../../package.json' assert { type: 'json' };

export function runIntro(): void {
	intro(`Pathflip v${pkg.version}`);
}
