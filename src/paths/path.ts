import { join } from 'path';
import fs from 'fs/promises';
import { PathEntry } from './paths.js';

export type PathPoint = {
	x: number;
	y: number;
};

export type PathRotationTarget = {
	waypointRelativePos: number;
	rotationDegrees: number;
	rotateFast: boolean;
};

export type PathGoalEndState = {
	velocity: number;
	rotation: number;
	rotateFast: boolean;
};

export type PathWaypoint = {
	anchor: PathPoint;
	linkedName: null | string;
} & (
	| {
			prevControl: null | PathPoint;
			nextControl: PathPoint;
	  }
	| {
			prevControl: PathPoint;
			nextControl: null | PathPoint;
	  }
	| {
			prevControl: PathPoint;
			nextControl: PathPoint;
	  }
);

export type Path = {
	version: 1.0;
	waypoints: PathWaypoint[];
	rotationTargets: PathRotationTarget[];
	goalEndState: PathGoalEndState;
	isLocked: boolean;
	folder: string | null;
	previewStartingState: null | {
		rotation: number;
		velocity: number;
	};
	reversed: boolean;
	globalConstraints: {
		maxVelocity: number;
		maxAcceleration: number;
		maxAngularVelocity: number;
		maxAngularAcceleration: number;
	};
	useDefaultConstraints: boolean;
	constraintZones: unknown[];
	eventMarkers: unknown[];
};

export async function parsePathFromFile(filepath: string): Promise<Path> {
	const file = await fs.readFile(filepath, 'utf-8');

	const parsed = JSON.parse(file);

	if (parsed.version !== 1.0) {
		throw new RangeError(`Invalid path version: ${parsed.version}, expected 1.0`);
	}

	return parsed as Path;
}

export async function parsePathFromName(
	projectDir: string,
	pathName: string,
): Promise<{ parsed: Path; filepath: string }> {
	const searchDirs = [
		join(projectDir, 'src', 'main', 'deploy', 'pathplanner', 'paths'),
		join(projectDir, 'deploy', 'pathplanner', 'paths'),
	];

	for (const searchDir of searchDirs) {
		try {
			const filepath = join(searchDir, `${pathName}.path`);
			const parsed = await parsePathFromFile(filepath);

			return { parsed: parsed, filepath };
		} catch (error) {
			// @ts-expect-error This is a custom error code
			if (error.code === 'ENOENT') {
				continue;
			}

			throw error;
		}
	}

	throw new RangeError(`Path not found: ${pathName}`);
}

export async function writePathToFile(path: Path, filepath: string): Promise<void> {
	await fs.writeFile(filepath, JSON.stringify(path, null, 2));
}

export async function writePathEntry(path: PathEntry): Promise<void> {
	await writePathToFile(path.parsed, path.filepath);
}
