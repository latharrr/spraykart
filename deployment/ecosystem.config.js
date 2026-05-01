module.exports = {
  apps: [
    {
      name: 'spraykart',
      cwd: '/home/ubuntu/spraykart/frontend',
      script: 'server.js',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: '3000',
        SHUTDOWN_TIMEOUT_MS: '30000',
      },
      kill_timeout: 30000,
      listen_timeout: 10000,
      max_memory_restart: '850M',
    },
  ],
};
