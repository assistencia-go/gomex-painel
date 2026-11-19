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

        // Galeria (metadados e links no banco; imagens ficam no bucket Supabase Storage)
        const bd = stats.dbBreakdown || {};
        const galBytes = Number(bd.galeriaBytes) || 0;
        const galFotos = Number(bd.galeriaFotos) || 0;
        const galPct = Math.min(100, (galBytes / dbLimitBytes) * 100);
        const galPctText = (galPct > 0 && galPct < 0.01)
          ? '< 0,01%'
          : `${(galPct > 0 && galPct < 0.1 ? galPct.toFixed(2) : galPct.toFixed(1)).replace('.', ',')}%`;
        if ($('adminGalQuotaText')) $('adminGalQuotaText').textContent = `${formatarBytesAmigavel(galBytes)} / ${plan === 'pro' ? '8 GB' : '500 MB'}`;
        if ($('adminGalFreeText')) $('adminGalFreeText').textContent = `Fotos: ${galFotos} (links no Storage)`;
        if ($('adminGalPctText')) $('adminGalPctText').textContent = galPctText;
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
            `<span class="admin-storage-chip">Galeria Links (${galFotos} fotos): <strong>${formatarBytesAmigavel(galBytes)}</strong></span>`,
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
                const idStr = String(row.id || '');
                if (idStr === 'frota_galeria_veiculos_v1' || idStr.startsWith('frota_rec:galeria:')) {
                  galeriaBytes += bytes;
                  if (idStr.startsWith('frota_rec:galeria:')) galeriaFotos += 1;
                  else { try { galeriaFotos += JSON.parse(row.descricao || '[]').length; } catch (e) { galeriaFotos += Number(row.valor) || 0; } }
                } else if (idStr === 'frota_lancamentos_gastos_v1' || idStr === 'frota_catalogo_produtos_v1' || idStr.startsWith('frota_rec:lancamentos:') || idStr.startsWith('frota_rec:produtos:')) {
                  gastosBytes += bytes;
                } else if (idStr === 'frota_ocorrencias_v1' || idStr === 'frota_agendamentos_servicos_v1' || idStr.startsWith('frota_rec:ocorrencias:') || idStr.startsWith('frota_rec:agendamentos:')) {
                  ocorrenciasBytes += bytes;
                } else {
                  outrosParametrosBytes += bytes;
                }
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
        if ($('modalNovoUsuario')) $('modalNovoUsuario').classList.add('open');
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
        if ($('modalNovoUsuario')) $('modalNovoUsuario').classList.add('open');
      }
      window.abrirModalEditarUsuario = abrirModalEditarUsuario;

      function fecharModalNovoUsuario() {
        if ($('modalNovoUsuario')) $('modalNovoUsuario').classList.remove('open');
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
        if ($('modalAlterarSenha')) $('modalAlterarSenha').classList.add('open');
      }
      window.abrirModalAlterarSenha = abrirModalAlterarSenha;

      function fecharModalAlterarSenha() {
        if ($('modalAlterarSenha')) $('modalAlterarSenha').classList.remove('open');
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

      // ==============================================================================
      window.obterTodosUsuariosAdmin = obterTodosUsuariosAdmin;
      window.renderizarArmazenamentoSupabaseUI = renderizarArmazenamentoSupabaseUI;
