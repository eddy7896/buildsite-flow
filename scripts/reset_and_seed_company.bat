@echo off
REM ============================================================================
REM Reset and Seed TechStream Solutions Company Data (Windows)
REM ============================================================================
REM This script deletes all existing departments and seeds a new company structure
REM 
REM Usage: scripts\reset_and_seed_company.bat
REM ============================================================================

echo ============================================================================
echo TechStream Solutions - Company Data Reset ^& Seed
echo ============================================================================
echo.

REM Database connection details
set DB_NAME=buildflow_db
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

REM Check if database exists
echo Checking database connection...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Cannot connect to database!
    echo        Please ensure PostgreSQL is running and credentials are correct.
    exit /b 1
)

echo [OK] Database connection successful
echo.

REM Step 1: Delete existing departments
echo Step 1: Deleting existing departments and related data...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f scripts\delete_all_departments.sql

if errorlevel 1 (
    echo [ERROR] Failed to delete existing data
    exit /b 1
)

echo [OK] Existing data deleted successfully
echo.

REM Step 2: Seed new company
echo Step 2: Seeding new company structure...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f scripts\seed_new_company.sql

if errorlevel 1 (
    echo [ERROR] Failed to seed new data
    exit /b 1
)

echo [OK] New company data seeded successfully
echo.
echo ============================================================================
echo [SUCCESS] Company reset and seed completed successfully!
echo ============================================================================
echo.
echo Summary:
echo    - All existing departments deleted
echo    - New company structure created
echo    - 9 departments with 42 employees
echo.
echo Login Credentials:
echo    - Default password for all users: password123
echo    - See TECHSTREAM_COMPANY_STRUCTURE.md for full list
echo.
echo Quick Test:
echo    - CEO: ceo@techstream.com / password123
echo    - HR Director: hr.director@techstream.com / password123
echo    - CTO: cto@techstream.com / password123
echo.

pause
