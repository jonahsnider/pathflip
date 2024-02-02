import { log } from '@clack/prompts';

export function noAutosDir(): void {
	log.error('No PathPlanner autos directory could be found. Are you in the right project?');
}
