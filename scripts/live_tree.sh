#!/bin/bash

# live-tree-seconds.sh - Flicker-free version

cleanup() {
    # Switch back to main screen buffer and restore cursor
    printf "\033[?1049l"
    tput cnorm
    exit 0
}

trap cleanup INT TERM EXIT

# Enter alternate screen buffer (clean slate, no scrollback)
printf "\033[?1049h"
tput civis  # Hide cursor

TREE_OPTS="-L 2"  # Adjust depth as needed

while true; do
    # Move to top-left instead of clearing (smoother)
    tput cup 0 0

    # Print header
    echo "=== Live Directory Monitor ==="
    echo "Updated: $(date '+%H:%M:%S') | Ctrl+C to exit"
    echo ""

    # Print tree with seconds
    tree -D --timefmt "%Y-%m-%d %H:%M:%S" $TREE_OPTS 2>/dev/null | perl -MTime::Piece -pe '
        if (/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/) {
            $t = Time::Piece->strptime($1, "%Y-%m-%d %H:%M:%S");
            $secs = time - $t->epoch;
            $rel = $secs < 0
                ? "in " . abs($secs) . "s (future)"
                : $secs . "s ago";
            s/\Q$1\E/$rel/;
        }
    '

    # Clear any remaining lines from previous longer output
    tput ed

    sleep 1
done
