#!/bin/bash

# Test data
JSON_DATA='{
  "title": "Test Ticket from CLI",
  "description": "This is a test ticket created via curl to test the AI integration."
}'

# Make the API call
echo "Testing ticket creation API..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .next/server/cookie.txt 2>/dev/null || echo '')" \
  -d "$JSON_DATA" \
  http://localhost:3000/api/tickets \
  -v 2>&1 | tee api-response.log

echo "\nResponse has been logged to api-response.log" 