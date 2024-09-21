#!/usr/bin/env node

import updateNotifier from 'update-notifier';
import pkg from '../package.json' with { type: 'json' };

import { runCli } from './cli/cli.js';

const notifier = updateNotifier({ pkg });

notifier.notify({ defer: true });

await runCli();
