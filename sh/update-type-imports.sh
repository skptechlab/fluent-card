#!/bin/bash
# update-type-imports.sh
# Purpose: Update and organize type imports across the project
# Usage: ./sh/update-type-imports.sh

echo "🔍 Starting type import update..."

# Define color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define domains
DOMAINS=(
  "editor"
  "printer"
  "user"
  "datasource"
  "database"
)

# Function to check if a file uses old type imports
check_imports() {
  local file=$1
  local domain=$2
  if grep -q "from '@/types/${domain}/.*'" "$file"; then
    echo -e "${YELLOW}Found old imports in ${file}${NC}"
    return 0
  fi
  return 1
}

# Function to update imports for a domain
update_domain_imports() {
  local domain=$1
  echo -e "${GREEN}Updating imports for ${domain} domain...${NC}"

  # Find all TypeScript files
  find ./src -type f \( -name "*.js" -o -name "*.jsx" \) | while read -r file; do
    if check_imports "$file" "$domain"; then
      # Update imports to use central domain exports
      sed -i.bak "s|from '@/types/${domain}/.*'|from '@/types/domains/${domain}'|g" "$file"
      rm "${file}.bak"
      echo -e "  ✅ Updated imports in ${file}"
    fi
  done
}

# Function to validate TypeScript files
validate_typescript() {
  echo -e "${GREEN}Validating TypeScript files...${NC}"
  if ! npx tsc --noEmit; then
    echo -e "${RED}TypeScript validation failed!${NC}"
    exit 1
  fi
  echo -e "✅ TypeScript validation passed"
}

# Function to check import organization
check_import_organization() {
  echo -e "${GREEN}Checking import organization...${NC}"
  
  # Use eslint or prettier if configured
  if [ -f ".eslintrc" ]; then
    npx eslint --fix ./src/**/*.{ts,tsx}
  elif [ -f ".prettierrc" ]; then
    npx prettier --write ./src/**/*.{ts,tsx}
  fi
}

# Function to generate import report
generate_report() {
  echo -e "${GREEN}Generating import report...${NC}"
  report_file="type-import-report.md"

  echo "# Type Import Report" > "$report_file"
  echo "Generated at $(date)" >> "$report_file"
  echo "" >> "$report_file"

  for domain in "${DOMAINS[@]}"; do
    echo "## ${domain^} Domain" >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    grep -r "from '@/types/domains/${domain}'" ./src | sort | uniq >> "$report_file"
    echo "\`\`\`" >> "$report_file"
    echo "" >> "$report_file"
  done

  echo -e "📝 Report generated: ${report_file}"
}

# Main execution
echo "🚀 Starting type import update process..."

# Update imports for each domain
for domain in "${DOMAINS[@]}"; do
  update_domain_imports "$domain"
done

# Validate TypeScript
validate_typescript

# Check import organization
check_import_organization

# Generate report
generate_report

echo -e "${GREEN}✨ Type import update completed!${NC}"

# Final checks
echo "
📋 Final Checklist:
1. Check type-import-report.md for overview
2. Run tests to verify changes
3. Review TypeScript errors (if any)
4. Commit changes with message: 'chore: update type imports'
"