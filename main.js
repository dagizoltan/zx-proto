import { createApp } from './src/app.js';

async function main() {
  try {
    const app = await createApp();

    // Handle graceful shutdown
    Deno.addSignalListener('SIGINT', async () => {
        await app.shutdown();
        Deno.exit(0);
    });

    await app.start();

  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    Deno.exit(1);
  }
}

// Run
if (import.meta.main) {
  main();
}

export { main };
