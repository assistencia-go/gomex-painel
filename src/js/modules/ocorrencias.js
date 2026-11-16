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

      function formatarDataHoje(refMs) {
        const now = (refMs !== undefined && refMs !== null) ? new Date(refMs) : new Date();
        return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      }

      // Verifica se uma data YYYY-MM-DD cai no fim de semana (0 = Domingo, 6 = Sábado)
      function ehDataFimDeSemana(dataStr) {
        if (!dataStr) return false;
        const partes = String(dataStr).slice(0, 10).split('-').map(Number);
        if (partes.length < 3 || isNaN(partes[0]) || isNaN(partes[1]) || isNaN(partes[2])) return false;
        const dw = new Date(partes[0], partes[1] - 1, partes[2]).getDay();
        return dw === 0 || dw === 6;
      }
      window.ehDataFimDeSemana = ehDataFimDeSemana;

      function nomeDiaFimDeSemana(dataStr) {
        if (!dataStr) return '';
        const partes = String(dataStr).slice(0, 10).split('-').map(Number);
        if (partes.length < 3 || isNaN(partes[0]) || isNaN(partes[1]) || isNaN(partes[2])) return '';
        const dw = new Date(partes[0], partes[1] - 1, partes[2]).getDay();
        if (dw === 6) return 'Sábado';
        if (dw === 0) return 'Domingo';
        return '';
      }

      function fimDoFimDeSemanaTimestamp(dataStr) {
        const partes = String(dataStr || '').slice(0, 10).split('-').map(Number);
        if (partes.length < 3 || isNaN(partes[0]) || isNaN(partes[1]) || isNaN(partes[2])) return null;
        const dt = new Date(partes[0], partes[1] - 1, partes[2]);
        const dw = dt.getDay();
        if (dw !== 0 && dw !== 6) return null;
        const diasAteSegunda = dw === 6 ? 2 : 1;
        return new Date(partes[0], partes[1] - 1, partes[2] + diasAteSegunda, 0, 0, 0, 0).getTime();
      }

      // Separa o intervalo [iniMs, fimMs] entre minutos de dias úteis (Seg-Sex) e fim de semana (Sáb-Dom)
      function dividirMinutosExpedienteEFds(iniMs, fimMs) {
        if (!iniMs || !fimMs || fimMs <= iniMs) return { utilMin: 0, fdsMin: 0 };
        const dIni = new Date(iniMs);
        const dFim = new Date(fimMs);
        if (dIni.getFullYear() === dFim.getFullYear() && dIni.getMonth() === dFim.getMonth() && dIni.getDate() === dFim.getDate()) {
          const total = Math.floor((fimMs - iniMs) / 60000);
          const dw = dIni.getDay();
          return (dw === 0 || dw === 6) ? { utilMin: 0, fdsMin: total } : { utilMin: total, fdsMin: 0 };
        }
        let utilMs = 0;
        let fdsMs = 0;
        let cursor = iniMs;
        let guard = 0;
        while (cursor < fimMs && guard++ < 65) {
          const dt = new Date(cursor);
          const proxDia = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1, 0, 0, 0, 0).getTime();
          const segFim = Math.min(fimMs, proxDia);
          const dw = dt.getDay();
          if (dw === 0 || dw === 6) fdsMs += (segFim - cursor);
          else utilMs += (segFim - cursor);
          cursor = segFim;
        }
        return {
          utilMin: Math.max(0, Math.floor(utilMs / 60000)),
          fdsMin: Math.max(0, Math.floor(fdsMs / 60000))
        };
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
        const isFds = ehDataFimDeSemana(dt);
        const diaFds = nomeDiaFimDeSemana(dt);

        if (hintBadge) {
          if (isFds) {
            hintBadge.textContent = 'Fim de Semana (' + diaFds + ') · Fora de expediente';
            hintBadge.style.color = '#475569';
          } else if (isFutura) {
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
          if (info.isFimDeSemana && info.isAgendadoFuturo) {
            txtEl.innerHTML = 'Agendado p/ fim de semana (<b style="color:#475569">' + esc(info.diaFimSemana) + ' · ' + formatarData(dt) + ' às ' + ini + '</b>) · Contabilizado separado (fora do relatório)';
          } else if (info.isFimDeSemana && info.isFinalizado) {
            txtEl.innerHTML = 'Fim de semana (' + esc(info.diaFimSemana) + ') · Tempo fora do expediente: <b style="color:#475569">' + formatarMinutosAmigavel(info.tempoFimSemanaMin) + '</b> (separado do relatório)';
          } else if (info.isFimDeSemana) {
            txtEl.innerHTML = 'Fim de semana (' + esc(info.diaFimSemana) + ') · Tempo fora do expediente: <b style="color:#475569">' + formatarMinutosAmigavel(info.tempoFimSemanaMin) + '</b> (não conta atraso nem relatório)';
          } else if (info.isFinalizado) {
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
          if (info.isFimDeSemana) {
            badgeEl.innerHTML = '<span class="badge-status-pausa fim-semana">Fim de Semana (Separado)</span>';
          } else if (info.isFinalizado) {
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
        if ($('ocrRelModoFimSemana')) {
          $('ocrRelModoFimSemana').value = 'excluir';
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

      function obterDadosRelatorioOcorrencias() {
        const todas = Array.isArray(gastosState.ocorrencias) ? gastosState.ocorrencias : [];
        const dtIni = ($('ocrRelDataInicio')?.value || '').trim();
        const dtFim = ($('ocrRelDataFim')?.value || '').trim();
        const vend = ($('ocrRelVendedor')?.value || '').trim().toLowerCase();
        const statusFiltro = ($('ocrRelStatus')?.value || '').trim();
        const modoFds = ($('ocrRelModoFimSemana')?.value || 'excluir').trim();
        const agoraMs = Date.now();

        const baseFiltrada = todas.filter(item => {
          const dt = (item.data || '').slice(0, 10);
          if (dtIni && dt < dtIni) return false;
          if (dtFim && dt > dtFim) return false;
          if (vend && !(item.vendedor || '').toLowerCase().includes(vend)) return false;
          if (statusFiltro) {
            const info = calcularStatusTempoOcorrencia(item, agoraMs);
            if (statusFiltro === 'aberto' && !(info.isAberto || info.isEmAndamentoFimSemana)) return false;
            if (statusFiltro === 'finalizado' && !info.isFinalizado) return false;
          }
          return true;
        }).map(item => ({ item, info: calcularStatusTempoOcorrencia(item, agoraMs) }));

        const uteis = baseFiltrada.filter(p => !p.info.isFimDeSemana);
        const fimSemana = baseFiltrada.filter(p => p.info.isFimDeSemana);

        const tempoUtilTotalMin = baseFiltrada.reduce((acc, p) => acc + (p.info.tempoUtilMin || 0), 0);
        const tempoFimSemanaTotalMin = baseFiltrada.reduce((acc, p) => acc + (p.info.tempoFimSemanaMin || 0), 0);

        let selecionadas = uteis;
        if (modoFds === 'somente_fds') selecionadas = fimSemana;
        else if (modoFds === 'separar') selecionadas = baseFiltrada;

        const totalCusto = selecionadas.reduce((acc, p) => acc + (Number(p.item.custo) || 0), 0);
        const tempoListadoMin = modoFds === 'somente_fds'
          ? tempoFimSemanaTotalMin
          : (modoFds === 'separar' ? (tempoUtilTotalMin + tempoFimSemanaTotalMin) : tempoUtilTotalMin);
        const mediaMinutos = selecionadas.length > 0 ? Math.round(tempoListadoMin / selecionadas.length) : 0;

        return {
          modoFds,
          selecionadas,
          uteis,
          fimSemana,
          tempoUtilTotalMin,
          tempoFimSemanaTotalMin,
          tempoListadoMin,
          mediaMinutos,
          totalCusto
        };
      }

      function obterOcorrenciasFiltradasRelatorio() {
        return obterDadosRelatorioOcorrencias().selecionadas.map(p => p.item);
      }

      function atualizarPreviaRelatorioOcr() {
        const dados = obterDadosRelatorioOcorrencias();
        const { modoFds, selecionadas, fimSemana, tempoUtilTotalMin, tempoFimSemanaTotalMin, mediaMinutos, totalCusto } = dados;

        if ($('ocrRelTotalOcr')) $('ocrRelTotalOcr').textContent = selecionadas.length;
        if ($('ocrRelTempoTotal')) {
          $('ocrRelTempoTotal').textContent = formatarMinutosAmigavel(modoFds === 'somente_fds' ? 0 : tempoUtilTotalMin);
        }
        if ($('ocrRelTempoFimSemana')) {
          $('ocrRelTempoFimSemana').textContent = formatarMinutosAmigavel(tempoFimSemanaTotalMin);
        }
        if ($('ocrRelFimSemanaSub')) {
          if (modoFds === 'excluir') {
            $('ocrRelFimSemanaSub').textContent = fimSemana.length
              ? (fimSemana.length + ' reg. ocultado(s) do relatório')
              : 'Fora do expediente (separado)';
          } else if (modoFds === 'somente_fds') {
            $('ocrRelFimSemanaSub').textContent = fimSemana.length + ' registro(s) no período';
          } else {
            $('ocrRelFimSemanaSub').textContent = fimSemana.length + ' reg. separados do útil';
          }
        }
        if ($('ocrRelTempoMedio')) $('ocrRelTempoMedio').textContent = formatarMinutosAmigavel(mediaMinutos);
        if ($('ocrRelCustoTotal')) $('ocrRelCustoTotal').textContent = fmtMoeda(totalCusto);
        if ($('ocrRelContadorPrevia')) {
          const extraOcultos = (modoFds === 'excluir' && fimSemana.length > 0)
            ? (' · ' + fimSemana.length + ' de fim de semana fora do relatório')
            : '';
          $('ocrRelContadorPrevia').textContent = selecionadas.length + ' ocorrência(s) no relatório' + extraOcultos;
        }

        const container = $('ocrRelListaPrevia');
        if (!container) return;

        if (!selecionadas.length) {
          const avisoFds = (modoFds === 'excluir' && fimSemana.length > 0)
            ? `<div style="margin-top:6px;font-size:12px;color:#475569;font-weight:600">${fimSemana.length} registro(s) de fim de semana (${formatarMinutosAmigavel(tempoFimSemanaTotalMin)}) foram ocultados do relatório operacional.</div>`
            : '';
          container.innerHTML = `
            <div style="text-align:center;padding:24px 12px;color:var(--ink-3);font-size:13px">
              Nenhuma ocorrência encontrada para o filtro selecionado.
              ${avisoFds}
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
              ${selecionadas.map(({ item: x, info }, idx) => {
                const durMin = info.isFimDeSemana ? info.tempoFimSemanaMin : info.tempoUtilMin;
                const durTexto = info.isAgendadoFuturo
                  ? 'Agendada'
                  : (info.isAberto || info.isEmAndamentoFimSemana
                    ? (formatarMinutosAmigavel(durMin) + (info.isFimDeSemana ? ' (FDS)' : ' (aberto)'))
                    : formatarMinutosAmigavel(durMin));
                const statusTexto = info.isFimDeSemana
                  ? ('Fim de Semana (' + info.diaFimSemana + ')')
                  : (info.isAgendadoFuturo ? 'Agendada' : (info.isAberto ? 'Em Pausa' : 'Liberado'));
                const statusCor = info.isFimDeSemana ? '#475569' : (info.isAberto ? 'var(--bad)' : (info.isAgendadoFuturo ? '#6366f1' : 'var(--ok)'));
                return `
                  <tr style="border-bottom:1px solid var(--line);${idx % 2 === 0 ? 'background:transparent' : 'background:rgba(255,255,255,0.02)'}">
                    <td style="padding:8px 10px;white-space:nowrap">${formatarData(x.data)}${info.isFimDeSemana ? ' <span style="font-size:10px;font-weight:700;color:#475569">(FDS)</span>' : ''}</td>
                    <td style="padding:8px 10px;font-weight:600;color:var(--ink)">
                      ${esc(x.vendedor)} <span class="badge-rota" style="font-size:10px;padding:1px 5px">Rota ${esc(x.rota)}</span>
                    </td>
                    <td style="padding:8px 10px;color:var(--ink-2)">${esc(x.tipo || 'Ocorrência')}</td>
                    <td style="padding:8px 10px;white-space:nowrap;color:var(--ink-3)">${esc(x.hora_inicio || '--:--')} às ${esc(x.hora_fim || '--:--')}</td>
                    <td style="padding:8px 10px;font-weight:700;color:${info.isFimDeSemana ? '#475569' : (info.isAberto ? 'var(--warn)' : 'var(--ok)')}">
                      ${durTexto}
                    </td>
                    <td style="padding:8px 10px">
                      <span style="font-size:11px;font-weight:700;color:${statusCor}">
                        ${statusTexto}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      }
      window.atualizarPreviaRelatorioOcr = atualizarPreviaRelatorioOcr;

      function exportarCsvOcorrencias() {
        const dados = obterDadosRelatorioOcorrencias();
        const selecionadas = dados.selecionadas;
        if (!selecionadas.length) {
          toast('Nenhuma ocorrência encontrada para exportar com o filtro atual.', 'error');
          return;
        }

        const csvCell = v => {
          let s = String(v ?? '');
          if (/^[=+\-@]/.test(s)) s = "'" + s;
          return '"' + s.replace(/"/g, '""') + '"';
        };
        const headers = [
          'Data',
          'Regime / Jornada',
          'Hora Inicio',
          'Hora Fim',
          'Tempo Util (min)',
          'Tempo Fim de Semana (min)',
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

        const rows = selecionadas.map(({ item: x, info }) => {
          const minExibir = info.isFimDeSemana ? info.tempoFimSemanaMin : info.tempoUtilMin;
          return [
            formatarData(x.data),
            info.isFimDeSemana ? ('Fim de Semana (' + info.diaFimSemana + ' · Fora do Expediente)') : 'Dia Util (Expediente)',
            x.hora_inicio || '',
            x.hora_fim || '',
            String(info.tempoUtilMin || 0),
            String(info.tempoFimSemanaMin || 0),
            formatarMinutosAmigavel(minExibir),
            x.vendedor || '',
            x.rota || '',
            x.veiculo || '',
            x.placa || '',
            x.tipo || '',
            x.local || '',
            Number(x.custo || 0).toFixed(2).replace('.', ','),
            info.isFimDeSemana ? 'Fim de Semana (Fora do Expediente)' : (info.isAgendadoFuturo ? 'Agendada' : (info.isAberto ? 'Em Aberto / Parado' : 'Finalizada / Liberado')),
            x.responsavel || '',
            x.descricao || ''
          ].map(csvCell).join(';');
        });

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
        toast(`${selecionadas.length} ocorrência(s) exportada(s) para Excel (CSV)!`);
      }
      window.exportarCsvOcorrencias = exportarCsvOcorrencias;

      function gerarPdfRelatorioOcorrencias() {
        const dados = obterDadosRelatorioOcorrencias();
        const { modoFds, selecionadas, fimSemana, tempoUtilTotalMin, tempoFimSemanaTotalMin, mediaMinutos, totalCusto } = dados;
        if (!selecionadas.length) {
          toast('Nenhuma ocorrência encontrada para gerar relatório PDF neste filtro.', 'error');
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

          // Cabeçalho Oficial
          fonte(14, 'bold', ROXO);
          doc.text('GOMEX DISTRIBUIDORA DE ALIMENTOS', M, 14);

          fonte(10, 'bold', [30, 30, 40]);
          const subTituloPdf = modoFds === 'somente_fds'
            ? 'RELATÓRIO DE OCORRÊNCIAS DE FIM DE SEMANA (FORA DO EXPEDIENTE)'
            : 'RELATÓRIO EXECUTIVO DE OCORRÊNCIAS & CONTROLE DE PAUSAS DA FROTA';
          doc.text(subTituloPdf, M, 20);

          fonte(8.5, 'normal', CINZA);
          const agoraStr = new Date().toLocaleString('pt-BR');
          const notaFdsPdf = modoFds === 'excluir'
            ? `  ·  Fim de semana: excluído da listagem (${fimSemana.length} reg. / ${formatarMinutosAmigavel(tempoFimSemanaTotalMin)} fora do expediente)`
            : '';
          doc.text(`Período: ${dtIni} até ${dtFim}  ·  Emitido em: ${agoraStr}${notaFdsPdf}`, M, 25);

          // Card de Indicadores no Topo (5 colunas alinhadas com separação entre Tempo Útil e Fim de Semana)
          doc.setFillColor(245, 247, 250);
          doc.setDrawColor(...LINHA);
          doc.roundedRect(M, 28, W, 14, 2, 2, 'FD');

          fonte(7.5, 'bold', CINZA);
          doc.text('OCORRÊNCIAS', M + 6, 33);
          doc.text('TEMPO ÚTIL (EXPEDIENTE)', M + 52, 33);
          doc.text('TEMPO FIM DE SEMANA (SEPARADO)', M + 114, 33);
          doc.text('MÉDIA POR PARADA', M + 188, 33);
          doc.text('TOTAL DESPESAS', M + 236, 33);

          fonte(10, 'bold', ROXO);
          doc.text(String(selecionadas.length), M + 6, 39);
          doc.text(formatarMinutosAmigavel(modoFds === 'somente_fds' ? 0 : tempoUtilTotalMin), M + 52, 39);
          fonte(10, 'bold', [71, 85, 105]);
          doc.text(formatarMinutosAmigavel(tempoFimSemanaTotalMin), M + 114, 39);
          fonte(10, 'bold', ROXO);
          doc.text(formatarMinutosAmigavel(mediaMinutos), M + 188, 39);
          doc.text(fmtMoeda(totalCusto), M + 236, 39);

          // Tabela de Ocorrências
          let y = 48;
          const colW = [24, 16, 16, 22, 50, 26, 42, 38, 22, 21];
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

          selecionadas.forEach(({ item, info }, idx) => {
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

            doc.text(formatarData(item.data) + (info.isFimDeSemana ? ' (FDS)' : ''), xOff + 2, y + 4.5); xOff += colW[0];
            doc.text(item.hora_inicio || '--:--', xOff + 2, y + 4.5); xOff += colW[1];
            doc.text(item.hora_fim || '--:--', xOff + 2, y + 4.5); xOff += colW[2];

            const durMin = info.isFimDeSemana ? info.tempoFimSemanaMin : info.tempoUtilMin;
            const durPdf = info.isAgendadoFuturo
              ? 'Agendada'
              : (info.isFimDeSemana ? (formatarMinutosAmigavel(durMin) + ' (FDS)') : (info.isAberto ? (formatarMinutosAmigavel(durMin) + ' *') : formatarMinutosAmigavel(durMin)));
            fonte(7.2, 'bold', info.isFimDeSemana ? [71, 85, 105] : (info.isAberto ? [180, 80, 10] : [20, 120, 60]));
            doc.text(durPdf, xOff + 2, y + 4.5); xOff += colW[3];

            fonte(7.2, 'bold', [20, 20, 30]);
            doc.text(corta(`${item.vendedor || ''} (Rota ${item.rota || ''})`, colW[4] - 3), xOff + 2, y + 4.5); xOff += colW[4];

            fonte(7.2, 'normal', [40, 45, 55]);
            doc.text(corta(item.veiculo || item.placa || '—', colW[5] - 3), xOff + 2, y + 4.5); xOff += colW[5];
            doc.text(corta(item.tipo || 'Ocorrência', colW[6] - 3), xOff + 2, y + 4.5); xOff += colW[6];
            doc.text(corta(item.local || '—', colW[7] - 3), xOff + 2, y + 4.5); xOff += colW[7];

            doc.text(item.custo ? fmtMoeda(item.custo) : '—', xOff + 2, y + 4.5); xOff += colW[8];

            const stPdf = info.isFimDeSemana ? 'Fim Semana' : (info.isAgendadoFuturo ? 'Agendada' : (info.isAberto ? 'Em Pausa' : 'Liberado'));
            fonte(7.2, 'bold', info.isFimDeSemana ? [71, 85, 105] : (info.isAberto ? [185, 28, 28] : [21, 128, 61]));
            doc.text(stPdf, xOff + 2, y + 4.5);

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
        const dados = obterDadosRelatorioOcorrencias();
        const { modoFds, selecionadas, fimSemana, tempoUtilTotalMin, tempoFimSemanaTotalMin, mediaMinutos, totalCusto } = dados;
        if (!selecionadas.length && !(modoFds === 'excluir' && fimSemana.length > 0)) {
          toast('Nenhuma ocorrência encontrada para o resumo.', 'error');
          return;
        }

        const dtIni = $('ocrRelDataInicio')?.value ? formatarData($('ocrRelDataInicio').value) : 'Início';
        const dtFim = $('ocrRelDataFim')?.value ? formatarData($('ocrRelDataFim').value) : 'Hoje';

        const porVendedor = new Map();
        selecionadas.forEach(({ item: x, info }) => {
          const k = `${x.vendedor || 'Outro'} (Rota ${x.rota || '—'})`;
          if (!porVendedor.has(k)) porVendedor.set(k, { count: 0, utilMin: 0, fdsMin: 0, custo: 0 });
          const acc = porVendedor.get(k);
          acc.count++;
          acc.utilMin += info.tempoUtilMin || 0;
          acc.fdsMin += info.tempoFimSemanaMin || 0;
          acc.custo += Number(x.custo) || 0;
        });

        const linhasVend = Array.from(porVendedor.entries()).map(([k, v]) => {
          const parteFds = v.fdsMin > 0 ? ` · Fim de Semana: ${formatarMinutosAmigavel(v.fdsMin)}` : '';
          return `• ${k}: ${v.count} pausa(s) · Tempo Útil: ${formatarMinutosAmigavel(v.utilMin)}${parteFds}${v.custo > 0 ? ' · ' + fmtMoeda(v.custo) : ''}`;
        });

        const msg = [
          '*RELATÓRIO CONSOLIDADO DE PAUSAS DA FROTA · GOMEX*',
          `*Período:* De ${dtIni} até ${dtFim}`,
          '',
          `*Ocorrências no Relatório:* ${selecionadas.length}`,
          `*Tempo Útil (Expediente):* ${formatarMinutosAmigavel(modoFds === 'somente_fds' ? 0 : tempoUtilTotalMin)}`,
          tempoFimSemanaTotalMin > 0
            ? `*Tempo Fim de Semana (Fora do Expediente - Separado):* ${formatarMinutosAmigavel(tempoFimSemanaTotalMin)}${modoFds === 'excluir' ? ` (${fimSemana.length} reg. não incluído(s) na lista)` : ''}`
            : '',
          `*Média por Parada:* ${formatarMinutosAmigavel(mediaMinutos)}`,
          totalCusto > 0 ? `*Total de Despesas:* ${fmtMoeda(totalCusto)}` : '',
          '',
          linhasVend.length ? '*Detalhamento por Vendedor:*' : '',
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
        const hojeStr = formatarDataHoje(agoraMs);
        const dt = (item.data || hojeStr).slice(0, 10);
        const hrIni = (item.hora_inicio || '08:00').slice(0, 5);
        const tempoMedioMin = parseInt(item.tempo_medio_minutos, 10) || 60;
        const status = item.status || 'aberto';
        const isFimDeSemana = ehDataFimDeSemana(dt);
        const diaFimSemana = nomeDiaFimDeSemana(dt);

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

          if (isFimDeSemana) {
            return {
              status: 'finalizado',
              isFimDeSemana: true,
              diaFimSemana,
              isAgendadoFuturo: false,
              isAberto: false,
              isEmAndamentoFimSemana: false,
              isFinalizado: true,
              isAtrasado: false,
              finalizadoComAtraso: false,
              tempoUtilMin: 0,
              tempoFimSemanaMin: duracaoRealMin,
              tempoDecorridoMin: duracaoRealMin,
              tempoExcedidoMin: 0,
              tempoMedioMin,
              horaInicio: hrIni,
              horaFimPrevista,
              badgeClass: 'fim-semana',
              badgeTexto: 'FIM DE SEMANA (' + diaFimSemana.toUpperCase() + ')',
              duracaoTexto: 'Tempo Fim de Semana: ' + formatarMinutosAmigavel(duracaoRealMin),
              statusMensagem: 'Fora do expediente (' + diaFimSemana + ') · Contabilizado separado (não entra no relatório)'
            };
          }

          const ultrapassou = tempoMedioMin > 0 && duracaoRealMin > tempoMedioMin;
          const excedidoMin = ultrapassou ? (duracaoRealMin - tempoMedioMin) : 0;

          return {
            status: 'finalizado',
            isFimDeSemana: false,
            diaFimSemana: '',
            isAgendadoFuturo: false,
            isAberto: false,
            isEmAndamentoFimSemana: false,
            isFinalizado: true,
            isAtrasado: false,
            finalizadoComAtraso: ultrapassou,
            tempoUtilMin: duracaoRealMin,
            tempoFimSemanaMin: 0,
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
        const isAgendadoFuturo = (status === 'agendado' && isDataFutura) || isDataFutura || isHorarioFuturoHoje || (status === 'agendado' && !isFimDeSemana);

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
            const diffMin = Math.max(0, Math.ceil((inicioMs - agoraMs) / 60000));
            textoQuando = diffMin > 60 ? ('Hoje às ' + hrIni) : ('Em ' + diffMin + ' min');
          }

          if (isFimDeSemana) {
            return {
              status: 'agendado',
              isFimDeSemana: true,
              diaFimSemana,
              isAgendadoFuturo: true,
              isAberto: false,
              isEmAndamentoFimSemana: false,
              isFinalizado: false,
              isAtrasado: false,
              tempoUtilMin: 0,
              tempoFimSemanaMin: 0,
              tempoDecorridoMin: 0,
              tempoMedioMin,
              horaInicio: hrIni,
              horaFimPrevista,
              progressoPct: 0,
              badgeClass: 'fim-semana',
              badgeTexto: 'AGENDADA · FIM DE SEMANA (' + textoQuando + ')',
              duracaoTexto: 'Fora de expediente (' + diaFimSemana + ')',
              statusMensagem: 'Agendada para o fim de semana (' + diaFimSemana + ') · Contabilizado separado (não entra no relatório)'
            };
          }

          return {
            status: 'agendado',
            isFimDeSemana: false,
            diaFimSemana: '',
            isAgendadoFuturo: true,
            isAberto: false,
            isEmAndamentoFimSemana: false,
            isFinalizado: false,
            isAtrasado: false,
            tempoUtilMin: 0,
            tempoFimSemanaMin: 0,
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

        // 3A. Ocorrência de Fim de Semana (no dia ou agendada cujo horário já passou) -> NÃO entra no expediente nem conta atraso!
        if (isFimDeSemana) {
          const limiteFds = fimDoFimDeSemanaTimestamp(dt) || agoraMs;
          const fimCalculoMs = Math.min(agoraMs, limiteFds);
          const fdsMin = Math.max(0, dividirMinutosExpedienteEFds(inicioMs, fimCalculoMs).fdsMin);
          return {
            status: 'fim_semana',
            isFimDeSemana: true,
            diaFimSemana,
            isAgendadoFuturo: false,
            isAberto: false,
            isEmAndamentoFimSemana: true,
            isFinalizado: false,
            isAtrasado: false,
            tempoUtilMin: 0,
            tempoFimSemanaMin: fdsMin,
            tempoDecorridoMin: fdsMin,
            tempoExcedidoMin: 0,
            tempoMedioMin,
            horaInicio: hrIni,
            horaFimPrevista,
            progressoPct: 0,
            badgeClass: 'fim-semana',
            badgeTexto: 'FIM DE SEMANA (' + diaFimSemana.toUpperCase() + ')',
            duracaoTexto: 'Tempo Fim de Semana: ' + formatarMinutosAmigavel(fdsMin),
            statusMensagem: 'Fora do expediente (' + diaFimSemana + ') · Contabilizado separado (não entra no relatório)'
          };
        }

        // 3B. Caso Aberto / Em Andamento em Dia Útil (desconta automaticamente sábados e domingos caso atravesse o fim de semana)
        const split = dividirMinutosExpedienteEFds(inicioMs, agoraMs);
        const decorridoUtilMin = split.utilMin;
        const fdsDurantePausaMin = split.fdsMin;
        const ultrapassou = tempoMedioMin > 0 && decorridoUtilMin > tempoMedioMin;
        const excedidoMin = ultrapassou ? (decorridoUtilMin - tempoMedioMin) : 0;
        const restanteMin = ultrapassou ? 0 : Math.max(0, tempoMedioMin - decorridoUtilMin);
        const progressoPct = Math.min(100, Math.round((decorridoUtilMin / (tempoMedioMin || 1)) * 100));

        if (ultrapassou) {
          return {
            status: 'aberto',
            isFimDeSemana: false,
            diaFimSemana: '',
            isAgendadoFuturo: false,
            isAberto: true,
            isEmAndamentoFimSemana: false,
            isFinalizado: false,
            isAtrasado: true,
            tempoUtilMin: decorridoUtilMin,
            tempoFimSemanaMin: fdsDurantePausaMin,
            tempoDecorridoMin: decorridoUtilMin,
            tempoExcedidoMin: excedidoMin,
            tempoMedioMin,
            horaInicio: hrIni,
            horaFimPrevista,
            progressoPct: 100,
            badgeClass: 'atrasado',
            badgeTexto: 'TEMPO EXCEDIDO (+' + formatarMinutosAmigavel(excedidoMin) + ')',
            duracaoTexto: 'Parado há ' + formatarMinutosAmigavel(decorridoUtilMin),
            statusMensagem: 'TEMPO MÉDIO ULTRAPASSADO em +' + formatarMinutosAmigavel(excedidoMin) + '! Previsão era ' + horaFimPrevista
          };
        } else {
          return {
            status: 'aberto',
            isFimDeSemana: false,
            diaFimSemana: '',
            isAgendadoFuturo: false,
            isAberto: true,
            isEmAndamentoFimSemana: false,
            isFinalizado: false,
            isAtrasado: false,
            tempoUtilMin: decorridoUtilMin,
            tempoFimSemanaMin: fdsDurantePausaMin,
            tempoDecorridoMin: decorridoUtilMin,
            tempoRestanteMin: restanteMin,
            tempoMedioMin,
            horaInicio: hrIni,
            horaFimPrevista,
            progressoPct: progressoPct,
            badgeClass: 'no-prazo',
            badgeTexto: 'No Prazo (Restam ' + formatarMinutosAmigavel(restanteMin) + ')',
            duracaoTexto: 'Parado há ' + formatarMinutosAmigavel(decorridoUtilMin),
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
            info.isFimDeSemana ? ('*Regime:* Fim de Semana (' + info.diaFimSemana + ' · Fora do expediente)') : '',
            '_Supervisor da Frota: ' + (ocr.responsavel || 'Hendreo') + '_'
          ].filter(Boolean).join('\n');
        } else if (info.isFimDeSemana) {
          msg = [
            '*GOMEX DISTRIBUIDORA · OCORRÊNCIA DE FIM DE SEMANA*',
            '',
            '*Veículo:* ' + (ocr.veiculo || ocr.placa || 'Frota Gomex'),
            '*Rota:* ' + (ocr.rota || '—'),
            '*Vendedor / Motorista:* ' + (ocr.vendedor || '—'),
            '*Motivo / Serviço:* ' + (ocr.tipo || 'Ocorrência'),
            '*Data / Início:* ' + dataFmt + ' às ' + (ocr.hora_inicio || '--:--'),
            '*Tempo Fim de Semana (Fora do Expediente):* ' + formatarMinutosAmigavel(info.tempoFimSemanaMin),
            ocr.local ? ('*Local:* ' + ocr.local) : '',
            ocr.custo ? ('*Custo:* ' + fmtMoeda(ocr.custo)) : '',
            ocr.descricao ? ('*Detalhes:* ' + ocr.descricao) : '',
            '',
            '*REGIME:* FIM DE SEMANA (Contabilizado separado · fora do relatório)',
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
        ['Todos', 'Abertos', 'Agendadas', 'Atrasados', 'Hoje', 'FimSemana', 'Finalizados'].forEach(tab => {
          const btn = $('btnOcrFiltro' + tab);
          if (btn) btn.classList.remove('active');
        });
        if (filtro === 'aberto' && $('btnOcrFiltroAbertos')) $('btnOcrFiltroAbertos').classList.add('active');
        else if (filtro === 'agendado' && $('btnOcrFiltroAgendadas')) $('btnOcrFiltroAgendadas').classList.add('active');
        else if (filtro === 'atrasado' && $('btnOcrFiltroAtrasados')) $('btnOcrFiltroAtrasados').classList.add('active');
        else if (filtro === 'hoje' && $('btnOcrFiltroHoje')) $('btnOcrFiltroHoje').classList.add('active');
        else if (filtro === 'fim_semana' && $('btnOcrFiltroFimSemana')) $('btnOcrFiltroFimSemana').classList.add('active');
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

        // Processar status com cálculo preciso de data, horário e separação de fim de semana
        const processadas = todas.map(item => {
          const info = calcularStatusTempoOcorrencia(item, agoraMs);
          return { item, info };
        });

        // Contagens operacionais (dias úteis) separadas do fim de semana
        const paradosAgora = processadas.filter(p => p.info.isAberto && !p.info.isFimDeSemana);
        const agendadas = processadas.filter(p => p.info.isAgendadoFuturo);
        const agendadasFds = agendadas.filter(p => p.info.isFimDeSemana);
        const atrasadas = processadas.filter(p => p.info.isAtrasado && !p.info.isFimDeSemana);
        const deHoje = processadas.filter(p => (p.item.data || '').startsWith(hojeStr));
        const deHojeUteis = deHoje.filter(p => !p.info.isFimDeSemana);
        const concluidasHoje = deHojeUteis.filter(p => p.item.status === 'finalizado');
        const fimDeSemanaLista = processadas.filter(p => p.info.isFimDeSemana || p.info.tempoFimSemanaMin > 0);

        const tempoHojeUtilMinutos = deHojeUteis.reduce((acc, p) => {
          return acc + (p.info.tempoUtilMin || 0);
        }, 0);
        const tempoFimSemanaTotalMinutos = processadas.reduce((acc, p) => {
          return acc + (p.info.tempoFimSemanaMin || 0);
        }, 0);

        // Atualização dos KPIs no topo (separando Tempo Útil vs Tempo Fim de Semana)
        if ($('ocrStatParadosAgora')) $('ocrStatParadosAgora').textContent = paradosAgora.length;
        if ($('ocrStatTempoHoje')) $('ocrStatTempoHoje').textContent = formatarMinutosAmigavel(tempoHojeUtilMinutos);
        if ($('ocrStatTempoHojeSub')) {
          $('ocrStatTempoHojeSub').textContent = ehDataFimDeSemana(hojeStr)
            ? 'Hoje é fim de semana (0 útil)'
            : 'Dias úteis (expediente)';
        }
        if ($('ocrStatTempoFimSemana')) $('ocrStatTempoFimSemana').textContent = formatarMinutosAmigavel(tempoFimSemanaTotalMinutos);
        if ($('ocrStatTempoFimSemanaSub')) {
          $('ocrStatTempoFimSemanaSub').textContent = fimDeSemanaLista.length + ' reg. sáb/dom (separado)';
        }
        if ($('ocrStatOcrHoje')) $('ocrStatOcrHoje').textContent = deHoje.length;
        if ($('ocrStatOcrHojeSub')) {
          $('ocrStatOcrHojeSub').textContent = ehDataFimDeSemana(hojeStr)
            ? 'Hoje · Fim de semana'
            : 'Registros no dia';
        }
        if ($('ocrStatConcluidasHoje')) $('ocrStatConcluidasHoje').textContent = concluidasHoje.length;
        if ($('ocrStatAgendadas')) $('ocrStatAgendadas').textContent = agendadas.length;
        if ($('ocrStatAgendadasSub')) {
          $('ocrStatAgendadasSub').textContent = agendadasFds.length > 0
            ? (agendadasFds.length + ' no fim de semana')
            : 'Serviços futuros';
        }

        // Atualização dos Badges das Abas de Filtros
        if ($('badgeOcrFiltroTodos')) $('badgeOcrFiltroTodos').textContent = todas.length;
        if ($('badgeOcrFiltroAbertos')) $('badgeOcrFiltroAbertos').textContent = paradosAgora.length;
        if ($('badgeOcrFiltroAgendadas')) $('badgeOcrFiltroAgendadas').textContent = agendadas.length;
        if ($('badgeOcrFiltroAtrasados')) $('badgeOcrFiltroAtrasados').textContent = atrasadas.length;
        if ($('badgeOcrFiltroHoje')) $('badgeOcrFiltroHoje').textContent = deHoje.length;
        if ($('badgeOcrFiltroFimSemana')) $('badgeOcrFiltroFimSemana').textContent = fimDeSemanaLista.length;
        if ($('badgeOcrFiltroFinalizados')) $('badgeOcrFiltroFinalizados').textContent = todas.filter(x => x.status === 'finalizado').length;

        // Banner chamativo de tempo médio excedido (apenas ocorrências de dias úteis)
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
          lista = lista.filter(p => p.info.isAberto && !p.info.isFimDeSemana);
        } else if (ocorrenciasState.filtro === 'agendado') {
          lista = lista.filter(p => p.info.isAgendadoFuturo);
        } else if (ocorrenciasState.filtro === 'atrasado') {
          lista = lista.filter(p => p.info.isAtrasado && !p.info.isFimDeSemana);
        } else if (ocorrenciasState.filtro === 'hoje') {
          lista = lista.filter(p => (p.item.data || '').startsWith(hojeStr));
        } else if (ocorrenciasState.filtro === 'fim_semana') {
          lista = lista.filter(p => p.info.isFimDeSemana || p.info.tempoFimSemanaMin > 0);
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
          const isFimSemana = info.isFimDeSemana;
          const podeFinalizar = isAberto || info.isEmAndamentoFimSemana;

          let cardClass = 'ocr-card';
          if (isFimSemana) cardClass += ' fim-semana';
          else if (isAtrasado) cardClass += ' atrasada';
          else if (isAgendado) cardClass += ' agendada';
          else if (isAberto) cardClass += ' em-aberto';
          else if (isFinalizado) cardClass += ' finalizada';

          let tempoPausaHtml = '';
          if (isFimSemana) {
            tempoPausaHtml = `
              <div class="ocr-duracao-highlight fim-semana">
                <svg class="i" style="width:14px;height:14px"><use href="#i-calendar-clock" /></svg>
                <span>${esc(info.duracaoTexto)}</span>
              </div>
            `;
          } else if (isAgendado) {
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

          // Barra de progresso para serviços em andamento com tempo médio (apenas expediente)
          let progressoHtml = '';
          if (isAberto && !isFimSemana && info.tempoMedioMin > 0) {
            const barClass = isAtrasado ? 'atrasado' : 'no-prazo';
            progressoHtml = `
              <div class="tempo-progress-wrap" title="Progresso em relação ao tempo médio estimado">
                <div class="tempo-progress-bar ${barClass}" style="width:${info.progressoPct}%"></div>
              </div>
            `;
          }

          const tempoUtilizadoCard = isFimSemana
            ? (isAgendado ? '0 min (FDS)' : ('FDS: ' + formatarMinutosAmigavel(info.tempoFimSemanaMin)))
            : (isAgendado ? 'Aguardando início' : (isAberto ? (info.tempoDecorridoMin + ' min até agora') : formatarMinutosAmigavel(info.tempoDecorridoMin)));
          const tempoUtilizadoLbl = isFimSemana ? 'Tempo Fim Semana' : 'Tempo Utilizado';
          const tempoUtilizadoCor = isFimSemana
            ? '#475569'
            : (isAgendado ? '#6366f1' : (isAtrasado ? 'var(--bad)' : (isFinalizado ? 'var(--ok)' : 'var(--warn)')));

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
                    <span class="ocr-time-lbl">${tempoUtilizadoLbl}</span>
                    <span class="ocr-time-val" style="color:${tempoUtilizadoCor}">
                      ${tempoUtilizadoCard}
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

                ${podeFinalizar ? `
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