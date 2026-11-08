#!/usr/bin/env bash
# Inicia o MCP do ViralLab. Usado pelo Claude Desktop (Windows) via:
#   wsl.exe -d Ubuntu --cd /caminho/do/viral-lab -- bash scripts/mcp.sh
# Importante: nada pode ser escrito no stdout além do protocolo MCP.
set -eo pipefail
cd "$(dirname "$0")/.."

# Node da versão do .nvmrc (o Claude Desktop não carrega o .bashrc/.zshrc).
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" --no-use >/dev/null 2>&1
  nvm use --silent >/dev/null 2>&1 || true
fi

exec node --conditions=react-server --env-file=.env.local --import tsx src/mcp/server.ts
