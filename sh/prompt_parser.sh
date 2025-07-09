#!/usr/bin/env bash
# gather_files.sh
#
# Extracts file paths from natural language text entered by the user
# and copies them to a destination folder. Only renames files by adding
# folder prefix if there's a name collision.

set -euo pipefail

# ─── CONFIG  (change once) ────────────────────────────────────────────
PROJECT_ROOT="/Users/skptechlab/Projects/harvardcinderella/games/pictotalk"
# ──────────────────────────────────────────────────────────────────────

# ─── ARGUMENTS ────────────────────────────────────────────────────────
DEST="/Users/skptechlab/Desktop/extracted_files"
mkdir -p "$DEST"

# Clean up destination directory
echo "Cleaning destination directory..."
rm -f "$DEST"/*
echo "✔ Cleaned $DEST"

echo "Project root : $PROJECT_ROOT"
echo "Destination  : $DEST"
echo "-----------------------------------------------------------"

# ─── GET TEXT FROM USER ───────────────────────────────────────────────
echo "Paste your text below, then press Ctrl+D when finished:"
echo

input_text=""
while IFS= read -r line; do
  input_text+="$line"$'\n'
done

if [[ -z "$input_text" ]]; then
  echo "No text provided. Exiting."
  exit 1
fi

echo "-----------------------------------------------------------"

copied=0
missing=0

# ─── FILE PATH EXTRACTION ────────────────────────────────────────────
extract_file_paths() {
  local text="$1"
  
  # Extract file paths using multiple patterns
  {
    # Pattern 1: paths with extensions (most common)
    echo "$text" | grep -oE '[a-zA-Z0-9._/-]+\.[a-zA-Z0-9]+' 2>/dev/null || true
    
    # Pattern 2: paths without extensions but with directory structure
    echo "$text" | grep -oE '[a-zA-Z0-9._-]+/[a-zA-Z0-9._/-]+' 2>/dev/null | grep -v '\.[a-zA-Z0-9]+$' || true
    
    # Pattern 3: includes/ or js/ style paths (common project structures)
    echo "$text" | grep -oE '(includes|js|src|lib|app|components|services|utils|assets|styles|css)/[a-zA-Z0-9._/-]+' 2>/dev/null || true
  }
}

copy_one() {
  local rel="$1"
  local src target filename folder_name
  
  # Debug: show what we're processing
  echo "DEBUG: Processing path: '$rel'"
  
  # Clean up the path (remove leading ./ if present)
  rel="${rel#./}"
  
  src="$PROJECT_ROOT/$rel"
  echo "DEBUG: Looking for file at: '$src'"
  
  if [[ ! -f "$src" ]]; then
    printf "✖  MISSING %-58s\n" "$rel"
    missing=$((missing + 1))
    return
  fi

  # Get just the filename
  filename="$(basename "$rel")"
  target="$DEST/$filename"

  # If file already exists, add folder name as prefix
  if [[ -e "$target" ]]; then
    folder_name="$(dirname "$rel" | tr '/' '_')"
    # Remove leading dots and clean up
    folder_name="${folder_name#.}"
    folder_name="${folder_name#_}"
    
    if [[ "$filename" == *.* ]]; then
      base="${filename%.*}"
      ext="${filename##*.}"
      target="$DEST/${folder_name}_${base}.${ext}"
    else
      target="$DEST/${folder_name}_${filename}"
    fi
  fi

  if cp "$src" "$target" 2>/dev/null; then
    printf "✔  Copied %-60s → %s\n" "$rel" "$(basename "$target")"
    copied=$((copied + 1))
  else
    printf "✖  FAILED TO COPY %-50s\n" "$rel"
    missing=$((missing + 1))
  fi
}

# ─── MAIN PROCESSING ──────────────────────────────────────────────────
echo "Scanning text for file paths..."
echo

# Extract all potential file paths
all_paths="$(extract_file_paths "$input_text")"

if [[ -z "$all_paths" ]]; then
  echo "No file paths found in the input text."
  exit 0
fi

# Remove duplicates and sort
unique_paths="$(echo "$all_paths" | sort -u | grep -v '^$')"

echo "Found file paths:"
echo "$unique_paths" | sed 's/^/  /'
echo

# Filter out obvious false positives
filtered_paths=""
while IFS= read -r path; do
  if [[ -n "$path" ]]; then
    # Skip paths that are clearly not files
    if [[ "$path" =~ ^[a-z]+/[a-z]+$ ]] && [[ ! "$path" =~ \. ]]; then
      echo "DEBUG: Skipping probable false positive: '$path'"
      continue
    fi
    
    # Skip very short paths that are likely false positives
    if [[ ${#path} -lt 4 ]]; then
      echo "DEBUG: Skipping too short path: '$path'"
      continue
    fi
    
    filtered_paths+="$path"$'\n'
  fi
done <<< "$unique_paths"

# Remove empty lines
filtered_paths="$(echo "$filtered_paths" | grep -v '^$' || true)"

if [[ -z "$filtered_paths" ]]; then
  echo "No valid file paths found after filtering."
  exit 0
fi

echo "Processing paths:"
echo "DEBUG: About to process $(echo "$filtered_paths" | wc -l) paths"

# Process each path
while IFS= read -r path; do
  if [[ -n "$path" ]]; then
    echo "DEBUG: About to process: '$path'"
    copy_one "$path"
  fi
done <<< "$filtered_paths"

echo "-----------------------------------------------------------"
echo "Finished: $copied copied, $missing missing."
if [[ $copied -gt 0 ]]; then
  echo "Files are in: $DEST"
fi

if [[ $missing -gt 0 ]]; then
  echo
  echo "Note: Missing files might need PROJECT_ROOT adjustment or may not exist."
fi