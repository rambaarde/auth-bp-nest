#!/usr/bin/env node

const path = require('path');
const { runCLI } = require(path.join(__dirname, '..', 'dist', 'cli'));

runCLI();
