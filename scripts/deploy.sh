#!/bin/bash
# MedCare deployment script for Ubuntu VPS
# Run: ssh root@193.124.113.157 'bash -s' < scripts/deploy.sh

set -e

echo "=== MedCare Deployment ==="

# Wait for previous apt to finish
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
  echo "Waiting for apt lock..."
  sleep 5
done

cd /opt/medcare

# Install deps
echo "Installing npm packages..."
pnpm install --ignore-scripts 2>&1 | tail -3

# Wait for postgres to be ready
echo "Waiting for PostgreSQL..."
sleep 10

# Seed databases
echo "Seeding databases..."
docker exec medcare-postgres-1 psql -U medcare -d medcare_auth -f /dev/stdin < scripts/seed-auth.sql
docker exec medcare-postgres-1 psql -U medcare -d medcare_students -f /dev/stdin < scripts/seed-students.sql
docker exec medcare-postgres-1 psql -U medcare -d medcare_visits -f /dev/stdin < scripts/seed-visits.sql
docker exec medcare-postgres-1 psql -U medcare -d medcare_appointments -f /dev/stdin < scripts/seed-appointments.sql
docker exec medcare-postgres-1 psql -U medcare -d medcare_medications -f /dev/stdin < scripts/seed-medications.sql

# Fix .env files - change port 5433 to 5432 (docker uses default port on server)
echo "Fixing .env files for server..."
for dir in services/auth services/students services/visits services/appointments services/medications services/notifications services/reports; do
  if [ -f "$dir/.env" ]; then
    sed -i 's/:5433\//:5432\//g' "$dir/.env"
  fi
done

# Install PM2 for process management
echo "Installing PM2..."
npm install -g pm2 2>&1 | tail -2

# Stop existing processes
pm2 delete all 2>/dev/null || true

# Start all services
echo "Starting services..."
pm2 start "npx tsx src/index.ts" --name auth --cwd /opt/medcare/services/auth
pm2 start "npx tsx src/index.ts" --name students --cwd /opt/medcare/services/students
pm2 start "npx tsx src/index.ts" --name visits --cwd /opt/medcare/services/visits
pm2 start "npx tsx src/index.ts" --name appointments --cwd /opt/medcare/services/appointments
pm2 start "npx tsx src/index.ts" --name medications --cwd /opt/medcare/services/medications

# Save PM2 config to survive reboot
pm2 save
pm2 startup 2>&1 | tail -1

echo ""
echo "=== Deployment Complete ==="
echo "Services running on:"
echo "  Auth:         http://193.124.113.157:4001"
echo "  Students:     http://193.124.113.157:4002"
echo "  Visits:       http://193.124.113.157:4003"
echo "  Appointments: http://193.124.113.157:4004"
echo "  Medications:  http://193.124.113.157:4005"
echo ""
pm2 status
