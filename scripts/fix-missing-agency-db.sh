#!/bin/bash
# Script to fix missing agency database
# Usage: ./scripts/fix-missing-agency-db.sh <database_name>

set -e

DB_NAME=${1:-"agency_delltechnologies_bb5c809b"}
PGHOST=${PGHOST:-localhost}
PGPORT=${PGPORT:-5432}
PGUSER=${POSTGRES_USER:-postgres}
PGPASSWORD=${POSTGRES_PASSWORD:-admin}
MAIN_DB=${POSTGRES_DB:-buildflow_db}

export PGPASSWORD

echo "🔧 Fixing missing agency database: ${DB_NAME}"

# Check if database exists
DB_EXISTS=$(psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';" 2>/dev/null | tr -d ' ')

if [ "${DB_EXISTS}" = "1" ]; then
    echo "✅ Database ${DB_NAME} already exists"
    exit 0
fi

# Check if agency exists in main database
AGENCY_EXISTS=$(psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${MAIN_DB}" -t -c "SELECT 1 FROM agencies WHERE database_name='${DB_NAME}';" 2>/dev/null | tr -d ' ')

if [ "${AGENCY_EXISTS}" != "1" ]; then
    echo "⚠️  Agency with database_name '${DB_NAME}' not found in main database"
    echo "   This might be an orphaned reference. Creating database anyway..."
fi

# Create database
echo "📦 Creating database: ${DB_NAME}"
psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d postgres -c "CREATE DATABASE \"${DB_NAME}\";" 2>/dev/null || {
    echo "❌ Failed to create database"
    exit 1
}

echo "✅ Database created successfully"
echo ""
echo "⚠️  Note: The database schema will be created automatically on first query"
echo "   Or you can create it manually by calling the /api/database/create-schema endpoint"

