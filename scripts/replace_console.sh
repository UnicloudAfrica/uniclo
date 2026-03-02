#!/usr/bin/env bash
set -euo pipefail

cd /Users/mac_1/Documents/GitHub/unicloud/web

count=0

# Find all .ts and .tsx files containing console.(log|warn|error|info|debug)
# Exclude logger.ts itself
for file in $(grep -rl 'console\.\(log\|warn\|error\|info\|debug\)(' src/ --include='*.ts' --include='*.tsx' | grep -v 'src/utils/logger.ts'); do
  # Calculate relative import path from the file's directory to src/utils/logger
  rel=$(python3 -c "import os.path; print(os.path.relpath('src/utils/logger', '$(dirname "$file")'))")

  # Ensure the relative path starts with ./ or ../
  if [[ ! "$rel" == .* ]]; then
    rel="./$rel"
  fi

  # Check if logger import already exists
  if ! grep -q "import logger from" "$file"; then
    # Find the last import line number
    last_import_line=$(grep -n '^\s*import ' "$file" | tail -1 | cut -d: -f1)

    if [ -n "$last_import_line" ]; then
      # Insert logger import after the last import
      sed -i '' "${last_import_line}a\\
import logger from '${rel}';
" "$file"
    else
      # No existing imports, add at the top of the file
      sed -i '' "1i\\
import logger from '${rel}';
" "$file"
    fi
  fi

  # Replace console.log( with logger.log(
  sed -i '' 's/console\.log(/logger.log(/g' "$file"
  # Replace console.warn( with logger.warn(
  sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
  # Replace console.error( with logger.error(
  sed -i '' 's/console\.error(/logger.error(/g' "$file"
  # Replace console.info( with logger.info(
  sed -i '' 's/console\.info(/logger.info(/g' "$file"
  # Replace console.debug( with logger.debug(
  sed -i '' 's/console\.debug(/logger.debug(/g' "$file"

  count=$((count + 1))
  echo "[$count] Processed: $file"
done

echo ""
echo "=== Done! Total files changed: $count ==="
