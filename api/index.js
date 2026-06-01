import app from '../dist/server.cjs';

// Handle esbuild default export wrapping
const handler = app.default || app;

export default handler;
