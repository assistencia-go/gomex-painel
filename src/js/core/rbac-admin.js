      // GESTÃO DE PERMISSÕES & CONTROLE DE ACESSO RBAC (EXCLUSIVO GOMEX ADMIN)
      // ==============================================================================
      const DEFAULT_USERS_LIST = [
        { key: 'hendreo', name: 'Hendreo', role: 'Supervisor de Frota' },
        { key: 'ricardo', name: 'Ricardo', role: 'Supervisor de Frota' },
        { key: 'eliase', name: 'Eliase', role: 'Supervisor Rota 102' },
        { key: 'alisson 101', name: 'Alisson 101', role: 'Supervisor Rota 101' },
        { key: 'alisson 103', name: 'Alisson 103', role: 'Supervisor Rota 103' },
        { key: 'maycon', name: 'Maycon', role: 'Gerente Operacional' }
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
        { key: 'editar_vistorias', nome: 'Editar Vistorias & Checklists', icon: 'edit', desc: 'Permite alterar vistorias, laudo técnico e inativar check-lists' },
        { key: 'editar_ocorrencias', nome: 'Criar / Editar Ocorrências', icon: 'alert', desc: 'Permite abrir novas pausas, editar e finalizar ocorrências' },
        { key: 'editar_manutencao', nome: 'Editar Manutenções', icon: 'tool', desc: 'Permite salvar observações e alterar status da oficina' },
        { key: 'editar_gastos', nome: 'Lançar / Excluir Custos', icon: 'wallet', desc: 'Permite lançar despesas, registrar notas e compras de peças' },
        { key: 'editar_frotacad', nome: 'Cadastrar / Editar Frota', icon: 'truck', desc: 'Permite cadastrar carros novos e alterar dados da frota' }
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

      function isGomexAdmin() {
        const u = normalizarUsuario(state.currentUser);
        return u === 'gomex';
      }
      window.isGomexAdmin = isGomexAdmin;

      function podeEditar(tipo, user) {
        const uNorm = normalizarUsuario(user || state.currentUser);
        if (uNorm === 'gomex') return true; // Gomex Admin sempre pode editar tudo

        const uPerms = state.permissoes && state.permissoes[uNorm];
        if (!uPerms) return false;

        const chaveEdicao = tipo.startsWith('editar_') ? tipo : ('editar_' + tipo);
        if (typeof uPerms[chaveEdicao] === 'boolean') {
          return uPerms[chaveEdicao];
        }

        // Por padrão seguro de empresa: somente leitura para supervisores comuns;
        // gerência ('maycon') pode editar se não houver bloqueio configurado.
        if (uNorm === 'maycon') return true;
        return false;
      }
      window.podeEditar = podeEditar;

      function carregarPermissoesIniciais() {
        let perms = {};
        try {
          const raw = localStorage.getItem('gomex_permissoes_v1');
          if (raw) perms = JSON.parse(raw) || {};
        } catch (e) {}

        // Garante que cada usuário tenha um objeto de permissões de tela e edições
        DEFAULT_USERS_LIST.forEach(u => {
          if (!perms[u.key]) {
            perms[u.key] = {
              vistorias: true,
              manutencao: true,
              ocorrencias: true,
              gastos: true,
              galeria: true,
              vendedores: true,
              frotacad: true,
              editar_vistorias: (u.key === 'maycon'),
              editar_ocorrencias: (u.key === 'maycon'),
              editar_manutencao: (u.key === 'maycon'),
              editar_gastos: (u.key === 'maycon'),
              editar_frotacad: (u.key === 'maycon')
            };
          } else {
            // Assegura chaves de edição caso o usuário já existisse
            if (typeof perms[u.key].editar_vistorias === 'undefined') perms[u.key].editar_vistorias = (u.key === 'maycon');
            if (typeof perms[u.key].editar_ocorrencias === 'undefined') perms[u.key].editar_ocorrencias = (u.key === 'maycon');
            if (typeof perms[u.key].editar_manutencao === 'undefined') perms[u.key].editar_manutencao = (u.key === 'maycon');
            if (typeof perms[u.key].editar_gastos === 'undefined') perms[u.key].editar_gastos = (u.key === 'maycon');
            if (typeof perms[u.key].editar_frotacad === 'undefined') perms[u.key].editar_frotacad = (u.key === 'maycon');
          }
        });

        // gomex sempre tem tudo true
        perms['gomex'] = {
          vistorias: true,
          manutencao: true,
          ocorrencias: true,
          gastos: true,
          galeria: true,
          vendedores: true,
          frotacad: true,
          admin: true,
          editar_vistorias: true,
          editar_ocorrencias: true,
          editar_manutencao: true,
          editar_gastos: true,
          editar_frotacad: true
        };

        state.permissoes = perms;
      }
      carregarPermissoesIniciais();

      function temPermissaoVisao(user, visao) {
        if (!visao) return false;
        if (visao === 'agendamentos') visao = 'ocorrencias';
        const uNorm = normalizarUsuario(user || state.currentUser);
        if (uNorm === 'gomex') return true; // Gomex Admin sempre pode acessar tudo
        if (visao === 'admin') return false; // Somente gomex pode acessar admin

        const uPerms = state.permissoes && state.permissoes[uNorm];
        if (uPerms && typeof uPerms[visao] === 'boolean') {
          return uPerms[visao];
        }
        return true;
      }
      window.temPermissaoVisao = temPermissaoVisao;

      function obterPrimeiraVisaoPermitida(user) {
        const uNorm = normalizarUsuario(user || state.currentUser);
        if (uNorm === 'gomex') return 'vistorias';
        const ordem = ['ocorrencias', 'vistorias', 'manutencao', 'gastos', 'galeria', 'vendedores', 'frotacad'];
        for (const v of ordem) {
          if (temPermissaoVisao(uNorm, v)) return v;
        }
        return 'ocorrencias';
      }
      window.obterPrimeiraVisaoPermitida = obterPrimeiraVisaoPermitida;

      function aplicarPermissoesUi() {
        const user = normalizarUsuario(state.currentUser);
        const isGomex = isGomexAdmin();

        // 1. Botão do Admin
        const btnAdmin = $('btnViewAdmin');
        if (btnAdmin) {
          btnAdmin.style.display = isGomex ? 'flex' : 'none';
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
          const liberado = isGomex || temPermissaoVisao(user, mod);
          if (liberado) {
            btn.style.display = '';
            btn.removeAttribute('disabled');
          } else {
            btn.style.display = 'none';
            btn.setAttribute('disabled', 'true');
          }
        }

        // 3. Se a tela atual estiver bloqueada, redireciona
        if (!isGomex && !temPermissaoVisao(user, state.visaoAtual)) {
          const fallback = obterPrimeiraVisaoPermitida(user);
          if (fallback) alternarVisaoPrincipal(fallback, false);
        }

        // 4. Bloqueio de botões de edição conforme permissões do usuário
        const podeEditarVist = isGomex || podeEditar('vistorias', user);
        const podeEditarOcr = isGomex || podeEditar('ocorrencias', user);
        const podeEditarManut = isGomex || podeEditar('manutencao', user);
        const podeEditarGastos = isGomex || podeEditar('gastos', user);
        const podeEditarFrota = isGomex || podeEditar('frotacad', user);

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

      function renderAdminPermissoes() {
        const container = $('adminUsersListContainer');
        if (!container) return;

        // Combina usuários padrões com usuários adicionais customizados
        const customUsers = (state.permissoes && state.permissoes.usuariosCustom) || [];
        const todosUsuarios = [...DEFAULT_USERS_LIST];
        customUsers.forEach(cu => {
          if (!todosUsuarios.some(u => u.key === cu.key)) todosUsuarios.push(cu);
        });

        if ($('statAdminTotalUsers')) $('statAdminTotalUsers').textContent = todosUsuarios.length;
        if ($('adminUsersCountInfo')) $('adminUsersCountInfo').textContent = `${todosUsuarios.length} usuários cadastrados`;

        let html = '';
        todosUsuarios.forEach(u => {
          const uPerms = (state.permissoes && state.permissoes[u.key]) || {};
          let totalLiberadas = 0;
          MODULOS_SISTEMA.forEach(m => {
            if (uPerms[m.key] !== false) totalLiberadas++;
          });

          let badgeCls = 'parcial-liberado';
          if (totalLiberadas === MODULOS_SISTEMA.length) badgeCls = 'total-liberado';
          else if (totalLiberadas === 0) badgeCls = 'bloqueado-total';

          let totalEdicoesLiberadas = 0;
          ACOES_EDICAO_SISTEMA.forEach(a => {
            if (podeEditar(a.key, u.key)) totalEdicoesLiberadas++;
          });

          let badgeEdicaoHtml = '';
          if (totalEdicoesLiberadas === 0) {
            badgeEdicaoHtml = '<span class="admin-perm-count-badge bloqueado-total" style="margin-left:4px;">Somente Leitura</span>';
          } else if (totalEdicoesLiberadas === ACOES_EDICAO_SISTEMA.length) {
            badgeEdicaoHtml = '<span class="admin-perm-count-badge total-liberado" style="margin-left:4px;">Edição Liberada</span>';
          } else {
            badgeEdicaoHtml = `<span class="admin-perm-count-badge parcial-liberado" style="margin-left:4px;">${totalEdicoesLiberadas} de ${ACOES_EDICAO_SISTEMA.length} edições</span>`;
          }

          const iniciais = (u.name || u.key).split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

          html += `
          <div class="admin-user-card" id="userCard_${u.key.replace(/\s+/g, '_')}" data-user-key="${u.key}">
            <div class="admin-user-head">
              <div class="admin-user-info">
                <div class="admin-user-avatar">${iniciais}</div>
                <div>
                  <div class="admin-user-name">${esc(u.name)}</div>
                  <div class="admin-user-sub">
                    <span class="admin-handle">@${esc(u.key)}</span>
                    <span class="admin-role-badge">${esc(u.role || 'Supervisor')}</span>
                  </div>
                </div>
              </div>
              <div class="admin-user-actions" style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;">
                <span class="admin-perm-count-badge ${badgeCls}" id="badgePermCount_${u.key.replace(/\s+/g, '_')}">
                  ${totalLiberadas} de ${MODULOS_SISTEMA.length} telas liberadas
                </span>
                ${badgeEdicaoHtml}
              </div>
            </div>

            <div class="admin-quick-actions">
              <button type="button" class="btn-quick-perm" onclick="definirTodasPermissoesUsuario('${u.key}', true)">Liberar Telas</button>
              <button type="button" class="btn-quick-perm" onclick="definirApenasOcorrenciasUsuario('${u.key}')">Apenas Ocorrências</button>
              <button type="button" class="btn-quick-perm" onclick="definirTodasPermissoesUsuario('${u.key}', false)">Bloquear Telas</button>
              <button type="button" class="btn-quick-perm btn-quick-readonly" onclick="definirModoSomenteLeitura('${u.key}')">Somente Leitura</button>
              <button type="button" class="btn-quick-perm btn-quick-edit" onclick="definirModoEdicaoLiberada('${u.key}')">Liberar Edições</button>
              <button type="button" class="btn-quick-perm btn-quick-pwd" onclick="abrirModalAlterarSenha('${u.key}', '${esc(u.name)}')">Alterar Senha</button>
            </div>

            <div class="admin-group-title" style="margin-top:10px;">
              <svg class="i" style="width:13px;height:13px"><use href="#i-grid"/></svg>
              <span>Visualização de Telas e Módulos</span>
            </div>

            <div class="admin-mod-grid">
              ${MODULOS_SISTEMA.map(m => {
                const liberado = (uPerms[m.key] !== false);
                return `
                <div class="admin-mod-card ${liberado ? 'liberado' : 'bloqueado'}" id="modCard_${u.key.replace(/\s+/g, '_')}_${m.key}" onclick="togglePermissaoClick('${u.key}', '${m.key}')">
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
              <span>Permissões de Edição & Gravação (Somente Leitura vs Alteração)</span>
            </div>

            <div class="admin-mod-grid">
              ${ACOES_EDICAO_SISTEMA.map(a => {
                const liberado = podeEditar(a.key, u.key);
                return `
                <div class="admin-mod-card edicao ${liberado ? 'liberado' : 'bloqueado'}" id="modEdicaoCard_${u.key.replace(/\s+/g, '_')}_${a.key}" onclick="togglePermissaoEdicaoClick('${u.key}', '${a.key}')">
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
        if (!state.permissoes[uKey]) state.permissoes[uKey] = {};
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
          badgeEl.textContent = `${total} de ${MODULOS_SISTEMA.length} telas liberadas`;
          let badgeCls = 'parcial-liberado';
          if (total === MODULOS_SISTEMA.length) badgeCls = 'total-liberado';
          else if (total === 0) badgeCls = 'bloqueado-total';
          badgeEl.className = 'admin-perm-count-badge ' + badgeCls;
        }

        salvarPermissoesUsuarios(false);
      }
      window.togglePermissaoClick = togglePermissaoClick;

      function togglePermissaoEdicaoClick(uKey, acaoKey) {
        if (!state.permissoes[uKey]) state.permissoes[uKey] = {};
        const atual = podeEditar(acaoKey, uKey);
        const novo = !atual;
        state.permissoes[uKey][acaoKey] = novo;

        renderAdminPermissoes();
        salvarPermissoesUsuarios(false);
      }
      window.togglePermissaoEdicaoClick = togglePermissaoEdicaoClick;

      function definirModoSomenteLeitura(uKey) {
        if (!state.permissoes[uKey]) state.permissoes[uKey] = {};
        ACOES_EDICAO_SISTEMA.forEach(a => {
          state.permissoes[uKey][a.key] = false;
        });
        renderAdminPermissoes();
        salvarPermissoesUsuarios(false);
        if (typeof mostrarToastInfo === 'function') {
          mostrarToastInfo(`Usuário @${uKey} definido como Somente Leitura (edições bloqueadas).`);
        }
      }
      window.definirModoSomenteLeitura = definirModoSomenteLeitura;

      function definirModoEdicaoLiberada(uKey) {
        if (!state.permissoes[uKey]) state.permissoes[uKey] = {};
        ACOES_EDICAO_SISTEMA.forEach(a => {
          state.permissoes[uKey][a.key] = true;
        });
        renderAdminPermissoes();
        salvarPermissoesUsuarios(false);
        if (typeof mostrarToastSucesso === 'function') {
          mostrarToastSucesso(`Edições liberadas para o usuário @${uKey}.`);
        }
      }
      window.definirModoEdicaoLiberada = definirModoEdicaoLiberada;

      function definirTodasPermissoesUsuario(uKey, val) {
        if (!state.permissoes[uKey]) state.permissoes[uKey] = {};
        MODULOS_SISTEMA.forEach(m => {
          state.permissoes[uKey][m.key] = val;
        });
        renderAdminPermissoes();
        salvarPermissoesUsuarios(false);
      }
      window.definirTodasPermissoesUsuario = definirTodasPermissoesUsuario;

      function definirApenasOcorrenciasUsuario(uKey) {
        if (!state.permissoes[uKey]) state.permissoes[uKey] = {};
        MODULOS_SISTEMA.forEach(m => {
          state.permissoes[uKey][m.key] = (m.key === 'ocorrencias');
        });
        renderAdminPermissoes();
        salvarPermissoesUsuarios(false);
      }
      window.definirApenasOcorrenciasUsuario = definirApenasOcorrenciasUsuario;

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

        if (manual) {
          const btn = $('btnSalvarPermissoes');
          if (btn) {
            btn.disabled = true;
            btn.innerHTML = icon('clock') + ' Sincronizando na Nuvem...';
          }

          let ok = false;
          try {
            try {
              const res = await fetch('/api/frota-gastos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissoes: state.permissoes })
              });
              if (res.ok) ok = true;
            } catch (err) { }

            if (!ok) {
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
                if (resSup.ok) ok = true;
              } catch (e2) { }
            }

            if (ok) {
              mostrarToastSucessoPermissoes('Permissões de tela salvas e sincronizadas na nuvem com sucesso!');
            } else {
              mostrarToastSucessoPermissoes('Permissões salvas no dispositivo local!');
            }
          } finally {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = icon('check') + ' Salvar Permissões na Nuvem';
            }
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
        if ($('novoUsuarioNome')) $('novoUsuarioNome').value = '';
        if ($('novoUsuarioLogin')) $('novoUsuarioLogin').value = '';
        if ($('novoUsuarioCargo')) $('novoUsuarioCargo').value = '';
        if ($('novoUsuarioSenha')) $('novoUsuarioSenha').value = '';
        if ($('modalNovoUsuario')) $('modalNovoUsuario').style.display = 'flex';
      }
      window.abrirModalNovoUsuario = abrirModalNovoUsuario;

      function fecharModalNovoUsuario() {
        if ($('modalNovoUsuario')) $('modalNovoUsuario').style.display = 'none';
      }
      window.fecharModalNovoUsuario = fecharModalNovoUsuario;

      async function confirmarNovoUsuario() {
        const nome = ($('novoUsuarioNome')?.value || '').trim();
        const login = normalizarUsuario($('novoUsuarioLogin')?.value || '');
        const cargo = ($('novoUsuarioCargo')?.value || '').trim() || 'Supervisor';
        const senha = ($('novoUsuarioSenha')?.value || '').trim();

        if (!nome || !login || !senha) {
          alert('Por favor, preencha o Nome, Login e Senha do novo usuário.');
          return;
        }

        const hash = await sha256Hex(senha);
        if (!state.permissoes.usuariosCustom) state.permissoes.usuariosCustom = [];
        state.permissoes.usuariosCustom.push({ key: login, name: nome, role: cargo });

        VALID_USERS[login] = {
          name: nome,
          hashes: [hash]
        };

        if (!state.permissoes[login]) {
          state.permissoes[login] = {
            vistorias: true,
            manutencao: true,
            ocorrencias: true,
            gastos: true,
            galeria: true,
            vendedores: true,
            frotacad: true
          };
        }

        fecharModalNovoUsuario();
        renderAdminPermissoes();
        salvarPermissoesUsuarios(true);
        mostrarToastSucessoPermissoes(`Usuário ${nome} (@${login}) cadastrado com sucesso!`);
      }
      window.confirmarNovoUsuario = confirmarNovoUsuario;

      function abrirModalAlterarSenha(uKey, uName) {
        if ($('alterarSenhaKey')) $('alterarSenhaKey').value = uKey;
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
        const uKey = $('alterarSenhaKey')?.value;
        const s1 = ($('inputNovaSenha')?.value || '').trim();
        const s2 = ($('inputConfirmarNovaSenha')?.value || '').trim();

        if (!s1 || s1.length < 4) {
          alert('A senha deve ter pelo menos 4 caracteres.');
          return;
        }
        if (s1 !== s2) {
          alert('As senhas digitadas não conferem. Confira e tente de novo.');
          return;
        }

        const hash = await sha256Hex(s1);
        if (VALID_USERS[uKey]) {
          if (!VALID_USERS[uKey].hashes) VALID_USERS[uKey].hashes = [];
          VALID_USERS[uKey].hashes.unshift(hash);
        }

        fecharModalAlterarSenha();
        salvarPermissoesUsuarios(true);
        mostrarToastSucessoPermissoes(`Senha de @${uKey} atualizada com sucesso!`);
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