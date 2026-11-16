#!/bin/bash

# Basic iHatePosting CLI Usage Example
# Make sure to set your API key first: export IHATEPOSTING_API_KEY=your_key

echo "🚀 iHatePosting CLI Example Workflow"
echo ""

# Check if API key is set
if [ -z "$IHATEPOSTING_API_KEY" ]; then
    echo "❌ IHATEPOSTING_API_KEY is not set!"
    echo "Set it with: export IHATEPOSTING_API_KEY=your_api_key"
    exit 1
fi

echo "✅ API key is set"
echo ""

# 1. List integrations
echo "📋 Step 1: Listing connected integrations..."
ihateposting-agent integrations:list
echo ""

# 2. Create a post
# Replace x-123 with the id of one of the channels listed in step 1.
# -t draft keeps the post without publishing it.
# The date in the last line is 1 hour from now. That form of date works on macOS;
# on Linux write: date -u -d '+1 hour' +%Y-%m-%dT%H:%M:%SZ
echo "📝 Step 2: Creating a test post..."
ihateposting-agent posts:create \
  -c "Hello from iHatePosting CLI! This is an automated test post." \
  -t draft \
  -i "x-123" \
  -s "$(date -u -v+1H +%Y-%m-%dT%H:%M:%SZ)" # Draft dated 1 hour from now
echo ""

# 3. List posts
echo "📋 Step 3: Listing recent posts..."
ihateposting-agent posts:list
echo ""

echo "✅ Example workflow completed!"
echo ""
echo "💡 Tips:"
echo "  - Use -i flag to specify integrations when creating posts"
echo "  - Upload images with: ihateposting-agent upload ./path/to/image.png"
echo "  - Delete posts with: ihateposting-agent posts:delete <post-id>"
echo "  - Get help: ihateposting-agent --help"
