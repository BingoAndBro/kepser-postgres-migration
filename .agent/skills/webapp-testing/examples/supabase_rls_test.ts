// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase admin client for creating test users and local client for testing RLS
const supabaseAdmin = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS for test setup
);

const supabaseSupa = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.PUBLIC_SUPABASE_ANON_KEY!
);

describe('Supabase Row Level Security (RLS)', () => {
    let testUser: any;

    beforeAll(async () => {
        // Create an anonymous/pegawai user
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: 'pegawai_test@bps.go.id',
            password: 'password123',
            email_confirm: true,
        });
        if (error) throw error;
        testUser = data.user;
        
        // Log in as the user
        await supabaseSupa.auth.signInWithPassword({
            email: 'pegawai_test@bps.go.id',
            password: 'password123',
        });
    });

    afterAll(async () => {
        // Cleanup test user
        if (testUser) {
            await supabaseAdmin.auth.admin.deleteUser(testUser.id);
        }
    });

    it('should NOT allow PEGAWAI to update FSM status directly', async () => {
        // Attempt to update status in dokumen_transaksi directly instead of via fsm.ts
        // RLS POLICY MUST BLOCK THIS.
        const { error } = await supabaseSupa
            .from('dokumen_transaksi')
            .update({ status: 'COMPLETED' })
            .eq('created_by', testUser.id);

        // We EXPECT an error or for the update to fail (zero rows updated) based on RLS
        expect(error).not.toBeNull();
        // The error should be related to violating Row Level Security
        expect(error?.code).toBe('42501'); // 42501 is Postgres Insufficient Privilege
    });
});
