/**
 * KERI Graph Package
 *
 * Self-contained graph generation from KERI data structures.
 * Converts KEL/TEL events to various graph formats (Mermaid, DOT, etc.)
 */

export { KeriGitGraph, createKeriGitGraph } from './keri-git-graph';
export type { GitCommit, GitBranch, KeriGitGraphOptions } from './keri-git-graph';
