import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceRepository } from './workspace.repository';
import { Subject, of } from 'rxjs';
import type { DGraphService } from '../services/dgraph.service';
import { DgraphServiceMock } from '../services/dgraph.service.mock';
import { apolloResolversTypes, LoggerService } from '@2ly/common';
import { LoggerServiceMock } from '@2ly/common/test/vitest';
import type { IdentityRepository } from './identity.repository';
import type { SystemRepository } from './system.repository';

describe('WorkspaceRepository', () => {
    let dgraph: DgraphServiceMock;
    let loggerService: LoggerServiceMock;
    let identityRepo: IdentityRepository;
    let systemRepo: SystemRepository;
    let repo: WorkspaceRepository;

    beforeEach(() => {
        dgraph = new DgraphServiceMock();
        loggerService = new LoggerServiceMock();
        identityRepo = {} as unknown as IdentityRepository;
        systemRepo = {
            observeRuntimes: vi.fn().mockReturnValue(of([])),
        } as unknown as SystemRepository;
        repo = new WorkspaceRepository(loggerService as unknown as LoggerService, dgraph as unknown as DGraphService, identityRepo, systemRepo);
    });

    it('create throws error when system not found', async () => {
        dgraph.query.mockResolvedValue({ querySystem: [] });
        await expect(repo.create('W', 'admin1')).rejects.toThrow('System not found');
        expect(dgraph.query).toHaveBeenCalled();
        expect(dgraph.mutation).not.toHaveBeenCalled();
    });

    it('findAll returns user admin workspaces', async () => {
        dgraph.query.mockResolvedValue({
            getUser: {
                adminOfWorkspaces: [{ id: 'w1' }, { id: 'w3' }]
            }
        });
        const result = await repo.findAll('user123');
        expect(result.map((w) => w.id)).toEqual(['w1', 'w3']);
    });

    it('findById returns workspace by id', async () => {
        dgraph.query.mockResolvedValue({ getWorkspace: { id: 'w1' } });
        const result = await repo.findById('w1');
        expect(result.id).toBe('w1');
    });

    it('update returns updated workspace', async () => {
        const updated: apolloResolversTypes.Workspace = { id: 'w1', name: 'NW' } as unknown as apolloResolversTypes.Workspace;
        dgraph.mutation.mockResolvedValue({ updateWorkspace: { workspace: [updated] } });
        const result = await repo.update('w1', 'NW');
        expect(result.name).toBe('NW');
    });

    it('observeRuntimes maps to runtimes array with fallback', async () => {
        const subj = new Subject<apolloResolversTypes.Workspace>();
        dgraph.observe.mockReturnValue(subj.asObservable());
        const results: apolloResolversTypes.Runtime[][] = [];
        const sub = repo.observeRuntimes('w1').subscribe((r) => results.push(r));
        subj.next({ id: 'w1', name: 'W', runtimes: [{ id: 'r1' } as unknown as apolloResolversTypes.Runtime] } as unknown as apolloResolversTypes.Workspace);
        subj.next({ id: 'w1', name: 'W' } as unknown as apolloResolversTypes.Workspace);
        expect(results[0][0].id).toBe('r1');
        expect(results[1]).toEqual([]);
        sub.unsubscribe();
    });

    it('observeMCPServers maps to servers array with fallback', async () => {
        const subj = new Subject<apolloResolversTypes.Workspace>();
        dgraph.observe.mockReturnValue(subj.asObservable());
        const results: apolloResolversTypes.McpServer[][] = [];
        const sub = repo.observeMCPServers('w1').subscribe((r) => results.push(r));
        subj.next({ id: 'w1', name: 'W', mcpServers: [{ id: 's1' } as unknown as apolloResolversTypes.McpServer] } as unknown as apolloResolversTypes.Workspace);
        subj.next({ id: 'w1', name: 'W' } as unknown as apolloResolversTypes.Workspace);
        expect(results[0][0].id).toBe('s1');
        expect(results[1]).toEqual([]);
        sub.unsubscribe();
    });

    it('observeMCPTools maps to tools array with fallback', async () => {
        const subj = new Subject<apolloResolversTypes.Workspace>();
        dgraph.observe.mockReturnValue(subj.asObservable());
        const results: apolloResolversTypes.McpTool[][] = [];
        const sub = repo.observeMCPTools('w1').subscribe((r) => results.push(r));
        subj.next({ id: 'w1', name: 'W', mcpTools: [{ id: 't1' } as unknown as apolloResolversTypes.McpTool] } as unknown as apolloResolversTypes.Workspace);
        subj.next({ id: 'w1', name: 'W' } as unknown as apolloResolversTypes.Workspace);
        expect(results[0][0].id).toBe('t1');
        expect(results[1]).toEqual([]);
        sub.unsubscribe();
    });

    it('observeWorkspaces emits user admin workspaces', async () => {
        const subj = new Subject<{ adminOfWorkspaces: apolloResolversTypes.Workspace[] }>();
        dgraph.observe.mockReturnValue(subj.asObservable());
        const results: apolloResolversTypes.Workspace[][] = [];
        const sub = repo.observeWorkspaces('user123').subscribe((r) => results.push(r));
        subj.next({
            adminOfWorkspaces: [
                { id: 'w1' } as unknown as apolloResolversTypes.Workspace,
                { id: 'w3' } as unknown as apolloResolversTypes.Workspace
            ]
        });
        expect(results[0].map((w) => w.id)).toEqual(['w1', 'w3']);
        sub.unsubscribe();
    });

    describe('hasUserAccess', () => {
        it('returns true when user is admin of workspace', async () => {
            dgraph.query.mockResolvedValue({
                getUser: {
                    id: 'user1',
                    adminOfWorkspaces: [{ id: 'w1' }],
                    membersOfWorkspaces: []
                }
            });
            const result = await repo.hasUserAccess('user1', 'w1');
            expect(result).toBe(true);
        });

        it('returns true when user is member of workspace', async () => {
            dgraph.query.mockResolvedValue({
                getUser: {
                    id: 'user1',
                    adminOfWorkspaces: [],
                    membersOfWorkspaces: [{ id: 'w1' }]
                }
            });
            const result = await repo.hasUserAccess('user1', 'w1');
            expect(result).toBe(true);
        });

        it('returns true when user is both admin and member', async () => {
            dgraph.query.mockResolvedValue({
                getUser: {
                    id: 'user1',
                    adminOfWorkspaces: [{ id: 'w1' }],
                    membersOfWorkspaces: [{ id: 'w1' }]
                }
            });
            const result = await repo.hasUserAccess('user1', 'w1');
            expect(result).toBe(true);
        });

        it('returns false when user has no access to workspace', async () => {
            dgraph.query.mockResolvedValue({
                getUser: {
                    id: 'user1',
                    adminOfWorkspaces: [],
                    membersOfWorkspaces: []
                }
            });
            const result = await repo.hasUserAccess('user1', 'w1');
            expect(result).toBe(false);
        });

        it('returns false when user does not exist', async () => {
            dgraph.query.mockResolvedValue({
                getUser: null
            });
            const result = await repo.hasUserAccess('nonexistent', 'w1');
            expect(result).toBe(false);
        });

        it('handles undefined adminOfWorkspaces gracefully', async () => {
            dgraph.query.mockResolvedValue({
                getUser: {
                    id: 'user1',
                    adminOfWorkspaces: undefined,
                    membersOfWorkspaces: [{ id: 'w1' }]
                }
            });
            const result = await repo.hasUserAccess('user1', 'w1');
            expect(result).toBe(true);
        });

        it('handles undefined membersOfWorkspaces gracefully', async () => {
            dgraph.query.mockResolvedValue({
                getUser: {
                    id: 'user1',
                    adminOfWorkspaces: [{ id: 'w1' }],
                    membersOfWorkspaces: undefined
                }
            });
            const result = await repo.hasUserAccess('user1', 'w1');
            expect(result).toBe(true);
        });
    });
});
