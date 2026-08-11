const fs = require('fs');
const path = require('path');

function processFile(filePath, label) {
  let code = fs.readFileSync(filePath, 'utf8');
  const original = code;

  // ---- LANDING HEADER: hardcoded cream bg ----
  code = code.replace(
    /bg-\[rgba\(248,245,237,0\.9[0-9]*\)\]/g,
    'bg-paper-strong/95 backdrop-blur-xl',
  );

  // ---- LANDING PAGE: hardcoded gradients on metric cards & chart placeholder ----
  // Metric card gradient
  code = code.replace(
    /bg-gradient-to-br from-\[rgba\(221,236,231,0\.9\)\] to-\[rgba\(250,252,249,0\.92\)\]/g,
    'bg-surface-muted',
  );
  // Chart placeholder gradient
  code = code.replace(
    /bg-gradient-to-br from-\[rgba\(237,244,241,0\.96\)\] to-\[rgba\(247,250,248,0\.92\)\]/g,
    'bg-surface-muted',
  );
  // Benefits section hardcoded tinted bg
  code = code.replace(
    /border-white\/40 bg-\[rgba\(220,236,231,0\.42\)\]/g,
    'border-line bg-surface-muted/40',
  );
  // Benefit icon bg
  code = code.replace(/bg-\[rgba\(221,236,231,0\.72\)\]/g, 'bg-brand/10');

  // ---- AUTH PAGES: page backgrounds ----
  // register page bg
  code = code.replace(
    /bg-\[radial-gradient\(circle_at_top,#f4efe7_0%,#f7f2ea_46%,#efe6da_100%\)\]/g,
    'bg-cream',
  );
  // verify-email page bg
  code = code.replace(/bg-\[linear-gradient\(180deg,#f7f2ea_0%,#f4efe7_100%\)\]/g, 'bg-cream');

  // ---- AUTH PAGES: left panel backgrounds ----
  code = code.replace(/bg-\[linear-gradient\(180deg,#d8e4dc_0%,#dbe8df_100%\)\]/g, 'bg-mint');
  code = code.replace(/bg-\[#dbe6e0\]/g, 'bg-mint');

  // ---- AUTH PAGES: decorative blobs with hardcoded hex ----
  code = code.replace(/bg-\[#f4ead9\]/g, 'bg-surface-muted');
  code = code.replace(/bg-\[#f5e6d2\]/g, 'bg-surface-muted');
  code = code.replace(/bg-\[#f2eadb\]/g, 'bg-surface-muted');
  code = code.replace(/bg-\[#f3e3cf\]/g, 'bg-surface-muted');

  // ---- AUTH PAGES: form input backgrounds ----
  code = code.replace(/bg-\[#f5f1eb\]/g, 'bg-surface-muted');

  // ---- AUTH PAGES: form section borders and backgrounds ----
  code = code.replace(/border-\[#ece7df\] bg-\[#fbf8f2\]/g, 'border-line bg-paper');
  code = code.replace(/border-\[#ebe6df\] bg-\[#faf7f2\]/g, 'border-line bg-paper');
  code = code.replace(/border-\[#ece7df\]/g, 'border-line');
  code = code.replace(/border-\[#ebe6df\]/g, 'border-line');

  // ---- AUTH PAGES: heading text color ----
  code = code.replace(/text-\[#13281f\]/g, 'text-ink');

  // ---- AUTH PAGES: password strength indicator ----
  code = code.replace(/bg-\[#f5ede0\]/g, 'bg-surface-muted');

  // ---- COMMON: remaining text-slate ----
  code = code.replace(/text-slate-300/g, 'text-ink-soft/40');
  code = code.replace(/bg-slate-700\/14/g, 'bg-ink/14');

  // ---- LOGIN PAGE: hardcoded colors ----
  // Login page backgrounds
  code = code.replace(
    /bg-\[radial-gradient\(circle_at_top,#f3efe6_0%,#f7f2ea_46%,#ede5d9_100%\)\]/g,
    'bg-cream',
  );
  code = code.replace(/bg-\[linear-gradient\(180deg,#d5e2da_0%,#d9e6dd_100%\)\]/g, 'bg-mint');
  code = code.replace(/bg-\[#d9e4de\]/g, 'bg-mint');

  // Login decorative blobs
  code = code.replace(/bg-\[#f3e9d8\]/g, 'bg-surface-muted');
  code = code.replace(/bg-\[#f4e7d4\]/g, 'bg-surface-muted');

  // Login input bg
  code = code.replace(/bg-\[#f4f0ea\]/g, 'bg-surface-muted');

  // Login heading text
  code = code.replace(/text-\[#12271e\]/g, 'text-ink');

  // Login form section borders/backgrounds
  code = code.replace(/border-\[#ebe5dc\] bg-\[#faf6f0\]/g, 'border-line bg-paper');
  code = code.replace(/border-\[#ebe5dc\]/g, 'border-line');

  // Forgot password page patterns
  code = code.replace(
    /bg-\[radial-gradient\(circle_at_top,#f2eee5_0%,#f5f1e9_46%,#ede5d9_100%\)\]/g,
    'bg-cream',
  );
  code = code.replace(/bg-\[linear-gradient\(180deg,#d3e0d8_0%,#d7e4db_100%\)\]/g, 'bg-mint');
  code = code.replace(/bg-\[#d7e2dc\]/g, 'bg-mint');
  code = code.replace(/bg-\[#f2e8d6\]/g, 'bg-surface-muted');
  code = code.replace(/bg-\[#f3e5d1\]/g, 'bg-surface-muted');
  code = code.replace(/bg-\[#f4f0e9\]/g, 'bg-surface-muted');
  code = code.replace(/text-\[#11261d\]/g, 'text-ink');
  code = code.replace(/border-\[#eae4db\] bg-\[#f9f5ef\]/g, 'border-line bg-paper');
  code = code.replace(/border-\[#eae4db\]/g, 'border-line');

  if (code !== original) {
    fs.writeFileSync(filePath, code);
    console.log(`Modified: ${label || filePath}`);
    return true;
  }
  console.log(`No changes: ${label || filePath}`);
  return false;
}

const files = [
  ['apps/web/src/app/page.tsx', 'Landing page'],
  ['apps/web/src/components/marketing/landing-header.tsx', 'Landing header'],
  ['apps/web/src/app/(auth)/login/page.tsx', 'Login page'],
  ['apps/web/src/app/(auth)/register/page.tsx', 'Register page'],
  ['apps/web/src/app/(auth)/verify-email/page.tsx', 'Verify email page'],
  ['apps/web/src/app/(auth)/forgot-password/page.tsx', 'Forgot password page'],
];

let modified = 0;
for (const [file, label] of files) {
  if (fs.existsSync(file)) {
    if (processFile(file, label)) modified++;
  } else {
    console.log(`File not found: ${file}`);
  }
}
console.log(`\nDone. ${modified} files modified.`);
