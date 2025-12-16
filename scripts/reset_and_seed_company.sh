#!/bin/bash

# ============================================================================
# Reset and Seed TechStream Solutions Company Data
# ============================================================================
# This script deletes all existing departments and seeds a new company structure
# 
# Usage: ./scripts/reset_and_seed_company.sh
# ============================================================================

set -e  # Exit on error

echo "============================================================================"
echo "TechStream Solutions - Company Data Reset & Seed"
echo "============================================================================"
echo ""

# Database connection details
DB_NAME="buildflow_db"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Check if database exists
echo "Checking database connection..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Error: Cannot connect to database!"
    echo "   Please ensure PostgreSQL is running and credentials are correct."
    exit 1
fi

echo "✅ Database connection successful"
echo ""

# Step 1: Delete existing departments
echo "Step 1: Deleting existing departments and related data..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/delete_all_departments.sql

if [ $? -eq 0 ]; then
    echo "✅ Existing data deleted successfully"
else
    echo "❌ Error deleting existing data"
    exit 1
fi

echo ""

# Step 2: Seed new company
echo "Step 2: Seeding new company structure..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/seed_new_company.sql

if [ $? -eq 0 ]; then
    echo "✅ New company data seeded successfully"
else
    echo "❌ Error seeding new data"
    exit 1
fi

echo ""
echo "============================================================================"
echo "✅ Company reset and seed completed successfully!"
echo "============================================================================"
echo ""
echo "📋 Summary:"
echo "   - All existing departments deleted"
echo "   - New company structure created"
echo "   - 9 departments with 42 employees"
echo ""
echo "🔐 Login Credentials:"
echo "   - Default password for all users: password123"
echo "   - See TECHSTREAM_COMPANY_STRUCTURE.md for full list"
echo ""
echo "🎯 Quick Test:"
echo "   - CEO: ceo@techstream.com / password123"
echo "   - HR Director: hr.director@techstream.com / password123"
echo "   - CTO: cto@techstream.com / password123"
echo ""
