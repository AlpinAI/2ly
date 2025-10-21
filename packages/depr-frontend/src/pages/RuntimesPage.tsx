import React, { useState } from 'react';
import { Search, Plus, Filter, Grid, List, X } from 'lucide-react';
import Button from '../components/ui/Button';
import { client } from '../services/apollo.client';
import { gql } from '@apollo/client/core';
import { useRequiredWorkspace } from '../contexts/useRequiredWorkspace';
import { useRuntimes } from '../hooks/useRuntimes';
import RuntimeCard from '../components/dashboard/RuntimeCard';

const CREATE_RUNTIME_MUTATION = gql`
  mutation CreateRuntime($name: String!, $description: String!, $workspaceId: ID!) {
    createRuntime(name: $name, description: $description, workspaceId: $workspaceId) {
      id
      name
      description
      status
      createdAt
      lastSeenAt
    }
  }
`;

interface AddRuntimeFormData {
  name: string;
  description: string;
}


const RuntimesPage: React.FC = () => {
  const { currentWorkspace } = useRequiredWorkspace();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const runtimes = useRuntimes(currentWorkspace.id);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<AddRuntimeFormData>({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await client.mutate({
        mutation: CREATE_RUNTIME_MUTATION,
        variables: {
          ...formData,
          workspaceId: currentWorkspace.id,
        },
      });

      setShowAddDialog(false);
      setFormData({
        name: '',
        description: '',
      });
    } catch (error) {
      console.error('Error creating runtime:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AddRuntimeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const filteredRuntimes = runtimes.filter(
    (runtime) =>
      runtime.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (runtime.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false),
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Runtimes</h1>
            <p className="text-gray-500">Manage and monitor your tool runtimes.</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddDialog(true)}>
            New Runtime
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search runtimes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />} style={{ display: 'none' }}>
              Filter
            </Button>
            <div className="flex rounded-md border border-gray-300 bg-white">
              <button
                className={`flex h-10 w-10 items-center justify-center rounded-l-md ${view === 'grid' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-800'
                  }`}
                onClick={() => setView('grid')}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                className={`flex h-10 w-10 items-center justify-center rounded-r-md ${view === 'list' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-800'
                  }`}
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {filteredRuntimes.length > 0 ? (
          <div className={view === 'grid' ? 'grid gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3' : 'space-y-4'}>
            {filteredRuntimes.map((runtime) => (
              <RuntimeCard key={runtime.id} runtime={runtime} className={view === 'list' ? 'max-w-none' : ''} />
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="mb-2 text-lg font-medium">No runtimes found</p>
            <p className="mb-4 text-gray-500">Try adjusting your search or filters.</p>
            <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddDialog(true)}>
              Create New Runtime
            </Button>
          </div>
        )}
      </div>

      {/* Add Runtime Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add New Runtime</h2>
              <button onClick={() => setShowAddDialog(false)} className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Runtime'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default RuntimesPage;
