import multiprocessing

# Binding
bind = "0.0.0.0:8000"  # Change to direct bind to see if it works

# Worker processes
workers = 3  # Simplified number of workers
worker_class = 'sync'
timeout = 60
keepalive = 2

# Process naming
proc_name = 'arazit_backend'

# Logging
errorlog = '-'  # Log to stderr
loglevel = 'debug'  # Increase log level for debugging

# SSL (if needed)
# keyfile = '/etc/ssl/private/api.arazit.com.key'
# certfile = '/etc/ssl/certs/api.arazit.com.crt'

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190 