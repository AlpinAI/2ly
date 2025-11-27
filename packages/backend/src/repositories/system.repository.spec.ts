import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SystemRepository } from './system.repository';
import type { DGraphService } from '../services/dgraph.service';
import { DgraphServiceMock } from '../services/dgraph.service.mock';
import { dgraphResolversTypes, LoggerService } from '@2ly/common';
import { LoggerServiceMock } from '@2ly/common/test/vitest';
import { UserRepository } from './user.repository';
import { Subject } from 'rxjs';
import { IdentityRepository } from './identity.repository';

describe('SystemRepository', () => {
    let dgraphService: DgraphServiceMock;
    let identityRepository: IdentityRepository;
    let userRepository: UserRepository;
    let systemRepository: SystemRepository;
    let loggerService: LoggerServiceMock;

    beforeEach(() => {
        dgraphService = new DgraphServiceMock();
        loggerService = new LoggerServiceMock();
        identityRepository = {
            createKey: vi.fn(),
        } as unknown as IdentityRepository;
        userRepository = {
            create: vi.fn(),
            updatePassword: vi.fn(),
        } as unknown as UserRepository;
        systemRepository = new SystemRepository(
            loggerService as unknown as LoggerService,
            dgraphService as unknown as DGraphService,
            userRepository,
            identityRepository,
        );
    });

    it('createSystem creates admin user and system', async () => {
        const adminUser = { id: 'admin1', email: 'admin' } as unknown as dgraphResolversTypes.User;
        const system = { id: 'sys1', adminId: 'admin1' } as unknown as dgraphResolversTypes.System;

        userRepository.create = vi.fn().mockResolvedValue(adminUser);
        dgraphService.mutation.mockResolvedValue({ addSystem: { system: [system] } });

        const result = await systemRepository.createSystem('system-key');

        expect(userRepository.create).toHaveBeenCalledWith('admin', '123456');
        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({ adminId: 'admin1' })
        );
        expect(result.id).toBe('sys1');
    });

    it('setDefaultWorkspace updates system with workspace', async () => {
        const system = { id: 'sys1' } as unknown as dgraphResolversTypes.System;
        const updatedSystem = { id: 'sys1', defaultWorkspace: { id: 'w1' } } as unknown as dgraphResolversTypes.System;

        dgraphService.query.mockResolvedValue({ querySystem: [system] });
        dgraphService.mutation.mockResolvedValue({ updateSystem: { system: [updatedSystem] } });

        const result = await systemRepository.setDefaultWorkspace('w1');

        expect(dgraphService.query).toHaveBeenCalled();
        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { systemId: 'sys1', workspaceId: 'w1' }
        );
        expect(result.id).toBe('sys1');
    });

    it('getSystem returns first system from query', async () => {
        const system = { id: 'sys1', defaultWorkspace: { id: 'w1' } } as unknown as dgraphResolversTypes.System;
        dgraphService.query.mockResolvedValue({ querySystem: [system] });

        const result = await systemRepository.getSystem();

        expect(dgraphService.query).toHaveBeenCalled();
        expect(result?.id).toBe('sys1');
    });

    it('initSystem initializes system with workspace and admin updates', async () => {
        const system = {
            id: 'sys1',
            initialized: false,
            defaultWorkspace: { id: 'w1' },
            admins: [{ id: 'admin1' }],
        } as unknown as dgraphResolversTypes.System;
        const updatedSystem = { id: 'sys1', initialized: true } as unknown as dgraphResolversTypes.System;

        dgraphService.query.mockResolvedValue({ querySystem: [system] });
        userRepository.updateEmail = vi.fn().mockResolvedValue(undefined);
        userRepository.updatePassword = vi.fn().mockResolvedValue(undefined);
        identityRepository.createKey = vi.fn().mockResolvedValue({ id: 'k1', key: 'SK_test123' });
        dgraphService.mutation.mockResolvedValue({ updateSystem: { system: [updatedSystem] } });

        const result = await systemRepository.initSystem('newpassword', 'user1@2ly.ai');
        expect(userRepository.updateEmail).toHaveBeenCalledWith('admin1', 'user1@2ly.ai');
        expect(userRepository.updatePassword).toHaveBeenCalledWith('admin1', 'newpassword');
        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({ systemId: 'sys1' })
        );
        expect(result.id).toBe('sys1');
    });

    it('initSystem throws error when system already initialized', async () => {
        const system = {
            id: 'sys1',
            initialized: true,
            defaultWorkspace: { id: 'w1' },
            admins: [{ id: 'admin1' }],
        } as unknown as dgraphResolversTypes.System;

        dgraphService.query.mockResolvedValue({ querySystem: [system] });

        await expect(systemRepository.initSystem('newpassword', 'user1@2ly.ai'))
            .rejects.toThrow('Cannot initialize system');
    });

    it('initSystem throws error when no default workspace', async () => {
        const system = {
            id: 'sys1',
            initialized: false,
            defaultWorkspace: null,
            admins: [{ id: 'admin1' }],
        } as unknown as dgraphResolversTypes.System;

        dgraphService.query.mockResolvedValue({ querySystem: [system] });

        await expect(systemRepository.initSystem('newpassword', 'user1@2ly.ai'))
            .rejects.toThrow('Cannot initialize system');
    });

    it('initSystem throws error when no admin user', async () => {
        const system = {
            id: 'sys1',
            initialized: false,
            defaultWorkspace: { id: 'w1' },
            admins: [],
        } as unknown as dgraphResolversTypes.System;

        dgraphService.query.mockResolvedValue({ querySystem: [system] });

        await expect(systemRepository.initSystem('newpassword', 'user1@2ly.ai'))
            .rejects.toThrow('Cannot initialize system');
    });

    it('getDefaultWorkspace returns default workspace from system', async () => {
        const workspace = { id: 'w1', name: 'Default Workspace' } as unknown as dgraphResolversTypes.Workspace;
        const system = { id: 'sys1', defaultWorkspace: workspace } as unknown as dgraphResolversTypes.System;

        dgraphService.query.mockResolvedValue({ querySystem: [system] });

        const result = await systemRepository.getDefaultWorkspace();

        expect(result.id).toBe('w1');
    });

    it('getDefaultWorkspace throws error when no default workspace', async () => {
        const system = { id: 'sys1', defaultWorkspace: null } as unknown as dgraphResolversTypes.System;

        dgraphService.query.mockResolvedValue({ querySystem: [system] });

        await expect(systemRepository.getDefaultWorkspace())
            .rejects.toThrow('Default workspace not found');
    });

    it('observeSystem emits system array', async () => {
        const system = { id: 'sys1' } as unknown as dgraphResolversTypes.System;
        const subject = new Subject<dgraphResolversTypes.System>();
        dgraphService.observe.mockReturnValue(subject.asObservable());

        const results: dgraphResolversTypes.System[][] = [];
        const subscription = systemRepository.observeSystem().subscribe((systems) => results.push(systems));

        subject.next(system);
        expect(results[0][0].id).toBe('sys1');
        subscription.unsubscribe();
    });

    it('observeSystemWithDefaultWorkspace emits system array', async () => {
        const system = { id: 'sys1', defaultWorkspace: { id: 'w1' } } as unknown as dgraphResolversTypes.System;
        const subject = new Subject<dgraphResolversTypes.System>();
        dgraphService.observe.mockReturnValue(subject.asObservable());

        const results: dgraphResolversTypes.System[][] = [];
        const subscription = systemRepository.observeSystemWithDefaultWorkspace().subscribe((systems) => results.push(systems));

        subject.next(system);
        expect(results[0][0].id).toBe('sys1');
        subscription.unsubscribe();
    });
});
