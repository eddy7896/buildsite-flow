#!/bin/bash
# ============================================================================
# COMPLETE SETUP FOR EASYIO.TECH - ALL ROLES
# ============================================================================
# This script sets up the database with all roles and creates all users
# ============================================================================

echo ""
echo "============================================================================"
echo "Setting up EasyIO.Tech - All Roles"
echo "============================================================================"
echo ""

# Step 1: Add all roles to enum
echo "[1/2] Adding all roles to app_role enum..."
psql -U postgres -d buildflow_db -f scripts/01_add_all_roles_to_enum.sql
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to add roles to enum"
    exit 1
fi

echo ""
echo "[2/2] Creating all users for easyio.tech..."
psql -U postgres -d buildflow_db -f scripts/seed_easyio_tech_all_roles.sql
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create users"
    exit 1
fi

echo ""
echo "============================================================================"
echo "Setup Complete!"
echo "============================================================================"
echo ""
echo "All 22 user roles have been created for easyio.tech"
echo ""
echo "Login credentials:"
echo "  Email format: role@easyio.tech"
echo "  Password: password123"
echo ""
echo "Example: ceo@easyio.tech / password123"
echo ""
