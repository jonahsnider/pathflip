import { log } from '@clack/prompts';

export function cancelledOverwriteConfirm(): void {
	log.error('Cancelled, no files were overwritten');
}
