export type PathPlannerPathPoint = {
	x: number;
	y: number;
};

export type PathPlannerPathRotationTarget = {
	waypointRelativePos: number;
	rotationDegrees: number;
	rotateFast: boolean;
};

export type PathPlannerPathGoalEndState = {
	velocity: number;
	rotation: number;
	rotateFast: boolean;
};

export type PathPlannerPathWaypoint = {
	anchor: PathPlannerPathPoint;
	linkedName: null | string;
} & (
	| {
			prevControl: null | PathPlannerPathPoint;
			nextControl: PathPlannerPathPoint;
	  }
	| {
			prevControl: PathPlannerPathPoint;
			nextControl: null | PathPlannerPathPoint;
	  }
	| {
			prevControl: PathPlannerPathPoint;
			nextControl: PathPlannerPathPoint;
	  }
);

export type PathPlannerPath = {
	version: '2025.0';
	waypoints: PathPlannerPathWaypoint[];
	rotationTargets: PathPlannerPathRotationTarget[];
	goalEndState: PathPlannerPathGoalEndState;
	isLocked: boolean;
	folder: string | null;
	previewStartingState: null | {
		rotation: number;
		velocity: number;
	};
	reversed: boolean;
	globalConstraints: {
		maxVelocity: number;
		maxAcceleration: number;
		maxAngularVelocity: number;
		maxAngularAcceleration: number;
	};
	useDefaultConstraints: boolean;
	constraintZones: unknown[];
	eventMarkers: unknown[];
};

export type PathPlannerSettings = {
	robotWidth: number;
	robotLength: number;
	holonomicMode: true;
	pathFolders: string[];
	autoFolders: string[];
	defaultMaxVel: number;
	defaultMaxAccel: number;
	defaultMaxAngVel: number;
	defaultMaxAngAccel: number;
	maxModuleSpeed: number;
};
