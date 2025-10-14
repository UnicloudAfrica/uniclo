#!/bin/bash
###############################################################################
# Quick API Testing Script
# 
# This script uses curl to quickly test backend endpoints and save responses
# Usage: ./scripts/quick-test-api.sh
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backend URL
API_BASE_URL="${REACT_APP_API_USER_BASE_URL:-http://localhost:8000}"
OUTPUT_DIR="./api-responses"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}🚀 UniCloud API Quick Test${NC}"
echo -e "${BLUE}=============================${NC}"
echo -e "${BLUE}📍 Backend: $API_BASE_URL${NC}\n"

# Test if backend is running
echo -e "${YELLOW}🔍 Checking if backend is running...${NC}"
if curl -s -f -o /dev/null "$API_BASE_URL"; then
    echo -e "${GREEN}✅ Backend is responding${NC}\n"
else
    echo -e "${RED}❌ Backend is not responding at $API_BASE_URL${NC}"
    echo -e "${YELLOW}💡 Make sure the backend is running: cd ../uca-backend && php artisan serve${NC}\n"
    exit 1
fi

###############################################################################
# Function to test an endpoint
###############################################################################
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local auth_header=$4
    local body=$5
    
    echo -e "${YELLOW}Testing: $name${NC}"
    echo -e "  ${BLUE}$method $endpoint${NC}"
    
    # Build curl command
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    curl_cmd="$curl_cmd -H 'Accept: application/json'"
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [ ! -z "$auth_header" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_header'"
    fi
    
    if [ ! -z "$body" ]; then
        curl_cmd="$curl_cmd -d '$body'"
    fi
    
    curl_cmd="$curl_cmd '$API_BASE_URL$endpoint'"
    
    # Execute request
    response=$(eval $curl_cmd)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Save response
    local filename=$(echo "$endpoint" | sed 's/\//_/g' | sed 's/^_//')
    echo "$body" | python3 -m json.tool 2>/dev/null > "$OUTPUT_DIR/${filename}.json" || echo "$body" > "$OUTPUT_DIR/${filename}.txt"
    
    # Check status
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✅ Status: $http_code${NC}"
        
        # Try to parse and show data summary
        if command -v jq &> /dev/null; then
            local data_type=$(echo "$body" | jq -r 'type' 2>/dev/null)
            if [ "$data_type" = "array" ]; then
                local count=$(echo "$body" | jq '. | length' 2>/dev/null)
                echo -e "  ${BLUE}📊 Array with $count items${NC}"
            elif [ "$data_type" = "object" ]; then
                local has_data=$(echo "$body" | jq 'has("data")' 2>/dev/null)
                if [ "$has_data" = "true" ]; then
                    local data_count=$(echo "$body" | jq '.data | length' 2>/dev/null)
                    echo -e "  ${BLUE}📊 Response with data array: $data_count items${NC}"
                fi
            fi
        fi
        echo -e "  ${GREEN}💾 Saved to: $OUTPUT_DIR/${filename}.json${NC}"
    else
        echo -e "  ${RED}❌ Status: $http_code${NC}"
        local error_msg=$(echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "Unknown error")
        echo -e "  ${RED}Error: $error_msg${NC}"
    fi
    echo ""
}

###############################################################################
# Test Public Endpoints (No Auth Required)
###############################################################################
echo -e "\n${BLUE}🌍 PUBLIC ENDPOINTS${NC}"
echo -e "${BLUE}===================${NC}\n"

test_endpoint "Calculator Options" "GET" "/api/v1/calculator-options"
test_endpoint "Product Pricing" "GET" "/api/v1/product-pricing"
test_endpoint "Product Bandwidth" "GET" "/api/v1/product-bandwidth"
test_endpoint "OS Images" "GET" "/api/v1/product-os-image"
test_endpoint "Compute Instances" "GET" "/api/v1/product-compute-instance"
test_endpoint "Volume Types" "GET" "/api/v1/product-volume-type"
test_endpoint "Cross Connect" "GET" "/api/v1/product-cross-connect"
test_endpoint "Floating IPs" "GET" "/api/v1/product-floating-ip"
test_endpoint "Countries" "GET" "/api/v1/countries"
test_endpoint "Industries" "GET" "/api/v1/industries"

###############################################################################
# Admin Login (if credentials provided)
###############################################################################
echo -e "\n${BLUE}👨‍💼 ADMIN ENDPOINTS${NC}"
echo -e "${BLUE}==================${NC}\n"

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@test.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-password}"

echo -e "${YELLOW}Attempting admin login...${NC}"
login_response=$(curl -s -X POST \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    "$API_BASE_URL/admin/v1/login")

ADMIN_TOKEN=$(echo "$login_response" | jq -r '.token // empty' 2>/dev/null)

if [ ! -z "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✅ Admin login successful${NC}\n"
    
    test_endpoint "Admin Users" "GET" "/admin/v1/admins" "$ADMIN_TOKEN"
    test_endpoint "Clients List" "GET" "/admin/v1/clients" "$ADMIN_TOKEN"
    test_endpoint "Projects List" "GET" "/admin/v1/projects" "$ADMIN_TOKEN"
    test_endpoint "Instances List" "GET" "/admin/v1/instances" "$ADMIN_TOKEN"
    test_endpoint "Regions" "GET" "/admin/v1/regions" "$ADMIN_TOKEN"
    test_endpoint "Admin Product Pricing" "GET" "/admin/v1/product-pricing" "$ADMIN_TOKEN"
    test_endpoint "Leads" "GET" "/admin/v1/leads" "$ADMIN_TOKEN"
    test_endpoint "Sub Tenants" "GET" "/admin/v1/sub-tenants" "$ADMIN_TOKEN"
else
    echo -e "${RED}❌ Admin login failed${NC}"
    echo -e "${YELLOW}💡 Set credentials: export ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=yourpass${NC}\n"
fi

###############################################################################
# Summary
###############################################################################
echo -e "\n${BLUE}📊 SUMMARY${NC}"
echo -e "${BLUE}==========${NC}\n"

response_count=$(ls -1 "$OUTPUT_DIR" | wc -l)
echo -e "${GREEN}✅ Total responses saved: $response_count${NC}"
echo -e "${BLUE}📂 Responses directory: $OUTPUT_DIR${NC}\n"

# Generate a simple index file
echo "# API Test Responses" > "$OUTPUT_DIR/INDEX.md"
echo "" >> "$OUTPUT_DIR/INDEX.md"
echo "Generated: $(date)" >> "$OUTPUT_DIR/INDEX.md"
echo "Backend URL: $API_BASE_URL" >> "$OUTPUT_DIR/INDEX.md"
echo "" >> "$OUTPUT_DIR/INDEX.md"
echo "## Files" >> "$OUTPUT_DIR/INDEX.md"
echo "" >> "$OUTPUT_DIR/INDEX.md"

for file in "$OUTPUT_DIR"/*.json "$OUTPUT_DIR"/*.txt; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "- [$filename]($filename)" >> "$OUTPUT_DIR/INDEX.md"
    fi
done

echo -e "${GREEN}✨ Testing complete!${NC}\n"
echo -e "${YELLOW}💡 Tip: Check the responses in $OUTPUT_DIR directory${NC}"
echo -e "${YELLOW}💡 Tip: Use these responses to build your UI components${NC}\n"
