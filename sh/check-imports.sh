#!/bin/bash
# check-imports.sh
# Purpose: Check for remaining old type imports
# Usage: ./sh/check-imports.sh admin

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if domain argument is provided
if [ -z "$1" ]; then
  echo -e "${RED}Please provide a domain name to check (e.g., admin)${NC}"
  exit 1
fi

DOMAIN=$1
echo -e "${GREEN}Checking for old imports from @/types/${DOMAIN}${NC}"

# Create results directory if it doesn't exist
mkdir -p .type-check-results

# Output file
RESULTS=".type-check-results/${DOMAIN}-imports.txt"
echo "Import Check Results for @/types/${DOMAIN}" > "$RESULTS"
echo "$(date)" >> "$RESULTS"
echo "----------------------------------------" >> "$RESULTS"

# Function to check imports
check_imports() {
  local pattern=$1
  local description=$2
  
  echo -e "\n${YELLOW}Checking $description...${NC}"
  echo -e "\n$description:" >> "$RESULTS"
  
  # Find matching imports
  FOUND=$(grep -r "$pattern" src/ 2>/dev/null || true)
  
  if [ -n "$FOUND" ]; then
    echo -e "${RED}Found old imports:${NC}"
    echo "$FOUND"
    echo "$FOUND" >> "$RESULTS"
  else
    echo -e "${GREEN}No old imports found${NC}"
    echo "No imports found" >> "$RESULTS"
  fi
}

# Check different import patterns
check_imports "from '@/types/${DOMAIN}" "Direct imports"
check_imports "import type.*from '@/types/${DOMAIN}" "Type imports"
check_imports "import.*{.*}.*from '@/types/${DOMAIN}" "Named imports"
check_imports "@/types/${DOMAIN}" "Type references"

echo -e "\n${GREEN}Results saved to ${RESULTS}${NC}"
echo -e "${YELLOW}Please review the results before removing any directories${NC}"

# Count total findings
TOTAL=$(grep -c "from '@/types/${DOMAIN}" src/ 2>/dev/null || echo "0")
echo -e "\n${GREEN}Summary:${NC}"
echo "Total files with old imports: $TOTAL"
echo -e "----------------------------------------" >> "$RESULTS"
echo "Total files with old imports: $TOTAL" >> "$RESULTS"

# If any imports found, exit with error code
if [ "$TOTAL" -gt 0 ]; then
  exit 1
fi

exit 0