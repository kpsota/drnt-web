#!/usr/bin/env bash
# Stáhne html5up template a vytvoří preview-<template>.html pro experimentování.
# Použití: ./use-template.sh stellar
#
# Doporučené templaty pro vyzkoušení:
#   stellar   – sekce s ikonami, čistý profesionální vzhled
#   phantom   – tiles grid, výborné pro prezentaci služeb
#   story     – fullscreen scrolling sekce s obrázky
#   landed    – hero + sekce, business-style
#   prologue  – sidebar + velký header
#   multiverse – masonry grid

set -e

TEMPLATE="${1:-stellar}"
DEST="templates/$TEMPLATE"
OUTPUT="preview-$TEMPLATE.html"

if [ -z "$1" ]; then
    echo "Použití: ./use-template.sh <template>"
    echo "Příklad: ./use-template.sh stellar"
    echo ""
    echo "Dostupné: stellar, phantom, story, landed, prologue, multiverse"
    exit 1
fi

if [ ! -d "$DEST" ]; then
    echo "Stahuji $TEMPLATE z html5up.net..."
    curl -sL "https://html5up.net/$TEMPLATE/download" -o "/tmp/h5u-$TEMPLATE.zip"
    mkdir -p "$DEST"
    unzip -q "/tmp/h5u-$TEMPLATE.zip" -d "$DEST"
    rm "/tmp/h5u-$TEMPLATE.zip"
    echo "Staženo do $DEST/"
else
    echo "Template $TEMPLATE už je stažen ($DEST/)."
fi

# Oprav relativní cesty assets/* -> templates/<template>/assets/*
sed \
    -e "s|href=\"assets/|href=\"$DEST/assets/|g" \
    -e "s|src=\"assets/|src=\"$DEST/assets/|g" \
    "$DEST/index.html" > "$OUTPUT"

echo ""
echo "Hotovo! Otevři v prohlížeči:"
echo "  file://$(pwd)/$OUTPUT"
echo ""
echo "Pokud se ti líbí, řekni mi a zapojíme content.json do tohoto templatu."
