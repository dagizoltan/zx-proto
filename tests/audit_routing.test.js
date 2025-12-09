
import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { createServer } from '../src/adapters/http/server.js';
import { adminNavigation } from '../src/adapters/http/shared/navigation/admin-nav.config.js';

// Mock Infrastucture
const createMockContext = () => {
    return {
        get: (name) => {
            if (name === 'infra.obs') {
                return {
                    metric: () => {},
                    info: () => {},
                    error: () => {},
                };
            }
             if (name === 'infra.security') {
                return {
                     verifyToken: () => ({ userId: 'test-user', roleNames: ['admin'] }), // Simulate Admin
                };
            }
            if (name === 'infra.persistence') {
                return {
                    users: { findById: () => ({ id: 'test-user', roles: ['admin'] }) },
                    roles: { findByIds: () => ([{ id: 'admin', name: 'admin' }]) }
                }
            }
            return {}; // Fallback
        },
        list: () => [],
        config: {
            get: () => 'test',
             environment: 'test'
        }
    };
};

Deno.test("Routing Audit: Navigation Links vs HTTP Response", async (t) => {
    // 1. Setup Server (Mocked)
    const ctx = createMockContext();
    const server = createServer(ctx);

    // 2. Extract all hrefs from navigation config
    const routesToTest = [];
    for (const section of adminNavigation.sections) {
        for (const item of section.items) {
            if (!item.disabled && item.href.startsWith('/ims')) { // Only test active admin routes
                routesToTest.push({ label: item.label, href: item.href });
            }
        }
    }

    // 3. Test each route
    for (const route of routesToTest) {
        await t.step(`GET ${route.href} (${route.label})`, async () => {
            const res = await server.request(route.href, {
                headers: {
                    'host': 'test.localhost',
                    'cookie': 'auth_token=valid_mock_token'
                }
            });

            // We expect 500 (Internal Server Error) because we haven't mocked the specific handlers
            // But we DO NOT expect 404 (Not Found).
            if (res.status === 404) {
                 console.log(`❌ BROKEN LINK: ${route.href} -> 404 Not Found`);
            } else {
                 console.log(`✅ MATCHED: ${route.href} -> ${res.status}`);
            }

            assertEquals(res.status !== 404, true, `Route ${route.href} should exist`);
        });
    }
});
