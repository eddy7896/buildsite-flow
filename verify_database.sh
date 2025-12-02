#!/bin/bash

# Database Verification Script
# This script helps verify the database schema matches the expected structure

echo "=========================================="
echo "Database Schema Verification"
echo "=========================================="
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "ERROR: psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Get database connection details
if [ -z "$DATABASE_URL" ]; then
    echo "Please provide database connection details:"
    echo ""
    read -p "Database host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "Database port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    
    read -p "Database name: " DB_NAME
    
    read -p "Database user: " DB_USER
    
    read -sp "Database password: " DB_PASSWORD
    echo ""
    
    export PGPASSWORD=$DB_PASSWORD
    DB_CONN="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
else
    DB_CONN="psql $DATABASE_URL"
fi

echo ""
echo "Connecting to database..."
echo ""

# Run verification queries
$DB_CONN -f verify_database_schema.sql

echo ""
echo "=========================================="
echo "Quick Schema Check Commands:"
echo "=========================================="
echo ""
echo "To check holidays table structure:"
echo "  $DB_CONN -c \"\\d holidays\""
echo ""
echo "To check company_events table structure:"
echo "  $DB_CONN -c \"\\d company_events\""
echo ""
echo "To check for incorrect columns:"
echo "  $DB_CONN -c \"SELECT column_name FROM information_schema.columns WHERE table_name = 'holidays' AND column_name IN ('type', 'is_mandatory');\""
echo "  $DB_CONN -c \"SELECT column_name FROM information_schema.columns WHERE table_name = 'company_events' AND column_name = 'is_all_day';\""
echo ""

