import assert from 'node:assert/strict';
import path from 'node:path';
import type {
	PathPlannerTransformSelection,
	TransformRequest,
	TransformSelection,
} from '../../cli/steps/4/select-transforms.js';
import { FIELD_LENGTH } from '../../common/constants.js';
import { angleModulusDegrees } from '../../common/math-util.js';
import type { PathPlannerPath, PathPlannerPathPoint } from '../../common/path-planner/types.js';
import { renamePath } from '../renamer.js';
import { Transformer } from '../transformer.js';
import type { PathPlannerProject } from './path-planner-transformer-group.js';

export class PathPlannerColorTransformer extends Transformer<PathPlannerTransformSelection, PathPlannerProject> {
	private static transformPoint(point: PathPlannerPathPoint): PathPlannerPathPoint {
		const yAxis = FIELD_LENGTH / 2;

		return {
			x: yAxis - (point.x - yAxis),
			y: point.y,
		};
	}

	private static transformRotation(rotationDeg: number, transform: TransformRequest): number {
		let result = rotationDeg;

		switch (transform.color) {
			case 'red2blue': {
				result += 180;
				break;
			}
			case 'blue2red': {
				result -= 180;
				break;
			}
		}

		result = angleModulusDegrees(result);

		return result;
	}

	override shouldTransform(transform: TransformSelection): transform is PathPlannerTransformSelection {
		return transform.request.color !== undefined && transform.path.kind === 'path-planner';
	}

	override doTransform(transform: PathPlannerTransformSelection, project: PathPlannerProject): PathPlannerProject {
		const loadedPath = structuredClone(project.paths.get(transform.path.pathFilePath));

		assert(loadedPath, new TypeError(`PathPlanner path ${transform.path.pathFilePath} was missing`));

		loadedPath.goalEndState.rotation = PathPlannerColorTransformer.transformRotation(
			loadedPath.goalEndState.rotation,
			transform.request,
		);

		if (loadedPath.previewStartingState) {
			loadedPath.previewStartingState.rotation = PathPlannerColorTransformer.transformRotation(
				loadedPath.previewStartingState.rotation,
				transform.request,
			);
		}

		for (const rotationTarget of loadedPath.rotationTargets) {
			rotationTarget.rotationDegrees = PathPlannerColorTransformer.transformRotation(
				rotationTarget.rotationDegrees,
				transform.request,
			);
		}

		for (const waypoint of loadedPath.waypoints) {
			waypoint.anchor = PathPlannerColorTransformer.transformPoint(waypoint.anchor);
			if (waypoint.prevControl) {
				waypoint.prevControl = PathPlannerColorTransformer.transformPoint(waypoint.prevControl);
			}
			if (waypoint.nextControl) {
				waypoint.nextControl = PathPlannerColorTransformer.transformPoint(waypoint.nextControl);
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

	possibleTransform(path: PathPlannerPath): TransformRequest['color'] {
		const [firstWaypoint] = path.waypoints;

		if (!firstWaypoint) {
			return undefined;
		}

		if (firstWaypoint.anchor.x > FIELD_LENGTH / 2) {
			return 'red2blue';
		}

		return 'blue2red';
	}
}
