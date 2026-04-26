import { cpSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('Admin_Beauty_Vision/dist');
const target = resolve('admin');

if (!existsSync(source)) {
  throw new Error(`Missing admin build output: ${source}`);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log('Copied admin build output to /admin');
