/**
 * Node.js wrapper for Tax2025 module
 * Loads the browser IIFE module and exports it for Node.js testing
 */
const fs = require('fs');
const path = require('path');

// Read the browser module
const modulePath = path.join(__dirname, 'tax2025.js');
const moduleCode = fs.readFileSync(modulePath, 'utf8');

// Use Function constructor to create isolated scope
// The browser module defines `const Tax2025 = (function(){...})();`
// We wrap it to return the Tax2025 value
const getTax2025 = new Function(`
    ${moduleCode}
    return Tax2025;
`);

// Execute and get the Tax2025 object
module.exports = getTax2025();
