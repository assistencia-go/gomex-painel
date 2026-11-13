      // MÓDULO: OCORRÊNCIAS & CONTROLE DE PAUSAS DA FROTA (MOBILE-FIRST)
      // ==============================================================================
      const ocorrenciasState = {
        filtro: 'todos',
        busca: ''
      };

      function calcularDuracaoMinutos(horaIni, horaFim) {
        if (!horaIni || !horaFim) return 0;
        const [h1, m1] = horaIni.split(':').map(Number);
        const [h2, m2] = horaFim.split(':').map(Number);
        if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
        let total1 = h1 * 60 + m1;
        let total2 = h2 * 60 + m2;
        if (total2 < total1) total2 += 24 * 60; // virada de meia-noite
        return Math.max(0, total2 - total1);
      }

      function formatarMinutosAmigavel(minutos) {
        const m = Number(minutos) || 0;
        if (m <= 0) return '0 min';
        if (m < 60) return m + ' min';
        const h = Math.floor(m / 60);
        const rest = m % 60;
        return rest > 0 ? (h + 'h ' + rest + 'min') : (h + 'h');
      }

      function formatarHoraAtual() {
        const now = new Date();
        return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      }

      function formatarDataHoje() {
        const now = new Date();
        return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      }

      function definirHoraAgora(inputId) {
        const el = $(inputId);
        if (el) {
          el.value = formatarHoraAtual();
          atualizarCalculoDuracaoModal();
        }
      }
      window.definirHoraAgora = definirHoraAgora;

      function aoMudarTipoOcorrencia(tipo) {
        if (!tipo) return;
        let tempoSug = 60;
        if (tipo.includes('Pneu')) tempoSug = 30;
        else if (tipo.includes('Óleo')) tempoSug = 45;
        else if (tipo.includes('Freio') || tipo.includes('Pastilha') || tipo.includes('Banco')) tempoSug = 90;
        else if (tipo.includes('Mecânica') || tipo.includes('Revisão')) tempoSug = 120;
        else if (tipo.includes('Bateria') || tipo.includes('Elétrica')) tempoSug = 60;
        else if (tipo.includes('Guincho')) tempoSug = 90;

        selecionarChipTempoMedioOcorrencia(tempoSug);
        atualizarCalculoDuracaoModal();
      }
      window.aoMudarTipoOcorrencia = aoMudarTipoOcorrencia;

      function selecionarChipMotivoOcorrencia(rotulo, valorSelect, tempoSugeridoMin = 60) {
        if ($('ocrSelectTipo')) {
          $('ocrSelectTipo').value = valorSelect;
        }
        const container = $('ocrChipsServicosRapidos');
        if (container) {
          const btns = container.querySelectorAll('.chip-btn');
          btns.forEach(b => {
            b.classList.toggle('active', b.textContent.trim() === rotulo.trim() || b.textContent.includes(rotulo.split(' ')[1] || ''));
          });
        }
        if ($('ocrInputDescricao') && !$('ocrInputDescricao').value.trim()) {
          $('ocrInputDescricao').value = rotulo;
        }
        selecionarChipTempoMedioOcorrencia(tempoSugeridoMin);
        atualizarCalculoDuracaoModal();
      }
      window.selecionarChipMotivoOcorrencia = selecionarChipMotivoOcorrencia;

      function selecionarChipTempoMedioOcorrencia(minutos) {
        const m = parseInt(minutos, 10) || 60;
        if ($('ocrInputTempoMedio')) {
          $('ocrInputTempoMedio').value = m;
        }
        const container = $('ocrChipsTempoMedio');
        if (container) {
          const btns = container.querySelectorAll('.chip-btn');
          btns.forEach(b => {
            const txt = b.textContent.trim();
            const coincide = (m === 15 && txt === '15m') ||
              (m === 30 && txt === '30m') ||
              (m === 45 && txt === '45m') ||
              (m === 60 && txt.startsWith('1h') && !txt.includes('30')) ||
              (m === 90 && txt.startsWith('1h 30')) ||
              (m === 120 && txt.startsWith('2h')) ||
              (m === 180 && txt.startsWith('3h')) ||
              (m === 240 && txt.startsWith('4h'));
            b.classList.toggle('active', coincide);
          });
        }
        if ($('ocrTempoMedioFormatado')) {
          $('ocrTempoMedioFormatado').textContent = formatarMinutosAmigavel(m);
        }
        atualizarCalculoDuracaoModal();
      }
      window.selecionarChipTempoMedioOcorrencia = selecionarChipTempoMedioOcorrencia;

      function aoDigitarTempoMedioOcorrencia(val) {
        const m = parseInt(val, 10) || 0;
        if ($('ocrTempoMedioFormatado')) {
          $('ocrTempoMedioFormatado').textContent = m > 0 ? formatarMinutosAmigavel(m) : 'Informe os minutos';
        }
        const container = $('ocrChipsTempoMedio');
        if (container) {
          const btns = container.querySelectorAll('.chip-btn');
          btns.forEach(b => {
            const txt = b.textContent.trim();
            const coincide = (m === 15 && txt === '15m') ||
              (m === 30 && txt === '30m') ||
              (m === 45 && txt === '45m') ||
              (m === 60 && txt.startsWith('1h') && !txt.includes('30')) ||
              (m === 90 && txt.startsWith('1h 30')) ||
              (m === 120 && txt.startsWith('2h')) ||
              (m === 180 && txt.startsWith('3h')) ||
              (m === 240 && txt.startsWith('4h'));
            b.classList.toggle('active', coincide);
          });
        }
        atualizarCalculoDuracaoModal();
      }
      window.aoDigitarTempoMedioOcorrencia = aoDigitarTempoMedioOcorrencia;

      function aoMudarDataOuHoraOcorrencia() {
        const hojeStr = formatarDataHoje();
        const agoraMs = Date.now();
        const dt = ($('ocrInputData')?.value || hojeStr).trim();
        const hr = ($('ocrInputHoraInicio')?.value || formatarHoraAtual()).trim();

        const hintBadge = $('ocrDataHintBadge');
        const ts = extrairTimestampOcorrencia(dt, hr);

        const isFutura = dt > hojeStr;
        const isHojeFuturo = (dt === hojeStr && ts && ts > agoraMs);

        if (hintBadge) {
          if (isFutura) {
            hintBadge.textContent = 'Serviço Futuro (Agendado)';
            hintBadge.style.color = '#6366f1';
          } else if (isHojeFuturo) {
            hintBadge.textContent = 'Hoje mais tarde (Agendado)';
            hintBadge.style.color = '#6366f1';
          } else {
            hintBadge.textContent = 'Em andamento / Agora';
            hintBadge.style.color = 'var(--accent-hi)';
          }
        }

        const selStatus = $('ocrSelectStatus');
        const horaFim = ($('ocrInputHoraFim')?.value || '').trim();

        if (selStatus && !horaFim) {
          if (isFutura || isHojeFuturo) {
            selStatus.value = 'agendado';
          } else if (selStatus.value === 'agendado') {
            selStatus.value = 'aberto';
          }
        }

        atualizarCalculoDuracaoModal();
      }
      window.aoMudarDataOuHoraOcorrencia = aoMudarDataOuHoraOcorrencia;

      function aoMudarStatusOcorrencia(status) {
        const horaFimEl = $('ocrInputHoraFim');
        if (status === 'finalizado') {
          if (horaFimEl && !horaFimEl.value) {
            horaFimEl.value = formatarHoraAtual();
          }
        } else if (status === 'aberto' || status === 'agendado') {
          if (horaFimEl) {
            horaFimEl.value = '';
          }
        }
        atualizarCalculoDuracaoModal();
      }
      window.aoMudarStatusOcorrencia = aoMudarStatusOcorrencia;

      function aoDigitarVendedorOcorrencia(nome) {
        if ($('ocrInputVendedor')) $('ocrInputVendedor').style.borderColor = '';
        const term = (nome || '').trim().toLowerCase();
        if (!term) return;
        const v = (gastosState.veiculos || []).find(x => (x.motorista || '').trim().toLowerCase() === term)
          || (gastosState.veiculos || []).find(x => (x.motorista || '').trim().toLowerCase().includes(term));
        if (v) {
          if ($('ocrInputRota') && !$('ocrInputRota').value && v.rota) {
            $('ocrInputRota').value = v.rota;
          }
          if ($('ocrInputVeiculo') && !$('ocrInputVeiculo').value && v.placa) {
            $('ocrInputVeiculo').value = v.placa;
          }
        }
      }
      window.aoDigitarVendedorOcorrencia = aoDigitarVendedorOcorrencia;

      function atualizarCalculoDuracaoModal() {
        const dt = ($('ocrInputData')?.value || formatarDataHoje()).trim();
        const ini = ($('ocrInputHoraInicio')?.value || formatarHoraAtual()).trim();
        const fim = ($('ocrInputHoraFim')?.value || '').trim();
        const tempoMedio = parseInt($('ocrInputTempoMedio')?.value, 10) || 60;
        const status = $('ocrSelectStatus')?.value || 'aberto';

        const txtEl = $('ocrTextoCalculoDuracao');
        const badgeEl = $('ocrBadgeCalculoDuracao');
        if (!txtEl && !badgeEl) return;

        const info = calcularStatusTempoOcorrencia({
          data: dt,
          hora_inicio: ini,
          hora_fim: fim,
          duracao_minutos: (ini && fim) ? calcularDuracaoMinutos(ini, fim) : 0,
          tempo_medio_minutos: tempoMedio,
          status: status
        });

        if (txtEl) {
          if (info.isFinalizado) {
            txtEl.innerHTML = 'Pausa finalizada · Duração total: <b style="color:var(--ok)">' + formatarMinutosAmigavel(info.tempoDecorridoMin) + '</b>';
          } else if (info.isAgendadoFuturo) {
            txtEl.innerHTML = 'Agendado para <b style="color:#6366f1">' + formatarData(dt) + ' às ' + ini + '</b> · Término previsto às <b>' + info.horaFimPrevista + '</b>';
          } else if (info.isAtrasado) {
            txtEl.innerHTML = '<span style="color:var(--bad)">Tempo Médio Excedido em +' + formatarMinutosAmigavel(info.tempoExcedidoMin) + '! Término previsto era ' + info.horaFimPrevista + '</span>';
          } else {
            txtEl.innerHTML = 'Em andamento · Restam <b>' + formatarMinutosAmigavel(info.tempoRestanteMin) + '</b> (Término previsto: <b>' + info.horaFimPrevista + '</b>)';
          }
        }

        if (badgeEl) {
          if (info.isFinalizado) {
            badgeEl.innerHTML = '<span class="badge-status-pausa finalizado"><svg class="i" style="width:12px;height:12px"><use href="#i-check" /></svg> Concluído</span>';
          } else if (info.isAgendadoFuturo) {
            badgeEl.innerHTML = '<span class="badge-status-pausa agendado">Agendada (Sem contagem)</span>';
          } else if (info.isAtrasado) {
            badgeEl.innerHTML = '<span class="badge-status-pausa atrasado"><span class="pulse-dot-red"></span> ' + esc(info.badgeTexto) + '</span>';
          } else {
            badgeEl.innerHTML = '<span class="badge-status-pausa no-prazo">' + esc(info.badgeTexto) + '</span>';
          }
        }
      }
      window.atualizarCalculoDuracaoModal = atualizarCalculoDuracaoModal;

      function abrirModalOcorrencia(id = '') {
        if (!podeEditar('ocorrencias')) {
          mostrarToastBloqueioEdicao('Ocorrências');
          return;
        }
        popularDatalistEPlacasNoModalGasto();
        const ocr = id ? (gastosState.ocorrencias || []).find(x => String(x.id) === String(id)) : null;

        if ($('ocrEditId')) $('ocrEditId').value = ocr ? ocr.id : '';
        if ($('ocrModalTitle')) $('ocrModalTitle').textContent = ocr ? ('Editar Ocorrência · ' + (ocr.vendedor || 'Frota')) : 'Nova Ocorrência / Agendar Serviço';
        if ($('lblBtnSalvarOcorrencia')) $('lblBtnSalvarOcorrencia').textContent = ocr ? 'Atualizar Registro' : 'Salvar Ocorrência';

        if ($('ocrInputVendedor')) {
          $('ocrInputVendedor').value = ocr ? (ocr.vendedor || '') : '';
          $('ocrInputVendedor').style.borderColor = '';
        }
        if ($('ocrInputRota')) {
          $('ocrInputRota').value = ocr ? (ocr.rota || '') : '';
          $('ocrInputRota').style.borderColor = '';
        }
        if ($('ocrInputVeiculo')) $('ocrInputVeiculo').value = ocr ? (ocr.veiculo || ocr.placa || '') : '';
        if ($('ocrSelectTipo')) $('ocrSelectTipo').value = ocr ? (ocr.tipo || 'Pneu Furado / Borracharia') : 'Pneu Furado / Borracharia';
        if ($('ocrInputData')) $('ocrInputData').value = ocr ? (ocr.data || formatarDataHoje()) : formatarDataHoje();
        if ($('ocrInputHoraInicio')) $('ocrInputHoraInicio').value = ocr ? (ocr.hora_inicio || formatarHoraAtual()) : formatarHoraAtual();
        if ($('ocrInputHoraFim')) $('ocrInputHoraFim').value = ocr ? (ocr.hora_fim || '') : '';

        const tempoMedio = ocr ? (parseInt(ocr.tempo_medio_minutos, 10) || 60) : 60;
        selecionarChipTempoMedioOcorrencia(tempoMedio);

        if ($('ocrSelectStatus')) {
          if (ocr) {
            $('ocrSelectStatus').value = ocr.status || 'aberto';
          } else {
            $('ocrSelectStatus').value = 'aberto';
          }
        }
        if ($('ocrInputLocal')) $('ocrInputLocal').value = ocr ? (ocr.local || '') : '';
        if ($('ocrInputDescricao')) $('ocrInputDescricao').value = ocr ? (ocr.descricao || '') : '';
        if ($('ocrInputCusto')) $('ocrInputCusto').value = (ocr && ocr.custo !== undefined) ? ocr.custo : '';
        if ($('ocrInputResponsavel')) $('ocrInputResponsavel').value = ocr ? (ocr.responsavel || 'Hendreo') : 'Hendreo';

        aoMudarDataOuHoraOcorrencia();
        if ($('modalOcorrencia')) $('modalOcorrencia').classList.add('open');
        setTimeout(() => { if ($('ocrInputVendedor')) $('ocrInputVendedor').focus(); }, 120);
      }
      window.abrirModalOcorrencia = abrirModalOcorrencia;

      function fecharModalOcorrencia() {
        if ($('modalOcorrencia')) $('modalOcorrencia').classList.remove('open');
      }
      window.fecharModalOcorrencia = fecharModalOcorrencia;

      if ($('modalOcorrencia')) {
        $('modalOcorrencia').addEventListener('click', e => {
          if (e.target === $('modalOcorrencia')) fecharModalOcorrencia();
        });
      }

      async function salvarOcorrencia() {
        if (!podeEditar('ocorrencias')) {
          mostrarToastBloqueioEdicao('Ocorrências');
          return;
        }
        const vendedor = ($('ocrInputVendedor')?.value || '').trim();
        if (!vendedor) {
          if ($('ocrInputVendedor')) {
            $('ocrInputVendedor').style.borderColor = 'var(--bad)';
            $('ocrInputVendedor').focus();
          }
          toast('O nome do vendedor é obrigatório para registrar a ocorrência!', 'error');
          return;
        }

        const rota = ($('ocrInputRota')?.value || '').trim();
        if (!rota) {
          if ($('ocrInputRota')) {
            $('ocrInputRota').style.borderColor = 'var(--bad)';
            $('ocrInputRota').focus();
          }
          toast('A rota do vendedor é obrigatória!', 'error');
          return;
        }

        const editId = ($('ocrEditId')?.value || '').trim();
        const data = ($('ocrInputData')?.value || '').trim() || formatarDataHoje();
        const horaInicio = ($('ocrInputHoraInicio')?.value || '').trim() || formatarHoraAtual();
        const horaFim = ($('ocrInputHoraFim')?.value || '').trim();
        const tempoMedioMin = parseInt($('ocrInputTempoMedio')?.value, 10) || 60;
        const tipo = $('ocrSelectTipo')?.value || 'Pneu Furado / Borracharia';
        const veiculo = ($('ocrInputVeiculo')?.value || '').trim().toUpperCase();
        const local = ($('ocrInputLocal')?.value || '').trim();
        const descricao = ($('ocrInputDescricao')?.value || '').trim();
        const custo = parseFloat($('ocrInputCusto')?.value) || 0;
        const responsavel = ($('ocrInputResponsavel')?.value || '').trim() || 'Hendreo';
        let status = $('ocrSelectStatus')?.value || 'aberto';

        // Auto-detecção de agendamento se for data futura e não estiver finalizado
        const hojeStr = formatarDataHoje();
        const agoraMs = Date.now();
        const tsInicio = extrairTimestampOcorrencia(data, horaInicio);
        const isDataFutura = data > hojeStr;
        const isHorarioFuturoHoje = data === hojeStr && tsInicio && tsInicio > agoraMs;

        if (horaFim) {
          status = 'finalizado';
        } else if (isDataFutura || isHorarioFuturoHoje) {
          status = 'agendado';
        }

        const duracaoMinutos = (horaInicio && horaFim)
          ? calcularDuracaoMinutos(horaInicio, horaFim)
          : 0;

        const btn = $('btnSalvarOcorrencia');
        if (btn) btn.disabled = true;

        if (!Array.isArray(gastosState.ocorrencias)) {
          gastosState.ocorrencias = [];
        }

        if (editId) {
          const idx = gastosState.ocorrencias.findIndex(x => String(x.id) === String(editId));
          if (idx >= 0) {
            gastosState.ocorrencias[idx] = {
              ...gastosState.ocorrencias[idx],
              vendedor,
              rota,
              veiculo,
              placa: veiculo.replace(/[^A-Z0-9]/g, '').slice(0, 7),
              tipo,
              data,
              hora_inicio: horaInicio,
              hora_fim: horaFim,
              duracao_minutos: duracaoMinutos,
              tempo_medio_minutos: tempoMedioMin,
              status,
              local,
              descricao,
              custo,
              responsavel,
              atualizado_em: new Date().toISOString()
            };
          }
        } else {
          const nova = {
            id: 'ocr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            vendedor,
            rota,
            veiculo,
            placa: veiculo.replace(/[^A-Z0-9]/g, '').slice(0, 7),
            tipo,
            data,
            hora_inicio: horaInicio,
            hora_fim: horaFim,
            duracao_minutos: duracaoMinutos,
            tempo_medio_minutos: tempoMedioMin,
            status,
            local,
            descricao,
            custo,
            responsavel,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          };
          gastosState.ocorrencias.unshift(nova);
        }

        try {
          await sincronizarGastosComServidor('push');
          fecharModalOcorrencia();
          renderOcorrenciasView();
          toast(editId ? ('Registro de ' + vendedor + ' atualizado!') : ((status === 'agendado' ? 'Serviço agendado' : 'Ocorrência registrada') + ' para ' + vendedor + ' (Rota ' + rota + ')!'));
        } finally {
          if (btn) btn.disabled = false;
        }
      }
      window.salvarOcorrencia = salvarOcorrencia;

      async function iniciarOcorrenciaAgendadaRapida(id) {
        const ocr = (gastosState.ocorrencias || []).find(x => String(x.id) === String(id));
        if (!ocr) return;

        ocr.status = 'aberto';
        ocr.data = formatarDataHoje();
        ocr.hora_inicio = formatarHoraAtual();
        ocr.hora_fim = '';
        ocr.atualizado_em = new Date().toISOString();

        await sincronizarGastosComServidor('push');
        renderOcorrenciasView();
        toast('Serviço de ' + ocr.vendedor + ' iniciado agora às ' + ocr.hora_inicio + '! Tempo médio correndo.');
      }
      window.iniciarOcorrenciaAgendadaRapida = iniciarOcorrenciaAgendadaRapida;

      async function finalizarPausaRapida(id) {
        const ocr = (gastosState.ocorrencias || []).find(x => String(x.id) === String(id));
        if (!ocr) return;

        const horaAgora = formatarHoraAtual();
        ocr.hora_fim = horaAgora;
        ocr.status = 'finalizado';
        ocr.duracao_minutos = calcularDuracaoMinutos(ocr.hora_inicio || horaAgora, horaAgora);
        ocr.atualizado_em = new Date().toISOString();

        await sincronizarGastosComServidor('push');
        renderOcorrenciasView();
        toast('Pausa de ' + ocr.vendedor + ' finalizada! Duração: ' + formatarMinutosAmigavel(ocr.duracao_minutos));
      }
      window.finalizarPausaRapida = finalizarPausaRapida;

      async function excluirOcorrencia(id) {
        if (!podeEditar('ocorrencias')) {
          mostrarToastBloqueioEdicao('Ocorrências');
          return;
        }
        const ocr = (gastosState.ocorrencias || []).find(x => String(x.id) === String(id));
        if (!ocr) return;

        const confirmado = await abrirConfirmacaoGlobal({
          titulo: 'Excluir Ocorrência',
          subtitulo: 'Confirmação de segurança',
          mensagem: `Deseja realmente excluir a ocorrência de <strong>${esc(ocr.vendedor)}</strong> (Rota <strong>${esc(ocr.rota)}</strong>)?`,
          aviso: 'Esta exclusão removerá o registro e recalculará os tempos de pausa da frota.',
          textoConfirmar: 'Excluir Ocorrência',
          variante: 'perigo',
          icone: 'trash'
        });
        if (!confirmado) return;

        gastosState.ocorrencias = (gastosState.ocorrencias || []).filter(x => String(x.id) !== String(id));
        try {
          await sincronizarGastosComServidor('push');
          renderOcorrenciasView();
          toast('Ocorrência de ' + (ocr ? ocr.vendedor : '') + ' excluída com sucesso.');
        } catch (e) {
          console.error(e);
          toast('Erro ao excluir ocorrência. Tente novamente.', 'error');
        }
      }
      window.excluirOcorrencia = excluirOcorrencia;

      // ==============================================================================
      // RELATÓRIO DE OCORRÊNCIAS & CONTROLE DE PAUSAS (X ATÉ Y)
      // ==============================================================================
      function abrirModalRelatorioOcorrencias() {
        const selVend = $('ocrRelVendedor');
        if (selVend) {
          const mots = obterTodosMotoristasConhecidos();
          selVend.innerHTML = '<option value="">Todos os vendedores</option>' +
            mots.map(m => '<option value="' + esc(m) + '">' + esc(m) + '</option>').join('');
        }

        aplicarPeriodoRelatorioOcr('mes');

        if ($('modalRelatorioOcorrencias')) $('modalRelatorioOcorrencias').classList.add('open');
      }
      window.abrirModalRelatorioOcorrencias = abrirModalRelatorioOcorrencias;

      function fecharModalRelatorioOcorrencias() {
        if ($('modalRelatorioOcorrencias')) $('modalRelatorioOcorrencias').classList.remove('open');
      }
      window.fecharModalRelatorioOcorrencias = fecharModalRelatorioOcorrencias;

      if ($('modalRelatorioOcorrencias')) {
        $('modalRelatorioOcorrencias').addEventListener('click', e => {
          if (e.target === $('modalRelatorioOcorrencias')) fecharModalRelatorioOcorrencias();
        });
      }

      function aplicarPeriodoRelatorioOcr(tipo) {
        ['Hoje', '7d', '15d', 'Mes', 'Tudo'].forEach(t => {
          const btn = $('btnRelPeriodo' + t);
          if (btn) btn.classList.remove('active');
        });

        const now = new Date();
        const fmtD = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

        let dtIni = '';
        let dtFim = fmtD(now);

        if (tipo === 'hoje') {
          dtIni = fmtD(now);
          if ($('btnRelPeriodoHoje')) $('btnRelPeriodoHoje').classList.add('active');
        } else if (tipo === '7d') {
          const d7 = new Date();
          d7.setDate(d7.getDate() - 6);
          dtIni = fmtD(d7);
          if ($('btnRelPeriodo7d')) $('btnRelPeriodo7d').classList.add('active');
        } else if (tipo === '15d') {
          const d15 = new Date();
          d15.setDate(d15.getDate() - 14);
          dtIni = fmtD(d15);
          if ($('btnRelPeriodo15d')) $('btnRelPeriodo15d').classList.add('active');
        } else if (tipo === 'mes') {
          const primeiroDia = new Date(now.getFullYear(), now.getMonth(), 1);
          dtIni = fmtD(primeiroDia);
          if ($('btnRelPeriodoMes')) $('btnRelPeriodoMes').classList.add('active');
        } else if (tipo === 'tudo') {
          dtIni = '2020-01-01';
          dtFim = '2030-12-31';
          if ($('btnRelPeriodoTudo')) $('btnRelPeriodoTudo').classList.add('active');
        }

        if ($('ocrRelDataInicio')) $('ocrRelDataInicio').value = dtIni;
        if ($('ocrRelDataFim')) $('ocrRelDataFim').value = dtFim;

        atualizarPreviaRelatorioOcr();
      }
      window.aplicarPeriodoRelatorioOcr = aplicarPeriodoRelatorioOcr;

      function obterOcorrenciasFiltradasRelatorio() {
        const todas = Array.isArray(gastosState.ocorrencias) ? gastosState.ocorrencias : [];
        const dtIni = ($('ocrRelDataInicio')?.value || '').trim();
        const dtFim = ($('ocrRelDataFim')?.value || '').trim();
        const vend = ($('ocrRelVendedor')?.value || '').trim().toLowerCase();
        const status = ($('ocrRelStatus')?.value || '').trim();

        return todas.filter(item => {
          const dt = (item.data || '').slice(0, 10);
          if (dtIni && dt < dtIni) return false;
          if (dtFim && dt > dtFim) return false;
          if (vend && !(item.vendedor || '').toLowerCase().includes(vend)) return false;
          if (status && item.status !== status) return false;
          return true;
        });
      }

      function atualizarPreviaRelatorioOcr() {
        const lista = obterOcorrenciasFiltradasRelatorio();
        const horaAgora = formatarHoraAtual();

        let totalMinutos = 0;
        let totalCusto = 0;

        lista.forEach(x => {
          totalCusto += Number(x.custo) || 0;
          if (x.status === 'finalizado') {
            totalMinutos += Number(x.duracao_minutos) || 0;
          } else if (x.status === 'aberto') {
            totalMinutos += calcularDuracaoMinutos(x.hora_inicio, horaAgora);
          }
        });

        const mediaMinutos = lista.length > 0 ? Math.round(totalMinutos / lista.length) : 0;

        if ($('ocrRelTotalOcr')) $('ocrRelTotalOcr').textContent = lista.length;
        if ($('ocrRelTempoTotal')) $('ocrRelTempoTotal').textContent = formatarMinutosAmigavel(totalMinutos);
        if ($('ocrRelTempoMedio')) $('ocrRelTempoMedio').textContent = formatarMinutosAmigavel(mediaMinutos);
        if ($('ocrRelCustoTotal')) $('ocrRelCustoTotal').textContent = fmtMoeda(totalCusto);
        if ($('ocrRelContadorPrevia')) $('ocrRelContadorPrevia').textContent = lista.length + ' ocorrência(s) encontrada(s)';

        const container = $('ocrRelListaPrevia');
        if (!container) return;

        if (!lista.length) {
          container.innerHTML = `
            <div style="text-align:center;padding:24px 12px;color:var(--ink-3);font-size:13px">
              Nenhuma ocorrência encontrada para o período selecionado.
            </div>
          `;
          return;
        }

        container.innerHTML = `
          <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left">
            <thead>
              <tr style="border-bottom:1px solid var(--line);background:var(--panel);color:var(--ink-3);font-weight:700">
                <th style="padding:8px 10px">Data</th>
                <th style="padding:8px 10px">Vendedor / Rota</th>
                <th style="padding:8px 10px">Motivo</th>
                <th style="padding:8px 10px">Horário</th>
                <th style="padding:8px 10px">Duração</th>
                <th style="padding:8px 10px">Status</th>
              </tr>
            </thead>
            <tbody>
              ${lista.map((x, idx) => `
                <tr style="border-bottom:1px solid var(--line);${idx % 2 === 0 ? 'background:transparent' : 'background:rgba(255,255,255,0.02)'}">
                  <td style="padding:8px 10px;white-space:nowrap">${formatarData(x.data)}</td>
                  <td style="padding:8px 10px;font-weight:600;color:var(--ink)">
                    ${esc(x.vendedor)} <span class="badge-rota" style="font-size:10px;padding:1px 5px">Rota ${esc(x.rota)}</span>
                  </td>
                  <td style="padding:8px 10px;color:var(--ink-2)">${esc(x.tipo || 'Ocorrência')}</td>
                  <td style="padding:8px 10px;white-space:nowrap;color:var(--ink-3)">${esc(x.hora_inicio || '--:--')} às ${esc(x.hora_fim || '--:--')}</td>
                  <td style="padding:8px 10px;font-weight:700;color:${x.status === 'aberto' ? 'var(--warn)' : 'var(--ok)'}">
                    ${x.status === 'aberto' ? 'Em aberto' : formatarMinutosAmigavel(x.duracao_minutos)}
                  </td>
                  <td style="padding:8px 10px">
                    <span style="font-size:11px;font-weight:700;color:${x.status === 'aberto' ? 'var(--bad)' : 'var(--ok)'}">
                      ${x.status === 'aberto' ? 'Em Pausa' : 'Liberado'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
      window.atualizarPreviaRelatorioOcr = atualizarPreviaRelatorioOcr;

      function exportarCsvOcorrencias() {
        const lista = obterOcorrenciasFiltradasRelatorio();
        if (!lista.length) {
          toast('Nenhuma ocorrência encontrada para exportar no período.', 'error');
          return;
        }

        const csvCell = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
        const headers = [
          'Data',
          'Hora Inicio',
          'Hora Fim',
          'Duracao (min)',
          'Duracao Formatada',
          'Vendedor',
          'Rota',
          'Veiculo',
          'Placa',
          'Motivo / Problema',
          'Local',
          'Custo (R$)',
          'Status',
          'Registrado por',
          'Descricao / Servico'
        ];

        const rows = lista.map(x => [
          formatarData(x.data),
          x.hora_inicio || '',
          x.hora_fim || '',
          String(x.duracao_minutos || 0),
          formatarMinutosAmigavel(x.duracao_minutos),
          x.vendedor || '',
          x.rota || '',
          x.veiculo || '',
          x.placa || '',
          x.tipo || '',
          x.local || '',
          Number(x.custo || 0).toFixed(2).replace('.', ','),
          x.status === 'aberto' ? 'Em Aberto / Parado' : 'Finalizada / Liberado',
          x.responsavel || '',
          x.descricao || ''
        ].map(csvCell).join(';'));

        const csv = '\uFEFF' + [headers.map(csvCell).join(';'), ...rows].join('\r\n');
        const dtIni = ($('ocrRelDataInicio')?.value || 'inicio').replace(/-/g, '');
        const dtFim = ($('ocrRelDataFim')?.value || 'fim').replace(/-/g, '');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Gomex_Ocorrencias_Frota_${dtIni}_a_${dtFim}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast(`${lista.length} ocorrência(s) exportada(s) para Excel (CSV)!`);
      }
      window.exportarCsvOcorrencias = exportarCsvOcorrencias;

      function gerarPdfRelatorioOcorrencias() {
        const lista = obterOcorrenciasFiltradasRelatorio();
        if (!lista.length) {
          toast('Nenhuma ocorrência encontrada para gerar relatório PDF.', 'error');
          return;
        }

        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

          const M = 10;
          const W = 277;
          const ROXO = [30, 42, 120];
          const CINZA = [90, 95, 110];
          const LINHA = [210, 215, 225];

          const fonte = (tam, estilo = 'normal', cor = [20, 20, 30]) => {
            doc.setFont('helvetica', estilo);
            doc.setFontSize(tam);
            doc.setTextColor(...cor);
          };

          const corta = (txt, maxW) => {
            const l = doc.splitTextToSize(String(txt || ''), maxW);
            return l[0] || '';
          };

          const dtIni = $('ocrRelDataInicio')?.value ? formatarData($('ocrRelDataInicio').value) : 'Início';
          const dtFim = $('ocrRelDataFim')?.value ? formatarData($('ocrRelDataFim').value) : 'Hoje';

          let totalMinutos = 0;
          let totalCusto = 0;
          lista.forEach(x => {
            totalMinutos += Number(x.duracao_minutos) || 0;
            totalCusto += Number(x.custo) || 0;
          });

          // Cabeçalho Oficial
          fonte(14, 'bold', ROXO);
          doc.text('GOMEX DISTRIBUIDORA DE ALIMENTOS', M, 14);

          fonte(10, 'bold', [30, 30, 40]);
          doc.text('RELATÓRIO EXECUTIVO DE OCORRÊNCIAS & CONTROLE DE PAUSAS DA FROTA', M, 20);

          fonte(8.5, 'normal', CINZA);
          const agoraStr = new Date().toLocaleString('pt-BR');
          doc.text(`Período analisado: De ${dtIni} até ${dtFim}  ·  Emitido em: ${agoraStr} por Hendreo`, M, 25);

          // Card de Indicadores no Topo
          doc.setFillColor(245, 247, 250);
          doc.setDrawColor(...LINHA);
          doc.roundedRect(M, 28, W, 14, 2, 2, 'FD');

          fonte(8, 'bold', CINZA);
          doc.text('TOTAL DE OCORRÊNCIAS', M + 8, 33);
          doc.text('TEMPO TOTAL PARADO', M + 70, 33);
          doc.text('MÉDIA POR PARADA', M + 140, 33);
          doc.text('TOTAL DE DESPESAS', M + 210, 33);

          fonte(10.5, 'bold', ROXO);
          doc.text(String(lista.length), M + 8, 39);
          doc.text(formatarMinutosAmigavel(totalMinutos), M + 70, 39);
          doc.text(formatarMinutosAmigavel(lista.length ? Math.round(totalMinutos / lista.length) : 0), M + 140, 39);
          doc.text(fmtMoeda(totalCusto), M + 210, 39);

          // Tabela de Ocorrências
          let y = 48;
          const colW = [22, 18, 18, 20, 52, 26, 42, 40, 22, 17];
          const headers = ['DATA', 'INÍCIO', 'FIM', 'DURAÇÃO', 'VENDEDOR / ROTA', 'PLACA / VEÍC', 'MOTIVO / PROBLEMA', 'LOCAL', 'CUSTO', 'STATUS'];

          const desenharCabecalho = () => {
            doc.setFillColor(30, 42, 120);
            doc.rect(M, y, W, 7, 'F');
            fonte(7.5, 'bold', [255, 255, 255]);
            let xOff = M;
            headers.forEach((h, i) => {
              doc.text(h, xOff + 2, y + 4.8);
              xOff += colW[i];
            });
            y += 7;
          };

          desenharCabecalho();

          lista.forEach((item, idx) => {
            if (y > 185) {
              doc.addPage('a4', 'landscape');
              y = 15;
              desenharCabecalho();
            }

            if (idx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(M, y, W, 6.5, 'F');
            }

            doc.setDrawColor(230, 235, 245);
            doc.line(M, y + 6.5, M + W, y + 6.5);

            fonte(7.2, 'normal', [30, 35, 45]);
            let xOff = M;

            doc.text(formatarData(item.data), xOff + 2, y + 4.5); xOff += colW[0];
            doc.text(item.hora_inicio || '--:--', xOff + 2, y + 4.5); xOff += colW[1];
            doc.text(item.hora_fim || '--:--', xOff + 2, y + 4.5); xOff += colW[2];

            fonte(7.2, 'bold', item.status === 'aberto' ? [180, 80, 10] : [20, 120, 60]);
            doc.text(item.status === 'aberto' ? 'Em aberto' : formatarMinutosAmigavel(item.duracao_minutos), xOff + 2, y + 4.5); xOff += colW[3];

            fonte(7.2, 'bold', [20, 20, 30]);
            doc.text(corta(`${item.vendedor || ''} (Rota ${item.rota || ''})`, colW[4] - 3), xOff + 2, y + 4.5); xOff += colW[4];

            fonte(7.2, 'normal', [40, 45, 55]);
            doc.text(corta(item.veiculo || item.placa || '—', colW[5] - 3), xOff + 2, y + 4.5); xOff += colW[5];
            doc.text(corta(item.tipo || 'Ocorrência', colW[6] - 3), xOff + 2, y + 4.5); xOff += colW[6];
            doc.text(corta(item.local || '—', colW[7] - 3), xOff + 2, y + 4.5); xOff += colW[7];

            doc.text(item.custo ? fmtMoeda(item.custo) : '—', xOff + 2, y + 4.5); xOff += colW[8];

            fonte(7.2, 'bold', item.status === 'aberto' ? [185, 28, 28] : [21, 128, 61]);
            doc.text(item.status === 'aberto' ? 'Em Pausa' : 'Liberado', xOff + 2, y + 4.5);

            y += 6.5;
          });

          // Rodapé do PDF
          const paginas = doc.internal.getNumberOfPages();
          for (let p = 1; p <= paginas; p++) {
            doc.setPage(p);
            fonte(7, 'normal', CINZA);
            doc.text(`Gomex Distribuidora · Página ${p} de ${paginas}`, M, 202);
            doc.text('Relatório emitido para auditoria interna da frota', M + W - 60, 202);
          }

          const blobUrl = doc.output('bloburl');
          window.open(blobUrl, '_blank');
          toast('Relatório PDF oficial gerado com sucesso!');
        } catch (err) {
          console.error(err);
          toast('Erro ao gerar relatório PDF: ' + err.message, 'error');
        }
      }
      window.gerarPdfRelatorioOcorrencias = gerarPdfRelatorioOcorrencias;

      async function copiarResumoRelatorioWhatsApp() {
        const lista = obterOcorrenciasFiltradasRelatorio();
        if (!lista.length) {
          toast('Nenhuma ocorrência encontrada para o resumo.', 'error');
          return;
        }

        const dtIni = $('ocrRelDataInicio')?.value ? formatarData($('ocrRelDataInicio').value) : 'Início';
        const dtFim = $('ocrRelDataFim')?.value ? formatarData($('ocrRelDataFim').value) : 'Hoje';

        let totalMinutos = 0;
        let totalCusto = 0;
        const porVendedor = new Map();

        lista.forEach(x => {
          totalMinutos += Number(x.duracao_minutos) || 0;
          totalCusto += Number(x.custo) || 0;
          const k = `${x.vendedor || 'Outro'} (Rota ${x.rota || '—'})`;
          if (!porVendedor.has(k)) porVendedor.set(k, { count: 0, minutos: 0, custo: 0 });
          const item = porVendedor.get(k);
          item.count++;
          item.minutos += Number(x.duracao_minutos) || 0;
          item.custo += Number(x.custo) || 0;
        });

        const linhasVend = Array.from(porVendedor.entries()).map(([k, v]) =>
          `• ${k}: ${v.count} pausa(s) · Total: ${formatarMinutosAmigavel(v.minutos)}${v.custo > 0 ? ' · ' + fmtMoeda(v.custo) : ''}`
        );

        const msg = [
          '*RELATÓRIO CONSOLIDADO DE PAUSAS DA FROTA · GOMEX*',
          `*Período:* De ${dtIni} até ${dtFim}`,
          '',
          `*Total de Ocorrências:* ${lista.length}`,
          `*Tempo Total Parado:* ${formatarMinutosAmigavel(totalMinutos)}`,
          `*Média por Parada:* ${formatarMinutosAmigavel(lista.length ? Math.round(totalMinutos / lista.length) : 0)}`,
          totalCusto > 0 ? `*Total de Despesas:* ${fmtMoeda(totalCusto)}` : '',
          '',
          '*Detalhamento por Vendedor:*',
          ...linhasVend,
          '',
          '*Responsável:* Hendreo'
        ].filter(Boolean).join('\n');

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
          try { document.execCommand('copy'); copiou = true; } catch (e) {}
          document.body.removeChild(ta);
        }
        toast('Resumo consolidado copiado para o WhatsApp!');
      }
      window.copiarResumoRelatorioWhatsApp = copiarResumoRelatorioWhatsApp;

      // ==============================================================================
      // MÓDULO: CONTROLE DE TEMPO & STATUS DE OCORRÊNCIAS / AGENDAMENTOS
      // ==============================================================================
      function extrairTimestampOcorrencia(dataStr, horaStr) {
        if (!dataStr) return null;
        const partesD = String(dataStr).slice(0, 10).split('-').map(Number);
        if (partesD.length < 3 || isNaN(partesD[0])) return null;
        const ano = partesD[0];
        const mes = partesD[1] - 1;
        const dia = partesD[2];
        let hora = 8, min = 0;
        if (horaStr) {
          const partesH = String(horaStr).slice(0, 5).split(':').map(Number);
          if (!isNaN(partesH[0])) hora = partesH[0];
          if (!isNaN(partesH[1])) min = partesH[1];
        }
        return new Date(ano, mes, dia, hora, min, 0, 0).getTime();
      }
      window.extrairTimestampOcorrencia = extrairTimestampOcorrencia;

      function calcularStatusTempoOcorrencia(item, agoraMs = Date.now()) {
        const hojeStr = formatarDataHoje();
        const dt = (item.data || hojeStr).slice(0, 10);
        const hrIni = (item.hora_inicio || '08:00').slice(0, 5);
        const tempoMedioMin = parseInt(item.tempo_medio_minutos, 10) || 60;
        const status = item.status || 'aberto';

        const inicioMs = extrairTimestampOcorrencia(dt, hrIni) || agoraMs;
        const fimPrevistoMs = inicioMs + (tempoMedioMin * 60000);
        const fimPrevistoDate = new Date(fimPrevistoMs);
        const horaFimPrevista = String(fimPrevistoDate.getHours()).padStart(2, '0') + ':' + String(fimPrevistoDate.getMinutes()).padStart(2, '0');

        // 1. Caso Finalizado / Liberado
        if (status === 'finalizado') {
          let duracaoRealMin = Number(item.duracao_minutos) || 0;
          if (!duracaoRealMin && item.hora_fim) {
            duracaoRealMin = calcularDuracaoMinutos(hrIni, item.hora_fim);
          }
          const ultrapassou = tempoMedioMin > 0 && duracaoRealMin > tempoMedioMin;
          const excedidoMin = ultrapassou ? (duracaoRealMin - tempoMedioMin) : 0;

          return {
            status: 'finalizado',
            isAgendadoFuturo: false,
            isAberto: false,
            isFinalizado: true,
            isAtrasado: false,
            finalizadoComAtraso: ultrapassou,
            tempoDecorridoMin: duracaoRealMin,
            tempoExcedidoMin: excedidoMin,
            tempoMedioMin,
            horaInicio: hrIni,
            horaFimPrevista,
            badgeClass: 'finalizado',
            badgeTexto: 'LIBERADO',
            duracaoTexto: 'Pausa: ' + formatarMinutosAmigavel(duracaoRealMin),
            statusMensagem: ultrapassou ? ('Concluído com ' + formatarMinutosAmigavel(excedidoMin) + ' de atraso') : 'Concluído no prazo'
          };
        }

        // 2. Verificação de Agendamento Futuro
        // Critério: status === 'agendado' OU data > hoje OU (data === hoje e inicioMs > agoraMs)
        const isDataFutura = dt > hojeStr;
        const isHorarioFuturoHoje = dt === hojeStr && inicioMs > agoraMs;
        const isAgendadoFuturo = status === 'agendado' || isDataFutura || isHorarioFuturoHoje;

        if (isAgendadoFuturo) {
          let textoQuando = '';
          if (isDataFutura) {
            const amanha = new Date(agoraMs + 86400000);
            const amanhaStr = isoLocal(amanha).slice(0, 10);
            if (dt === amanhaStr) {
              textoQuando = 'Amanhã às ' + hrIni;
            } else {
              textoQuando = formatarData(dt) + ' às ' + hrIni;
            }
          } else {
            const diffMin = Math.ceil((inicioMs - agoraMs) / 60000);
            textoQuando = diffMin > 60 ? ('Hoje às ' + hrIni) : ('Em ' + diffMin + ' min');
          }

          return {
            status: 'agendado',
            isAgendadoFuturo: true,
            isAberto: false,
            isFinalizado: false,
            isAtrasado: false,
            tempoDecorridoMin: 0,
            tempoMedioMin,
            horaInicio: hrIni,
            horaFimPrevista,
            progressoPct: 0,
            badgeClass: 'agendado',
            badgeTexto: 'AGENDADA (' + textoQuando + ')',
            duracaoTexto: 'Aguardando início',
            statusMensagem: 'Serviço programado para ' + textoQuando + ' · Previsão término às ' + horaFimPrevista
          };
        }

        // 3. Caso Aberto / Em Andamento (Vendedor Parado ou na Oficina)
        const decorridoMin = Math.max(0, Math.floor((agoraMs - inicioMs) / 60000));
        const ultrapassou = agoraMs > fimPrevistoMs;
        const excedidoMin = ultrapassou ? Math.floor((agoraMs - fimPrevistoMs) / 60000) : 0;
        const restanteMin = ultrapassou ? 0 : Math.ceil((fimPrevistoMs - agoraMs) / 60000);
        const progressoPct = Math.min(100, Math.round((decorridoMin / (tempoMedioMin || 1)) * 100));

        if (ultrapassou) {
          return {
            status: 'aberto',
            isAgendadoFuturo: false,
            isAberto: true,
            isFinalizado: false,
            isAtrasado: true,
            tempoDecorridoMin: decorridoMin,
            tempoExcedidoMin: excedidoMin,
            tempoMedioMin,
            horaInicio: hrIni,
            horaFimPrevista,
            progressoPct: 100,
            badgeClass: 'atrasado',
            badgeTexto: 'TEMPO EXCEDIDO (+' + formatarMinutosAmigavel(excedidoMin) + ')',
            duracaoTexto: 'Parado há ' + formatarMinutosAmigavel(decorridoMin),
            statusMensagem: 'TEMPO MÉDIO ULTRAPASSADO em +' + formatarMinutosAmigavel(excedidoMin) + '! Previsão era ' + horaFimPrevista
          };
        } else {
          return {
            status: 'aberto',
            isAgendadoFuturo: false,
            isAberto: true,
            isFinalizado: false,
            isAtrasado: false,
            tempoDecorridoMin: decorridoMin,
            tempoRestanteMin: restanteMin,
            tempoMedioMin,
            horaInicio: hrIni,
            horaFimPrevista,
            progressoPct: progressoPct,
            badgeClass: 'no-prazo',
            badgeTexto: 'No Prazo (Restam ' + formatarMinutosAmigavel(restanteMin) + ')',
            duracaoTexto: 'Parado há ' + formatarMinutosAmigavel(decorridoMin),
            statusMensagem: 'Em atendimento · Restam ' + formatarMinutosAmigavel(restanteMin) + ' (Término previsto: ' + horaFimPrevista + ')'
          };
        }
      }
      window.calcularStatusTempoOcorrencia = calcularStatusTempoOcorrencia;

      async function copiarOcorrenciaWhatsApp(id) {
        const ocr = (gastosState.ocorrencias || []).find(x => String(x.id) === String(id));
        if (!ocr) return;

        const info = calcularStatusTempoOcorrencia(ocr);
        const dataFmt = formatarData(ocr.data);

        let msg = '';
        if (info.isAgendadoFuturo) {
          msg = [
            '*GOMEX DISTRIBUIDORA · SERVIÇO AGENDADO DE FROTA*',
            '',
            '*Veículo:* ' + (ocr.veiculo || ocr.placa || 'Frota Gomex'),
            '*Rota:* ' + (ocr.rota || '—'),
            '*Vendedor / Motorista:* ' + (ocr.vendedor || '—'),
            '*Serviço / Motivo:* ' + (ocr.tipo || 'Manutenção'),
            '*Data / Início:* ' + dataFmt + ' às ' + (ocr.hora_inicio || '--:--'),
            '*Tempo Médio Previsto:* ' + formatarMinutosAmigavel(info.tempoMedioMin) + ' (Término previsto: ' + info.horaFimPrevista + ')',
            ocr.local ? ('*Local / Oficina:* ' + ocr.local) : '',
            ocr.custo ? ('*Valor / Despesa:* ' + fmtMoeda(ocr.custo)) : '',
            ocr.descricao ? ('*Detalhes:* ' + ocr.descricao) : '',
            '',
            '*SITUAÇÃO:* AGENDADA (Aguardando início)',
            '_Supervisor da Frota: ' + (ocr.responsavel || 'Hendreo') + '_'
          ].filter(Boolean).join('\n');
        } else if (info.isFinalizado) {
          msg = [
            '*GOMEX DISTRIBUIDORA · OCORRÊNCIA CONCLUÍDA*',
            '',
            '*Veículo:* ' + (ocr.veiculo || ocr.placa || 'Frota Gomex'),
            '*Rota:* ' + (ocr.rota || '—'),
            '*Vendedor / Motorista:* ' + (ocr.vendedor || '—'),
            '*Motivo / Serviço:* ' + (ocr.tipo || 'Ocorrência'),
            '*Horário:* ' + dataFmt + ' (' + (ocr.hora_inicio || '--:--') + ' às ' + (ocr.hora_fim || '--:--') + ')',
            '*Duração Total:* ' + formatarMinutosAmigavel(info.tempoDecorridoMin),
            ocr.local ? ('*Local:* ' + ocr.local) : '',
            ocr.custo ? ('*Custo:* ' + fmtMoeda(ocr.custo)) : '',
            ocr.descricao ? ('*Detalhes:* ' + ocr.descricao) : '',
            '',
            '*STATUS:* VENDEDOR LIBERADO / RETORNO À ROTA',
            '_Supervisor da Frota: ' + (ocr.responsavel || 'Hendreo') + '_'
          ].filter(Boolean).join('\n');
        } else {
          msg = [
            '*GOMEX DISTRIBUIDORA · OCORRÊNCIA EM ANDAMENTO (PAUSA)*',
            '',
            '*Veículo:* ' + (ocr.veiculo || ocr.placa || 'Frota Gomex'),
            '*Rota:* ' + (ocr.rota || '—'),
            '*Vendedor / Motorista:* ' + (ocr.vendedor || '—'),
            '*Motivo / Problema:* ' + (ocr.tipo || 'Pausa operacional'),
            '*Início da Parada:* ' + dataFmt + ' às ' + (ocr.hora_inicio || '--:--'),
            '*Tempo Parado até Agora:* ' + formatarMinutosAmigavel(info.tempoDecorridoMin),
            '*Tempo Médio Previsto:* ' + formatarMinutosAmigavel(info.tempoMedioMin) + ' (Previsão: ' + info.horaFimPrevista + ')',
            info.isAtrasado ? ('*ALERTA: TEMPO MÉDIO EXCEDIDO EM +' + formatarMinutosAmigavel(info.tempoExcedidoMin) + '!*') : ('*Situação:* No prazo (Restam ' + formatarMinutosAmigavel(info.tempoRestanteMin) + ')'),
            ocr.local ? ('*Local:* ' + ocr.local) : '',
            ocr.custo ? ('*Custo Previsto:* ' + fmtMoeda(ocr.custo)) : '',
            ocr.descricao ? ('*Detalhes:* ' + ocr.descricao) : '',
            '',
            '*STATUS:* VENDEDOR EM ATENDIMENTO / PARADO',
            '_Supervisor da Frota: ' + (ocr.responsavel || 'Hendreo') + '_'
          ].filter(Boolean).join('\n');
        }

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
          try { document.execCommand('copy'); copiou = true; } catch (e) {}
          document.body.removeChild(ta);
        }
        toast('Mensagem de ' + (ocr.vendedor || 'frota') + ' copiada para o WhatsApp!');
      }
      window.copiarOcorrenciaWhatsApp = copiarOcorrenciaWhatsApp;

      function filtrarOcorrencias(filtro) {
        ocorrenciasState.filtro = filtro;
        ['Todos', 'Abertos', 'Agendadas', 'Atrasados', 'Hoje', 'Finalizados'].forEach(tab => {
          const btn = $('btnOcrFiltro' + tab);
          if (btn) btn.classList.remove('active');
        });
        if (filtro === 'aberto' && $('btnOcrFiltroAbertos')) $('btnOcrFiltroAbertos').classList.add('active');
        else if (filtro === 'agendado' && $('btnOcrFiltroAgendadas')) $('btnOcrFiltroAgendadas').classList.add('active');
        else if (filtro === 'atrasado' && $('btnOcrFiltroAtrasados')) $('btnOcrFiltroAtrasados').classList.add('active');
        else if (filtro === 'hoje' && $('btnOcrFiltroHoje')) $('btnOcrFiltroHoje').classList.add('active');
        else if (filtro === 'finalizado' && $('btnOcrFiltroFinalizados')) $('btnOcrFiltroFinalizados').classList.add('active');
        else if ($('btnOcrFiltroTodos')) $('btnOcrFiltroTodos').classList.add('active');
        renderOcorrenciasView();
      }
      window.filtrarOcorrencias = filtrarOcorrencias;

      function buscarOcorrencias(val) {
        ocorrenciasState.busca = (val || '').trim().toLowerCase();
        renderOcorrenciasView();
      }
      window.buscarOcorrencias = buscarOcorrencias;

      function renderOcorrenciasView() {
        const todas = Array.isArray(gastosState.ocorrencias) ? gastosState.ocorrencias : [];
        const hojeStr = formatarDataHoje();
        const agoraMs = Date.now();

        // Processar status com cálculo preciso de data e horário
        const processadas = todas.map(item => {
          const info = calcularStatusTempoOcorrencia(item, agoraMs);
          return { item, info };
        });

        // Contagens precisas: apenas quem está aberto e NÃO é futuro conta como "Parados Agora"
        const paradosAgora = processadas.filter(p => p.info.isAberto);
        const agendadas = processadas.filter(p => p.info.isAgendadoFuturo);
        const atrasadas = processadas.filter(p => p.info.isAtrasado);
        const deHoje = processadas.filter(p => (p.item.data || '').startsWith(hojeStr));
        const concluidasHoje = deHoje.filter(p => p.item.status === 'finalizado');

        const tempoHojeMinutos = deHoje.reduce((acc, p) => {
          return acc + (p.info.tempoDecorridoMin || 0);
        }, 0);

        // Atualização dos KPIs no topo
        if ($('ocrStatParadosAgora')) $('ocrStatParadosAgora').textContent = paradosAgora.length;
        if ($('ocrStatAgendadas')) $('ocrStatAgendadas').textContent = agendadas.length;
        if ($('ocrStatTempoHoje')) $('ocrStatTempoHoje').textContent = formatarMinutosAmigavel(tempoHojeMinutos);
        if ($('ocrStatOcrHoje')) $('ocrStatOcrHoje').textContent = deHoje.length;
        if ($('ocrStatConcluidasHoje')) $('ocrStatConcluidasHoje').textContent = concluidasHoje.length;

        // Atualização dos Badges das Abas de Filtros
        if ($('badgeOcrFiltroTodos')) $('badgeOcrFiltroTodos').textContent = todas.length;
        if ($('badgeOcrFiltroAbertos')) $('badgeOcrFiltroAbertos').textContent = paradosAgora.length;
        if ($('badgeOcrFiltroAgendadas')) $('badgeOcrFiltroAgendadas').textContent = agendadas.length;
        if ($('badgeOcrFiltroAtrasados')) $('badgeOcrFiltroAtrasados').textContent = atrasadas.length;
        if ($('badgeOcrFiltroHoje')) $('badgeOcrFiltroHoje').textContent = deHoje.length;
        if ($('badgeOcrFiltroFinalizados')) $('badgeOcrFiltroFinalizados').textContent = todas.filter(x => x.status === 'finalizado').length;

        // Banner chamativo de tempo médio excedido
        const bannerAtraso = $('ocrAlertaAtrasosBanner');
        const textoBanner = $('ocrAlertaAtrasosTexto');
        if (bannerAtraso) {
          if (atrasadas.length > 0) {
            bannerAtraso.style.display = 'flex';
            if (textoBanner) {
              textoBanner.innerHTML = 'Existem <b>' + atrasadas.length + ' serviço(s) / ocorrência(s) com o TEMPO MÉDIO ULTRAPASSADO</b> na frota! Verifique a situação das rotas.';
            }
          } else {
            bannerAtraso.style.display = 'none';
          }
        }

        // Filtragem
        let lista = [...processadas];
        if (ocorrenciasState.filtro === 'aberto') {
          lista = lista.filter(p => p.info.isAberto);
        } else if (ocorrenciasState.filtro === 'agendado') {
          lista = lista.filter(p => p.info.isAgendadoFuturo);
        } else if (ocorrenciasState.filtro === 'atrasado') {
          lista = lista.filter(p => p.info.isAtrasado);
        } else if (ocorrenciasState.filtro === 'hoje') {
          lista = lista.filter(p => (p.item.data || '').startsWith(hojeStr));
        } else if (ocorrenciasState.filtro === 'finalizado') {
          lista = lista.filter(p => p.item.status === 'finalizado');
        }

        // Busca
        if (ocorrenciasState.busca) {
          const b = ocorrenciasState.busca;
          lista = lista.filter(p =>
            (p.item.vendedor || '').toLowerCase().includes(b) ||
            (p.item.rota || '').toLowerCase().includes(b) ||
            (p.item.veiculo || '').toLowerCase().includes(b) ||
            (p.item.placa || '').toLowerCase().includes(b) ||
            (p.item.tipo || '').toLowerCase().includes(b) ||
            (p.item.local || '').toLowerCase().includes(b) ||
            (p.item.descricao || '').toLowerCase().includes(b)
          );
        }

        // Ordenação inteligente: Atrasadas primeiro, depois Abertas, depois Agendadas, depois Finalizadas
        lista.sort((a, b) => {
          if (a.info.isAtrasado && !b.info.isAtrasado) return -1;
          if (!a.info.isAtrasado && b.info.isAtrasado) return 1;
          if (a.info.isAberto && !b.info.isAberto) return -1;
          if (!a.info.isAberto && b.info.isAberto) return 1;
          if (a.info.isAgendadoFuturo && !b.info.isAgendadoFuturo) return -1;
          if (!a.info.isAgendadoFuturo && b.info.isAgendadoFuturo) return 1;
          const dtA = (a.item.data || '') + ' ' + (a.item.hora_inicio || '');
          const dtB = (b.item.data || '') + ' ' + (b.item.hora_inicio || '');
          return dtB.localeCompare(dtA);
        });

        const container = $('ocrListaCards');
        if (!container) return;

        if (!lista.length) {
          container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:52px 20px;background:var(--panel);border:1px dashed var(--line-strong);border-radius:var(--r);color:var(--ink-3)">
              <div style="width:48px;height:48px;border-radius:50%;background:var(--raised);display:grid;place-items:center;margin:0 auto 12px;color:var(--accent-hi)">
                <svg class="i" style="width:24px;height:24px"><use href="#i-check" /></svg>
              </div>
              <h4 style="font-size:16px;font-weight:700;color:var(--ink);margin-bottom:4px">Nenhuma ocorrência encontrada</h4>
              <p style="font-size:13px;max-width:380px;margin:0 auto 18px">
                ${ocorrenciasState.busca ? 'Nenhum registro confere com o termo buscado.' : 'Toda a frota está rodando normalmente sem pendências neste filtro.'}
              </p>
              <button type="button" class="btn btn-primary" id="btnTopNovaOcorrencia" onclick="abrirModalOcorrencia()" style="margin:0 auto">
                <svg class="i"><use href="#i-plus" /></svg>
                <span>Registrar Ocorrência / Agendar</span>
              </button>
            </div>
          `;
          return;
        }

        container.innerHTML = lista.map(({ item, info }) => {
          const isAberto = info.isAberto;
          const isAgendado = info.isAgendadoFuturo;
          const isAtrasado = info.isAtrasado;
          const isFinalizado = info.isFinalizado;

          let cardClass = 'ocr-card';
          if (isAtrasado) cardClass += ' atrasada';
          else if (isAgendado) cardClass += ' agendada';
          else if (isAberto) cardClass += ' em-aberto';
          else if (isFinalizado) cardClass += ' finalizada';

          let tempoPausaHtml = '';
          if (isAgendado) {
            tempoPausaHtml = `
              <div class="ocr-duracao-highlight agendado">
                <svg class="i" style="width:14px;height:14px"><use href="#i-calendar-clock" /></svg>
                <span>${esc(info.duracaoTexto)}</span>
              </div>
            `;
          } else if (isAtrasado) {
            tempoPausaHtml = `
              <div class="ocr-duracao-highlight atrasado">
                <span class="pulse-dot-red"></span>
                <span>Parado há ${formatarMinutosAmigavel(info.tempoDecorridoMin)} (+ ${formatarMinutosAmigavel(info.tempoExcedidoMin)})</span>
              </div>
            `;
          } else if (isAberto) {
            tempoPausaHtml = `
              <div class="ocr-duracao-highlight no-prazo">
                <svg class="i" style="width:14px;height:14px"><use href="#i-clock" /></svg>
                <span>Parado há ${formatarMinutosAmigavel(info.tempoDecorridoMin)}</span>
              </div>
            `;
          } else {
            tempoPausaHtml = `
              <div class="ocr-duracao-highlight finalizado">
                <svg class="i" style="width:14px;height:14px"><use href="#i-check" /></svg>
                <span>Pausa: ${formatarMinutosAmigavel(info.tempoDecorridoMin)}</span>
              </div>
            `;
          }

          let iconeTipo = 'i-alert';
          if ((item.tipo || '').includes('Pneu')) iconeTipo = 'i-tool';
          else if ((item.tipo || '').includes('Óleo')) iconeTipo = 'i-droplet';
          else if ((item.tipo || '').includes('Mecânica') || (item.tipo || '').includes('Manutenção')) iconeTipo = 'i-tool';
          else if ((item.tipo || '').includes('Banco')) iconeTipo = 'i-tool';

          // Barra de progresso para serviços em andamento com tempo médio
          let progressoHtml = '';
          if (isAberto && info.tempoMedioMin > 0) {
            const barClass = isAtrasado ? 'atrasado' : 'no-prazo';
            progressoHtml = `
              <div class="tempo-progress-wrap" title="Progresso em relação ao tempo médio estimado">
                <div class="tempo-progress-bar ${barClass}" style="width:${info.progressoPct}%"></div>
              </div>
            `;
          }

          return `
            <div class="${cardClass}">
              <div class="ocr-card-head">
                <div class="ocr-card-head-left">
                  <div class="ocr-vendedor-title">
                    <span>${esc(item.vendedor)}</span>
                    <span class="badge-rota">Rota ${esc(item.rota)}</span>
                    ${item.veiculo ? `<span class="badge-km" style="font-size:11px">${esc(item.veiculo)}</span>` : ''}
                  </div>
                  <div style="font-size:11.5px;color:var(--ink-3);margin-top:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span>${formatarData(item.data)}</span>
                    <span>·</span>
                    <span>Supervisor: <b>${esc(item.responsavel || 'Hendreo')}</b></span>
                  </div>
                </div>

                <div class="ocr-card-head-right">
                  <span class="badge-status-pausa ${info.badgeClass}">
                    ${isAtrasado ? '<span class="pulse-dot-red"></span>' : ''}
                    ${isAberto && !isAtrasado ? '<span class="pulse-dot-red"></span>' : ''}
                    ${esc(info.badgeTexto)}
                  </span>
                </div>
              </div>

              <!-- Motivo do Problema & Destaque de Tempo -->
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                <div class="ocr-tipo-badge">
                  <svg class="i" style="width:14px;height:14px;color:var(--accent-hi)"><use href="#${iconeTipo}" /></svg>
                  <span>${esc(item.tipo || 'Ocorrência')}</span>
                </div>
                ${tempoPausaHtml}
              </div>

              <!-- Box de Horários, Duração e Tempo Médio -->
              <div style="display:flex;flex-direction:column;gap:4px">
                <div class="ocr-time-box">
                  <div class="ocr-time-item">
                    <span class="ocr-time-lbl">Início</span>
                    <span class="ocr-time-val">${esc(item.hora_inicio || '--:--')}${isAgendado ? ' (' + formatarData(item.data) + ')' : ''}</span>
                  </div>
                  <div class="ocr-time-item">
                    <span class="ocr-time-lbl">Tempo Médio</span>
                    <span class="ocr-time-val" style="color:var(--accent-hi)">${formatarMinutosAmigavel(info.tempoMedioMin)}</span>
                  </div>
                  <div class="ocr-time-item">
                    <span class="ocr-time-lbl">${isFinalizado ? 'Retorno' : 'Previsão Término'}</span>
                    <span class="ocr-time-val" style="color:${isAtrasado ? 'var(--bad)' : (isFinalizado ? 'var(--ok)' : 'var(--ink)')}">
                      ${isFinalizado ? esc(item.hora_fim || '--:--') : esc(info.horaFimPrevista)}
                    </span>
                  </div>
                  <div class="ocr-time-item">
                    <span class="ocr-time-lbl">Tempo Utilizado</span>
                    <span class="ocr-time-val" style="color:${isAgendado ? '#6366f1' : (isAtrasado ? 'var(--bad)' : (isFinalizado ? 'var(--ok)' : 'var(--warn)'))}">
                      ${isAgendado ? 'Aguardando início' : (isAberto ? (info.tempoDecorridoMin + ' min até agora') : formatarMinutosAmigavel(info.tempoDecorridoMin))}
                    </span>
                  </div>
                </div>

                ${progressoHtml}

                <div style="font-size:12px;font-weight:${isAtrasado ? '700' : '500'};color:${isAtrasado ? 'var(--bad)' : 'var(--ink-3)'};margin-top:2px;display:flex;align-items:center;gap:5px">
                  ${isAtrasado ? '<svg class="i" style="width:14px;height:14px;color:var(--bad)"><use href="#i-alert" /></svg>' : ''}
                  <span>${esc(info.statusMensagem)}</span>
                </div>
              </div>

              <!-- Detalhes, Local e Custo -->
              ${item.local ? `
                <div style="font-size:12.5px;color:var(--ink-2);display:flex;align-items:center;gap:6px">
                  <span style="color:var(--accent-hi);font-weight:700">Local:</span>
                  <span>${esc(item.local)}</span>
                </div>
              ` : ''}

              ${item.descricao ? `
                <div class="ocr-detail-text">
                  <span style="color:var(--ink-3);font-weight:600">Motivo/Serviço:</span> ${esc(item.descricao)}
                </div>
              ` : ''}

              ${item.custo ? `
                <div style="font-size:13px;font-weight:800;color:var(--ok)">
                  Despesa / Custo: ${fmtMoeda(item.custo)}
                </div>
              ` : ''}

              <!-- Ações Rápidas (Mobile First) -->
              <div class="ocr-actions-row">
                ${isAgendado ? `
                  <button type="button" class="btn btn-primary" onclick="iniciarOcorrenciaAgendadaRapida('${esc(item.id)}')"
                    title="Iniciar serviço agora" style="background:#2563eb;border-color:#2563eb">
                    <svg class="i"><use href="#i-clock" /></svg>
                    <span>Iniciar Agora</span>
                  </button>
                ` : ''}

                ${isAberto ? `
                  <button type="button" class="btn btn-primary" onclick="finalizarPausaRapida('${esc(item.id)}')"
                    title="Finalizar pausa com a hora atual" style="background:#15803d;border-color:#15803d">
                    <svg class="i"><use href="#i-check" /></svg>
                    <span>Finalizar Pausa</span>
                  </button>
                ` : ''}

                <button type="button" class="btn btn-ghost" onclick="copiarOcorrenciaWhatsApp('${esc(item.id)}')"
                  title="Copiar mensagem pronta para WhatsApp" style="color:#25d366">
                  <svg class="i"><use href="#i-whatsapp" /></svg>
                  <span>WhatsApp</span>
                </button>

                <button type="button" class="btn btn-ghost" onclick="abrirModalOcorrencia('${esc(item.id)}')"
                  title="Editar ocorrência">
                  <svg class="i"><use href="#i-edit" /></svg>
                  <span>Editar</span>
                </button>

                <button type="button" class="btn btn-ghost btn-icon" onclick="excluirOcorrencia('${esc(item.id)}')"
                  title="Excluir ocorrência" style="flex:0 0 36px;color:var(--bad)">
                  <svg class="i"><use href="#i-trash" /></svg>
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
      window.renderOcorrenciasView = renderOcorrenciasView;

      setInterval(() => {
        if (state.visaoAtual === 'ocorrencias' && typeof renderOcorrenciasView === 'function') {
          renderOcorrenciasView();
        }
      }, 30000);

      // ==============================================================================