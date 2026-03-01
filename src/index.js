// src/index.js
export default {
  async fetch(request, env) {
    return new Response("OpenCrom Worker is running");
  },

  async scheduled(event, env, ctx) {
    // Optional: cron logic can go here later
    console.log("Cron triggered");
  }
};
