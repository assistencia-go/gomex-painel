      // GESTÃO & CONTROLE DE MANUTENÇÃO DE VEÍCULOS
      // ==============================================================================
      const MAINT_KEY_PREFIX = 'gomex_maint_data_';

      function extrairPartesObservacao(rawObs) {
        if (!rawObs) return { textoLivre: '', manutencao: null, auditoria: [] };
        let texto = String(rawObs);
        const auditoria = [];
        let manutencao = null;

        // Extrair tags de inativação e reativação
        const auditRegex = /\[(INATIVADO|REATIVADO)\s+em\s+([^\]]+)\]/gi;
        let aMatch;
        while ((aMatch = auditRegex.exec(texto)) !== null) {
          auditoria.push({ tipo: aMatch[1].toUpperCase(), detalhe: aMatch[2].trim() });
        }
        texto = texto.replace(auditRegex, '').trim();

        // Extrair tag de manutenção (suporta com ou sem colchete final se truncado)
        const maintRegex = /\[MANUTENCAO:\s*status=([^\|\]]+)(?:\|\s*oficina=([^\|\]]*))?(?:\|\s*tipo=([^\|\]]*))?(?:\|\s*entrada=([^\|\]]*))?(?:\|\s*retorno=([^\|\]]*))?(?:\|\s*custo=([^\|\]]*))?(?:\|\s*os=([^\|\]]*))?(?:\|\s*obs=([^\]]*))?\]?/i;
        const mMatch = texto.match(maintRegex);
        if (mMatch) {
          manutencao = {
            status: (mMatch[1] || '').trim(),
            oficina: (mMatch[2] || '').trim(),
            tipo: (mMatch[3] || '').trim(),
            entrada: (mMatch[4] || '').trim(),
            retorno: (mMatch[5] || '').trim(),
            custo: (mMatch[6] || '').trim(),
            os: (mMatch[7] || '').trim(),
            obs: (mMatch[8] || '').trim()
          };
          texto = texto.replace(maintRegex, '').trim();
        }
        return { textoLivre: texto, manutencao, auditoria };
      }

      function formatarObservacoesParaPdf(rawObs, item) {
        const { textoLivre, manutencao, auditoria } = extrairPartesObservacao(rawObs);
        const m = manutencao || (item ? getManutencaoData(item) : null);
        const linhas = [];

        if (m && m.status && m.status !== 'Nenhuma') {
          const isDone = m.status === 'Já foi para manutenção';
          let info = isDone ? 'Manutenção Concluída' : 'Em Manutenção';
          if (m.oficina) info += ' · Oficina: ' + m.oficina;
          if (m.tipo) info += ' (' + m.tipo + ')';
          if (m.entrada) info += ' · Entrada: ' + formatarData(m.entrada);
          if (m.retorno) info += ' · ' + (isDone ? 'Retorno: ' : 'Previsão: ') + formatarData(m.retorno);
          if (m.os) info += ' · OS: ' + m.os;
          if (m.custo) {
            const numC = parseFloat(String(m.custo).replace(/\./g, '').replace(',', '.'));
            info += ' · Custo: ' + (isNaN(numC) ? 'R$ ' + m.custo : 'R$ ' + numC.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          }
          if (m.obs) info += ' · Obs: ' + m.obs;
          linhas.push(info);
        }

        if (textoLivre) {
          linhas.push('Parecer: ' + textoLivre);
        }

        if (auditoria.length) {
          auditoria.forEach(a => {
            const rotulo = a.tipo === 'INATIVADO' ? 'Inativação' : 'Reativação';
            linhas.push('Auditoria (' + rotulo + '): ' + a.detalhe);
          });
        }

        if (!linhas.length) {
          linhas.push('Nenhuma ressalva cadastrada. Veículo em conformidade operacional.');
        }
        return linhas;
      }

      function getManutencaoData(it) {
        if (!it) return null;

        // 1. Prioriza o dado gravado no banco de dados (campo it.obs no Supabase)
        if (it.obs) {
          const m = extrairPartesObservacao(it.obs).manutencao;
          if (m && m.status && m.status !== 'Nenhuma') {
            let extra = {};
            try {
              const localById = localStorage.getItem(MAINT_KEY_PREFIX + 'id_' + it.id);
              if (localById) extra = JSON.parse(localById) || {};
            } catch (e) { }
            return {
              ...extra,
              ...m,
              updated_at: extra.data_registro || it.data || ''
            };
          }
        }

        // 2. Fallback para registro local específico desta vistoria (caso salvo offline)
        const localById = localStorage.getItem(MAINT_KEY_PREFIX + 'id_' + it.id);
        if (localById) {
          try {
            const parsed = JSON.parse(localById);
            if (parsed && parsed.status && parsed.status !== 'Nenhuma') return parsed;
          } catch (e) { }
        }

        return null;
      }

      function switchDrTab(tab) {
        if (tab === 'editar' && !podeEditar('vistorias')) {
          mostrarToastBloqueioEdicao('Vistorias');
          return;
        }
        state.activeDrTab = tab;
        const isVistoria = tab === 'vistoria';
        const isFotos = tab === 'fotos';
        const isEditar = tab === 'editar';
        const isManut = tab === 'manut';

        const tabVistoria = $('drTabBtnVistoria');
        const tabFotos = $('drTabBtnFotos');
        const tabEditar = $('drTabBtnEditar');
        const tabManut = $('drTabBtnManut');
        const paneVistoria = $('drPaneVistoria');
        const paneFotos = $('drPaneFotos');
        const paneEditar = $('drPaneEditar');
        const paneManut = $('drPaneManut');

        if (tabVistoria) tabVistoria.classList.toggle('active', isVistoria);
        if (tabFotos) tabFotos.classList.toggle('active', isFotos);
        if (tabEditar) tabEditar.classList.toggle('active', isEditar);
        if (tabManut) tabManut.classList.toggle('active', isManut);

        if (paneVistoria) paneVistoria.hidden = !isVistoria;
        if (paneFotos) paneFotos.hidden = !isFotos;
        if (paneEditar) paneEditar.hidden = !isEditar;
        if (paneManut) paneManut.hidden = !isManut;

        const drBodyEl = $('drBody');
        if (drBodyEl) drBodyEl.scrollTop = 0;

        if (isFotos) {
          if (state.sel && typeof window.renderDrawerFotos === 'function') {
            window.renderDrawerFotos(state.sel);
          }
          if (typeof window.sincronizarGastosComServidor === 'function') {
            window.sincronizarGastosComServidor('pull', { minIntervalMs: 8000 });
          }
        }
        if (isEditar && state.sel) {
          povoarFormEdicaoDrawer(state.sel);
        }
      }
      window.switchDrTab = switchDrTab;

      function filtrarTabelaManutGeral(tipo) {
        state.filtroMaintGeral = tipo;
        if ($('btnFilterMaintAll')) {
          $('btnFilterMaintAll').style.background = tipo === 'todos' ? 'var(--accent-tint)' : 'transparent';
          $('btnFilterMaintAll').style.color = tipo === 'todos' ? 'var(--accent-hi)' : '';
        }
        if ($('btnFilterMaintEm')) $('btnFilterMaintEm').style.background = tipo === 'em' ? 'rgba(245, 158, 11, 0.2)' : 'transparent';
        if ($('btnFilterMaintJa')) $('btnFilterMaintJa').style.background = tipo === 'concluidas' ? 'rgba(16, 185, 129, 0.2)' : 'transparent';
        renderManutencaoViewGeral();
      }
      window.filtrarTabelaManutGeral = filtrarTabelaManutGeral;

      function renderManutencaoViewGeral() {
        const tbody = $('maintTableBody');
        if (!tbody) return;
        const itemsComManut = [];

        // Apenas vistorias ativas (não inativadas nem de teste) aparecem no acompanhamento operacional de manutenção
        const ativos = state.all.filter(it => !isVistoriaInativaOuTeste(it));

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
          let actionBtn = '<button type="button" class="btn btn-primary" data-action="alternarVisaoPrincipal" data-arg="vistorias"><svg class="i" style="width:15px;height:15px;margin:0;"><use href="#i-truck"/></svg><span>Ir para Vistorias</span></button>';

          if (itemsComManut.length > 0 && filtro !== 'todos') {
            emptyTitle = filtro === 'em' ? 'Nenhum veículo "Em Manutenção" no momento' : 'Nenhuma manutenção "Concluída" encontrada';
            emptyDesc = 'Existem outros registros de manutenção cadastrados na frota.';
            actionBtn = '<button type="button" class="btn btn-primary" data-action="filtrarTabelaManutGeral" data-arg="todos"><svg class="i" style="width:15px;height:15px;margin:0;"><use href="#i-tool"/></svg><span>Ver Todas as Manutenções</span></button>';
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
            '<td><button type="button" class="plate" data-act="open-maint" data-id="' + esc(it.id) + '" data-action="openDrawerMaint">' + esc(it.placa || '—') + '</button></td>' +
            '<td><strong>' + esc(it.veiculo || '—') + '</strong></td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + esc(m.oficina || 'Não informada') + (m.tipo ? '<br><small class="muted">' + esc(m.tipo) + '</small>' : '') + '</td>' +
            '<td>' + (m.entrada ? formatarData(m.entrada) : '—') + '</td>' +
            '<td>' + (m.retorno ? formatarData(m.retorno) : '—') + '</td>' +
            '<td style="max-width:280px;font-size:12.5px;color:var(--ink)">' + esc(m.obs || 'Sem observações registradas') + '</td>' +
            '<td style="text-align:right">' +
            '<button type="button" class="btn btn-ghost" data-act="open-maint" data-id="' + esc(it.id) + '" data-action="openDrawerMaint" style="height:28px;padding:0 10px;font-size:12px;color:var(--accent-hi)">' +
            icon('tool') + ' <span>Observações</span>' +
            '</button>' +
            '</td>' +
            '</tr>';
        }).join('');
      }
      window.renderManutencaoViewGeral = renderManutencaoViewGeral;

      // ==============================================================================