#!/bin/bash
# usage: CAR='{...}' ./kbs.sh opts aggr  -> runs 4 seeds, prints lap summaries
for s in 1 2 3 4; do timeout 300 node "$(dirname "$0")/kb.mjs" "$1" ${2:-1} $s | grep -E "^lap" | head -1; done
