import { log } from '@clack/prompts';

export function incorrectProjectDir(): void {
	log.error('Please change directories to the root of your project and try again');
}
