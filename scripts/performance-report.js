#!/usr/bin/env node

/**
 * Performance baseline measurement and reporting script
 * Runs Lighthouse audits and generates performance reports
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const http = require('http')

// Configuration
const LIGHTHOUSE_CONFIG = {
  output: ['html', 'json'],
  onlyCategories: ['performance'],
  chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  throttling: {
    rttMs: 40,
    throughputKbps: 10240,
    cpuSlowdownMultiplier: 1
  }
}

const REPORT_DIR = path.join(__dirname, '../performance-reports')

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200) {
            resolve(true)
          } else {
            reject(new Error(`Status ${res.statusCode}`))
          }
        })
        req.on('error', reject)
        req.setTimeout(2000, () => {
          req.destroy()
          reject(new Error('Timeout'))
        })
      })
      return true
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  throw new Error('Server failed to start within 30 seconds')
}

async function runLighthouseAudit(url, outputPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const htmlPath = `${outputPath}-${timestamp}.html`
  const jsonPath = `${outputPath}-${timestamp}.json`
  
  const lighthouseCmd = [
    'npx', 'lighthouse', url,
    '--output=html',
    '--output=json',
    `--output-path=${htmlPath.replace('.html', '')}`,
    '--chrome-flags="--headless --no-sandbox --disable-gpu"',
    '--throttling-method=simulate',
    '--only-categories=performance',
    '--quiet'
  ].join(' ')
  
  console.log(`Running Lighthouse audit on ${url}...`)
  execSync(lighthouseCmd, { stdio: 'inherit' })
  
  // Read and parse JSON report
  let jsonData = null
  try {
    const jsonContent = fs.readFileSync(jsonPath.replace('.html', '.report.json'), 'utf8')
    jsonData = JSON.parse(jsonContent)
  } catch (error) {
    console.warn('Could not parse Lighthouse JSON report:', error.message)
  }
  
  return {
    htmlPath,
    jsonPath: jsonPath.replace('.html', '.report.json'),
    data: jsonData
  }
}

function extractMetrics(lighthouseData) {
  if (!lighthouseData || !lighthouseData.lhr) return null
  
  const audits = lighthouseData.lhr.audits
  const performanceScore = lighthouseData.lhr.categories.performance?.score
  
  return {
    performanceScore: Math.round((performanceScore || 0) * 100),
    metrics: {
      firstContentfulPaint: audits['first-contentful-paint']?.numericValue,
      largestContentfulPaint: audits['largest-contentful-paint']?.numericValue,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue,
      totalBlockingTime: audits['total-blocking-time']?.numericValue,
      speedIndex: audits['speed-index']?.numericValue,
      timeToFirstByte: audits['server-response-time']?.numericValue
    },
    opportunities: audits['opportunities'] || [],
    diagnostics: audits['diagnostics'] || []
  }
}

function generateReport(baselineData, currentData) {
  const report = {
    timestamp: new Date().toISOString(),
    baseline: baselineData,
    current: currentData,
    comparison: {}
  }
  
  if (baselineData && currentData) {
    report.comparison = {
      performanceScoreDelta: currentData.performanceScore - baselineData.performanceScore,
      metricDeltas: {}
    }
    
    for (const [key, value] of Object.entries(currentData.metrics)) {
      if (baselineData.metrics[key]) {
        report.comparison.metricDeltas[key] = value - baselineData.metrics[key]
      }
    }
  }
  
  return report
}

async function main() {
  console.log('🚀 Starting comprehensive performance audit...\n')
  
  // Ensure reports directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true })
  }
  
  // Step 1: Build the application
  console.log('📦 Building production bundle...')
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') })
    console.log('✅ Build completed\n')
  } catch (error) {
    console.error('❌ Build failed:', error.message)
    process.exit(1)
  }
  
  let serverProcess = null
  
  try {
    // Step 2: Start production server
    console.log('🌐 Starting production server...')
    serverProcess = spawn('npm', ['run', 'start'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      detached: false
    })
    
    await waitForServer('http://localhost:3000')
    console.log('✅ Server ready\n')
    
    // Step 3: Run Lighthouse audits on key pages
    const pages = [
      { name: 'home', url: 'http://localhost:3000' },
      { name: 'past-puzzles', url: 'http://localhost:3000/tidligere' },
      { name: 'how-to-play', url: 'http://localhost:3000/hvordan-spille' }
    ]
    
    const results = {}
    
    for (const page of pages) {
      console.log(`🔍 Auditing ${page.name} page...`)
      const outputPath = path.join(REPORT_DIR, `lighthouse-${page.name}`)
      
      try {
        const auditResult = await runLighthouseAudit(page.url, outputPath)
        const metrics = extractMetrics(auditResult.data)
        
        results[page.name] = {
          ...auditResult,
          metrics
        }
        
        if (metrics) {
          console.log(`   Performance Score: ${metrics.performanceScore}/100`)
          console.log(`   LCP: ${Math.round(metrics.metrics.largestContentfulPaint)}ms`)
          console.log(`   CLS: ${metrics.metrics.cumulativeLayoutShift?.toFixed(3) || 'N/A'}`)
          console.log(`   TBT: ${Math.round(metrics.metrics.totalBlockingTime || 0)}ms`)
        }
        console.log(`   Report: ${auditResult.htmlPath}\n`)
      } catch (error) {
        console.error(`❌ Failed to audit ${page.name}:`, error.message)
        results[page.name] = { error: error.message }
      }
    }
    
    // Step 4: Generate summary report
    const summaryPath = path.join(REPORT_DIR, 'performance-summary.json')
    const summary = {
      timestamp: new Date().toISOString(),
      results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    }
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    
    console.log('📊 Performance Audit Complete!')
    console.log('=====================================')
    
    // Display summary
    for (const [pageName, result] of Object.entries(results)) {
      if (result.metrics) {
        console.log(`${pageName.toUpperCase()}:`)
        console.log(`  Performance: ${result.metrics.performanceScore}/100`)
        console.log(`  LCP: ${Math.round(result.metrics.metrics.largestContentfulPaint)}ms`)
        console.log(`  CLS: ${result.metrics.metrics.cumulativeLayoutShift?.toFixed(3) || 'N/A'}`)
        console.log('')
      }
    }
    
    console.log(`📁 Reports saved to: ${REPORT_DIR}`)
    console.log(`📋 Summary: ${summaryPath}`)
    console.log('\n💡 Keep the server running to test changes manually at http://localhost:3000')
    
  } catch (error) {
    console.error('❌ Performance audit failed:', error.message)
    process.exit(1)
  } finally {
    if (serverProcess) {
      console.log('\n🛑 Press Ctrl+C to stop the server')
      
      // Keep server running for manual testing
      process.on('SIGINT', () => {
        console.log('\nStopping server...')
        serverProcess.kill('SIGTERM')
        setTimeout(() => {
          serverProcess.kill('SIGKILL')
        }, 5000)
        process.exit(0)
      })
      
      // Keep script alive
      await new Promise(() => {})
    }
  }
}

main().catch(console.error)