// scripts/flatten.js
// Flattens the YieldAggregator contract for Etherscan verification
// Usage: node scripts/flatten.js

const fs = require('fs');
const path = require('path');

// Function to resolve imports and flatten the contract
function flattenContract(contractPath, processed = new Set()) {
  if (processed.has(contractPath)) {
    return '';
  }
  processed.add(contractPath);

  const fullPath = path.resolve(contractPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return '';
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Remove SPDX license from imports (keep only the first one)
  const spdxMatch = content.match(/\/\/ SPDX-License-Identifier: [^\n]*\n/);
  const spdx = spdxMatch ? spdxMatch[0] : '';
  
  // Remove pragma from imports (keep only the first one)
  const pragmaMatch = content.match(/pragma solidity [^;]*;/);
  const pragma = pragmaMatch ? pragmaMatch[0] : '';

  // Process imports
  const importRegex = /import\s+["']([^"']+)["']\s*;/g;
  let flattenedContent = '';
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    if (importPath.startsWith('@openzeppelin/')) {
      // Resolve OpenZeppelin imports
      const nodeModulesPath = path.join(__dirname, '..', 'node_modules', importPath);
      if (fs.existsSync(nodeModulesPath)) {
        flattenedContent += flattenContract(nodeModulesPath, processed);
      } else {
        console.error(`OpenZeppelin import not found: ${nodeModulesPath}`);
      }
    } else {
      // Resolve relative imports
      const relativePath = path.resolve(path.dirname(fullPath), importPath);
      if (fs.existsSync(relativePath)) {
        flattenedContent += flattenContract(relativePath, processed);
      } else {
        console.error(`Import not found: ${relativePath}`);
      }
    }
  }

  // Remove all imports and SPDX/pragma from the main content
  content = content.replace(/\/\/ SPDX-License-Identifier: [^\n]*\n/g, '');
  content = content.replace(/pragma solidity [^;]*;/g, '');
  content = content.replace(/import\s+["'][^"']+["']\s*;/g, '');

  return flattenedContent + content;
}

// Main execution
function main() {
  const contractPath = 'contracts/YieldAggregator.sol';
  
  if (!fs.existsSync(contractPath)) {
    console.error(`Contract file not found: ${contractPath}`);
    return;
  }

  console.log('Flattening YieldAggregator contract...');
  
  // Add the SPDX and pragma at the beginning
  const spdx = '// SPDX-License-Identifier: MIT\n';
  const pragma = 'pragma solidity ^0.8.20;\n\n';
  
  // Flatten the contract
  const flattened = flattenContract(contractPath);
  
  // Combine everything
  const finalContent = spdx + pragma + flattened;
  
  // Write to output file
  const outputPath = 'YieldAggregator_flattened.sol';
  fs.writeFileSync(outputPath, finalContent);
  
  console.log(`Flattened contract saved to: ${outputPath}`);
  console.log('You can now use this file for Etherscan verification.');
}

main(); 