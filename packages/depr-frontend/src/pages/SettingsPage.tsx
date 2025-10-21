import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_WORKSPACE_MUTATION, SET_DEFAULT_TESTING_RUNTIME_MUTATION, SET_GLOBAL_RUNTIME_MUTATION, UNSET_GLOBAL_RUNTIME_MUTATION, UNSET_DEFAULT_TESTING_RUNTIME_MUTATION } from '../graphql/mutations';
import { useWorkspace } from '../contexts/useWorkspace';
import { useRuntimes } from '../hooks/useRuntimes';

const SettingsPage: React.FC = () => {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspace();
  const [name, setName] = useState(currentWorkspace?.name || '');
  const [globalRuntimeId, setGlobalRuntimeId] = useState(currentWorkspace?.globalRuntime?.id || '');
  const [defaultTestingRuntimeId, setDefaultTestingRuntimeId] = useState(currentWorkspace?.defaultTestingRuntime?.id || '');
  const [updateWorkspace, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_WORKSPACE_MUTATION);
  const [setGlobalRuntime] = useMutation(SET_GLOBAL_RUNTIME_MUTATION);
  const [unsetGlobalRuntime] = useMutation(UNSET_GLOBAL_RUNTIME_MUTATION);
  const [setDefaultTestingRuntime, { loading: runtimeLoading, error: runtimeError }] = useMutation(SET_DEFAULT_TESTING_RUNTIME_MUTATION);
  const [unsetDefaultTestingRuntime] = useMutation(UNSET_DEFAULT_TESTING_RUNTIME_MUTATION);
  const [success, setSuccess] = useState(false);

  // Get runtimes for the dropdown
  const runtimes = useRuntimes(currentWorkspace?.id || '', []);

  if (!currentWorkspace) {
    return <div className="p-8">No workspace selected.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    try {
      // Update workspace name if changed
      if (name !== currentWorkspace.name) {
        const result = await updateWorkspace({ variables: { id: currentWorkspace.id, name } });
        if (result.data?.updateWorkspace) {
          setCurrentWorkspace(result.data.updateWorkspace);
        }
      }

      // Update global runtime if changed
      if (globalRuntimeId !== currentWorkspace.globalRuntime?.id) {
        if (globalRuntimeId) {
          const runtimeResult = await setGlobalRuntime({ variables: { id: currentWorkspace.id, runtimeId: globalRuntimeId } });
          if (runtimeResult.data?.setGlobalRuntime) {
            setCurrentWorkspace(runtimeResult.data.setGlobalRuntime);
          }
        } else {
          const runtimeResult = await unsetGlobalRuntime({ variables: { id: currentWorkspace.id } });
          if (runtimeResult.data?.unsetGlobalRuntime) {
            setCurrentWorkspace(runtimeResult.data.unsetGlobalRuntime);
          }
        }
      }

      // Update default testing runtime if changed
      if (defaultTestingRuntimeId !== currentWorkspace.defaultTestingRuntime?.id) {
        if (defaultTestingRuntimeId) {
          const runtimeResult = await setDefaultTestingRuntime({
            variables: { id: currentWorkspace.id, runtimeId: defaultTestingRuntimeId }
          });
          if (runtimeResult.data?.setDefaultTestingRuntime) {
            setCurrentWorkspace(runtimeResult.data.setDefaultTestingRuntime);
          }
        } else {
          const runtimeResult = await unsetDefaultTestingRuntime({
            variables: { id: currentWorkspace.id }
          });
          if (runtimeResult.data?.unsetDefaultTestingRuntime) {
            setCurrentWorkspace(runtimeResult.data.unsetDefaultTestingRuntime);
          }
        }
      }

      setSuccess(true);
    } catch {
      // error handled by Apollo
    }
  };

  const isLoading = updateLoading || runtimeLoading;
  const hasError = updateError || runtimeError;
  const hasChanges = name !== currentWorkspace.name || defaultTestingRuntimeId !== currentWorkspace.defaultTestingRuntime?.id;

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Workspace Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label htmlFor="workspace-id" className="block text-sm font-medium text-gray-700 mb-1">
            Workspace ID
          </label>
          <input
            id="workspace-id"
            type="text"
            value={currentWorkspace.id}
            disabled
            className="w-full border border-gray-200 bg-gray-100 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700 mb-1">
            Workspace Name
          </label>
          <input
            id="workspace-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <label htmlFor="default-testing-runtime" className="block text-sm font-medium text-gray-700 mb-1">
            Global Runtime
          </label>
          <select
            id="global-runtime"
            value={globalRuntimeId}
            onChange={(e) => setGlobalRuntimeId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
            disabled={isLoading}
          >
            <option value="">Select a runtime</option>
            {runtimes.map((runtime) => (
              <option key={runtime.id} value={runtime.id}>
                {runtime.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="default-testing-runtime" className="block text-sm font-medium text-gray-700 mb-1">
            Default Testing Runtime
          </label>
          <select
            id="default-testing-runtime"
            value={defaultTestingRuntimeId}
            onChange={(e) => setDefaultTestingRuntimeId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
            disabled={isLoading}
          >
            <option value="">Select a runtime</option>
            {runtimes.map((runtime) => (
              <option key={runtime.id} value={runtime.id}>
                {runtime.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
          disabled={isLoading || !hasChanges}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        {success && <div className="text-green-600 text-sm">Workspace settings updated!</div>}
        {hasError && <div className="text-red-600 text-sm">Error updating workspace: {(updateError || runtimeError)?.message}</div>}
      </form>
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Other Settings (coming soon)</h2>
        <ul className="list-disc list-inside text-gray-500">
          <li>Role permissions</li>
          <li>Members & invitations</li>
          <li>Danger zone (delete workspace)</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsPage;
