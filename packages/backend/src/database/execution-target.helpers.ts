import { GraphQLError } from 'graphql';
import { EXECUTION_TARGET } from '@skilder-ai/common';
import { RuntimeRepository } from '../repositories';

/**
 * Minimal interface for repositories that support runtime linking.
 */
interface RuntimeLinkingRepository<T> {
  linkRuntime(id: string, runtimeId: string): Promise<T>;
  unlinkRuntime(id: string): Promise<T>;
}

/**
 * Interface for repositories that support execution target management.
 */
interface ExecutionTargetRepository<T> extends RuntimeLinkingRepository<T> {
  updateExecutionTarget(id: string, executionTarget: EXECUTION_TARGET): Promise<T>;
}

/**
 * Validates that a runtime belongs to the same workspace as the entity,
 * or is a system runtime.
 *
 * @throws GraphQLError if runtime is not found or belongs to a different workspace
 */
export async function validateRuntimeForWorkspace(
  runtimeRepository: RuntimeRepository,
  runtimeId: string,
  entityWorkspaceId: string,
  entityName: string,
): Promise<void> {
  const runtime = await runtimeRepository.getRuntime(runtimeId);

  if (!runtime?.workspace?.id && !runtime?.system?.id) {
    throw new GraphQLError('Runtime not found', { extensions: { code: 'NOT_FOUND' } });
  }

  if (runtime.workspace?.id && entityWorkspaceId !== runtime.workspace.id) {
    throw new GraphQLError(`${entityName} and Runtime must belong to the same workspace`, {
      extensions: { code: 'BAD_REQUEST' },
    });
  }
}

/**
 * Applies runtime linking/unlinking based on execution target.
 * Use this when executionTarget has already been updated separately.
 *
 * Logic:
 * - If executionTarget is not EDGE, unlink any existing runtime
 * - If executionTarget is EDGE and runtimeId is provided, link to that runtime
 * - If executionTarget is EDGE and no runtimeId, unlink any existing runtime
 */
export async function applyRuntimeLinking<T>(
  repository: RuntimeLinkingRepository<T>,
  id: string,
  executionTarget: EXECUTION_TARGET,
  runtimeId?: string | null,
): Promise<T> {
  if (executionTarget !== 'EDGE') {
    return repository.unlinkRuntime(id);
  }

  if (runtimeId) {
    return repository.linkRuntime(id, runtimeId);
  }

  return repository.unlinkRuntime(id);
}

/**
 * Updates the execution target for an entity and handles runtime linking/unlinking.
 *
 * Logic:
 * - If executionTarget is not EDGE, unlink any existing runtime
 * - If executionTarget is EDGE and runtimeId is provided, link to that runtime
 * - If executionTarget is EDGE and no runtimeId, unlink any existing runtime
 */
export async function updateExecutionTargetWithRuntime<T>(
  repository: ExecutionTargetRepository<T>,
  id: string,
  executionTarget: EXECUTION_TARGET,
  runtimeId?: string | null,
): Promise<T> {
  await repository.updateExecutionTarget(id, executionTarget);
  return applyRuntimeLinking(repository, id, executionTarget, runtimeId);
}
