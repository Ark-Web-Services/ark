import type { APIRoute } from 'astro';
export const prerender = false;
const unavailable: APIRoute = () => new Response(JSON.stringify({ error: 'Distribution runs in the operator pipeline. Use npm run distribute from the repository.' }), { status: 501, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export const GET = unavailable;
export const POST = unavailable;
