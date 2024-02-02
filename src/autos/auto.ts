import fs from 'fs/promises';
import { PathPoint, writePathEntry } from '../paths/path.js';
import { AutoEntry } from './autos.js';

export type StartingPose = {
	position: PathPoint;
	rotation: number;
};

export type AutoCommandEntry =
	| {
			type: 'named';
			data: {
				name: string;
			};
	  }
	| {
			type: 'path';
			data: {
				pathName: string;
			};
	  }
	| {
			type: 'wait';
			data: {
				waitTime: number;
			};
	  }
	| {
			type: 'parallel' | 'deadline' | 'race' | 'sequential';
			data: {
				commands: AutoCommandEntry[];
			};
	  };

export type Auto = {
	version: 1.0;
	startingPose: StartingPose | null;
	folder: string | null;
	choreoAuto: boolean;
	command: AutoCommandEntry & { type: 'sequential' };
};

export async function parseAutoFromFile(filepath: string): Promise<Auto> {
	const file = await fs.readFile(filepath, 'utf-8');

	const parsed = JSON.parse(file);

	if (parsed.version !== 1.0) {
		throw new RangeError(`Invalid auto version: ${parsed.version}, expected 1.0`);
	}

	return parsed as Auto;
}

export async function writeAutoToFile(auto: Auto, filepath: string): Promise<void> {
	await fs.writeFile(filepath, JSON.stringify(auto, null, 2));
}

export async function writeAutoEntry(autoEntry: AutoEntry): Promise<void> {
	await Promise.all([
		writeAutoToFile(autoEntry.parsed, autoEntry.filepath),
		...autoEntry.paths.map((path) => writePathEntry(path)),
	]);
}
