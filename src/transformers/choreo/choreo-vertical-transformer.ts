import assert from 'node:assert/strict';
import type {
	ChoreoTransformSelection,
	TransformRequest,
	TransformSelection,
} from '../../cli/steps/4/select-transforms.js';
import type { ChoreoPath, ChoreoSettings } from '../../common/choreo/types.js';
import { FIELD_HEIGHT } from '../../common/constants.js';
import { renamePath } from '../renamer.js';
import { Transformer } from '../transformer.js';

export class ChoreoVerticalTransformer extends Transformer<ChoreoTransformSelection, ChoreoSettings> {
	private static transformPoint(point: { x: number; y: number }): { x: number; y: number } {
		const xAxis = FIELD_HEIGHT / 2;

		return {
			x: point.x,
			y: xAxis - (point.y - xAxis),
		};
	}

	private static transformRotation(rotationRad: number, transform: TransformRequest): number {
		assert(transform.vertical !== undefined, new TypeError('Transform request did not have a vertical value'));

		let result = rotationRad;

		result *= -1;
		result %= 2 * Math.PI;

		return result;
	}

	override shouldTransform(transform: TransformSelection): transform is ChoreoTransformSelection {
		return transform.request.vertical !== undefined && transform.path.kind === 'choreo';
	}

	override doTransform(transform: ChoreoTransformSelection, settings: ChoreoSettings): ChoreoSettings {
		const path = structuredClone(settings.paths[transform.path.pathName]);

		assert(
			path,
			new TypeError(`Choreo path ${transform.path.pathName} was missing from ${transform.path.settingsFilePath}`),
		);

		for (const waypoint of path.waypoints) {
			const transformed = ChoreoVerticalTransformer.transformPoint({ x: waypoint.x, y: waypoint.y });
			const heading = ChoreoVerticalTransformer.transformRotation(waypoint.heading, transform.request);
			waypoint.x = transformed.x;
			waypoint.y = transformed.y;
			waypoint.heading = heading;
		}

		for (const obstacle of path.circleObstacles) {
			const transformed = ChoreoVerticalTransformer.transformPoint({ x: obstacle.x, y: obstacle.y });
			obstacle.x = transformed.x;
			obstacle.y = transformed.y;
		}

		for (const sample of path.trajectory) {
			const transformed = ChoreoVerticalTransformer.transformPoint({ x: sample.x, y: sample.y });
			const heading = ChoreoVerticalTransformer.transformRotation(sample.heading, transform.request);
			sample.x = transformed.x;
			sample.y = transformed.y;
			sample.heading = heading;
		}

		for (const waypoint of path.trajectoryWaypoints) {
			const transformed = ChoreoVerticalTransformer.transformPoint({ x: waypoint.x, y: waypoint.y });
			const heading = ChoreoVerticalTransformer.transformRotation(waypoint.heading, transform.request);
			waypoint.x = transformed.x;
			waypoint.y = transformed.y;
			waypoint.heading = heading;
		}

		path.isTrajectoryStale = true;

		settings.paths[renamePath(transform.path.pathName, transform.request)] = path;

		return settings;
	}

	possibleTransform(path: ChoreoPath): TransformRequest['vertical'] {
		const [firstWaypoint] = path.waypoints;

		if (!firstWaypoint) {
			return undefined;
		}

		if (firstWaypoint.y > FIELD_HEIGHT / 2) {
			return 'top2bottom';
		}

		return 'bottom2top';
	}
}
