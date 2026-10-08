#!/bin/sh
# The published page and data.js as the Artifact mock's `read` saves them. The page's
# first line is the plugin's own assets/client.html line, so the case always takes the
# data.js-only refresh, whatever version the release stamped.
case_dir=$(cd "$(dirname "$0")" && pwd)
mkdir -p artifact
{
  head -n 1 "$case_dir/../../skills/project-tracker/assets/client.html"
  cat <<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Client dashboard</title>
<link rel="stylesheet" href="core.css">
</head>
<body>
<div id="app"></div>
<script src="data.js"></script>
<script src="core.js"></script>
</body>
</html>
HTML
} > artifact/page.html
awk '/^```$/ { f = !f; next } f' "$case_dir/mocks/artifacts/_server.md" > artifact/data.js
