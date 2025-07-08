#!/bin/bash
# remove-old-types.sh
# Purpose: Safely remove old type directories after verifying migrations
# Usage: ./sh/remove-old-types.sh admin

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if domain argument is provided
if [ -z "$1" ]; then
  echo -e "${RED}Please provide a domain name to remove (e.g., admin)${NC}"
  exit 1
fi

DOMAIN=$1
OLD_PATH="src/types/${DOMAIN}"
NEW_PATH="src/types/domains/${DOMAIN}"
BACKUP_PATH=".type-backup/${DOMAIN}"

echo -e "${YELLOW}Starting removal process for ${DOMAIN} types${NC}"

# Check if new domain types exist
if [ ! -d "$NEW_PATH" ]; then
  echo -e "${RED}Error: New domain types not found at ${NEW_PATH}${NC}"
  echo "Please ensure types have been migrated before removal"
  exit 1
fi

# Check for old imports
echo -e "\n${YELLOW}Checking for remaining imports...${NC}"
if ! ./sh/check-imports.sh "$DOMAIN"; then
  echo -e "${RED}Error: Found remaining imports from old location${NC}"
  echo "Please update all imports before removing directory"
  exit 1
fi

# Run TypeScript checks
echo -e "\n${YELLOW}Running TypeScript checks...${NC}"
if ! npm run type-check; then
  echo -e "${RED}Error: TypeScript check failed${NC}"
  echo "Please fix type errors before proceeding"
  exit 1
fi

# Create backup
echo -e "\n${YELLOW}Creating backup...${NC}"
if [ -d "$OLD_PATH" ]; then
  mkdir -p "$BACKUP_PATH"
  cp -r "$OLD_PATH"/* "$BACKUP_PATH/"
  echo -e "${GREEN}Backup created at ${BACKUP_PATH}${NC}"
else
  echo -e "${RED}Error: Old type directory not found at ${OLD_PATH}${NC}"
  exit 1
fi

# Remove old directory
echo -e "\n${YELLOW}Removing old type directory...${NC}"
rm -rf "$OLD_PATH"

# Verify removal
if [ ! -d "$OLD_PATH" ]; then
  echo -e "${GREEN}Successfully removed ${OLD_PATH}${NC}"
else
  echo -e "${RED}Error: Failed to remove ${OLD_PATH}${NC}"
  exit 1
fi

# Run final TypeScript check
echo -e "\n${YELLOW}Running final TypeScript check...${NC}"
if ! npm run type-check; then
  echo -e "${RED}Error: Post-removal TypeScript check failed${NC}"
  echo "Restoring from backup..."
  rm -rf "$OLD_PATH"
  mkdir -p "$OLD_PATH"
  cp -r "$BACKUP_PATH"/* "$OLD_PATH/"
  echo "Restored from backup"
  exit 1
fi

echo -e "\n${GREEN}Successfully removed ${DOMAIN} types${NC}"
echo "Backup location: ${BACKUP_PATH}"
echo -e "${YELLOW}Note: Backup will be kept for 7 days${NC}"

# Add cleanup job to crontab if not exists
if ! crontab -l | grep -q "rm -rf ${BACKUP_PATH}"; then
  (crontab -l 2>/dev/null; echo "0 0 +7 * * rm -rf ${BACKUP_PATH}") | crontab -
fi

exit 0