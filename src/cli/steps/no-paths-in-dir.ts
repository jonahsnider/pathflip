import { log, outro } from '@clack/prompts';

export function noPathsInDir(): void {
	log.error('There are no paths in the paths directory');
}
