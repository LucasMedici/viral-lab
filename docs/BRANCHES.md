# Fluxo de branches no dia a dia

A `main` é a branch de produção: cada atualização dela gera um deploy na Vercel. Ninguém (nem você) faz commit direto nela. Todo trabalho acontece em branches de feature e entra na `main` por pull request, depois que o CI passa.

```
main ──●────────────●──────────●──────▶  (produção)
        \          /  merge    /
         ●──●──●──●  feat/x   /
                     ●──●──●─●  fix/y
```

## Convenção de nomes

| Prefixo   | Para quê                          | Exemplo                 |
| --------- | --------------------------------- | ----------------------- |
| `feat/`   | funcionalidade nova               | `feat/calendario`       |
| `fix/`    | correção                          | `fix/fuso-horario`      |
| `chore/`  | dependências, configuração        | `chore/atualiza-next`   |
| `docs/`   | só documentação (não roda CI)     | `docs/setup`            |

## Ciclo completo

```bash
# 1. Partir da main atualizada
git switch main
git pull

# 2. Criar a branch de trabalho
git switch -c feat/calendario

# 3. Trabalhar e commitar quantas vezes quiser (não roda CI nem deploy)
git add -A
git commit -m "feat: visão semanal do calendário"
git push -u origin feat/calendario     # 1º push; depois basta `git push`

# 4. Antes de abrir o PR, conferir localmente (economiza minutos de CI)
npm run lint && npm run typecheck && npm run build

# 5. Abrir o pull request para a main (pelo terminal ou pelo site do GitHub)
gh pr create --base main --fill
#   → o GitHub Actions roda lint + typecheck + build.
#   → novos pushes na mesma branch cancelam a execução anterior e rodam de novo.

# 6. Acompanhar o CI
gh pr checks --watch

# 7. CI verde → merge (squash junta os commits da branch em um só na main)
gh pr merge --squash --delete-branch
#   → a Vercel faz o deploy de produção da main.

# 8. Voltar para a main atualizada e limpar
git switch main
git pull
git fetch --prune
git branch -d feat/calendario 2>/dev/null || true
```

### Se a main andou enquanto você trabalhava

A proteção exige que a branch esteja atualizada com a main. Para atualizar:

```bash
git switch feat/calendario
git fetch origin
git rebase origin/main          # resolve conflitos, se houver: git add … && git rebase --continue
git push --force-with-lease
```

(Ou clique em "Update branch" no PR.)

## Configurar a proteção da main no GitHub

Faça isso **depois** do primeiro push e **depois** que o CI rodar uma vez (o check `ci` só aparece na lista depois de ter rodado pelo menos uma vez — abra um PR de teste se precisar).

1. No repositório: **Settings › Rules › Rulesets › New ruleset › New branch ruleset**.
2. **Ruleset name**: `proteger-main`. **Enforcement status**: `Active`.
3. **Bypass list**: deixe vazio, ou adicione `Repository admin` se quiser poder fazer merge de PRs só de documentação (eles não rodam o CI, por causa do `paths-ignore`, e o check obrigatório ficaria "aguardando").
4. **Target branches › Add target › Include default branch** (a `main`).
5. Marque:
   - **Restrict deletions**
   - **Block force pushes**
   - **Require a pull request before merging** (Required approvals: `0` — você é o único revisor)
   - **Require status checks to pass** → **Require branches to be up to date before merging** → **Add checks** → `ci`
6. **Create**.

Alternativa clássica: **Settings › Branches › Add branch protection rule**, padrão `main`, com as mesmas opções.

> Em repositório **público** essas regras são gratuitas. Em repositório privado no plano Free elas não são aplicadas.
