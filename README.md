# Dash — Arrancada para Owlbear Rodeo

Extensão independente que anima tokens de personagens com rajadas de vento, rastros e partículas. Código JavaScript, SDK oficial empacotado localmente na compilação, sem CDN em tempo de execução. Não requer servidor ou banco de dados.

## Usar

1. Instale o manifesto na sala (instruções abaixo) e abra uma cena.
2. Clique no ícone **Dash** da barra superior para abrir o painel.
3. Escolha **Rápido** ou **Lento**, habilite o Dash e os efeitos conforme desejar.
4. Clique em **Selecionar ferramenta Dash**. Também é possível selecioná-la diretamente na barra de ferramentas.
5. Clique e arraste uma imagem na camada **Personagem / Character**. O token permanece na origem enquanto você escolhe o destino; solte para iniciar o Dash em linha reta.
6. **Esc durante o arraste** cancela. Desabilitar o Dash interrompe uma animação em curso e restaura a posição persistida anterior. Trocar a ferramenta cancela um arraste ainda não solto; um Dash já lançado termina normalmente.

O ponto de pega é preservado: pegar o token fora do centro não causa saltos. O destino é a coordenada exata do token correspondente à soltura, **sem encaixe automático à grade**. Não há limite de distância ou validação de paredes, colisões e regras de movimento.

Preferências são pessoais, salvas nos metadados do jogador pela API. Todos os participantes podem ver a interação transmitida pelo Owlbear; não precisam abrir o painel. Não são configurações globais impostas pelo mestre.

## Limitação do arraste convencional

A API pública documenta eventos de ponteiro nas ferramentas personalizadas, sem um gancho para substituir globalmente o arraste da ferramenta Move de maneira segura. Por isso, **é necessário selecionar a ferramenta Dash**. Arrastar pela ferramenta Move continua sendo uma movimentação normal. Não monitoramos movimentos concluídos para teleportar o token de volta e reproduzir uma animação.

Quando o Dash está desabilitado, `preventDrag` delega o arraste na ferramenta Dash à operação convencional do Owlbear. Com o Dash habilitado, ela aceita somente imagens desbloqueadas da camada CHARACTER. Tokens anexados a outro item são ignorados para evitar ambiguidades entre coordenadas locais e de mapa. Objetos de outras camadas permanecem disponíveis pela ferramenta Move. Selecione-a para mover mapas, props, grupos ou usar manipuladores de transformação.

## Publicar no GitHub Pages

Requisito: Node.js 22 e npm.

Este diretório deve ser a **raiz de um novo repositório**, separado de outros projetos. Inclua arquivos ocultos (`.github`, `.gitignore`), `public`, `src`, testes e `package-lock.json`. Não envie `node_modules`.

1. Crie um repositório no GitHub e envie o conteúdo deste diretório para a branch `main`.
2. No repositório, abra **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Em **Actions**, execute o workflow **Publicar no GitHub Pages** (ou envie um novo commit à `main`).
4. Após o deploy, sua URL será semelhante a `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.
5. O endereço de instalação será `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/manifest.json`.
6. No Owlbear Rodeo, abra as configurações/gerenciamento de extensões da sala, escolha adicionar uma extensão personalizada por URL e cole o endereço do manifesto. Habilite a extensão nessa sala.

O workflow executa `npm ci`, testes, verificação de tipos e build antes de publicar `dist`. O `base: './'` e os caminhos relativos do manifesto suportam subdiretórios de repositórios no Pages, sem substituir URLs no código. O manifesto efetivamente publicado fica na raiz de `dist`.

### Publicação manual

```bash
npm ci
npm test
npm run build
```

Hospede **todo o conteúdo de `dist/`** em um servidor HTTPS estático. Também é possível copiar esse conteúdo para uma branch `gh-pages` e configurar Pages para publicar a raiz dessa branch. Não publique apenas o manifesto ou os arquivos-fonte: o SDK e os módulos precisam dos arquivos de build.

### Desenvolvimento

```bash
npm ci
npm run dev
```

Vite oferece o manifesto em `http://localhost:5173/manifest.json`. Use um ambiente de desenvolvimento compatível com as regras atuais de HTTPS/localhost do navegador e do Owlbear; se houver bloqueio de conteúdo misto, sirva por HTTPS. `npm run preview` permite inspecionar o build. Fora do iframe do Owlbear, o painel aguarda a conexão do SDK e não move tokens.

## Arquivos

```text
owlbear-dash/
├── .github/workflows/pages.yml
├── .gitignore
├── background.html
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.js
├── public/
│   ├── .nojekyll
│   ├── icon.svg
│   └── manifest.json
├── src/
│   ├── background.js     # ferramenta, permissões, animação e efeitos
│   ├── core.js           # geometria, tempos e preferências
│   ├── panel.js          # configurações pessoais e seleção da ferramenta
│   └── style.css
├── tests/
│   ├── core.test.js
│   └── interaction.test.js
├── support/              # simulador da API para testes
├── LICENSE
└── README.md
```

## Animação, sincronização e conflitos

- O serviço em `background.html` continua ativo quando o painel fecha. Apenas o cliente que iniciou o Dash gera a animação.
- `OBR.interaction.startItemInteraction` recebe o token existente e curvas temporárias. Atualizações por tempo decorrido ocorrem aproximadamente a cada 16 ms; atrasos de processamento não acumulam passos. Rápido dura 260–650 ms; Lento 700–1400 ms, conforme a distância. Os efeitos dissipam por até mais 300 ms.
- A Interaction API transmite snapshots e interpola a recepção entre participantes. Latência, taxa de atualização e abas suspensas impedem prometer sincronia de quadro ou tempo real absoluto. Nenhum sistema de mensagens paralelo precisa retransmitir cada quadro.
- Ao concluir, `scene.items.updateItems` grava apenas `position`, usando a coordenada final exata. Depois a interação é encerrada; as curvas nunca são adicionadas permanentemente à cena. Aparência, escala, rotação, metadados, imagem e outras propriedades persistidas não são alteradas pelo Dash. Os filhos seguem o comportamento de anexação do próprio Owlbear.
- Tokens invisíveis mantêm os efeitos invisíveis. Não há restrição de mestre inventada para jogadores: são verificadas as permissões CHARACTER_UPDATE e CHARACTER_OWNER_ONLY, a propriedade e o bloqueio do token. A API também aplica as permissões da sala.
- Um Dash por vez por cliente. Alteração persistida externa do token durante a animação cancela o Dash. A gravação final confere posição e `lastModified` novamente e preserva os demais campos atuais. Trocar/fechar a cena e desabilitar a extensão cancelam a interação quando o cliente consegue processar esses eventos.
- **Não existe bloqueio distribuído atômico** nesta implementação. Duas interações simultâneas sobre o mesmo token, ou outra extensão animando-o, ainda podem competir visualmente; uma edição remota que chega após a última conferência pode prevalecer conforme a resolução do Owlbear. Combine um controlador por token. Não há garantia de exclusão mútua ou proteção contra toda corrida de rede.
- Se o cliente cair antes de gravar o destino, a animação temporária pode sumir e o token permanece na última posição persistida. O destino exato é garantido no fluxo de conclusão bem-sucedido, não em desconexões ou cancelamentos. A API documenta expiração de transmissão de interações após 30 segundos; nossas animações são muito menores, mas suspensão severa da aba pode ultrapassar esse prazo.
- Efeitos não exigem adicionar ou apagar desenhos persistentes da cena. A visibilidade efetiva de efeitos temporários para jogadores também depende das regras do Owlbear e permissões da sala.

## Validação antes de usar em uma campanha

Os testes automatizados cobrem geometria, preservação do ponto de pega, destino e tempos. Um simulador da API também exercita o ciclo de animação, a preservação das demais propriedades, os efeitos desligados e o cancelamento após uma edição externa; ele não substitui o teste no Owlbear real. O build verifica JavaScript contra os tipos reais do SDK. Uma sala autenticada não é incluída no projeto: faça também esta verificação manual após instalar:

1. Abra a mesma sala em dois clientes (mestre e jogador). Arraste um token permitido usando Dash; confira percurso, efeitos e posição final em ambos.
2. Compare Rápido/Lento e desligue efeitos. Confirme que a aparência original permanece após a animação.
3. Desabilite Dash e confira o arraste convencional; repita pela ferramenta Move.
4. Teste Esc antes da soltura, desabilitação durante o Dash e troca de cena durante a animação.
5. Teste token bloqueado, token alheio com proprietário obrigatório e jogador sem permissão de mover personagens.
6. Durante um Dash, altere o token em outro cliente; confira que a edição persistida externa é preservada.
7. Teste um token com anexos, rotação e escala; teste mapa com coordenadas negativas e destino fora da grade.

## Referências oficiais

- Ferramentas e eventos: https://docs.owlbear.rodeo/extensions/apis/tool/
- Interações e sincronização: https://docs.owlbear.rodeo/extensions/apis/interaction/
- Manifesto: https://docs.owlbear.rodeo/extensions/reference/manifest/
- SDK: https://github.com/owlbear-rodeo/sdk

Licença MIT; consulte `LICENSE`.
