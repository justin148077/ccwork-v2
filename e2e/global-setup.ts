import { copyFileSync, existsSync } from 'node:fs';

const DB = 'db.json';
const BACKUP = 'db.json.e2e-backup';

export default function globalSetup() {
  if (existsSync(DB)) copyFileSync(DB, BACKUP);
}
