#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# GitHub username - Change this to your username
GITHUB_USERNAME="skptechlab"

# Get the directory of the current script
SCRIPT_DIR="$(dirname "$(realpath "$0")")"

# Function to check if a file/directory should be ignored
should_ignore() {
    local item="$1"
    
    # List of patterns to ignore
    local ignore_patterns=(".git" "node_modules" ".DS_Store" "*.log" "dist" "build")
    
    # Check for .gitignore if it exists
    if [ -f .gitignore ]; then
        # Add gitignore patterns to our list (simplified, doesn't handle all gitignore syntax)
        while IFS= read -r pattern; do
            # Skip comments and empty lines
            if [[ ! "$pattern" =~ ^# && -n "$pattern" ]]; then
                ignore_patterns+=("$pattern")
            fi
        done < .gitignore
    fi
    
    # Check if item matches any ignore pattern
    for pattern in "${ignore_patterns[@]}"; do
        # Handle simple glob patterns (this is simplified)
        if [[ "$item" == $pattern || "$item" == ${pattern%/} ]]; then
            return 0  # Should be ignored
        fi
    done
    
    return 1  # Should not be ignored
}

generate_tree() {
    local dir="$1"
    local prefix="$2"
    local output=""
    local has_content=false

    local items=($(ls -1 "$dir" | sort))
    local visible_items=()

    for item in "${items[@]}"; do
        if ! should_ignore "$item"; then
            visible_items+=("$item")
        fi
    done

    local num_items=${#visible_items[@]}

    for ((i=0; i<num_items; i++)); do
        local item="${visible_items[$i]}"
        local path="$dir/$item"
        has_content=true

        # Get line count for files with improved detection for minified files
        local line_count=""
        if [ -f "$path" ]; then
            # First count non-blank lines
            local non_blank_lines=$(grep -c "[^\s]" "$path")
            local file_size=$(wc -c < "$path")
            local file_ext="${item##*.}"
            
            # Check if file might be minified (very few lines but large file size)
            if [[ $non_blank_lines -lt 10 && $file_size -gt 1000 && "$file_ext" =~ ^(js|jsx|ts|tsx|css|html)$ ]]; then
                # For minified files, show character count instead
                local char_count=$(wc -m < "$path" | tr -d ' ')
                line_count=" (minified, $char_count chars)"
            else
                # Regular files - show actual line count
                line_count=" ($non_blank_lines lines)"
            fi
        fi

        if [ $i -eq $((num_items-1)) ]; then
            output+="${prefix}└── ${item}${line_count}"$'\n'
            next_prefix="${prefix}    "
        else
            output+="${prefix}├── ${item}${line_count}"$'\n'
            next_prefix="${prefix}│   "
        fi

        if [ -d "$path" ]; then
            subdir_output=$(generate_tree "$path" "$next_prefix")
            if [ -n "$subdir_output" ]; then
                output+="${subdir_output}"$'\n'
            fi
        fi
    done

    if $has_content; then
        echo -n "${output%$'\n'}"
    fi
}

# Function to show repository tree
show_repo_tree() {
    local save_to_file=$1
    
    if [ "$save_to_file" = "save" ]; then
        # Use doc-gen.sh to generate documentation
        if [ -f "$SCRIPT_DIR/doc-gen.sh" ] && [ -x "$SCRIPT_DIR/doc-gen.sh" ]; then
            generate_documentation
        else
            # Fallback to old method if doc-gen.sh isn't available
            local output_file="memory-bank/project_tree.md"
            echo "# Cleaned Folder Structure (Ignoring non-essential items)" > "$output_file"
            echo "$(pwd)" >> "$output_file"
            generate_tree "$(pwd)" "" >> "$output_file"
            echo -e "${GREEN}Cleaned folder structure has been saved to $output_file${NC}"
        fi
    else
        echo -e "${BLUE}Repository Structure:${NC}"
        echo -e "$(basename $(pwd))"
        echo -e "$(generate_tree "$(pwd)" "")"
    fi
}

# Function to initialize repository
init_repository() {
    if [ ! -d .git ]; then
        echo -e "${YELLOW}Not a git repository. Initializing...${NC}"
        git init
        
        # Create README.md if it doesn't exist
        if [ ! -f README.md ]; then
            echo "# $(basename $(pwd))" >> README.md
            echo -e "${GREEN}Created README.md${NC}"
        fi

        # Create .gitignore if it doesn't exist
        if [ ! -f .gitignore ]; then
            echo -e "# Common ignore patterns\nnode_modules/\n.env\n.DS_Store\n*.log\ndist/\nbuild/" >> .gitignore
            echo -e "${GREEN}Created .gitignore with common patterns${NC}"
        fi
    fi

    # Setup remote if needed
    if ! git remote | grep -q "^origin$"; then
        echo -e "${YELLOW}Remote origin not found. Choose setup method:${NC}"
        select method in "Use existing repository" "Create new repository" "Skip"; do
            case $method in
                "Use existing repository")
                    echo -e "${YELLOW}Enter repository URL:${NC}"
                    read repo_url
                    git remote add origin "$repo_url"
                    break
                    ;;
                "Create new repository")
                    repo_name=$(basename $(pwd))
                    git remote add origin "https://github.com/${GITHUB_USERNAME}/${repo_name}.git"
                    echo -e "${GREEN}Added remote: https://github.com/${GITHUB_USERNAME}/${repo_name}.git${NC}"
                    break
                    ;;
                "Skip")
                    break
                    ;;
            esac
        done
    fi
}

# Function to handle commits
commit_changes() {
    # Show current status
    echo -e "${BLUE}Current Status:${NC}"
    git status

    # Option to show diff
    read -p "Would you like to see the diff before committing? [y/N] " show_diff
    if [[ "$show_diff" =~ ^[Yy]$ ]]; then
        git diff --staged
    fi

    # Commit message prompt with examples
    echo -e "\n${YELLOW}Enter a descriptive commit message:${NC}"
    echo -e "${BLUE}Examples:${NC}"
    echo "- feat: add new login feature"
    echo "- fix: resolve issue with data loading"
    echo "- docs: update API documentation"
    echo "- style: format code structure"
    echo "- refactor: improve error handling"
    echo "- test: add unit tests"
    echo "- chore: update dependencies"
    
    echo -e "\n${YELLOW}Your commit message:${NC}"
    read commit_message

    # Validate commit message
    while [ -z "$commit_message" ]; do
        echo -e "${RED}Commit message cannot be empty. Please enter a message:${NC}"
        read commit_message
    done

    # Optional commit description
    echo -e "${YELLOW}Would you like to add a detailed description? [y/N]${NC}"
    read add_description
    if [[ "$add_description" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Enter description (Press Ctrl+D when done):${NC}"
        description=$(cat)
        git commit -m "$commit_message" -m "$description"
    else
        git commit -m "$commit_message"
    fi
}

# Function to handle pulling changes
pull_changes() {
    echo -e "${BLUE}Pull Changes${NC}"
    current_branch=$(git branch --show-current)
    echo -e "${YELLOW}Current branch: $current_branch${NC}"
    
    # Check if remote exists
    if ! git remote | grep -q "^origin$"; then
        echo -e "${RED}No remote 'origin' found. Please set up a remote first.${NC}"
        return
    fi
    
    echo -e "${YELLOW}Choose pull method:${NC}"
    select method in "Pull (merge)" "Pull with rebase" "Fetch only" "Cancel"; do
        case $method in
            "Pull (merge)")
                echo -e "${YELLOW}Pulling changes from origin/$current_branch...${NC}"
                if git pull origin "$current_branch"; then
                    echo -e "${GREEN}Pull successful${NC}"
                else
                    echo -e "${RED}Pull failed. Please resolve conflicts and try again.${NC}"
                fi
                break
                ;;
            "Pull with rebase")
                echo -e "${YELLOW}Pulling with rebase from origin/$current_branch...${NC}"
                if git pull --rebase origin "$current_branch"; then
                    echo -e "${GREEN}Pull with rebase successful${NC}"
                else
                    echo -e "${RED}Pull with rebase failed. Please resolve conflicts and continue rebase.${NC}"
                fi
                break
                ;;
            "Fetch only")
                echo -e "${YELLOW}Fetching changes from origin...${NC}"
                git fetch origin
                echo -e "${GREEN}Fetch completed. Use 'git status' to see if your branch is behind.${NC}"
                break
                ;;
            "Cancel")
                break
                ;;
        esac
    done
}

# Function to restore a modified file to its state after the last commit
restore_modified_file() {
    echo -e "${BLUE}Restore Modified File${NC}"
    
    # Check if there are any modified files
    if ! git diff --name-only | grep -q .; then
        echo -e "${YELLOW}No modified files to restore.${NC}"
        return
    fi
    
    echo -e "${YELLOW}Modified files:${NC}"
    
    # Create an array of modified files using a more portable approach
    modified_files=()
    while IFS= read -r line; do
        modified_files+=("$line")
    done < <(git diff --name-only)
    
    # Add a "Cancel" option
    modified_files+=("Cancel")
    
    # Display the modified files for selection
    select file in "${modified_files[@]}"; do
        if [[ "$REPLY" =~ ^[0-9]+$ ]] && [ "$REPLY" -le ${#modified_files[@]} ]; then
            if [ "$file" == "Cancel" ]; then
                return
            fi
            
            echo -e "${YELLOW}Restoring file: $file${NC}"
            echo -e "${RED}This will discard all changes to this file. Are you sure? [y/N]${NC}"
            read confirm
            
            if [[ "$confirm" =~ ^[Yy]$ ]]; then
                git checkout -- "$file"
                echo -e "${GREEN}File restored to its state after the last commit.${NC}"
            else
                echo -e "${YELLOW}Restoration cancelled.${NC}"
            fi
            
            break
        else
            echo -e "${RED}Invalid selection${NC}"
        fi
    done
}

# Function to handle reflog operations
reflog_operations() {
    echo -e "${BLUE}Reflog Operations${NC}"
    
    # Check if there are any reflog entries
    if ! git reflog --max-count=1 > /dev/null 2>&1; then
        echo -e "${RED}No reflog entries found${NC}"
        return
    fi
    
    echo -e "${YELLOW}Choose reflog operation:${NC}"
    select operation in "View reflog" "Restore to reflog entry" "Back"; do
        case $operation in
            "View reflog")
                echo -e "${BLUE}Recent reflog entries:${NC}"
                git reflog --oneline -20
                ;;
            "Restore to reflog entry")
                echo -e "${BLUE}Recent reflog entries:${NC}"
                
                # Get reflog entries
                declare -a reflog_entries=()
                declare -a reflog_hashes=()
                
                while IFS='|' read -r hash entry; do
                    reflog_hashes+=("$hash")
                    reflog_entries+=("$hash - $entry")
                done < <(git reflog --pretty=format:"%h|%gs (%cr)" -20)
                
                reflog_entries+=("Cancel")
                
                echo -e "${YELLOW}Select a reflog entry to restore to:${NC}"
                select entry in "${reflog_entries[@]}"; do
                    if [[ "$REPLY" =~ ^[0-9]+$ ]] && [ "$REPLY" -le ${#reflog_entries[@]} ]; then
                        if [ "$entry" == "Cancel" ]; then
                            break 2
                        fi
                        
                        hash=${reflog_hashes[$REPLY-1]}
                        
                        echo -e "${YELLOW}Choose restore method:${NC}"
                        select method in "Soft reset (keep changes staged)" "Mixed reset (keep changes unstaged)" "Hard reset (discard all changes)" "Cancel"; do
                            case $method in
                                "Soft reset (keep changes staged)")
                                    git reset --soft "$hash"
                                    echo -e "${GREEN}Soft reset to $hash${NC}"
                                    break 3
                                    ;;
                                "Mixed reset (keep changes unstaged)")
                                    git reset --mixed "$hash"
                                    echo -e "${GREEN}Mixed reset to $hash${NC}"
                                    break 3
                                    ;;
                                "Hard reset (discard all changes)")
                                    echo -e "${RED}Warning: This will permanently discard all changes!${NC}"
                                    read -p "Are you sure? [y/N] " confirm
                                    if [[ "$confirm" =~ ^[Yy]$ ]]; then
                                        git reset --hard "$hash"
                                        echo -e "${GREEN}Hard reset to $hash${NC}"
                                    fi
                                    break 3
                                    ;;
                                "Cancel")
                                    break 3
                                    ;;
                            esac
                        done
                    else
                        echo -e "${RED}Invalid selection${NC}"
                    fi
                done
                ;;
            "Back")
                break
                ;;
        esac
    done
}

# Function to handle stage, commit and push all at once
stage_commit_push() {
    echo -e "${BLUE}📋 Quick Checkpoint${NC}"
    echo -e "${BLUE}Current Status:${NC}"
    git status
    
    # Stage all changes
    echo -e "${YELLOW}Staging all changes...${NC}"
    git add .
    echo -e "${GREEN}All changes staged${NC}"
    
    # Generate timestamp commit message
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    commit_message="Checkpoint: ${timestamp}"
    
    # Commit with timestamp
    echo -e "${YELLOW}Committing with message: \"${commit_message}\"${NC}"
    git commit -m "$commit_message"
    
    # Push changes
    echo -e "${YELLOW}Pushing changes...${NC}"
    current_branch=$(git branch --show-current)
    
    if git push origin "$current_branch" 2>/dev/null; then
        echo -e "${GREEN}✅ Quick checkpoint completed successfully${NC}"
    else
        echo -e "${YELLOW}Push failed. Choose how to proceed:${NC}"
        select opt in "Force push" "Pull and merge" "Rebase" "Cancel"; do
            case $opt in
                "Force push")
                    echo -e "${RED}Warning: Force push will overwrite remote changes!${NC}"
                    read -p "Are you sure? [y/N] " confirm
                    if [[ "$confirm" =~ ^[Yy]$ ]]; then
                        git push -f origin "$current_branch"
                        echo -e "${GREEN}✅ Force push completed${NC}"
                    fi
                    break
                    ;;
                "Pull and merge")
                    git pull origin "$current_branch"
                    git push origin "$current_branch"
                    echo -e "${GREEN}✅ Merge and push completed${NC}"
                    break
                    ;;
                "Rebase")
                    git pull --rebase origin "$current_branch"
                    git push origin "$current_branch"
                    echo -e "${GREEN}✅ Rebase and push completed${NC}"
                    break
                    ;;
                "Cancel")
                    break
                    ;;
            esac
        done
    fi
}

# Function to handle branch operations
manage_branches() {
    echo -e "${BLUE}Branch Management${NC}"
    echo -e "${YELLOW}Current branch: $(git branch --show-current)${NC}"
    
    options=(
        "List all branches"
        "Create new branch"
        "Switch branch"
        "Delete branch"
        "Merge branch"
        "Back to main menu"
    )
    
    select opt in "${options[@]}"; do
        case $REPLY in
            1)
                echo -e "${BLUE}Local branches:${NC}"
                git branch
                echo -e "\n${BLUE}Remote branches:${NC}"
                git branch -r
                ;;
            2)
                echo -e "${YELLOW}Enter new branch name:${NC}"
                read branch_name
                git checkout -b "$branch_name"
                echo -e "${GREEN}Created and switched to branch: $branch_name${NC}"
                ;;
            3)
                echo -e "${YELLOW}Available branches:${NC}"
                git branch
                echo -e "${YELLOW}Enter branch name to switch to:${NC}"
                read branch_name
                git checkout "$branch_name"
                ;;
            4)
                echo -e "${YELLOW}Branches available for deletion:${NC}"
                git branch
                echo -e "${YELLOW}Enter branch name to delete:${NC}"
                read branch_name
                echo -e "${RED}Delete branch $branch_name? [y/N]${NC}"
                read confirm
                if [[ "$confirm" =~ ^[Yy]$ ]]; then
                    git branch -D "$branch_name"
                fi
                ;;
            5)
                echo -e "${YELLOW}Available branches:${NC}"
                git branch
                echo -e "${YELLOW}Enter branch name to merge into current branch:${NC}"
                read branch_name
                git merge "$branch_name"
                ;;
            6)
                break
                ;;
            *)
                echo -e "${RED}Invalid option${NC}"
                ;;
        esac
    done
}

# Function to show complete rollback impact before proceeding
show_rollback_impact() {
    echo -e "${CYAN}📋 Complete Rollback Impact Analysis${NC}"
    
    # Show untracked files
    local untracked_files=$(git ls-files --others --exclude-standard)
    if [ -n "$untracked_files" ]; then
        echo -e "${YELLOW}🗑️  Untracked files that will be DELETED:${NC}"
        echo "$untracked_files" | while read file; do
            if [ -f "$file" ]; then
                local size=$(du -h "$file" | cut -f1)
                echo "   • $file ($size)"
            else
                echo "   • $file"
            fi
        done
        echo
    fi
    
    # Show modified files
    local modified_files=$(git diff --name-only)
    if [ -n "$modified_files" ]; then
        echo -e "${YELLOW}📝 Modified files that will be restored:${NC}"
        echo "$modified_files" | sed 's/^/   • /'
        echo
    fi
    
    # Show staged files
    local staged_files=$(git diff --cached --name-only)
    if [ -n "$staged_files" ]; then
        echo -e "${YELLOW}📦 Staged files that will be unstaged:${NC}"
        echo "$staged_files" | sed 's/^/   • /'
        echo
    fi
}

# Function to handle complete rollback with cleanup
complete_rollback() {
    if ! git rev-parse --quiet HEAD > /dev/null 2>&1; then
        echo -e "${RED}No commits to roll back to${NC}"
        return 1
    fi

    echo -e "${BLUE}🔄 Complete Rollback to Checkpoint${NC}"
    echo -e "${YELLOW}Recent commits (newest first):${NC}"
    
    declare -a commit_hashes=()
    declare -a commit_msgs=()
    
    while IFS='|' read -r hash msg; do
        commit_hashes+=("$hash")
        commit_msgs+=("$hash - $msg")
    done < <(git log -20 --pretty=format:"%h|%s (%cr) <%an>")
    
    commit_msgs+=("Cancel")
    
    echo "Select a commit to roll back to:"
    select commit in "${commit_msgs[@]}"; do
        if [[ "$REPLY" =~ ^[0-9]+$ ]] && [ "$REPLY" -le ${#commit_msgs[@]} ]; then
            if [ "$commit" == "Cancel" ]; then
                return
            fi
            hash=${commit_hashes[$REPLY-1]}
            break
        else
            echo -e "${RED}Invalid selection${NC}"
        fi
    done

    # Show complete impact
    show_rollback_impact
    
    echo -e "${RED}⚠️  COMPLETE ROLLBACK WARNING${NC}"
    echo -e "This will restore your workspace to exactly match commit ${BLUE}$hash${NC}:"
    echo -e "• Reset HEAD to selected commit"
    echo -e "• Delete ALL untracked files and directories"  
    echo -e "• Discard all uncommitted changes"
    echo -e "• Clean working directory completely"
    echo
    echo -e "${RED}This operation cannot be undone easily!${NC}"
    echo

    read -p "Continue with complete rollback? [y/N] " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Rollback cancelled${NC}"
        return
    fi

    echo -e "${YELLOW}Choose rollback method:${NC}"
    select method in "Soft (keep changes staged)" "Mixed (keep changes unstaged)" "Hard (discard all changes)" "Cancel"; do
        case $method in
            "Soft (keep changes staged)")
                git reset --soft "$hash"
                git clean -fd  # Clean untracked files
                echo -e "${GREEN}✅ Complete soft rollback to $hash (changes kept and staged, untracked files deleted)${NC}"
                break
                ;;
            "Mixed (keep changes unstaged)")
                git reset --mixed "$hash"
                git clean -fd  # Clean untracked files
                echo -e "${GREEN}✅ Complete mixed rollback to $hash (changes kept but unstaged, untracked files deleted)${NC}"
                break
                ;;
            "Hard (discard all changes)")
                git reset --hard "$hash"
                git clean -fd  # Clean untracked files
                echo -e "${GREEN}✅ Complete hard rollback to $hash (all changes and untracked files deleted)${NC}"
                break
                ;;
            "Cancel")
                echo -e "${YELLOW}Rollback cancelled${NC}"
                break
                ;;
        esac
    done
}

# Function to handle pushing changes
push_changes() {
    current_branch=$(git branch --show-current)
    echo -e "${YELLOW}Pushing to branch: $current_branch${NC}"
    
    if git push origin "$current_branch" 2>/dev/null; then
        echo -e "${GREEN}Push successful${NC}"
    else
        echo -e "${YELLOW}Push failed. Choose how to proceed:${NC}"
        select opt in "Force push" "Pull and merge" "Rebase" "Cancel"; do
            case $opt in
                "Force push")
                    echo -e "${RED}Warning: Force push will overwrite remote changes!${NC}"
                    read -p "Are you sure? [y/N] " confirm
                    if [[ "$confirm" =~ ^[Yy]$ ]]; then
                        git push -f origin "$current_branch"
                    fi
                    break
                    ;;
                "Pull and merge")
                    git pull origin "$current_branch"
                    git push origin "$current_branch"
                    break
                    ;;
                "Rebase")
                    git pull --rebase origin "$current_branch"
                    git push origin "$current_branch"
                    break
                    ;;
                "Cancel")
                    break
                    ;;
            esac
        done
    fi
}

# Function to show git log with various formats
show_log() {
    echo -e "${BLUE}Choose log format:${NC}"
    select format in "Simple" "Detailed" "Graph" "Stats" "Back"; do
        case $format in
            "Simple")
                git log --oneline -10
                ;;
            "Detailed")
                git log -p -2
                ;;
            "Graph")
                git log --graph --oneline --all -10
                ;;
            "Stats")
                git log --stat -5
                ;;
            "Back")
                break
                ;;
        esac
    done
}

# Function to stage changes
stage_changes() {
    echo -e "${BLUE}Current Status:${NC}"
    git status
    
    # Generate documentation before staging
    echo -e "${BLUE}Generating codebase documentation...${NC}"
    if [ -f "$SCRIPT_DIR/doc-gen.sh" ] && [ -x "$SCRIPT_DIR/doc-gen.sh" ]; then
        generate_documentation
    else
        show_repo_tree "save"
    fi
    
    echo -e "${YELLOW}Choose files to stage:${NC}"
    select stage_opt in "Stage all" "Stage specific" "Back"; do
        case $stage_opt in
            "Stage all")
                git add .
                echo -e "${GREEN}All changes staged${NC}"
                break
                ;;
            "Stage specific")
                git status
                echo -e "${YELLOW}Enter file(s) to stage (space-separated):${NC}"
                read -r files
                git add $files
                break
                ;;
            "Back")
                break
                ;;
        esac
    done
    
    # Show status after staging
    echo -e "${BLUE}Status after staging:${NC}"
    git status
}

# Function to restore a specific file version and save with commit code
restore_file_version() {
    echo -e "${BLUE}🕰️  Restore Specific File Version${NC}"
    
    # Get all tracked files
    echo -e "${YELLOW}Enter the file path you want to restore a version of:${NC}"
    read file_path
    
    # Check if file exists in repository
    if ! git ls-files --error-unmatch "$file_path" > /dev/null 2>&1; then
        echo -e "${RED}File not found in repository: $file_path${NC}"
        return
    fi
    
    # Show commit history for this specific file
    echo -e "${BLUE}Commit history for $file_path:${NC}"
    
    declare -a commit_hashes=()
    declare -a commit_msgs=()
    
    while IFS='|' read -r hash msg; do
        commit_hashes+=("$hash")
        commit_msgs+=("$hash - $msg")
    done < <(git log -20 --pretty=format:"%h|%s (%cr) <%an>" -- "$file_path")
    
    if [ ${#commit_hashes[@]} -eq 0 ]; then
        echo -e "${RED}No commit history found for this file${NC}"
        return
    fi
    
    commit_msgs+=("Cancel")
    
    echo -e "${YELLOW}Select a commit to restore the file version from:${NC}"
    select commit in "${commit_msgs[@]}"; do
        if [[ "$REPLY" =~ ^[0-9]+$ ]] && [ "$REPLY" -le ${#commit_msgs[@]} ]; then
            if [ "$commit" == "Cancel" ]; then
                return
            fi
            
            hash=${commit_hashes[$REPLY-1]}
            
            # Extract file extension and base name
            file_dir=$(dirname "$file_path")
            file_name=$(basename "$file_path")
            file_base="${file_name%.*}"
            file_ext="${file_name##*.}"
            
            # Create new filename with commit hash
            if [ "$file_base" == "$file_ext" ]; then
                # No extension
                new_filename="${file_base}-${hash}"
            else
                # Has extension
                new_filename="${file_base}-${hash}.${file_ext}"
            fi
            
            # Full path for new file
            if [ "$file_dir" == "." ]; then
                new_file_path="$new_filename"
            else
                new_file_path="${file_dir}/${new_filename}"
            fi
            
            # Extract file content from specific commit
            if git show "${hash}:${file_path}" > "$new_file_path" 2>/dev/null; then
                echo -e "${GREEN}✅ File version restored successfully:${NC}"
                echo -e "${BLUE}Original: $file_path${NC}"
                echo -e "${BLUE}Restored: $new_file_path${NC}"
                echo -e "${YELLOW}You can now compare the files using your preferred diff tool${NC}"
            else
                echo -e "${RED}Failed to restore file version from commit $hash${NC}"
            fi
            
            break
        else
            echo -e "${RED}Invalid selection${NC}"
        fi
    done
}

# Function to generate codebase documentation
generate_documentation() {
    echo -e "${BLUE}📊 Generating Codebase Overview${NC}"
    
    # Create memory-bank directory if it doesn't exist
    if [ ! -d "memory-bank" ]; then
        mkdir -p memory-bank
    fi
    
    # Run doc-gen.sh
    if [ -f "$SCRIPT_DIR/doc-gen.sh" ] && [ -x "$SCRIPT_DIR/doc-gen.sh" ]; then
        if "$SCRIPT_DIR/doc-gen.sh" ; then
            echo -e "${GREEN}✅ Codebase overview successfully generated to memory-bank/codebase-overview.md${NC}"
        else
            echo -e "${RED}Documentation generation failed${NC}"
        fi
    else
        # Fallback method
        show_repo_tree "save"
        echo -e "${GREEN}✅ Project tree saved to memory-bank/project_tree.md${NC}"
    fi
}

# NEW: Success Checkpoint with choices
success_checkpoint() {
    echo -e "${BLUE}🏆 Success Checkpoint${NC}"
    echo -e "${YELLOW}Choose your success checkpoint type:${NC}"
    
    select checkpoint_type in "Quick Save & Push" "Documented Save & Push" "Full Workflow" "Cancel"; do
        case $checkpoint_type in
            "Quick Save & Push")
                echo -e "${BLUE}🚀 Quick Save & Push${NC}"
                git add .
                commit_changes
                push_changes
                echo -e "${GREEN}✅ Quick save and push completed${NC}"
                break
                ;;
            "Documented Save & Push")
                echo -e "${BLUE}📚 Documented Save & Push${NC}"
                generate_documentation
                git add .
                commit_changes
                push_changes
                echo -e "${GREEN}✅ Documented save and push completed${NC}"
                break
                ;;
            "Full Workflow")
                echo -e "${BLUE}🔄 Full Interactive Workflow${NC}"
                generate_documentation
                stage_changes
                commit_changes
                push_changes
                echo -e "${GREEN}✅ Full workflow completed${NC}"
                break
                ;;
            "Cancel")
                return
                ;;
        esac
    done
}

# NEW: Previous Checkpoint - restore ALL modified files
previous_checkpoint() {
    echo -e "${BLUE}⏪ Previous Checkpoint (Restore All Modified Files)${NC}"
    
    # Check if there are any modified files
    local modified_files=$(git diff --name-only)
    if [ -z "$modified_files" ]; then
        echo -e "${YELLOW}No modified files to restore.${NC}"
        return
    fi
    
    echo -e "${YELLOW}Modified files that will be restored:${NC}"
    echo "$modified_files" | sed 's/^/   • /'
    echo
    
    echo -e "${RED}⚠️  This will discard ALL changes to modified files!${NC}"
    read -p "Continue with restoring all modified files? [y/N] " confirm
    
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        git checkout -- .
        echo -e "${GREEN}✅ All modified files restored to previous checkpoint${NC}"
    else
        echo -e "${YELLOW}Restoration cancelled${NC}"
    fi
}

# NEW: Load Checkpoint with choice-driven restoration
load_checkpoint() {
    echo -e "${BLUE}📂 Load Checkpoint${NC}"
    echo -e "${YELLOW}What type of restoration do you need?${NC}"
    
    select restoration_type in "Restore Modified Files" "Complete Rollback" "Advanced Recovery" "Time Travel" "Cancel"; do
        case $restoration_type in
            "Restore Modified Files")
                previous_checkpoint
                break
                ;;
            "Complete Rollback")
                complete_rollback
                break
                ;;
            "Advanced Recovery")
                reflog_operations
                break
                ;;
            "Time Travel")
                restore_file_version
                break
                ;;
            "Cancel")
                return
                ;;
        esac
    done
}

# NEW: Advanced Operations Menu (categorized)
advanced_operations_menu() {
    echo -e "${BLUE}⚙️  Advanced Operations${NC}"
    
    options=(
        "📁 Repository Setup"
        "🌿 Branch Operations" 
        "🔄 Advanced Recovery"
        "📊 Information & Status"
        "Back to Main Menu"
    )
    
    select category in "${options[@]}"; do
        case $REPLY in
            1) # Repository Setup
                echo -e "${CYAN}📁 Repository Setup${NC}"
                select repo_opt in "Initialize/Setup Repository" "View Detailed Status" "Back"; do
                    case $REPLY in
                        1) init_repository ;;
                        2) git status --porcelain=v1 --branch ;;
                        3) break ;;
                    esac
                done
                ;;
            2) # Branch Operations
                echo -e "${CYAN}🌿 Branch Operations${NC}"
                select branch_opt in "Branch Management" "Stage/Commit/Push/Pull Operations" "Back"; do
                    case $REPLY in
                        1) manage_branches ;;
                        2) git_operations_menu ;;
                        3) break ;;
                    esac
                done
                ;;
            3) # Advanced Recovery
                echo -e "${CYAN}🔄 Advanced Recovery${NC}"
                select recovery_opt in "Reflog Operations" "Restore Single Modified File" "Back"; do
                    case $REPLY in
                        1) reflog_operations ;;
                        2) restore_modified_file ;;
                        3) break ;;
                    esac
                done
                ;;
            4) # Information & Status
                echo -e "${CYAN}📊 Information & Status${NC}"
                select info_opt in "View Commit Log" "Save Project Tree" "Repository Status" "Back"; do
                    case $REPLY in
                        1) show_log ;;
                        2) show_repo_tree "save" ;;
                        3) git status ;;
                        4) break ;;
                    esac
                done
                ;;
            5) # Back to main menu
                break
                ;;
            *)
                echo -e "${RED}Invalid option${NC}"
                ;;
        esac
        if [ $REPLY -ne 5 ]; then
            read -p "Press Enter to continue..."
        fi
    done
}

# Function for git operations submenu (kept for advanced menu)
git_operations_menu() {
    echo -e "${BLUE}Git Operations${NC}"
    
    options=(
        "Stage Changes"
        "Commit Changes"
        "Push Changes"
        "Pull Changes"
        "Back to Advanced Menu"
    )
    
    select opt in "${options[@]}"; do
        case $REPLY in
            1)
                stage_changes
                ;;
            2)
                commit_changes
                ;;
            3)
                push_changes
                ;;
            4)
                pull_changes
                ;;
            5)
                break
                ;;
            *)
                echo -e "${RED}Invalid option${NC}"
                ;;
        esac
        if [ $REPLY -ne 5 ]; then
            read -p "Press Enter to continue..."
        fi
    done
}

# Function to get repository status for display
get_repo_status() {
    local status_line=""
    
    # Get modified, staged, and ahead/behind info
    local modified=$(git diff --name-only | wc -l | tr -d ' ')
    local staged=$(git diff --cached --name-only | wc -l | tr -d ' ')
    local untracked=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')
    
    # Build status line
    if [ "$modified" -gt 0 ] || [ "$staged" -gt 0 ] || [ "$untracked" -gt 0 ]; then
        status_parts=()
        [ "$modified" -gt 0 ] && status_parts+=("${modified} modified")
        [ "$staged" -gt 0 ] && status_parts+=("${staged} staged") 
        [ "$untracked" -gt 0 ] && status_parts+=("${untracked} untracked")
        status_line=$(IFS=', '; echo "${status_parts[*]}")
    else
        status_line="Clean working directory"
    fi
    
    # Get last commit info
    local last_commit=""
    if git rev-parse --quiet HEAD > /dev/null 2>&1; then
        last_commit=$(git log -1 --pretty=format:'"%s" (%cr)')
    else
        last_commit="No commits yet"
    fi
    
    echo "Status: $status_line | Last: $last_commit"
}

# Main menu with checkpoint interface
show_main_menu() {
    clear
    echo -e "${GREEN}=== 🎯 Git Checkpoint Manager ===${NC}"
    echo "📁 Directory: $(basename $(pwd))"
    echo -e "🌿 Branch: ${BLUE}$(git branch --show-current)${NC}"
    echo -e "$(get_repo_status)"
    echo
    
    options=(
        "🚀 Quick Checkpoint"
        "🏆 Success Checkpoint" 
        "⏪ Previous Checkpoint"
        "📂 Load Checkpoint"
        "📊 Generate Codebase Overview"
        "🕰️  Restore Specific Files"
        "⚙️  Other Menu"
        "❌ Exit"
    )
    
    select opt in "${options[@]}"; do
        case $REPLY in
            1) stage_commit_push ;;
            2) success_checkpoint ;;
            3) previous_checkpoint ;;
            4) load_checkpoint ;;
            5) generate_documentation ;;
            6) restore_file_version ;;
            7) advanced_operations_menu ;;
            8) echo -e "${GREEN}👋 Goodbye!${NC}" ; exit 0 ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac
        read -p "Press Enter to continue..."
        break
    done
}

# Main loop
while true; do
    show_main_menu
done