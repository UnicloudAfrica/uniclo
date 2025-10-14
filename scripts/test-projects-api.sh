#!/bin/bash
###############################################################################
# Projects API Testing Script
# 
# Tests all projects endpoints and captures real response structures
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE_URL="${REACT_APP_API_USER_BASE_URL:-http://localhost:8000}"
OUTPUT_DIR="./api-responses/projects"

mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}🚀 Projects API Testing Tool${NC}"
echo -e "${BLUE}============================${NC}\n"

# Function to make authenticated request
make_auth_request() {
    local method=$1
    local endpoint=$2
    local token=$3
    local body=$4
    
    if [ -z "$body" ]; then
        curl -s -w '\n%{http_code}' -X "$method" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            "$API_BASE_URL$endpoint"
    else
        curl -s -w '\n%{http_code}' -X "$method" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$body" \
            "$API_BASE_URL$endpoint"
    fi
}

# Admin Login
echo -e "${YELLOW}🔐 Logging in as admin...${NC}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@unicloudafrica.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Testtest1@}"

login_response=$(curl -s -X POST \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    "$API_BASE_URL/admin/v1/login")

ADMIN_TOKEN=$(echo "$login_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ Admin login failed${NC}"
    echo "$login_response" | python3 -m json.tool 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}\n"

###############################################################################
# Test Projects Endpoints
###############################################################################

echo -e "${BLUE}📦 Testing Projects Endpoints${NC}"
echo -e "${BLUE}=============================${NC}\n"

# 1. GET /admin/v1/projects (List all projects)
echo -e "${YELLOW}1. GET /admin/v1/projects${NC}"
response=$(make_auth_request "GET" "/admin/v1/projects" "$ADMIN_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "  ${GREEN}✅ Status: $http_code${NC}"
    echo "$body" | python3 -m json.tool > "$OUTPUT_DIR/list-projects.json" 2>/dev/null
    
    # Extract project count and first project
    count=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null)
    echo -e "  ${BLUE}📊 Found $count projects${NC}"
    
    # Get first project ID for further testing
    FIRST_PROJECT_ID=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); projects=data.get('data', []); print(projects[0].get('id', '') if projects else '')" 2>/dev/null)
    FIRST_PROJECT_IDENTIFIER=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); projects=data.get('data', []); print(projects[0].get('identifier', '') if projects else '')" 2>/dev/null)
    
    if [ ! -z "$FIRST_PROJECT_IDENTIFIER" ]; then
        echo -e "  ${BLUE}🔑 First project identifier: $FIRST_PROJECT_IDENTIFIER${NC}"
    fi
else
    echo -e "  ${RED}❌ Status: $http_code${NC}"
    echo "$body" | python3 -m json.tool
fi
echo ""

# 2. GET /admin/v1/projects/{project} (Show single project)
if [ ! -z "$FIRST_PROJECT_ID" ]; then
    echo -e "${YELLOW}2. GET /admin/v1/projects/$FIRST_PROJECT_ID${NC}"
    response=$(make_auth_request "GET" "/admin/v1/projects/$FIRST_PROJECT_ID" "$ADMIN_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "  ${GREEN}✅ Status: $http_code${NC}"
        echo "$body" | python3 -m json.tool > "$OUTPUT_DIR/show-project.json" 2>/dev/null
        
        # Show project details
        name=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('name', 'N/A'))" 2>/dev/null)
        region=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('region', 'N/A'))" 2>/dev/null)
        status=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('status', 'N/A'))" 2>/dev/null)
        
        echo -e "  ${BLUE}📋 Name: $name${NC}"
        echo -e "  ${BLUE}🌍 Region: $region${NC}"
        echo -e "  ${BLUE}📊 Status: $status${NC}"
    else
        echo -e "  ${RED}❌ Status: $http_code${NC}"
    fi
    echo ""
fi

# 3. GET /admin/v1/projects/{project}/status
if [ ! -z "$FIRST_PROJECT_ID" ]; then
    echo -e "${YELLOW}3. GET /admin/v1/projects/$FIRST_PROJECT_ID/status${NC}"
    response=$(make_auth_request "GET" "/admin/v1/projects/$FIRST_PROJECT_ID/status" "$ADMIN_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "  ${GREEN}✅ Status: $http_code${NC}"
        echo "$body" | python3 -m json.tool > "$OUTPUT_DIR/project-status.json" 2>/dev/null
        
        # Show status details
        echo "$body" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'data' in data:
    print(f'  📊 Provisioning Status: {data[\"data\"].get(\"provisioning_status\", \"N/A\")}')
    print(f'  🔄 Provider Status: {data[\"data\"].get(\"provider_status\", \"N/A\")}')
    print(f'  📈 Infrastructure Ready: {data[\"data\"].get(\"infrastructure_ready\", \"N/A\")}')
" 2>/dev/null
    else
        echo -e "  ${RED}❌ Status: $http_code${NC}"
    fi
    echo ""
fi

# 4. POST /admin/v1/projects (Create new project - with sample data)
echo -e "${YELLOW}4. POST /admin/v1/projects (Create)${NC}"
create_payload='{
  "name": "Test Project - API Testing",
  "description": "Created by API test script",
  "region": "lagos1",
  "tenant_id": 1
}'

echo -e "  ${BLUE}📝 Payload:${NC}"
echo "$create_payload" | python3 -m json.tool

response=$(make_auth_request "POST" "/admin/v1/projects" "$ADMIN_TOKEN" "$create_payload")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "  ${GREEN}✅ Status: $http_code - Project created!${NC}"
    echo "$body" | python3 -m json.tool > "$OUTPUT_DIR/create-project.json" 2>/dev/null
    
    NEW_PROJECT_ID=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('id', ''))" 2>/dev/null)
    echo -e "  ${BLUE}🆔 New Project ID: $NEW_PROJECT_ID${NC}"
else
    echo -e "  ${RED}❌ Status: $http_code${NC}"
    echo "$body" | python3 -m json.tool
fi
echo ""

# 5. PUT /admin/v1/projects/{project} (Update project)
if [ ! -z "$NEW_PROJECT_ID" ]; then
    echo -e "${YELLOW}5. PUT /admin/v1/projects/$NEW_PROJECT_ID (Update)${NC}"
    update_payload='{
      "name": "Test Project - Updated",
      "description": "Updated by API test script"
    }'
    
    response=$(make_auth_request "PUT" "/admin/v1/projects/$NEW_PROJECT_ID" "$ADMIN_TOKEN" "$update_payload")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✅ Status: $http_code - Project updated!${NC}"
        echo "$body" | python3 -m json.tool > "$OUTPUT_DIR/update-project.json" 2>/dev/null
    else
        echo -e "  ${RED}❌ Status: $http_code${NC}"
        echo "$body" | python3 -m json.tool
    fi
    echo ""
fi

###############################################################################
# Summary
###############################################################################

echo -e "\n${BLUE}📊 TEST SUMMARY${NC}"
echo -e "${BLUE}===============${NC}\n"

file_count=$(ls -1 "$OUTPUT_DIR" | wc -l)
echo -e "${GREEN}✅ Saved $file_count response files to: $OUTPUT_DIR${NC}"
echo -e "${BLUE}📁 Files:${NC}"
ls -1 "$OUTPUT_DIR" | sed 's/^/  - /'

echo -e "\n${YELLOW}💡 Next Steps:${NC}"
echo -e "1. Review responses: ${BLUE}cat $OUTPUT_DIR/list-projects.json | jq${NC}"
echo -e "2. Use the response structure to build UI components"
echo -e "3. Match exact field names from the responses\n"
