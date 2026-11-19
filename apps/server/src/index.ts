import { createApp, PORT } from './app';
import { connectDatabase } from './config/database';

async function startServer() {
  try {
    await connectDatabase();
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to bootstrap application:', error);
    process.exit(1);
  }
}

void startServer();