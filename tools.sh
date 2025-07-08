#!/bin/bash

# File: tools.sh
# Purpose: Interactive launcher for all bash scripts in the sh folder
# Usage: ./tools.sh
# Dependencies: bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(dirname "$(realpath "$0")")/sh"

# Check if the script directory exists
if [ ! -d "$SCRIPT_DIR" ]; then
    echo -e "${RED}Error: Script directory '$SCRIPT_DIR' not found.${NC}"
    echo -e "Run ${YELLOW}./setup.sh${NC} to set up the environment."
    exit 1
fi

# Function to run comment scanner
run_comment_scanner() {
    clear
    echo -e "${BLUE}=== Comment Scanner ===${NC}"
    echo -e "This tool checks TypeScript files for required comment headers.\n"
    
    # Ask for directory
    echo -e "${YELLOW}Enter directory to scan [default: src]:${NC}"
    read -r directory
    directory=${directory:-src}
    
    # Execute the script
    "$SCRIPT_DIR/comment-scanner.sh" "$directory"
    
    echo -e "\n${GREEN}Scan completed.${NC}"
    read -p "Press Enter to return to the main menu..."
}

# Function to generate documentation
run_doc_gen() {
    clear
    echo -e "${BLUE}=== Documentation Generator ===${NC}"
    echo -e "This tool generates Markdown documentation for TypeScript projects.\n"
    
    # Ask for directory
    echo -e "${YELLOW}Enter directory to document [default: src]:${NC}"
    read -r directory
    directory=${directory:-src}
    
    # Execute the script
    "$SCRIPT_DIR/doc-gen.sh" "$directory"
    
    echo -e "\n${GREEN}Documentation generated.${NC}"
    read -p "Press Enter to return to the main menu..."
}

# Function to parse prompt
run_prompt_parser() {
    clear
    echo -e "${BLUE}=== Prompt Parser ===${NC}"
    echo -e "This tool parses prompt and extract the files .\n"
    
    # Execute the script
    "$SCRIPT_DIR/prompt_parser.sh"  
    
    echo -e "\n${GREEN}Prompt parsing completed.${NC}"
    read -p "Press Enter to return to the main menu..."
}

# Function to run git management
run_git_management() {
    clear
    echo -e "${BLUE}=== Git Management ===${NC}"
    echo -e "This tool provides an interface for git operations.\n"
    
    # Execute the script
    "$SCRIPT_DIR/git-checkpoint.sh"
    
    echo -e "\n${GREEN}Git management completed.${NC}"
    read -p "Press Enter to return to the main menu..."
}

# Function to show help
show_help() {
    clear
    echo -e "${BLUE}=== Help Information ===${NC}"
    echo -e "This launcher provides access to the following tools:\n"
    
    echo -e "${GREEN}1. Comment Scanner${NC}"
    echo -e "   Checks TypeScript files for required comment headers."
    echo -e "   Original script: comment-scanner.sh\n"
    
    echo -e "${GREEN}2. Documentation Generator${NC}"
    echo -e "   Generates Markdown documentation for TypeScript projects."
    echo -e "   Original script: doc-gen.sh\n"
    
    echo -e "${GREEN}3. Prompt Parser${NC}"
    echo -e "   Parses prompt and extract files."
    echo -e "   Original script: prompt_parser.sh\n"
    
    echo -e "${GREEN}4. Git Management${NC}"
    echo -e "   Provides an interface for git operations."
    echo -e "   Original script: git-checkpoint.sh\n"
    
    echo -e "${YELLOW}You can also run these tools directly from the command line:${NC}"
    echo -e "  ./tools.sh scan [directory]   - Run comment scanner"
    echo -e "  ./tools.sh docs [directory]   - Generate documentation"
    echo -e "  ./tools.sh prompt - Parse prompt and extract files"
    echo -e "  ./tools.sh git                - Git management"
    echo -e "  ./tools.sh help               - Show this help"
    
    read -p "Press Enter to return to the main menu..."
}

# Main menu function
show_main_menu() {
    clear
    echo -e "${BLUE}=== Script Launcher ===${NC}"
    echo -e "Current Directory: $(pwd)"
    
    echo -e "\n${YELLOW}Choose a tool to run:${NC}"
    echo -e "  ${GREEN}1${NC}. Comment Scanner"
    echo -e "  ${GREEN}2${NC}. Documentation Generator"
    echo -e "  ${GREEN}3${NC}. Prompt Parser"
    echo -e "  ${GREEN}4${NC}. Git Management"
    echo -e "  ${GREEN}5${NC}. Help"
    echo -e "  ${GREEN}0${NC}. Exit"
    
    echo -ne "\n${YELLOW}Enter your choice [0-5]: ${NC}"
    read -r choice
    
    case "$choice" in
        1) run_comment_scanner ;;
        2) run_doc_gen ;;
        3) run_prompt_parser ;;
        4) run_git_management ;;
        5) show_help ;;
        0) 
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            sleep 1
            ;;
    esac
}

# Command line mode for direct execution
if [ $# -gt 0 ]; then
    case "$1" in
        scan)
            shift # Remove the first argument
            "$SCRIPT_DIR/comment-scanner.sh" "$@"
            ;;
        docs)
            shift # Remove the first argument
            "$SCRIPT_DIR/doc-gen.sh" "$@"
            ;;
        prompt)
            shift # Remove the first argument
            "$SCRIPT_DIR/prompt_parser.sh" "$@"
            ;;
        git)
            shift # Remove the first argument
            "$SCRIPT_DIR/git-checkpoint.sh" "$@"
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            show_help
            exit 1
            ;;
    esac
    exit 0
fi

# Interactive mode - main loop
while true; do
    show_main_menu
done