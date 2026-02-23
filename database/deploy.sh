#!/bin/bash

# ============================================================================
# Farther Prism - Database Deployment Script
# Version: 1.0.0
# Date: 2026-02-23
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME=${DB_NAME:-"farther_prism"}
DB_USER=${DB_USER:-"prism_api"}
DB_PASSWORD=${DB_PASSWORD:-"changeme"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
SCHEMA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/schema"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_postgres() {
    log_info "Checking PostgreSQL connection..."
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c '\q' 2>/dev/null; then
        log_error "Cannot connect to PostgreSQL at $DB_HOST:$DB_PORT"
        log_error "Make sure PostgreSQL is running and credentials are correct"
        exit 1
    fi
    log_info "PostgreSQL connection successful"
}

check_extensions() {
    log_info "Checking required extensions..."
    
    extensions=("uuid-ossp" "pgcrypto" "btree_gin")
    for ext in "${extensions[@]}"; do
        if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            -c "SELECT 1 FROM pg_extension WHERE extname='$ext'" | grep -q 1 2>/dev/null; then
            log_warn "Extension $ext not found, will be created"
        else
            log_info "Extension $ext already installed"
        fi
    done
}

create_database() {
    log_info "Creating database '$DB_NAME'..."
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
        -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        log_warn "Database '$DB_NAME' already exists"
        read -p "Drop and recreate? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            log_info "Dropping database '$DB_NAME'..."
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
                -c "DROP DATABASE $DB_NAME;"
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
                -c "CREATE DATABASE $DB_NAME;"
            log_info "Database recreated"
        else
            log_info "Using existing database"
        fi
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
            -c "CREATE DATABASE $DB_NAME;"
        log_info "Database created"
    fi
}

run_sql_file() {
    local file=$1
    local description=$2
    
    log_info "Running $description..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"; then
        log_info "$description completed successfully"
    else
        log_error "$description failed"
        exit 1
    fi
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check table count
    table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")
    
    log_info "Tables created: $table_count"
    
    if [ "$table_count" -lt 30 ]; then
        log_error "Expected at least 30 tables, found $table_count"
        exit 1
    fi
    
    # Check view count
    view_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public'")
    
    log_info "Views created: $view_count"
    
    # Check function count
    function_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace")
    
    log_info "Functions created: $function_count"
    
    log_info "✓ Deployment verified successfully"
}

# Main deployment flow
main() {
    echo "============================================================================"
    echo "  Farther Prism - Database Deployment"
    echo "============================================================================"
    echo ""
    echo "Configuration:"
    echo "  Database: $DB_NAME"
    echo "  User:     $DB_USER"
    echo "  Host:     $DB_HOST"
    echo "  Port:     $DB_PORT"
    echo ""
    
    # Check prerequisites
    check_postgres
    
    # Create database
    create_database
    
    # Check extensions
    check_extensions
    
    # Deploy schema files
    run_sql_file "$SCHEMA_DIR/01-core-schema.sql" "Core Schema (Identity, Accounts, Cash Flow)"
    run_sql_file "$SCHEMA_DIR/02-planning-schema.sql" "Planning Schema (Tax, Plans, Runs)"
    run_sql_file "$SCHEMA_DIR/03-views-functions.sql" "Views, Functions & Triggers"
    
    # Optional: Load seed data
    read -p "Load seed data? (yes/no): " load_seed
    if [ "$load_seed" = "yes" ]; then
        run_sql_file "$SCHEMA_DIR/04-seed-data.sql" "Seed Data (Tax Rules, Sample Household)"
    else
        log_info "Skipping seed data"
    fi
    
    # Verify
    verify_deployment
    
    echo ""
    echo "============================================================================"
    echo "  Deployment Complete!"
    echo "============================================================================"
    echo ""
    echo "Next steps:"
    echo "  1. Update application connection string:"
    echo "     postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    echo ""
    echo "  2. Run migrations (if using a framework):"
    echo "     npm run migrate"
    echo ""
    echo "  3. Start your application:"
    echo "     npm start"
    echo ""
}

# Run main function
main
