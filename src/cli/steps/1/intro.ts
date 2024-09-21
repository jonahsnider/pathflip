import { intro } from '@clack/prompts';

import pkg from '../../../../package.json' with { type: 'json' };

export function runIntro(): void {
	intro(`🛹 Pathflip v${pkg.version}`);
}
