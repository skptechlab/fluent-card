#!/bin/bash

# File: doc-gen.sh
# Purpose: Generate clean, structured Markdown documentation for PHP and JavaScript projects
# Usage: ./doc-gen.sh [directory] (defaults to src/ folder)
# Dependencies: bash, grep, find, sed, ulimit

# Increase stack size to prevent segmentation faults with deep recursion
ulimit -s 8192

# Enable error handling
set -o pipefail

# Configuration
OUTPUT_FILE="memory-bank/codebase-overview.md"
TARGET_DIR="${1:-.}"
ROOT_DIR=$(pwd)
TEMP_TOC="/tmp/toc_$.tmp"
TEMP_CONTENT="/tmp/content_$.tmp"
TOTAL_FILES=0
PROCESSED_FILES=0
TOTAL_DIRS=0
PROCESSED_DIRS=0

# Clear temp files if they exist
> "$TEMP_TOC"
> "$TEMP_CONTENT"

# Function to display progress
show_progress() {
  local percent=$1
  local bar_size=50
  local filled=$((percent * bar_size / 100))
  local empty=$((bar_size - filled))
  
  # Create the progress bar
  printf "\r["
  printf "%${filled}s" "" | tr ' ' '='
  printf ">"
  printf "%${empty}s" "" | tr ' ' ' '
  printf "] %3d%% " "$percent"
  
  # Add details about files/directories
  printf "(Files: %d/%d, Dirs: %d/%d)" "$PROCESSED_FILES" "$TOTAL_FILES" "$PROCESSED_DIRS" "$TOTAL_DIRS"
}

# Calculate total files and directories for progress tracking
calculate_totals() {
  echo "Calculating project size..."
  TOTAL_FILES=$(find "$ROOT_DIR/$TARGET_DIR" -type f \( -name "*.js" -o -name "*.php" \) 2>/dev/null | wc -l)
  TOTAL_DIRS=$(find "$ROOT_DIR/$TARGET_DIR" -type d 2>/dev/null | wc -l)
  echo "Found $TOTAL_FILES PHP and JavaScript files in $TOTAL_DIRS directories"
}

# Function to sanitize strings for use as anchor names
sanitize_anchor() {
  local text="$1"
  # Replace slashes, spaces and special chars with hyphens, convert to lowercase
  echo "$text" | sed 's/[\/\\ ]/-/g' | tr -cd 'a-zA-Z0-9-' | tr '[:upper:]' '[:lower:]'
}

# Function to count lines of code in a file
count_lines_of_code() {
  local file="$1"
  
  # Handle PHP files differently than JS files
  if [[ "$file" == *.php ]]; then
    # Count non-empty, non-comment lines for PHP
    grep -v '^\s*$' "$file" | grep -v '^\s*\/\/' | grep -v '^\s*\/\*' | grep -v '^\s*\*' | grep -v '^\s*\*\/' | grep -v '^\s*<\?php \/\/' | wc -l
  else
    # Count non-empty, non-comment lines for JS
    grep -v '^\s*$' "$file" | grep -v '^\s*//' | wc -l
  fi
}

# Function to count import statements
count_imports() {
  local file="$1"
  
  # Handle PHP files differently than JS files
  if [[ "$file" == *.php ]]; then
    # Count require/include statements for PHP
    grep -c -E '(require|include|require_once|include_once|use)' "$file"
  else
    # Count import statements for JS
    grep -c "^\s*import " "$file"
  fi
}

# Function to categorize file complexity
categorize_file_complexity() {
  local size_kb="$1"
  local lines="$2"
  local imports="$3"
  
  # Define thresholds
  local small_size=5       # Files under 5KB are small
  local medium_size=20    # Files under 15KB are medium
  local small_lines=500    # Files under 100 lines are small
  local medium_lines=1000   # Files under 300 lines are medium
  local many_imports=10    # More than 10 imports is high
  
  # Calculate complexity score (0-10)
  local score=0
  
  # Size based score (0-4)
  if [ "$size_kb" -lt "$small_size" ]; then
    score=$((score + 0))
  elif [ "$size_kb" -lt "$medium_size" ]; then
    score=$((score + 2))
  else
    score=$((score + 4))
  fi
  
  # Lines of code based score (0-4)
  if [ "$lines" -lt "$small_lines" ]; then
    score=$((score + 0))
  elif [ "$lines" -lt "$medium_lines" ]; then
    score=$((score + 2))
  else
    score=$((score + 4))
  fi
  
  # Import complexity based score (0-2)
  if [ "$imports" -gt "$many_imports" ]; then
    score=$((score + 2))
  else
    score=$((score + 0))
  fi
  
  # Determine complexity category
  if [ "$score" -lt "3" ]; then
    echo "🟢 Simple"
  elif [ "$score" -lt "7" ]; then
    echo "🟠 Moderate"
  else
    echo "🔴 Complex"
  fi
}

# Function to extract multiline comments
extract_multiline_comment() {
  local file="$1"
  local pattern="$2"
  local result=""
  local capture=0
  local line=""
  
  # Read file line by line
  while IFS= read -r line; do
    # Handle PHP files differently
    if [[ "$file" == *.php ]]; then
      # Check if this is the start of our target comment in PHP
      if [[ "$line" =~ ^(\<\?php)?\ *//\ *$pattern: ]]; then
        # Start capturing, but skip the initial pattern line
        capture=1
        # Extract content from the first line if there is any
        first_content=$(echo "$line" | sed "s|^<?php[ ]*// $pattern: *||" | sed "s|^// $pattern: *||")
        if [ -n "$first_content" ]; then
          result+="$first_content\n"
        fi
        continue
      fi
    else
      # Check if this is the start of our target comment in JS
      if [[ "$line" =~ ^//\ *$pattern: ]]; then
        # Start capturing, but skip the initial pattern line
        capture=1
        # Extract content from the first line if there is any
        first_content=$(echo "$line" | sed "s|^// $pattern: *||")
        if [ -n "$first_content" ]; then
          result+="$first_content\n"
        fi
        continue
      fi
    fi
    
    # If we're capturing and hit another comment pattern, stop
    if [ $capture -eq 1 ] && [[ "$line" =~ ^(\<\?php)?\ *//\ *[A-Za-z]+: ]]; then
      # Stop if we hit another comment pattern
      break
    elif [ $capture -eq 1 ] && [[ "$line" =~ ^(\<\?php)?\ *// ]]; then
      # Still capturing, add this line (removing the comment prefix)
      content=$(echo "$line" | sed 's|^<?php[ ]*// *||' | sed 's|^// *||')
      result+="$content\n"
    elif [ $capture -eq 1 ]; then
      # If we hit a non-comment line, stop capturing
      break
    fi
  done < "$file"
  
  # Remove trailing newline and return
  echo -e "$result" | sed '$ s/\\n$//'
}

# Function to extract the core intent of a comment
extract_comment() {
  local file="$1"
  local pattern="$2"
  local max_length="$3"
  local result=""
  
  # Check file type and extract accordingly
  if [[ "$file" == *.php ]]; then
    # For PHP files
    result=$(grep -m 1 "^<?php // $pattern:" "$file" | sed "s|^<?php // $pattern: *||")
    
    # If not found with PHP tag, try without
    if [ -z "$result" ]; then
      result=$(grep -m 1 "^// $pattern:" "$file" | sed "s|^// $pattern: *||")
    fi
  else
    # For JS files - first try exact match
    result=$(grep -m 1 "^// $pattern:" "$file" | sed "s|^// $pattern: *||")
    
    # If not found, try without colon
    if [ -z "$result" ]; then
      # Special case for file path in first line
      if [ "$pattern" = "File" ]; then
        result=$(head -n 1 "$file" | sed 's|^// ||')
      else
        result=$(grep -m 1 "^// $pattern" "$file" | sed "s|^// $pattern *||")
      fi
    fi
  fi
  
  # Trim if needed and add ellipsis
  if [ -n "$result" ] && [ -n "$max_length" ] && [ ${#result} -gt $max_length ]; then
    result="${result:0:$max_length}..."
  fi
  
  echo "$result"
}

# Function to extract filename from comment or path
get_file_info() {
  local file="$1"
  local basename=$(basename "$file")
  local comment_path=""
  
  # Extract differently based on file type
  if [[ "$file" == *.php ]]; then
    comment_path=$(extract_comment "$file" "File")
    
    # Look for file info in the first line if not found
    if [ -z "$comment_path" ]; then
      first_line=$(head -n 1 "$file" | grep "^<?php //")
      if [[ "$first_line" =~ [a-zA-Z0-9_\-/]+\.(php) ]]; then
        comment_path="${BASH_REMATCH[0]}"
      fi
    fi
  else
    comment_path=$(extract_comment "$file" "File")
    
    # Look for file info in the first line if not found
    if [ -z "$comment_path" ]; then
      first_line=$(head -n 1 "$file" | grep "^//")
      if [[ "$first_line" =~ [a-zA-Z0-9_\-/]+\.(js) ]]; then
        comment_path="${BASH_REMATCH[0]}"
      fi
    fi
  fi
  
  # Return the basename and commented path if available
  if [ -n "$comment_path" ]; then
    echo "$basename|$comment_path"
  else
    echo "$basename|"
  fi
}

# Function to count PHP and JS files in a directory
count_php_js_files() {
  local dir="$1"
  find "$dir" -maxdepth 1 -type f \( -name "*.js" -o -name "*.php" \) | wc -l
}

# Function to process a directory
process_directory() {
  local dir="$1"
  local depth="$2"
  local parent_path="${dir#$ROOT_DIR/}"
  
  # Increment processed directories counter
  PROCESSED_DIRS=$((PROCESSED_DIRS + 1))
  
  # Calculate progress percentage
  local progress=0
  if [ "$TOTAL_DIRS" -gt 0 ]; then
    progress=$((PROCESSED_DIRS * 100 / TOTAL_DIRS))
  fi
  show_progress "$progress"
  
  # Skip if no PHP or JS files in this directory
  local file_count=$(count_php_js_files "$dir")
  local dir_has_content=0
  
  # Check if any subdirectories have PHP or JS files
  while IFS= read -r subdir; do
    local subdir_count=$(find "$subdir" -type f \( -name "*.js" -o -name "*.php" \) | wc -l)
    if [ "$subdir_count" -gt 0 ]; then
      dir_has_content=1
      break
    fi
  done < <(find "$dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null || true)
  
  # Skip if directory and all subdirectories have no PHP or JS files
  if [ "$file_count" -eq 0 ] && [ "$dir_has_content" -eq 0 ]; then
    return
  fi
  
  # Calculate heading level based on directory depth
  local heading="#"
  for ((i=1; i<depth; i++)); do
    heading="${heading}#"
  done
  
  # Format the directory name for the heading
  local dir_name=$(basename "$dir")
  if [ "$dir" = "$ROOT_DIR/$TARGET_DIR" ]; then
    dir_name=$(basename "$TARGET_DIR")
  fi
  local dir_path="/$parent_path"
  
  # Create a unique anchor for this directory
  local dir_anchor=$(sanitize_anchor "${parent_path}")
  
  # Add to table of contents with the right indentation
  local toc_indent=""
  for ((i=2; i<depth; i++)); do
    toc_indent="${toc_indent}  "
  done
  
  # Add to TOC with file count and all subdirectory files
  local total_files=$(find "$dir" -type f \( -name "*.js" -o -name "*.php" \) | wc -l)
  echo "${toc_indent}- [${dir_name}/](#${dir_anchor}) (${total_files} files)" >> "$TEMP_TOC"
  
  # Add section heading with directory info
  echo "$heading ${dir_name}/ <a name=\"${dir_anchor}\"></a>" >> "$TEMP_CONTENT"
  echo "" >> "$TEMP_CONTENT"
  echo "**Path:** \`${dir_path}/\`" >> "$TEMP_CONTENT"
  echo "" >> "$TEMP_CONTENT"
  
  # Only show the table if there are actual PHP or JS files in this directory
  if [ "$file_count" -gt 0 ]; then
    # Add table with file information
    echo "| File | Purpose | Dependencies | Size | Complexity |" >> "$TEMP_CONTENT"
    echo "|------|---------|--------------|------|------------|" >> "$TEMP_CONTENT"
    
    # Process each PHP and JS file in this directory
    while IFS= read -r file; do
      # Get file information and metrics
      IFS='|' read -r basename comment_path <<< "$(get_file_info "$file")"
      purpose=$(extract_comment "$file" "Purpose" 100)
      dependencies=$(extract_comment "$file" "Dependencies" 80)
      size=$(du -k "$file" | cut -f1)
      size_kb="${size}"
      lines=$(count_lines_of_code "$file")
      imports=$(count_imports "$file")
      complexity=$(categorize_file_complexity "$size_kb" "$lines" "$imports")
      
      # Add to the table
      echo "| \`$basename\` | $purpose | $dependencies | ${size_kb}KB | $complexity |" >> "$TEMP_CONTENT"
      
      # Update progress
      PROCESSED_FILES=$((PROCESSED_FILES + 1))
      if [ "$TOTAL_FILES" -gt 0 ]; then
        local progress=$((PROCESSED_FILES * 100 / TOTAL_FILES))
        show_progress "$progress"
      fi
    done < <(find "$dir" -maxdepth 1 -type f \( -name "*.js" -o -name "*.php" \) | sort)
    
    echo "" >> "$TEMP_CONTENT"
    
    # Add collapsible details section for usage examples
    echo "<details>" >> "$TEMP_CONTENT"
    echo "<summary>Usage Examples</summary>" >> "$TEMP_CONTENT"
    echo "" >> "$TEMP_CONTENT"
    
    # Add usage examples for each file
    while IFS= read -r file; do
      basename=$(basename "$file")
      usage=$(extract_multiline_comment "$file" "Usage")
      notes=$(extract_comment "$file" "Notes")
      
      if [ -n "$usage" ]; then
        echo "**\`$basename\`**:" >> "$TEMP_CONTENT"
        echo "" >> "$TEMP_CONTENT"
        
        # Use appropriate code block language based on file type
        if [[ "$file" == *.php ]]; then
          echo '```php' >> "$TEMP_CONTENT"
        else
          echo '```javascript' >> "$TEMP_CONTENT"
        fi
        
        echo "$usage" >> "$TEMP_CONTENT" 
        echo '```' >> "$TEMP_CONTENT"
        
        if [ -n "$notes" ]; then
          echo "" >> "$TEMP_CONTENT"
          echo "*Note: $notes*" >> "$TEMP_CONTENT"
        fi
        
        echo "" >> "$TEMP_CONTENT"
      fi
    done < <(find "$dir" -maxdepth 1 -type f \( -name "*.js" -o -name "*.php" \) | sort)
    
    echo "</details>" >> "$TEMP_CONTENT"
    echo "" >> "$TEMP_CONTENT"
  fi
  
  # Process subdirectories recursively
  while IFS= read -r subdir; do
    process_directory "$subdir" $((depth + 1))
  done < <(find "$dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)
}

# Generate documentation header
cat > "$OUTPUT_FILE" << EOF
# Codebase Overview

**Generated:** $(date +"%Y-%m-%d %H:%M")  
**Project Root:** \`$(basename "$ROOT_DIR")\`  

This document provides an overview of the PHP and JavaScript codebase structure with key information about each module and file.

## Table of Contents

EOF

# First calculate the total files and directories
calculate_totals

# Generate the documentation
echo "Generating documentation for $TARGET_DIR..."
mkdir -p "$(dirname "$OUTPUT_FILE")"
process_directory "$ROOT_DIR/$TARGET_DIR" 2

# Clear the progress line
printf "\r%$(tput cols)s\r" ""

# Combine TOC and content
echo "Finalizing documentation..."
cat "$TEMP_TOC" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
cat "$TEMP_CONTENT" >> "$OUTPUT_FILE"

# Clean up temporary files
rm -f "$TEMP_TOC" "$TEMP_CONTENT"

echo -e "\nDocumentation generated: $OUTPUT_FILE"
echo "Processed $PROCESSED_FILES files across $PROCESSED_DIRS directories"#!/bin/bash

# File: doc-gen.sh
# Purpose: Generate clean, structured Markdown documentation for PHP and JavaScript projects
# Usage: ./doc-gen.sh [directory] (defaults to src/ folder)
# Dependencies: bash, grep, find, sed, ulimit

# Increase stack size to prevent segmentation faults with deep recursion
ulimit -s 8192

# Enable error handling
set -o pipefail

# Configuration
OUTPUT_FILE="memory-bank/codebase-overview.md"
TARGET_DIR="${1:-.}"
ROOT_DIR=$(pwd)
TEMP_TOC="/tmp/toc_$.tmp"
TEMP_CONTENT="/tmp/content_$.tmp"
TOTAL_FILES=0
PROCESSED_FILES=0
TOTAL_DIRS=0
PROCESSED_DIRS=0

# Clear temp files if they exist
> "$TEMP_TOC"
> "$TEMP_CONTENT"

# Function to display progress
show_progress() {
  local percent=$1
  local bar_size=50
  local filled=$((percent * bar_size / 100))
  local empty=$((bar_size - filled))
  
  # Create the progress bar
  printf "\r["
  printf "%${filled}s" "" | tr ' ' '='
  printf ">"
  printf "%${empty}s" "" | tr ' ' ' '
  printf "] %3d%% " "$percent"
  
  # Add details about files/directories
  printf "(Files: %d/%d, Dirs: %d/%d)" "$PROCESSED_FILES" "$TOTAL_FILES" "$PROCESSED_DIRS" "$TOTAL_DIRS"
}

# Calculate total files and directories for progress tracking
calculate_totals() {
  echo "Calculating project size..."
  TOTAL_FILES=$(find "$ROOT_DIR/$TARGET_DIR" -type f \( -name "*.js" -o -name "*.php" \) 2>/dev/null | wc -l)
  TOTAL_DIRS=$(find "$ROOT_DIR/$TARGET_DIR" -type d 2>/dev/null | wc -l)
  echo "Found $TOTAL_FILES PHP and JavaScript files in $TOTAL_DIRS directories"
}

# Function to sanitize strings for use as anchor names
sanitize_anchor() {
  local text="$1"
  # Replace slashes, spaces and special chars with hyphens, convert to lowercase
  echo "$text" | sed 's/[\/\\ ]/-/g' | tr -cd 'a-zA-Z0-9-' | tr '[:upper:]' '[:lower:]'
}

# Function to count lines of code in a file
count_lines_of_code() {
  local file="$1"
  
  # Handle PHP files differently than JS files
  if [[ "$file" == *.php ]]; then
    # Count non-empty, non-comment lines for PHP
    grep -v '^\s*$' "$file" | grep -v '^\s*\/\/' | grep -v '^\s*\/\*' | grep -v '^\s*\*' | grep -v '^\s*\*\/' | grep -v '^\s*<\?php \/\/' | wc -l
  else
    # Count non-empty, non-comment lines for JS
    grep -v '^\s*$' "$file" | grep -v '^\s*//' | wc -l
  fi
}

# Function to count import statements
count_imports() {
  local file="$1"
  
  # Handle PHP files differently than JS files
  if [[ "$file" == *.php ]]; then
    # Count require/include statements for PHP
    grep -c -E '(require|include|require_once|include_once|use)' "$file"
  else
    # Count import statements for JS
    grep -c "^\s*import " "$file"
  fi
}

# Function to categorize file complexity
categorize_file_complexity() {
  local size_kb="$1"
  local lines="$2"
  local imports="$3"
  
  # Define thresholds
  local small_size=5       # Files under 5KB are small
  local medium_size=20    # Files under 15KB are medium
  local small_lines=500    # Files under 100 lines are small
  local medium_lines=1000   # Files under 300 lines are medium
  local many_imports=10    # More than 10 imports is high
  
  # Calculate complexity score (0-10)
  local score=0
  
  # Size based score (0-4)
  if [ "$size_kb" -lt "$small_size" ]; then
    score=$((score + 0))
  elif [ "$size_kb" -lt "$medium_size" ]; then
    score=$((score + 2))
  else
    score=$((score + 4))
  fi
  
  # Lines of code based score (0-4)
  if [ "$lines" -lt "$small_lines" ]; then
    score=$((score + 0))
  elif [ "$lines" -lt "$medium_lines" ]; then
    score=$((score + 2))
  else
    score=$((score + 4))
  fi
  
  # Import complexity based score (0-2)
  if [ "$imports" -gt "$many_imports" ]; then
    score=$((score + 2))
  else
    score=$((score + 0))
  fi
  
  # Determine complexity category
  if [ "$score" -lt "3" ]; then
    echo "🟢 Simple"
  elif [ "$score" -lt "7" ]; then
    echo "🟠 Moderate"
  else
    echo "🔴 Complex"
  fi
}

# Function to extract multiline comments
extract_multiline_comment() {
  local file="$1"
  local pattern="$2"
  local result=""
  local capture=0
  local line=""
  
  # Read file line by line
  while IFS= read -r line; do
    # Handle PHP files differently
    if [[ "$file" == *.php ]]; then
      # Check if this is the start of our target comment in PHP
      if [[ "$line" =~ ^(\<\?php)?\ *//\ *$pattern: ]]; then
        # Start capturing, but skip the initial pattern line
        capture=1
        # Extract content from the first line if there is any
        first_content=$(echo "$line" | sed "s|^<?php[ ]*// $pattern: *||" | sed "s|^// $pattern: *||")
        if [ -n "$first_content" ]; then
          result+="$first_content\n"
        fi
        continue
      fi
    else
      # Check if this is the start of our target comment in JS
      if [[ "$line" =~ ^//\ *$pattern: ]]; then
        # Start capturing, but skip the initial pattern line
        capture=1
        # Extract content from the first line if there is any
        first_content=$(echo "$line" | sed "s|^// $pattern: *||")
        if [ -n "$first_content" ]; then
          result+="$first_content\n"
        fi
        continue
      fi
    fi
    
    # If we're capturing and hit another comment pattern, stop
    if [ $capture -eq 1 ] && [[ "$line" =~ ^(\<\?php)?\ *//\ *[A-Za-z]+: ]]; then
      # Stop if we hit another comment pattern
      break
    elif [ $capture -eq 1 ] && [[ "$line" =~ ^(\<\?php)?\ *// ]]; then
      # Still capturing, add this line (removing the comment prefix)
      content=$(echo "$line" | sed 's|^<?php[ ]*// *||' | sed 's|^// *||')
      result+="$content\n"
    elif [ $capture -eq 1 ]; then
      # If we hit a non-comment line, stop capturing
      break
    fi
  done < "$file"
  
  # Remove trailing newline and return
  echo -e "$result" | sed '$ s/\\n$//'
}

# Function to extract the core intent of a comment
extract_comment() {
  local file="$1"
  local pattern="$2"
  local max_length="$3"
  local result=""
  
  # Check file type and extract accordingly
  if [[ "$file" == *.php ]]; then
    # For PHP files
    result=$(grep -m 1 "^<?php // $pattern:" "$file" | sed "s|^<?php // $pattern: *||")
    
    # If not found with PHP tag, try without
    if [ -z "$result" ]; then
      result=$(grep -m 1 "^// $pattern:" "$file" | sed "s|^// $pattern: *||")
    fi
  else
    # For JS files - first try exact match
    result=$(grep -m 1 "^// $pattern:" "$file" | sed "s|^// $pattern: *||")
    
    # If not found, try without colon
    if [ -z "$result" ]; then
      # Special case for file path in first line
      if [ "$pattern" = "File" ]; then
        result=$(head -n 1 "$file" | sed 's|^// ||')
      else
        result=$(grep -m 1 "^// $pattern" "$file" | sed "s|^// $pattern *||")
      fi
    fi
  fi
  
  # Trim if needed and add ellipsis
  if [ -n "$result" ] && [ -n "$max_length" ] && [ ${#result} -gt $max_length ]; then
    result="${result:0:$max_length}..."
  fi
  
  echo "$result"
}

# Function to extract filename from comment or path
get_file_info() {
  local file="$1"
  local basename=$(basename "$file")
  local comment_path=""
  
  # Extract differently based on file type
  if [[ "$file" == *.php ]]; then
    comment_path=$(extract_comment "$file" "File")
    
    # Look for file info in the first line if not found
    if [ -z "$comment_path" ]; then
      first_line=$(head -n 1 "$file" | grep "^<?php //")
      if [[ "$first_line" =~ [a-zA-Z0-9_\-/]+\.(php) ]]; then
        comment_path="${BASH_REMATCH[0]}"
      fi
    fi
  else
    comment_path=$(extract_comment "$file" "File")
    
    # Look for file info in the first line if not found
    if [ -z "$comment_path" ]; then
      first_line=$(head -n 1 "$file" | grep "^//")
      if [[ "$first_line" =~ [a-zA-Z0-9_\-/]+\.(js) ]]; then
        comment_path="${BASH_REMATCH[0]}"
      fi
    fi
  fi
  
  # Return the basename and commented path if available
  if [ -n "$comment_path" ]; then
    echo "$basename|$comment_path"
  else
    echo "$basename|"
  fi
}

# Function to count PHP and JS files in a directory
count_php_js_files() {
  local dir="$1"
  find "$dir" -maxdepth 1 -type f \( -name "*.js" -o -name "*.php" \) | wc -l
}

# Function to process a directory
process_directory() {
  local dir="$1"
  local depth="$2"
  local parent_path="${dir#$ROOT_DIR/}"
  
  # Increment processed directories counter
  PROCESSED_DIRS=$((PROCESSED_DIRS + 1))
  
  # Calculate progress percentage
  local progress=0
  if [ "$TOTAL_DIRS" -gt 0 ]; then
    progress=$((PROCESSED_DIRS * 100 / TOTAL_DIRS))
  fi
  show_progress "$progress"
  
  # Skip if no PHP or JS files in this directory
  local file_count=$(count_php_js_files "$dir")
  local dir_has_content=0
  
  # Check if any subdirectories have PHP or JS files
  while IFS= read -r subdir; do
    local subdir_count=$(find "$subdir" -type f \( -name "*.js" -o -name "*.php" \) | wc -l)
    if [ "$subdir_count" -gt 0 ]; then
      dir_has_content=1
      break
    fi
  done < <(find "$dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null || true)
  
  # Skip if directory and all subdirectories have no PHP or JS files
  if [ "$file_count" -eq 0 ] && [ "$dir_has_content" -eq 0 ]; then
    return
  fi
  
  # Calculate heading level based on directory depth
  local heading="#"
  for ((i=1; i<depth; i++)); do
    heading="${heading}#"
  done
  
  # Format the directory name for the heading
  local dir_name=$(basename "$dir")
  if [ "$dir" = "$ROOT_DIR/$TARGET_DIR" ]; then
    dir_name=$(basename "$TARGET_DIR")
  fi
  local dir_path="/$parent_path"
  
  # Create a unique anchor for this directory
  local dir_anchor=$(sanitize_anchor "${parent_path}")
  
  # Add to table of contents with the right indentation
  local toc_indent=""
  for ((i=2; i<depth; i++)); do
    toc_indent="${toc_indent}  "
  done
  
  # Add to TOC with file count and all subdirectory files - using proper markdown ID syntax
  local total_files=$(find "$dir" -type f \( -name "*.js" -o -name "*.php" \) | wc -l)
  echo "${toc_indent}- [${dir_name}/](#${dir_anchor}) (${total_files} files)" >> "$TEMP_TOC"
  
  # Add section heading with directory info using Markdown ID syntax
  echo "$heading ${dir_name}/ {#${dir_anchor}}" >> "$TEMP_CONTENT"
  echo "" >> "$TEMP_CONTENT"
  echo "**Path:** \`${dir_path}/\`" >> "$TEMP_CONTENT"
  echo "" >> "$TEMP_CONTENT"
  
  # Only show the table if there are actual PHP or JS files in this directory
  if [ "$file_count" -gt 0 ]; then
    # Add table with file information
    echo "| File | Purpose | Dependencies | Size | Complexity |" >> "$TEMP_CONTENT"
    echo "|------|---------|--------------|------|------------|" >> "$TEMP_CONTENT"
    
    # Process each PHP and JS file in this directory
    while IFS= read -r file; do
      # Get file information and metrics
      IFS='|' read -r basename comment_path <<< "$(get_file_info "$file")"
      purpose=$(extract_comment "$file" "Purpose" 100)
      dependencies=$(extract_comment "$file" "Dependencies" 80)
      size=$(du -k "$file" | cut -f1)
      size_kb="${size}"
      lines=$(count_lines_of_code "$file")
      imports=$(count_imports "$file")
      complexity=$(categorize_file_complexity "$size_kb" "$lines" "$imports")
      
      # Add to the table
      echo "| \`$basename\` | $purpose | $dependencies | ${size_kb}KB | $complexity |" >> "$TEMP_CONTENT"
      
      # Update progress
      PROCESSED_FILES=$((PROCESSED_FILES + 1))
      if [ "$TOTAL_FILES" -gt 0 ]; then
        local progress=$((PROCESSED_FILES * 100 / TOTAL_FILES))
        show_progress "$progress"
      fi
    done < <(find "$dir" -maxdepth 1 -type f \( -name "*.js" -o -name "*.php" \) | sort)
    
    echo "" >> "$TEMP_CONTENT"
    
    # Add usage examples section with markdown heading instead of HTML details
    echo "### Usage Examples" >> "$TEMP_CONTENT"
    echo "" >> "$TEMP_CONTENT"
    
    # Add usage examples for each file
    while IFS= read -r file; do
      basename=$(basename "$file")
      usage=$(extract_multiline_comment "$file" "Usage")
      notes=$(extract_comment "$file" "Notes")
      
      if [ -n "$usage" ]; then
        echo "**\`$basename\`**:" >> "$TEMP_CONTENT"
        echo "" >> "$TEMP_CONTENT"
        
        # Use appropriate code block language based on file type
        if [[ "$file" == *.php ]]; then
          echo '```php' >> "$TEMP_CONTENT"
        else
          echo '```javascript' >> "$TEMP_CONTENT"
        fi
        
        echo "$usage" >> "$TEMP_CONTENT" 
        echo '```' >> "$TEMP_CONTENT"
        
        if [ -n "$notes" ]; then
          echo "" >> "$TEMP_CONTENT"
          echo "*Note: $notes*" >> "$TEMP_CONTENT"
        fi
        
        echo "" >> "$TEMP_CONTENT"
      fi
    done < <(find "$dir" -maxdepth 1 -type f \( -name "*.js" -o -name "*.php" \) | sort)
    
    echo "" >> "$TEMP_CONTENT"
  fi
  
  # Process subdirectories recursively
  while IFS= read -r subdir; do
    process_directory "$subdir" $((depth + 1))
  done < <(find "$dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)
}

# Generate documentation header
cat > "$OUTPUT_FILE" << EOF
# Codebase Overview

**Generated:** $(date +"%Y-%m-%d %H:%M")  
**Project Root:** \`$(basename "$ROOT_DIR")\`  

This document provides an overview of the PHP and JavaScript codebase structure with key information about each module and file.

## Table of Contents

EOF

# First calculate the total files and directories
calculate_totals

# Generate the documentation
echo "Generating documentation for $TARGET_DIR..."
mkdir -p "$(dirname "$OUTPUT_FILE")"
process_directory "$ROOT_DIR/$TARGET_DIR" 2

# Clear the progress line
printf "\r%$(tput cols)s\r" ""

# Combine TOC and content
echo "Finalizing documentation..."
cat "$TEMP_TOC" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
cat "$TEMP_CONTENT" >> "$OUTPUT_FILE"

# Clean up temporary files
rm -f "$TEMP_TOC" "$TEMP_CONTENT"

echo -e "\nDocumentation generated: $OUTPUT_FILE"
echo "Processed $PROCESSED_FILES files across $PROCESSED_DIRS directories"