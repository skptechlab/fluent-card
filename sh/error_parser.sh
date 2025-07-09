#!/bin/bash

# Set the project root path
PROJECT_ROOT="/Users/skptechlab/Projects/thermalzap-project/thermalzap"
OUTPUT_FILE="error.txt"

# Check if a JSON file is provided as an argument
if [ $# -eq 0 ]; then
  echo "No input file specified. Please provide a JSON file with the errors."
  echo "Usage: $0 <error_file.json>"
  exit 1
fi

INPUT_FILE=$1

# Create/clear the output file
> "$OUTPUT_FILE"

# Process the input file and extract necessary information
if command -v jq &> /dev/null; then
  # Extract unique file paths
  files=$(jq -r '.resource' "$INPUT_FILE" | sort | uniq)
  
  # If no files found, try parsing as an array of objects
  if [ -z "$files" ]; then
    files=$(jq -r '.[].resource' "$INPUT_FILE" | sort | uniq)
  fi
  
  # For each file, extract and summarize errors
  for file in $files; do
    # Extract relative path
    rel_path=${file#"$PROJECT_ROOT/"}
    
    # Write file header to output
    echo "Problem found in" >> "$OUTPUT_FILE"
    echo "$rel_path" >> "$OUTPUT_FILE"
    
    # Extract and list problem numbers
    count=1
    echo -n "Problem found : " >> "$OUTPUT_FILE"
    
    # Count the number of problems for this file
    num_problems=$(jq -r "[.[] | select(.resource == \"$file\")] | length" "$INPUT_FILE")
    
    # Create the comma-separated list of problem numbers
    for ((i=1; i<=num_problems; i++)); do
      echo -n "$i" >> "$OUTPUT_FILE"
      if [ $i -lt $num_problems ]; then
        echo -n ", " >> "$OUTPUT_FILE"
      fi
    done
    echo "" >> "$OUTPUT_FILE"
    
    # Add detailed information about each error
    jq -r "[.[] | select(.resource == \"$file\")] | to_entries[] | 
      (.key+1 | tostring) + \". Line \" + (.value.startLineNumber | tostring) + \": \" + 
      (.value.message | gsub(\"\\n\"; \" \"))" "$INPUT_FILE" >> "$OUTPUT_FILE"
    
    # Add a separator between files
    echo "" >> "$OUTPUT_FILE"
  done
else
  # Fallback if jq is not installed
  echo "Warning: jq is not installed. Using a simplified parser."
  
  # Using grep and sed for basic parsing
  temp_file=$(mktemp)
  grep -o '"resource":"[^"]*"' "$INPUT_FILE" | sort | uniq | sed 's/"resource":"//g' | sed 's/"//g' > "$temp_file"
  
  while read -r file; do
    rel_path=${file#"$PROJECT_ROOT/"}
    
    echo "Problem found in" >> "$OUTPUT_FILE"
    echo "$rel_path" >> "$OUTPUT_FILE"
    echo "Problem found: (Unable to provide detailed summary without jq)" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  done < "$temp_file"
  
  rm "$temp_file"
fi

echo "Error summary has been written to $OUTPUT_FILE"