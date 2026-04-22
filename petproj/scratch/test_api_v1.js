const http = require('http');

const ENDPOINTS = [
    '/api/v1/pets',
    '/api/v1/cities',
    '/api/v1/bazaar/categories',
    '/api/v1/bazaar/products',
    '/api/v1/vets',
    '/api/v1/lost-and-found'
];

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(path) {
    return new Promise((resolve) => {
        const start = Date.now();
        http.get(`${BASE_URL}${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const duration = Date.now() - start;
                try {
                    const json = JSON.parse(data);
                    const isArray = Array.isArray(json);
                    const count = isArray ? json.length : 'N/A';
                    
                    // Security check: ensure no passwords or sensitive tokens are in public JSON
                    const sensitiveFound = data.toLowerCase().includes('password') || data.toLowerCase().includes('hash');

                    resolve({
                        path,
                        status: res.statusCode,
                        duration: `${duration}ms`,
                        count,
                        security: sensitiveFound ? '❌ SENSITIVE DATA LEAKED' : '✅ SECURE',
                        type: typeof json
                    });
                } catch (e) {
                    resolve({ path, status: res.statusCode, duration: `${duration}ms`, error: 'Invalid JSON' });
                }
            });
        }).on('error', (e) => {
            resolve({ path, error: e.message });
        });
    });
}

async function runTests() {
    console.log('🚀 Starting V1 API Smoke Tests...\n');
    console.log('--------------------------------------------------------------------------------');
    console.log('PATH                     | STATUS | LATENCY | COUNT | SECURITY | TYPE');
    console.log('--------------------------------------------------------------------------------');
    
    for (const path of ENDPOINTS) {
        const result = await testEndpoint(path);
        const pathPad = path.padEnd(24);
        const statusPad = String(result.status || 'ERR').padEnd(6);
        const latencyPad = (result.duration || 'N/A').padEnd(7);
        const countPad = String(result.count).padEnd(5);
        const securityPad = (result.security || 'N/A').padEnd(10);
        
        console.log(`${pathPad} | ${statusPad} | ${latencyPad} | ${countPad} | ${securityPad} | ${result.type || 'N/A'}`);
    }
    console.log('--------------------------------------------------------------------------------');
    console.log('\n✅ Testing Complete.');
}

runTests();
