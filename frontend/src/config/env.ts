export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  appName: import.meta.env.VITE_APP_NAME || 'Workspace Platform',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  nodeEnv: import.meta.env.MODE || 'development',
};

export default env;

