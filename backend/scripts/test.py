#!/usr/bin/env python3
import datetime
import os

log_dir = '/app/logs'
os.makedirs(log_dir, exist_ok=True)

with open(f'{log_dir}/cron.log', 'a') as f:
    f.write(f"Test cron job ran at {datetime.datetime.now()}\n")
