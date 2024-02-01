import fs from 'fs/promises';

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
};

export async function parsePathFromFile(filepath: string): Promise<Path> {
	const file = fs.readFile(filepath, 'utf-8');

	const parsed = JSON.parse(await file);

	if (parsed.version !== 1.0) {
		throw new RangeError(`Invalid path version: ${parsed.version}, expected 1.0`);
	}

	return parsed as Path;
}
