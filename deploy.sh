#!/bin/bash

set -e

if [ -z "$VIRTUAL_ENV" ]; then
    echo "*** you forgot to activate the venv ***" >&2
    exit 1
fi

python3 build.py

temp=$(mktemp -d)
echo "Temp directory: $temp"

(cd $temp && git clone --quiet https://github.com/Akuli/music-theory)
(cd $temp/music-theory && git checkout --quiet gh-pages)
cp -v html/index.html $temp/music-theory/
(cd $temp/music-theory/ && git add . && git commit -m "Deploy with $0" && git push origin gh-pages)

rm -rf "$temp"
