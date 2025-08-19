# Jogo de Tabuleiro - Sistema Multiplayer

Este é um jogo de tabuleiro multiplayer que permite que múltiplos jogadores participem simultaneamente usando diferentes telas.

## Arquivos do Sistema

- `index.html` - Tela principal (modo administrador)
- `viewer.html` - Tela de visualização (para todos verem o tabuleiro)
- `player.html` - Tela de jogador (para cada equipe fazer suas jogadas)
- `script.js` - Lógica principal do jogo
- `viewer.js` - Lógica da tela de visualização
- `player.js` - Lógica da tela de jogador
- `styles.css` - Estilos do jogo

## Como Usar

### 1. Configuração Inicial

1. **Abra a tela principal** (`index.html`) em um navegador
   - Esta é a tela do administrador onde você pode adicionar equipes
   - Use os controles para adicionar equipes e configurar o jogo

2. **Abra a tela de visualização** (`viewer.html`) em outro navegador ou aba
   - Esta tela mostra o tabuleiro para todos os jogadores verem
   - Contém controles para gerenciar o jogo (próximo turno, reset, etc.)

3. **Abra telas de jogador** (`player.html`) para cada equipe
   - Cada equipe deve ter sua própria tela de jogador
   - Os jogadores selecionam sua equipe e fazem suas jogadas

### 2. Fluxo do Jogo

1. **Na tela principal** (`index.html`):
   - Adicione todas as equipes que vão jogar
   - Configure as posições iniciais, moedas e dias de cada equipe

2. **Na tela de visualização** (`viewer.html`):
   - Todos podem ver o tabuleiro e o estado atual do jogo
   - Use "Próximo Turno" para avançar entre as equipes
   - Use "Novo Jogo" para reiniciar ou "Resetar Jogo" para limpar tudo

3. **Nas telas de jogador** (`player.html`):
   - Cada jogador seleciona sua equipe no dropdown
   - Quando for seu turno, o botão "Jogar Dado" fica habilitado
   - O jogador joga o dado e escolhe para onde mover
   - Após mover, clica em "Finalizar Turno"

### 3. Sincronização

- Todas as telas se sincronizam automaticamente usando localStorage
- Mudanças em uma tela aparecem em todas as outras em tempo real
- Não é necessário recarregar as páginas

### 4. Controles por Tela

#### Tela Principal (index.html)
- Adicionar/remover equipes
- Configurar posições iniciais
- Modo de remapeamento (tecla M)

#### Tela de Visualização (viewer.html)
- Ver o tabuleiro completo
- Controlar o fluxo do jogo
- Gerenciar turnos

#### Tela de Jogador (player.html)
- Selecionar equipe
- Jogar dado
- Escolher movimento
- Finalizar turno

## Funcionalidades

- **Sistema de turnos**: Cada equipe joga individualmente
- **Sincronização automática**: Todas as telas se atualizam em tempo real
- **Interface intuitiva**: Controles claros para cada tipo de usuário
- **Persistência**: O estado do jogo é salvo automaticamente
- **Responsivo**: Funciona em diferentes tamanhos de tela

## Requisitos

- Navegador moderno com suporte a JavaScript ES6+
- Múltiplas abas ou janelas do navegador
- Conexão local (não requer servidor)

## Dicas de Uso

1. **Para apresentações**: Use a tela de visualização em um projetor
2. **Para jogos locais**: Cada jogador pode usar seu próprio dispositivo
3. **Para controle**: Mantenha a tela principal aberta para administração
4. **Para sincronização**: Certifique-se de que todas as telas estão na mesma origem (mesmo domínio)

## Solução de Problemas

- **Sincronização não funciona**: Verifique se todas as telas estão no mesmo navegador/domínio
- **Controles não respondem**: Recarregue a página
- **Estado perdido**: O localStorage mantém o estado, mas pode ser limpo pelo navegador
- **Múltiplos jogadores**: Cada jogador deve ter sua própria aba/janela do `player.html`
