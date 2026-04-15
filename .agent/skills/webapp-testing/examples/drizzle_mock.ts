// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';
import { master_fungsi, roles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Example: Testing Drizzle ORM queries using Transactions that rollback automatically
describe('Drizzle ORM Queries', () => {
    
    it('should insert and fetch a master_fungsi record safely', async () => {
        // ALWAYS use a transaction for tests to avoid polluting the development DB
        await db.transaction(async (tx) => {
            // 1. Arrange: Insert test data using typed queries (NO RAW SQL)
            const [newFungsi] = await tx.insert(master_fungsi).values({
                nama: 'Fungsi Test ' + Date.now(),
                deskripsi: 'Deskripsi untuk testing'
            }).returning();

            // 2. Act: Fetch the data we just inserted
            const fetched = await tx.query.master_fungsi.findFirst({
                where: eq(master_fungsi.id, newFungsi.id)
            });

            // 3. Assert
            expect(fetched).toBeDefined();
            expect(fetched?.nama).toBe(newFungsi.nama);

            // 4. Teardown: THROW to trigger automatic rollback in Drizzle transaction!
            // This ensures the database state is never mutated permanently by the test.
            tx.rollback();
        }).catch((e) => {
            // Expected rollback error, ignore it. If it's a different error, fail the test.
            if (e.message !== 'Rollback') throw e;
        });
    });
});
