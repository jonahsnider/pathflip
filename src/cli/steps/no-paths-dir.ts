import { log } from '@clack/prompts';

export function noPathsDir(): void {
	log.error('No PathPlanner path directory could be found. Are you in the right project?');
}
