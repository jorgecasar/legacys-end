#!/bin/bash
set -e

ISSUE_NUMBER=${1:-21}

echo "🔍 Fetching Issue #$ISSUE_NUMBER..."
gh issue view $ISSUE_NUMBER --json title,body > issue.json

echo "✅ issue.json created."

TITLE=$(jq -r .title issue.json)
echo "TITLE: $TITLE"

# Simulating the delimiter logic
DELIMITER="$(openssl rand -hex 8)"
echo "DELIMITER: $DELIMITER"

# Simulating the GHA output block
echo "--- SIMULATED GHA OUTPUT ---"
echo "body<<$DELIMITER"
jq -r .body issue.json
echo "$DELIMITER"
echo "---------------------------"

echo "✅ Step 1 (Context Fetch) passed locally."

# Step 2: Simulate Prompt Construction (Optional check)
echo "PROMPT PREVIEW:"
echo "You are a Developer Agent."
echo "Goal: Analyze issue #$ISSUE_NUMBER"
echo "Title: $TITLE"
echo "Body:"
echo "(jq output from above)"
echo "Instruction: Return a JSON object with the plan."
