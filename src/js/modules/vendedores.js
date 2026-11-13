      // GESTÃO DE VENDEDORES & CUSTÓDIA DA FROTA
      // ==============================================================================
      function getIniciaisNome(nome) {
        if (!nome) return 'VD';
        const parts = nome.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }

      // ==============================================================================
// GOMEX DISTRIBUIDORA · MÓDULO OFICIAL DE EQUIPES & GESTÃO DE VENDEDORES
// ==============================================================================

const EQUIPES_INFO = {
  '101': {
    id: '101',
    codigo: '101',
    nome: 'Equipe 101 · Alisson Bezerra',
    nomeCurto: 'Equipe 101',
    supervisor: 'Alisson Aparecido Madalena Bezerra',
    supervisorCurto: 'Alisson Bezerra',
    cargo: 'Supervisor 2',
    supLogin: 'alisson 101',
    cor: '#4f46e5',
    totalVendedores: 12
  },
  '102': {
    id: '102',
    codigo: '102',
    nome: 'Equipe 102 · Eliase Mendes',
    nomeCurto: 'Equipe 102',
    supervisor: 'Eliase Mendes de Aguiar',
    supervisorCurto: 'Eliase Mendes',
    cargo: 'Supervisor 3',
    supLogin: 'eliase',
    cor: '#0ea5e9',
    totalVendedores: 11
  },
  '103': {
    id: '103',
    codigo: '103',
    nome: 'Equipe 103 · Alisson Pereira',
    nomeCurto: 'Equipe 103',
    supervisor: 'Alisson Rodrigo Pereira',
    supervisorCurto: 'Alisson Pereira',
    cargo: 'Supervisor 4',
    supLogin: 'alisson 103',
    cor: '#10b981',
    totalVendedores: 12
  }
};

const EQUIPES_VENDEDORES_PADRAO = [
  // EQUIPE 101 - SUPERVISOR 2: ALISSON APARECIDO MADALENA BEZERRA (12)
  { rota: '201', nome: 'Eduardo Machado da Silva', equipe: '101' },
  { rota: '202', nome: 'Alisson Felipe Machado dos Santos', equipe: '101' },
  { rota: '204', nome: 'Natan Felipe Italiano Momesso', equipe: '101' },
  { rota: '205', nome: 'Fabio Negrisoli', equipe: '101' },
  { rota: '206', nome: 'Wesley Honorato dos Santos', equipe: '101' },
  { rota: '207', nome: 'Anderson Luis de Souza', equipe: '101' },
  { rota: '209', nome: 'Willians Ribeiro Coli', equipe: '101' },
  { rota: '210', nome: 'Arthur Natan Valeri', equipe: '101' },
  { rota: '212', nome: 'Charles de Souza Morais', equipe: '101' },
  { rota: '213', nome: 'Fernando Oliva', equipe: '101' },
  { rota: '214', nome: 'Welder Wester da Silva Santos', equipe: '101' },
  { rota: '239', nome: 'Maycon Crespi da Silva Oliveira', equipe: '101' },

  // EQUIPE 102 - SUPERVISOR 3: ELIASE MENDES DE AGUIAR (11)
  { rota: '203', nome: 'Wesley Aparecido da Rosa', equipe: '102' },
  { rota: '211', nome: 'Magno Cristiano de Lima', equipe: '102' },
  { rota: '217', nome: 'Jakson Hahn', equipe: '102' },
  { rota: '218', nome: 'Mairon de Arruda', equipe: '102' },
  { rota: '221', nome: 'Giovaner Marcos Fontana', equipe: '102' },
  { rota: '225', nome: 'Alex Francisco Puchalski', equipe: '102' },
  { rota: '227', nome: 'Roberto Luan Barrocal Morais', equipe: '102' },
  { rota: '230', nome: 'Eduardo Luiz de Bastiani', equipe: '102' },
  { rota: '235', nome: 'Eliton Patrique Kasinei', equipe: '102' },
  { rota: '236', nome: 'Leonardo Cesar Marques', equipe: '102' },
  { rota: '238', nome: 'Felipe Tenorio Miskiw', equipe: '102' },

  // EQUIPE 103 - SUPERVISOR 4: ALISSON RODRIGO PEREIRA (12)
  { rota: '215', nome: 'Antonio Amador Ferrante', equipe: '103' },
  { rota: '216', nome: 'Andre Stedile Mendes', equipe: '103' },
  { rota: '219', nome: 'Eleandro Linck', equipe: '103' },
  { rota: '220', nome: 'Tiago Zanatta', equipe: '103' },
  { rota: '222', nome: 'Emerson Dal Pra', equipe: '103' },
  { rota: '224', nome: 'Gabriel Vinicius Dick', equipe: '103' },
  { rota: '226', nome: 'Rodrigo Antunes', equipe: '103' },
  { rota: '228', nome: 'Marcelo Ramos Mikoski', equipe: '103' },
  { rota: '229', nome: 'Leonardo Cesar Alvarenga Weirich', equipe: '103' },
  { rota: '231', nome: 'Bruno da Conceicao Moises', equipe: '103' },
  { rota: '233', nome: 'Gustavo Girardi Borges', equipe: '103' },
  { rota: '240', nome: 'Jefferson Leandro Steche', equipe: '103' }
];

function normalizarTextoBusca(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function getEquipeByRota(rota) {
  const rDigits = String(rota || '').replace(/\D/g, '');
  if (!rDigits) return '';
  const item = EQUIPES_VENDEDORES_PADRAO.find(x => x.rota === rDigits);
  return item ? item.equipe : '';
}
window.getEquipeByRota = getEquipeByRota;

function getEquipeInfo(eqId) {
  return EQUIPES_INFO[String(eqId)] || null;
}
window.getEquipeInfo = getEquipeInfo;

function getVendedoresData() {
  const masterList = EQUIPES_VENDEDORES_PADRAO.map(v => {
    const eq = EQUIPES_INFO[v.equipe] || { supervisor: 'Não informado', supervisorCurto: 'Supervisor' };
    return {
      rota: v.rota,
      nome: v.nome,
      equipe: v.equipe,
      supervisor: eq.supervisor,
      supervisorCurto: eq.supervisorCurto,
      isOficial: true,
      vistorias: [],
      veiculosSet: new Set()
    };
  });

  const avulsosMap = new Map();

  (state.all || []).forEach(it => {
    if (it.status === 'inativo') return;
    const rawNome = (it.motorista || '').trim();
    const rotaDigits = String(it.rota || '').replace(/\D/g, '');

    let matched = null;
    if (rotaDigits) {
      matched = masterList.find(x => x.rota === rotaDigits);
    }
    if (!matched && rawNome) {
      const nomNorm = normalizarTextoBusca(rawNome);
      matched = masterList.find(x => {
        const vNom = normalizarTextoBusca(x.nome);
        return vNom === nomNorm || vNom.includes(nomNorm) || nomNorm.includes(vNom);
      });
    }

    if (matched) {
      matched.vistorias.push(it);
      if (it.placa) matched.veiculosSet.add(it.placa.toUpperCase().trim());
    } else if (rawNome) {
      const key = rawNome.toLowerCase();
      if (!avulsosMap.has(key)) {
        avulsosMap.set(key, {
          rota: rotaDigits || String(it.rota || '—'),
          nome: rawNome,
          equipe: 'outros',
          supervisor: 'Sem equipe fixa',
          supervisorCurto: 'Geral',
          isOficial: false,
          vistorias: [],
          veiculosSet: new Set()
        });
      }
      const rec = avulsosMap.get(key);
      rec.vistorias.push(it);
      if (it.placa) rec.veiculosSet.add(it.placa.toUpperCase().trim());
    }
  });

  const todos = [...masterList, ...Array.from(avulsosMap.values())];

  const resultado = todos.map(rec => {
    rec.vistorias.sort((a, b) => {
      const da = (a.data || '') + ' ' + (a.hora || '');
      const db = (b.data || '') + ' ' + (b.hora || '');
      if (db !== da) return db.localeCompare(da);
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    const totalVistorias = rec.vistorias.length;
    const maisRecente = totalVistorias > 0 ? rec.vistorias[0] : null;

    let statusPontual = 'sem_vistoria';
    let cicloMensal = null;
    let diasSemVistoria = 9999;

    if (maisRecente && maisRecente.data) {
      cicloMensal = calcularCicloVistoriaMensal(maisRecente.data);
      if (cicloMensal) {
        diasSemVistoria = cicloMensal.diasDecorridos;
        if (cicloMensal.status === 'em_dia') statusPontual = 'em_dia';
        else if (cicloMensal.status === 'proxima') statusPontual = 'atencao';
        else statusPontual = 'critico';
      } else {
        statusPontual = 'critico';
      }
    }

    const isPendente = statusPontual === 'sem_vistoria' || statusPontual === 'critico';

    return {
      rota: rec.rota,
      nome: rec.nome,
      equipe: rec.equipe,
      supervisor: rec.supervisor,
      supervisorCurto: rec.supervisorCurto,
      isOficial: rec.isOficial,
      totalVistorias,
      vistorias: rec.vistorias,
      veiculoAtual: maisRecente ? (maisRecente.placa || '—').toUpperCase() : '—',
      modeloAtual: maisRecente ? (maisRecente.veiculo || '—') : '—',
      dataUltima: maisRecente ? maisRecente.data : null,
      horaUltima: maisRecente ? maisRecente.hora : null,
      tipoUltimo: maisRecente ? maisRecente.tipo : '—',
      diasSemVistoria,
      cicloMensal,
      statusPontual,
      isPendente,
      kmAtual: maisRecente ? maisRecente.km : null,
      avariasRecentes: maisRecente ? avariasOf(maisRecente).length : 0,
      pneuAlerta: maisRecente ? pneuAlert(maisRecente) : false,
      liberacaoAtual: maisRecente ? (maisRecente.liberacao || 'Liberado') : 'Sem vistoria',
      todosVeiculos: Array.from(rec.veiculosSet)
    };
  });

  // Ordenação prioritária: Pendentes e sem vistoria primeiro, depois por atraso de dias
  resultado.sort((a, b) => {
    if (a.isPendente !== b.isPendente) return a.isPendente ? -1 : 1;
    if (a.diasSemVistoria !== b.diasSemVistoria) return b.diasSemVistoria - a.diasSemVistoria;
    return a.rota.localeCompare(b.rota, 'pt-BR', { numeric: true });
  });

  return resultado;
}
window.getVendedoresData = getVendedoresData;

function renderVendedoresView() {
  const tbody = $('vendTableBody');
  if (!tbody) return;

  const todos = getVendedoresData();

  // 1. Atualizar métricas dos cards de cada equipe
  ['101', '102', '103'].forEach(eqId => {
    const daEquipe = todos.filter(v => v.equipe === eqId);
    const emDia = daEquipe.filter(v => v.statusPontual === 'em_dia').length;
    const pendentes = daEquipe.filter(v => v.isPendente).length;

    const elEmDia = $(`eq${eqId}EmDia`);
    const elPend = $(`eq${eqId}Pendentes`);
    const card = $(`cardEq${eqId}`);

    if (elEmDia) elEmDia.textContent = emDia;
    if (elPend) elPend.textContent = pendentes;

    if (card) {
      const isSelected = state.filtroVendEquipe === eqId;
      card.style.borderColor = isSelected ? 'var(--accent-hi)' : 'var(--line)';
      card.style.background = isSelected ? 'var(--panel-2)' : 'var(--panel)';
    }
  });

  // 2. Atualizar métricas do summary geral
  const totalOficiais = todos.filter(v => v.isOficial).length;
  const totalPendentes = todos.filter(v => v.isPendente).length;
  const totalEmDia = todos.filter(v => v.statusPontual === 'em_dia').length;
  const totalAtencao = todos.filter(v => v.statusPontual === 'atencao').length;
  const carrosSet = new Set(todos.map(v => v.veiculoAtual).filter(p => p && p !== '—'));

  if ($('vendStatTotal')) $('vendStatTotal').textContent = totalOficiais || todos.length;
  if ($('vendStatPendentes')) $('vendStatPendentes').textContent = totalPendentes;
  if ($('vendStatEmDia')) $('vendStatEmDia').textContent = totalEmDia;
  if ($('vendStatAtencao')) $('vendStatAtencao').textContent = totalAtencao;
  if ($('vendStatCarros')) $('vendStatCarros').textContent = carrosSet.size;

  // 3. Atualizar estado visual do seletor de equipe
  if ($('filtroVendEquipe') && $('filtroVendEquipe').value !== (state.filtroVendEquipe || 'todos')) {
    $('filtroVendEquipe').value = state.filtroVendEquipe || 'todos';
  }

  // 4. Filtragem
  const q = (state.filtroVendBusca || '').toLowerCase().trim();
  const fEquipe = state.filtroVendEquipe || 'todos';
  const fStatus = state.filtroVend || 'todos';

  const filtrados = todos.filter(v => {
    // Filtro de Equipe
    if (fEquipe !== 'todos' && v.equipe !== fEquipe) return false;

    // Filtro de Status
    if (fStatus === 'pendentes') {
      if (!v.isPendente) return false;
    } else if (fStatus !== 'todos') {
      if (v.statusPontual !== fStatus) return false;
    }

    // Filtro de Busca Textual
    if (q) {
      const hay = (v.nome + ' ' + v.veiculoAtual + ' ' + v.modeloAtual + ' ' + (v.rota || '') + ' ' + (v.supervisor || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });

  if (!filtrados.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">' +
      '<div class="empty-icon-wrap"><svg class="i"><use href="#i-user"/></svg></div>' +
      '<h2>Nenhum vendedor encontrado para este filtro</h2>' +
      '<p>Ajuste os filtros de equipe ou status para visualizar os demais vendedores.</p>' +
      '</td></tr>';
    return;
  }

  tbody.innerHTML = filtrados.map(v => {
    const iniciais = getIniciaisNome(v.nome);
    const cm = v.cicloMensal;
    let pontualBadge = '';

    if (v.statusPontual === 'sem_vistoria') {
      pontualBadge = '<span class="badge-pontual critico" style="background:rgba(239,68,68,0.2);color:#fca5a5;border:1px solid rgba(239,68,68,0.4);font-weight:800">' + icon('alert') + 'NUNCA REALIZOU</span>';
    } else if (v.statusPontual === 'critico') {
      pontualBadge = '<span class="badge-pontual critico" style="background:rgba(239,68,68,0.15);color:#fca5a5;font-weight:700">' + icon('alert') + (cm ? 'Vencida (' + cm.diasDecorridos + 'd)' : 'Vistoria Vencida') + '</span>';
    } else if (v.statusPontual === 'atencao') {
      pontualBadge = '<span class="badge-pontual atencao" style="background:rgba(245,158,11,0.15);color:#fcd34d;font-weight:700">' + icon('clock') + (cm ? 'Vencendo em ' + cm.diasRestantes + 'd' : 'Próxima de vencer') + '</span>';
    } else {
      pontualBadge = '<span class="badge-pontual em-dia" style="background:rgba(16,185,129,0.15);color:#6ee7b7;font-weight:700">' + icon('check') + (cm ? 'Em dia (' + cm.diasDecorridos + 'd)' : 'Em dia') + '</span>';
    }

    let equipeBadge = '';
    if (v.equipe === '101') {
      equipeBadge = '<span class="badge" style="background:rgba(79,70,229,0.15);color:#818cf8;font-weight:700;font-size:10px;padding:2px 6px;border-radius:4px">Eq. 101</span>';
    } else if (v.equipe === '102') {
      equipeBadge = '<span class="badge" style="background:rgba(14,165,233,0.15);color:#38bdf8;font-weight:700;font-size:10px;padding:2px 6px;border-radius:4px">Eq. 102</span>';
    } else if (v.equipe === '103') {
      equipeBadge = '<span class="badge" style="background:rgba(16,185,129,0.15);color:#34d399;font-weight:700;font-size:10px;padding:2px 6px;border-radius:4px">Eq. 103</span>';
    } else {
      equipeBadge = '<span class="badge" style="background:rgba(255,255,255,0.08);color:var(--ink-3);font-size:10px;padding:2px 6px;border-radius:4px">Avulso</span>';
    }

    return '<tr style="' + (v.isPendente ? 'background:rgba(239,68,68,0.03)' : '') + '">' +
      '<td>' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<div class="vend-avatar" style="' + (v.isPendente ? 'background:rgba(239,68,68,0.15);color:#ef4444;border-color:rgba(239,68,68,0.3)' : '') + '">' + esc(iniciais) + '</div>' +
      '<div>' +
      '<div style="font-weight:700;color:var(--ink);font-size:13px">' + esc(v.nome) + '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;margin-top:2px">' +
      '<span style="font-size:11px;color:var(--ink-3)">' + v.totalVistorias + ' ' + (v.totalVistorias === 1 ? 'vistoria no total' : 'vistorias no total') + '</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</td>' +
      '<td>' +
      '<div style="display:grid;gap:2px">' +
      '<div style="display:flex;align-items:center;gap:6px">' +
      equipeBadge +
      '<span class="badge-rota" style="font-size:11px;font-weight:700">Rota ' + esc(v.rota) + '</span>' +
      '</div>' +
      '<span style="font-size:10.5px;color:var(--ink-3)">' + esc(v.supervisorCurto) + '</span>' +
      '</div>' +
      '</td>' +
      '<td>' +
      (v.veiculoAtual !== '—'
        ? '<div class="stack">' +
        '<button type="button" class="plate" data-act="history" data-placa="' + esc(v.veiculoAtual) + '" onclick="abrirHistoricoVeiculo(this.dataset.placa)" title="Ver histórico deste veículo">' + esc(v.veiculoAtual) + '</button>' +
        '<span class="t2">' + esc(v.modeloAtual) + '</span>' +
        '</div>'
        : '<span class="muted">Sem carro atribuído</span>'
      ) +
      '</td>' +
      '<td>' + pontualBadge + '</td>' +
      '<td>' +
      (v.dataUltima
        ? '<span class="t1">' + formatarData(v.dataUltima) + '</span>' +
        '<span class="t2">' + esc(v.horaUltima || '--:--') + ' (' + esc(v.tipoUltimo) + ')</span>'
        : '<span class="muted" style="color:var(--bad);font-weight:600">Nenhum registro</span>'
      ) +
      '</td>' +
      '<td>' + (v.kmAtual ? '<span class="badge-km">' + fmtKm(v.kmAtual) + '</span>' : '<span class="muted">—</span>') + '</td>' +
      '<td style="text-align:right">' +
      '<div style="display:inline-flex;align-items:center;gap:6px">' +
      '<button type="button" class="btn btn-ghost" style="height:28px;padding:0 8px;font-size:11.5px;color:var(--accent-hi)" data-vend="' + esc(v.nome) + '" onclick="abrirModalVendedor(this.dataset.vend)" title="Ver todas as vistorias deste vendedor">' +
      icon('user') + ' <span>Vistorias</span>' +
      '</button>' +
      (v.isPendente
        ? '<button type="button" class="btn btn-ghost" style="height:28px;padding:0 8px;font-size:11.5px;color:var(--ok);border-color:rgba(16,185,129,0.35);background:rgba(16,185,129,0.06);font-weight:700" onclick="copiarCobrancaWhatsAppVendedor(\'' + esc(v.rota) + '\')" title="Copiar mensagem de cobrança pronta para o WhatsApp deste vendedor">' +
        '<svg class="i" style="width:13px;height:13px"><use href="#i-whatsapp"/></svg> <span>Cobrar</span>' +
        '</button>'
        : ''
      ) +
      (v.veiculoAtual !== '—'
        ? '<button type="button" class="btn btn-ghost" style="height:28px;padding:0 8px;font-size:11.5px;color:#fbbf24" data-placa="' + esc(v.veiculoAtual) + '" onclick="abrirModalCustodia(this.dataset.placa)" title="Verificar troca de custódia e histórico de motoristas deste carro">' +
        icon('history') + ' <span>Custódia</span>' +
        '</button>'
        : ''
      ) +
      '</div>' +
      '</td>' +
      '</tr>';
  }).join('');
}
window.renderVendedoresView = renderVendedoresView;

function filtrarTabelaVendedores(tipo) {
  state.filtroVend = tipo;
  const btns = [
    { id: 'btnFilterVendAll', ativo: tipo === 'todos' },
    { id: 'btnFilterVendPendentes', ativo: tipo === 'pendentes' },
    { id: 'btnFilterVendEmDia', ativo: tipo === 'em_dia' },
    { id: 'btnFilterVendAtencao', ativo: tipo === 'atencao' }
  ];

  btns.forEach(b => {
    const el = $(b.id);
    if (!el) return;
    if (b.id === 'btnFilterVendPendentes') {
      el.style.background = b.ativo ? 'rgba(239, 68, 68, 0.25)' : 'transparent';
      el.style.color = b.ativo ? '#ef4444' : 'var(--bad)';
      el.style.borderColor = b.ativo ? 'rgba(239, 68, 68, 0.5)' : '';
    } else {
      el.style.background = b.ativo ? 'var(--accent-tint)' : 'transparent';
      el.style.color = b.ativo ? 'var(--accent-hi)' : '';
    }
  });

  renderVendedoresView();
}
window.filtrarTabelaVendedores = filtrarTabelaVendedores;

function selecionarEquipeFiltro(eqId) {
  state.filtroVendEquipe = eqId;
  const sel = $('filtroVendEquipe');
  if (sel) sel.value = eqId;
  renderVendedoresView();
}
window.selecionarEquipeFiltro = selecionarEquipeFiltro;

// Funções de Cobrança WhatsApp Formatadas e Inteligentes
async function copiarTextoComFeedback(msg, tituloToast = 'Texto copiado!') {
  let copiou = false;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(msg);
      copiou = true;
    } catch (e) {}
  }
  if (!copiou) {
    const ta = document.createElement('textarea');
    ta.value = msg;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      copiou = true;
    } catch (e) {}
    document.body.removeChild(ta);
  }
  if (copiou) {
    showToast(`${tituloToast} Cole no WhatsApp.`, 'ok');
  } else {
    showToast('Não foi possível copiar automaticamente.', 'err');
  }
  return copiou;
}

async function copiarCobrancaWhatsAppEquipe(eqId) {
  const todos = getVendedoresData();
  const eqInfo = EQUIPES_INFO[String(eqId)];
  if (!eqInfo) return;

  const daEquipe = todos.filter(v => v.equipe === String(eqId));
  const pendentes = daEquipe.filter(v => v.isPendente);

  if (!pendentes.length) {
    showToast(`Parabéns! Todos os 12 vendedores da ${eqInfo.nomeCurto} estão com vistoria em dia!`, 'ok');
    return;
  }

  const linhas = [
    `*GOMEX DISTRIBUIDORA · VISTORIAS PENDENTES*`,
    `*${eqInfo.nome}*`,
    `*Supervisor:* ${eqInfo.supervisor}`,
    `*Data:* ${new Date().toLocaleDateString('pt-BR')}`,
    ``,
    `Atenção vendedores, constam pendências de check-list para a sua equipe:`,
    ``
  ];

  pendentes.forEach(v => {
    const motivo = v.statusPontual === 'sem_vistoria'
      ? 'Nunca realizou vistoria'
      : `Vistoria vencida (${v.diasSemVistoria} dias atrás)`;
    linhas.push(`• *Rota ${v.rota}* - ${v.nome}: _${motivo}_`);
  });

  linhas.push(``);
  linhas.push(`Favor realizar a vistoria obrigatória agora pelo link oficial:`);
  linhas.push(`Link: https://gomex-checklist.gomexassistencia2026.workers.dev/`);
  linhas.push(``);
  linhas.push(`_Mensagem emitida pelo Painel Executivo da Frota Gomex_`);

  const msg = linhas.join('\n');
  await copiarTextoComFeedback(msg, `Cobrança da ${eqInfo.nomeCurto} copiada!`);
}
window.copiarCobrancaWhatsAppEquipe = copiarCobrancaWhatsAppEquipe;

async function copiarCobrancaWhatsAppGeral() {
  const todos = getVendedoresData();
  const pendentes = todos.filter(v => v.isPendente && v.isOficial);

  if (!pendentes.length) {
    showToast('Excelente! Toda a frota está 100% com vistorias em dia.', 'ok');
    return;
  }

  const linhas = [
    `*GOMEX DISTRIBUIDORA · RELATÓRIO DE VISTORIAS PENDENTES DA FROTA*`,
    `*Data:* ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    `*Total de Pendências:* ${pendentes.length} de 35 vendedores`,
    ``
  ];

  ['101', '102', '103'].forEach(eqId => {
    const eq = EQUIPES_INFO[eqId];
    const pEq = pendentes.filter(v => v.equipe === eqId);
    linhas.push(`*${eq.nomeCurto} · Supervisor: ${eq.supervisorCurto}* (${pEq.length} pendentes):`);
    if (pEq.length === 0) {
      linhas.push(`  100% em dia`);
    } else {
      pEq.forEach(v => {
        const mot = v.statusPontual === 'sem_vistoria' ? 'Sem vistoria' : `Vencida há ${v.diasSemVistoria}d`;
        linhas.push(`  • Rota ${v.rota} - ${v.nome} (${mot})`);
      });
    }
    linhas.push(``);
  });

  linhas.push(`Supervisores, por favor cobrem o preenchimento imediato:`);
  linhas.push(`Link: https://gomex-checklist.gomexassistencia2026.workers.dev/`);
  linhas.push(``);
  linhas.push(`_Gestão de Frota Gomex Distribuidora_`);

  const msg = linhas.join('\n');
  await copiarTextoComFeedback(msg, 'Lista geral de cobrança copiada!');
}
window.copiarCobrancaWhatsAppGeral = copiarCobrancaWhatsAppGeral;

async function copiarCobrancaWhatsAppVendedor(rota) {
  const todos = getVendedoresData();
  const v = todos.find(x => String(x.rota) === String(rota));
  if (!v) return;

  const motivo = v.statusPontual === 'sem_vistoria'
    ? 'identificamos que seu veículo ainda não possui o check-list de vistoria registrado no sistema.'
    : `sua última vistoria foi realizada há ${v.diasSemVistoria} dias e está vencida.`;

  const msg = [
    `*GOMEX DISTRIBUIDORA · AVISO DE VISTORIA VEICULAR*`,
    ``,
    `Olá *${v.nome}* (Rota ${v.rota}),`,
    ``,
    `Consta em nosso sistema que ${motivo}`,
    ``,
    `Por questão de segurança e conservação da frota da empresa, solicitamos que realize o check-list obrigatório hoje antes de iniciar as atividades ou na primeira parada segura:`,
    ``,
    `*Link do aplicativo:*`,
    `https://gomex-checklist.gomexassistencia2026.workers.dev/`,
    ``,
    `_Gestão de Frota Gomex · Supervisão: ${v.supervisor}_`
  ].join('\n');

  await copiarTextoComFeedback(msg, `Cobrança de ${v.nome} (Rota ${v.rota}) copiada!`);
}
window.copiarCobrancaWhatsAppVendedor = copiarCobrancaWhatsAppVendedor;

function abrirModalVendedor(nome) {
  const todos = getVendedoresData();
  const v = todos.find(x => x.nome.toLowerCase() === (nome || '').toLowerCase());
  if (!v) return;

  if ($('mHVendAvatar')) $('mHVendAvatar').textContent = getIniciaisNome(v.nome);
  if ($('mHVendNome')) $('mHVendNome').textContent = v.nome;
  if ($('mHVendSub')) {
    $('mHVendSub').textContent = `Equipe ${v.equipe} · Supervisor: ${v.supervisor} · Rota ${v.rota}`;
  }
  if ($('mHVendCarro')) {
    $('mHVendCarro').textContent = v.veiculoAtual !== '—' ? `${v.veiculoAtual} (${v.modeloAtual})` : 'Nenhum veículo vinculado';
  }
  if ($('mHVendUltimaData')) {
    $('mHVendUltimaData').textContent = v.dataUltima ? `${formatarData(v.dataUltima)}${v.horaUltima ? ' às ' + v.horaUltima : ''}` : 'Nenhuma vistoria realizada';
  }
  if ($('mHVendTotal')) $('mHVendTotal').textContent = v.totalVistorias;

  let pontualBadge = '';
  if (v.statusPontual === 'sem_vistoria') {
    pontualBadge = '<span class="badge-pontual critico">Nunca realizou vistoria</span>';
  } else if (v.statusPontual === 'em_dia') {
    pontualBadge = '<span class="badge-pontual em-dia">' + (v.cicloMensal ? 'Em dia · Próx: ' + v.cicloMensal.dataProximaFmt : 'Vistoria mensal em dia') + '</span>';
  } else if (v.statusPontual === 'atencao') {
    pontualBadge = '<span class="badge-pontual atencao">' + (v.cicloMensal ? v.cicloMensal.labelBadge : 'Próxima de vencer') + '</span>';
  } else {
    pontualBadge = '<span class="badge-pontual critico">' + (v.cicloMensal ? v.cicloMensal.labelBadge : v.diasSemVistoria + ' dias sem vistoria') + '</span>';
  }
  if ($('mHVendPontualidade')) $('mHVendPontualidade').innerHTML = pontualBadge;

  const tbody = $('mHVendTableBody');
  if (tbody) {
    if (!v.vistorias.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--ink-3)">Este vendedor ainda não enviou nenhum check-list no sistema.</td></tr>';
    } else {
      tbody.innerHTML = v.vistorias.map(it => {
        const av = avariasOf(it).length;
        const alert = pneuAlert(it);
        return '<tr>' +
          '<td><span class="num">' + esc(it.numero || '—') + '</span></td>' +
          '<td>' + formatarData(it.data) + ' ' + esc(it.hora || '') + '</td>' +
          '<td><span class="plate" style="font-size:11px">' + esc((it.placa || '').toUpperCase()) + '</span></td>' +
          '<td>' + tipoBadge(it.tipo) + '</td>' +
          '<td>' + fmtKm(it.km) + '</td>' +
          '<td>' + (av ? '<span class="txt-warn">' + av + ' marcas</span>' : '<span class="muted">Íntegro</span>') + '</td>' +
          '<td>' + (alert ? '<span class="txt-warn">Atenção</span>' : '<span class="muted">Normal</span>') + '</td>' +
          '<td>' + statusTag(it.liberacao, it.status) + '</td>' +
          '<td style="text-align:right">' +
          '<button type="button" class="btn btn-ghost btn-icon" style="height:26px;width:26px" onclick="fecharModalVendedor(); openDrawer(\'' + it.id + '\', this, \'vistoria\')" title="Abrir ficha">' +
          icon('eye') +
          '</button>' +
          '</td>' +
          '</tr>';
      }).join('');
    }
  }

  if ($('modalHistVendedor')) $('modalHistVendedor').classList.add('open');
}
window.abrirModalVendedor = abrirModalVendedor;

function fecharModalVendedor() {
  if ($('modalHistVendedor')) $('modalHistVendedor').classList.remove('open');
}
window.fecharModalVendedor = fecharModalVendedor;

function getTransicoesCustodia(placaAlvo = null) {
  const transicoes = [];
  const veiculos = new Map();

  (state.all || []).forEach(it => {
    if (it.status === 'inativo') return;
    const placa = (it.placa || '').toUpperCase().trim();
    if (!placa) return;
    if (placaAlvo && placa !== placaAlvo.toUpperCase().trim()) return;

    if (!veiculos.has(placa)) veiculos.set(placa, []);
    veiculos.get(placa).push(it);
  });

  veiculos.forEach((list, placa) => {
    list.sort((a, b) => {
      const da = (a.data || '') + ' ' + (a.hora || '');
      const db = (b.data || '') + ' ' + (b.hora || '');
      return da.localeCompare(db);
    });

    for (let i = 0; i < list.length - 1; i++) {
      const vAnterior = list[i];
      const vProxima = list[i + 1];

      const motA = (vAnterior.motorista || 'Não informado').trim();
      const motB = (vProxima.motorista || 'Não informado').trim();

      if (motA.toLowerCase() !== motB.toLowerCase()) {
        const avA = avariasOf(vAnterior).length;
        const avB = avariasOf(vProxima).length;
        const diffAv = avB - avA;

        let veredito = 'ok';
        let vereditoTexto = 'CONFORMIDADE: O veículo foi recebido por ' + motB + ' nas mesmas condições de carroceria entregues por ' + motA + '.';

        if (diffAv > 0) {
          veredito = 'alerta';
          vereditoTexto = 'NOVO DANO DETECTADO: O veículo foi entregue por ' + motA + ' com ' + avA + ' avaria(s) e já constam ' + avB + ' avaria(s) com ' + motB + ' (+' + diffAv + ' nova(s) avaria(s) registradas).';
        } else if (avA > 0 && avB > 0) {
          veredito = 'preexistente';
          vereditoTexto = 'AVARIAS PRÉ-EXISTENTES: O veículo já possuía ' + avA + ' avaria(s) registradas antes de ' + motB + ' assumir a custódia.';
        }

        transicoes.push({
          placa,
          veiculo: vProxima.veiculo || vAnterior.veiculo || '—',
          entreguePor: {
            motorista: motA,
            data: vAnterior.data,
            hora: vAnterior.hora,
            km: vAnterior.km,
            avarias: avA,
            liberacao: vAnterior.liberacao,
            numero: vAnterior.numero || '—'
          },
          recebidoPor: {
            motorista: motB,
            data: vProxima.data,
            hora: vProxima.hora,
            km: vProxima.km,
            avarias: avB,
            liberacao: vProxima.liberacao,
            numero: vProxima.numero || '—'
          },
          diffAv,
          veredito,
          vereditoTexto
        });
      }
    }
  });

  return transicoes;
}

function abrirModalCustodia(placaPadrao = '') {
  const sel = $('selectCustodiaPlaca');
  if (sel) {
    const placasUnicas = [...new Set((state.all || []).filter(it => it.status !== 'inativo' && it.placa).map(it => it.placa.toUpperCase().trim()))].sort();
    sel.innerHTML = '<option value="">Todos os Veículos (' + placasUnicas.length + ')</option>' +
      placasUnicas.map(p => '<option value="' + esc(p) + '" ' + (p === (placaPadrao || '').toUpperCase().trim() ? 'selected' : '') + '>' + esc(p) + '</option>').join('');
  }

  renderModalCustodiaConteudo(placaPadrao);
  if ($('modalCustodiaVeiculo')) $('modalCustodiaVeiculo').classList.add('open');
}
window.abrirModalCustodia = abrirModalCustodia;

function fecharModalCustodia() {
  if ($('modalCustodiaVeiculo')) $('modalCustodiaVeiculo').classList.remove('open');
}
window.fecharModalCustodia = fecharModalCustodia;

function renderModalCustodiaConteudo(placaAlvo = '') {
  const container = $('custodiaTransicoesContainer');
  const badge = $('custodiaTransCountBadge');
  if (!container) return;

  const trans = getTransicoesCustodia(placaAlvo);

  if (badge) {
    badge.textContent = trans.length ? trans.length + (trans.length === 1 ? ' transição de motorista detectada' : ' transições de motorista detectadas') : 'Nenhuma troca de vendedor registrada';
  }

  if (!trans.length) {
    container.innerHTML = '<div style="text-align:center;padding:32px 16px;background:var(--panel-2);border-radius:var(--r);border:1px dashed var(--line-strong)">' +
      '<h4 style="font-size:14px;font-weight:700;color:var(--ink);margin-bottom:4px">Nenhuma transferência de custódia encontrada</h4>' +
      '<p style="font-size:12.5px;color:var(--ink-3);max-width:440px;margin:0 auto;line-height:1.45">' +
      (placaAlvo
        ? 'O veículo <strong>' + esc(placaAlvo.toUpperCase()) + '</strong> possui apenas um vendedor associado em seu histórico até o momento. Quando outro motorista realizar vistoria deste carro, o comparador de avarias aparecerá aqui automaticamente.'
        : 'Até o momento, cada veículo da frota está operando com seu motorista titular inicial. Quando houver troca de vendedor no check-list, o comparativo Antes vs Depois será gerado aqui.') +
      '</p>' +
      '</div>';
    return;
  }

  container.innerHTML = trans.map(t => {
    return '<div class="panel" style="border:1px solid var(--line-strong);padding:16px;border-radius:var(--r);background:var(--panel)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<span class="plate" style="font-size:13px">' + esc(t.placa) + '</span>' +
      '<strong style="color:var(--ink);font-size:14px">' + esc(t.veiculo) + '</strong>' +
      '</div>' +
      '<span style="font-size:12px;color:var(--ink-3);font-weight:600">Transferência de Custódia</span>' +
      '</div>' +

      '<div class="custodia-compare-grid">' +
      '<div class="custodia-driver-card old">' +
      '<div style="font-size:11px;font-weight:700;color:var(--accent-hi);text-transform:uppercase;margin-bottom:4px">' +
      '1. Vendedor Anterior (Saída)' +
      '</div>' +
      '<div style="font-size:14px;font-weight:800;color:var(--ink);margin-bottom:8px">' +
      esc(t.entreguePor.motorista) +
      '</div>' +
      '<div style="font-size:12px;color:var(--ink-2);display:grid;gap:4px">' +
      '<div>Data: <strong>' + formatarData(t.entreguePor.data) + ' às ' + esc(t.entreguePor.hora || '--:--') + '</strong></div>' +
      '<div>Vistoria: <strong>Nº ' + esc(t.entreguePor.numero) + '</strong></div>' +
      '<div>KM na Entrega: <strong>' + fmtKm(t.entreguePor.km) + '</strong></div>' +
      '<div>Carroceria: <strong class="' + (t.entreguePor.avarias ? 'txt-warn' : 'txt-ok') + '">' + (t.entreguePor.avarias ? t.entreguePor.avarias + ' marca(s)' : 'Íntegro (0 avarias)') + '</strong></div>' +
      '<div>Situação: <strong>' + esc(t.entreguePor.liberacao) + '</strong></div>' +
      '</div>' +
      '</div>' +

      '<div class="custodia-arrow-divider">' +
      '<svg class="i" style="width:24px;height:24px;color:var(--accent-hi)"><use href="#i-refresh"/></svg>' +
      '<span style="font-size:11px;font-weight:700;margin-top:4px">Troca</span>' +
      '</div>' +

      '<div class="custodia-driver-card new">' +
      '<div style="font-size:11px;font-weight:700;color:#fbbf24;text-transform:uppercase;margin-bottom:4px">' +
      '2. Vendedor Atual (Entrada)' +
      '</div>' +
      '<div style="font-size:14px;font-weight:800;color:var(--ink);margin-bottom:8px">' +
      esc(t.recebidoPor.motorista) +
      '</div>' +
      '<div style="font-size:12px;color:var(--ink-2);display:grid;gap:4px">' +
      '<div>Data: <strong>' + formatarData(t.recebidoPor.data) + ' às ' + esc(t.recebidoPor.hora || '--:--') + '</strong></div>' +
      '<div>Vistoria: <strong>Nº ' + esc(t.recebidoPor.numero) + '</strong></div>' +
      '<div>KM no Recebimento: <strong>' + fmtKm(t.recebidoPor.km) + '</strong></div>' +
      '<div>Carroceria: <strong class="' + (t.recebidoPor.avarias ? 'txt-bad' : 'txt-ok') + '">' + (t.recebidoPor.avarias ? t.recebidoPor.avarias + ' marca(s)' : 'Íntegro (0 avarias)') + '</strong></div>' +
      '<div>Situação: <strong>' + esc(t.recebidoPor.liberacao) + '</strong></div>' +
      '</div>' +
      '</div>' +
      '</div>' +

      '<div class="custodia-veredicto-box ' + t.veredito + '">' +
      esc(t.vereditoTexto) +
      '</div>' +
      '</div>';
  }).join('');
}
window.renderModalCustodiaConteudo = renderModalCustodiaConteudo;

setTimeout(() => {
  const fSearch = $('filtroVendBusca');
  if (fSearch) {
    fSearch.addEventListener('input', e => {
      state.filtroVendBusca = e.target.value.toLowerCase().trim();
      renderVendedoresView();
    });
  }
}, 50);

// ==============================================================================
// GOMEX DISTRIBUIDORA · RELATÓRIO DE VISTORIAS POR SUPERVISOR & VENDEDORES
// ==============================================================================

function abrirModalRelatorioSupervisores(eqFiltro = 'todos') {
  const m = $('modalRelatorioSupervisores');
  if (!m) return;
  if ($('relSupFiltroEquipe')) {
    $('relSupFiltroEquipe').value = eqFiltro || 'todos';
  }
  if ($('relSupFiltroStatus')) {
    $('relSupFiltroStatus').value = 'todos';
  }
  if ($('relSupInputBusca')) {
    $('relSupInputBusca').value = '';
  }
  m.classList.add('open');
  renderModalRelatorioSupervisores();
}
window.abrirModalRelatorioSupervisores = abrirModalRelatorioSupervisores;

function fecharModalRelatorioSupervisores() {
  const m = $('modalRelatorioSupervisores');
  if (m) m.classList.remove('open');
}
window.fecharModalRelatorioSupervisores = fecharModalRelatorioSupervisores;

function renderModalRelatorioSupervisores() {
  const container = $('relSupGruposContainer');
  if (!container) return;

  const eqFiltro = $('relSupFiltroEquipe') ? $('relSupFiltroEquipe').value : 'todos';
  const stFiltro = $('relSupFiltroStatus') ? $('relSupFiltroStatus').value : 'todos';
  const qBusca = $('relSupInputBusca') ? normalizarTextoBusca($('relSupInputBusca').value) : '';

  const todos = getVendedoresData();

  const filtrados = todos.filter(v => {
    // Filtro por Equipe / Supervisor
    if (eqFiltro !== 'todos' && v.equipe !== eqFiltro) return false;

    // Filtro por Situação da Vistoria
    if (stFiltro === 'pendentes' && !v.isPendente) return false;
    if (stFiltro === 'sem_vistoria' && v.statusPontual !== 'sem_vistoria') return false;
    if (stFiltro === 'critico' && v.statusPontual !== 'critico') return false;
    if (stFiltro === 'atencao' && v.statusPontual !== 'atencao') return false;
    if (stFiltro === 'em_dia' && v.statusPontual !== 'em_dia') return false;

    // Filtro de Busca Textual
    if (qBusca) {
      const hay = normalizarTextoBusca(v.nome + ' ' + v.rota + ' ' + (v.supervisor || '') + ' ' + (v.veiculoAtual || '') + ' ' + (v.modeloAtual || ''));
      if (!hay.includes(qBusca)) return false;
    }

    return true;
  });

  // Atualizar KPIs do Relatório
  if ($('relSupKpiTotal')) $('relSupKpiTotal').textContent = filtrados.length;
  if ($('relSupKpiSemVist')) $('relSupKpiSemVist').textContent = filtrados.filter(v => v.statusPontual === 'sem_vistoria').length;
  if ($('relSupKpiVencidas')) $('relSupKpiVencidas').textContent = filtrados.filter(v => v.statusPontual === 'critico').length;
  if ($('relSupKpiProximas')) $('relSupKpiProximas').textContent = filtrados.filter(v => v.statusPontual === 'atencao').length;
  if ($('relSupKpiEmDia')) $('relSupKpiEmDia').textContent = filtrados.filter(v => v.statusPontual === 'em_dia').length;

  if (!filtrados.length) {
    container.innerHTML = '<div style="text-align:center;padding:36px 16px;background:var(--panel);border:1px solid var(--line);border-radius:10px">' +
      '<div style="width:48px;height:48px;border-radius:50%;background:rgba(239,68,68,0.1);color:var(--bad);display:grid;place-items:center;margin:0 auto 12px">' +
      '<svg class="i" style="width:24px;height:24px"><use href="#i-search"/></svg>' +
      '</div>' +
      '<h4 style="font-size:15px;font-weight:700;color:var(--ink)">Nenhum vendedor encontrado</h4>' +
      '<p style="font-size:12.5px;color:var(--ink-3);margin-top:4px">Ajuste os filtros de supervisor, situação ou o termo de busca para visualizar os registros.</p>' +
      '</div>';
    return;
  }

  // Agrupamento por Equipe / Supervisor
  const equipesOrdem = ['101', '102', '103'];
  const gruposMap = new Map();

  equipesOrdem.forEach(eqId => {
    const list = filtrados.filter(v => v.equipe === eqId);
    if (list.length > 0) {
      gruposMap.set(eqId, list);
    }
  });

  // Vendedores avulsos/outros se existirem
  const outros = filtrados.filter(v => !equipesOrdem.includes(v.equipe));
  if (outros.length > 0) {
    gruposMap.set('outros', outros);
  }

  let html = '';

  gruposMap.forEach((vendedoresGrupo, eqKey) => {
    const eqInfo = EQUIPES_INFO[eqKey] || {
      nome: 'Outros Vendedores / Avulsos',
      nomeCurto: 'Avulsos',
      supervisor: 'Sem equipe fixa',
      supervisorCurto: 'Avulsos',
      cor: '#64748b',
      codigo: 'EXT'
    };

    const emDia = vendedoresGrupo.filter(v => v.statusPontual === 'em_dia').length;
    const prox = vendedoresGrupo.filter(v => v.statusPontual === 'atencao').length;
    const pend = vendedoresGrupo.filter(v => v.isPendente).length;

    html += '<div class="sup-group-card" style="border:1px solid var(--line);border-radius:10px;background:var(--panel);overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04)">' +
      '<div class="sup-group-head" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--panel-2);border-bottom:1px solid var(--line);flex-wrap:wrap;gap:10px">' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span class="badge" style="background:' + eqInfo.cor + '22;color:' + eqInfo.cor + ';font-weight:800;font-size:11px;padding:3px 8px;border-radius:4px">' +
      esc(eqInfo.nomeCurto) +
      '</span>' +
      '<span style="font-weight:800;font-size:14px;color:var(--ink)">Supervisor: ' + esc(eqInfo.supervisor) + '</span>' +
      '<div style="display:inline-flex;align-items:center;gap:8px;font-size:11.5px;padding:3px 8px;background:var(--panel);border-radius:6px;border:1px solid var(--line)">' +
      '<span style="color:var(--ink-2);font-weight:600">' + vendedoresGrupo.length + ' ' + (vendedoresGrupo.length === 1 ? 'vendedor' : 'vendedores') + '</span> · ' +
      '<span style="color:var(--ok);font-weight:700">Em dia: ' + emDia + '</span> · ' +
      '<span style="color:var(--warn);font-weight:700">Próx: ' + prox + '</span> · ' +
      '<span style="color:var(--bad);font-weight:700">Pendentes: ' + pend + '</span>' +
      '</div>' +
      '</div>' +
      '<div class="sup-group-actions" style="display:flex;align-items:center;gap:6px">' +
      (pend > 0 && eqKey !== 'outros'
        ? '<button type="button" class="btn btn-ghost" style="height:28px;padding:0 9px;font-size:11.5px;color:var(--ok);border-color:rgba(16,185,129,0.35);background:rgba(16,185,129,0.06);font-weight:700" onclick="copiarCobrancaWhatsAppEquipe(\'' + esc(eqKey) + '\')" title="Copiar lista de pendentes desta equipe para o WhatsApp">' +
        '<svg class="i" style="width:13px;height:13px"><use href="#i-whatsapp"/></svg> <span>Cobrar Equipe</span>' +
        '</button>'
        : ''
      ) +
      '<button type="button" class="btn btn-ghost" style="height:28px;padding:0 9px;font-size:11.5px;font-weight:700" onclick="gerarRelatorioPdfVendedoresSupervisor(\'' + esc(eqKey) + '\', \'' + esc(stFiltro) + '\', false)" title="Baixar relatório em PDF desta equipe">' +
      '<svg class="i" style="width:13px;height:13px"><use href="#i-file-text"/></svg> <span>PDF da Equipe</span>' +
      '</button>' +
      '</div>' +
      '</div>' +

      '<div class="table-wrap" style="overflow-x:auto">' +
      '<table class="grid sup-rel-table" style="width:100%;margin:0;font-size:12.5px">' +
      '<thead>' +
      '<tr>' +
      '<th style="width:230px">Vendedor / Motorista</th>' +
      '<th style="width:90px">Rota</th>' +
      '<th style="width:160px">Veículo & KM</th>' +
      '<th style="width:165px">Situação da Vistoria</th>' +
      '<th style="width:175px">Próxima Vistoria</th>' +
      '<th style="width:150px">Última Vistoria</th>' +
      '<th style="width:125px;text-align:right">Ações</th>' +
      '</tr>' +
      '</thead>' +
      '<tbody>' +
      vendedoresGrupo.map(v => {
        const iniciais = getIniciaisNome(v.nome);
        const cm = v.cicloMensal;
        let pontualBadge = '';

        if (v.statusPontual === 'sem_vistoria') {
          pontualBadge = '<span class="badge-pontual critico" style="background:rgba(239,68,68,0.18);color:#fca5a5;border:1px solid rgba(239,68,68,0.4);font-weight:800"><svg class="i" style="width:11px;height:11px"><use href="#i-alert"/></svg> NUNCA REALIZOU</span>';
        } else if (v.statusPontual === 'critico') {
          pontualBadge = '<span class="badge-pontual critico" style="background:rgba(239,68,68,0.15);color:#fca5a5;font-weight:700"><svg class="i" style="width:11px;height:11px"><use href="#i-alert"/></svg> ' + (cm ? 'Vencida (' + cm.diasDecorridos + 'd)' : 'Vencida') + '</span>';
        } else if (v.statusPontual === 'atencao') {
          pontualBadge = '<span class="badge-pontual atencao" style="background:rgba(245,158,11,0.15);color:#fcd34d;font-weight:700"><svg class="i" style="width:11px;height:11px"><use href="#i-clock"/></svg> ' + (cm ? 'Vence em ' + cm.diasParaVencer + 'd' : 'Próxima') + '</span>';
        } else {
          pontualBadge = '<span class="badge-pontual em-dia" style="background:rgba(16,185,129,0.15);color:#6ee7b7;font-weight:700"><svg class="i" style="width:11px;height:11px"><use href="#i-check"/></svg> ' + (cm ? 'Em dia (' + cm.diasDecorridos + 'd)' : 'Em dia') + '</span>';
        }

        let proximaHtml = '';
        if (v.statusPontual === 'sem_vistoria') {
          proximaHtml = '<span class="txt-bad" style="font-weight:700">Imediata (Sem histórico)</span>';
        } else if (cm) {
          if (cm.status === 'vencida') {
            const atr = Math.abs(cm.diasParaVencer);
            proximaHtml = '<div class="vend-ciclo-box">' +
              '<span class="txt-bad" style="font-weight:700">Vencida em ' + esc(cm.dataProximaFmt) + '</span>' +
              '<span style="font-size:10.5px;color:var(--bad)">Atrasada há ' + atr + (atr === 1 ? ' dia' : ' dias') + '</span>' +
              '</div>';
          } else {
            proximaHtml = '<div class="vend-ciclo-box">' +
              '<span style="font-weight:700;color:var(--ink)">' + esc(cm.dataProximaFmt) + '</span>' +
              '<span style="font-size:10.5px;color:var(--ink-3)">Restam ' + cm.diasParaVencer + (cm.diasParaVencer === 1 ? ' dia' : ' dias') + '</span>' +
              '</div>';
          }
        } else {
          proximaHtml = '<span class="muted">—</span>';
        }

        let ultimaHtml = '';
        if (v.dataUltima) {
          ultimaHtml = '<div>' +
            '<span style="font-weight:700;color:var(--ink)">' + formatarData(v.dataUltima) + '</span>' +
            '<span style="display:block;font-size:11px;color:var(--ink-3)">' + esc(v.horaUltima || '--:--') + ' (' + esc(v.tipoUltimo) + ')</span>' +
            '</div>';
        } else {
          ultimaHtml = '<span style="color:var(--bad);font-weight:600">Nenhum registro</span>';
        }

        let veiculoHtml = '';
        if (v.veiculoAtual !== '—') {
          veiculoHtml = '<div class="stack">' +
            '<button type="button" class="plate" onclick="fecharModalRelatorioSupervisores(); abrirHistoricoVeiculo(\'' + esc(v.veiculoAtual) + '\')" title="Ver histórico">' + esc(v.veiculoAtual) + '</button>' +
            '<span class="t2" style="font-size:11px">' + esc(v.modeloAtual) + (v.kmAtual ? ' · ' + fmtKm(v.kmAtual) : '') + '</span>' +
            '</div>';
        } else {
          veiculoHtml = '<span class="muted">Sem carro atribuído</span>';
        }

        return '<tr style="' + (v.isPendente ? 'background:rgba(239,68,68,0.03)' : '') + '">' +
          '<td data-label="Vendedor">' +
          '<div style="display:flex;align-items:center;gap:10px">' +
          '<div class="vend-avatar" style="' + (v.isPendente ? 'background:rgba(239,68,68,0.15);color:#ef4444;border-color:rgba(239,68,68,0.3)' : '') + '">' + esc(iniciais) + '</div>' +
          '<div>' +
          '<div style="font-weight:700;color:var(--ink);font-size:13px">' + esc(v.nome) + '</div>' +
          '<div style="font-size:11px;color:var(--ink-3)">' + v.totalVistorias + ' ' + (v.totalVistorias === 1 ? 'vistoria realizada' : 'vistorias realizadas') + '</div>' +
          '</div>' +
          '</div>' +
          '</td>' +
          '<td data-label="Rota"><span class="badge-rota" style="font-weight:700">Rota ' + esc(v.rota) + '</span></td>' +
          '<td data-label="Veículo">' + veiculoHtml + '</td>' +
          '<td data-label="Situação">' + pontualBadge + '</td>' +
          '<td data-label="Próxima Vistoria">' + proximaHtml + '</td>' +
          '<td data-label="Última Vistoria">' + ultimaHtml + '</td>' +
          '<td data-label="Ações" style="text-align:right">' +
          '<div style="display:inline-flex;align-items:center;gap:5px">' +
          '<button type="button" class="btn btn-ghost" style="height:27px;padding:0 7px;font-size:11px;color:var(--accent-hi)" onclick="fecharModalRelatorioSupervisores(); abrirModalVendedor(\'' + esc(v.nome) + '\')" title="Ver histórico completo de vistorias deste vendedor">' +
          icon('user') + ' <span>Histórico</span>' +
          '</button>' +
          (v.isPendente
            ? '<button type="button" class="btn btn-ghost" style="height:27px;padding:0 7px;font-size:11px;color:var(--ok);border-color:rgba(16,185,129,0.35);background:rgba(16,185,129,0.06);font-weight:700" onclick="copiarCobrancaWhatsAppVendedor(\'' + esc(v.rota) + '\')" title="Copiar cobrança WhatsApp para este vendedor">' +
            '<svg class="i" style="width:12px;height:12px"><use href="#i-whatsapp"/></svg> <span>Cobrar</span>' +
            '</button>'
            : ''
          ) +
          '</div>' +
          '</td>' +
          '</tr>';
      }).join('') +
      '</tbody>' +
      '</table>' +
      '</div>' +
      '</div>';
  });

  container.innerHTML = html;
}
window.renderModalRelatorioSupervisores = renderModalRelatorioSupervisores;

function gerarRelatorioPdfVendedoresSupervisor(equipeFiltro, statusFiltro, isPrint = false) {
  const eqAlvo = equipeFiltro || ($('relSupFiltroEquipe') ? $('relSupFiltroEquipe').value : 'todos');
  const stAlvo = statusFiltro || ($('relSupFiltroStatus') ? $('relSupFiltroStatus').value : 'todos');
  const qBusca = $('relSupInputBusca') ? normalizarTextoBusca($('relSupInputBusca').value) : '';

  const todos = getVendedoresData();
  const filtrados = todos.filter(v => {
    if (eqAlvo !== 'todos' && v.equipe !== eqAlvo) return false;
    if (stAlvo === 'pendentes' && !v.isPendente) return false;
    if (stAlvo === 'sem_vistoria' && v.statusPontual !== 'sem_vistoria') return false;
    if (stAlvo === 'critico' && v.statusPontual !== 'critico') return false;
    if (stAlvo === 'atencao' && v.statusPontual !== 'atencao') return false;
    if (stAlvo === 'em_dia' && v.statusPontual !== 'em_dia') return false;
    if (qBusca) {
      const hay = normalizarTextoBusca(v.nome + ' ' + v.rota + ' ' + (v.supervisor || '') + ' ' + (v.veiculoAtual || '') + ' ' + (v.modeloAtual || ''));
      if (!hay.includes(qBusca)) return false;
    }
    return true;
  });

  if (!filtrados.length) {
    toast('Nenhum vendedor encontrado para emitir o relatório.', 'error');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    const M = 10;
    const W = 190;
    const ROXO = [48, 42, 110];
    const CINZA = [95, 95, 110];
    const LINHA = [195, 195, 208];

    const fonte = (tam, estilo = 'normal', cor = [20, 20, 30]) => {
      doc.setFont('helvetica', estilo);
      doc.setFontSize(tam);
      doc.setTextColor(...cor);
    };

    const corta = (txt, maxW) => {
      const l = doc.splitTextToSize(String(txt || ''), maxW);
      return l[0] || '';
    };

    let y = M;

    doc.setFillColor(...ROXO);
    doc.roundedRect(M, y, 28, 13, 2, 2, 'F');
    fonte(9, 'bold', [255, 255, 255]);
    doc.text('GOMEX', M + 14, y + 5.8, { align: 'center' });
    fonte(6, 'bold', [196, 210, 255]);
    doc.text('FROTA', M + 14, y + 9.8, { align: 'center' });

    fonte(11.5, 'bold', ROXO);
    doc.text('RELATÓRIO DE VISTORIAS POR SUPERVISOR & VENDEDORES', M + 32, y + 5.2);
    fonte(7, 'normal', CINZA);
    doc.text('Controle de conformidade de check-lists, prazos de vistoria mensal e pendências · Gomex Distribuidora', M + 32, y + 9.5);

    const descEq = eqAlvo === 'todos' ? 'Todas as Equipes (35 Vendedores)' : (EQUIPES_INFO[eqAlvo] ? EQUIPES_INFO[eqAlvo].nome : 'Equipe ' + eqAlvo);
    const dataHoraEmissao = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.text('Filtro: ' + descEq + ' · Emitido em: ' + dataHoraEmissao, M + 32, y + 12.8);

    y += 16;

    const totGeral = filtrados.length;
    const emDiaGeral = filtrados.filter(v => v.statusPontual === 'em_dia').length;
    const proxGeral = filtrados.filter(v => v.statusPontual === 'atencao').length;
    const pendGeral = filtrados.filter(v => v.isPendente).length;

    const kpiW = W / 4;
    const kpis = [
      ['TOTAL DE VENDEDORES', String(totGeral), [20, 20, 30]],
      ['VISTORIAS EM DIA', String(emDiaGeral), [21, 128, 61]],
      ['PRÓXIMAS DE VENCER', String(proxGeral), [180, 83, 9]],
      ['PENDENTES / SEM VISTORIA', String(pendGeral), [220, 38, 38]]
    ];

    kpis.forEach(([lbl, val, cor], idx) => {
      const kx = M + idx * kpiW;
      doc.setFillColor(245, 246, 252);
      doc.rect(kx, y, kpiW, 11, 'F');
      doc.setDrawColor(...LINHA);
      doc.rect(kx, y, kpiW, 11);
      fonte(5.8, 'bold', CINZA);
      doc.text(lbl, kx + 2.5, y + 3.8);
      fonte(9.5, 'bold', cor);
      doc.text(val, kx + 2.5, y + 8.8);
    });

    y += 14;

    const equipesOrdem = ['101', '102', '103'];
    const grupos = [];

    equipesOrdem.forEach(eqId => {
      const list = filtrados.filter(v => v.equipe === eqId);
      if (list.length > 0) {
        grupos.push({ info: EQUIPES_INFO[eqId], lista: list });
      }
    });

    const outros = filtrados.filter(v => !equipesOrdem.includes(v.equipe));
    if (outros.length > 0) {
      grupos.push({
        info: {
          codigo: 'EXT',
          nome: 'Outros Vendedores / Avulsos',
          nomeCurto: 'Avulsos',
          supervisor: 'Sem equipe fixa'
        },
        lista: outros
      });
    }

    const desenharHeaderTabela = (posY) => {
      doc.setFillColor(240, 242, 248);
      doc.rect(M, posY, W, 5, 'F');
      doc.setDrawColor(...LINHA);
      doc.rect(M, posY, W, 5);
      fonte(6, 'bold', CINZA);
      doc.text('ROTA', M + 2, posY + 3.5);
      doc.text('VENDEDOR / MOTORISTA', M + 18, posY + 3.5);
      doc.text('VEÍCULO / PLACA', M + 68, posY + 3.5);
      doc.text('SITUAÇÃO DA VISTORIA', M + 104, posY + 3.5);
      doc.text('PRÓXIMA VISTORIA', M + 140, posY + 3.5);
      doc.text('ÚLTIMA VISTORIA', M + W - 2, posY + 3.5, { align: 'right' });
      return posY + 5;
    };

    grupos.forEach(g => {
      if (y > 255) {
        doc.addPage();
        y = M;
      }

      const pends = g.lista.filter(v => v.isPendente).length;
      const emD = g.lista.filter(v => v.statusPontual === 'em_dia').length;

      doc.setFillColor(...ROXO);
      doc.rect(M, y, W, 5.5, 'F');
      fonte(7.2, 'bold', [255, 255, 255]);
      doc.text('EQUIPE ' + g.info.codigo + ' · SUPERVISOR: ' + g.info.supervisor.toUpperCase() + ' (' + g.lista.length + ' VENDEDORES)', M + 2.5, y + 3.8);
      fonte(6.5, 'bold', [220, 225, 245]);
      doc.text('Em dia: ' + emD + ' | Pendentes: ' + pends, M + W - 2.5, y + 3.8, { align: 'right' });
      y += 5.5;

      y = desenharHeaderTabela(y);

      g.lista.forEach((v, idx) => {
        if (y > 270) {
          doc.addPage();
          y = M;
          y = desenharHeaderTabela(y);
        }

        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 253);
          doc.rect(M, y, W, 5.2, 'F');
        }
        doc.setDrawColor(...LINHA);
        doc.rect(M, y, W, 5.2);

        fonte(6.5, 'bold', ROXO);
        doc.text('Rota ' + v.rota, M + 2, y + 3.6);

        fonte(6.8, 'bold', [20, 20, 30]);
        doc.text(corta(v.nome, 46), M + 18, y + 3.6);

        fonte(6.3, 'normal', CINZA);
        const veicTxt = v.veiculoAtual !== '—' ? v.veiculoAtual + (v.kmAtual ? ' (' + fmtKm(v.kmAtual) + ')' : '') : 'Sem carro';
        doc.text(corta(veicTxt, 34), M + 68, y + 3.6);

        let sitTxt = 'Em dia';
        let sitCor = [21, 128, 61];
        if (v.statusPontual === 'sem_vistoria') {
          sitTxt = 'NUNCA REALIZOU';
          sitCor = [220, 38, 38];
        } else if (v.statusPontual === 'critico') {
          sitTxt = 'Vencida (' + v.diasSemVistoria + 'd)';
          sitCor = [220, 38, 38];
        } else if (v.statusPontual === 'atencao') {
          sitTxt = 'Vence em ' + (v.cicloMensal ? v.cicloMensal.diasParaVencer : 7) + 'd';
          sitCor = [180, 83, 9];
        }
        fonte(6.5, 'bold', sitCor);
        doc.text(sitTxt, M + 104, y + 3.6);

        fonte(6.3, 'normal', [20, 20, 30]);
        let proxTxt = '—';
        if (v.statusPontual === 'sem_vistoria') {
          proxTxt = 'Imediata';
        } else if (v.cicloMensal) {
          proxTxt = v.cicloMensal.dataProximaFmt;
        }
        doc.text(proxTxt, M + 140, y + 3.6);

        fonte(6.3, 'normal', CINZA);
        const ultTxt = v.dataUltima ? formatarData(v.dataUltima) : 'Nenhuma';
        doc.text(ultTxt, M + W - 2, y + 3.6, { align: 'right' });

        y += 5.2;
      });

      y += 4;
    });

    const nomeArq = 'Relatorio_Vistorias_Supervisores_' + (eqAlvo || 'Geral') + '_' + isoLocal(new Date()) + '.pdf';
    if (isPrint) {
      doc.autoPrint();
      const url = URL.createObjectURL(doc.output('blob'));
      window.open(url, '_blank');
      toast('Abrindo relatório para impressão...');
    } else {
      doc.save(nomeArq);
      toast('Relatório PDF por Supervisor gerado com sucesso!');
    }
  } catch (err) {
    console.error('Erro ao gerar PDF de supervisores:', err);
    toast('Erro ao gerar PDF: ' + err.message, 'error');
  }
}
window.gerarRelatorioPdfVendedoresSupervisor = gerarRelatorioPdfVendedoresSupervisor;



      function encaminharRevisaoParaManutencao() {
        if (!state.sel) return;
        switchDrTab('manut');
        setMaintStatus('Em manutenção');
        const kmAtual = Number(state.sel.km) || 0;
        const kmRev = Number(state.sel.rev_prox_km) || 0;
        const diff = kmRev - kmAtual;

        if ($('maintTipo')) {
          $('maintTipo').value = 'Revisão Preventiva (' + fmtKm(kmRev) + ')';
        }
        const obsField = $('maintObsTexto') || $('maintObs');
        if (obsField && !obsField.value) {
          obsField.value = diff <= 0
            ? 'Veículo com revisão vencida há ' + Math.abs(diff).toLocaleString('pt-BR') + ' km (KM atual: ' + fmtKm(kmAtual) + ' / Meta: ' + fmtKm(kmRev) + '). Necessário agendamento urgente de revisão preventiva.'
            : 'Veículo próximo da revisão preventiva (KM atual: ' + fmtKm(kmAtual) + ' / Meta: ' + fmtKm(kmRev) + ' - faltam ' + diff.toLocaleString('pt-BR') + ' km). Realizar revisão periódica.';
        }
        if ($('maintOficina')) $('maintOficina').focus();
      }
      window.encaminharRevisaoParaManutencao = encaminharRevisaoParaManutencao;

      function fillDrawer(it) {
        $('drTitle').textContent = 'Vistoria Nº ' + (it.numero || '—');
        $('drPlate').textContent = (it.placa || '').toUpperCase();
        $('drPlate').onclick = () => abrirHistoricoVeiculo(it.placa);

        const isInat = it.status === 'inativo';
        $('drStatus').innerHTML = statusTag(it.liberacao, it.status);

        // Diagnóstico de Alertas Operacionais da Vistoria
        const kmAtual = Number(it.km) || 0;
        const kmRev = Number(it.rev_prox_km) || 0;
        const diffRev = (kmRev > 0 && kmAtual > 0) ? (kmRev - kmAtual) : null;
        const isRevOverdue = diffRev !== null && diffRev <= 0;
        const isRevClose = diffRev !== null && diffRev > 0 && diffRev <= 1000;
        const isRevAlert = isRevOverdue || isRevClose;
        const isPnAlert = it.pneu_dano === 'Sim';
        const isBlkAlert = it.liberacao === 'Não liberado';
        const nok = nokOf(it);

        const elAlerts = $('drOperationalAlerts');
        if (elAlerts) {
          let cardsHtml = '';

          if (isRevAlert) {
            const color = isRevOverdue ? 'red' : 'yellow';
            const title = isRevOverdue
              ? 'Revisão Preventiva Vencida (' + Math.abs(diffRev).toLocaleString('pt-BR') + ' km atrás)'
              : 'Revisão Preventiva Próxima (Faltam ' + diffRev.toLocaleString('pt-BR') + ' km)';
            const desc = isRevOverdue
              ? 'A quilometragem deste veículo (<strong>' + fmtKm(kmAtual) + '</strong>) já ultrapassou a marca programada de <strong>' + fmtKm(kmRev) + '</strong> por <strong>' + Math.abs(diffRev).toLocaleString('pt-BR') + ' km</strong>. Encaminhe o veículo para a oficina imediatamente para troca de óleo, filtros e revisão geral.'
              : 'Este veículo está a apenas <strong>' + diffRev.toLocaleString('pt-BR') + ' km</strong> da revisão preventiva programada (KM Atual: <strong>' + fmtKm(kmAtual) + '</strong> · Meta da Revisão: <strong>' + fmtKm(kmRev) + '</strong>' + (it.rev_prox_data ? ' · Prevista para: <strong>' + formatarData(it.rev_prox_data) + '</strong>' : '') + '). Recomenda-se o agendamento prévio com a oficina para evitar paradas na entrega.';

            cardsHtml += '<div class="dr-alert-card ' + color + '">' +
              '<div class="dr-alert-icon">' + icon('tool') + '</div>' +
              '<div style="flex:1">' +
              '<div class="dr-alert-title">' + title + '</div>' +
              '<div class="dr-alert-desc">' + desc + '</div>' +
              '<button type="button" class="dr-alert-action-btn' + (isRevOverdue ? ' red' : '') + '" onclick="encaminharRevisaoParaManutencao()">' +
              icon('tool') + ' Abrir Ordem / Observação de Manutenção' +
              '</button>' +
              '</div>' +
              '</div>';
          }

          if (isPnAlert) {
            cardsHtml += '<div class="dr-alert-card red">' +
              '<div class="dr-alert-icon">' + icon('alert') + '</div>' +
              '<div style="flex:1">' +
              '<div class="dr-alert-title">Pneu com Dano Registrado na Vistoria</div>' +
              '<div class="dr-alert-desc">O motorista ou vistoriador apontou dano nos pneus durante esta vistoria. Verifique o estado dos pneus abaixo imediatamente.</div>' +
              '</div>' +
              '</div>';
          }

          if (isBlkAlert) {
            cardsHtml += '<div class="dr-alert-card red">' +
              '<div class="dr-alert-icon">' + icon('ban') + '</div>' +
              '<div style="flex:1">' +
              '<div class="dr-alert-title">Veículo Bloqueado para Operação</div>' +
              '<div class="dr-alert-desc">Este veículo não está autorizado para circulação até que as pendências sejam sanadas pela gestão ou manutenção.</div>' +
              '</div>' +
              '</div>';
          }

          if (nok.length > 0) {
            cardsHtml += '<div class="dr-alert-card red">' +
              '<div class="dr-alert-icon">' + icon('alert') + '</div>' +
              '<div style="flex:1">' +
              '<div class="dr-alert-title">' + nok.length + ' Item(ns) Reprovado(s) no Check-list</div>' +
              '<div class="dr-alert-desc">' + nok.map(i => (i.grupo ? '<strong>' + esc(i.grupo) + ':</strong> ' : '') + esc(i.nome)).join('; ') + '</div>' +
              '</div>' +
              '</div>';
          }

          elAlerts.innerHTML = cardsHtml;
          elAlerts.hidden = !cardsHtml;
        }

        const inatBanner = $('drInatBanner');
        if (inatBanner) {
          inatBanner.hidden = !isInat;
          if (isInat) {
            $('drInatMotivo').textContent = 'Motivo: ' + extrairMotivoInativacao(it);
          }
        }

        const btnInatLabel = $('drBtnInativarLabel');
        if (btnInatLabel) {
          btnInatLabel.textContent = isInat ? 'Reativar Vistoria' : 'Inativar Vistoria';
          $('drBtnInativar').style.color = isInat ? 'var(--ok)' : 'var(--bad)';
          $('drBtnInativar').style.borderColor = isInat ? 'rgba(61,220,151,0.35)' : 'rgba(250,138,138,0.35)';
          $('drBtnInativar').onclick = () => isInat ? reativarVistoria(it) : abrirModalInativar(it);
        }

        const partes = extrairPartesObservacao(it.obs);
        selecionarDecisao(it.liberacao);
        $('drParecerInput').value = partes.textoLivre || '';

        const kv = [
          ['Veículo', esc(it.veiculo || '—') + (it.veiculo_outro ? ' (' + esc(it.veiculo_outro) + ')' : '')],
          ['Motorista', esc(it.motorista || '—')],
          ['Rota / Região', (it.rota ? '<strong style="color:var(--accent-hi)">' + esc(it.rota) + '</strong>' : '<span style="color:var(--ink-3)">Não informada</span>') + ' <button type="button" class="btn btn-ghost" style="height:22px;padding:0 6px;font-size:11px;margin-left:6px;border-color:rgba(237,133,112,0.38);color:var(--accent-hi)" onclick="abrirModalEditarVistoria(' + it.id + ')">Editar</button>'],
          ['Data e hora', formatarData(it.data) + ' às ' + esc(it.hora || '--:--')],
          ['Quilometragem', fmtKm(it.km)],
          ['Tipo de vistoria', esc(it.tipo || '—')],
          ['Combustível', esc(it.combustivel || '—')],
          ['Condição do motorista', esc(it.condicao_motorista || '—')],
          ['Última revisão', esc(revText(it.rev_ult_km, it.rev_ult_data))],
          ['Próxima revisão', esc(revText(it.rev_prox_km, it.rev_prox_data)) + (
            isRevAlert
              ? ' <span class="badge-rev-diff ' + (isRevOverdue ? 'red' : 'yellow') + '">' +
              (isRevOverdue ? 'Vencida há ' + Math.abs(diffRev).toLocaleString('pt-BR') + ' km' : 'Faltam ' + diffRev.toLocaleString('pt-BR') + ' km') +
              '</span>'
              : ''
          )]
        ];
        $('drKv').innerHTML = kv.map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>').join('');

        const marks = avariasOf(it);
        $('drAvCount').textContent = it.sem_avarias ? 'Sem avarias novas' : (marks.length ? marks.length + ' ' + (marks.length === 1 ? 'marca' : 'marcas') : 'Nenhuma marca');
        $('modalVanMarksLayer').innerHTML = marks.map(([x, y, k]) =>
          '<g class="mk">' +
          '<circle cx="' + Number(x) + '" cy="' + Number(y) + '" r="6.8" fill="#dc2626" stroke="#ffffff" stroke-width="1.8"/>' +
          '<text x="' + Number(x) + '" y="' + Number(y) + '" fill="#ffffff" font-size="8.8" font-family="Arial, Helvetica, sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="central">' + esc(k) + '</text>' +
          '</g>'
        ).join('');

        const tires = pneusOf(it);
        const tireColor = s => s === 'Gasto' ? 'var(--bad)' : s === 'Meia vida' ? 'var(--warn)' : 'var(--ok)';
        $('drTires').innerHTML = tires.length ? tires.map(p =>
          '<tr>' +
          '<td>' + esc(p.pos) + '</td>' +
          '<td style="color:' + tireColor(p.estado) + ';font-weight:600">' + esc(p.estado || '—') + '</td>' +
          '<td>' + (p.psi ? esc(p.psi) : '—') + '</td>' +
          '<td class="muted">' + esc(p.obs || '—') + '</td>' +
          '</tr>'
        ).join('') : '<tr><td colspan="4" class="muted">Sem registro de pneus nesta vistoria.</td></tr>';

        $('drNokCount').textContent = itensOf(it).length ? nok.length + ' de ' + itensOf(it).length + ' itens' : '';
        $('drNok').innerHTML = !itensOf(it).length
          ? '<p class="muted">Esta vistoria não trouxe itens de verificação.</p>'
          : nok.length
            ? '<ul class="nok">' + nok.map(i => '<li>' + icon('alert') + '<span><span class="grp">' + esc(i.grupo || '') + '</span>' + esc(i.nome || '') + '</span></li>').join('') + '</ul>'
            : '<p class="all-ok">' + icon('check') + 'Nenhum item reprovado.</p>';

        const obsLinhas = formatarObservacoesParaPdf(it.obs, it);
        const temObsValida = Boolean(partes.textoLivre || partes.manutencao || partes.auditoria.length);
        $('drNotesSec').hidden = !temObsValida;
        $('drNotes').innerHTML = obsLinhas.map(l => '<div style="margin-bottom:4px;line-height:1.45">' + esc(l) + '</div>').join('');

        // Carregar dados de manutenção do veículo
        carregarDadosManutencaoNoDrawer(it);
      }

      async function openDrawer(id, trigger, initialTab = 'vistoria') {
        const it = state.all.find(c => String(c.id) === String(id));
        if (!it) return;
        state.sel = it;
        lastFocus = trigger || document.activeElement;
        fillDrawer(it);
        switchDrTab(initialTab);
        renderSigs(state.sigCache[it.id] ?? null);
        $('drBody').scrollTop = 0;

        $('scrim').classList.add('open');
        $('drawer').classList.add('open');
        $('drawer').setAttribute('aria-hidden', 'false');
        document.body.classList.add('lock');
        $('app').inert = true;
        $('drClose').focus();

        if (!state.sigCache[it.id]) {
          const rows = await fetchSigs(it.id);
          const row = rows && rows[0] ? rows[0] : {};
          state.sigCache[it.id] = row;
          if (state.sel && state.sel.id === it.id) renderSigs(row);
        }
      }
      window.openDrawer = openDrawer;

      function closeDrawer() {
        if (!$('drawer').classList.contains('open')) return;
        $('scrim').classList.remove('open');
        $('drawer').classList.remove('open');
        $('drawer').setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lock');
        $('app').inert = false;
        state.sel = null;
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
      }

      $('drClose').addEventListener('click', closeDrawer);
      $('drCloseFoot').addEventListener('click', closeDrawer);
      $('scrim').addEventListener('click', closeDrawer);
      $('drPdf').addEventListener('click', e => { if (state.sel) baixarPdfOficial(state.sel.id, e.currentTarget, false); });
      $('drPrint').addEventListener('click', e => { if (state.sel) baixarPdfOficial(state.sel.id, e.currentTarget, true); });

      // Listener de delegação para tabela geral de manutenção (clique em qualquer elemento do botão/placa)
      if ($('maintTableBody')) {
        $('maintTableBody').addEventListener('click', e => {
          const btn = e.target.closest('[data-act="open-maint"]') || e.target.closest('button.plate') || e.target.closest('button');
          if (btn) {
            const id = btn.dataset.id;
            if (id) {
              openDrawer(id, btn, 'manut');
            }
          }
        });
      }

      // Listeners diretos para botões de manutenção na gaveta lateral
      const bMaintNenhuma = $('btnMaintStatusNenhuma');
      const bMaintEm = $('btnMaintStatusEm');
      const bMaintJa = $('btnMaintStatusJa');
      const bSalvarMaint = $('btnSalvarManutencao');

      if (bMaintNenhuma) bMaintNenhuma.addEventListener('click', () => setMaintStatus('Nenhuma'));
      if (bMaintEm) bMaintEm.addEventListener('click', () => setMaintStatus('Em manutenção'));
      if (bMaintJa) bMaintJa.addEventListener('click', () => setMaintStatus('Já foi para manutenção'));
      if (bSalvarMaint) bSalvarMaint.addEventListener('click', salvarObservacoesManutencao);

      // ==============================================================================