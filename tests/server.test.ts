import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

process.env.NODE_ENV = 'test';

// Mocks must be hoisted before imports
vi.mock('firebase-admin', () => {
  return {
    apps: ['mock-app'],
    auth: vi.fn(),
    firestore: vi.fn()
  };
});

import * as admin from 'firebase-admin';
import { app } from '../server.js';

describe('Server API Security', () => {
  let mockVerifyIdToken: any;
  let mockDocGet: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockVerifyIdToken = vi.fn();
    mockDocGet = vi.fn();

    // Setup Auth mock
    const authInstance = {
      verifyIdToken: mockVerifyIdToken,
      deleteUser: vi.fn(),
      updateUser: vi.fn(),
    };
    (admin as any).auth.mockReturnValue(authInstance);

    // Setup Firestore mock
    const firestoreInstance = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: mockDocGet,
          delete: vi.fn()
        })
      })
    };
    (admin as any).firestore.mockReturnValue(firestoreInstance);
  });

  describe('POST /api/admin/delete-user', () => {
    it('returns 401 when missing Authorization header', async () => {
      const response = await request(app)
        .post('/api/admin/delete-user')
        .send({ uid: 'target-uid' });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/Missing or invalid/);
    });

    it('returns 401 when token is invalid', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));
      
      const response = await request(app)
        .post('/api/admin/delete-user')
        .set('Authorization', 'Bearer invalid-token')
        .send({ uid: 'target-uid' });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized: Invalid token');
    });

    it('returns 401 when token is expired', async () => {
      const expiredError = new Error('Expired');
      (expiredError as any).code = 'auth/id-token-expired';
      mockVerifyIdToken.mockRejectedValue(expiredError);
      
      const response = await request(app)
        .post('/api/admin/delete-user')
        .set('Authorization', 'Bearer expired-token')
        .send({ uid: 'target-uid' });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized: Token expired');
    });

    it('returns 403 when user is non-admin (e.g. staff)', async () => {
      mockVerifyIdToken.mockResolvedValue({ uid: 'staff-uid', email: 'staff@test.com' });
      mockDocGet.mockResolvedValue({ data: () => ({ role: 'staff' }) });
      
      const response = await request(app)
        .post('/api/admin/delete-user')
        .set('Authorization', 'Bearer valid-staff-token')
        .send({ uid: 'target-uid' });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden: Admin access required');
    });

    it('allows successful deletion by superadmin (email check)', async () => {
      mockVerifyIdToken.mockResolvedValue({ uid: 'superadmin-uid', email: 'yassinegr44@gmail.com' });
      mockDocGet.mockResolvedValue({ data: () => ({ role: 'agent' }) }); // Role doesn't matter for superadmin
      
      const response = await request(app)
        .post('/api/admin/delete-user')
        .set('Authorization', 'Bearer superadmin-token')
        .send({ uid: 'target-uid' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('allows successful deletion by admin (Firestore role check)', async () => {
      mockVerifyIdToken.mockResolvedValue({ uid: 'admin-uid', email: 'admin@test.com' });
      mockDocGet.mockResolvedValue({ data: () => ({ role: 'admin' }) });
      
      const response = await request(app)
        .post('/api/admin/delete-user')
        .set('Authorization', 'Bearer admin-token')
        .send({ uid: 'target-uid' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('prevents client impersonation (trying to pass admin role in body)', async () => {
      mockVerifyIdToken.mockResolvedValue({ uid: 'attacker-uid', email: 'attacker@test.com' });
      mockDocGet.mockResolvedValue({ data: () => ({ role: 'staff' }) });
      
      const response = await request(app)
        .post('/api/admin/delete-user')
        .set('Authorization', 'Bearer attacker-token')
        .send({ uid: 'target-uid', role: 'admin' }); // Client attempting to fake role
      
      expect(response.status).toBe(403);
    });
  });
});
