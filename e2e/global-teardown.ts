import { copyFileSync, existsSync, unlinkSync } from 'node:fs';

const DB = 'db.json';
const BACKUP = 'db.json.e2e-backup';

export default function globalTeardown() {
  if (existsSync(BACKUP)) {
    copyFileSync(BACKUP, DB);
    unlinkSync(BACKUP);
  }
}
