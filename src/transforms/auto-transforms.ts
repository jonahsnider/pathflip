import { basename, dirname, join } from 'path';
import { AutoCommandEntry } from '../autos/auto.js';
import { AutoEntry } from '../autos/autos.js';
import { FIELD_HEIGHT, FIELD_LENGTH } from './constants.js';
import { transformName } from './name-transforms.js';
import { transformPath, transformPoint, transformRotation } from './path-transforms.js';
import { TransformRequest } from './transform-request.js';

export type AutoWithTransforms = {
	auto: AutoEntry;
	transform: TransformRequest;
};

export function getAllowedTransforms(auto: AutoEntry): TransformRequest[] {
	const firstPoint = auto.parsed.startingPose?.position ?? auto.paths[0]?.parsed.waypoints[0]?.anchor;

	if (!firstPoint) {
		return [];
	}

	const pathIsRed = firstPoint.x > FIELD_LENGTH / 2;
	const pathIsTop = firstPoint.y > FIELD_HEIGHT / 2;

	return [
		{ color: pathIsRed ? 'red2blue' : 'blue2red', vertical: undefined },
		{ color: undefined, vertical: pathIsTop ? 'top2bottom' : 'bottom2top' },
	];
}

export function transformAuto(auto: AutoEntry, transform: TransformRequest): AutoEntry {
	const output = structuredClone(auto);

	output.paths = output.paths.map((path) => transformPath(path, transform));

	if (output.dir) {
		output.dir = transformName(output.dir, transform);
	}

	output.filepath = join(dirname(output.filepath), transformName(basename(output.filepath), transform));

	output.name = transformName(output.name, transform);
	output.nameWithDir = output.dir ? `${output.dir}/${output.name}` : output.name;

	if (output.parsed.startingPose) {
		output.parsed.startingPose.position = transformPoint(output.parsed.startingPose.position, transform);
		output.parsed.startingPose.rotation = transformRotation(output.parsed.startingPose.rotation, transform);
	}

	output.parsed.command.data.commands = output.parsed.command.data.commands.map((command): AutoCommandEntry => {
		if (command.type === 'path') {
			return {
				type: 'path',
				data: {
					pathName: transformName(command.data.pathName, transform),
				},
			};
		}

		return command;
	});

	return output;
}
