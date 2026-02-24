# Decisão de editor Rich Text para documentos

## Contexto do produto
A plataforma é baseada em **Next.js + React** e precisa melhorar a experiência de criação de documentos com:
- boa performance em textos longos;
- edição colaborativa no futuro;
- extensibilidade para blocos e atalhos (slash commands, mentions, embeds);
- integração fluida com UI customizada.

## Opções avaliadas

### 1) Quill
**Prós:** simples para começar, comunidade madura.  
**Contras:** arquitetura Delta limita customizações avançadas, ecossistema menos moderno para experiências de editor “tipo Notion”.

### 2) DraftJS
**Prós:** já foi padrão no ecossistema React.  
**Contras:** projeto com menor evolução recente e DX inferior para novas funcionalidades.

### 3) TinyMCE
**Prós:** solução robusta, estável e completa para casos corporativos clássicos.  
**Contras:** experiência mais “WYSIWYG tradicional”, maior peso e menos flexível para UX altamente customizada do produto.

### 4) Slate
**Prós:** extremamente flexível e poderoso para modelagem de conteúdo customizado.  
**Contras:** demanda maior esforço de engenharia para manter estabilidade/performance em cenários complexos.

### 5) Lexical
**Prós:**
- excelente performance para documentos longos;
- arquitetura moderna e modular;
- muito bom para React/Next;
- ótima base para recursos avançados (collab, plugins, nodes customizados);
- permite experiência de edição moderna com controle fino de UX.

**Contras:**
- exige curva inicial para modelagem dos nós e plugins;
- menos “pronto de fábrica” do que TinyMCE.

## Recomendação
**Escolha: Lexical**.

É o melhor equilíbrio entre **performance**, **experiência moderna** e **capacidade de evolução** para o produto. Ele suporta bem a visão de documentos ricos e customizáveis sem aprisionar a plataforma a um editor muito rígido.

## Plano de adoção sugerido (MVP)
1. Implementar editor com:
   - títulos, parágrafos, listas, negrito/itálico/link;
   - atalho `/` para comandos básicos;
   - autosave com debounce.
2. Definir formato de persistência:
   - armazenar estado em JSON do Lexical;
   - criar camada de versionamento simples para histórico.
3. Evolução incremental:
   - menções, checklist, callout, código;
   - colaboração em tempo real (ex.: Yjs) quando o fluxo principal estiver estável.

## Critério de sucesso
- redução de atrito na criação de documentos (tempo até primeira publicação);
- maior uso de documentação interna por equipe;
- menor taxa de abandono durante edição de documentos longos.
