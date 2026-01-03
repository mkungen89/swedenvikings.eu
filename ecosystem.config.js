// ===========================================
// Sweden Vikings CMS - PM2 Ecosystem Config
// ===========================================
// Process manager configuration for production
// Usage: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      name: 'swedenvikings',
      script: './server/dist/index.js',
      cwd: '/opt/swedenvikings',
      instances: 2, // Use 2 instances for load balancing (adjust based on CPU cores)
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/swedenvikings/pm2-error.log',
      out_file: '/var/log/swedenvikings/pm2-out.log',
      log_file: '/var/log/swedenvikings/pm2-combined.log',
      time: true,
      merge_logs: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'uploads', 'logs'],
      env_file: '.env.production',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'YOUR_VPS_IP',
      ref: 'origin/main',
      repo: 'https://github.com/YOUR_USERNAME/swedenvikings.eu.git',
      path: '/opt/swedenvikings',
      'post-deploy':
        'npm install && npm run build && pm2 reload ecosystem.config.js --env production && pm2 save',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
