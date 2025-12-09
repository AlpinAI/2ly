import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { UserRepository } from './user.repository';
import type { DGraphService } from '../services/dgraph.service';
import { DgraphServiceMock } from '../services/dgraph.service.mock';
import { dgraphResolversTypes, LoggerService } from '@skilder-ai/common';
import { LoggerServiceMock } from '@skilder-ai/common/test/vitest';

describe('UserRepository', () => {
    const originalEnv = process.env;
    let dgraphService: DgraphServiceMock;
    let loggerService: LoggerServiceMock;
    let repo: UserRepository;

    beforeAll(() => {
        // Set required environment variables for password hashing
        process.env.ENCRYPTION_KEY = 'test-encryption-key-for-password-validation-32chars';
        process.env.ARGON2_MEMORY = '1024'; // Smaller for faster tests
        process.env.ARGON2_TIME = '1';
        process.env.ARGON2_PARALLELISM = '1';
    });

    afterAll(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    beforeEach(() => {
        dgraphService = new DgraphServiceMock();
        loggerService = new LoggerServiceMock();
        repo = new UserRepository(loggerService as unknown as LoggerService, dgraphService as unknown as DGraphService);
    });

    it('create hashes password and returns first user', async () => {
        // Act
        const user = { id: 'u1', email: 'john', createdAt: '2021-01-01' } as unknown as dgraphResolversTypes.User;
        dgraphService.mutation.mockResolvedValue({ addUser: { user: [user] } });
        const res = await repo.create('john', 'secret');
        // Assert: returns the created user
        expect(res.email).toBe('john');
        // Assert: mutation called with expected variables
        expect(dgraphService.mutation).toHaveBeenCalled();
        const args = dgraphService.mutation.mock.calls[0][1] as { email: string; password: string; now: string };
        expect(args.email).toBe('john');
        // Assert: password was hashed (should not equal the plain input)
        expect(args.password).not.toBe('secret');
        expect(typeof args.now).toBe('string');
    });

    it('addAdminToWorkspace returns updated user', async () => {
        const user = { id: 'u1', email: 'john', workspaces: [{ id: 'w1', role: 'ADMIN' }] } as unknown as dgraphResolversTypes.User;
        dgraphService.mutation.mockResolvedValue({ updateUser: { user: [user] } });
        const result = await repo.addAdminToWorkspace('u1', 'w1');
        expect(result.id).toBe('u1');
        expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), { userId: 'u1', workspaceId: 'w1' });
    });

    it('addMemberToWorkspace returns updated user', async () => {
        const user = { id: 'u1', email: 'john', workspaces: [{ id: 'w1', role: 'MEMBER' }] } as unknown as dgraphResolversTypes.User;
        dgraphService.mutation.mockResolvedValue({ updateUser: { user: [user] } });
        const result = await repo.addMemberToWorkspace('u1', 'w1');
        expect(result.id).toBe('u1');
        expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), { userId: 'u1', workspaceId: 'w1' });
    });

    it('updatePassword hashes password and returns updated user', async () => {
        const user = { id: 'u1', email: 'john', updatedAt: '2021-01-01' } as unknown as dgraphResolversTypes.User;
        dgraphService.mutation.mockResolvedValue({ updateUser: { user: [user] } });
        const result = await repo.updatePassword('u1', 'newsecret');
        expect(result.id).toBe('u1');
        expect(dgraphService.mutation).toHaveBeenCalled();
        const args = dgraphService.mutation.mock.calls[0][1] as { id: string; password: string; now: string };
        expect(args.id).toBe('u1');
        expect(args.password).not.toBe('newsecret');
        expect(typeof args.now).toBe('string');
    });
});
