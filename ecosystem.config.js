module.exports = {
  apps: [{
    name: 'tunda-sports-club',
    script: 'pnpm',
    args: 'start',
    cwd: '/var/www/tunda-sports-club',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/tunda-sports-club/error.log',
    out_file: '/var/log/tunda-sports-club/out.log',
    log_file: '/var/log/tunda-sports-club/combined.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 1600
  }]
};
