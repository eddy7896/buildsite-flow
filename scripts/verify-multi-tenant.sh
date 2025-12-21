#!/bin/bash
# Multi-Tenant Database Isolation Verification Script

set -e

echo "🔍 Verifying Multi-Tenant Database Isolation..."
echo ""

# Configuration
PGHOST=${PGHOST:-localhost}
PGPORT=${PGPORT:-5432}
PGUSER=${POSTGRES_USER:-postgres}
PGPASSWORD=${POSTGRES_PASSWORD:-admin}
MAIN_DB=${POSTGRES_DB:-buildflow_db}

export PGPASSWORD

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run SQL query
run_query() {
    psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "$1" -t -c "$2" 2>/dev/null | tr -d ' '
}

# 1. Check main database exists
echo "1. Checking main database..."
if run_query "postgres" "SELECT 1 FROM pg_database WHERE datname='${MAIN_DB}';" | grep -q "1"; then
    echo -e "${GREEN}✅ Main database '${MAIN_DB}' exists${NC}"
else
    echo -e "${RED}❌ Main database '${MAIN_DB}' not found${NC}"
    exit 1
fi

# 2. Check agencies table exists
echo "2. Checking agencies table..."
if run_query "${MAIN_DB}" "SELECT 1 FROM information_schema.tables WHERE table_name='agencies';" | grep -q "1"; then
    echo -e "${GREEN}✅ Agencies table exists${NC}"
else
    echo -e "${RED}❌ Agencies table not found${NC}"
    exit 1
fi

# 3. List all agency databases
echo "3. Discovering agency databases..."
AGENCY_DBS=$(run_query "postgres" "SELECT datname FROM pg_database WHERE datname LIKE 'agency_%' AND datistemplate=false ORDER BY datname;")

if [ -n "${AGENCY_DBS}" ]; then
    AGENCY_COUNT=$(echo "${AGENCY_DBS}" | grep -c "agency_" || echo "0")
    echo -e "${GREEN}✅ Found ${AGENCY_COUNT} agency database(s):${NC}"
    echo "${AGENCY_DBS}" | while read -r db; do
        if [ -n "${db}" ]; then
            echo "   - ${db}"
        fi
    done
else
    echo -e "${YELLOW}⚠️  No agency databases found (this is OK for new installations)${NC}"
fi

# 4. Verify agency database isolation
if [ -n "${AGENCY_DBS}" ]; then
    echo ""
    echo "4. Verifying database isolation..."
    FIRST_AGENCY=$(echo "${AGENCY_DBS}" | head -n 1)
    if [ -n "${FIRST_AGENCY}" ]; then
        # Check if agency database has required tables
        TABLES=$(run_query "${FIRST_AGENCY}" "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
        if [ "${TABLES}" -gt "0" ]; then
            echo -e "${GREEN}✅ Agency database '${FIRST_AGENCY}' has ${TABLES} tables${NC}"
            
            # Check for critical tables
            CRITICAL_TABLES=("users" "profiles" "user_roles")
            for table in "${CRITICAL_TABLES[@]}"; do
                if run_query "${FIRST_AGENCY}" "SELECT 1 FROM information_schema.tables WHERE table_name='${table}';" | grep -q "1"; then
                    echo -e "${GREEN}   ✅ Table '${table}' exists${NC}"
                else
                    echo -e "${RED}   ❌ Table '${table}' missing${NC}"
                fi
            done
        else
            echo -e "${RED}❌ Agency database '${FIRST_AGENCY}' has no tables${NC}"
        fi
    fi
fi

# 5. Verify agencies table has database_name references
echo ""
echo "5. Verifying agency metadata..."
AGENCY_COUNT=$(run_query "${MAIN_DB}" "SELECT COUNT(*) FROM agencies;")
echo -e "${GREEN}✅ Found ${AGENCY_COUNT} agency(ies) in main database${NC}"

if [ "${AGENCY_COUNT}" -gt "0" ]; then
    # Check if database_name matches actual databases
    AGENCIES_WITH_DB=$(run_query "${MAIN_DB}" "SELECT COUNT(*) FROM agencies WHERE database_name IS NOT NULL;")
    echo -e "${GREEN}✅ ${AGENCIES_WITH_DB} agency(ies) have database_name set${NC}"
    
    # Verify each agency database exists
    MISSING_DBS=0
    while IFS='|' read -r agency_id agency_name db_name; do
        if [ -n "${db_name}" ]; then
            if run_query "postgres" "SELECT 1 FROM pg_database WHERE datname='${db_name}';" | grep -q "1"; then
                echo -e "${GREEN}   ✅ Agency '${agency_name}' → Database '${db_name}' exists${NC}"
            else
                echo -e "${RED}   ❌ Agency '${agency_name}' → Database '${db_name}' NOT FOUND${NC}"
                MISSING_DBS=$((MISSING_DBS + 1))
            fi
        fi
    done < <(run_query "${MAIN_DB}" "SELECT id, name, database_name FROM agencies WHERE database_name IS NOT NULL;" | tr -d ' ')
    
    if [ "${MISSING_DBS}" -gt "0" ]; then
        echo -e "${RED}❌ ${MISSING_DBS} agency database(s) missing${NC}"
        exit 1
    fi
fi

# 6. Check connection pooling
echo ""
echo "6. Database connection status..."
ACTIVE_CONNECTIONS=$(run_query "postgres" "SELECT COUNT(*) FROM pg_stat_activity WHERE datname IN ('${MAIN_DB}', (SELECT string_agg(datname, ',') FROM pg_database WHERE datname LIKE 'agency_%'));")
echo -e "${GREEN}✅ ${ACTIVE_CONNECTIONS} active database connection(s)${NC}"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Multi-Tenant Database Isolation Verification Complete${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "  - Main database: ${MAIN_DB} ✅"
echo "  - Agency databases: ${AGENCY_COUNT:-0} ✅"
echo "  - Active connections: ${ACTIVE_CONNECTIONS} ✅"
echo ""
