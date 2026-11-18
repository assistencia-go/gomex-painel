// GESTÃO DE PERMISSÕES, USUÁRIOS & MONITOR SUPABASE (ADMINISTRADOR GOMEX)
// ==============================================================================
const DEFAULT_USERS_LIST = [
  { key: 'gomex', name: 'Administrador Gomex', role: 'Administrador Principal', equipe: '', isRootAdmin: true },
  { key: 'maycon', name: 'Maycon', role: 'Gerente Operacional', equipe: '' },
  { key: 'hendreo', name: 'Hendreo', role: 'Supervisor de Frota', equipe: '' },
  { key: 'ricardo', name: 'Ricardo', role: 'Supervisor de Frota', equipe: '' },
  { key: 'alisson 101', name: 'Alisson 101', role: 'Supervisor Rota 101', equipe: '101' },
  { key: 'eliase', name: 'Eliase', role: 'Supervisor Rota 102', equipe: '102' },
  { key: 'alisson 103', name: 'Alisson 103', role: 'Supervisor Rota 103', equipe: '103' }
];

const MODULOS_SISTEMA = [
  { key: 'vistorias', nome: 'Vistorias (Checklist)', icon: 'badge-check', desc: 'Realização e histórico das vistorias dos veículos' },
  { key: 'manutencao', nome: 'Manutenção & Oficina', icon: 'tool', desc: 'Controle de OS, serviços em oficina e histórico' },
  { key: 'ocorrencias', nome: 'Ocorrências & Pausas', icon: 'alert', desc: 'Monitoramento em tempo real de pausas e atrasos' },
  { key: 'gastos', nome: 'Custos, Peças & Insumos', icon: 'wallet', desc: 'Lançamento financeiro, peças e abastecimentos' },
  { key: 'galeria', nome: 'Galeria de Fotos', icon: 'camera', desc: 'Fotos dos veículos e avarias registradas' },
  { key: 'vendedores', nome: 'Vendedores & Custódia', icon: 'user', desc: 'Vínculo de vendedores, rotas e veículos' },
  { key: 'frotacad', nome: 'Frota & Veículos', icon: 'truck', desc: 'Cadastro fixo da frota e dados dos carros' }
];

const ACOES_EDICAO_SISTEMA = [
  { key: 'editar_vistorias', nome: 'Editar Vistorias & Checklists', icon: 'edit', desc: 'Alterar vistorias, laudo técnico e inativar check-lists' },
  { key: 'editar_ocorrencias', nome: 'Criar / Editar Ocorrências', icon: 'alert', desc: 'Abrir novas pausas, editar e finalizar ocorrências' },
  { key: 'editar_manutencao', nome: 'Editar Manutenções', icon: 'tool', desc: 'Salvar observações e alterar status da oficina' },
  { key: 'editar_gastos', nome: 'Lançar / Excluir Custos', icon: 'wallet', desc: 'Lançar despesas, registrar notas e compras de peças' },
  { key: 'editar_frotacad', nome: 'Cadastrar / Editar Frota', icon: 'truck', desc: 'Cadastrar carros novos e alterar dados da frota' },
  { key: 'editar_galeria', nome: 'Subir / Excluir Fotos (Galeria)', icon: 'camera', desc: 'Enviar novas fotos manuais e excluir fotos da galeria' },
  { key: 'exportar_relatorios', nome: 'Exportar PDF / CSV & Cobranças', icon: 'download', desc: 'Baixar PDFs, exportar Excel (CSV) e copiar resumos' },
  { key: 'admin', nome: 'Administrador (Acessos & Storage)', icon: 'shield', desc: 'Acesso total à tela Permissões & Acessos e usuários' }
];
window.DEFAULT_USERS_LIST = DEFAULT_USERS_LIST;
window.MODULOS_SISTEMA = MODULOS_SISTEMA;
window.ACOES_EDICAO_SISTEMA = ACOES_EDICAO_SISTEMA;

function normalizarUsuario(u) {
  if (!u) return '';
  const norm = String(u).toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  if (norm === 'elias') return 'eliase';
  if (norm === 'alisson101') return 'alisson 101';
  if (norm === 'alisson103') return 'alisson 103';
  return norm;
}
window.normalizarUsuario = normalizarUsuario;

function isGomexAdmin(user) {
  const u = normalizarUsuario(user || state.currentUser);
  if (u === 'gomex') return true;
  const uPerms = state.permissoes && state.permissoes[u];
  return Boolean(uPerms && uPerms.ativo !== false && uPerms.admin === true);
}
window.isGomexAdmin = isGomexAdmin;

function podeEditar(tipo, user) {
  const uNorm = normalizarUsuario(user || state.currentUser);
  if (uNorm === 'gomex' || isGomexAdmin(uNorm)) return true;

  const uPerms = state.permissoes && state.permissoes[uNorm];
  if (!uPerms || uPerms.ativo === false) return false;

  if (tipo === 'admin') return Boolean(uPerms.admin === true);
  if (tipo === 'exportar_relatorios' || tipo === 'exportar') {
    return typeof uPerms.exportar_relatorios === 'boolean' ? uPerms.exportar_relatorios : true;
  }

  const chaveEdicao = tipo.startsWith('editar_') ? tipo : ('editar_' + tipo);
  if (typeof uPerms[chaveEdicao] === 'boolean') {
    return uPerms[chaveEdicao];
  }

  if (uNorm === 'maycon') return true;
  return false;
}
window.podeEditar = podeEditar;

function podeExportar(user) {
  return podeEditar('exportar_relatorios', user);
}
window.podeExportar = podeExportar;

function criarObjetoPermissoesPadrao(isEditor = false, isAdminFlag = false) {
  return {
    vistorias: true,
    manutencao: true,
    ocorrencias: true,
    gastos: true,
    galeria: true,
    vendedores: true,
    frotacad: true,
    admin: Boolean(isAdminFlag),
    ativo: true,
    editar_vistorias: Boolean(isEditor || isAdminFlag),
    editar_ocorrencias: Boolean(isEditor || isAdminFlag),
    editar_manutencao: Boolean(isEditor || isAdminFlag),
    editar_gastos: Boolean(isEditor || isAdminFlag),
    editar_frotacad: Boolean(isEditor || isAdminFlag),
    editar_galeria: Boolean(isEditor || isAdminFlag),
    exportar_relatorios: true
  };
}
window.criarObjetoPermissoesPadrao = criarObjetoPermissoesPadrao;

function carregarPermissoesIniciais() {
  let perms = {};
  try {
    const raw = localStorage.getItem('gomex_permissoes_v1');
    if (raw) perms = JSON.parse(raw) || {};
  } catch (e) { }

  // Garante estrutura para todos os usuários padrão e customizados
  const listaBase = [...DEFAULT_USERS_LIST];
  if (Array.isArray(perms.usuariosCustom)) {
    perms.usuariosCustom.forEach(cu => {
      if (cu && cu.key && !listaBase.some(x => x.key === cu.key)) listaBase.push(cu);
    });
  }

  listaBase.forEach(u => {
    const isMaycon = u.key === 'maycon';
    const isRoot = u.key === 'gomex';
    if (!perms[u.key] || typeof perms[u.key] !== 'object') {
      perms[u.key] = criarObjetoPermissoesPadrao(isMaycon || isRoot, isRoot);
    } else {
      const p = perms[u.key];
      if (typeof p.ativo !== 'boolean') p.ativo = true;
      if (typeof p.admin !== 'boolean') p.admin = isRoot;
      if (typeof p.editar_vistorias !== 'boolean') p.editar_vistorias = isMaycon || isRoot;
      if (typeof p.editar_ocorrencias !== 'boolean') p.editar_ocorrencias = isMaycon || isRoot;
      if (typeof p.editar_manutencao !== 'boolean') p.editar_manutencao = isMaycon || isRoot;
      if (typeof p.editar_gastos !== 'boolean') p.editar_gastos = isMaycon || isRoot;
      if (typeof p.editar_frotacad !== 'boolean') p.editar_frotacad = isMaycon || isRoot;
      if (typeof p.editar_galeria !== 'boolean') p.editar_galeria = isMaycon || isRoot;
      if (typeof p.exportar_relatorios !== 'boolean') p.exportar_relatorios = true;
    }
  });

  // Administrador raiz (@gomex) sempre tem acesso total protegido
  perms['gomex'] = criarObjetoPermissoesPadrao(true, true);
  if (!perms.supabasePlan) perms.supabasePlan = 'free';

  state.permissoes = perms;
}
window.carregarPermissoesIniciais = carregarPermissoesIniciais;
carregarPermissoesIniciais();

function temPermissaoVisao(user, visao) {
  if (!visao) return false;
  if (visao === 'agendamentos') visao = 'ocorrencias';
  const uNorm = normalizarUsuario(user || state.currentUser);
  if (uNorm === 'gomex' || isGomexAdmin(uNorm)) return true;
  if (visao === 'admin') return false;

  const uPerms = state.permissoes && state.permissoes[uNorm];
  if (uPerms && uPerms.ativo === false) return false;
  if (uPerms && typeof uPerms[visao] === 'boolean') {
    return uPerms[visao];
  }
  return true;
}
window.temPermissaoVisao = temPermissaoVisao;

function obterPrimeiraVisaoPermitida(user) {
  const uNorm = normalizarUsuario(user || state.currentUser);
  if (uNorm === 'gomex' || isGomexAdmin(uNorm)) return 'vistorias';
  const ordem = ['ocorrencias', 'vistorias', 'manutencao', 'gastos', 'galeria', 'vendedores', 'frotacad'];
  for (const v of ordem) {
    if (temPermissaoVisao(uNorm, v)) return v;
  }
  return 'ocorrencias';
}
window.obterPrimeiraVisaoPermitida = obterPrimeiraVisaoPermitida;

function aplicarPermissoesUi() {
  const user = normalizarUsuario(state.currentUser);
  const isAdmin = isGomexAdmin(user);

  // 1. Botão do Admin
  const btnAdmin = $('btnViewAdmin');
  if (btnAdmin) {
    btnAdmin.style.display = isAdmin ? 'flex' : 'none';
  }

  // 2. Mapeamento dos botões de navegação
  const navMap = {
    'vistorias': $('btnViewVistorias'),
    'manutencao': $('btnViewManut'),
    'ocorrencias': $('btnViewOcorrencias'),
    'gastos': $('btnViewGastos'),
    'galeria': $('btnViewGaleria'),
    'vendedores': $('btnViewVendedores'),
    'frotacad': $('btnViewFrotaCad')
  };

  for (const [mod, btn] of Object.entries(navMap)) {
    if (!btn) continue;
    const liberado = isAdmin || temPermissaoVisao(user, mod);
    if (liberado) {
      btn.style.display = '';
      btn.removeAttribute('disabled');
    } else {
      btn.style.display = 'none';
      btn.setAttribute('disabled', 'true');
    }
  }

  // 3. Se a tela atual estiver bloqueada, redireciona
  if (!isAdmin && !temPermissaoVisao(user, state.visaoAtual)) {
    const fallback = obterPrimeiraVisaoPermitida(user);
    if (fallback) alternarVisaoPrincipal(fallback, false);
  }

  // 4. Bloqueio de botões de edição/exportação conforme permissões do usuário
  const podeEditarVist = isAdmin || podeEditar('vistorias', user);
  const podeEditarOcr = isAdmin || podeEditar('ocorrencias', user);
  const podeEditarManut = isAdmin || podeEditar('manutencao', user);
  const podeEditarGastos = isAdmin || podeEditar('gastos', user);
  const podeEditarFrota = isAdmin || podeEditar('frotacad', user);
  const podeEditarGal = isAdmin || podeEditar('galeria', user);
  const podeExp = isAdmin || podeExportar(user);

  // Vistorias
  const tabEditar = $('drTabBtnEditar');
  if (tabEditar) tabEditar.style.display = podeEditarVist ? '' : 'none';
  const btnInativar = $('drBtnInativar');
  if (btnInativar) btnInativar.style.display = podeEditarVist ? '' : 'none';
  const btnSalvarParecer = $('btnSalvarParecer');
  if (btnSalvarParecer) {
    btnSalvarParecer.style.display = podeEditarVist ? '' : 'none';
    btnSalvarParecer.disabled = !podeEditarVist;
  }

  // Ocorrências
  const btnTopNovaOcr = $('btnTopNovaOcorrencia');
  if (btnTopNovaOcr) btnTopNovaOcr.style.display = podeEditarOcr ? '' : 'none';

  // Manutenção
  const btnSalvarObsManut = $('btnSalvarObsManut');
  if (btnSalvarObsManut) {
    btnSalvarObsManut.style.display = podeEditarManut ? '' : 'none';
    btnSalvarObsManut.disabled = !podeEditarManut;
  }

  // Gastos
  const btnTopLancarGasto = $('btnTopLancarGasto');
  if (btnTopLancarGasto) btnTopLancarGasto.style.display = podeEditarGastos ? '' : 'none';
  const btnViewGastosLancar = $('btnViewGastosLancar');
  if (btnViewGastosLancar) btnViewGastosLancar.style.display = podeEditarGastos ? '' : 'none';

  // Frota
  const btnTopCadVeic = $('btnTopCadastrarVeiculo');
  if (btnTopCadVeic) btnTopCadVeic.style.display = podeEditarFrota ? '' : 'none';

  // Galeria e Aba de Fotos da Vistoria
  ['btnAdicionarFotosGaleria', 'btnAdicionarFotosPasta'].forEach((galBtnId) => {
    const galBtn = $(galBtnId);
    if (galBtn) galBtn.style.display = podeEditarGal ? '' : 'none';
  });
  const uploadFotosDrawer = $('drFotosUploadCard');
  if (uploadFotosDrawer) {
    uploadFotosDrawer.style.display = (podeEditarGal || podeEditarVist) ? '' : 'none';
  }
  if (state.sel && typeof window.renderDrawerFotos === 'function') {
    window.renderDrawerFotos(state.sel);
  }

  // Exportação global
  const btnExp = $('btnExport');
  if (btnExp) btnExp.style.display = podeExp ? '' : 'none';
}
window.aplicarPermissoesUi = aplicarPermissoesUi;

function mostrarToastBloqueioEdicao(modulo = 'informações') {
  const toastEl = document.createElement('div');
  toastEl.className = 'toast-perm-alert blocked';
  toastEl.innerHTML = icon('alert') + `<span><strong>Edição Bloqueada:</strong> Seu perfil possui permissão apenas de visualização para <em>${esc(modulo)}</em>. Edições são restritas à administração.</span>`;
  document.body.appendChild(toastEl);
  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transition = 'opacity 300ms ease';
    setTimeout(() => toastEl.remove(), 350);
  }, 4000);
}
window.mostrarToastBloqueioEdicao = mostrarToastBloqueioEdicao;

function mostrarNotificacaoAcessoBloqueado(visao) {
  const mod = MODULOS_SISTEMA.find(m => m.key === visao);
  const nomeMod = mod ? mod.nome : (visao === 'admin' ? 'Painel de Administração' : visao);
  const toastEl = document.createElement('div');
  toastEl.className = 'toast-perm-alert blocked';
  toastEl.innerHTML = icon('alert') + `<span><strong>Acesso Bloqueado:</strong> Seu usuário não possui permissão para acessar <em>${nomeMod}</em>.</span>`;
  document.body.appendChild(toastEl);
  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transition = 'opacity 300ms ease';
    setTimeout(() => toastEl.remove(), 350);
  }, 4000);
}
window.mostrarNotificacaoAcessoBloqueado = mostrarNotificacaoAcessoBloqueado;

// Funções de UI e gestão Admin carregadas sob demanda (/chunks/admin.json)
// ==============================================================================
