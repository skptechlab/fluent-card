#!/bin/bash
# prepare-scripts.sh
# Purpose: Make cleanup scripts executable
# Usage: ./sh/prepare-scripts.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Making cleanup scripts executable...${NC}"

# Make scripts executable
chmod +x sh/check-imports.sh
chmod +x sh/remove-old-types.sh

# Verify permissions
if [ -x "sh/check-imports.sh" ] && [ -x "sh/remove-old-types.sh" ]; then
    echo -e "${GREEN}Scripts are now executable${NC}"
    
    echo -e "\n${YELLOW}Running import check for admin domain...${NC}"
    ./sh/check-imports.sh admin
    
    if [ $? -eq 0 ]; then
        echo -e "\n${YELLOW}Running type cleanup for admin domain...${NC}"
        ./sh/remove-old-types.sh admin
    else
        echo -e "${RED}Import check failed. Please fix remaining imports before proceeding${NC}"
        exit 1
    fi
else
    echo -e "${RED}Failed to make scripts executable${NC}"
    exit 1
fi