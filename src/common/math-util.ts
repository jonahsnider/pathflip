export function inputModulus(input: number, minimumInput: number, maximumInput: number): number {
	const modulus = maximumInput - minimumInput;
	let result = input;

	// Wrap input if it's above the maximum input
	const numMax = Math.round((result - minimumInput) / modulus);
	result -= numMax * modulus;

	// Wrap input if it's below the minimum input
	const numMin = Math.round((result - maximumInput) / modulus);
	result -= numMin * modulus;

	return result;
}

export function angleModulusRadians(angle: number): number {
	return inputModulus(angle, -Math.PI, Math.PI);
}

export function angleModulusDegrees(angle: number): number {
	return inputModulus(angle, -180, 180);
}
