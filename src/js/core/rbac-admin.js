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

      function carregarPermissoesIniciais() {
        let perms = {};
        try {
          const raw = localStorage.getItem('gomex_permissoes_v1');
          if (raw) perms = JSON.parse(raw) || {};
        } catch (e) {}

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

        // Galeria
        ['btnAdicionarFotosGaleria', 'btnAdicionarFotosPasta'].forEach((galBtnId) => {
          const galBtn = $(galBtnId);
          if (galBtn) galBtn.style.display = podeEditarGal ? '' : 'none';
        });

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

      function obterTodosUsuariosAdmin() {
        const customUsers = (state.permissoes && Array.isArray(state.permissoes.usuariosCustom))
          ? state.permissoes.usuariosCustom
          : [];
        const customMap = new Map();
        customUsers.forEach(cu => {
          if (cu && cu.key) customMap.set(normalizarUsuario(cu.key), cu);
        });

        const merged = DEFAULT_USERS_LIST.map(u => {
          const ov = customMap.get(u.key);
          return ov ? { ...u, ...ov, key: u.key, isRootAdmin: Boolean(u.isRootAdmin) } : { ...u };
        });

        customUsers.forEach(cu => {
          const k = normalizarUsuario(cu.key);
          if (k && !merged.some(u => u.key === k)) {
            merged.push({ ...cu, key: k, isCustom: true });
          }
        });
        return merged;
      }

      function atualizarBadgeSyncSupabaseAdmin(synced, ts = null) {
        const el = $('adminSupabaseSyncBadge');
        if (!el) return;
        if (synced === true) {
          const hora = ts ? new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
          el.textContent = hora ? `Salvo no Supabase (${hora})` : 'Salvo no Supabase';
          el.className = 'admin-perm-count-badge total-liberado';
        } else if (synced === false) {
          el.textContent = 'Salvo local · Pendente no Supabase';
          el.className = 'admin-perm-count-badge parcial-liberado';
        } else {
          el.textContent = 'Supabase: Conectado';
          el.className = 'admin-perm-count-badge';
        }
      }
      window.atualizarBadgeSyncSupabaseAdmin = atualizarBadgeSyncSupabaseAdmin;

      function formatarBytesAmigavel(bytes) {
        const b = Number(bytes) || 0;
        if (b < 1024) return b + ' B';
        if (b < 1024 * 1024) return (b / 1024).toFixed(1).replace('.', ',') + ' KB';
        if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(2).replace('.', ',') + ' MB';
        return (b / (1024 * 1024 * 1024)).toFixed(2).replace('.', ',') + ' GB';
      }

      function aplicarCorBarraStorage(el, pct) {
        if (!el) return;
        el.style.width = Math.min(100, Math.max(2, Math.round(pct))) + '%';
        el.classList.remove('warn', 'bad');
        if (pct >= 85) el.classList.add('bad');
        else if (pct >= 65) el.classList.add('warn');
      }

      function renderizarArmazenamentoSupabaseUI(stats) {
        if (!stats) return;
        const plan = (state.permissoes && state.permissoes.supabasePlan) || 'free';
        if ($('adminSupabasePlanSelect')) $('adminSupabasePlanSelect').value = plan;

        const dbLimitBytes = plan === 'pro' ? (8 * 1024 * 1024 * 1024) : (500 * 1024 * 1024);
        const stLimitBytes = plan === 'pro' ? (100 * 1024 * 1024 * 1024) : (1024 * 1024 * 1024);

        const dbUsed = Number(stats.dbBytesUsed) || 0;
        const dbFree = Math.max(0, dbLimitBytes - dbUsed);
        const dbPct = Math.min(100, (dbUsed / dbLimitBytes) * 100);

        if ($('statAdminSupabaseFree')) $('statAdminSupabaseFree').textContent = formatarBytesAmigavel(dbFree) + ' livres';
        if ($('statAdminSupabaseFreeSub')) {
          $('statAdminSupabaseFreeSub').textContent = `${formatarBytesAmigavel(dbUsed)} usados de ${plan === 'pro' ? '8 GB' : '500 MB'} (${dbPct.toFixed(1).replace('.', ',')}%)`;
        }
        if ($('adminStorageModeBadge')) {
          $('adminStorageModeBadge').textContent = stats.exactPgSize ? 'Medição exata PostgreSQL' : 'Soma real das tabelas';
        }
        if ($('adminDbQuotaText')) $('adminDbQuotaText').textContent = `${formatarBytesAmigavel(dbUsed)} / ${plan === 'pro' ? '8 GB' : '500 MB'}`;
        if ($('adminDbFreeText')) $('adminDbFreeText').textContent = `Livre: ${formatarBytesAmigavel(dbFree)}`;
        if ($('adminDbPctText')) $('adminDbPctText').textContent = `${dbPct.toFixed(1).replace('.', ',')}%`;
        aplicarCorBarraStorage($('adminDbBarFill'), dbPct);

        // Galeria (limite rotativo JSON atual 8,5 MB e 200 fotos)
        const bd = stats.dbBreakdown || {};
        const galBytes = Number(bd.galeriaBytes) || 0;
        const galFotos = Number(bd.galeriaFotos) || 0;
        const galLimitBytes = 8500000;
        const galPct = Math.min(100, Math.max((galBytes / galLimitBytes) * 100, (galFotos / 200) * 100));
        if ($('adminGalQuotaText')) $('adminGalQuotaText').textContent = `${formatarBytesAmigavel(galBytes)} / 8,5 MB`;
        if ($('adminGalFreeText')) $('adminGalFreeText').textContent = `Fotos: ${galFotos} / 200`;
        if ($('adminGalPctText')) $('adminGalPctText').textContent = `${galPct.toFixed(1).replace('.', ',')}%`;
        aplicarCorBarraStorage($('adminGalBarFill'), galPct);

        // Storage Buckets
        const st = stats.storage || {};
        const stUsed = Number(st.bytesUsed) || 0;
        const stFree = Math.max(0, stLimitBytes - stUsed);
        const stPct = Math.min(100, (stUsed / stLimitBytes) * 100);
        if ($('adminBucketQuotaText')) $('adminBucketQuotaText').textContent = `${formatarBytesAmigavel(stUsed)} / ${plan === 'pro' ? '100 GB' : '1 GB'}`;
        if ($('adminBucketFreeText')) {
          $('adminBucketFreeText').textContent = st.bucketsCount
            ? `Livre: ${formatarBytesAmigavel(stFree)} (${st.filesCount || 0} arq.)`
            : `Livre: ${formatarBytesAmigavel(stFree)} (sem buckets)`;
        }
        if ($('adminBucketPctText')) $('adminBucketPctText').textContent = `${stPct.toFixed(1).replace('.', ',')}%`;
        aplicarCorBarraStorage($('adminBucketBarFill'), stPct);

        if ($('adminStorageBreakdown')) {
          $('adminStorageBreakdown').innerHTML = [
            `<span class="admin-storage-chip">Check-lists & Assinaturas (${bd.checklistsCount || 0}): <strong>${formatarBytesAmigavel(bd.checklistsBytes || 0)}</strong></span>`,
            `<span class="admin-storage-chip">Galeria JSON (${galFotos} fotos): <strong>${formatarBytesAmigavel(galBytes)}</strong></span>`,
            `<span class="admin-storage-chip">Custos & Peças: <strong>${formatarBytesAmigavel(bd.gastosBytes || 0)}</strong></span>`,
            `<span class="admin-storage-chip">Ocorrências & Agend.: <strong>${formatarBytesAmigavel(bd.ocorrenciasBytes || 0)}</strong></span>`,
            `<span class="admin-storage-chip">Frota, Usuários & Push: <strong>${formatarBytesAmigavel(bd.outrosParametrosBytes || 0)}</strong></span>`
          ].join('');
        }
      }

      let lastSupabaseStats = null;
      async function carregarArmazenamentoSupabase(forceToast = false) {
        const btn = $('btnAtualizarStorageSupabase');
        if (btn) btn.disabled = true;
        try {
          try {
            const res = await fetch('/api/supabase-storage-stats', { cache: 'no-store' });
            if (res.ok) {
              const stats = await res.json();
              if (stats && stats.ok) {
                lastSupabaseStats = stats;
                renderizarArmazenamentoSupabaseUI(stats);
                if (forceToast) mostrarToastSucessoPermissoes('Leitura de armazenamento do Supabase atualizada!');
                return stats;
              }
            }
          } catch (e) {}

          // Fallback direto via Supabase REST caso proxy local não responda
          try {
            const rParam = await fetch(SUPABASE_URL + '/rest/v1/parametros?select=id,valor,descricao', { headers: authHeaders(), cache: 'no-store' });
            if (rParam.ok) {
              const rows = await rParam.json();
              let galeriaBytes = 0, galeriaFotos = 0, gastosBytes = 0, ocorrenciasBytes = 0, outrosParametrosBytes = 0;
              (Array.isArray(rows) ? rows : []).forEach(row => {
                const bytes = new TextEncoder().encode(JSON.stringify(row)).length;
                if (row.id === 'frota_galeria_veiculos_v1') {
                  galeriaBytes += bytes;
                  try { galeriaFotos = JSON.parse(row.descricao || '[]').length; } catch (e) { galeriaFotos = Number(row.valor) || 0; }
                } else if (row.id === 'frota_lancamentos_gastos_v1' || row.id === 'frota_catalogo_produtos_v1') gastosBytes += bytes;
                else if (row.id === 'frota_ocorrencias_v1' || row.id === 'frota_agendamentos_servicos_v1') ocorrenciasBytes += bytes;
                else outrosParametrosBytes += bytes;
              });
              const chkBytes = new TextEncoder().encode(JSON.stringify(state.all || [])).length;
              const total = chkBytes + galeriaBytes + gastosBytes + ocorrenciasBytes + outrosParametrosBytes;
              const statsFallback = {
                ok: true,
                exactPgSize: false,
                dbBytesUsed: total,
                dbBreakdown: {
                  checklistsBytes: chkBytes,
                  checklistsCount: (state.all || []).length,
                  galeriaBytes,
                  galeriaFotos,
                  gastosBytes,
                  ocorrenciasBytes,
                  outrosParametrosBytes
                },
                storage: { available: false, bucketsCount: 0, filesCount: 0, bytesUsed: 0 }
              };
              lastSupabaseStats = statsFallback;
              renderizarArmazenamentoSupabaseUI(statsFallback);
              if (forceToast) mostrarToastSucessoPermissoes('Leitura de tabelas do Supabase atualizada!');
              return statsFallback;
            }
          } catch (e2) {}

          if ($('statAdminSupabaseFree')) $('statAdminSupabaseFree').textContent = 'Indisponível';
          if ($('statAdminSupabaseFreeSub')) $('statAdminSupabaseFreeSub').textContent = 'Não foi possível ler o Supabase agora';
          if ($('adminStorageModeBadge')) $('adminStorageModeBadge').textContent = 'Erro na consulta';
          if (forceToast) toast('Não foi possível consultar o armazenamento real do Supabase.', 'error');
          return null;
        } finally {
          if (btn) btn.disabled = false;
        }
      }
      window.carregarArmazenamentoSupabase = carregarArmazenamentoSupabase;

      function alterarPlanoSupabaseMonitor(plan) {
        if (!state.permissoes) state.permissoes = {};
        state.permissoes.supabasePlan = plan === 'pro' ? 'pro' : 'free';
        if (lastSupabaseStats) renderizarArmazenamentoSupabaseUI(lastSupabaseStats);
        salvarPermissoesUsuarios(false);
      }
      window.alterarPlanoSupabaseMonitor = alterarPlanoSupabaseMonitor;

      async function copiarSqlMedicaoSupabase() {
        const sql = [
          '-- Opcional: rode 1x no SQL Editor do Supabase para leitura exata de pg_database_size',
          'CREATE OR REPLACE FUNCTION public.gomex_db_storage_stats()',
          'RETURNS jsonb',
          'LANGUAGE sql',
          'SECURITY DEFINER',
          'AS $$',
          '  SELECT jsonb_build_object(',
          "    'db_bytes', pg_database_size(current_database()),",
          "    'checklists_bytes', COALESCE(pg_total_relation_size('public.veiculo_checklists'), 0),",
          "    'parametros_bytes', COALESCE(pg_total_relation_size('public.parametros'), 0)",
          '  );',
          '$$;'
        ].join('\n');
        let ok = false;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(sql);
            ok = true;
          }
        } catch (e) {}
        if (!ok) {
          const ta = document.createElement('textarea');
          ta.value = sql;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); ok = true; } catch (e) {}
          document.body.removeChild(ta);
        }
        mostrarToastSucessoPermissoes(ok ? 'SQL de medição exata copiado! Cole no SQL Editor do Supabase.' : 'Copie o SQL manualmente pelo console.');
      }
      window.copiarSqlMedicaoSupabase = copiarSqlMedicaoSupabase;

      function renderAdminPermissoes() {
        const container = $('adminUsersListContainer');
        if (!container) return;

        const todosUsuarios = obterTodosUsuariosAdmin();
        const ativosCount = todosUsuarios.filter(u => !(state.permissoes?.[u.key]?.ativo === false)).length;

        if ($('statAdminTotalUsers')) $('statAdminTotalUsers').textContent = `${ativosCount} / ${todosUsuarios.length}`;
        if ($('statAdminModulesCount')) $('statAdminModulesCount').textContent = `${MODULOS_SISTEMA.length} Telas + ${ACOES_EDICAO_SISTEMA.length} Ações`;
        if ($('adminUsersCountInfo')) $('adminUsersCountInfo').textContent = `${todosUsuarios.length} usuários cadastrados (${ativosCount} ativos)`;

        let html = '';
        todosUsuarios.forEach(u => {
          const uPerms = (state.permissoes && state.permissoes[u.key]) || {};
          const isRoot = Boolean(u.isRootAdmin || u.key === 'gomex');
          const isAtivo = isRoot || (uPerms.ativo !== false);
          const isAdmUser = isRoot || isGomexAdmin(u.key);
          const temSenhaPropria = Boolean(state.permissoes?.usuariosAuth?.[u.key]);

          let totalLiberadas = 0;
          MODULOS_SISTEMA.forEach(m => {
            if (isRoot || uPerms[m.key] !== false) totalLiberadas++;
          });

          let badgeCls = 'parcial-liberado';
          if (totalLiberadas === MODULOS_SISTEMA.length) badgeCls = 'total-liberado';
          else if (totalLiberadas === 0) badgeCls = 'bloqueado-total';

          let totalEdicoesLiberadas = 0;
          ACOES_EDICAO_SISTEMA.forEach(a => {
            if (podeEditar(a.key, u.key)) totalEdicoesLiberadas++;
          });

          let badgeEdicaoHtml = '';
          if (isAdmUser) {
            badgeEdicaoHtml = '<span class="admin-perm-count-badge total-liberado" style="margin-left:4px;">Administrador</span>';
          } else if (totalEdicoesLiberadas === 0) {
            badgeEdicaoHtml = '<span class="admin-perm-count-badge bloqueado-total" style="margin-left:4px;">Somente Leitura</span>';
          } else {
            badgeEdicaoHtml = `<span class="admin-perm-count-badge parcial-liberado" style="margin-left:4px;">${totalEdicoesLiberadas} de ${ACOES_EDICAO_SISTEMA.length} ações</span>`;
          }

          const badgeStatusHtml = isAtivo
            ? ''
            : '<span class="admin-perm-count-badge bloqueado-total" style="margin-left:4px;">Conta Bloqueada</span>';

          const iniciais = (u.name || u.key).split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
          const safeKey = u.key.replace(/\s+/g, '_');

          html += `
          <div class="admin-user-card${isRoot ? ' is-root-admin' : ''}${!isAtivo ? ' is-inactive' : ''}" id="userCard_${safeKey}" data-user-key="${esc(u.key)}">
            <div class="admin-user-head">
              <div class="admin-user-info">
                <div class="admin-user-avatar">${iniciais}</div>
                <div>
                  <div class="admin-user-name">${esc(u.name)}</div>
                  <div class="admin-user-sub">
                    <span class="admin-handle">@${esc(u.key)}</span>
                    <span class="admin-role-badge">${esc(u.role || 'Supervisor')}</span>
                    ${u.equipe ? `<span class="admin-role-badge">Equipe ${esc(u.equipe)}</span>` : ''}
                    <span class="admin-role-badge" style="background:${temSenhaPropria ? '#dcfce7;color:#166534' : '#f1f5f9;color:#475569'}">${temSenhaPropria ? 'Senha Própria PBKDF2' : 'Senha Padrão'}</span>
                  </div>
                </div>
              </div>
              <div class="admin-user-actions" style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;">
                <span class="admin-perm-count-badge ${badgeCls}" id="badgePermCount_${safeKey}">
                  ${totalLiberadas} de ${MODULOS_SISTEMA.length} telas
                </span>
                ${badgeEdicaoHtml}
                ${badgeStatusHtml}
              </div>
            </div>

            ${isRoot ? `
            <div class="admin-quick-actions">
              <span style="font-size:12px;font-weight:700;color:#4338ca;">Conta raiz protegida: acesso total permanente às telas, edições, usuários e Supabase.</span>
              <button type="button" class="btn-quick-perm btn-quick-pwd" onclick="abrirModalAlterarSenha('${esc(u.key)}', '${esc(u.name)}')">Alterar Senha</button>
            </div>` : `
            <div class="admin-quick-actions">
              <button type="button" class="btn-quick-perm" onclick="definirTodasPermissoesUsuario('${esc(u.key)}', true)">Liberar Telas</button>
              <button type="button" class="btn-quick-perm" onclick="definirApenasOcorrenciasUsuario('${esc(u.key)}')">Apenas Ocorrências</button>
              <button type="button" class="btn-quick-perm" onclick="definirTodasPermissoesUsuario('${esc(u.key)}', false)">Bloquear Telas</button>
              <button type="button" class="btn-quick-perm btn-quick-readonly" onclick="definirModoSomenteLeitura('${esc(u.key)}')">Somente Leitura</button>
              <button type="button" class="btn-quick-perm btn-quick-edit" onclick="definirModoEdicaoLiberada('${esc(u.key)}')">Liberar Edições</button>
              <button type="button" class="btn-quick-perm" onclick="abrirModalEditarUsuario('${esc(u.key)}')">Editar Cadastro</button>
              <button type="button" class="btn-quick-perm btn-quick-pwd" onclick="abrirModalAlterarSenha('${esc(u.key)}', '${esc(u.name)}')">Alterar Senha</button>
              <button type="button" class="btn-quick-perm ${isAtivo ? 'btn-quick-danger' : 'btn-quick-edit'}" onclick="alternarStatusUsuario('${esc(u.key)}')">${isAtivo ? 'Bloquear Login' : 'Reativar Login'}</button>
              ${u.isCustom ? `<button type="button" class="btn-quick-perm btn-quick-danger" onclick="excluirUsuarioCustom('${esc(u.key)}')">Excluir</button>` : ''}
            </div>`}

            <div class="admin-group-title" style="margin-top:10px;">
              <svg class="i" style="width:13px;height:13px"><use href="#i-grid"/></svg>
              <span>Visualização de Telas e Módulos</span>
            </div>

            <div class="admin-mod-grid">
              ${MODULOS_SISTEMA.map(m => {
                const liberado = isRoot || (uPerms[m.key] !== false);
                return `
                <div class="admin-mod-card ${liberado ? 'liberado' : 'bloqueado'}${isRoot ? ' locked' : ''}" id="modCard_${safeKey}_${m.key}" ${isRoot ? '' : `onclick="togglePermissaoClick('${esc(u.key)}', '${m.key}')"`}>
                  <div class="admin-mod-left">
                    <div class="admin-mod-ico">
                      <svg class="i"><use href="#i-${m.icon}" /></svg>
                    </div>
                    <div style="min-width:0;">
                      <div class="admin-mod-label">${m.nome}</div>
                    </div>
                  </div>
                  <span class="admin-mod-status">${liberado ? 'Liberado' : 'Bloqueado'}</span>
                </div>
                `;
              }).join('')}
            </div>

            <div class="admin-group-title" style="margin-top:14px;">
              <svg class="i" style="width:13px;height:13px"><use href="#i-edit"/></svg>
              <span>Permissões de Edição, Exportação & Privilégios de Administrador</span>
            </div>

            <div class="admin-mod-grid">
              ${ACOES_EDICAO_SISTEMA.map(a => {
                const liberado = isRoot || podeEditar(a.key, u.key);
                return `
                <div class="admin-mod-card edicao ${liberado ? 'liberado' : 'bloqueado'}${isRoot ? ' locked' : ''}" id="modEdicaoCard_${safeKey}_${a.key}" ${isRoot ? '' : `onclick="togglePermissaoEdicaoClick('${esc(u.key)}', '${a.key}')"`}>
                  <div class="admin-mod-left">
                    <div class="admin-mod-ico">
                      <svg class="i"><use href="#i-${a.icon}" /></svg>
                    </div>
                    <div style="min-width:0;">
                      <div class="admin-mod-label">${a.nome}</div>
                      <div style="font-size:11px;color:var(--ink-3);line-height:1.2;margin-top:2px;">${a.desc}</div>
                    </div>
                  </div>
                  <span class="admin-mod-status">${liberado ? 'Permitido' : 'Bloqueado'}</span>
                </div>
                `;
              }).join('')}
            </div>
          </div>
          `;
        });

        container.innerHTML = html;
      }
      window.renderAdminPermissoes = renderAdminPermissoes;

      function togglePermissaoClick(uKey, modKey) {
        if (uKey === 'gomex') return;
        if (!state.permissoes[uKey]) state.permissoes[uKey] = criarObjetoPermissoesPadrao(false, false);
        const atual = (state.permissoes[uKey][modKey] !== false);
        const novo = !atual;
        state.permissoes[uKey][modKey] = novo;

        const safeKey = uKey.replace(/\s+/g, '_');
        const cardEl = $(`modCard_${safeKey}_${modKey}`);
        if (cardEl) {
          cardEl.className = 'admin-mod-card ' + (novo ? 'liberado' : 'bloqueado');
          const statusEl = cardEl.querySelector('.admin-mod-status');
          if (statusEl) statusEl.textContent = novo ? 'Liberado' : 'Bloqueado';
        }

        let total = 0;
        MODULOS_SISTEMA.forEach(m => {
          if (state.permissoes[uKey][m.key] !== false) total++;
        });
        const badgeEl = $(`badgePermCount_${safeKey}`);
        if (badgeEl) {
          badgeEl.textContent = `${total} de ${MODULOS_SISTEMA.length} telas`;
          let badgeCls = 'parcial-liberado';
          if (total === MODULOS_SISTEMA.length) badgeCls = 'total-liberado';
          else if (total === 0) badgeCls = 'bloqueado-total';
          badgeEl.className = 'admin-perm-count-badge ' + badgeCls;
        }

        salvarPermissoesUsuarios(false);
      }
      window.togglePermissaoClick = togglePermissaoClick;

      function togglePermissaoEdicaoClick(uKey, acaoKey) {
        if (uKey === 'gomex') return;
        if (!state.permissoes[uKey]) state.permissoes[uKey] = criarObjetoPermissoesPadrao(false, false);
        const atual = podeEditar(acaoKey, uKey);
        state.permissoes[uKey][acaoKey] = !atual;

        renderAdminPermissoes();
        salvarPermissoesUsuarios(false);
      }
      window.togglePermissaoEdicaoClick = togglePermissaoEdicaoClick;

      function definirModoSomenteLeitura(uKey) {
        if (uKey === 'gomex') return;
        if (!state.permissoes[uKey]) state.permissoes[uKey] = criarObjetoPermissoesPadrao(false, false);
        ACOES_EDICAO_SISTEMA.forEach(a => {
          state.permissoes[uKey][a.key] = (a.key === 'exportar_relatorios');
        });
        renderAdminPermissoes();
        salvarPermissoesUsuarios(false);
        mostrarToastSucessoPermissoes(`Usuário @${uKey} definido como Somente Leitura.`);
      }
      window.definirModoSomenteLeitura = definirModoSomenteLeitura;

      function definirModoEdicaoLiberada(uKey) {
        if (uKey === 'gomex') return;
        if (!state.permissoes[uKey]) state.permissoes[uKey] = criarObjetoPermissoesPadrao(true, false);
        ACOES_EDICAO_SISTEMA.forEach(a => {
          if (a.key !== 'admin') state.permissoes[uKey][a.key] = true;
        });
        renderAdminPermissoes();
        salvarPermissoesUsuarios(false);
        mostrarToastSucessoPermissoes(`Edições liberadas para o usuário @${uKey}.`);
      }
      window.definirModoEdicaoLiberada = definirModoEdicaoLiberada;

      function definirTodasPermissoesUsuario(uKey, val) {
        if (uKey === 'gomex') return;
        if (!state.permissoes[uKey]) state.permissoes[uKey] = criarObjetoPermissoesPadrao(false, false);
        MODULOS_SISTEMA.forEach(m => {
          state.permissoes[uKey][m.key] = val;
        });
        renderAdminPermissoes();
        salvarPermissoesUsuarios(false);
      }
      window.definirTodasPermissoesUsuario = definirTodasPermissoesUsuario;

      function definirApenasOcorrenciasUsuario(uKey) {
        if (uKey === 'gomex') return;
        if (!state.permissoes[uKey]) state.permissoes[uKey] = criarObjetoPermissoesPadrao(false, false);
        MODULOS_SISTEMA.forEach(m => {
          state.permissoes[uKey][m.key] = (m.key === 'ocorrencias');
        });
        renderAdminPermissoes();
        salvarPermissoesUsuarios(false);
      }
      window.definirApenasOcorrenciasUsuario = definirApenasOcorrenciasUsuario;

      function alternarStatusUsuario(uKey) {
        if (uKey === 'gomex') return;
        if (!state.permissoes[uKey]) state.permissoes[uKey] = criarObjetoPermissoesPadrao(false, false);
        const atual = state.permissoes[uKey].ativo !== false;
        state.permissoes[uKey].ativo = !atual;
        renderAdminPermissoes();
        salvarPermissoesUsuarios(true);
        mostrarToastSucessoPermissoes(!atual ? `Usuário @${uKey} reativado.` : `Acesso do usuário @${uKey} bloqueado.`);
      }
      window.alternarStatusUsuario = alternarStatusUsuario;

      async function excluirUsuarioCustom(uKey) {
        if (uKey === 'gomex') return;
        const ok = await abrirConfirmacaoGlobal({
          titulo: 'Excluir Usuário',
          subtitulo: 'Remoção de acesso do painel',
          mensagem: `Deseja realmente excluir o usuário <strong>@${esc(uKey)}</strong>?`,
          aviso: 'Esta ação remove o cadastro e as credenciais deste usuário do Supabase.',
          textoConfirmar: 'Excluir Usuário',
          variante: 'perigo',
          icone: 'trash'
        });
        if (!ok) return;
        if (Array.isArray(state.permissoes.usuariosCustom)) {
          state.permissoes.usuariosCustom = state.permissoes.usuariosCustom.filter(u => normalizarUsuario(u.key) !== uKey);
        }
        delete state.permissoes[uKey];
        if (state.permissoes.usuariosAuth) delete state.permissoes.usuariosAuth[uKey];
        renderAdminPermissoes();
        await salvarPermissoesUsuarios(true);
      }
      window.excluirUsuarioCustom = excluirUsuarioCustom;

      function filtrarUsuariosAdmin(termo) {
        const t = (termo || '').toLowerCase().trim();
        const cards = document.querySelectorAll('.admin-user-card');
        cards.forEach(card => {
          const text = card.textContent.toLowerCase();
          card.style.display = text.includes(t) ? '' : 'none';
        });
      }
      window.filtrarUsuariosAdmin = filtrarUsuariosAdmin;

      async function salvarPermissoesUsuarios(manual = false) {
        try {
          localStorage.setItem('gomex_permissoes_v1', JSON.stringify(state.permissoes));
        } catch (e) {}

        aplicarPermissoesUi();

        const btn = manual ? $('btnSalvarPermissoes') : null;
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = icon('clock') + ' Salvando no Supabase...';
        }

        let savedSupabase = false;
        try {
          try {
            const res = await fetch('/api/frota-gastos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ permissoes: state.permissoes })
            });
            if (res.ok) {
              const jsonRes = await res.json().catch(() => ({}));
              if (jsonRes && jsonRes.synced) savedSupabase = true;
            }
          } catch (err) {}

          if (!savedSupabase) {
            try {
              const resSup = await fetch(SUPABASE_URL + '/rest/v1/parametros', {
                method: 'POST',
                headers: { ...authHeaders(), Prefer: 'resolution=merge-duplicates,return=representation' },
                body: JSON.stringify([{
                  id: 'frota_permissoes_usuarios_v1',
                  valor: Object.keys(state.permissoes || {}).length,
                  descricao: JSON.stringify(state.permissoes)
                }])
              });
              if (resSup.ok) savedSupabase = true;
            } catch (e2) {}
          }

          atualizarBadgeSyncSupabaseAdmin(savedSupabase, Date.now());
          if (manual) {
            if (savedSupabase) {
              mostrarToastSucessoPermissoes('Usuários e permissões salvos no Supabase com sucesso!');
            } else {
              mostrarToastBloqueioEdicao('sincronização (salvo apenas local; verifique conexão com o Supabase)');
            }
          }
          return savedSupabase;
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = icon('check') + ' Salvar no Supabase';
          }
        }
      }
      window.salvarPermissoesUsuarios = salvarPermissoesUsuarios;

      function mostrarToastSucessoPermissoes(msg) {
        const toastEl = document.createElement('div');
        toastEl.className = 'toast-perm-alert success';
        toastEl.innerHTML = icon('check') + `<span>${esc(msg)}</span>`;
        document.body.appendChild(toastEl);
        setTimeout(() => {
          toastEl.style.opacity = '0';
          toastEl.style.transition = 'opacity 300ms ease';
          setTimeout(() => toastEl.remove(), 350);
        }, 3500);
      }
      window.mostrarToastSucessoPermissoes = mostrarToastSucessoPermissoes;

      function abrirModalNovoUsuario() {
        if ($('editarUsuarioKey')) $('editarUsuarioKey').value = '';
        if ($('modalNovoUsuarioTitle')) $('modalNovoUsuarioTitle').textContent = 'Cadastrar Novo Usuário';
        if ($('modalNovoUsuarioSub')) $('modalNovoUsuarioSub').textContent = 'Salvo no Supabase com senha protegida por hash PBKDF2-SHA256';
        if ($('txtBtnConfirmarUsuario')) $('txtBtnConfirmarUsuario').textContent = 'Criar Usuário e Salvar no Supabase';
        if ($('lblNovoUsuarioSenha')) $('lblNovoUsuarioSenha').textContent = 'Senha Individual *';
        if ($('boxPerfilInicialNovoUsuario')) $('boxPerfilInicialNovoUsuario').style.display = 'block';
        if ($('novoUsuarioNome')) $('novoUsuarioNome').value = '';
        if ($('novoUsuarioLogin')) {
          $('novoUsuarioLogin').value = '';
          $('novoUsuarioLogin').disabled = false;
        }
        if ($('novoUsuarioCargo')) $('novoUsuarioCargo').value = '';
        if ($('novoUsuarioEquipe')) $('novoUsuarioEquipe').value = '';
        if ($('novoUsuarioPerfil')) $('novoUsuarioPerfil').value = 'supervisor_leitura';
        if ($('novoUsuarioSenha')) $('novoUsuarioSenha').value = '';
        if ($('novoUsuarioConfirmarSenha')) $('novoUsuarioConfirmarSenha').value = '';
        if ($('modalNovoUsuario')) $('modalNovoUsuario').style.display = 'flex';
      }
      window.abrirModalNovoUsuario = abrirModalNovoUsuario;

      function abrirModalEditarUsuario(uKey) {
        const uNorm = normalizarUsuario(uKey);
        const u = obterTodosUsuariosAdmin().find(x => x.key === uNorm);
        if (!u || uNorm === 'gomex') return;
        if ($('editarUsuarioKey')) $('editarUsuarioKey').value = uNorm;
        if ($('modalNovoUsuarioTitle')) $('modalNovoUsuarioTitle').textContent = 'Editar Cadastro do Usuário';
        if ($('modalNovoUsuarioSub')) $('modalNovoUsuarioSub').textContent = 'Atualiza nome, cargo e equipe salva no Supabase';
        if ($('txtBtnConfirmarUsuario')) $('txtBtnConfirmarUsuario').textContent = 'Salvar Alterações no Supabase';
        if ($('lblNovoUsuarioSenha')) $('lblNovoUsuarioSenha').textContent = 'Nova Senha (opcional)';
        if ($('boxPerfilInicialNovoUsuario')) $('boxPerfilInicialNovoUsuario').style.display = 'none';
        if ($('novoUsuarioNome')) $('novoUsuarioNome').value = u.name || '';
        if ($('novoUsuarioLogin')) {
          $('novoUsuarioLogin').value = u.key;
          $('novoUsuarioLogin').disabled = true;
        }
        if ($('novoUsuarioCargo')) $('novoUsuarioCargo').value = u.role || '';
        if ($('novoUsuarioEquipe')) $('novoUsuarioEquipe').value = u.equipe || '';
        if ($('novoUsuarioSenha')) $('novoUsuarioSenha').value = '';
        if ($('novoUsuarioConfirmarSenha')) $('novoUsuarioConfirmarSenha').value = '';
        if ($('modalNovoUsuario')) $('modalNovoUsuario').style.display = 'flex';
      }
      window.abrirModalEditarUsuario = abrirModalEditarUsuario;

      function fecharModalNovoUsuario() {
        if ($('modalNovoUsuario')) $('modalNovoUsuario').style.display = 'none';
      }
      window.fecharModalNovoUsuario = fecharModalNovoUsuario;

      async function confirmarNovoUsuario() {
        const editKey = normalizarUsuario($('editarUsuarioKey')?.value || '');
        const isEdit = Boolean(editKey);
        const nome = ($('novoUsuarioNome')?.value || '').trim();
        const login = isEdit ? editKey : normalizarUsuario($('novoUsuarioLogin')?.value || '');
        const cargo = ($('novoUsuarioCargo')?.value || '').trim() || 'Supervisor';
        const equipe = ($('novoUsuarioEquipe')?.value || '').trim();
        const perfil = ($('novoUsuarioPerfil')?.value || 'supervisor_leitura').trim();
        const senha = ($('novoUsuarioSenha')?.value || '').trim();
        const senhaConf = ($('novoUsuarioConfirmarSenha')?.value || '').trim();

        if (!nome || !login || login.length < 3) {
          toast('Informe Nome e Login com pelo menos 3 caracteres.', 'error');
          return;
        }
        if (!isEdit && (!senha || senha.length < 6)) {
          toast('A senha individual deve ter no mínimo 6 caracteres.', 'error');
          return;
        }
        if (senha && senha.length < 6) {
          toast('Se preencher nova senha, use no mínimo 6 caracteres.', 'error');
          return;
        }
        if (senha && senha !== senhaConf) {
          toast('As senhas digitadas não conferem.', 'error');
          return;
        }

        if (!isEdit && obterTodosUsuariosAdmin().some(u => u.key === login)) {
          toast(`Já existe um usuário com o login @${login}.`, 'error');
          return;
        }

        if (!Array.isArray(state.permissoes.usuariosCustom)) state.permissoes.usuariosCustom = [];
        const isDefault = DEFAULT_USERS_LIST.some(d => d.key === login);
        const existingIdx = state.permissoes.usuariosCustom.findIndex(u => normalizarUsuario(u.key) === login);
        const metaUser = {
          key: login,
          name: nome,
          role: cargo,
          equipe,
          isCustom: !isDefault
        };
        if (existingIdx >= 0) {
          state.permissoes.usuariosCustom[existingIdx] = { ...state.permissoes.usuariosCustom[existingIdx], ...metaUser };
        } else {
          state.permissoes.usuariosCustom.push(metaUser);
        }

        if (senha) {
          if (!state.permissoes.usuariosAuth) state.permissoes.usuariosAuth = {};
          const hashObj = await gerarHashSenhaForte(senha);
          state.permissoes.usuariosAuth[login] = {
            ...hashObj,
            strict: login !== 'gomex',
            updatedAt: new Date().toISOString()
          };
        }

        if (!isEdit || !state.permissoes[login]) {
          if (perfil === 'administrador') {
            state.permissoes[login] = criarObjetoPermissoesPadrao(true, true);
          } else if (perfil === 'supervisor_edicao') {
            state.permissoes[login] = criarObjetoPermissoesPadrao(true, false);
          } else if (perfil === 'ocorrencias') {
            const baseOcr = criarObjetoPermissoesPadrao(false, false);
            MODULOS_SISTEMA.forEach(m => { baseOcr[m.key] = (m.key === 'ocorrencias'); });
            state.permissoes[login] = baseOcr;
          } else {
            state.permissoes[login] = criarObjetoPermissoesPadrao(false, false);
          }
        }

        fecharModalNovoUsuario();
        renderAdminPermissoes();
        await salvarPermissoesUsuarios(true);
      }
      window.confirmarNovoUsuario = confirmarNovoUsuario;

      function abrirModalAlterarSenha(uKey, uName) {
        if ($('alterarSenhaKey')) $('alterarSenhaKey').value = normalizarUsuario(uKey);
        if ($('alterarSenhaNomeUsuario')) $('alterarSenhaNomeUsuario').textContent = `${uName} (@${uKey})`;
        if ($('inputNovaSenha')) $('inputNovaSenha').value = '';
        if ($('inputConfirmarNovaSenha')) $('inputConfirmarNovaSenha').value = '';
        if ($('modalAlterarSenha')) $('modalAlterarSenha').style.display = 'flex';
      }
      window.abrirModalAlterarSenha = abrirModalAlterarSenha;

      function fecharModalAlterarSenha() {
        if ($('modalAlterarSenha')) $('modalAlterarSenha').style.display = 'none';
      }
      window.fecharModalAlterarSenha = fecharModalAlterarSenha;

      async function confirmarAlteracaoSenha() {
        const uKey = normalizarUsuario($('alterarSenhaKey')?.value || '');
        const s1 = ($('inputNovaSenha')?.value || '').trim();
        const s2 = ($('inputConfirmarNovaSenha')?.value || '').trim();

        if (!uKey) return;
        if (!s1 || s1.length < 6) {
          toast('A senha deve ter pelo menos 6 caracteres.', 'error');
          return;
        }
        if (s1 !== s2) {
          toast('As senhas digitadas não conferem. Confira e tente de novo.', 'error');
          return;
        }

        const hashObj = await gerarHashSenhaForte(s1);
        if (!state.permissoes.usuariosAuth) state.permissoes.usuariosAuth = {};
        state.permissoes.usuariosAuth[uKey] = {
          ...hashObj,
          strict: uKey !== 'gomex',
          updatedAt: new Date().toISOString()
        };

        fecharModalAlterarSenha();
        renderAdminPermissoes();
        await salvarPermissoesUsuarios(true);
      }
      window.confirmarAlteracaoSenha = confirmarAlteracaoSenha;

      function filtrarTabelaManutGeral(tipo) {
        state.filtroMaintGeral = tipo;
        $('btnFilterMaintAll').style.background = tipo === 'todos' ? 'var(--accent-tint)' : 'transparent';
        $('btnFilterMaintAll').style.color = tipo === 'todos' ? 'var(--accent-hi)' : '';
        $('btnFilterMaintEm').style.background = tipo === 'em' ? 'rgba(245, 158, 11, 0.2)' : 'transparent';
        $('btnFilterMaintJa').style.background = tipo === 'concluidas' ? 'rgba(16, 185, 129, 0.2)' : 'transparent';
        renderManutencaoViewGeral();
      }
      window.filtrarTabelaManutGeral = filtrarTabelaManutGeral;

      function renderManutencaoViewGeral() {
        const tbody = $('maintTableBody');
        if (!tbody) return;
        const itemsComManut = [];

        // Apenas vistorias ativas (não inativadas) aparecem no acompanhamento operacional de manutenção
        const ativos = state.all.filter(it => it.status !== 'inativo');

        ativos.forEach(it => {
          const m = getManutencaoData(it);
          if (m && m.status && m.status !== 'Nenhuma') {
            itemsComManut.push({ it, m });
          }
        });

        const filtro = state.filtroMaintGeral || 'todos';
        const filtrados = itemsComManut.filter(({ m }) => {
          if (filtro === 'em') return m.status === 'Em manutenção';
          if (filtro === 'concluidas') return m.status === 'Já foi para manutenção';
          return true;
        });

        if (!filtrados.length) {
          let emptyTitle = 'Nenhum veículo nesta categoria de manutenção';
          let emptyDesc = 'Para adicionar observações de manutenção a um veículo, acesse as vistorias e utilize a aba de Manutenção.';
          let actionBtn = '<button type="button" class="btn btn-primary" onclick="alternarVisaoPrincipal(\'vistorias\')"><svg class="i" style="width:15px;height:15px;margin:0;"><use href="#i-truck"/></svg><span>Ir para Vistorias</span></button>';

          if (itemsComManut.length > 0 && filtro !== 'todos') {
            emptyTitle = filtro === 'em' ? 'Nenhum veículo "Em Manutenção" no momento' : 'Nenhuma manutenção "Concluída" encontrada';
            emptyDesc = 'Existem outros registros de manutenção cadastrados na frota.';
            actionBtn = '<button type="button" class="btn btn-primary" onclick="filtrarTabelaManutGeral(\'todos\')"><svg class="i" style="width:15px;height:15px;margin:0;"><use href="#i-tool"/></svg><span>Ver Todas as Manutenções</span></button>';
          }

          tbody.innerHTML = '<tr><td colspan="8" class="empty">' +
            '<div class="empty-icon-wrap">' + icon('tool') + '</div>' +
            '<h2>' + emptyTitle + '</h2>' +
            '<p>' + emptyDesc + '</p>' +
            '<div class="empty-action">' + actionBtn + '</div>' +
            '</td></tr>';
          return;
        }

        tbody.innerHTML = filtrados.map(({ it, m }) => {
          const isEm = m.status === 'Em manutenção';
          const statusBadge = isEm
            ? '<span class="badge-maint-pill em">' + icon('tool') + ' Em Manutenção</span>'
            : '<span class="badge-maint-pill ja">' + icon('check') + ' Concluída</span>';

          return '<tr>' +
            '<td><button type="button" class="plate" data-act="open-maint" data-id="' + it.id + '" onclick="openDrawer(\'' + it.id + '\', this, \'manut\')">' + esc(it.placa || '—') + '</button></td>' +
            '<td><strong>' + esc(it.veiculo || '—') + '</strong></td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + esc(m.oficina || 'Não informada') + (m.tipo ? '<br><small class="muted">' + esc(m.tipo) + '</small>' : '') + '</td>' +
            '<td>' + (m.entrada ? formatarData(m.entrada) : '—') + '</td>' +
            '<td>' + (m.retorno ? formatarData(m.retorno) : '—') + '</td>' +
            '<td style="max-width:280px;font-size:12.5px;color:var(--ink)">' + esc(m.obs || 'Sem observações registradas') + '</td>' +
            '<td style="text-align:right">' +
            '<button type="button" class="btn btn-ghost" data-act="open-maint" data-id="' + it.id + '" style="height:28px;padding:0 10px;font-size:12px;color:var(--accent-hi)" onclick="openDrawer(\'' + it.id + '\', this, \'manut\')">' +
            icon('tool') + ' <span>Observações</span>' +
            '</button>' +
            '</td>' +
            '</tr>';
        }).join('');
      }

      // ==============================================================================