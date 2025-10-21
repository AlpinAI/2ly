import { useEffect, useState } from 'react';
import { apolloResolversTypes } from '@2ly/common';
import { observe } from '../services/apollo.client';
import { RUNTIMES_SUBSCRIPTION } from '../graphql';

export function useRuntimes(workspaceId: string, requiredCapabilities: string[] = []): apolloResolversTypes.Runtime[] {
    const [runtimes, setRuntimes] = useState<apolloResolversTypes.Runtime[]>([]);

    useEffect(() => {
        if (!workspaceId) return;

        const subscription = observe<{ runtimes: apolloResolversTypes.Runtime[] }>({
            query: RUNTIMES_SUBSCRIPTION,
            variables: { workspaceId },
        });

        const subscription$ = subscription.subscribe({
            next: (data) => {
                if (data.runtimes) {
                    setRuntimes(data.runtimes);
                }
            },
            error: (error) => {
                console.error('Runtimes subscription error:', error);
            },
        });

        return () => {
            subscription$.unsubscribe();
        };
    }, [workspaceId]);

    return runtimes.filter((runtime) => requiredCapabilities.length === 0 || (runtime.capabilities && requiredCapabilities.every((capability) => (runtime.capabilities ?? []).includes(capability))));
}
