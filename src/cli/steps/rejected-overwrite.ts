import { outro } from '@clack/prompts';

export function rejectedOverwrite(): void {
	outro('Exiting, no files will be overwritten');
}
