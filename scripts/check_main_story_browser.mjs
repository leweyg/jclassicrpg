#!/usr/bin/env node
// Keep the original entry point, now covering the opening and Saima continuation.
process.env.JCRPG_CDP_PORT ??= '9229';
process.argv[2] ??= '/tmp/jcrpg-interaction-evidence';
await import('./check_saima_browser.mjs');
