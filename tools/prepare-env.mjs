import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const environmentPath = path.resolve(process.cwd(), 'src/environments/environment.prod.ts');

const apiUrl = process.env.TH_API_URL ?? process.env.API_URL ?? '';
const googleClientId = process.env.TH_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? '';
const googleCalendarRedirectUri =
  process.env.TH_GOOGLE_CALENDAR_REDIRECT_URI ?? process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? '';

const hasAnyInjectedValue = [apiUrl, googleClientId, googleCalendarRedirectUri].some((value) => value.length > 0);
const runningInVercel = process.env.VERCEL === '1';

if (!hasAnyInjectedValue && !runningInVercel) {
  console.log('[prepare-env] No environment variables found. Keeping existing environment.prod.ts.');
  process.exit(0);
}

const missingVariables = [
  !apiUrl ? 'TH_API_URL (or API_URL)' : null,
  !googleClientId ? 'TH_GOOGLE_CLIENT_ID (or GOOGLE_CLIENT_ID)' : null,
  !googleCalendarRedirectUri ? 'TH_GOOGLE_CALENDAR_REDIRECT_URI (or GOOGLE_CALENDAR_REDIRECT_URI)' : null,
].filter((value) => value !== null);

if (missingVariables.length > 0) {
  throw new Error(`[prepare-env] Missing required environment variables: ${missingVariables.join(', ')}`);
}

const escapeValue = (value) => value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");

const content = `export const environment = {
  production: true,
  apiUrl: '${escapeValue(apiUrl)}',
  googleClientId: '${escapeValue(googleClientId)}',
  googleCalendarRedirectUri: '${escapeValue(googleCalendarRedirectUri)}'
};
`;

await writeFile(environmentPath, content, 'utf8');
console.log('[prepare-env] environment.prod.ts generated from environment variables.');
