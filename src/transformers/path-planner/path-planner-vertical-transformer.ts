import assert from 'node:assert/strict';
import path from 'node:path';
import type {
	PathPlannerTransformSelection,
	TransformRequest,
	TransformSelection,
} from '../../cli/steps/4/select-transforms.js';
import { FIELD_HEIGHT } from '../../common/constants.js';
import { angleModulusDegrees } from '../../common/math-util.js';
import type { PathPlannerPath, PathPlannerPathPoint } from '../../common/path-planner/types.js';
import { renamePath } from '../renamer.js';
import { Transformer } from '../transformer.js';
import type { PathPlannerProject } from './path-planner-transformer-group.js';

export class PathPlannerVerticalTransformer extends Transformer<PathPlannerTransformSelection, PathPlannerProject> {
	private static transformPoint(point: PathPlannerPathPoint): PathPlannerPathPoint {
		const xAxis = FIELD_HEIGHT / 2;

		return {
			x: point.x,
			y: xAxis - (point.y - xAxis),
		};
	}

	private static transformRotation(rotationDeg: number, transform: TransformRequest): number {
		assert(transform.vertical !== undefined, new TypeError('Transform request did not have a vertical value'));

		let result = rotationDeg;

		result *= -1;
		result = angleModulusDegrees(result);

		return result;
	}

	override shouldTransform(transform: TransformSelection): transform is PathPlannerTransformSelection {
		return transform.request.vertical !== undefined && transform.path.kind === 'path-planner';
	}

	override doTransform(transform: PathPlannerTransformSelection, project: PathPlannerProject): PathPlannerProject {
		const loadedPath = structuredClone(project.paths.get(transform.path.pathFilePath));

		assert(loadedPath, new TypeError(`PathPlanner path ${transform.path.pathFilePath} was missing`));

		loadedPath.goalEndState.rotation = PathPlannerVerticalTransformer.transformRotation(
			loadedPath.goalEndState.rotation,
			transform.request,
		);

		if (loadedPath.previewStartingState) {
			loadedPath.previewStartingState.rotation = PathPlannerVerticalTransformer.transformRotation(
				loadedPath.previewStartingState.rotation,
				transform.request,
			);
		}

		for (const rotationTarget of loadedPath.rotationTargets) {
			rotationTarget.rotationDegrees = PathPlannerVerticalTransformer.transformRotation(
				rotationTarget.rotationDegrees,
				transform.request,
			);
		}

		for (const waypoint of loadedPath.waypoints) {
			waypoint.anchor = PathPlannerVerticalTransformer.transformPoint(waypoint.anchor);
			if (waypoint.prevControl) {
				waypoint.prevControl = PathPlannerVerticalTransformer.transformPoint(waypoint.prevControl);
			}
			if (waypoint.nextControl) {
				waypoint.nextControl = PathPlannerVerticalTransformer.transformPoint(waypoint.nextControl);
			}
			if (waypoint.linkedName) {
				waypoint.linkedName = renamePath(waypoint.linkedName, transform.request);
			}
		}

		if (loadedPath.folder) {
			loadedPath.folder = renamePath(loadedPath.folder, transform.request);
		}

		const outputFilePath = path.join(
			path.dirname(transform.path.pathFilePath),
			renamePath(path.basename(transform.path.pathFilePath), transform.request),
		);

		project.paths.set(outputFilePath, loadedPath);

		return project;
	}

	possibleTransform(path: PathPlannerPath): TransformRequest['vertical'] {
		const [firstWaypoint] = path.waypoints;

		if (!firstWaypoint) {
			return undefined;
		}

		if (firstWaypoint.anchor.y > FIELD_HEIGHT / 2) {
			return 'top2bottom';
		}

		return 'bottom2top';
	}
}
