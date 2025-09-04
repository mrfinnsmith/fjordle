#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const http = require('http');

async function waitForServer(url, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(url, (res) => {
                    if (res.statusCode === 200) {
                        resolve(true);
                    } else {
                        reject(new Error(`Status ${res.statusCode}`));
                    }
                });
                req.on('error', reject);
                req.setTimeout(1000, () => {
                    req.destroy();
                    reject(new Error('Timeout'));
                });
            });
            return true;
        } catch (error) {
            // Server not ready yet
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Server failed to start within 30 seconds');
}

async function runPerformanceTest() {
    console.log('🚀 Starting performance test...\n');

    // Step 1: Build the application
    console.log('📦 Building application...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Build completed successfully\n');
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }

    // Step 2: Check if server is already running
    console.log('🌐 Checking for existing server...');
    try {
        execSync('lsof -i :3000', { stdio: 'pipe' });
        console.log('⚠️  Server already running on port 3000, checking if ready...');
        await waitForServer('http://localhost:3000');
        console.log('✅ Existing server is ready\n');
    } catch (error) {
        // No server running, start one
        console.log('🌐 Starting production server...');
        try {
            serverProcess = spawn('npm', ['run', 'start'], {
                stdio: 'pipe',
                detached: false
            });

            // Wait for server to actually respond
            await waitForServer('http://localhost:3000');
            console.log('✅ Production server started\n');
        } catch (error) {
            console.error('❌ Failed to start server:', error.message);
            process.exit(1);
        }
    }

    // Step 3: Run Lighthouse
    console.log('🔍 Running Lighthouse audit...');
    try {
        const lighthouseCommand = 'npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html --chrome-flags="--headless" --quiet';
        execSync(lighthouseCommand, { stdio: 'inherit' });
        console.log('✅ Lighthouse audit completed\n');
    } catch (error) {
        console.error('❌ Lighthouse audit failed:', error.message);
    }

    // Extract and display scores from HTML report
    try {
        const fs = require('fs');
        const html = fs.readFileSync('./lighthouse-report.html', 'utf8');

        // Look for the actual categories scores in the JSON structure
        let performanceScore = 'N/A';
        let accessibilityScore = 'N/A';
        let bestPracticesScore = 'N/A';
        let seoScore = 'N/A';

        // Try to find the categories object with specific category names
        const performanceMatch = html.match(/"performance"[^}]*"score":(0\.\d+|1)/);
        if (performanceMatch) {
            performanceScore = Math.round(parseFloat(performanceMatch[1]) * 100);
        }

        const accessibilityMatch = html.match(/"accessibility"[^}]*"score":(0\.\d+|1)/);
        if (accessibilityMatch) {
            accessibilityScore = Math.round(parseFloat(accessibilityMatch[1]) * 100);
        }

        const bestPracticesMatch = html.match(/"best-practices"[^}]*"score":(0\.\d+|1)/);
        if (bestPracticesMatch) {
            bestPracticesScore = Math.round(parseFloat(bestPracticesMatch[1]) * 100);
        }

        const seoMatch = html.match(/"seo"[^}]*"score":(0\.\d+|1)/);
        if (seoMatch) {
            seoScore = Math.round(parseFloat(seoMatch[1]) * 100);
        }

        console.log('\n📊 Lighthouse Scores:');
        console.log(`   Performance: ${performanceScore}/100`);
        console.log(`   Accessibility: ${accessibilityScore}/100`);
        console.log(`   Best Practices: ${bestPracticesScore}/100`);
        console.log(`   SEO: ${seoScore}/100`);
        console.log('');
    } catch (error) {
        console.log('❌ Could not extract scores from report');
    }

    console.log('🌐 Production server is running at http://localhost:3000');
    console.log('💡 Make changes, then run this script again to test improvements.');
    console.log('🛑 Press Ctrl+C to stop the server when done.');
}

runPerformanceTest().catch(console.error);
