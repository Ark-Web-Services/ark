import 'dotenv/config';
import business from '../business.config';
import { STATUSES, type LeadStatus } from '../src/lib/leads';

const [command = 'list', id, status] = process.argv.slice(2);
const token = process.env.ADMIN_API_TOKEN;
if (!token) throw new Error('Set ADMIN_API_TOKEN in the operator environment.');
const base = process.env.LEAD_SITE_URL || business.website;
if (!base) throw new Error('Set LEAD_SITE_URL or the business website.');
const url = new URL(command === 'deliver' ? '/api/admin/follow-ups' : '/api/admin/leads', base);
if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') throw new Error('Use HTTPS for remote lead operations.');
const options: RequestInit = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(60_000) };
if (command === 'status') {
  if (!id || !STATUSES.includes(status as LeadStatus)) throw new Error(`Usage: npm run leads -- status <id> <${STATUSES.join('|')}>`);
  options.method = 'PATCH'; options.body = JSON.stringify({ id, status });
} else if (command === 'deliver') options.method = 'POST';
else if (command !== 'list') throw new Error('Commands: list, status <id> <status>, deliver.');
const response = await fetch(url, options);
if (!response.ok) throw new Error(`Lead operation failed (${response.status}). Check the site's configuration and admin token.`);
console.log(JSON.stringify(await response.json(), null, 2));
