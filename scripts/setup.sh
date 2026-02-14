#!/bin/bash

output=$(
  scripts/lib/validate.sh 2>&1
)
status=$?
if [ $status -eq 0 ]; then
  echo "✅ Setup OK"
else
  echo "❌ Setup NOT OK"
  case $status in
    2) echo -e "API unreachable\n$output\nPlease try again later..." ;;
    3) echo -e "Misconfiguration\n$output" ;;
    *) echo "$output" ;;
  esac
  exit 1
fi

output=$(
  scripts/lib/install.sh 2>&1
)
status=$?
if [ $status -eq 0 ]; then
  echo "✅ Tools OK"
else
  echo "❌ Tools NOT OK"
  echo "$output"
  exit 1
fi
