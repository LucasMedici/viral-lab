# ViralLab — Guia de marca

Este documento é a fonte da verdade para a identidade visual do ViralLab. Toda a interface deve seguir estas cores, fontes e regras de uso do logo. Não invente cores novas fora desta paleta.

## Conceito

O símbolo "Eco" são três botões de play em sequência, como um vídeo que se replica e se espalha. A estética é "laboratório elétrico": base escura e neutra, com o verde ácido como destaque. O verde é usado com moderação, só em elementos que precisam chamar atenção (ação principal, status publicado, destaques no logo).

## Arquivos do logo

Todos ficam em `public/brand/`. O texto dos logos já está convertido em contornos, então não depende de fonte instalada.

| Arquivo | Uso |
|---|---|
| `logo-dark.svg` | Logo principal horizontal, para fundos escuros (header do app no tema escuro) |
| `logo-light.svg` | Logo horizontal para fundos claros (header no tema claro) |
| `logo-lime.svg` | Logo sobre fundo verde ácido |
| `logo-mono.svg` | Versão branca monocromática (marca d'água em vídeos) |
| `logo-vertical-dark.svg` | Versão vertical, fundo escuro (tela de login, telas vazias) |
| `logo-vertical-light.svg` | Versão vertical, fundo claro (tela de login, telas vazias) |
| `symbol.svg` | Só o símbolo, sem texto, para fundos escuros |
| `icon.svg` / `icon-512.png` | Ícone do app (quadrado arredondado verde) |
| `avatar.svg` / `avatar-1080.png` | Foto de perfil para TikTok, Instagram e YouTube (quadrado sem bordas; as plataformas cortam em círculo) |

Na raiz de `public/`: `favicon.ico`, `icon.svg` e `apple-touch-icon.png`. Configure-os nos metadados do Next.js.

Regras:
- Use o logo de acordo com o tema: `logo-dark.svg` no escuro, `logo-light.svg` no claro.
- Não recolorir, esticar, rotacionar ou adicionar sombra/brilho ao logo.
- Altura mínima do logo horizontal: 24px. Abaixo disso, use só o símbolo ou o ícone.
- Mantenha um respiro ao redor do logo de pelo menos metade da altura do símbolo.

## Cores

### Paleta base

| Nome | Hex | Papel |
|---|---|---|
| Tinta | `#0F0F14` | Fundo do tema escuro; texto no tema claro |
| Papel | `#F5F4EF` | Fundo do tema claro; texto no tema escuro |
| Ácido | `#C5F23A` | Destaque principal: botão primário, status publicado, foco |
| Plasma | `#6D4AFF` | Links e ações secundárias no tema claro |
| Plasma claro | `#9B85FF` | Links e ações secundárias no tema escuro |
| Grafite | `#55555F` | Texto secundário no tema claro |

### Tokens por tema

Defina como variáveis CSS e exponha no Tailwind (ex.: `bg-background`, `text-muted`, `bg-accent`).

| Token | Tema claro | Tema escuro |
|---|---|---|
| `--background` | `#F5F4EF` | `#0F0F14` |
| `--surface` (cards, painéis) | `#FFFFFF` | `#18181F` |
| `--surface-2` (hover, inputs) | `#EDEBE4` | `#22222B` |
| `--border` | `#E2E0D8` | `#2A2A33` |
| `--text` | `#0F0F14` | `#F5F4EF` |
| `--text-muted` | `#55555F` | `#A1A1AA` |
| `--accent` | `#C5F23A` | `#C5F23A` |
| `--accent-foreground` (texto sobre o acento) | `#0F0F14` | `#0F0F14` |
| `--link` | `#6D4AFF` | `#9B85FF` |
| `--danger` | `#D92D20` | `#F97066` |

Importante sobre o verde ácido: ele NUNCA é usado como cor de texto sobre fundo claro (contraste insuficiente). Sobre fundo claro, use-o apenas como preenchimento (ex.: botão verde com texto Tinta). Sobre fundo escuro, pode ser texto ou preenchimento.

### Status dos vídeos

Use sempre um ponto colorido + o nome do status (nunca só a cor).

| Status | Cor do ponto (claro) | Cor do ponto (escuro) |
|---|---|---|
| Gerado | `#9A9AA6` | `#9A9AA6` |
| Aprovado | `#6D4AFF` | `#9B85FF` |
| Agendado | `#F59E0B` | `#F59E0B` |
| Publicado | `#C5F23A` sobre chip Tinta | `#C5F23A` |

No calendário, os blocos de vídeo usam a cor do status como uma faixa ou preenchimento suave, mantendo o texto legível (contraste mínimo de 4.5:1).

## Tipografia

Carregue via `next/font/google`:

- **Space Grotesk** (pesos 500 e 700): títulos, nomes de contas, números de destaque e o nome do app.
- **Inter** (pesos 400 e 600): todo o resto (texto, formulários, botões, tabelas).

Escala sugerida: 32px (título de página), 24px (seção), 18px (subtítulo/cards), 15–16px (corpo), 13px (legendas e metadados). Títulos com `letter-spacing: -0.02em`.

## Componentes e estilo

- Botão primário: fundo Ácido, texto Tinta, peso 600. Apenas um botão primário por tela.
- Botão secundário: fundo `--surface-2`, texto `--text`, borda `--border`.
- Raio de borda: 12px para cards e modais, 8px para botões e inputs, 999px para chips de status.
- Sombras: evitar. Separar áreas com `--surface` e `--border`.
- Foco de teclado visível: anel de 2px na cor Ácido.
- Ícones: lucide-react, traço de 1.75–2px, na cor do texto.
- Sem gradientes decorativos e sem emojis na interface.
- O tema escuro é o padrão; o claro fica disponível pela preferência do sistema ou por um botão de alternar.
