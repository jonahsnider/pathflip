import { log } from '@clack/prompts';

export function cancelledAutoSelect(): void {
	log.error('Cancelled auto selection');
}
