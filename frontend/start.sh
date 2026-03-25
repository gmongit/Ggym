#!/bin/bash
# Startet den Frontend Dev-Server über Ableton's Node.js
NODE_DIR="/c/ProgramData/Ableton/Live 12 Standard/Resources/Max/resources/packages/Node for Max/source/bin/pc_x64/node"
NPM="/c/ProgramData/Ableton/Live 12 Standard/Resources/Max/resources/packages/Node for Max/source/bin/pc_x64/npm/npm.cmd"
export PATH="$NODE_DIR:$PATH"
"$NPM" run dev
