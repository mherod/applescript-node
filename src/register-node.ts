import { setActiveRuntime } from './runtime/active.js';
import { runtime as nodeRuntime } from './runtime/node.js';

setActiveRuntime(nodeRuntime);
