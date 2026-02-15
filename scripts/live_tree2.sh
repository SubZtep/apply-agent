#!/bin/bash

cleanup() { printf "\033[?1049l"; tput cnorm; exit; }
trap cleanup INT TERM EXIT

printf "\033[?1049h"  # Alternate buffer
tput civis            # Hide cursor

while true; do
    # Capture everything first (atomic)
    output=$(
        echo "=== Live Tree | $(date +%H:%M:%S) ==="
        echo ""
        tree -D --timefmt "%Y-%m-%d %H:%M:%S" -L 2 2>/dev/null | perl -MTime::Piece -pe '
            if (/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/) {
                $s = time - Time::Piece->strptime($1, "%Y-%m-%d %H:%M:%S")->epoch;
                $unit = $s == 1 ? "second" : "seconds";
                s/\Q$1\E/$s $unit ago/;
            }
        '
    )

    # Clear + draw in one go (no flicker)
    printf "\033[H\033[2J%s" "$output"

    sleep 1
done
