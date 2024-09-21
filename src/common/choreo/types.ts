export type ChoreoRobotConfiguration = {
	mass: number;
	rotationalInertia: number;
	motorMaxTorque: number;
	motorMaxVelocity: number;
	gearing: number;
	wheelbase: number;
	trackWidth: number;
	bumperLength: number;
	bumperWidth: number;
	wheelRadius: number;
};

export type ChoreoPathWaypoint = {
	x: number;
	y: number;
	heading: number;
	isInitialGuess: boolean;
	translationConstrained: boolean;
	headingConstrained: boolean;
	controlIntervalCount: number;
};

export type ChoreoPathTrajectorySample = {
	x: number;
	y: number;
	heading: number;
	angularVelocity: number;
	velocityX: number;
	velocityY: number;
	moduleForcesX: [number, number, number, number];
	moduleForcesY: [number, number, number, number];
	timestamp: number;
};

export type ChoreoPathTrajectoryWaypoint = {
	timestamp: number;
	isStopPoint: boolean;
	x: number;
	y: number;
	heading: number;
	isInitialGuess: boolean;
	translationConstrained: boolean;
	headingConstrained: boolean;
	controlIntervalCount: number;
};

export type ChoreoPathEventMarker = {
	name: string;
	target: number;
	trajTargetIndex: number;
	targetTimestamp: number;
	offset: number;
	command: {
		type: 'named';
		data: {
			name: 'intakeFloor';
		};
	};
};

export type ChoreoPathCircleObstacle = {
	x: number;
	y: number;
	radius: number;
};

export type ChoreoPath = {
	waypoints: ChoreoPathWaypoint[];
	trajectory: ChoreoPathTrajectorySample[];
	trajectoryWaypoints: ChoreoPathTrajectoryWaypoint[];
	constraints: ChoreoPathConstraint[];
	usesControlIntervalGuessing: boolean;
	defaultControlIntervalCount: number;
	usesDefaultFieldObstacles: boolean;
	circleObstacles: ChoreoPathCircleObstacle[];
	eventMarkers: ChoreoPathEventMarker[];
	isTrajectoryStale: boolean;
};

export type ChoreoSettings = {
	version: 'v0.4';
	robotConfiguration: ChoreoRobotConfiguration;
	paths: Record<string, ChoreoPath>;
};

export type ChoreoPathConstraint = {
	scope: Array<number | 'first' | 'last'>;
	type: string;
};

export type ChoreoPathEventMarkerCommand =
	| {
			type: 'named';
			data: {
				name: string;
			};
	  }
	| {
			type: 'sequential';
			data: {
				commands: ChoreoPathEventMarkerCommand[];
			};
	  };
