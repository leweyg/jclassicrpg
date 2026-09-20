#!/usr/bin/env node
/** One command rebuilds saved inputs, immutable scenes and validates the result. */
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';import path from 'node:path';import fs from 'node:fs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
execFileSync('python3',['scripts/export_frozen_world.py'],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['scripts/compile_world.mjs',...process.argv.slice(2)],{cwd:root,stdio:'inherit'});
const tests=fs.readdirSync(path.join(root,'jCRPG-engine/js/tests')).filter(n=>n.endsWith('.test.mjs')).map(n=>'jCRPG-engine/js/tests/'+n);
execFileSync(process.execPath,['--test',...tests],{cwd:root,stdio:'inherit'});
