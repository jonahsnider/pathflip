import { basename, dirname, join } from 'path';
import { PathPoint } from '../paths/path.js';
import { PathEntry } from '../paths/paths.js';
import { FIELD_HEIGHT, FIELD_LENGTH } from './constants.js';
import { transformName } from './name-transforms.js';
import { TransformRequest } from './transform-request.js';

export function transformRotation(rotationDeg: number, transform: TransformRequest): number {
	let result = rotationDeg;

	if (transform.color === 'red2blue') {
		result = -result + 180;
		result %= 360;
	} else if (transform.color === 'blue2red') {
		result = -result - 180;
		result %= 360;
	}

	if (transform.vertical) {
		result *= -1;
		result %= 360;
	}

	return result;
}

export function transformPoint(point: PathPoint, transform: TransformRequest): PathPoint {
	const result = { ...point };

	const xAxis = FIELD_HEIGHT / 2;
	const yAxis = FIELD_LENGTH / 2;

	switch (transform.vertical) {
		case 'bottom2top':
		case 'top2bottom': {
			result.y = xAxis - (result.y - xAxis);
			break;
		}
	}

	switch (transform.color) {
		case 'red2blue':
		case 'blue2red': {
			result.x = yAxis - (result.x - yAxis);
			break;
		}
	}

	return result;
}

export function transformPath(input: PathEntry, transform: TransformRequest): PathEntry {
	const output = structuredClone(input);
	const path = output.parsed;

	path.goalEndState.rotation = transformRotation(path.goalEndState.rotation, transform);

	if (path.previewStartingState) {
		path.previewStartingState.rotation = transformRotation(path.previewStartingState.rotation, transform);
	}

	for (const rotationTarget of path.rotationTargets) {
		rotationTarget.rotationDegrees = transformRotation(rotationTarget.rotationDegrees, transform);
	}

	for (const waypoint of path.waypoints) {
		waypoint.anchor = transformPoint(waypoint.anchor, transform);

		if (waypoint.prevControl) {
			waypoint.prevControl = transformPoint(waypoint.prevControl, transform);
		}

		if (waypoint.nextControl) {
			waypoint.nextControl = transformPoint(waypoint.nextControl, transform);
		}

		if (waypoint.linkedName) {
			waypoint.linkedName = transformName(waypoint.linkedName, transform);
		}
	}

	output.filepath = join(dirname(output.filepath), transformName(basename(output.filepath), transform));

	if (path.folder) {
		path.folder = transformName(path.folder, transform);
	}

	return output;
}
