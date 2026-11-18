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
      // ABA FOTOS DA GAVETA DE VISTORIA (ANEXO MANUAL + FOTOS DO CHECK-LIST)
      // ==============================================================================
      let _drawerFotosDraft = [];
      let _drawerFotosEventosLigados = false;

      function normalizarPlacaFoto(p) {
        return String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
      }

      function normalizarNumVistoriaFoto(n) {
        const raw = String(n == null ? '' : n).toUpperCase().trim();
        if (!raw) return '';
        const mVst = raw.match(/^(?:VST[-\s]*)?0*(\d+)$/);
        if (mVst) return mVst[1];
        return raw.replace(/^0+([1-9])/, '$1');
      }

      function normalizarDataIsoFoto(d) {
        const s = String(d || '').trim();
        if (!s) return '';
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        const mBr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (mBr) return mBr[3] + '-' + mBr[2] + '-' + mBr[1];
        return s.slice(0, 10);
      }

      function extrairNumVistoriaDaFoto(f) {
        if (!f || typeof f !== 'object') return '';
        if (f.vistoria_numero !== undefined && f.vistoria_numero !== null && String(f.vistoria_numero).trim() !== '') {
          return normalizarNumVistoriaFoto(f.vistoria_numero);
        }
        const obs = String(f.obs || '');
        const m = obs.match(/(?:Check-?list|Vistoria)\s*(?:N[º°o.]?|#)?\s*([A-Z0-9-]+)/i);
        return m ? normalizarNumVistoriaFoto(m[1]) : '';
      }

      function podeGerenciarFotosVistoria() {
        if (typeof window.podeEditar !== 'function') return true;
        return Boolean(window.podeEditar('galeria') || window.podeEditar('vistorias'));
      }
      window.podeGerenciarFotosVistoria = podeGerenciarFotosVistoria;

      function separarFotosDaVistoria(it) {
        if (!it) return { daVistoria: [], outrasPlaca: [] };
        const todos = (window.gastosState && Array.isArray(window.gastosState.galeria)) ? window.gastosState.galeria : [];
        const placaAlvo = normalizarPlacaFoto(it.placa);
        const numPrimario = normalizarNumVistoriaFoto(it.numero);
        const numAlvos = new Set([numPrimario || normalizarNumVistoriaFoto(it.id)].filter(Boolean));
        const dataAlvo = normalizarDataIsoFoto(it.data);

        const daVistoria = [];
        const outrasPlaca = [];

        for (const f of todos) {
          if (!f || !f.imagem) continue;
          const numFoto = extrairNumVistoriaDaFoto(f);
          const placaFoto = normalizarPlacaFoto(f.placa);
          const mesmaPlaca = Boolean(placaAlvo && placaFoto === placaAlvo);

          if (numFoto && numAlvos.has(numFoto) && (!placaFoto || !placaAlvo || mesmaPlaca)) {
            daVistoria.push(f);
          } else if (mesmaPlaca) {
            const dataFoto = normalizarDataIsoFoto(f.data);
            if (!numFoto && dataAlvo && dataFoto === dataAlvo) {
              daVistoria.push(f);
            } else {
              outrasPlaca.push(f);
            }
          }
        }

        const sortDesc = (a, b) => {
          const ta = Number(a.created_ts) || Date.parse(a.updated_at || a.data || '') || 0;
          const tb = Number(b.created_ts) || Date.parse(b.updated_at || b.data || '') || 0;
          return tb - ta;
        };
        daVistoria.sort(sortDesc);
        outrasPlaca.sort(sortDesc);
        return { daVistoria, outrasPlaca };
      }

      function renderCardFotoDrawer(f, isDaVistoria) {
        const fid = esc(f.id);
        const numFoto = f.vistoria_numero || extrairNumVistoriaDaFoto(f);
        const podeExcluir = typeof window.podeEditar === 'function'
          ? (window.podeEditar('galeria') || (Boolean(isDaVistoria || f.vistoria_numero) && window.podeEditar('vistorias')))
          : true;

        return '<article class="dr-foto-card">' +
          '<div class="dr-foto-img-wrap" data-action="abrirLightboxFoto" data-arg="' + fid + '" title="Clique para ampliar">' +
          '<img src="' + esc(f.imagem) + '" alt="Foto ' + esc(f.placa || '') + '" decoding="async">' +
          '<span class="dr-foto-badge-cat">' + esc(f.categoria || 'Vistoria') + '</span>' +
          '</div>' +
          '<div class="dr-foto-body">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px">' +
          '<strong style="color:var(--ink);font-size:12px">' + esc(formatarData(f.data)) + '</strong>' +
          (numFoto ? '<span class="tag tag-info" style="font-size:10.5px;padding:1px 6px">Nº ' + esc(String(numFoto).padStart(6, '0')) + '</span>' : '') +
          '</div>' +
          '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Mot.: <strong>' + esc(f.motorista || 'Não informado') + '</strong></div>' +
          (f.obs ? '<div style="font-size:11px;color:var(--ink-3);line-height:1.35;word-break:break-word">' + esc(f.obs) + '</div>' : '') +
          '</div>' +
          '<div class="dr-foto-foot">' +
          '<button type="button" class="btn btn-ghost" style="height:26px;padding:0 8px;font-size:11.5px;color:var(--accent-hi)" data-action="abrirLightboxFoto" data-arg="' + fid + '">' +
          icon('eye') + ' <span>Ampliar</span>' +
          '</button>' +
          '<div style="display:flex;gap:4px">' +
          '<button type="button" class="btn btn-ghost btn-icon" style="height:26px;width:26px" data-action="baixarFotoGaleria" data-arg="' + fid + '" title="Baixar foto">' + icon('download') + '</button>' +
          (podeExcluir
            ? '<button type="button" class="btn btn-ghost btn-icon" style="height:26px;width:26px;color:var(--bad)" data-action="excluirFotoGaleria" data-arg="' + fid + '" title="Excluir foto">' + icon('trash') + '</button>'
            : '') +
          '</div>' +
          '</div>' +
          '</article>';
      }

      function ligarEventosUploadDrawer() {
        if (_drawerFotosEventosLigados) return;
        const drop = $('drFotosDropzone');
        if (drop) {
          _drawerFotosEventosLigados = true;
          drop.addEventListener('dragover', (e) => {
            e.preventDefault();
            drop.classList.add('dragover');
          });
          drop.addEventListener('dragleave', () => {
            drop.classList.remove('dragover');
          });
          drop.addEventListener('drop', (e) => {
            e.preventDefault();
            drop.classList.remove('dragover');
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
              onSelecionarFotosDrawer(e.dataTransfer.files);
            }
          });
          document.addEventListener('paste', (e) => {
            const dr = $('drawer');
            if (!dr || !dr.classList.contains('open')) return;
            if (!window.state || window.state.activeDrTab !== 'fotos') return;
            if (!podeGerenciarFotosVistoria()) return;
            const items = e.clipboardData && e.clipboardData.items;
            if (!items) return;
            const imgFiles = [];
            for (let i = 0; i < items.length; i++) {
              if (items[i].type && items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) imgFiles.push(file);
              }
            }
            if (imgFiles.length) {
              onSelecionarFotosDrawer(imgFiles);
              toast(imgFiles.length + (imgFiles.length === 1 ? ' foto colada!' : ' fotos coladas!'));
            }
          });
        }
      }

      function renderDraftFotosDrawer() {
        const grid = $('drFotosDraftGrid');
        const statusEl = $('drFotosDraftStatus');
        const countEl = $('drFotosDraftCount');
        const lblEl = $('drFotosBtnEscolherLbl');
        const btnSalvar = $('btnSalvarFotosDrawer');
        if (!grid) return;

        const list = _drawerFotosDraft || [];
        if (!list.length) {
          grid.hidden = true;
          grid.style.display = 'none';
          grid.innerHTML = '';
          if (statusEl) {
            statusEl.hidden = true;
            statusEl.style.display = 'none';
          }
          if (lblEl) lblEl.textContent = 'Escolher Fotos';
          if (btnSalvar && !btnSalvar.disabled) {
            btnSalvar.innerHTML = icon('check') + ' <span>Salvar Fotos na Vistoria</span>';
          }
          return;
        }

        grid.hidden = false;
        grid.style.display = 'grid';
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.style.display = 'flex';
        }
        if (countEl) {
          countEl.textContent = list.length + (list.length === 1 ? ' foto pronta para salvar' : ' fotos prontas para salvar');
        }
        if (lblEl) lblEl.textContent = 'Adicionar Mais Fotos';
        if (btnSalvar && !btnSalvar.disabled) {
          btnSalvar.innerHTML = icon('check') + ' <span>Salvar ' + list.length + (list.length === 1 ? ' Foto' : ' Fotos') + ' na Vistoria</span>';
        }

        grid.innerHTML = list.map((u, idx) =>
          '<div class="dr-fotos-draft-item" title="' + esc(u.nome || ('Foto ' + (idx + 1))) + '">' +
          '<img src="' + u.dataUrl + '" alt="Prévia da foto">' +
          '<button type="button" class="dr-fotos-draft-remove" data-stop="1" data-action="removerUploadDraftDrawer" data-arg="' + idx + '" title="Remover foto da fila">x</button>' +
          '</div>'
        ).join('');
      }

      function acionarSeletorFotosDrawer() {
        if (!podeGerenciarFotosVistoria()) {
          if (typeof window.mostrarToastBloqueioEdicao === 'function') window.mostrarToastBloqueioEdicao('Vistorias');
          return;
        }
        const inp = $('drFotoFileInput');
        if (inp) inp.click();
      }
      window.acionarSeletorFotosDrawer = acionarSeletorFotosDrawer;

      async function onSelecionarFotosDrawer(fileList) {
        if (!fileList || !fileList.length) return;
        const files = Array.from(fileList).filter(f => f.type && f.type.startsWith('image/'));
        if (!files.length) {
          toast('Selecione arquivos de imagem válidos (JPG, PNG ou WEBP).', 'error');
          return;
        }
        let adicionadas = 0;
        for (const f of files) {
          try {
            const dataUrl = await comprimirImagemParaDataUrl(f);
            _drawerFotosDraft.push({
              uid: 'drf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
              nome: f.name || 'Foto',
              dataUrl
            });
            adicionadas++;
          } catch (err) { }
        }
        const inp = $('drFotoFileInput');
        if (inp) inp.value = '';
        renderDraftFotosDrawer();
        if (adicionadas > 0) {
          toast(adicionadas + (adicionadas === 1 ? ' foto selecionada! Clique em Salvar Fotos na Vistoria.' : ' fotos selecionadas! Clique em Salvar Fotos na Vistoria.'));
        }
      }
      window.onSelecionarFotosDrawer = onSelecionarFotosDrawer;

      function removerUploadDraftDrawer(idx) {
        const i = Number(idx);
        if (!Number.isNaN(i) && i >= 0 && i < _drawerFotosDraft.length) {
          _drawerFotosDraft.splice(i, 1);
          renderDraftFotosDrawer();
        }
      }
      window.removerUploadDraftDrawer = removerUploadDraftDrawer;

      function limparDraftFotosDrawer(rerender = true) {
        _drawerFotosDraft = [];
        const inp = $('drFotoFileInput');
        if (inp) inp.value = '';
        const obsEl = $('drFotoObs');
        if (obsEl) obsEl.value = '';
        if (rerender !== false) renderDraftFotosDrawer();
      }
      window.limparDraftFotosDrawer = limparDraftFotosDrawer;

      async function salvarFotosDrawer() {
        if (!podeGerenciarFotosVistoria()) {
          if (typeof window.mostrarToastBloqueioEdicao === 'function') window.mostrarToastBloqueioEdicao('Vistorias');
          return;
        }
        const it = window.state && window.state.sel;
        if (!it) {
          toast('Nenhuma vistoria selecionada.', 'error');
          return;
        }
        if (!_drawerFotosDraft.length) {
          toast('Escolha, arraste ou cole ao menos 1 foto antes de salvar.', 'error');
          return;
        }

        const btn = $('btnSalvarFotosDrawer');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Salvando fotos...';
        }

        try {
          if (!window.gastosState || typeof window.gastosState !== 'object') {
            window.gastosState = {};
          }
          if (!Array.isArray(window.gastosState.galeria)) {
            window.gastosState.galeria = [];
          }

          const placa = normalizarPlacaFoto(it.placa) || 'SEMPLACA';
          const veiculo = (it.veiculo || '').trim() || 'Veículo da Frota';
          const motorista = (it.motorista || '').trim() || 'Não informado';
          const data = normalizarDataIsoFoto(it.data) || (typeof isoLocal === 'function' ? isoLocal(new Date()) : new Date().toISOString().slice(0, 10));
          const km = it.km ? Number(it.km) : null;
          const numBruto = String(it.numero || it.id || '').trim();
          const numVist = normalizarNumVistoriaFoto(it.numero || it.id);
          const categoria = ($('drFotoCategoria')?.value || 'Estado Geral / Vistoria').trim();
          const obsDigitada = ($('drFotoObs')?.value || '').trim();
          const obsPrefix = numBruto ? ('Vistoria Nº ' + numBruto) : '';
          const obs = obsPrefix ? (obsDigitada ? obsPrefix + ' — ' + obsDigitada : obsPrefix) : obsDigitada;
          const usuarioLogado = ($('userNameLabel')?.textContent || (window.state && window.state.currentUser) || 'gomex').trim();

          const baseTs = Date.now();
          const total = _drawerFotosDraft.length;
          const novosRegistros = _drawerFotosDraft.map((u, idx) => ({
            id: 'foto_' + (baseTs + idx) + '_' + Math.random().toString(36).slice(2, 6),
            created_ts: baseTs + idx,
            placa,
            veiculo,
            data,
            motorista,
            categoria,
            km,
            obs,
            imagem: u.dataUrl,
            vistoria_numero: numVist || numBruto || '',
            registrado_por: usuarioLogado
          }));

          // DIRETRIZ PERMANENTE: Sempre usar persistencia granular por registro (frota_rec:galeria:<id>),
          // evitando leitura/reescrita do blob completo frota_galeria_veiculos_v1.
          if (typeof window.salvarRegistroFrota === 'function') {
            for (const rec of novosRegistros) {
              await window.salvarRegistroFrota('galeria', 'upsert', rec);
            }
          } else {
            for (let i = novosRegistros.length - 1; i >= 0; i--) {
              window.gastosState.galeria.unshift(novosRegistros[i]);
            }
            if (typeof window.sincronizarGastosComServidor === 'function') {
              await window.sincronizarGastosComServidor('push');
            }
          }

          limparDraftFotosDrawer(true);
          renderDrawerFotos(it);
          if (typeof window.renderGaleriaView === 'function' && ((window.state && window.state.visaoAtual === 'galeria') || (window.__isLazyLoaded && window.__isLazyLoaded('galeria')))) {
            window.renderGaleriaView();
          }
          toast(total + (total === 1 ? ' foto salva' : ' fotos salvas') + ' na vistoria!');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = icon('check') + ' <span>Salvar Fotos na Vistoria</span>';
          }
        }
      }
      window.salvarFotosDrawer = salvarFotosDrawer;

      function drawerIrParaGaleriaPlaca() {
        const it = window.state && window.state.sel;
        const placa = normalizarPlacaFoto(it && it.placa);
        if (typeof window.closeDrawer === 'function') window.closeDrawer();
        if (placa && typeof window.irParaGaleriaDaPlaca === 'function') {
          window.irParaGaleriaDaPlaca(placa);
        } else if (typeof window.alternarVisaoPrincipal === 'function') {
          window.alternarVisaoPrincipal('galeria');
        }
      }
      window.drawerIrParaGaleriaPlaca = drawerIrParaGaleriaPlaca;

      function renderDrawerFotos(it) {
        if (!it) return;
        ligarEventosUploadDrawer();

        const uploadCard = $('drFotosUploadCard');
        if (uploadCard) uploadCard.style.display = podeGerenciarFotosVistoria() ? '' : 'none';

        const vistBadge = $('drFotosVistBadge');
        if (vistBadge) {
          const numTxt = it.numero ? ('Nº ' + it.numero) : (it.id ? ('#' + it.id) : '');
          vistBadge.textContent = [normalizarPlacaFoto(it.placa) || it.placa || '—', numTxt].filter(Boolean).join(' · ');
        }

        const { daVistoria, outrasPlaca } = separarFotosDaVistoria(it);

        const tabBadge = $('drTabBadgeFotos');
        if (tabBadge) {
          tabBadge.textContent = String(daVistoria.length);
          tabBadge.hidden = daVistoria.length === 0;
        }

        const vistCountEl = $('drFotosVistoriaCount');
        if (vistCountEl) {
          vistCountEl.textContent = daVistoria.length + (daVistoria.length === 1 ? ' foto' : ' fotos');
        }

        const vistListEl = $('drFotosVistoriaList');
        if (vistListEl) {
          if (!daVistoria.length) {
            vistListEl.innerHTML = '<div style="grid-column:1/-1;padding:14px;border-radius:8px;border:1px dashed var(--line-strong);background:var(--panel-2);font-size:12.5px;color:var(--ink-3);text-align:center">Nenhuma foto vinculada a esta vistoria até o momento. Utilize a área acima para anexar fotos manualmente.</div>';
          } else {
            vistListEl.innerHTML = daVistoria.map(f => renderCardFotoDrawer(f, true)).join('');
          }
        }

        const btnGal = $('drBtnAbrirGaleriaPlaca');
        if (btnGal) btnGal.hidden = !(normalizarPlacaFoto(it.placa));

        const placaListEl = $('drFotosPlacaList');
        if (placaListEl) {
          if (!outrasPlaca.length) {
            placaListEl.innerHTML = '<div style="grid-column:1/-1;padding:12px;border-radius:8px;background:var(--panel-2);font-size:12px;color:var(--ink-3);text-align:center">Nenhuma outra foto anterior registrada para esta placa.</div>';
          } else {
            placaListEl.innerHTML = outrasPlaca.slice(0, 12).map(f => renderCardFotoDrawer(f, false)).join('');
          }
        }

        renderDraftFotosDrawer();
      }
      window.renderDrawerFotos = renderDrawerFotos;

      // ==============================================================================