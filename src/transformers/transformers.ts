import { ChoreoTransformerGroup } from './choreo/choreo-transformer-group.js';
import { PathPlannerTransformerGroup } from './path-planner/path-planner-transformer-group.js';

export const choreoTransformer = new ChoreoTransformerGroup();
export const pathPlannerTransformer = new PathPlannerTransformerGroup();
