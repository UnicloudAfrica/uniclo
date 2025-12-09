#!/bin/bash

# Fix imports for TypeScript converted files
# This script adds .ts or .tsx extensions to imports that were converted

echo "Fixing TypeScript imports..."

# Fix toastUtil imports (.ts)
find /Users/mac_1/Documents/GitHub/unicloud/web/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's|from ["'\'']\.\./\.\./utils/toastUtil["'\'']|from "../../utils/toastUtil.ts"|g' {} +
find /Users/mac_1/Documents/GitHub/unicloud/web/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's|from ["'\'']\.\./\.\./\.\./utils/toastUtil["'\'']|from "../../../utils/toastUtil.ts"|g' {} +
find /Users/mac_1/Documents/GitHub/unicloud/web/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's|from ["'\'']\.\./ utils/toastUtil["'\'']|from "../../utils/toastUtil.ts"|g' {} +
find /Users/mac_1/Documents/GitHub/unicloud/web/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's|from ["'\'']\.\./\.\./\.\./\.\./utils/toastUtil["'\'']|from "../../../../utils/toastUtil.ts"|g' {} +

# Fix ModernButton imports (.tsx)
find /Users/mac_1/Documents/GitHub/unicloud/web/src/adminDashboard -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's|from ["'\'']\.\/ModernButton["'\'']|from "./ModernButton.tsx"|g' {} +
find /Users/mac_1/Documents/GitHub/unicloud/web/src/adminDashboard -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's|from ["'\'']\.\./components/ModernButton["'\'']|from "../components/ModernButton.tsx"|g' {} +
find /Users/mac_1/Documents/GitHub/unicloud/web/src/adminDashboard -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed-i '' 's|from ["'\'']\.\./../components/ModernButton["'\'']|from "../../components/ModernButton.tsx"|g' {} +

# Fix ModernCard imports (.tsx)
find /Users/mac_1/Documents/GitHub/unicloud/web/src/adminDashboard -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's|from ["'\'']\.\/ModernCard["'\'']|from "./ModernCard.tsx"|g' {} +
find /Users/mac_1/Documents/GitHub/unicloud/web/src/adminDashboard -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's|from ["'\'']\.\./components/ModernCard["'\'']|from "../components/ModernCard.tsx"|g' {} +

# Fix ModernInput imports (.tsx)  
find /Users/mac_1/Documents/GitHub/unicloud/web/src/adminDashboard -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's|from ["'\'']\.\.\/components/ModernInput["'\'']|from "../components/ModernInput.tsx"|g' {} +
find /Users/mac_1/Documents/GitHub/unicloud/web/src/adminDashboard -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's|from ["'\'']\.\./\.\./components/ModernInput["'\'']|from "../../components/ModernInput.tsx"|g' {} +

# Fix AdminPageShell imports (.tsx)
find /Users/mac_1/Documents/GitHub/unicloud/web/src/adminDashboard -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's|from ["'\'']\.\./components/AdminPageShell["'\'']|from "../components/AdminPageShell.tsx"|g' {} +

echo "Import fixes complete!"
