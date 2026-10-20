import { runGenerationSweep } from "../src/lib/random-rooms/job-runner";

const intervalMs = Number(process.env.GENERATION_RUNNER_INTERVAL_MS || 5000);
let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    const result = await runGenerationSweep();
    if (result.reaped.staleSubmitting || result.reaped.expiredLeases || result.runPod.synced || result.runPod.errors.length) {
      console.log("[generation-runner]", JSON.stringify(result));
    }
  } catch (error) {
    console.error("[generation-runner]", error);
  } finally {
    running = false;
  }
}

console.log(`[generation-runner] started; interval=${intervalMs}ms`);
void tick();
const timer = setInterval(() => void tick(), intervalMs);

function shutdown() {
  clearInterval(timer);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
