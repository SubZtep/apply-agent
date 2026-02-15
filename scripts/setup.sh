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
    3) echo -e "Missing config file\n$output" ;;
    69) echo -e "API unreachable\n$output\nPlease try again later..."; exit $status ;;
    78) echo -e "Missing configuration\n$output"; exit $status ;;
    *) echo "$output"; exit 1 ;;
  esac
fi

output=$(
  scripts/lib/check.sh 2>&1
)
status=$?
if [ $status -eq 0 ]; then
  echo "✅Config OK"
else
  echo -e "❌ Config NOT OK\n$output"
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
