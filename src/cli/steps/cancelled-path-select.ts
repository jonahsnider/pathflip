import { log } from '@clack/prompts';

export function cancelledPathSelect(): void {
	log.error('Cancelled path selection');
}
