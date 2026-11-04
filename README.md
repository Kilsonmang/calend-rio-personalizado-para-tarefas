# 📅 Minha Agenda

Calendário mensal para organizar tarefas do dia, projetos simples e projetos complexos com etapas. Feito em HTML, CSS e JavaScript puros, sem dependências nem instalação.

## Funcionalidades

- Calendário mensal (segunda a domingo), com navegação entre meses e botão **Hoje**
- Cada dia num quadrado azul, com até 3 tarefas visíveis
- Três tipos de tarefa: **tarefa do dia**, **projeto simples** e **projeto complexo** (com etapas e barra de progresso)
- Prioridade alta, média ou baixa, indicada pela cor da borda
- Painel lateral com as tarefas do dia e o progresso
- Lista de **projetos em curso**, com aviso para os atrasados
- Dados guardados automaticamente no navegador (`localStorage`)
- Adapta-se a telemóvel

## Como executar

**Opção 1:** abre o `index.html` no navegador (duplo clique).

**Opção 2 (recomendada para desenvolver):**
1. Abre a pasta no VS Code.
2. Instala a extensão **Live Server**.
3. Clica com o botão direito em `index.html` e escolhe **Open with Live Server**.

### Publicar com GitHub Pages

1. No repositório, vai a **Settings → Pages**.
2. Em **Source**, escolhe a branch `main` e a pasta `/ (root)`.
3. Guarda. A agenda fica disponível em `https://<o-teu-utilizador>.github.io/<nome-do-repositorio>/`.

> No GitHub Pages as tarefas ficam guardadas no navegador de cada computador. A sincronização entre computadores só funciona na versão publicada no claude.ai.

## Como usar

| Quero… | Como faço |
| --- | --- |
| Ver outro mês | Botões ‹ e ›; **Hoje** volta ao dia atual |
| Ver as tarefas de um dia | Clicar no quadrado do dia |
| Criar uma tarefa | **+ Nova** no painel, ou duplo clique num dia |
| Editar | Lápis ✏️ ao lado da tarefa |
| Marcar como feita | Caixa à esquerda do título |
| Concluir uma etapa | Caixa da etapa, num projeto complexo |
| Apagar | 🗑️ e depois **Apagar?** em menos de 3 segundos |
| Ir para a data de um projeto | Clicar no projeto em **Projetos em curso** |

## Estrutura do projeto

```
minha-agenda/
├── index.html   # estrutura: topo, calendário, painel e formulário
├── style.css    # aparência: cores, grelha, cartões, versão telemóvel
├── script.js    # lógica: dados, desenho do calendário, eventos
└── README.md
```

### Principais funções (`script.js`)

| Função | O que faz |
| --- | --- |
| `desenharCalendario()` | Monta os 42 quadrados do mês, a começar à segunda-feira |
| `desenharPainel()` | Lista as tarefas do dia, com etapas e progresso |
| `desenharProjetos()` | Lista os projetos por concluir, ordenados por data |
| `abrirModal(t)` | Abre o formulário vazio, ou preenchido para editar |
| `guardarTarefa(t)` / `apagarTarefa(id)` | Gravam as alterações |
| `ligarNuvem()` | Sincroniza com a conta quando a página corre no claude.ai |
| `atualizar()` | Redesenha calendário, painel e projetos |

### Modelo de uma tarefa

```json
{
  "id": "mh2k9x4fa1b2",
  "titulo": "Estudar Laravel",
  "tipo": "complexo",
  "prioridade": "alta",
  "data": "2026-11-10",
  "hora": "14:30",
  "descricao": "Rever rotas e controladores",
  "subtarefas": [{ "texto": "Rotas", "feita": true }, { "texto": "Controladores", "feita": false }],
  "feita": false
}
```

`tipo` aceita `tarefa`, `simples` ou `complexo`. `prioridade` aceita `baixa`, `media` ou `alta`.

## Personalizar

Quase tudo o que é visual está no bloco `:root`, no início do `style.css`:

| Variável | Para quê | Valor atual |
| --- | --- | --- |
| `--cor-dia` | Azul dos dias | `#1e6fd9` |
| `--cor-dia-hover` | Azul ao passar o rato | `#1559b5` |
| `--cor-dia-fora` | Dias de outro mês | `#a9c9f3` |
| `--cor-hoje` | Dia de hoje | `#0b3d91` |
| `--destaque` | Contorno do dia selecionado | `#ffc83d` |
| `--fundo` | Fundo da página | `#ffffff` |
| `--prioridade-alta` / `-media` / `-baixa` | Cores das prioridades | vermelho, laranja, verde |
| `--raio` | Arredondamento dos cantos | `12px` |
| `--fonte` | Tipo de letra | Manrope |

## Próximos passos

- [ ] Vista semanal
- [ ] Tarefas repetidas
- [ ] Projetos com data de início e fim
- [ ] Categorias por projeto
- [ ] Exportar e importar cópia de segurança
- [ ] Modo escuro
