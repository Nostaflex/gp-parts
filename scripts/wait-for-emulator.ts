/**
 * wait-for-emulator.ts — Attend que l'émulateur Firestore soit prêt.
 *
 * Interroge le endpoint HTTP de l'émulateur en boucle jusqu'à ce qu'il
 * réponde, avec un timeout configurable. Bien plus fiable que `sleep 3`.
 *
 * Usage : tsx scripts/wait-for-emulator.ts [--timeout 15000]
 */

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? 'localhost:8080';
const DEFAULT_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 500;

async function waitForEmulator(timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<void> {
  const url = `http://${EMULATOR_HOST}/`;
  const deadline = Date.now() + timeoutMs;

  process.stdout.write(`⏳ Waiting for Firestore emulator at ${EMULATOR_HOST}`);

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (res.ok || res.status === 200 || res.status === 404) {
        process.stdout.write(' ✅\n');
        return;
      }
    } catch {
      // Emulator not ready yet — retry
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  console.error(`\n❌ Firestore emulator not ready after ${timeoutMs}ms. Aborting.`);
  process.exit(1);
}

// Parse --timeout flag
const timeoutArg = process.argv.indexOf('--timeout');
const timeout = timeoutArg !== -1 ? Number(process.argv[timeoutArg + 1]) : DEFAULT_TIMEOUT_MS;

waitForEmulator(timeout);
