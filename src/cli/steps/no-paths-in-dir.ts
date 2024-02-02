import { log } from '@clack/prompts';

export function noAutosInDir(): void {
	log.error('There are no autos in the autos directory');
}
