import { describe, it, expect } from 'vitest';
import { WorkspaceRepository } from './workspace.repository';
import { Subject } from 'rxjs';
import type { DGraphService } from '../services/dgraph.service';
import { DgraphServiceMock } from '../services/dgraph.service.mock';
import type { apolloResolversTypes } from '@2ly/common';
import type { IdentityRepository } from './identity.repository';

describe('WorkspaceRepository', () => {
    it('create throws error when system not found', async () => {
        const dgraph = new DgraphServiceMock();
        dgraph.query.mockResolvedValue({ querySystem: [] });
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        await expect(repo.create('W', 'admin1')).rejects.toThrow('System not found');
        expect(dgraph.query).toHaveBeenCalled();
        expect(dgraph.mutation).not.toHaveBeenCalled();
    });

    it('findAll returns workspaces from query without userId', async () => {
        const dgraph = new DgraphServiceMock();
        dgraph.query.mockResolvedValue({ queryWorkspace: [{ id: 'w1' }, { id: 'w2' }] });
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        const result = await repo.findAll();
        expect(result.map((w) => w.id)).toEqual(['w1', 'w2']);
    });

    it('findAll returns user admin workspaces when userId provided', async () => {
        const dgraph = new DgraphServiceMock();
        dgraph.query.mockResolvedValue({
            getUser: {
                adminOfWorkspaces: [{ id: 'w1' }, { id: 'w3' }]
            }
        });
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        const result = await repo.findAll('user123');
        expect(result.map((w) => w.id)).toEqual(['w1', 'w3']);
    });

    it('findById returns workspace by id', async () => {
        const dgraph = new DgraphServiceMock();
        dgraph.query.mockResolvedValue({ getWorkspace: { id: 'w1' } });
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        const result = await repo.findById('w1');
        expect(result.id).toBe('w1');
    });

    it('update returns updated workspace', async () => {
        const dgraph = new DgraphServiceMock();
        const updated: apolloResolversTypes.Workspace = { id: 'w1', name: 'NW' } as unknown as apolloResolversTypes.Workspace;
        dgraph.mutation.mockResolvedValue({ updateWorkspace: { workspace: [updated] } });
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        const result = await repo.update('w1', 'NW');
        expect(result.name).toBe('NW');
    });

    it('setGlobalRuntime sets workspace when runtime has workspace', async () => {
        const dgraph = new DgraphServiceMock();
        dgraph.query.mockResolvedValue({ getRuntime: { workspace: { id: 'w1' } } });
        dgraph.mutation.mockResolvedValue({ updateWorkspace: { workspace: [{ id: 'w1' }] } });
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        await repo.setGlobalRuntime('r1');
        expect(dgraph.mutation).toHaveBeenCalled();
    });

    it('setGlobalRuntime throws when runtime has no workspace', async () => {
        const dgraph = new DgraphServiceMock();
        dgraph.query.mockResolvedValue({ getRuntime: { workspace: null } });
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        await expect(repo.setGlobalRuntime('r1')).rejects.toThrow('Runtime is not linked to a workspace');
    });

    it('unsetGlobalRuntime calls mutation', async () => {
        const dgraph = new DgraphServiceMock();
        dgraph.mutation.mockResolvedValue({ updateWorkspace: { workspace: [{ id: 'w1' }] } });
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        await repo.unsetGlobalRuntime('w1');
        expect(dgraph.mutation).toHaveBeenCalled();
    });

    it('observeRuntimes maps to runtimes array with fallback', async () => {
        const dgraph = new DgraphServiceMock();
        const subj = new Subject<apolloResolversTypes.Workspace>();
        dgraph.observe.mockReturnValue(subj.asObservable());
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        const results: apolloResolversTypes.Runtime[][] = [];
        const sub = repo.observeRuntimes('w1').subscribe((r) => results.push(r));
        subj.next({ id: 'w1', name: 'W', runtimes: [{ id: 'r1' } as unknown as apolloResolversTypes.Runtime] } as unknown as apolloResolversTypes.Workspace);
        subj.next({ id: 'w1', name: 'W' } as unknown as apolloResolversTypes.Workspace);
        expect(results[0][0].id).toBe('r1');
        expect(results[1]).toEqual([]);
        sub.unsubscribe();
    });

    it('observeMCPServers maps to servers array with fallback', async () => {
        const dgraph = new DgraphServiceMock();
        const subj = new Subject<apolloResolversTypes.Workspace>();
        dgraph.observe.mockReturnValue(subj.asObservable());
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        const results: apolloResolversTypes.McpServer[][] = [];
        const sub = repo.observeMCPServers('w1').subscribe((r) => results.push(r));
        subj.next({ id: 'w1', name: 'W', mcpServers: [{ id: 's1' } as unknown as apolloResolversTypes.McpServer] } as unknown as apolloResolversTypes.Workspace);
        subj.next({ id: 'w1', name: 'W' } as unknown as apolloResolversTypes.Workspace);
        expect(results[0][0].id).toBe('s1');
        expect(results[1]).toEqual([]);
        sub.unsubscribe();
    });

    it('observeMCPTools maps to tools array with fallback', async () => {
        const dgraph = new DgraphServiceMock();
        const subj = new Subject<apolloResolversTypes.Workspace>();
        dgraph.observe.mockReturnValue(subj.asObservable());
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        const results: apolloResolversTypes.McpTool[][] = [];
        const sub = repo.observeMCPTools('w1').subscribe((r) => results.push(r));
        subj.next({ id: 'w1', name: 'W', mcpTools: [{ id: 't1' } as unknown as apolloResolversTypes.McpTool] } as unknown as apolloResolversTypes.Workspace);
        subj.next({ id: 'w1', name: 'W' } as unknown as apolloResolversTypes.Workspace);
        expect(results[0][0].id).toBe('t1');
        expect(results[1]).toEqual([]);
        sub.unsubscribe();
    });

    it('observeWorkspaces emits list of workspaces', async () => {
        const dgraph = new DgraphServiceMock();
        const subj = new Subject<apolloResolversTypes.Workspace[]>();
        dgraph.observe.mockReturnValue(subj.asObservable());
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
        const results: apolloResolversTypes.Workspace[][] = [];
        const sub = repo.observeWorkspaces().subscribe((r) => results.push(r));
        subj.next([{ id: 'w1' } as unknown as apolloResolversTypes.Workspace]);
        expect(results[0][0].id).toBe('w1');
        sub.unsubscribe();
    });

    it('observeWorkspaces emits user admin workspaces when userId provided', async () => {
        const dgraph = new DgraphServiceMock();
        const subj = new Subject<{ adminOfWorkspaces: apolloResolversTypes.Workspace[] }>();
        dgraph.observe.mockReturnValue(subj.asObservable());
        const identityRepo = {} as unknown as IdentityRepository;
        const repo = new WorkspaceRepository(dgraph as unknown as DGraphService, identityRepo);
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
});
