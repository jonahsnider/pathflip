#!/usr/bin/env node

import updateNotifier from 'update-notifier';
import pkg from '../package.json' assert { type: 'json' };

import { runCli } from './cli/cli.js';

const notifier = updateNotifier({ pkg });

notifier.notify({ defer: true });

const success = await runCli();

if (!success) {
	process.exit(1);
}
