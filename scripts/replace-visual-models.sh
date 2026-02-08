#!/usr/bin/env sh
set -eu

ROOT="content/trust_platform_content/parts"

replace_block() {
  file="$1"
  slug="$2"
  perl -0pi -e 's/## Visual Model\s*```[\s\S]*?```/## Visual Model\n\n!['"Visual Model"'](\/visuals\/'"$slug"'.svg)\n/g' "$file"
}

for part_dir in "$ROOT"/*; do
  [ -d "$part_dir" ] || continue
  slug=$(basename "$part_dir")

  for lesson in "$part_dir"/lessons/*.md; do
    [ -f "$lesson" ] || continue
    replace_block "$lesson" "$slug"
  done

  if [ -f "$part_dir/quest.md" ]; then
    replace_block "$part_dir/quest.md" "$slug"
  fi

done
