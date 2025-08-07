#!/bin/bash

echo "Testing payment status endpoint..."
echo ""

# Test the public payment status endpoint
echo "Calling GET /api/payment/status"
curl -X GET http://localhost:8080/api/payment/status \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n" \
  | jq . 2>/dev/null || cat

echo ""
echo "Test completed."
