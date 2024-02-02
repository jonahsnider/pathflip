type ColorTransform = 'red2blue' | 'blue2red';
type VerticalTransform = 'top2bottom' | 'bottom2top';

export type TransformRequest = {
	color: ColorTransform | undefined;
	vertical: VerticalTransform | undefined;
};
