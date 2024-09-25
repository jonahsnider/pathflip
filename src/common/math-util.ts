const TWO_PI = 2 * Math.PI;

/** Normalizes an angle to be within (-pi, pi]. */
export function angleModulusRadians(angle: number): number {
	const result = angle - TWO_PI * Math.floor((angle + Math.PI) / TWO_PI);

	if (result === -Math.PI) {
		return Math.PI;
	}

	return result;
}

export function angleModulusDegrees(angle: number): number {
	return angleModulusRadians((angle / 180) * Math.PI);
}
