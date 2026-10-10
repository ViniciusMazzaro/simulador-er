const $ = id => document.getElementById(id);

const escapar = texto => String(texto).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ehCadeiaVazia = texto => texto === 'ε' || texto === '&' || texto === 'λ';
const ordenar = lista => [...lista].sort((a, b) => a - b);
const formatarConjunto = conjunto => conjunto.size ? '{' + ordenar(conjunto).map(q => 'q' + q).join(', ') + '}' : '∅';
const icone = aceita => `<span class="icone ${aceita ? 'icone-ok' : 'icone-erro'}">${aceita ? '✓' : '✕'}</span>`;

const estado = {
  automato: null,
  alfabeto: [],
  linhas: [],
  selecionada: 0,
  passo: null,
  passoAtual: 0,
  ultimoPasso: 0
};

function preencherMenus() {
  $('exemplos').innerHTML = '<option value="">Expressão própria</option>' +
    EXEMPLOS_FORMAIS.map((exemplo, i) => `<option value="${i}">${escapar(exemplo.origem + ': ' + exemplo.expressao)}</option>`).join('');

  $('exemplos-regexp').innerHTML = EXEMPLOS_REGEXP
    .map((exemplo, i) => `<option value="${i}">${escapar(exemplo.descricao)}</option>`).join('');

  $('tamanho-maximo').innerHTML = Array.from({ length: 11 }, (_, n) => `<option${n === 5 ? ' selected' : ''}>${n}</option>`).join('');

  $('teclas').innerHTML = TECLAS
    .map(([simbolo, dica]) => `<button type="button" class="tecla" data-simbolo="${simbolo}" title="${dica}">${simbolo}</button>`)
    .join('') + '<button type="button" class="tecla tecla-limpar" data-limpar>Limpar</button>';
}

function atualizarFormal() {
  const campo = $('campo-er');
  let arvore = null;
  let mensagem = '';

  try {
    arvore = analisarExpressao(campo.value);
    estado.automato = construirAutomato(arvore);
  } catch (erro) {
    estado.automato = null;
    mensagem = erro.message;
  }

  campo.classList.toggle('com-erro', Boolean(mensagem));
  $('erro-er').hidden = !mensagem;
  $('erro-er-texto').textContent = mensagem;
  $('info-er').hidden = Boolean(mensagem);

  const digitado = $('campo-alfabeto').value.split(/[\s,;]+/).filter(Boolean).map(s => [...s][0]);
  estado.alfabeto = arvore ? [...(digitado.length ? new Set(digitado) : simbolosDaArvore(arvore))].sort() : [];
  $('alfabeto-final').textContent = '= {' + estado.alfabeto.join(', ') + '}';

  if (arvore) {
    $('agrupamento').textContent = textoAgrupado(arvore, true);
    $('tamanho-afnd').textContent = `${estado.automato.estados} estados · ${estado.automato.transicoes.length} transições`;
  }

  desenharDiagrama();
  mostrarResultados();
  mostrarFita();
  mostrarLinguagem();
  mostrarTabelaTransicao();
}

function desenharDiagrama() {
  const automato = estado.automato;
  if (!automato) {
    $('diagrama').innerHTML = '';
    return;
  }

  const { largura, altura, posicoes } = automato.desenho;
  const passoX = 62;
  const passoY = 64;
  const raio = 16;
  const margem = 36;
  const ponto = q => ({ x: margem + 14 + posicoes[q].x * passoX, y: margem + posicoes[q].y * passoY });
  const deslocar = (p, alvo, d) => {
    const dx = alvo.x - p.x;
    const dy = alvo.y - p.y;
    const n = Math.hypot(dx, dy) || 1;
    return { x: p.x + dx / n * d, y: p.y + dy / n * d };
  };
  const f = n => n.toFixed(1);

  let arestas = '';
  let rotulos = '';
  for (const t of automato.transicoes) {
    const a = ponto(t.origem);
    const b = ponto(t.destino);
    let c1;
    let c2;
    if (t.curva) {
      const sobe = t.curva.lado * t.curva.altura * passoY / 0.75;
      c1 = { x: a.x, y: a.y + sobe };
      c2 = { x: b.x, y: b.y + sobe };
    } else if (a.y === b.y) {
      c1 = { x: a.x + (b.x - a.x) / 3, y: a.y };
      c2 = { x: a.x + (b.x - a.x) * 2 / 3, y: b.y };
    } else {
      c1 = { x: (a.x + b.x) / 2, y: a.y };
      c2 = { x: (a.x + b.x) / 2, y: b.y };
    }
    const inicio = deslocar(a, c1, raio);
    const fim = deslocar(b, c2, raio + 1);
    const vazio = t.simbolo === null;
    arestas += `<path class="aresta${vazio ? ' vazia' : ''}" d="M${f(inicio.x)} ${f(inicio.y)} C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(fim.x)} ${f(fim.y)}"/>`;
    const meio = {
      x: (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8,
      y: (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8
    };
    const acima = t.curva ? t.curva.lado < 0 : true;
    rotulos += `<text class="rotulo-aresta${vazio ? ' vazia' : ''}" x="${f(meio.x)}" y="${f(meio.y + (acima ? -6 : 14))}">${escapar(vazio ? 'ε' : t.simbolo)}</text>`;
  }

  let nos = '';
  for (let q = 0; q < automato.estados; q++) {
    const p = ponto(q);
    const final = q === automato.final;
    nos += `<g class="no${final ? ' final' : ''}" data-estado="${q}">
      <circle r="${raio}" cx="${f(p.x)}" cy="${f(p.y)}"/>
      ${final ? `<circle class="anel" r="${raio - 4}" cx="${f(p.x)}" cy="${f(p.y)}"/>` : ''}
      <text x="${f(p.x)}" y="${f(p.y + 4)}">q${q}</text>
    </g>`;
  }

  const inicial = ponto(automato.inicial);
  const larguraSvg = margem * 2 + 28 + largura * passoX;
  const alturaSvg = margem * 2 + altura * passoY;

  $('diagrama').innerHTML = `<svg width="${f(larguraSvg)}" height="${f(alturaSvg)}" viewBox="0 0 ${f(larguraSvg)} ${f(alturaSvg)}" role="img" aria-label="Diagrama do AFND-ε">
    <defs><marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z"/></marker></defs>
    <path class="aresta" d="M${f(inicial.x - raio - 26)} ${f(inicial.y)} L${f(inicial.x - raio - 1)} ${f(inicial.y)}"/>
    ${arestas}${rotulos}${nos}
  </svg>`;
}

function mostrarResultados() {
  const automato = estado.automato;
  estado.linhas = $('cadeias').value.split('\n').map(linha => linha.trim()).filter(Boolean);
  if (estado.selecionada >= estado.linhas.length) estado.selecionada = 0;

  let aceitas = 0;

  $('lista-resultados').innerHTML = estado.linhas.map((linha, i) => {
    const cadeia = ehCadeiaVazia(linha) ? '' : linha;

    if (!automato) {
      return `<div class="resultado"><span class="icone icone-neutro">·</span><span class="cadeia">${escapar(cadeia || 'ε')}</span></div>`;
    }

    const simulacao = simularCadeia(automato, cadeia);
    if (simulacao.aceita) aceitas++;

    const foraDoAlfabeto = [...new Set([...cadeia].filter(c => !estado.alfabeto.includes(c)))];
    let motivo = 'aceita';
    if (!simulacao.aceita) {
      if (foraDoAlfabeto.length) motivo = 'fora de Σ: ' + foraDoAlfabeto.join(' ');
      else if (simulacao.travou) motivo = 'trava no símbolo ' + (simulacao.passos.length - 1);
      else motivo = 'termina fora do estado final';
    }

    return `<button type="button" class="resultado${i === estado.selecionada ? ' selecionado' : ''}" data-indice="${i}">
      ${icone(simulacao.aceita)}
      <span class="cadeia">${escapar(cadeia || 'ε')}</span>
      <span class="motivo">${escapar(motivo)}</span>
    </button>`;
  }).join('');

  $('total-aceitas').textContent = `${automato ? aceitas : 0} aceitas`;
  $('total-rejeitadas').textContent = `${automato ? estado.linhas.length - aceitas : 0} rejeitadas`;
}

function mostrarFita() {
  const automato = estado.automato;

  if (!automato || !estado.linhas.length) {
    $('fita').innerHTML = '';
    $('estados-ativos').innerHTML = '';
    $('passos').innerHTML = '';
    $('veredito').textContent = '';
    $('veredito').className = 'veredito';
    $('cadeia-atual').textContent = '—';
    $('contador-passos').textContent = 'passo 0 de 0';
    document.querySelectorAll('#diagrama .no').forEach(no => no.classList.remove('ativo'));
    return;
  }

  const linha = estado.linhas[estado.selecionada];
  const cadeia = ehCadeiaVazia(linha) ? '' : linha;
  const simbolos = [...cadeia];
  const simulacao = simularCadeia(automato, cadeia);
  const ultimo = simulacao.passos.length - 1;
  const atual = estado.passo === null ? ultimo : Math.max(0, Math.min(estado.passo, ultimo));

  estado.passoAtual = atual;
  estado.ultimoPasso = ultimo;

  $('cadeia-atual').textContent = cadeia || 'ε';
  $('contador-passos').textContent = `passo ${atual} de ${ultimo}`;

  if (simbolos.length) {
    $('fita').innerHTML = simbolos.map((simbolo, i) => {
      const classes = ['celula'];
      if (i < atual) classes.push('lida');
      if (i === atual) classes.push('cabeca');
      return `<div class="${classes.join(' ')}"><span class="cursor">▼</span><span class="quadro">${escapar(simbolo)}</span><span class="indice">${i + 1}</span></div>`;
    }).join('') +
      `<div class="celula fim${atual === simbolos.length ? ' cabeca' : ''}"><span class="cursor">▼</span><span class="quadro">⊣</span><span class="indice">fim</span></div>`;
  } else {
    $('fita').innerHTML = '<div class="celula cabeca"><span class="cursor">▼</span><span class="quadro">ε</span><span class="indice"></span></div>';
  }

  const ativos = simulacao.passos[atual].estados;
  $('estados-ativos').innerHTML = ativos.size
    ? ordenar(ativos).map(q => `<span class="ficha${q === automato.final ? ' final' : ''}">q${q}</span>`).join('')
    : '<span class="ficha vazia">∅</span>';

  document.querySelectorAll('#diagrama .no').forEach(no => {
    no.classList.toggle('ativo', ativos.has(Number(no.dataset.estado)));
  });

  const veredito = $('veredito');
  if (atual < ultimo) {
    veredito.textContent = 'lendo…';
    veredito.className = 'veredito lendo';
  } else if (simulacao.aceita) {
    veredito.textContent = 'cadeia aceita';
    veredito.className = 'veredito aceita';
  } else {
    veredito.textContent = 'cadeia rejeitada';
    veredito.className = 'veredito rejeitada';
  }

  $('passos').innerHTML = simulacao.passos.map((passo, i) => {
    const chegou = passo.estados.has(automato.final);
    return `<tr class="${i === atual ? 'atual' : ''}">
      <td class="suave">${i}</td>
      <td>${escapar(passo.lido)}</td>
      <td class="suave">${escapar(simbolos.slice(i).join('') || 'ε')}</td>
      <td class="${chegou ? 'chega-final' : ''}">${formatarConjunto(passo.estados)}${chegou ? '  ← contém q' + automato.final : ''}</td>
    </tr>`;
  }).join('');
}

function mostrarLinguagem() {
  if (!estado.automato) {
    $('linguagem').innerHTML = '';
    $('nota-linguagem').textContent = '';
    return;
  }

  const tamanho = Number($('tamanho-maximo').value);
  const { encontradas, cortada } = gerarCadeias(estado.automato, estado.alfabeto, tamanho);

  $('linguagem').innerHTML = encontradas.length
    ? encontradas.map(cadeia => `<span>${escapar(cadeia || 'ε')}</span>`).join('')
    : '<span>∅</span>';

  $('nota-linguagem').textContent = encontradas.length
    ? `${encontradas.length} cadeia(s) com até ${tamanho} símbolos${cortada ? ', lista cortada' : ''}.`
    : `Nenhuma cadeia com até ${tamanho} símbolos.`;
}

function mostrarTabelaTransicao() {
  const automato = estado.automato;
  if (!automato) {
    $('tabela-transicao').innerHTML = '';
    return;
  }

  const colunas = [...estado.alfabeto, 'ε'];
  let html = '<thead><tr><th>δ</th>' + colunas.map(c => `<th>${escapar(c)}</th>`).join('') + '</tr></thead><tbody>';

  for (let q = 0; q < automato.estados; q++) {
    const marca = (q === automato.inicial ? '→' : '') + (q === automato.final ? '*' : '');
    html += `<tr><td class="estado">${marca}q${q}</td>`;
    for (const coluna of colunas) {
      const simbolo = coluna === 'ε' ? null : coluna;
      const destinos = ordenar(automato.saidas[q].filter(t => t.simbolo === simbolo).map(t => t.destino));
      html += destinos.length
        ? `<td>{${destinos.map(d => 'q' + d).join(', ')}}</td>`
        : '<td class="sem-destino">—</td>';
    }
    html += '</tr>';
  }

  $('tabela-transicao').innerHTML = html + '</tbody>';
}

function carregarExemploFormal(indice) {
  const exemplo = EXEMPLOS_FORMAIS[indice];
  $('exemplos').value = String(indice);
  $('campo-er').value = exemplo.expressao;
  $('campo-alfabeto').value = exemplo.alfabeto || '';
  $('cadeias').value = exemplo.cadeias;
  estado.selecionada = 0;
  estado.passo = null;
  atualizarFormal();
}

function inserirNaExpressao(simbolo) {
  const campo = $('campo-er');
  const inicio = campo.selectionStart ?? campo.value.length;
  const fim = campo.selectionEnd ?? campo.value.length;
  campo.value = campo.value.slice(0, inicio) + simbolo + campo.value.slice(fim);
  campo.focus();
  campo.setSelectionRange(inicio + simbolo.length, inicio + simbolo.length);
}

function buscarCorrespondencias(regex, texto, todas) {
  const encontradas = [];
  regex.lastIndex = 0;
  let achado;
  while ((achado = regex.exec(texto)) !== null) {
    encontradas.push(achado);
    if (!todas || encontradas.length >= 500) break;
    if (achado[0] === '') regex.lastIndex++;
  }
  return encontradas;
}

function destacarTrechos(texto, encontradas) {
  let html = '';
  let posicao = 0;
  encontradas.forEach((achado, i) => {
    if (!achado[0].length) return;
    html += escapar(texto.slice(posicao, achado.index));
    html += `<mark class="${i % 2 ? 'par' : 'impar'}">${escapar(achado[0])}</mark>`;
    posicao = achado.index + achado[0].length;
  });
  return html + escapar(texto.slice(posicao));
}

function atualizarRegexp() {
  const fonte = $('campo-regexp').value;
  const todas = $('flag-g').checked;
  const ignorarCaixa = $('flag-i').checked;
  let regex = null;
  let mensagem = '';

  try {
    regex = new RegExp(fonte, 'g' + (ignorarCaixa ? 'i' : ''));
  } catch (erro) {
    mensagem = 'Expressão inválida: ' + erro.message.replace(/^Invalid regular expression: (\/.*\/[a-z]*: )?/, '');
  }

  $('caixa-regexp').classList.toggle('com-erro', Boolean(mensagem));
  $('erro-regexp').hidden = !mensagem;
  $('erro-regexp-texto').textContent = mensagem;

  const linhas = $('textos-regexp').value.split('\n');
  const itens = [];
  const detalhes = [];
  let testadas = 0;
  let casaram = 0;

  linhas.forEach((linha, numero) => {
    if (!linha.length) return;
    testadas++;
    const encontradas = regex ? buscarCorrespondencias(regex, linha, todas) : [];
    if (encontradas.length) casaram++;

    const quantidade = encontradas.length === 1 ? '1 correspondência' : `${encontradas.length} correspondências`;
    itens.push(`<div class="resultado">
      ${icone(encontradas.length > 0)}
      <span class="cadeia">${destacarTrechos(linha, encontradas)}</span>
      <span class="motivo">${encontradas.length ? quantidade : 'não casa'}</span>
    </div>`);

    encontradas.forEach(achado => {
      detalhes.push({
        linha: numero + 1,
        inicio: achado.index,
        fim: achado.index + achado[0].length,
        trecho: achado[0],
        grupos: achado.slice(1)
      });
    });
  });

  $('lista-regexp').innerHTML = itens.join('');
  $('resumo-regexp').textContent = regex ? `${casaram} de ${testadas} linhas casam` : '—';
  $('total-correspondencias').textContent = regex ? `${detalhes.length} no total` : '';

  $('correspondencias').innerHTML = detalhes.length
    ? detalhes.slice(0, 300).map((item, i) => `<tr>
        <td class="suave">${i + 1}</td>
        <td>${item.linha}</td>
        <td class="suave">${item.inicio}–${item.fim}</td>
        <td>${item.trecho ? `<mark class="${i % 2 ? 'par' : 'impar'}">${escapar(item.trecho)}</mark>` : '<span class="suave">vazio</span>'}</td>
        <td>${item.grupos.length ? item.grupos.map((g, k) => `${k + 1}: ${g === undefined ? '—' : escapar(g)}`).join('&nbsp;&nbsp;') : '<span class="suave">—</span>'}</td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="vazio-tabela">Nenhuma correspondência encontrada.</td></tr>';
}

function carregarExemploRegexp(indice) {
  const exemplo = EXEMPLOS_REGEXP[indice];
  $('exemplos-regexp').value = String(indice);
  $('campo-regexp').value = exemplo.expressao;
  $('textos-regexp').value = exemplo.textos;
  atualizarRegexp();
}

function trocarModo(modo) {
  const formal = modo === 'formal';
  document.querySelectorAll('.aba').forEach(aba => aba.classList.toggle('ativa', aba.dataset.modo === modo));
  $('topo-formal').hidden = !formal;
  $('area-formal').hidden = !formal;
  $('topo-regexp').hidden = formal;
  $('area-regexp').hidden = formal;
}

function ligarEventos() {
  document.querySelectorAll('.aba').forEach(aba => {
    aba.addEventListener('click', () => trocarModo(aba.dataset.modo));
  });

  $('exemplos').addEventListener('change', evento => {
    if (evento.target.value !== '') carregarExemploFormal(Number(evento.target.value));
  });

  $('campo-er').addEventListener('input', () => {
    $('exemplos').value = '';
    estado.passo = null;
    atualizarFormal();
  });

  $('campo-alfabeto').addEventListener('input', atualizarFormal);

  $('cadeias').addEventListener('input', () => {
    estado.passo = null;
    mostrarResultados();
    mostrarFita();
  });

  $('tamanho-maximo').addEventListener('change', mostrarLinguagem);

  $('teclas').addEventListener('click', evento => {
    const botao = evento.target.closest('button');
    if (!botao) return;
    if (botao.hasAttribute('data-limpar')) $('campo-er').value = '';
    else inserirNaExpressao(botao.dataset.simbolo);
    $('exemplos').value = '';
    estado.passo = null;
    atualizarFormal();
  });

  $('lista-resultados').addEventListener('click', evento => {
    const botao = evento.target.closest('button.resultado');
    if (!botao) return;
    estado.selecionada = Number(botao.dataset.indice);
    estado.passo = null;
    mostrarResultados();
    mostrarFita();
  });

  $('passo-inicio').addEventListener('click', () => {
    estado.passo = 0;
    mostrarFita();
  });

  $('passo-anterior').addEventListener('click', () => {
    estado.passo = Math.max(0, estado.passoAtual - 1);
    mostrarFita();
  });

  $('passo-seguinte').addEventListener('click', () => {
    estado.passo = Math.min(estado.ultimoPasso, estado.passoAtual + 1);
    mostrarFita();
  });

  $('passo-fim').addEventListener('click', () => {
    estado.passo = null;
    mostrarFita();
  });

  $('exemplos-regexp').addEventListener('change', evento => carregarExemploRegexp(Number(evento.target.value)));
  $('campo-regexp').addEventListener('input', atualizarRegexp);
  $('textos-regexp').addEventListener('input', atualizarRegexp);
  $('flag-g').addEventListener('change', atualizarRegexp);
  $('flag-i').addEventListener('change', atualizarRegexp);
}

preencherMenus();
ligarEventos();
carregarExemploFormal(0);
estado.selecionada = 3;
mostrarResultados();
mostrarFita();
carregarExemploRegexp(0);
