import multiprocessing
import os

# Binding
bind = "unix:/var/www/ArazitSaaS/backend/gunicorn.sock"  # Using Unix socket instead of direct port binding

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
timeout = 120  # Increased timeout
keepalive = 5

# Process naming
proc_name = 'arazit_backend'

# Logging
accesslog = '/var/log/gunicorn/access.log'
errorlog = '/var/log/gunicorn/error.log'
loglevel = 'info'

# Reload workers when code changes (development only)
reload = os.environ.get('DEBUG', 'False') == 'True'

# SSL (if needed)
# keyfile = '/etc/ssl/private/api.arazit.com.key'
# certfile = '/etc/ssl/certs/api.arazit.com.crt'

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Worker configurations
worker_tmp_dir = '/dev/shm'  # Using RAM for temp files
max_requests = 1000
max_requests_jitter = 50 