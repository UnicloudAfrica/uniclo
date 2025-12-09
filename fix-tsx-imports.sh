#!/bin/bash

# Fix imports for converted TypeScript files
# This updates all imports to use the correct .tsx extensions

echo "Fixing TypeScript import paths..."

# Fix ModernCard imports
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' \
  -e "s|from ['\"].*components/ModernCard['\"]|from '../../adminDashboard/components/ModernCard.tsx'|g" \
  -e "s|from ['\"].*components/ModernCard.js['\"]|from '../../adminDashboard/components/ModernCard.tsx'|g" \
  {} +

# Fix ModernButton imports  
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' \
  -e "s|from ['\"].*components/ModernButton['\"]|from '../../adminDashboard/components/ModernButton.tsx'|g" \
  -e "s|from ['\"].*components/ModernButton.js['\"]|from '../../adminDashboard/components/ModernButton.tsx'|g" \
  {} +

# Fix ModernInput imports
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' \
  -e "s|from ['\"].*components/ModernInput['\"]|from '../../adminDashboard/components/ModernInput.tsx'|g" \
  -e "s|from ['\"].*components/ModernInput.js['\"]|from '../../adminDashboard/components/ModernInput.tsx'|g" \
  {} +

# Fix ModernStatsCard imports
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' \
  -e "s|from ['\"].*components/ModernStatsCard['\"]|from '../../adminDashboard/components/ModernStatsCard.tsx'|g" \
  -e "s|from ['\"].*components/ModernStatsCard.js['\"]|from '../../adminDashboard/components/ModernStatsCard.tsx'|g" \
  {} +

# Fix toastUtil imports
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' \
  -e "s|from ['\"].*utils/toastUtil['\"]|from '../utils/toastUtil.ts'|g" \
  -e "s|from ['\"]\.\.\/utils\/toastUtil['\"]|from '../utils/toastUtil.ts'|g" \
  {} +

echo "✅ Import paths fixed! Please rebuild."
