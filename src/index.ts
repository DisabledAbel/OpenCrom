export default {
  async fetch(request: Request): Promise<Response> {
    return new Response("Worker is alive");
  },

  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
    console.log("CRON TRIGGERED:", new Date().toISOString());

    ctx.waitUntil(
      (async () => {
        try {
          await runJob(env);
          console.log("CRON COMPLETED SUCCESSFULLY");
        } catch (error) {
          console.error("CRON FAILED:", error);
        }
      })()
    );
  },
};

async function runJob(env: any) {
  console.log("JOB STARTED");

  // Simulated async work
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("JOB FINISHED");
}
