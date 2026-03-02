#!/usr/bin/env python3
"""Replace all console.log/warn/error/info/debug calls with logger equivalents."""

import os
import re
import sys

BASE_DIR = "/Users/mac_1/Documents/GitHub/unicloud/web"
SRC_DIR = os.path.join(BASE_DIR, "src")
LOGGER_PATH = os.path.join("src", "utils", "logger")

CONSOLE_PATTERN = re.compile(r'console\.(log|warn|error|info|debug)\(')

def find_files_with_console():
    """Find all .ts/.tsx files containing console.* calls."""
    matches = []
    for root, dirs, files in os.walk(SRC_DIR):
        # Skip node_modules if any
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for fname in files:
            if not (fname.endswith('.ts') or fname.endswith('.tsx')):
                continue
            fpath = os.path.join(root, fname)
            # Skip logger.ts itself
            rel = os.path.relpath(fpath, BASE_DIR)
            if rel == os.path.join("src", "utils", "logger.ts"):
                continue
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            if CONSOLE_PATTERN.search(content):
                matches.append(fpath)
    return matches

def compute_relative_import(file_path):
    """Compute relative import path from file to src/utils/logger."""
    file_dir = os.path.dirname(os.path.relpath(file_path, BASE_DIR))
    rel = os.path.relpath(LOGGER_PATH, file_dir)
    # Ensure it starts with ./ or ../
    if not rel.startswith('.'):
        rel = './' + rel
    return rel

def find_last_import_line(lines):
    """Find the index of the last import statement line."""
    last_import_idx = -1
    for i, line in enumerate(lines):
        stripped = line.lstrip()
        if stripped.startswith('import ') or stripped.startswith('import{'):
            last_import_idx = i
        # Also catch multi-line imports that end with } from
        elif 'from ' in stripped and (stripped.startswith('}') or stripped.startswith('} from')):
            last_import_idx = i
    return last_import_idx

def has_logger_import(content):
    """Check if file already has a logger import."""
    return bool(re.search(r"import\s+logger\s+from\s+", content))

def process_file(file_path):
    """Process a single file: add logger import and replace console.* calls."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add logger import if not present
    if not has_logger_import(content):
        rel_path = compute_relative_import(file_path)
        import_line = f"import logger from '{rel_path}';\n"

        lines = content.split('\n')
        last_import_idx = find_last_import_line(lines)

        if last_import_idx >= 0:
            # Insert after the last import
            lines.insert(last_import_idx + 1, import_line.rstrip('\n'))
        else:
            # No imports found, add at the top
            lines.insert(0, import_line.rstrip('\n'))

        content = '\n'.join(lines)

    # Replace console.* calls
    content = content.replace('console.log(', 'logger.log(')
    content = content.replace('console.warn(', 'logger.warn(')
    content = content.replace('console.error(', 'logger.error(')
    content = content.replace('console.info(', 'logger.info(')
    content = content.replace('console.debug(', 'logger.debug(')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    files = find_files_with_console()
    files.sort()
    print(f"Found {len(files)} files with console.* calls")

    for i, fpath in enumerate(files, 1):
        rel = os.path.relpath(fpath, BASE_DIR)
        process_file(fpath)
        print(f"[{i}] Processed: {rel}")

    print(f"\n=== Done! Total files changed: {len(files)} ===")

if __name__ == '__main__':
    main()
