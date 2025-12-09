#!/bin/bash

# Comprehensive TypeScript Error Fix Script
# Fixes common patterns from mass JS to TS conversion

echo "🔧 Fixing TypeScript errors comprehensively..."

# Fix 1: Function parameters with destructuring - add : any
find src/{clientDashboard,tenantDashboard,adminDashboard} -name "*.tsx" -type f -exec sed -i '' \
  -e 's/function \([a-zA-Z_][a-zA-Z0-9_]*\)({ \([^}]*\) })/function \1({ \2 }: any)/g' \
  -e 's/export default function \([a-zA-Z_][a-zA-Z0-9_]*\)({ \([^}]*\) })/export default function \1({ \2 }: any)/g' \
  {} \;

# Fix 2: Arrow functions with destructuring
find src/{clientDashboard,tenantDashboard,adminDashboard} -name "*.tsx" -type f -exec sed -i '' \
  -e 's/const \([a-zA-Z_][a-zA-Z0-9_]*\) = ({ \([^}]*\) }) =>/const \1 = ({ \2 }: any) =>/g' \
  {} \;

# Fix 3: Add type to formData state
find src/{clientDashboard,tenantDashboard,adminDashboard} -name "*.tsx" -type f -exec sed -i '' \
  -e 's/useState({})/useState<any>({})/g' \
  -e 's/useState(\[\])/useState<any[]>([])/g' \
  {} \;

# Fix 4: Map callbacks with implicit any
find src/{clientDashboard,tenantDashboard,adminDashboard} -name "*.tsx" -type f -exec sed -i '' \
  -e 's/\.map((\([a-zA-Z_][a-zA-Z0-9_]*\)) =>/.map((\1: any) =>/g' \
  -e 's/\.map(({ \([^}]*\) }) =>/.map(({ \1 }: any) =>/g' \
  -e 's/\.forEach((\([a-zA-Z_][a-zA-Z0-9_]*\)) =>/.forEach((\1: any) =>/g' \
  -e 's/\.filter((\([a-zA-Z_][a-zA-Z0-9_]*\)) =>/.filter((\1: any) =>/g' \
  {} \;

# Fix 5: Event handlers
find src/{clientDashboard,tenantDashboard,adminDashboard} -name "*.tsx" -type f -exec sed -i '' \
  -e 's/= (e) =>/= (e: any) =>/g' \
  -e 's/= (event) =>/= (event: any) =>/g' \
  {} \;

echo "✅ Applied comprehensive TypeScript fixes"
echo "📊 Checking build status..."
