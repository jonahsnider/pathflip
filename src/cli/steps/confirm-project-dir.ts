import { basename } from 'path';
import { confirm, isCancel } from '@clack/prompts';

const cwd = process.cwd();

export async function confirmProjectDir(): Promise<string | undefined> {
	const dirIsCorrect = await confirm({
		message: `Is \`${basename(cwd)}\` the right project directory?`,
		initialValue: true,
	});

	if (isCancel(dirIsCorrect)) {
		return undefined;
	}

	return dirIsCorrect ? cwd : undefined;
}
