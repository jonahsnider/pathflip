const TWO_PI = 2 * Math.PI;

export function angleModulusRadians(angle: number): number {
	return angle - TWO_PI * Math.floor((angle + Math.PI) / TWO_PI);
}

export function angleModulusDegrees(angle: number): number {
	return angleModulusRadians((angle / 180) * Math.PI);
}
