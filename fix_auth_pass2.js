const fs = require('fs');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('Not found: ' + filePath);
    return;
  }
  let code = fs.readFileSync(filePath, 'utf8');
  const orig = code;

  // Login-specific leftovers
  code = code.replace(/bg-\[#dbe6e1\]/g, 'bg-mint');
  code = code.replace(/bg-\[#efe9d9\]/g, 'bg-surface-muted');
  code = code.replace(/bg-\[#f1e4d1\]/g, 'bg-surface-muted');
  code = code.replace(/bg-\[#f4eddf\]/g, 'bg-surface-muted');
  code = code.replace(/bg-\[#ece7df\]/g, 'bg-line');

  // Forgot-password leftovers
  code = code.replace(/bg-\[#[a-fA-F0-9]{6}\]/g, (match) => {
    // Map remaining hex colors to semantic tokens
    const hex = match.match(/#([a-fA-F0-9]{6})/)[1].toLowerCase();
    // Greens/mints
    if (['d3e0d8', 'd7e4db', 'd7e2dc', 'd9e4de', 'dbe6e0', 'dbe6e1'].includes(hex))
      return 'bg-mint';
    // Warm/cream/tan blobs
    if (
      [
        'f2e8d6',
        'f3e5d1',
        'f3e9d8',
        'f4e7d4',
        'f4ead9',
        'f5e6d2',
        'f2eadb',
        'f3e3cf',
        'efe9d9',
        'f1e4d1',
        'f4eddf',
        'f5ede0',
        'ece7df',
      ].includes(hex)
    )
      return 'bg-surface-muted';
    // Input/form backgrounds
    if (['f5f1eb', 'f4f0ea', 'f4f0e9'].includes(hex)) return 'bg-surface-muted';
    console.log('  Unknown hex: ' + match + ' in ' + filePath);
    return match;
  });

  // border hex colors
  code = code.replace(/border-\[#[a-fA-F0-9]{6}\]/g, (match) => {
    return 'border-line';
  });

  if (code !== orig) {
    fs.writeFileSync(filePath, code);
    console.log('Fixed: ' + filePath);
  } else {
    console.log('No changes: ' + filePath);
  }
}

fixFile('apps/web/src/app/(auth)/login/page.tsx');
fixFile('apps/web/src/app/(auth)/register/page.tsx');
fixFile('apps/web/src/app/(auth)/verify-email/page.tsx');
fixFile('apps/web/src/app/(auth)/forgot-password/page.tsx');
