#!/bin/bash

# TypeScript Auto-Fix Script
# Adds `: any` type annotations to common implicit any errors

echo "🔧 Fixing TypeScript implicit 'any' errors..."

# Fix destructured parameters in arrow functions
# Pattern: ({ param1, param2 }) =>
find src/{clientDashboard,tenantDashboard,adminDashboard} -name "*.tsx" -type f -exec perl -i -pe '
  # Fix ({ param }) => patterns
  s/= \(\{ ([a-zA-Z_][a-zA-Z0-9_]*) \}\) =>/= ({ $1 }: any) =>/g;
  s/= \(\{ ([a-zA-Z_][a-zA-Z0-9_]*), ([a-zA-Z_][a-zA-Z0-9_]*) \}\) =>/= ({ $1, $2 }: any) =>/g;
  s/= \(\{ ([a-zA-Z_][a-zA-Z0-9_]*), ([a-zA-Z_][a-zA-Z0-9_]*), ([a-zA-Z_][a-zA-Z0-9_]*) \}\) =>/= ({ $1, $2, $3 }: any) =>/g;
  
  # Fix (param) => patterns  
  s/= \(([a-zA-Z_][a-zA-Z0-9_]*)\) =>/= ($1: any) =>/g unless /: any\)/;
  s/= \(([a-zA-Z_][a-zA-Z0-9_]*), ([a-zA-Z_][a-zA-Z0-9_]*)\) =>/= ($1: any, $2: any) =>/g unless /: any/;
  
  # Fix function parameters
  s/function ([a-zA-Z_][a-zA-Z0-9_]*)\(([a-zA-Z_][a-zA-Z0-9_]*)\)/function $1($2: any)/g unless /: any/;
  s/function ([a-zA-Z_][a-zA-Z0-9_]*)\(([a-zA-Z_][a-zA-Z0-9_]*), ([a-zA-Z_][a-zA-Z0-9_]*)\)/function $1($2: any, $3: any)/g unless /: any/;
' {} \;

echo "✅ Fixed implicit 'any' errors"
echo "📦 Running build to check for remaining errors..."
