#!/bin/bash
# fix_foreign_keys.sh
# Script to fix foreign key issues in the database

echo "======================================================"
echo "      Property Management Database FK Repair Tool     "
echo "======================================================"

# Check if we have a DATABASE_URL environment variable
if [ -z "$DATABASE_URL" ]; then
    # Try to load from .env file
    if [ -f ./backend/.env ]; then
        source ./backend/.env
    fi
fi

# Check again if we have the DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable not set."
    echo "Please set the DATABASE_URL environment variable or provide a database URL as an argument."
    echo "Usage: $0 [database-url]"
    exit 1
fi

# If an argument is provided, use it instead of DATABASE_URL
if [ ! -z "$1" ]; then
    DATABASE_URL=$1
fi

# Check if it's a PostgreSQL URL
if [[ "$DATABASE_URL" != postgresql://* ]]; then
    echo "WARNING: This script is designed for PostgreSQL databases."
    echo "Your DATABASE_URL doesn't look like a PostgreSQL connection string."
    read -p "Continue anyway? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        exit 1
    fi
fi

echo "Checking database connection..."
if command -v psql &> /dev/null; then
    # Extract connection details from DATABASE_URL
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    # Create a temporary connection credentials file
    PGPASSFILE=$(mktemp)
    echo "$DB_HOST:$DB_PORT:$DB_NAME:$DB_USER:$DB_PASS" > $PGPASSFILE
    export PGPASSFILE
    
    echo "Testing database connection..."
    if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
        echo "ERROR: Failed to connect to the database."
        echo "Please check your connection details."
        rm $PGPASSFILE
        exit 1
    fi
    
    echo "Connection successful."
    echo "Checking for foreign key issues..."
    
    # List tables
    TABLES=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
    
    # Fix each table
    for TABLE in $TABLES; do
        echo "Checking table: $TABLE"
        
        # Get foreign keys for this table
        FK_CONSTRAINTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
            SELECT
                tc.constraint_name, tc.table_name, kcu.column_name, 
                ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
            FROM 
                information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE 
                tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '$TABLE';
        ")
        
        if [ -z "$FK_CONSTRAINTS" ]; then
            echo "  No foreign keys found."
            continue
        fi
        
        # Process each foreign key
        echo "$FK_CONSTRAINTS" | while read CONSTRAINT; do
            if [ -z "$CONSTRAINT" ]; then
                continue
            fi
            
            # Parse constraint details
            CONSTRAINT_NAME=$(echo $CONSTRAINT | awk '{print $1}')
            COLUMN_NAME=$(echo $CONSTRAINT | awk '{print $3}')
            REF_TABLE=$(echo $CONSTRAINT | awk '{print $4}')
            REF_COLUMN=$(echo $CONSTRAINT | awk '{print $5}')
            
            echo "  Checking constraint: $CONSTRAINT_NAME ($COLUMN_NAME -> $REF_TABLE.$REF_COLUMN)"
            
            # Find rows with dangling references
            INVALID_ROWS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
                SELECT COUNT(*) FROM $TABLE t 
                WHERE t.$COLUMN_NAME IS NOT NULL 
                AND NOT EXISTS (
                    SELECT 1 FROM $REF_TABLE r 
                    WHERE r.$REF_COLUMN = t.$COLUMN_NAME
                );
            ")
            
            if [ "$INVALID_ROWS" -gt 0 ]; then
                echo "  Found $INVALID_ROWS rows with invalid references."
                
                # Ask user what to do
                echo "  Options:"
                echo "    1. Set invalid references to NULL"
                echo "    2. Delete rows with invalid references"
                echo "    3. Skip this constraint"
                read -p "  Choose an option (1/2/3): " choice
                
                case $choice in
                    1)
                        echo "  Setting invalid references to NULL..."
                        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
                            UPDATE $TABLE t
                            SET $COLUMN_NAME = NULL
                            WHERE t.$COLUMN_NAME IS NOT NULL 
                            AND NOT EXISTS (
                                SELECT 1 FROM $REF_TABLE r 
                                WHERE r.$REF_COLUMN = t.$COLUMN_NAME
                            );
                        "
                        echo "  Fixed by setting values to NULL."
                        ;;
                    2)
                        echo "  Deleting rows with invalid references..."
                        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
                            DELETE FROM $TABLE t
                            WHERE t.$COLUMN_NAME IS NOT NULL 
                            AND NOT EXISTS (
                                SELECT 1 FROM $REF_TABLE r 
                                WHERE r.$REF_COLUMN = t.$COLUMN_NAME
                            );
                        "
                        echo "  Fixed by deleting invalid rows."
                        ;;
                    3)
                        echo "  Skipping this constraint."
                        ;;
                    *)
                        echo "  Invalid choice. Skipping this constraint."
                        ;;
                esac
            else
                echo "  No issues found with this constraint."
            fi
        done
    done
    
    # Clean up
    rm $PGPASSFILE
    
    echo "Database check completed."
else
    echo "ERROR: psql command not found."
    echo "Please install PostgreSQL client tools."
    exit 1
fi

echo "======================================================"
echo "                Process Completed                    "
echo "======================================================"
