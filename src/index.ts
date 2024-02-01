import { runCli } from './cli/cli.js';

const success = await runCli();

if (!success) {
	process.exit(1);
}
