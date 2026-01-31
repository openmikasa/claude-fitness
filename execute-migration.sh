#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                Database Migration Instructions               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}To run the migration, please follow these steps:${NC}"
echo ""
echo -e "${GREEN}1.${NC} Go to your Supabase Dashboard SQL Editor:"
echo -e "   https://supabase.com/dashboard/project/eufogieqwgqdbadvqate/sql"
echo ""
echo -e "${GREEN}2.${NC} Copy and paste the following SQL:"
echo -e "   ${BLUE}────────────────────────────────────────────────────────────${NC}"
cat supabase/migrations/005_restrict_to_strength_only.sql
echo -e "   ${BLUE}────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${GREEN}3.${NC} Click 'Run' to execute the migration"
echo ""
echo -e "${YELLOW}What this migration does:${NC}"
echo -e "   • Adds a CHECK constraint to only allow 'strength' workouts"
echo -e "   • Removes the workout_type index (no longer needed)"
echo -e "   • Preserves all existing data in the database"
echo ""
