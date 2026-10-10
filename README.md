# Simulador de Expressões Regulares

Trabalho da disciplina de Linguagens Formais e Teoria da Computação, UNESP Presidente Prudente.

## Funcionalidades

**Notação formal**

- Expressões com união (`|` ou `+`), concatenação (justaposição ou `.`), fechamento de Kleene (`*`), parênteses, cadeia vazia (`ε`) e linguagem vazia (`∅`)
- Precedência: fechamento, concatenação e, por último, união
- Exibição do agrupamento implícito da expressão
- Conversão da ER em AFND-ε pela construção de Thompson
- Diagrama do autômato, com os estados ativos destacados durante a simulação
- Teste de várias cadeias de uma vez, com o motivo da rejeição
- Simulação passo a passo na fita de entrada, com os estados ativos e o fecho-ε
- Tabela de transição δ do autômato gerado
- Listagem das cadeias de L(ER) até um tamanho escolhido
- Exemplos e exercícios das aulas já carregados

**REGEXP**

- Teste de expressões na sintaxe usada em ferramentas como grep, regex101 e RegExr
- Uso de `^` e `$` para exigir que a linha inteira case
- Flags `g` (todas as ocorrências) e `i` (ignorar maiúsculas)
- Destaque das correspondências no texto e tabela com posição e grupos de captura

## Como usar

Abra o arquivo `index.html` em qualquer navegador. Não há dependências nem instalação.

## Estrutura

```
index.html
css/estilo.css
js/motor.js
js/exemplos.js
js/interface.js
```

## Autores

Vinícius Mazzaro e Matheus Trindade
