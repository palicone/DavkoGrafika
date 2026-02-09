/**
 * Node.js wrapper for Tax2026 module
 * Loads the browser IIFE module and exports it for Node.js testing
 */
const fs = require('fs');
const path = require('path');

// Read the browser module
const modulePath = path.join(__dirname, 'tax2026.js');
const moduleCode = fs.readFileSync(modulePath, 'utf8');

// Use Function constructor to create isolated scope
// The browser module defines `const Tax2026 = (function(){...})();`
// We wrap it to return the Tax2026 value
const getTax2026 = new Function(`
    ${moduleCode}
    return Tax2026;
`);

// Execute and get the Tax2026 object
module.exports = getTax2026();
