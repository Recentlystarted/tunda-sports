#!/usr/bin/env node

console.log('🧹 Clearing Next.js cache and rebuilding...')

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Remove .next directory
const nextDir = path.join(__dirname, '../.next')
if (fs.existsSync(nextDir)) {
  console.log('Removing .next directory...')
  fs.rmSync(nextDir, { recursive: true, force: true })
}

// Remove tsconfig.tsbuildinfo
const tsbuildInfo = path.join(__dirname, '../tsconfig.tsbuildinfo')
if (fs.existsSync(tsbuildInfo)) {
  console.log('Removing tsconfig.tsbuildinfo...')
  fs.unlinkSync(tsbuildInfo)
}

// Clear node_modules/.cache if it exists
const nodeModulesCache = path.join(__dirname, '../node_modules/.cache')
if (fs.existsSync(nodeModulesCache)) {
  console.log('Clearing node_modules/.cache...')
  fs.rmSync(nodeModulesCache, { recursive: true, force: true })
}

console.log('✅ Cache cleared! Ready to restart dev server.')
console.log('Run: pnpm dev')
