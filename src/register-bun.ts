import { setActiveRuntime } from './runtime/active.js';
import { runtime as bunRuntime } from './runtime/bun.js';

setActiveRuntime(bunRuntime);
