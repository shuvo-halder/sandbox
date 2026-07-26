#!/bin/bash
set -e

echo "[+] Starting Malware Behavior Sandbox Environment..."

# In a real environment, we'd set up cgroups and isolated namespaces here.
# For this dockerized version, we rely on Docker's network and resource limits.

echo "[+] Starting Go Monitoring Agent..."
/usr/local/bin/monitor &
MONITOR_PID=$!

echo "[+] Sandbox is active and monitoring."
# Keep container alive
wait $MONITOR_PID
