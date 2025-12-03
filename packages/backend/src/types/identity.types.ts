import { dgraphResolversTypes } from '@2ly/common';

/**
 * Metadata about a connected runtime or skill instance.
 * Includes process identification and network location information.
 */
export interface ConnectionMetadata {
  /** Process ID of the connected instance */
  pid: string;
  /** IP address of the host machine */
  hostIP: string;
  /** Hostname of the connected instance */
  hostname: string;
}

/**
 * Identity information passed when a runtime completes handshake.
 * Contains the runtime instance from the database along with connection metadata.
 */
export interface RuntimeHandshakeIdentity extends ConnectionMetadata {
  /** The runtime instance record from Dgraph */
  instance: dgraphResolversTypes.Runtime;
}

/**
 * Identity information passed when a skill completes handshake.
 * Contains the skill instance from the database along with connection metadata.
 */
export interface SkillHandshakeIdentity extends ConnectionMetadata {
  /** The skill instance record from Dgraph */
  instance: dgraphResolversTypes.Skill;
}

/**
 * Callback function invoked when a runtime successfully completes handshake.
 * Registered via `IdentityService.onHandshake()` and called with the runtime's identity information.
 */
export type HandshakeRuntimeCallback = (identity: RuntimeHandshakeIdentity) => void;

/**
 * Callback function invoked when a skill successfully completes handshake.
 * Registered via `IdentityService.onHandshake()` and called with the skill's identity information.
 */
export type HandshakeSkillCallback = (identity: SkillHandshakeIdentity) => void;
