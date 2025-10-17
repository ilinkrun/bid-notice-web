#!/bin/bash
#
# Cron job wrapper script for fetching bid notices
# This script should be called from crontab
#

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Load environment variables
if [ -f "../../.env" ]; then
  export $(grep -v '^#' ../../.env | xargs)
fi

# Set up logging
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/cron-fetch-notices-$(date +%Y%m%d).log"

# Log start time
echo "========================================" >> "$LOG_FILE"
echo "Starting cron job at $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Run the npm script and log output
npm run cron:fetch-notices >> "$LOG_FILE" 2>&1

# Capture exit code
EXIT_CODE=$?

# Log completion
echo "========================================" >> "$LOG_FILE"
echo "Cron job completed at $(date) with exit code: $EXIT_CODE" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Keep only last 30 days of logs
find "$LOG_DIR" -name "cron-fetch-notices-*.log" -type f -mtime +30 -delete

exit $EXIT_CODE
