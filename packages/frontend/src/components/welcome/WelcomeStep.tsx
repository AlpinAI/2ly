import React, { useState } from 'react';
import { client } from '../../services/apollo.client';
import { INIT_SYSTEM_MUTATION } from '../../graphql/mutations';
import { useRequiredWorkspace } from '../../contexts/useRequiredWorkspace';
import Button from '../ui/Button';

interface WelcomeStepProps {
    onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
    const { currentWorkspace } = useRequiredWorkspace();
    const [workspaceName, setWorkspaceName] = useState(currentWorkspace.name);
    const [adminPassword, setAdminPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateWorkspace = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await client.mutate({
                mutation: INIT_SYSTEM_MUTATION,
                variables: {
                    name: workspaceName,
                    adminPassword,
                    email
                },
            });
            onNext();
        } catch {
            setError('Failed to create workspace.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">Welcome to 2LY</h1>
                <p className="text-gray-600">
                    It looks like you are starting with a fresh 2ly instance. Let's set up your first workspace!
                </p>
            </div>

            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateWorkspace();
                }}
            >
                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="workspaceName">
                        Workspace Name
                    </label>
                    <input
                        id="workspaceName"
                        type="text"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="Enter workspace name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="adminPassword">
                        Password
                    </label>
                    <input
                        id="adminPassword"
                        type="password"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Set admin password"
                    />
                </div>

                {error && <div className="text-red-600 text-sm text-center">{error}</div>}

                <Button
                    type="submit"
                    className="w-full"
                    disabled={!workspaceName || !adminPassword || !email || isSubmitting}
                    isLoading={isSubmitting}
                >
                    {isSubmitting ? 'Creating...' : 'Create Workspace'}
                </Button>
            </form>
        </div>
    );
};

export default WelcomeStep;

