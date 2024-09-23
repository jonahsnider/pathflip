import assert from 'node:assert/strict';
import type {
	ChoreoTransformSelection,
	TransformRequest,
	TransformSelection,
} from '../../cli/steps/4/select-transforms.js';
import type { ChoreoPath, ChoreoSettings } from '../../common/choreo/types.js';
import { FIELD_LENGTH } from '../../common/constants.js';
import { angleModulusRadians } from '../../common/math-util.js';
import { renamePath } from '../renamer.js';
import { Transformer } from '../transformer.js';

export class ChoreoColorTransformer extends Transformer<ChoreoTransformSelection, ChoreoSettings> {
	private static transformPoint(point: { x: number; y: number }): { x: number; y: number } {
		const yAxis = FIELD_LENGTH / 2;

		return {
			x: yAxis - (point.x - yAxis),
			y: point.y,
		};
	}

	private static transformRotation(rotationRad: number, transform: TransformRequest): number {
		let result = rotationRad;

		switch (transform.color) {
			case 'red2blue': {
				result += Math.PI;
				break;
			}
			case 'blue2red': {
				result -= Math.PI;
				break;
			}
		}

		result = angleModulusRadians(result);

		return result;
	}

	override shouldTransform(transform: TransformSelection): transform is ChoreoTransformSelection {
		return transform.request.color !== undefined && transform.path.kind === 'choreo';
	}

	override doTransform(transform: ChoreoTransformSelection, settings: ChoreoSettings): ChoreoSettings {
		const path = structuredClone(settings.paths[transform.path.pathName]);

		assert(
			path,
			new TypeError(`Choreo path ${transform.path.pathName} was missing from ${transform.path.settingsFilePath}`),
		);

		for (const waypoint of path.waypoints) {
			const transformed = ChoreoColorTransformer.transformPoint({ x: waypoint.x, y: waypoint.y });
			const heading = ChoreoColorTransformer.transformRotation(waypoint.heading, transform.request);
			waypoint.x = transformed.x;
			waypoint.y = transformed.y;
			waypoint.heading = heading;
		}

		for (const obstacle of path.circleObstacles) {
			const transformed = ChoreoColorTransformer.transformPoint({ x: obstacle.x, y: obstacle.y });
			obstacle.x = transformed.x;
			obstacle.y = transformed.y;
		}

		for (const sample of path.trajectory) {
			const transformed = ChoreoColorTransformer.transformPoint({ x: sample.x, y: sample.y });
			const heading = ChoreoColorTransformer.transformRotation(sample.heading, transform.request);
			sample.x = transformed.x;
			sample.y = transformed.y;
			sample.heading = heading;
		}

		for (const waypoint of path.trajectoryWaypoints) {
			const transformed = ChoreoColorTransformer.transformPoint({ x: waypoint.x, y: waypoint.y });
			const heading = ChoreoColorTransformer.transformRotation(waypoint.heading, transform.request);
			waypoint.x = transformed.x;
			waypoint.y = transformed.y;
			waypoint.heading = heading;
		}

		path.isTrajectoryStale = true;

		settings.paths[renamePath(transform.path.pathName, transform.request)] = path;

		return settings;
	}

	possibleTransform(path: ChoreoPath): TransformRequest['color'] {
		const [firstWaypoint] = path.waypoints;

		if (!firstWaypoint) {
			return undefined;
		}

		if (firstWaypoint.x > FIELD_LENGTH / 2) {
			return 'red2blue';
		}

		return 'blue2red';
	}
}
