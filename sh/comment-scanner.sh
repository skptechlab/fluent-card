#!/bin/bash

# File: comment-checker.sh
# Purpose: Check TypeScript files for required comment headers and generate a markdown report
# Usage: ./comment-checker.sh [directory] (defaults to src/ folder)
# Dependencies: bash, grep, find

# Configuration - these are the expected comment headers
EXPECTED_HEADERS=(
  "Dependencies:"
  "Purpose:"
  "Usage:"
  "Notes:"
)

# Default to src directory if none provided
TARGET_DIR="${1:-src}"

# Output file for the markdown report
OUTPUT_FILE="comment_check_report.md"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to check if a file has the required headers
check_file_headers() {
  local file="$1"
  local missing_headers=()
  local has_all_headers=true
  local has_file_path=false
  
  # Check if file is empty or not readable
  if [[ ! -s "$file" || ! -r "$file" ]]; then
    echo "Empty or unreadable file: $file"
    return 1
  fi
  
  # Read the first few lines of the file (let's check the first 15 lines to ensure we capture all headers)
  local header_section=$(head -n 15 "$file")
  
  # First check if there's a direct file path comment at the top
  if echo "$header_section" | grep -q "^// $TARGET_DIR/"; then
    has_file_path=true
  # Also check for the old format with "File:" prefix
  elif echo "$header_section" | grep -q "^// File:"; then
    has_file_path=true
  fi
  
  # If no file path is found, mark it as missing
  if ! $has_file_path; then
    missing_headers+=("File path")
    has_all_headers=false
  fi
  
  # Check each expected header
  for header in "${EXPECTED_HEADERS[@]}"; do
    if ! echo "$header_section" | grep -q "^// $header"; then
      missing_headers+=("$header")
      has_all_headers=false
    fi
  done
  
  # Return results
  if $has_all_headers; then
    echo -e "${GREEN}✓${NC} $file - All headers present"
    echo "✓|$file|All headers present" >> "$OUTPUT_FILE"
  else
    echo -e "${RED}✗${NC} $file - Missing: ${YELLOW}${missing_headers[*]}${NC}"
    echo "✗|$file|Missing: ${missing_headers[*]}" >> "$OUTPUT_FILE"
  fi
}

# Initialize report
echo "# TypeScript Files Comment Format Check Report" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Add placeholder for summary stats (will be updated at the end)
echo "## Overall Summary" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "_Summary statistics will be inserted here_" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "## Detailed Results" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Status|File|Details" >> "$OUTPUT_FILE"
echo "----|----|-----------" >> "$OUTPUT_FILE"

# Counter variables
total_files=0
compliant_files=0

echo "Scanning TypeScript files in directory: $TARGET_DIR"
echo "Checking for required headers: File path and ${EXPECTED_HEADERS[*]}"
echo ""

# Find TypeScript files (.ts and .tsx) in the src directory
while IFS= read -r file; do
  # Only process TypeScript files that exist, are not empty and are readable
  if [[ -f "$file" && -s "$file" && -r "$file" ]]; then
    total_files=$((total_files + 1))
    
    # Check if this file has proper headers
    if check_file_headers "$file"; then
      compliant_files=$((compliant_files + 1))
    fi
  fi
done < <(find "$TARGET_DIR" -type f \( -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/.next/*" \
  -not -path "*/coverage/*")

# Update the summary section in the markdown file
summary="- Total files scanned: $total_files\n"
summary+="- Files with complete headers: $compliant_files\n"
summary+="- Files missing headers: $((total_files - compliant_files))\n"
if [ "$total_files" -gt 0 ]; then
  summary+="- Compliance rate: $(( (compliant_files * 100) / total_files ))%\n"
else
  summary+="- Compliance rate: N/A (no files scanned)\n"
fi

# Replace the placeholder with actual summary stats
sed -i.bak "s/_Summary statistics will be inserted here_/$summary/" "$OUTPUT_FILE"
rm -f "$OUTPUT_FILE.bak"

echo ""
echo "Report generated: $OUTPUT_FILE"
echo ""
echo "Summary:"
echo "- Total files scanned: $total_files"
echo "- Files with complete headers: $compliant_files"
echo "- Files missing headers: $((total_files - compliant_files))"
echo "- Compliance rate: $(( (compliant_files * 100) / total_files ))%"