      // GESTÃO DE EDIÇÃO DE VISTORIA & ROTA
      // ==============================================================================
      function povoarFormEdicaoDrawer(it) {
        if (!it) return;
        if ($('drEditNumeroBadge')) $('drEditNumeroBadge').textContent = 'Nº ' + (it.numero || '—') + ' · ' + (it.placa || '').toUpperCase();
        if ($('drEditRota')) $('drEditRota').value = it.rota || '';
        if ($('drEditMotorista')) $('drEditMotorista').value = it.motorista || '';
        if ($('drEditPlaca')) $('drEditPlaca').value = (it.placa || '').toUpperCase();
        if ($('drEditVeiculo')) $('drEditVeiculo').value = it.veiculo || '';
        if ($('drEditKm')) $('drEditKm').value = it.km ?? '';
        if ($('drEditData')) $('drEditData').value = it.data ? String(it.data).split('T')[0] : '';
        if ($('drEditHora')) $('drEditHora').value = it.hora || '';
        if ($('drEditTipo')) $('drEditTipo').value = it.tipo || 'Saída';
        if ($('drEditCombustivel')) $('drEditCombustivel').value = it.combustivel || 'Cheio';
        if ($('drEditLiberacao')) $('drEditLiberacao').value = it.liberacao || 'Liberado';
        if ($('drEditCondicao')) $('drEditCondicao').value = it.condicao_motorista || 'Apto';
        if ($('drEditObs')) {
          const partes = extrairPartesObservacao(it.obs || '');
          $('drEditObs').value = partes.textoLivre || '';
        }
      }

      function abrirModalEditarVistoria(target) {
        let it = null;
        if (typeof target === 'object' && target !== null) {
          it = target;
        } else if (target) {
          it = state.all.find(x => String(x.id) === String(target));
        }
        if (!it && state.sel) it = state.sel;
        if (!it) return;

        $('editVistoriaId').value = it.id;
        $('mEditNumero').textContent = it.numero || '000000';
        $('editRota').value = it.rota || '';
        $('editMotorista').value = it.motorista || '';
        $('editPlaca').value = (it.placa || '').toUpperCase();
        $('editVeiculo').value = it.veiculo || '';
        $('editKm').value = it.km ?? '';
        $('editData').value = it.data ? String(it.data).split('T')[0] : '';
        $('editHora').value = it.hora || '';
        $('editTipo').value = it.tipo || 'Saída';
        $('editCombustivel').value = it.combustivel || 'Cheio';
        $('editLiberacao').value = it.liberacao || 'Liberado';
        $('editCondicao').value = it.condicao_motorista || 'Apto';

        const partes = extrairPartesObservacao(it.obs || '');
        $('editObs').value = partes.textoLivre || '';

        $('modalEditarVistoria').classList.add('open');
        setTimeout(() => {
          const inpRota = $('editRota');
          if (inpRota) {
            inpRota.focus();
            inpRota.select();
          }
        }, 100);
      }
      window.abrirModalEditarVistoria = abrirModalEditarVistoria;

      function fecharModalEditarVistoria() {
        $('modalEditarVistoria').classList.remove('open');
      }
      window.fecharModalEditarVistoria = fecharModalEditarVistoria;

      function setEditRotaSugestao(sug) {
        const inp = $('editRota');
        if (inp) {
          inp.value = sug;
          inp.focus();
        }
      }
      window.setEditRotaSugestao = setEditRotaSugestao;

      function setDrEditRotaSugestao(sug) {
        const inp = $('drEditRota');
        if (inp) {
          inp.value = sug;
          inp.focus();
        }
      }
      window.setDrEditRotaSugestao = setDrEditRotaSugestao;

      async function salvarEdicaoVistoria(fromDrawer = false) {
        if (!podeEditar('vistorias')) {
          mostrarToastBloqueioEdicao('Vistorias');
          return;
        }
        const pfx = fromDrawer ? 'drEdit' : 'edit';
        const id = fromDrawer ? (state.sel ? state.sel.id : null) : $('editVistoriaId').value;
        if (!id) return;

        const itOriginal = state.all.find(x => String(x.id) === String(id));
        if (!itOriginal) return;

        const btn = fromDrawer ? $('btnSalvarDrEdicao') : $('btnSalvarEdicaoVistoria');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Salvando...';
        }

        const rota = $(pfx + 'Rota').value.trim() || null;
        const motorista = $(pfx + 'Motorista').value.trim() || itOriginal.motorista;
        const placa = ($(pfx + 'Placa').value.trim() || itOriginal.placa || '').toUpperCase();
        const veiculo = $(pfx + 'Veiculo').value.trim() || itOriginal.veiculo;
        const km = $(pfx + 'Km').value !== '' ? Number($(pfx + 'Km').value) : itOriginal.km;
        const data = $(pfx + 'Data').value || itOriginal.data;
        const hora = $(pfx + 'Hora').value || itOriginal.hora;
        const tipo = $(pfx + 'Tipo').value || itOriginal.tipo;
        const combustivel = $(pfx + 'Combustivel').value || itOriginal.combustivel;
        const liberacao = $(pfx + 'Liberacao').value || itOriginal.liberacao;
        const condicao_motorista = $(pfx + 'Condicao').value || itOriginal.condicao_motorista;
        const obsTexto = $(pfx + 'Obs').value.trim();

        // Preservar tags de manutenção e auditoria já existentes
        const tagsExtras = (itOriginal.obs || '').match(/\[(INATIVADO|REATIVADO|MANUTENCAO)[^\]]+\]/gi) || [];
        const obsFinal = (obsTexto + (tagsExtras.length ? (obsTexto ? '\n' : '') + tagsExtras.join('\n') : '')).trim();

        const patchData = {
          rota,
          motorista,
          placa,
          veiculo,
          km,
          data,
          hora,
          tipo,
          combustivel,
          liberacao,
          condicao_motorista,
          obs: obsFinal
        };

        try {
          const { synced } = await persistirNoBanco(id, patchData);

          if (state.sel && String(state.sel.id) === String(id)) {
            fillDrawer(state.sel);
          }

          renderAll();

          if (!fromDrawer) {
            fecharModalEditarVistoria();
          } else {
            switchDrTab('vistoria');
          }

          toast('Vistoria Nº ' + (itOriginal.numero || '') + ' salva com sucesso!');
        } catch (err) {
          console.error('Erro ao salvar edição:', err);
          toast('Erro ao atualizar. Tente novamente.', 'error');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = icon('check') + ' Salvar Alterações';
          }
        }
      }
      window.salvarEdicaoVistoria = salvarEdicaoVistoria;

      function setMaintStatus(status) {
        state.maintStatus = status;
        setMaintStatusUI(status);
      }
      window.setMaintStatus = setMaintStatus;

      function setMaintStatusUI(status) {
        const bNenhuma = $('btnMaintStatusNenhuma');
        const bEm = $('btnMaintStatusEm');
        const bJa = $('btnMaintStatusJa');
        if (bNenhuma) bNenhuma.className = 'btn-maint-status' + (status === 'Nenhuma' || !status ? ' active-nenhuma' : '');
        if (bEm) bEm.className = 'btn-maint-status' + (status === 'Em manutenção' ? ' active-em' : '');
        if (bJa) bJa.className = 'btn-maint-status' + (status === 'Já foi para manutenção' ? ' active-ja' : '');
      }

      function atualizarBadgeAbaManut(m) {
        const b = $('drTabBadgeManut');
        if (!b) return;
        if (!m || m.status === 'Nenhuma' || !m.status) {
          b.hidden = true;
        } else if (m.status === 'Em manutenção') {
          b.hidden = false;
          b.className = 'dr-tab-badge';
          b.textContent = 'Em manutenção';
        } else if (m.status === 'Já foi para manutenção') {
          b.hidden = false;
          b.className = 'dr-tab-badge done';
          b.textContent = 'Manutenção concluída';
        }
      }

      function getHistoricoManutencaoPlaca(placa) {
        if (!placa) return [];
        const p = placa.toUpperCase().trim();
        if (typeof gastosState !== 'undefined' && gastosState.historico_manutencoes && Array.isArray(gastosState.historico_manutencoes[p]) && gastosState.historico_manutencoes[p].length) {
          return gastosState.historico_manutencoes[p];
        }
        const raw = localStorage.getItem('gomex_hist_manut_' + p);
        if (!raw) return [];
        try { return JSON.parse(raw); } catch (e) { return []; }
      }

      function adicionarAoHistoricoManutencao(placa, maintObj) {
        if (!placa) return;
        const p = placa.toUpperCase().trim();
        const list = getHistoricoManutencaoPlaca(p);
        list.unshift({
          ...maintObj,
          id: Date.now(),
          placa: p,
          data_formatada: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
        const trimmed = list.slice(0, 30);
        localStorage.setItem('gomex_hist_manut_' + p, JSON.stringify(trimmed));
        if (typeof gastosState !== 'undefined') {
          if (!gastosState.historico_manutencoes || typeof gastosState.historico_manutencoes !== 'object') {
            gastosState.historico_manutencoes = {};
          }
          gastosState.historico_manutencoes[p] = trimmed;
          if (typeof sincronizarGastosComServidor === 'function') {
            sincronizarGastosComServidor('push');
          }
        }
      }

      function carregarHistoricoManutencaoUI(placa) {
        const list = getHistoricoManutencaoPlaca(placa);
        const el = $('maintHistoryList');
        const cntEl = $('maintHistCount');
        if (cntEl) cntEl.textContent = list.length + (list.length === 1 ? ' registro' : ' registros');
        if (!el) return;
        if (!list.length) {
          el.innerHTML = '<p class="muted" style="font-size:12.5px;padding:8px 0">Nenhum histórico anterior registrado para este veículo.</p>';
          return;
        }
        el.innerHTML = list.map(item => {
          const isDone = item.status === 'Já foi para manutenção';
          const statusLabel = isDone
            ? '<span style="display:inline-flex;align-items:center;gap:5px;color:#34d399">' + icon('badge-check') + ' Manutenção Concluída</span>'
            : '<span style="display:inline-flex;align-items:center;gap:5px;color:#fbbf24">' + icon('tool') + ' Em Manutenção</span>';
          return '<div class="maint-history-item' + (isDone ? ' concluida' : '') + '">' +
            '<div class="maint-history-head">' +
            '<span>' + statusLabel + '</span>' +
            '<span style="font-size:11px;color:var(--ink-3);font-weight:400">' + esc(item.data_formatada || '') + '</span>' +
            '</div>' +
            (item.oficina ? '<div style="font-size:12px;color:var(--ink-2);margin-bottom:2px;display:flex;align-items:center;gap:6px">' + icon('building') + ' <span>Oficina: <strong>' + esc(item.oficina) + '</strong>' + (item.custo ? ' · Valor: R$ ' + esc(item.custo) : '') + '</span></div>' : '') +
            (item.entrada || item.retorno ? '<div style="font-size:11.5px;color:var(--ink-3);margin-bottom:4px;display:flex;align-items:center;gap:6px">' + icon('calendar') + ' <span>Entrada: ' + (item.entrada ? formatarData(item.entrada) : '—') + ' | Retorno: ' + (item.retorno ? formatarData(item.retorno) : '—') + '</span></div>' : '') +
            '<div style="font-size:12.5px;color:var(--ink);white-space:pre-wrap;margin-top:4px">' + esc(item.obs || 'Sem observação textual') + '</div>' +
            '</div>';
        }).join('');
      }

      function carregarDadosManutencaoNoDrawer(it) {
        const m = getManutencaoData(it) || { status: 'Nenhuma', oficina: '', tipo: '', entrada: '', retorno: '', custo: '', os: '', obs: '' };
        state.maintStatus = m.status || 'Nenhuma';
        setMaintStatusUI(state.maintStatus);
        const badgeVeic = $('maintVeicBadge');
        if (badgeVeic) badgeVeic.textContent = (it.placa || '').toUpperCase() + ' · ' + (it.veiculo || '');
        if ($('maintOficina')) $('maintOficina').value = m.oficina || '';
        if ($('maintTipo')) $('maintTipo').value = m.tipo || '';
        if ($('maintDataEntrada')) $('maintDataEntrada').value = m.entrada || '';
        if ($('maintDataRetorno')) $('maintDataRetorno').value = m.retorno || '';
        if ($('maintCusto')) $('maintCusto').value = m.custo || '';
        if ($('maintOS')) $('maintOS').value = m.os || '';
        if ($('maintObsTexto')) $('maintObsTexto').value = m.obs || '';
        if ($('maintLastSavedInfo')) $('maintLastSavedInfo').textContent = m.updated_at ? 'Último registro em ' + formatarData(m.updated_at) : '';
        atualizarBadgeAbaManut(m);
        carregarHistoricoManutencaoUI((it.placa || '').toUpperCase());
        if (typeof carregarGastosPlacaNoDrawer === 'function') {
          carregarGastosPlacaNoDrawer((it.placa || '').toUpperCase());
        }
      }

      const cleanMaintField = s => String(s || '').replace(/\|/g, '·').replace(/\[/g, '(').replace(/\]/g, ')').replace(/\r?\n/g, ' / ').trim();

      async function salvarObservacoesManutencao() {
        if (!podeEditar('manutencao')) {
          mostrarToastBloqueioEdicao('Manutenções');
          return;
        }
        if (!state.sel) return;
        const it = state.sel;
        const status = state.maintStatus || 'Nenhuma';
        const oficina = cleanMaintField($('maintOficina').value);
        const tipo = cleanMaintField($('maintTipo').value);
        const entrada = $('maintDataEntrada').value;
        const retorno = $('maintDataRetorno').value;
        const custo = cleanMaintField($('maintCusto').value);
        const os = cleanMaintField($('maintOS').value);
        const obsTexto = cleanMaintField($('maintObsTexto').value);

        const btn = $('btnSalvarManutencao');
        btn.disabled = true;
        btn.textContent = 'Gravando observações...';

        const maintObj = {
          status,
          oficina,
          tipo,
          entrada,
          retorno,
          custo,
          os,
          obs: obsTexto,
          data_registro: new Date().toISOString(),
          usuario: $('userNameLabel').textContent || 'gomex'
        };

        const placa = (it.placa || '').toUpperCase().trim();
        if (status === 'Nenhuma') {
          localStorage.removeItem(MAINT_KEY_PREFIX + 'id_' + it.id);
          if (placa) localStorage.removeItem(MAINT_KEY_PREFIX + 'placa_' + placa);
        } else {
          localStorage.setItem(MAINT_KEY_PREFIX + 'id_' + it.id, JSON.stringify(maintObj));
          if (placa) {
            localStorage.setItem(MAINT_KEY_PREFIX + 'placa_' + placa, JSON.stringify(maintObj));
            adicionarAoHistoricoManutencao(placa, maintObj);
          }
        }

        let baseObs = (it.obs || '').replace(/\[MANUTENCAO:[^\]]*\]?\s*/gi, '').trim();
        let novaObs = baseObs;
        if (status !== 'Nenhuma') {
          const tag = `[MANUTENCAO: status=${status} | oficina=${oficina} | tipo=${tipo} | entrada=${entrada} | retorno=${retorno} | custo=${custo} | os=${os} | obs=${obsTexto}]`;
          novaObs = (baseObs ? baseObs + '\n' : '') + tag;
        }

        let novoStatusLiberacao = it.liberacao;
        if (status === 'Em manutenção' && it.liberacao === 'Liberado') {
          novoStatusLiberacao = 'Não liberado';
        }

        try {
          const { synced } = await persistirNoBanco(it.id, {
            obs: novaObs,
            liberacao: novoStatusLiberacao
          });

          $('drStatus').innerHTML = statusTag(novoStatusLiberacao, it.status);
          selecionarDecisao(novoStatusLiberacao);
          atualizarBadgeAbaManut(maintObj);
          carregarHistoricoManutencaoUI(placa);
          $('maintLastSavedInfo').textContent = 'Salvo às ' + new Date().toLocaleTimeString('pt-BR');
          const obsLinhas = formatarObservacoesParaPdf(novaObs, it);
          const partes = extrairPartesObservacao(novaObs);
          $('drNotesSec').hidden = !Boolean(partes.textoLivre || partes.manutencao || partes.auditoria.length);
          $('drNotes').innerHTML = obsLinhas.map(l => '<div style="margin-bottom:4px;line-height:1.45">' + esc(l) + '</div>').join('');
          renderAll();
          renderManutencaoViewGeral();
          toast('Observações de manutenção salvas com sucesso!');
        } catch (err) {
          toast('Gravado com sucesso localmente!', 'check');
          renderAll();
          renderManutencaoViewGeral();
        } finally {
          btn.disabled = false;
          btn.innerHTML = icon('check') + ' Salvar Observações de Manutenção';
        }
      }
      window.salvarObservacoesManutencao = salvarObservacoesManutencao;

      // ==============================================================================