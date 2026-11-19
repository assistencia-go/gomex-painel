// MÓDULO: OCORRÊNCIAS & CONTROLE DE PAUSAS DA FROTA (MOBILE-FIRST)
// ==============================================================================
const ocorrenciasState = {
  filtro: 'todos',
  supervisor: 'todos',
  busca: ''
};
window.ocorrenciasState = ocorrenciasState;

function somarDiasIso(dataStr, dias) {
  const partes = String(dataStr || '').slice(0, 10).split('-').map(Number);
  if (partes.length < 3 || isNaN(partes[0]) || isNaN(partes[1]) || isNaN(partes[2])) return String(dataStr || '').slice(0, 10);
  const dt = new Date(partes[0], partes[1] - 1, partes[2] + (Number(dias) || 0));
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}

function calcularDataFimLegada(dataIni, horaIni, horaFim) {
  const dt = String(dataIni || '').slice(0, 10);
  if (!dt || !horaFim) return '';
  if (horaIni && String(horaFim).slice(0, 5) < String(horaIni).slice(0, 5)) {
    return somarDiasIso(dt, 1);
  }
  return dt;
}

function calcularDuracaoTotalEntreDatas(dataIni, horaIni, dataFim, horaFim) {
  if (!horaIni || !horaFim) return 0;
  const dIni = String(dataIni || formatarDataHoje()).slice(0, 10);
  const dFim = String(dataFim || calcularDataFimLegada(dIni, horaIni, horaFim) || dIni).slice(0, 10);
  const tsIni = extrairTimestampOcorrencia(dIni, horaIni);
  const tsFim = extrairTimestampOcorrencia(dFim, horaFim);
  if (!tsIni || !tsFim || tsFim < tsIni) return 0;
  return Math.max(0, Math.floor((tsFim - tsIni) / 60000));
}

function calcularDuracaoMinutos(horaIni, horaFim, dataIni, dataFim) {
  if (!horaIni || !horaFim) return 0;
  if (dataIni || dataFim) {
    return calcularDuracaoTotalEntreDatas(dataIni, horaIni, dataFim, horaFim);
  }
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

// Verifica se data/hora cai fora do expediente contabilizado:
// Domingo o dia todo (0) ou Sábado a partir das 12:00 (6, >= 12h). Seg-Sex e Sáb até 12h contabilizam normalmente.
function ehDataFimDeSemana(dataStr, horaStr) {
  if (!dataStr) return false;
  const partes = String(dataStr).slice(0, 10).split('-').map(Number);
  if (partes.length < 3 || isNaN(partes[0]) || isNaN(partes[1]) || isNaN(partes[2])) return false;
  const dw = new Date(partes[0], partes[1] - 1, partes[2]).getDay();
  if (dw === 0) return true;
  if (dw === 6) {
    if (!horaStr) return false;
    const [hh, mm] = String(horaStr).slice(0, 5).split(':').map(Number);
    if (isNaN(hh)) return false;
    return (hh * 60 + (isNaN(mm) ? 0 : mm)) >= 12 * 60;
  }
  return false;
}
window.ehDataFimDeSemana = ehDataFimDeSemana;

function nomeDiaFimDeSemana(dataStr) {
  if (!dataStr) return '';
  const partes = String(dataStr).slice(0, 10).split('-').map(Number);
  if (partes.length < 3 || isNaN(partes[0]) || isNaN(partes[1]) || isNaN(partes[2])) return '';
  const dw = new Date(partes[0], partes[1] - 1, partes[2]).getDay();
  if (dw === 6) return 'Sábado após 12h';
  if (dw === 0) return 'Domingo';
  return '';
}

function obterDiaSemanaData(dataStr) {
  const partes = String(dataStr || '').slice(0, 10).split('-').map(Number);
  if (partes.length < 3 || isNaN(partes[0]) || isNaN(partes[1]) || isNaN(partes[2])) return -1;
  return new Date(partes[0], partes[1] - 1, partes[2]).getDay();
}

// Separa o intervalo [iniMs, fimMs] entre minutos contabilizados (Seg-Sex dia todo + Sáb até 12h)
// e minutos não contabilizados (Sáb após 12h + Domingo o dia todo)
function dividirMinutosExpedienteEFds(iniMs, fimMs) {
  if (!iniMs || !fimMs || fimMs <= iniMs) return { utilMin: 0, fdsMin: 0 };
  let utilMs = 0;
  let fdsMs = 0;
  let cursor = iniMs;
  let guard = 0;
  while (cursor < fimMs && guard++ < 800) {
    const dt = new Date(cursor);
    const y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
    const dw = dt.getDay();
    const proxDia = new Date(y, m, d + 1, 0, 0, 0, 0).getTime();
    if (dw === 0) {
      const segFim = Math.min(fimMs, proxDia);
      fdsMs += (segFim - cursor);
      cursor = segFim;
    } else if (dw === 6) {
      const meioDia = new Date(y, m, d, 12, 0, 0, 0).getTime();
      if (cursor < meioDia) {
        const segFim = Math.min(fimMs, meioDia);
        utilMs += (segFim - cursor);
        cursor = segFim;
      } else {
        const segFim = Math.min(fimMs, proxDia);
        fdsMs += (segFim - cursor);
        cursor = segFim;
      }
    } else {
      const segFim = Math.min(fimMs, proxDia);
      utilMs += (segFim - cursor);
      cursor = segFim;
    }
  }
  return {
    utilMin: Math.max(0, Math.floor(utilMs / 60000)),
    fdsMin: Math.max(0, Math.floor(fdsMs / 60000))
  };
}

// Avança a previsão de término pulando Sábado após 12h e Domingo
function calcularFimPrevistoUtil(inicioMs, tempoMedioMin) {
  let cursor = inicioMs;
  let remMs = Math.max(0, (Number(tempoMedioMin) || 0) * 60000);
  let guard = 0;
  while (remMs > 0 && guard++ < 800) {
    const dt = new Date(cursor);
    const y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
    const dw = dt.getDay();
    const proxDia = new Date(y, m, d + 1, 0, 0, 0, 0).getTime();
    if (dw === 0) {
      cursor = proxDia;
    } else if (dw === 6) {
      const meioDia = new Date(y, m, d, 12, 0, 0, 0).getTime();
      if (cursor >= meioDia) {
        cursor = proxDia;
      } else {
        const avail = meioDia - cursor;
        if (remMs <= avail) {
          cursor += remMs;
          remMs = 0;
        } else {
          remMs -= avail;
          cursor = proxDia;
        }
      }
    } else {
      const avail = proxDia - cursor;
      if (remMs <= avail) {
        cursor += remMs;
        remMs = 0;
      } else {
        remMs -= avail;
        cursor = proxDia;
      }
    }
  }
  const dIni = new Date(inicioMs);
  const dFim = new Date(cursor);
  const hhmm = String(dFim.getHours()).padStart(2, '0') + ':' + String(dFim.getMinutes()).padStart(2, '0');
  const mesmoDia = dIni.getFullYear() === dFim.getFullYear() && dIni.getMonth() === dFim.getMonth() && dIni.getDate() === dFim.getDate();
  const dataPrev = formatarDataHoje(cursor);
  return {
    fimPrevistoMs: cursor,
    horaFimPrevista: mesmoDia ? hhmm : (formatarData(dataPrev).slice(0, 5) + ' ' + hhmm)
  };
}

function definirHoraAgora(inputId) {
  const el = $(inputId);
  if (!el) return;
  if (inputId === 'ocrInputDataFim') {
    el.value = formatarDataHoje();
    atualizarCalculoDuracaoModal();
    return;
  }
  el.value = formatarHoraAtual();
  if (inputId === 'ocrInputHoraFim' && $('ocrInputDataFim') && !$('ocrInputDataFim').value) {
    const dIni = ($('ocrInputData')?.value || '').trim();
    const hj = formatarDataHoje();
    $('ocrInputDataFim').value = (dIni && dIni > hj) ? dIni : hj;
  }
  atualizarCalculoDuracaoModal();
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
  const isFds = ehDataFimDeSemana(dt, hr);
  const dw = obterDiaSemanaData(dt);
  const diaFds = nomeDiaFimDeSemana(dt);

  if (hintBadge) {
    if (isFds) {
      hintBadge.textContent = 'Fora de expediente (' + diaFds + ')';
      hintBadge.style.color = '#475569';
    } else if (isFutura) {
      hintBadge.textContent = (dw === 6 ? 'Sábado até 12h · ' : '') + 'Serviço Futuro (Agendado)';
      hintBadge.style.color = '#6366f1';
    } else if (isHojeFuturo) {
      hintBadge.textContent = 'Hoje mais tarde (Agendado)';
      hintBadge.style.color = '#6366f1';
    } else if (dw === 6) {
      hintBadge.textContent = 'Sábado · Expediente até 12h';
      hintBadge.style.color = 'var(--accent-hi)';
    } else {
      hintBadge.textContent = 'Expediente (Seg–Sáb 12h)';
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
  const dataFimEl = $('ocrInputDataFim');
  if (status === 'finalizado') {
    if (horaFimEl && !horaFimEl.value) {
      horaFimEl.value = formatarHoraAtual();
    }
    if (dataFimEl && !dataFimEl.value) {
      const dIni = ($('ocrInputData')?.value || '').trim();
      const hj = formatarDataHoje();
      dataFimEl.value = (dIni && dIni > hj) ? dIni : hj;
    }
  } else if (status === 'aberto' || status === 'agendado') {
    if (horaFimEl) {
      horaFimEl.value = '';
    }
    if (dataFimEl) {
      dataFimEl.value = '';
    }
  }
  atualizarCalculoDuracaoModal();
}
window.aoMudarStatusOcorrencia = aoMudarStatusOcorrencia;

      function obterResponsavelPadraoOcorrencia() {
        const uNorm = (typeof normalizarUsuario === 'function' && state?.currentUser)
          ? normalizarUsuario(state.currentUser)
          : String(state?.currentUser || '').toLowerCase().trim();
        const label = ($('userNameLabel')?.textContent || '').trim();
        if (uNorm && uNorm !== 'gomex' && label) {
          return label;
        }
        return 'Hendreo';
      }

      function resolverSupervisorPorRotaOuVendedor(rota, vendedor, placa) {
        const lista = (typeof EQUIPES_VENDEDORES_PADRAO !== 'undefined' && Array.isArray(EQUIPES_VENDEDORES_PADRAO))
          ? EQUIPES_VENDEDORES_PADRAO
          : [];
        const infos = (typeof EQUIPES_INFO !== 'undefined' && EQUIPES_INFO) ? EQUIPES_INFO : {};
        const norm = (s) => (typeof normalizarTextoBusca === 'function')
          ? normalizarTextoBusca(s)
          : String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

        const toInfo = (eqId, supOverride = '') => {
          const info = eqId ? infos[String(eqId)] : null;
          if (!info && !supOverride) return null;
          const supClean = String(supOverride || '').trim();
          const parts = supClean ? supClean.split(/\s+/) : [];
          const supCurto = supClean
            ? (parts.length > 1 ? parts[0] + ' ' + parts[parts.length - 1] : supClean)
            : (info ? info.supervisorCurto : '');
          return {
            equipe: String(eqId || ''),
            supervisor: supClean || (info ? info.supervisor : ''),
            supervisorCurto: supCurto
          };
        };

        // 1. Prioridade: rota informada na ocorrência
        const rDigits = String(rota || '').replace(/\D/g, '');
        if (rDigits && lista.length) {
          const porRota = lista.find(x => x.rota === rDigits);
          if (porRota) return toInfo(porRota.equipe, porRota.supervisor);
        }

        // 2. Nome do vendedor no catálogo oficial (exato ou equipe única)
        const vNorm = norm(vendedor);
        if (vNorm && lista.length) {
          const exato = lista.find(x => norm(x.nome) === vNorm);
          if (exato) return toInfo(exato.equipe, exato.supervisor);

          const vTokens = vNorm.split(/\s+/).filter(Boolean);
          if (vTokens.length) {
            const matches = lista.filter(x => {
              const nTokens = norm(x.nome).split(/\s+/).filter(Boolean);
              return vTokens.every(t => nTokens.some(nt => nt === t || (t.length >= 3 && nt.startsWith(t))));
            });
            const equipesUnicas = [...new Set(matches.map(m => m.equipe))];
            if (equipesUnicas.length === 1) {
              return toInfo(equipesUnicas[0], matches[0].supervisor);
            }
          }
        }

        // 3. Fallback: procurar rota pela placa ou motorista na frota/vistorias
        const pNorm = String(placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
        const buscarRotaEmLista = (arr, campoPlaca, campoMot) => {
          if (!Array.isArray(arr)) return '';
          for (const rec of arr) {
            if (isVistoriaInativaOuTeste(rec)) continue;
            const recPlaca = String(rec[campoPlaca] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
            const recRota = String(rec.rota || '').replace(/\D/g, '');
            if (!recRota) continue;
            if (pNorm && recPlaca && recPlaca === pNorm) return recRota;
            if (vNorm && rec[campoMot] && norm(rec[campoMot]) === vNorm) return recRota;
          }
          return '';
        };

        const rotaEncontrada = buscarRotaEmLista(gastosState?.veiculos, 'placa', 'motorista')
          || buscarRotaEmLista(state?.all, 'placa', 'motorista');
        if (rotaEncontrada && lista.length) {
          const porRotaFb = lista.find(x => x.rota === rotaEncontrada);
          if (porRotaFb) return toInfo(porRotaFb.equipe, porRotaFb.supervisor);
        }

        return null;
      }

      function resolverSupervisorOcorrencia(item) {
        if (!item || typeof item !== 'object') {
          return { equipe: '', supervisor: 'Não informado', supervisorCurto: 'Não informado' };
        }
        const supManual = String(item.supervisor || '').trim();
        const resolvido = resolverSupervisorPorRotaOuVendedor(item.rota, item.vendedor, item.placa || item.veiculo);
        if (supManual) {
          if (resolvido && (supManual === resolvido.supervisorCurto || supManual === resolvido.supervisor)) {
            return resolvido;
          }
          return {
            equipe: resolvido ? resolvido.equipe : '',
            supervisor: supManual,
            supervisorCurto: supManual
          };
        }
        if (resolvido) return resolvido;
        return { equipe: '', supervisor: 'Não informado', supervisorCurto: 'Não informado' };
      }
      window.resolverSupervisorOcorrencia = resolverSupervisorOcorrencia;

      function atualizarSupervisorAutomaticoModalOcorrencia() {
        const supEl = $('ocrInputSupervisor');
        if (!supEl || supEl.dataset.manual === '1') return;
        const rota = ($('ocrInputRota')?.value || '').trim();
        const vendedor = ($('ocrInputVendedor')?.value || '').trim();
        const veiculo = ($('ocrInputVeiculo')?.value || '').trim();
        const resolvido = resolverSupervisorPorRotaOuVendedor(rota, vendedor, veiculo);
        supEl.value = resolvido ? resolvido.supervisorCurto : '';
      }
      window.atualizarSupervisorAutomaticoModalOcorrencia = atualizarSupervisorAutomaticoModalOcorrencia;

      function aoMudarRotaOcorrencia() {
        if ($('ocrInputRota')) $('ocrInputRota').style.borderColor = '';
        atualizarSupervisorAutomaticoModalOcorrencia();
      }
      window.aoMudarRotaOcorrencia = aoMudarRotaOcorrencia;

      function aoDigitarVendedorOcorrencia(nome) {
        if ($('ocrInputVendedor')) $('ocrInputVendedor').style.borderColor = '';
        const term = (nome || '').trim().toLowerCase();
        if (!term) {
          atualizarSupervisorAutomaticoModalOcorrencia();
          return;
        }
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
        if ($('ocrInputRota') && !$('ocrInputRota').value && typeof EQUIPES_VENDEDORES_PADRAO !== 'undefined') {
          const norm = (s) => (typeof normalizarTextoBusca === 'function')
            ? normalizarTextoBusca(s)
            : String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          const tNorm = norm(nome);
          const exato = EQUIPES_VENDEDORES_PADRAO.find(x => norm(x.nome) === tNorm);
          if (exato) $('ocrInputRota').value = exato.rota;
        }
        atualizarSupervisorAutomaticoModalOcorrencia();
      }
      window.aoDigitarVendedorOcorrencia = aoDigitarVendedorOcorrencia;

function atualizarCalculoDuracaoModal() {
  const dt = ($('ocrInputData')?.value || formatarDataHoje()).trim();
  const dtFimRaw = ($('ocrInputDataFim')?.value || '').trim();
  const ini = ($('ocrInputHoraInicio')?.value || formatarHoraAtual()).trim();
  const fim = ($('ocrInputHoraFim')?.value || '').trim();
  const tempoMedio = parseInt($('ocrInputTempoMedio')?.value, 10) || 60;
  const status = $('ocrSelectStatus')?.value || 'aberto';

  const txtEl = $('ocrTextoCalculoDuracao');
  const badgeEl = $('ocrBadgeCalculoDuracao');
  if (!txtEl && !badgeEl) return;

  if (dtFimRaw && fim) {
    const tsIni = extrairTimestampOcorrencia(dt, ini);
    const tsFim = extrairTimestampOcorrencia(dtFimRaw, fim);
    if (tsIni && tsFim && tsFim < tsIni) {
      if (txtEl) txtEl.innerHTML = '<span style="color:var(--bad)">Data/hora final não pode ser anterior ao início!</span>';
      if (badgeEl) badgeEl.innerHTML = '<span class="badge-status-pausa atrasado">Intervalo inválido</span>';
      return;
    }
  }

  const dtFimEfetiva = fim ? (dtFimRaw || calcularDataFimLegada(dt, ini, fim)) : dtFimRaw;
  const info = calcularStatusTempoOcorrencia({
    data: dt,
    data_fim: dtFimEfetiva,
    hora_inicio: ini,
    hora_fim: fim,
    duracao_minutos: (ini && fim) ? calcularDuracaoTotalEntreDatas(dt, ini, dtFimEfetiva || dt, fim) : 0,
    tempo_medio_minutos: tempoMedio,
    status: fim ? 'finalizado' : status
  });

  if (txtEl) {
    if (info.isFimDeSemana && info.isAgendadoFuturo) {
      txtEl.innerHTML = 'Agendado fora do expediente (<b style="color:#475569">' + esc(info.diaFimSemana) + ' · ' + formatarData(dt) + ' às ' + ini + '</b>) · Não entra no tempo útil';
    } else if (info.isFimDeSemana && info.isFinalizado) {
      txtEl.innerHTML = 'Fora do expediente (' + esc(info.diaFimSemana) + ') · Tempo não contabilizado: <b style="color:#475569">' + formatarMinutosAmigavel(info.tempoFimSemanaMin) + '</b> (separado do relatório)';
    } else if (info.isFimDeSemana) {
      txtEl.innerHTML = 'Fora do expediente (' + esc(info.diaFimSemana) + ') · Tempo não contabilizado: <b style="color:#475569">' + formatarMinutosAmigavel(info.tempoFimSemanaMin) + '</b> (não conta atraso)';
    } else if (info.isFinalizado) {
      const fdsDesconto = info.tempoFimSemanaMin > 0
        ? (' · Descontado (Sáb &gt;12h/Dom): <b>' + formatarMinutosAmigavel(info.tempoFimSemanaMin) + '</b>')
        : '';
      txtEl.innerHTML = 'Pausa finalizada · Tempo útil (Seg–Sáb 12h): <b style="color:var(--ok)">' + formatarMinutosAmigavel(info.tempoUtilMin) + '</b>' + fdsDesconto;
    } else if (info.isAgendadoFuturo) {
      txtEl.innerHTML = 'Agendado para <b style="color:#6366f1">' + formatarData(dt) + ' às ' + ini + '</b> · Término previsto às <b>' + info.horaFimPrevista + '</b>';
    } else if (info.isAtrasado) {
      const fdsDescAb = info.tempoFimSemanaMin > 0 ? (' (descontado ' + formatarMinutosAmigavel(info.tempoFimSemanaMin) + ' sáb &gt;12h/dom)') : '';
      txtEl.innerHTML = '<span style="color:var(--bad)">Tempo Médio Excedido em +' + formatarMinutosAmigavel(info.tempoExcedidoMin) + '! Término previsto era ' + info.horaFimPrevista + fdsDescAb + '</span>';
    } else {
      const fdsDescPrazo = info.tempoFimSemanaMin > 0 ? (' · Descontado ' + formatarMinutosAmigavel(info.tempoFimSemanaMin) + ' sáb &gt;12h/dom') : '';
      txtEl.innerHTML = 'Em andamento · Restam <b>' + formatarMinutosAmigavel(info.tempoRestanteMin) + '</b> (Término previsto: <b>' + info.horaFimPrevista + '</b>)' + fdsDescPrazo;
    }
  }

  if (badgeEl) {
    if (info.isFimDeSemana) {
      badgeEl.innerHTML = '<span class="badge-status-pausa fim-semana">Sáb &gt;12h / Dom (Separado)</span>';
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
  const dataInicialVal = ocr ? (ocr.data || formatarDataHoje()) : formatarDataHoje();
  const horaInicialVal = ocr ? (ocr.hora_inicio || formatarHoraAtual()) : formatarHoraAtual();
  const horaFimVal = ocr ? (ocr.hora_fim || '') : '';
  const dataFimVal = ocr
    ? (ocr.data_fim || (horaFimVal ? calcularDataFimLegada(dataInicialVal, horaInicialVal, horaFimVal) : ''))
    : '';
  if ($('ocrInputData')) $('ocrInputData').value = dataInicialVal;
  if ($('ocrInputHoraInicio')) $('ocrInputHoraInicio').value = horaInicialVal;
  if ($('ocrInputDataFim')) $('ocrInputDataFim').value = dataFimVal;
  if ($('ocrInputHoraFim')) $('ocrInputHoraFim').value = horaFimVal;

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

        const supInput = $('ocrInputSupervisor');
        if (supInput) {
          const supAuto = ocr ? resolverSupervisorPorRotaOuVendedor(ocr.rota, ocr.vendedor, ocr.placa || ocr.veiculo) : null;
          const supSalvo = ocr ? String(ocr.supervisor || '').trim() : '';
          supInput.value = supSalvo || (supAuto ? supAuto.supervisorCurto : '');
          supInput.dataset.manual = (supSalvo && (!supAuto || (supSalvo !== supAuto.supervisorCurto && supSalvo !== supAuto.supervisor))) ? '1' : '';
        }

        const padraoAbertura = obterResponsavelPadraoOcorrencia();
        if ($('ocrInputResponsavel')) {
          $('ocrInputResponsavel').value = ocr ? (ocr.responsavel || '') : padraoAbertura;
        }

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
        const dataFimRaw = ($('ocrInputDataFim')?.value || '').trim();
        const horaInicio = ($('ocrInputHoraInicio')?.value || '').trim() || formatarHoraAtual();
        const horaFim = ($('ocrInputHoraFim')?.value || '').trim();
        const tempoMedioMin = parseInt($('ocrInputTempoMedio')?.value, 10) || 60;
        const tipo = $('ocrSelectTipo')?.value || 'Pneu Furado / Borracharia';
        const veiculo = ($('ocrInputVeiculo')?.value || '').trim().toUpperCase();
        const local = ($('ocrInputLocal')?.value || '').trim();
        const descricao = ($('ocrInputDescricao')?.value || '').trim();
        const custo = parseFloat($('ocrInputCusto')?.value) || 0;
        const supDigitado = ($('ocrInputSupervisor')?.value || '').trim();
        const supAuto = resolverSupervisorPorRotaOuVendedor(rota, vendedor, veiculo);
        const supervisor = supDigitado || (supAuto ? supAuto.supervisorCurto : '');
        const responsavel = ($('ocrInputResponsavel')?.value || '').trim() || obterResponsavelPadraoOcorrencia();
        let status = $('ocrSelectStatus')?.value || 'aberto';

  if (dataFimRaw && !horaFim) {
    toast('Informe a Hora Retorno / Fim para concluir o período!', 'error');
    if ($('ocrInputHoraFim')) $('ocrInputHoraFim').focus();
    return;
  }

  const dataFim = horaFim ? (dataFimRaw || calcularDataFimLegada(data, horaInicio, horaFim)) : '';
  const tsInicio = extrairTimestampOcorrencia(data, horaInicio);
  const tsFim = (dataFim && horaFim) ? extrairTimestampOcorrencia(dataFim, horaFim) : null;
  if (tsInicio && tsFim && tsFim < tsInicio) {
    toast('A data e hora final não podem ser anteriores ao início!', 'error');
    if ($('ocrInputDataFim')) $('ocrInputDataFim').focus();
    return;
  }

  // Auto-detecção de agendamento se for data futura e não estiver finalizado
  const hojeStr = formatarDataHoje();
  const agoraMs = Date.now();
  const isDataFutura = data > hojeStr;
  const isHorarioFuturoHoje = data === hojeStr && tsInicio && tsInicio > agoraMs;

  if (horaFim) {
    status = 'finalizado';
  } else if (isDataFutura || isHorarioFuturoHoje) {
    status = 'agendado';
  }

  const duracaoMinutos = (tsInicio && tsFim)
    ? dividirMinutosExpedienteEFds(tsInicio, tsFim).utilMin
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
              data_fim: dataFim,
              hora_inicio: horaInicio,
              hora_fim: horaFim,
              duracao_minutos: duracaoMinutos,
              tempo_medio_minutos: tempoMedioMin,
              status,
              local,
              descricao,
              custo,
              supervisor,
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
            data_fim: dataFim,
            hora_inicio: horaInicio,
            hora_fim: horaFim,
            duracao_minutos: duracaoMinutos,
            tempo_medio_minutos: tempoMedioMin,
            status,
            local,
            descricao,
            custo,
            supervisor,
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
  ocr.data_fim = '';
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

  const hojeFim = formatarDataHoje();
  const horaAgora = formatarHoraAtual();
  ocr.data_fim = (ocr.data && ocr.data > hojeFim) ? ocr.data : hojeFim;
  ocr.hora_fim = horaAgora;
  ocr.status = 'finalizado';
  const tsIni = extrairTimestampOcorrencia(ocr.data || hojeFim, ocr.hora_inicio || horaAgora);
  const tsFim = extrairTimestampOcorrencia(ocr.data_fim, horaAgora);
  const splitFin = (tsIni && tsFim && tsFim >= tsIni)
    ? dividirMinutosExpedienteEFds(tsIni, tsFim)
    : { utilMin: calcularDuracaoMinutos(ocr.hora_inicio || horaAgora, horaAgora), fdsMin: 0 };
  ocr.duracao_minutos = splitFin.utilMin;
  ocr.atualizado_em = new Date().toISOString();

  await sincronizarGastosComServidor('push');
  renderOcorrenciasView();
  toast('Pausa de ' + ocr.vendedor + ' finalizada! Tempo útil: ' + formatarMinutosAmigavel(ocr.duracao_minutos));
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
// RELATÓRIO DE OCORRÊNCIAS & CONTROLE DE PAUSAS (SUPERVISOR, FILTROS & PERÍODO)
// ==============================================================================
function obterLabelSupervisorFiltro(supKey) {
  if (!supKey || supKey === 'todos') return 'Todos os Supervisores';
  if (supKey === 'outros') return 'Sem equipe fixa';
  const infos = (typeof EQUIPES_INFO !== 'undefined' && EQUIPES_INFO) ? EQUIPES_INFO : {};
  const info = infos[String(supKey)];
  if (info) return `${info.supervisorCurto} (Equipe ${info.codigo})`;
  return String(supKey);
}

function obterNomeCompletoSupervisorFiltro(supKey) {
  if (!supKey || supKey === 'todos') return 'Todos os Supervisores (Todas as Equipes)';
  if (supKey === 'outros') return 'Sem equipe fixa / Avulsos';
  const infos = (typeof EQUIPES_INFO !== 'undefined' && EQUIPES_INFO) ? EQUIPES_INFO : {};
  const info = infos[String(supKey)];
  if (info) return `${info.supervisor} (Equipe ${info.codigo})`;
  return String(supKey);
}

function popularFiltrosDinamicosRelatorioOcr() {
  const todas = Array.isArray(gastosState.ocorrencias) ? gastosState.ocorrencias : [];
  const supAtual = ($('ocrRelSupervisor')?.value || 'todos').trim();

  // Verifica se há registros sem equipe oficial (para mostrar/ocultar chip "Sem equipe fixa")
  const temOutros = todas.some(x => !resolverSupervisorOcorrencia(x).equipe);
  const btnOutros = $('btnChipSupOutros');
  if (btnOutros) btnOutros.hidden = !temOutros;

  // Vendedores (filtrados pelo supervisor selecionado quando aplicável)
  const selVend = $('ocrRelVendedor');
  if (selVend) {
    const valAnt = selVend.value;
    const setVend = new Set();
    const normV = (s) => (typeof normalizarTextoBusca === 'function')
      ? normalizarTextoBusca(s)
      : String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    if (supAtual && supAtual !== 'todos' && supAtual !== 'outros' && typeof EQUIPES_VENDEDORES_PADRAO !== 'undefined') {
      EQUIPES_VENDEDORES_PADRAO.forEach(v => {
        if (v.equipe === supAtual && v.nome) setVend.add(v.nome);
      });
      todas.forEach(x => {
        if (x.vendedor && resolverSupervisorOcorrencia(x).equipe === supAtual) {
          const rDig = String(x.rota || '').replace(/\D/g, '');
          const oficial = EQUIPES_VENDEDORES_PADRAO.find(e => e.rota === rDig);
          if (!oficial || !normV(oficial.nome).includes(normV(x.vendedor))) {
            setVend.add(String(x.vendedor).trim());
          }
        }
      });
    } else {
      if (typeof EQUIPES_VENDEDORES_PADRAO !== 'undefined') {
        EQUIPES_VENDEDORES_PADRAO.forEach(v => { if (v.nome) setVend.add(v.nome); });
      }
      todas.forEach(x => {
        if (!x.vendedor) return;
        const rDig = String(x.rota || '').replace(/\D/g, '');
        const oficial = (rDig && typeof EQUIPES_VENDEDORES_PADRAO !== 'undefined')
          ? EQUIPES_VENDEDORES_PADRAO.find(e => e.rota === rDig)
          : null;
        if (!oficial || !normV(oficial.nome).includes(normV(x.vendedor))) {
          setVend.add(String(x.vendedor).trim());
        }
      });
    }
    const listaVend = Array.from(setVend).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    selVend.innerHTML = '<option value="">Todos os vendedores</option>' +
      listaVend.map(m => '<option value="' + esc(m) + '">' + esc(m) + '</option>').join('');
    if (valAnt && listaVend.some(v => v.toLowerCase() === valAnt.toLowerCase())) {
      selVend.value = valAnt;
    } else {
      selVend.value = '';
    }
  }

  // Tipos / Motivos
  const selTipo = $('ocrRelTipo');
  if (selTipo) {
    const valAnt = selTipo.value;
    const tiposPadrao = [
      'Pneu Furado / Borracharia',
      'Manutenção Rápida / Troca de Peça',
      'Quebra Mecânica',
      'Problema Elétrico / Bateria',
      'Troca de Óleo / Filtro',
      'Reparo no Banco',
      'Revisão Preventiva',
      'Guincho / Socorro na Pista',
      'Acidente / Colisão',
      'Fiscalização / Trânsito',
      'Outro Imprevisto'
    ];
    const setTipos = new Set(tiposPadrao);
    todas.forEach(x => { if (x.tipo) setTipos.add(String(x.tipo).trim()); });
    const listaTipos = Array.from(setTipos).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    selTipo.innerHTML = '<option value="">Todos os motivos</option>' +
      listaTipos.map(t => '<option value="' + esc(t) + '">' + esc(t) + '</option>').join('');
    if (valAnt && setTipos.has(valAnt)) selTipo.value = valAnt;
  }

  // Aberto por (Responsável)
  const selResp = $('ocrRelAbertoPor');
  if (selResp) {
    const valAnt = selResp.value;
    const setResp = new Set();
    todas.forEach(x => {
      const r = String(x.responsavel || '').trim();
      if (r) setResp.add(r);
    });
    const listaResp = Array.from(setResp).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    selResp.innerHTML = '<option value="">Todos os responsáveis</option>' +
      listaResp.map(r => '<option value="' + esc(r) + '">' + esc(r) + '</option>').join('');
    if (valAnt && setResp.has(valAnt)) selResp.value = valAnt;
  }
}

function selecionarSupervisorRelatorioOcr(supKey = 'todos', atualizar = true) {
  const val = supKey || 'todos';
  if ($('ocrRelSupervisor')) $('ocrRelSupervisor').value = val;
  const chips = $('ocrRelSupervisorChips');
  if (chips) {
    chips.querySelectorAll('.ocr-chip-sup').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sup === val);
    });
  }
  popularFiltrosDinamicosRelatorioOcr();
  if (atualizar) atualizarPreviaRelatorioOcr();
}
window.selecionarSupervisorRelatorioOcr = selecionarSupervisorRelatorioOcr;

function selecionarAgrupamentoRelatorioOcr(modo = 'por_supervisor', atualizar = true) {
  const val = (modo === 'cronologico') ? 'cronologico' : 'por_supervisor';
  if ($('ocrRelAgrupamento')) $('ocrRelAgrupamento').value = val;
  const grp = $('ocrRelAgrupamentoBtns');
  if (grp) {
    grp.querySelectorAll('.ocr-seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.agr === val);
    });
  }
  if (atualizar) atualizarPreviaRelatorioOcr();
}
window.selecionarAgrupamentoRelatorioOcr = selecionarAgrupamentoRelatorioOcr;

function toggleMaisFiltrosRelatorioOcr(forceOpen) {
  const body = $('ocrRelMaisFiltrosBody');
  const wrap = $('ocrRelMaisFiltrosWrap');
  const btn = $('btnOcrRelToggleFiltros');
  if (!body || !wrap) return;
  const abrir = (typeof forceOpen === 'boolean') ? forceOpen : !wrap.classList.contains('is-open');
  wrap.classList.toggle('is-open', abrir);
  if (btn) btn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
}
window.toggleMaisFiltrosRelatorioOcr = toggleMaisFiltrosRelatorioOcr;

function limparFiltrosRelatorioOcr() {
  if ($('ocrRelBusca')) $('ocrRelBusca').value = '';
  if ($('ocrRelStatus')) $('ocrRelStatus').value = '';
  if ($('ocrRelTipo')) $('ocrRelTipo').value = '';
  if ($('ocrRelAbertoPor')) $('ocrRelAbertoPor').value = '';
  if ($('ocrRelCustoFiltro')) $('ocrRelCustoFiltro').value = '';
  if ($('ocrRelModoFimSemana')) $('ocrRelModoFimSemana').value = 'excluir';
  if ($('ocrRelOrdenacao')) $('ocrRelOrdenacao').value = 'data_desc';
  if ($('ocrRelVendedor')) $('ocrRelVendedor').value = '';
  selecionarSupervisorRelatorioOcr('todos', false);
  atualizarPreviaRelatorioOcr();
}
window.limparFiltrosRelatorioOcr = limparFiltrosRelatorioOcr;

function abrirModalRelatorioOcorrencias(supervisorInicial) {
  const supAlvo = (supervisorInicial && typeof supervisorInicial === 'string')
    ? supervisorInicial
    : (ocorrenciasState.supervisor || 'todos');

  if ($('ocrRelBusca')) $('ocrRelBusca').value = '';
  if ($('ocrRelStatus')) $('ocrRelStatus').value = '';
  if ($('ocrRelTipo')) $('ocrRelTipo').value = '';
  if ($('ocrRelAbertoPor')) $('ocrRelAbertoPor').value = '';
  if ($('ocrRelCustoFiltro')) $('ocrRelCustoFiltro').value = '';
  if ($('ocrRelModoFimSemana')) $('ocrRelModoFimSemana').value = 'excluir';
  if ($('ocrRelOrdenacao')) $('ocrRelOrdenacao').value = 'data_desc';
  if ($('ocrRelVendedor')) $('ocrRelVendedor').value = '';

  selecionarSupervisorRelatorioOcr(supAlvo, false);
  selecionarAgrupamentoRelatorioOcr('por_supervisor', false);

  // No mobile começa recolhido para mostrar KPIs e lista imediatamente; no desktop aberto
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  toggleMaisFiltrosRelatorioOcr(!isMobile);

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
  const supFiltro = ($('ocrRelSupervisor')?.value || 'todos').trim();
  const agrupamento = ($('ocrRelAgrupamento')?.value || 'por_supervisor').trim();
  const vend = ($('ocrRelVendedor')?.value || '').trim().toLowerCase();
  const statusFiltro = ($('ocrRelStatus')?.value || '').trim();
  const tipoFiltro = ($('ocrRelTipo')?.value || '').trim();
  const abertoPorFiltro = ($('ocrRelAbertoPor')?.value || '').trim().toLowerCase();
  const custoFiltro = ($('ocrRelCustoFiltro')?.value || '').trim();
  const buscaFiltro = ($('ocrRelBusca')?.value || '').trim().toLowerCase();
  const modoFds = ($('ocrRelModoFimSemana')?.value || 'excluir').trim();
  const ordenacao = ($('ocrRelOrdenacao')?.value || 'data_desc').trim();
  const agoraMs = Date.now();

  const baseFiltrada = todas.map(item => {
    const supInfo = resolverSupervisorOcorrencia(item);
    const info = calcularStatusTempoOcorrencia(item, agoraMs);
    return { item, info, supInfo };
  }).filter(({ item, info, supInfo }) => {
    const dt = (item.data || '').slice(0, 10);
    const dtItemFim = (item.data_fim || item.data || '').slice(0, 10);
    if (dtIni && dtItemFim < dtIni) return false;
    if (dtFim && dt > dtFim) return false;

    if (supFiltro && supFiltro !== 'todos') {
      if (supFiltro === 'outros') {
        if (supInfo.equipe) return false;
      } else if (supInfo.equipe !== supFiltro) {
        return false;
      }
    }

    if (vend) {
      const normV = (s) => (typeof normalizarTextoBusca === 'function')
        ? normalizarTextoBusca(s)
        : String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const vendNorm = normV(vend);
      const itemVendNorm = normV(item.vendedor);
      const rDigits = String(item.rota || '').replace(/\D/g, '');
      const vendOficial = (rDigits && typeof EQUIPES_VENDEDORES_PADRAO !== 'undefined')
        ? EQUIPES_VENDEDORES_PADRAO.find(e => e.rota === rDigits)
        : null;
      const itemOficialNorm = vendOficial ? normV(vendOficial.nome) : '';
      const bateDireto = itemVendNorm.includes(vendNorm);
      const bateOficial = Boolean(itemOficialNorm && itemOficialNorm.includes(vendNorm));
      if (!bateDireto && !bateOficial) return false;
    }

    if (statusFiltro) {
      if (statusFiltro === 'aberto' && !(info.isAberto || info.isEmAndamentoFimSemana)) return false;
      if (statusFiltro === 'atrasado' && !(info.isAtrasado && !info.isFimDeSemana)) return false;
      if (statusFiltro === 'no_prazo' && !(info.isAberto && !info.isAtrasado && !info.isFimDeSemana)) return false;
      if (statusFiltro === 'agendado' && !info.isAgendadoFuturo) return false;
      if (statusFiltro === 'finalizado' && !info.isFinalizado) return false;
    }

    if (tipoFiltro && String(item.tipo || '').trim() !== tipoFiltro) return false;
    if (abertoPorFiltro && String(item.responsavel || '').trim().toLowerCase() !== abertoPorFiltro) return false;

    const custoVal = Number(item.custo) || 0;
    if (custoFiltro === 'com_custo' && !(custoVal > 0)) return false;
    if (custoFiltro === 'sem_custo' && custoVal > 0) return false;

    if (buscaFiltro) {
      const hay = [
        item.vendedor,
        item.rota,
        item.veiculo,
        item.placa,
        item.tipo,
        item.local,
        item.descricao,
        item.responsavel,
        supInfo.supervisor,
        supInfo.supervisorCurto
      ].map(v => String(v || '').toLowerCase()).join(' ');
      if (!hay.includes(buscaFiltro)) return false;
    }

    return true;
  });

  const uteis = baseFiltrada.filter(p => !p.info.isFimDeSemana);
  const fimSemana = baseFiltrada.filter(p => p.info.isFimDeSemana);

  const tempoUtilTotalMin = baseFiltrada.reduce((acc, p) => acc + (p.info.tempoUtilMin || 0), 0);
  const tempoFimSemanaTotalMin = baseFiltrada.reduce((acc, p) => acc + (p.info.tempoFimSemanaMin || 0), 0);

  let selecionadas = uteis.slice();
  if (modoFds === 'somente_fds') selecionadas = fimSemana.slice();
  else if (modoFds === 'separar') selecionadas = baseFiltrada.slice();

  // Ordenação selecionada pelo usuário
  selecionadas.sort((a, b) => {
    const durA = a.info.isFimDeSemana ? a.info.tempoFimSemanaMin : a.info.tempoUtilMin;
    const durB = b.info.isFimDeSemana ? b.info.tempoFimSemanaMin : b.info.tempoUtilMin;
    const custoA = Number(a.item.custo) || 0;
    const custoB = Number(b.item.custo) || 0;
    const dtA = (a.item.data || '') + ' ' + (a.item.hora_inicio || '');
    const dtB = (b.item.data || '') + ' ' + (b.item.hora_inicio || '');

    if (ordenacao === 'duracao_desc') {
      if (durB !== durA) return durB - durA;
      return dtB.localeCompare(dtA);
    }
    if (ordenacao === 'custo_desc') {
      if (custoB !== custoA) return custoB - custoA;
      return dtB.localeCompare(dtA);
    }
    if (ordenacao === 'data_asc') {
      return dtA.localeCompare(dtB);
    }
    return dtB.localeCompare(dtA);
  });

  const totalCusto = selecionadas.reduce((acc, p) => acc + (Number(p.item.custo) || 0), 0);
  const tempoListadoMin = modoFds === 'somente_fds'
    ? tempoFimSemanaTotalMin
    : (modoFds === 'separar' ? (tempoUtilTotalMin + tempoFimSemanaTotalMin) : tempoUtilTotalMin);
  const mediaMinutos = selecionadas.length > 0 ? Math.round(tempoListadoMin / selecionadas.length) : 0;

  // Agrupamento por Supervisor
  const gruposMap = new Map();
  const ordemChaves = ['101', '102', '103'];
  selecionadas.forEach(entry => {
    const gKey = entry.supInfo.equipe || 'outros';
    if (!gruposMap.has(gKey)) {
      gruposMap.set(gKey, {
        key: gKey,
        equipe: entry.supInfo.equipe || '',
        supervisor: entry.supInfo.supervisor || 'Não informado',
        supervisorCurto: entry.supInfo.supervisorCurto || 'Não informado',
        lista: [],
        tempoUtilMin: 0,
        tempoFimSemanaMin: 0,
        totalCusto: 0,
        atrasadasCount: 0,
        abertasCount: 0
      });
    }
    const grp = gruposMap.get(gKey);
    grp.lista.push(entry);
    grp.tempoUtilMin += entry.info.tempoUtilMin || 0;
    grp.tempoFimSemanaMin += entry.info.tempoFimSemanaMin || 0;
    grp.totalCusto += Number(entry.item.custo) || 0;
    if (entry.info.isAtrasado && !entry.info.isFimDeSemana) grp.atrasadasCount++;
    if (entry.info.isAberto || entry.info.isEmAndamentoFimSemana) grp.abertasCount++;
  });

  const gruposPorSupervisor = Array.from(gruposMap.values()).map(g => {
    const tGrp = modoFds === 'somente_fds'
      ? g.tempoFimSemanaMin
      : (modoFds === 'separar' ? (g.tempoUtilMin + g.tempoFimSemanaMin) : g.tempoUtilMin);
    return {
      ...g,
      tempoExibMin: tGrp,
      mediaMin: g.lista.length > 0 ? Math.round(tGrp / g.lista.length) : 0
    };
  }).sort((a, b) => {
    const ia = ordemChaves.indexOf(a.key);
    const ib = ordemChaves.indexOf(b.key);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.supervisorCurto.localeCompare(b.supervisorCurto, 'pt-BR');
  });

  const filtrosAvancadosAtivos = [
    vend,
    statusFiltro,
    tipoFiltro,
    abertoPorFiltro,
    custoFiltro,
    buscaFiltro,
    modoFds !== 'excluir' ? '1' : '',
    ordenacao !== 'data_desc' ? '1' : ''
  ].filter(Boolean).length;

  return {
    supFiltro,
    agrupamento,
    modoFds,
    ordenacao,
    vend,
    statusFiltro,
    tipoFiltro,
    abertoPorFiltro,
    custoFiltro,
    buscaFiltro,
    filtrosAvancadosAtivos,
    selecionadas,
    gruposPorSupervisor,
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

function renderizarItensPreviaRelatorioHtml(lista) {
  return `
    <div class="ocr-rel-grid-head" aria-hidden="true">
      <span>Data</span>
      <span>Vendedor / Supervisor</span>
      <span>Motivo / Local</span>
      <span>Horário</span>
      <span>Duração</span>
      <span>Custo</span>
      <span>Status</span>
    </div>
    <div class="ocr-rel-items-list">
      ${lista.map(({ item: x, info, supInfo }) => {
        const abertoPor = String(x.responsavel || '').trim();
        const durMin = info.isFimDeSemana ? info.tempoFimSemanaMin : info.tempoUtilMin;
        const durTexto = info.isAgendadoFuturo
          ? 'Agendada'
          : (info.isAberto || info.isEmAndamentoFimSemana
            ? (formatarMinutosAmigavel(durMin) + (info.isFimDeSemana ? ' (FDS)' : ' (aberto)'))
            : formatarMinutosAmigavel(durMin));
        const statusTexto = info.isFimDeSemana
          ? ('Fim de Semana (' + info.diaFimSemana + ')')
          : (info.isAgendadoFuturo ? 'Agendada' : (info.isAtrasado ? 'Tempo Excedido' : (info.isAberto ? 'Em Pausa' : 'Liberado')));
        const statusClass = info.isFimDeSemana
          ? 'fim-semana'
          : (info.isAgendadoFuturo ? 'agendado' : (info.isAtrasado ? 'atrasado' : (info.isAberto ? 'no-prazo' : 'finalizado')));
        const durCor = info.isFimDeSemana ? 'var(--ink-2)' : (info.isAtrasado ? 'var(--bad)' : (info.isAberto ? 'var(--warn)' : 'var(--ok)'));
        const custoVal = Number(x.custo) || 0;

        return `
          <div class="ocr-rel-row">
            <div class="ocr-rel-col-data">
              <span class="ocr-rel-date-txt">${formatarData(x.data)}${(x.data_fim && x.data_fim !== x.data) ? (' → ' + formatarData(x.data_fim)) : ''}${info.isFimDeSemana ? ' (FDS)' : ''}</span>
              <span class="badge-status-pausa ${statusClass} ocr-rel-badge-mob">${esc(statusTexto)}</span>
            </div>

            <div class="ocr-rel-col-vend">
              <div class="ocr-rel-vend-top">
                <strong style="color:var(--ink)">${esc(x.vendedor || '—')}</strong>
                <span class="badge-rota" style="font-size:10px;padding:1px 6px">Rota ${esc(x.rota || '—')}</span>
                ${x.placa ? `<span class="badge-km" style="font-size:10px">${esc(x.placa)}</span>` : ''}
              </div>
              <div class="ocr-rel-vend-sub">
                Sup.: <b>${esc(supInfo.supervisorCurto)}</b>${abertoPor ? ' · Aberto por: ' + esc(abertoPor) : ''}
              </div>
            </div>

            <div class="ocr-rel-col-motivo">
              <div style="font-weight:600;color:var(--ink-2)">${esc(x.tipo || 'Ocorrência')}</div>
              ${x.local ? `<div style="font-size:11px;color:var(--ink-3)">Local: ${esc(x.local)}</div>` : ''}
            </div>

            <div class="ocr-rel-col-hora">
              <span class="ocr-rel-mob-lbl">Horário:</span>
              <span>${esc(x.hora_inicio || '--:--')} às ${esc(x.hora_fim || '--:--')}</span>
            </div>

            <div class="ocr-rel-col-dur" style="color:${durCor}">
              <span class="ocr-rel-mob-lbl">Duração:</span>
              <strong>${esc(durTexto)}</strong>
            </div>

            <div class="ocr-rel-col-custo">
              <span class="ocr-rel-mob-lbl">Despesa:</span>
              <span style="font-weight:${custoVal > 0 ? '700' : '500'};color:${custoVal > 0 ? 'var(--ok)' : 'var(--ink-3)'}">${custoVal > 0 ? fmtMoeda(custoVal) : '—'}</span>
            </div>

            <div class="ocr-rel-col-status">
              <span class="badge-status-pausa ${statusClass}">${esc(statusTexto)}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function atualizarPreviaRelatorioOcr() {
  const dados = obterDadosRelatorioOcorrencias();
  const {
    supFiltro,
    agrupamento,
    modoFds,
    filtrosAvancadosAtivos,
    selecionadas,
    gruposPorSupervisor,
    fimSemana,
    tempoUtilTotalMin,
    tempoFimSemanaTotalMin,
    mediaMinutos,
    totalCusto
  } = dados;

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
        ? (fimSemana.length + ' reg. ocultado(s)')
        : 'Fora do expediente';
    } else if (modoFds === 'somente_fds') {
      $('ocrRelFimSemanaSub').textContent = fimSemana.length + ' reg. no período';
    } else {
      $('ocrRelFimSemanaSub').textContent = fimSemana.length + ' reg. separados';
    }
  }
  if ($('ocrRelTempoMedio')) $('ocrRelTempoMedio').textContent = formatarMinutosAmigavel(mediaMinutos);
  if ($('ocrRelCustoTotal')) $('ocrRelCustoTotal').textContent = fmtMoeda(totalCusto);

  const badgeFiltros = $('ocrRelFiltrosAtivosBadge');
  if (badgeFiltros) {
    badgeFiltros.hidden = filtrosAvancadosAtivos === 0;
    badgeFiltros.textContent = String(filtrosAvancadosAtivos);
  }
  const btnLimpar = $('btnOcrRelLimparFiltros');
  if (btnLimpar) {
    btnLimpar.hidden = (filtrosAvancadosAtivos === 0 && supFiltro === 'todos');
  }

  const lblPdf = $('lblBtnGerarPdfOcr');
  if (lblPdf) {
    lblPdf.textContent = (supFiltro && supFiltro !== 'todos')
      ? ('Gerar PDF · ' + obterLabelSupervisorFiltro(supFiltro).split(' (')[0])
      : (agrupamento === 'por_supervisor' ? 'Gerar PDF por Supervisor' : 'Gerar PDF Oficial');
  }

  if ($('ocrRelContadorPrevia')) {
    const escopoSup = supFiltro !== 'todos' ? (' · ' + obterLabelSupervisorFiltro(supFiltro)) : '';
    const extraOcultos = (modoFds === 'excluir' && fimSemana.length > 0)
      ? (' · ' + fimSemana.length + ' FDS fora')
      : '';
    $('ocrRelContadorPrevia').textContent = selecionadas.length + ' ocorrência(s)' + escopoSup + extraOcultos;
  }

  // Chips de resumo por supervisor (visíveis quando há mais de 1 supervisor no resultado)
  const supChipsBox = $('ocrRelResumoSupervisoresChips');
  if (supChipsBox) {
    if (gruposPorSupervisor.length > 1) {
      supChipsBox.hidden = false;
      supChipsBox.innerHTML = gruposPorSupervisor.map(g => {
        const keyBtn = g.equipe || 'outros';
        return `
          <button type="button" class="ocr-sup-summary-chip" onclick="selecionarSupervisorRelatorioOcr('${esc(keyBtn)}')"
            title="Clique para gerar somente de ${esc(g.supervisor)}">
            <strong>${esc(g.supervisorCurto)}</strong>
            <span>${g.lista.length} reg.</span>
            <span>·</span>
            <span style="color:var(--warn);font-weight:700">${formatarMinutosAmigavel(g.tempoExibMin)}</span>
            ${g.totalCusto > 0 ? `<span>·</span><span style="color:var(--ok);font-weight:700">${fmtMoeda(g.totalCusto)}</span>` : ''}
          </button>
        `;
      }).join('');
    } else {
      supChipsBox.hidden = true;
      supChipsBox.innerHTML = '';
    }
  }

  const container = $('ocrRelListaPrevia');
  if (!container) return;

  if (!selecionadas.length) {
    const avisoFds = (modoFds === 'excluir' && fimSemana.length > 0)
      ? `<div style="margin-top:6px;font-size:12px;color:#475569;font-weight:600">${fimSemana.length} registro(s) de fim de semana (${formatarMinutosAmigavel(tempoFimSemanaTotalMin)}) foram ocultados do relatório operacional.</div>`
      : '';
    container.innerHTML = `
      <div style="text-align:center;padding:24px 12px;color:var(--ink-3);font-size:13px">
        Nenhuma ocorrência encontrada para os filtros selecionados.
        ${avisoFds}
      </div>
    `;
    return;
  }

  if (agrupamento === 'por_supervisor') {
    container.innerHTML = `
      <div class="ocr-rel-groups-stack">
        ${gruposPorSupervisor.map(g => `
          <div class="ocr-rel-group-card">
            <div class="ocr-rel-group-head">
              <div class="ocr-rel-group-title">
                <span class="ocr-rel-group-badge">${g.equipe ? ('Equipe ' + esc(g.equipe)) : 'Geral'}</span>
                <strong style="color:var(--ink)">${esc(g.supervisor)}</strong>
              </div>
              <div class="ocr-rel-group-stats">
                <span>${g.lista.length} reg.</span>
                <span>·</span>
                <span style="color:var(--warn);font-weight:700">${formatarMinutosAmigavel(g.tempoExibMin)}</span>
                <span>·</span>
                <span>Média ${formatarMinutosAmigavel(g.mediaMin)}</span>
                ${g.totalCusto > 0 ? `<span>·</span><span style="color:var(--ok);font-weight:700">${fmtMoeda(g.totalCusto)}</span>` : ''}
              </div>
            </div>
            ${renderizarItensPreviaRelatorioHtml(g.lista)}
          </div>
        `).join('')}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="ocr-rel-group-card">
        ${renderizarItensPreviaRelatorioHtml(selecionadas)}
      </div>
    `;
  }
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
    'Data Inicio',
    'Data Fim',
    'Regime / Jornada',
    'Hora Inicio',
    'Hora Fim',
    'Tempo Util (min)',
    'Tempo Sab >12h / Dom (min)',
    'Duracao Formatada',
    'Vendedor',
    'Rota',
    'Supervisor',
    'Veiculo',
    'Placa',
    'Motivo / Problema',
    'Local',
    'Custo (R$)',
    'Status',
    'Aberto por',
    'Descricao / Servico'
  ];

  const rows = selecionadas.map(({ item: x, info, supInfo }) => {
    const minExibir = info.isFimDeSemana ? info.tempoFimSemanaMin : info.tempoUtilMin;
    return [
      formatarData(x.data),
      x.data_fim ? formatarData(x.data_fim) : (x.hora_fim ? formatarData(x.data) : ''),
      info.isFimDeSemana ? ('Fora Expediente (' + info.diaFimSemana + ')') : 'Expediente (Seg-Sab 12h)',
      x.hora_inicio || '',
      x.hora_fim || '',
      String(info.tempoUtilMin || 0),
      String(info.tempoFimSemanaMin || 0),
      formatarMinutosAmigavel(minExibir),
      x.vendedor || '',
      x.rota || '',
      supInfo.supervisorCurto || '',
      x.veiculo || '',
      x.placa || '',
      x.tipo || '',
      x.local || '',
      Number(x.custo || 0).toFixed(2).replace('.', ','),
      info.isFimDeSemana ? 'Fora Expediente (Sab >12h / Dom)' : (info.isAgendadoFuturo ? 'Agendada' : (info.isAberto ? 'Em Aberto / Parado' : 'Finalizada / Liberado')),
      x.responsavel || '',
      x.descricao || ''
    ].map(csvCell).join(';');
  });

  const csv = '\uFEFF' + [headers.map(csvCell).join(';'), ...rows].join('\r\n');
  const dtIni = ($('ocrRelDataInicio')?.value || 'inicio').replace(/-/g, '');
  const dtFim = ($('ocrRelDataFim')?.value || 'fim').replace(/-/g, '');
  const supSufixo = dados.supFiltro && dados.supFiltro !== 'todos' ? ('_Sup_' + dados.supFiltro) : '';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Gomex_Ocorrencias_Frota${supSufixo}_${dtIni}_a_${dtFim}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast(`${selecionadas.length} ocorrência(s) exportada(s) para Excel (CSV)!`);
}
window.exportarCsvOcorrencias = exportarCsvOcorrencias;

function gerarPdfRelatorioOcorrencias() {
  const dados = obterDadosRelatorioOcorrencias();
  const {
    supFiltro,
    agrupamento,
    modoFds,
    vend,
    statusFiltro,
    tipoFiltro,
    abertoPorFiltro,
    custoFiltro,
    selecionadas,
    gruposPorSupervisor,
    fimSemana,
    tempoUtilTotalMin,
    tempoFimSemanaTotalMin,
    mediaMinutos,
    totalCusto
  } = dados;
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
    doc.text('GOMEX DISTRIBUIDORA DE ALIMENTOS', M, 13);

    fonte(10, 'bold', [30, 30, 40]);
    const subTituloPdf = modoFds === 'somente_fds'
      ? 'RELATÓRIO DE OCORRÊNCIAS DE FIM DE SEMANA (FORA DO EXPEDIENTE)'
      : ((supFiltro !== 'todos' || agrupamento === 'por_supervisor')
        ? 'RELATÓRIO DE OCORRÊNCIAS & PAUSAS POR SUPERVISOR'
        : 'RELATÓRIO EXECUTIVO DE OCORRÊNCIAS & CONTROLE DE PAUSAS DA FROTA');
    doc.text(subTituloPdf, M, 19);

    fonte(8.2, 'normal', CINZA);
    const agoraStr = new Date().toLocaleString('pt-BR');
    const supDescPdf = obterNomeCompletoSupervisorFiltro(supFiltro);
    const filtrosExtras = [
      vend ? ('Vendedor: ' + $('ocrRelVendedor')?.value) : '',
      statusFiltro ? ('Situação: ' + statusFiltro) : '',
      tipoFiltro ? ('Motivo: ' + tipoFiltro) : '',
      abertoPorFiltro ? ('Aberto por: ' + $('ocrRelAbertoPor')?.value) : '',
      custoFiltro === 'com_custo' ? 'Somente com despesa' : (custoFiltro === 'sem_custo' ? 'Sem despesa' : ''),
      modoFds === 'excluir' && fimSemana.length ? `FDS excluído (${fimSemana.length})` : ''
    ].filter(Boolean).join(' · ');

    doc.text(corta(`Período: ${dtIni} até ${dtFim}  ·  Supervisor: ${supDescPdf}  ·  Emitido em: ${agoraStr}${filtrosExtras ? '  ·  Filtros: ' + filtrosExtras : ''}`, W), M, 24.5);

    // Card de Indicadores no Topo
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(...LINHA);
    doc.roundedRect(M, 27.5, W, 14, 2, 2, 'FD');

    fonte(7.5, 'bold', CINZA);
    doc.text('OCORRÊNCIAS', M + 6, 32.5);
    doc.text('TEMPO ÚTIL (SEG–SÁB 12H)', M + 52, 32.5);
    doc.text('FORA EXP. (SÁB >12H / DOM)', M + 114, 32.5);
    doc.text('MÉDIA POR PARADA', M + 188, 32.5);
    doc.text('TOTAL DESPESAS', M + 236, 32.5);

    fonte(10, 'bold', ROXO);
    doc.text(String(selecionadas.length), M + 6, 38.5);
    doc.text(formatarMinutosAmigavel(modoFds === 'somente_fds' ? 0 : tempoUtilTotalMin), M + 52, 38.5);
    fonte(10, 'bold', [71, 85, 105]);
    doc.text(formatarMinutosAmigavel(tempoFimSemanaTotalMin), M + 114, 38.5);
    fonte(10, 'bold', ROXO);
    doc.text(formatarMinutosAmigavel(mediaMinutos), M + 188, 38.5);
    doc.text(fmtMoeda(totalCusto), M + 236, 38.5);

    let y = 46.5;
    const colW = [22, 14, 14, 21, 44, 30, 23, 36, 33, 20, 20];
    const headers = ['DATA', 'INÍCIO', 'FIM', 'DURAÇÃO', 'VENDEDOR / ROTA', 'SUPERVISOR', 'PLACA', 'MOTIVO / PROBLEMA', 'LOCAL', 'CUSTO', 'STATUS'];

    const desenharCabecalho = () => {
      doc.setFillColor(30, 42, 120);
      doc.rect(M, y, W, 6.8, 'F');
      fonte(7.2, 'bold', [255, 255, 255]);
      let xOff = M;
      headers.forEach((h, i) => {
        doc.text(h, xOff + 1.8, y + 4.6);
        xOff += colW[i];
      });
      y += 6.8;
    };

    const desenharLinhaOcorrencia = ({ item, info, supInfo }, idx) => {
      if (y > 186) {
        doc.addPage('a4', 'landscape');
        y = 14;
        desenharCabecalho();
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(M, y, W, 6.4, 'F');
      }

      doc.setDrawColor(230, 235, 245);
      doc.line(M, y + 6.4, M + W, y + 6.4);

      fonte(7, 'normal', [30, 35, 45]);
      let xOff = M;

      const dtPdfTxt = (item.data_fim && item.data_fim !== item.data)
        ? (formatarData(item.data).slice(0, 5) + '-' + formatarData(item.data_fim).slice(0, 5) + (info.isFimDeSemana ? ' FDS' : ''))
        : (formatarData(item.data) + (info.isFimDeSemana ? ' (FDS)' : ''));
      doc.text(dtPdfTxt, xOff + 1.8, y + 4.4); xOff += colW[0];
      doc.text(item.hora_inicio || '--:--', xOff + 1.8, y + 4.4); xOff += colW[1];
      doc.text(item.hora_fim || '--:--', xOff + 1.8, y + 4.4); xOff += colW[2];

      const durMin = info.isFimDeSemana ? info.tempoFimSemanaMin : info.tempoUtilMin;
      const durPdf = info.isAgendadoFuturo
        ? 'Agendada'
        : (info.isFimDeSemana ? (formatarMinutosAmigavel(durMin) + ' (FDS)') : (info.isAberto ? (formatarMinutosAmigavel(durMin) + ' *') : formatarMinutosAmigavel(durMin)));
      fonte(7, 'bold', info.isFimDeSemana ? [71, 85, 105] : (info.isAberto ? [180, 80, 10] : [20, 120, 60]));
      doc.text(durPdf, xOff + 1.8, y + 4.4); xOff += colW[3];

      fonte(7, 'bold', [20, 20, 30]);
      doc.text(corta(`${item.vendedor || ''} (Rota ${item.rota || ''})`, colW[4] - 3), xOff + 1.8, y + 4.4); xOff += colW[4];

      fonte(7, 'normal', [30, 42, 120]);
      doc.text(corta(supInfo.supervisorCurto || '—', colW[5] - 3), xOff + 1.8, y + 4.4); xOff += colW[5];

      fonte(7, 'normal', [40, 45, 55]);
      doc.text(corta(item.placa || item.veiculo || '—', colW[6] - 3), xOff + 1.8, y + 4.4); xOff += colW[6];
      doc.text(corta(item.tipo || 'Ocorrência', colW[7] - 3), xOff + 1.8, y + 4.4); xOff += colW[7];
      doc.text(corta(item.local || '—', colW[8] - 3), xOff + 1.8, y + 4.4); xOff += colW[8];

      doc.text(item.custo ? fmtMoeda(item.custo) : '—', xOff + 1.8, y + 4.4); xOff += colW[9];

      const stPdf = info.isFimDeSemana ? 'Fim Semana' : (info.isAgendadoFuturo ? 'Agendada' : (info.isAtrasado ? 'Excedido' : (info.isAberto ? 'Em Pausa' : 'Liberado')));
      fonte(7, 'bold', info.isFimDeSemana ? [71, 85, 105] : (info.isAtrasado ? [185, 28, 28] : (info.isAberto ? [180, 83, 9] : [21, 128, 61])));
      doc.text(stPdf, xOff + 1.8, y + 4.4);

      y += 6.4;
    };

    if (agrupamento === 'por_supervisor') {
      gruposPorSupervisor.forEach((g, gIdx) => {
        if (y > 170) {
          doc.addPage('a4', 'landscape');
          y = 14;
        }
        if (gIdx > 0) y += 3;

        // Faixa de Cabeçalho do Supervisor
        doc.setFillColor(232, 236, 248);
        doc.setDrawColor(199, 210, 235);
        doc.rect(M, y, W, 7, 'FD');
        fonte(8, 'bold', ROXO);
        const eqTitulo = g.equipe ? `EQUIPE ${g.equipe} · ` : '';
        doc.text(`${eqTitulo}SUPERVISOR: ${g.supervisor.toUpperCase()}`, M + 2.5, y + 4.7);
        fonte(7.5, 'bold', [45, 55, 72]);
        const resumoGrp = `${g.lista.length} reg.  |  Tempo: ${formatarMinutosAmigavel(g.tempoExibMin)}  |  Média: ${formatarMinutosAmigavel(g.mediaMin)}  |  Despesas: ${fmtMoeda(g.totalCusto)}`;
        doc.text(resumoGrp, M + W - 2.5, y + 4.7, { align: 'right' });
        y += 7;

        desenharCabecalho();
        g.lista.forEach((entry, idx) => desenharLinhaOcorrencia(entry, idx));
      });
    } else {
      desenharCabecalho();
      selecionadas.forEach((entry, idx) => desenharLinhaOcorrencia(entry, idx));
    }

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
  const { supFiltro, modoFds, selecionadas, gruposPorSupervisor, fimSemana, tempoUtilTotalMin, tempoFimSemanaTotalMin, mediaMinutos, totalCusto } = dados;
  if (!selecionadas.length && !(modoFds === 'excluir' && fimSemana.length > 0)) {
    toast('Nenhuma ocorrência encontrada para o resumo.', 'error');
    return;
  }

  const dtIni = $('ocrRelDataInicio')?.value ? formatarData($('ocrRelDataInicio').value) : 'Início';
  const dtFim = $('ocrRelDataFim')?.value ? formatarData($('ocrRelDataFim').value) : 'Hoje';

  const linhasSup = gruposPorSupervisor.length > 1
    ? gruposPorSupervisor.map(g => `• *${g.supervisorCurto}:* ${g.lista.length} ocorrência(s) · Tempo: ${formatarMinutosAmigavel(g.tempoExibMin)}${g.totalCusto > 0 ? ' · ' + fmtMoeda(g.totalCusto) : ''}`)
    : [];

  const porVendedor = new Map();
  selecionadas.forEach(({ item: x, info, supInfo }) => {
    const k = `${x.vendedor || 'Outro'} (Rota ${x.rota || '—'} · Sup. ${supInfo.supervisorCurto})`;
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
    supFiltro !== 'todos' ? `*Supervisor:* ${obterNomeCompletoSupervisorFiltro(supFiltro)}` : '',
    '',
    `*Ocorrências no Relatório:* ${selecionadas.length}`,
    `*Tempo Útil (Seg–Sáb 12h):* ${formatarMinutosAmigavel(modoFds === 'somente_fds' ? 0 : tempoUtilTotalMin)}`,
    tempoFimSemanaTotalMin > 0
      ? `*Fora do Expediente (Sáb >12h / Dom - Separado):* ${formatarMinutosAmigavel(tempoFimSemanaTotalMin)}${modoFds === 'excluir' ? ` (${fimSemana.length} reg. não incluído(s) na lista)` : ''}`
      : '',
    `*Média por Parada:* ${formatarMinutosAmigavel(mediaMinutos)}`,
    totalCusto > 0 ? `*Total de Despesas:* ${fmtMoeda(totalCusto)}` : '',
    '',
    linhasSup.length ? '*Resumo por Supervisor:*' : '',
    ...linhasSup,
    linhasSup.length ? '' : '',
    linhasVend.length ? '*Detalhamento por Vendedor:*' : '',
    ...linhasVend,
    '',
    `*Emitido por:* ${obterResponsavelPadraoOcorrencia()}`
  ].filter(Boolean).join('\n');

  let copiou = false;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(msg);
      copiou = true;
    } catch (e) { }
  }
  if (!copiou) {
    const ta = document.createElement('textarea');
    ta.value = msg;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); copiou = true; } catch (e) { }
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
  const inicioMomentoFds = ehDataFimDeSemana(dt, hrIni);
  const diaFimSemana = nomeDiaFimDeSemana(dt) || 'Sáb >12h / Dom';

  const inicioMs = extrairTimestampOcorrencia(dt, hrIni) || agoraMs;
  const prevInfo = calcularFimPrevistoUtil(inicioMs, tempoMedioMin);
  const horaFimPrevista = prevInfo.horaFimPrevista;

  // 1. Caso Finalizado / Liberado
  if (status === 'finalizado') {
    const dtFimReal = item.hora_fim
      ? (item.data_fim ? String(item.data_fim).slice(0, 10) : calcularDataFimLegada(dt, hrIni, item.hora_fim))
      : '';
    const fimMs = (dtFimReal && item.hora_fim) ? extrairTimestampOcorrencia(dtFimReal, item.hora_fim) : null;
    let tempoUtilMin = 0;
    let tempoFimSemanaMin = 0;

    if (fimMs !== null && fimMs >= inicioMs) {
      const splitFin = dividirMinutosExpedienteEFds(inicioMs, fimMs);
      tempoUtilMin = splitFin.utilMin;
      tempoFimSemanaMin = splitFin.fdsMin;
    } else {
      const rawDur = Number(item.duracao_minutos) || 0;
      tempoUtilMin = inicioMomentoFds ? 0 : rawDur;
      tempoFimSemanaMin = inicioMomentoFds ? rawDur : 0;
    }

    const isPureFds = tempoUtilMin === 0 && (tempoFimSemanaMin > 0 || inicioMomentoFds);
    if (isPureFds) {
      const diaRot = nomeDiaFimDeSemana(dt) || nomeDiaFimDeSemana(dtFimReal) || 'Sáb >12h / Dom';
      return {
        status: 'finalizado',
        isFimDeSemana: true,
        diaFimSemana: diaRot,
        isAgendadoFuturo: false,
        isAberto: false,
        isEmAndamentoFimSemana: false,
        isFinalizado: true,
        isAtrasado: false,
        finalizadoComAtraso: false,
        tempoUtilMin: 0,
        tempoFimSemanaMin,
        tempoDecorridoMin: tempoFimSemanaMin,
        tempoExcedidoMin: 0,
        tempoMedioMin,
        horaInicio: hrIni,
        horaFimPrevista,
        badgeClass: 'fim-semana',
        badgeTexto: 'FORA EXPEDIENTE (' + diaRot.toUpperCase() + ')',
        duracaoTexto: 'Fora expediente: ' + formatarMinutosAmigavel(tempoFimSemanaMin),
        statusMensagem: 'Fora do expediente (' + diaRot + ') · Não contabilizado no tempo útil'
      };
    }

    const ultrapassou = tempoMedioMin > 0 && tempoUtilMin > tempoMedioMin;
    const excedidoMin = ultrapassou ? (tempoUtilMin - tempoMedioMin) : 0;
    const descontoTxt = tempoFimSemanaMin > 0 ? (' · Descontado sáb >12h/dom: ' + formatarMinutosAmigavel(tempoFimSemanaMin)) : '';

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
      tempoUtilMin,
      tempoFimSemanaMin,
      tempoDecorridoMin: tempoUtilMin,
      tempoExcedidoMin: excedidoMin,
      tempoMedioMin,
      horaInicio: hrIni,
      horaFimPrevista,
      badgeClass: 'finalizado',
      badgeTexto: 'LIBERADO',
      duracaoTexto: 'Pausa útil: ' + formatarMinutosAmigavel(tempoUtilMin),
      statusMensagem: (ultrapassou ? ('Concluído com ' + formatarMinutosAmigavel(excedidoMin) + ' de atraso') : 'Concluído no prazo') + descontoTxt
    };
  }

  // 2. Verificação de Agendamento Futuro
  // Critério: data > hoje OU (data === hoje e inicioMs > agoraMs) OU (status === 'agendado' dentro do expediente)
  const isDataFutura = dt > hojeStr;
  const isHorarioFuturoHoje = dt === hojeStr && inicioMs > agoraMs;
  const isAgendadoFuturo = (status === 'agendado' && isDataFutura) || isDataFutura || isHorarioFuturoHoje || (status === 'agendado' && !inicioMomentoFds);

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

    if (inicioMomentoFds) {
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
        badgeTexto: 'AGENDADA · FORA EXPEDIENTE (' + textoQuando + ')',
        duracaoTexto: 'Fora de expediente (' + diaFimSemana + ')',
        statusMensagem: 'Agendada para ' + diaFimSemana + ' · Não contabiliza no tempo útil (Seg–Sáb 12h)'
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

  // 3. Caso Aberto / Em Andamento (contabiliza somente Seg–Sex e Sáb até 12h; Sáb >12h e Dom não contam)
  const split = dividirMinutosExpedienteEFds(inicioMs, agoraMs);
  const decorridoUtilMin = split.utilMin;
  const fdsDurantePausaMin = split.fdsMin;
  const isOnlyFdsAteAgora = decorridoUtilMin === 0 && (fdsDurantePausaMin > 0 || inicioMomentoFds);

  if (isOnlyFdsAteAgora) {
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
      tempoFimSemanaMin: fdsDurantePausaMin,
      tempoDecorridoMin: fdsDurantePausaMin,
      tempoExcedidoMin: 0,
      tempoMedioMin,
      horaInicio: hrIni,
      horaFimPrevista,
      progressoPct: 0,
      badgeClass: 'fim-semana',
      badgeTexto: 'FORA EXPEDIENTE (' + diaFimSemana.toUpperCase() + ')',
      duracaoTexto: 'Fora expediente: ' + formatarMinutosAmigavel(fdsDurantePausaMin),
      statusMensagem: 'Fora do expediente (' + diaFimSemana + ') · Contagem útil retoma segunda-feira'
    };
  }

  const ultrapassou = tempoMedioMin > 0 && decorridoUtilMin > tempoMedioMin;
  const excedidoMin = ultrapassou ? (decorridoUtilMin - tempoMedioMin) : 0;
  const restanteMin = ultrapassou ? 0 : Math.max(0, tempoMedioMin - decorridoUtilMin);
  const progressoPct = Math.min(100, Math.round((decorridoUtilMin / (tempoMedioMin || 1)) * 100));
  const descontoAbertoTxt = fdsDurantePausaMin > 0 ? (' · Descontado sáb >12h/dom: ' + formatarMinutosAmigavel(fdsDurantePausaMin)) : '';

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
      statusMensagem: 'TEMPO MÉDIO ULTRAPASSADO em +' + formatarMinutosAmigavel(excedidoMin) + '! Previsão era ' + horaFimPrevista + descontoAbertoTxt
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
      statusMensagem: 'Em atendimento · Restam ' + formatarMinutosAmigavel(restanteMin) + ' (Término previsto: ' + horaFimPrevista + ')' + descontoAbertoTxt
    };
  }
}
window.calcularStatusTempoOcorrencia = calcularStatusTempoOcorrencia;

async function copiarOcorrenciaWhatsApp(id) {
  const ocr = (gastosState.ocorrencias || []).find(x => String(x.id) === String(id));
  if (!ocr) return;

        const info = calcularStatusTempoOcorrencia(ocr);
        const supInfo = resolverSupervisorOcorrencia(ocr);
        const abertoPor = String(ocr.responsavel || '').trim();
        const dataFmt = formatarData(ocr.data);

        let msg = '';
        if (info.isAgendadoFuturo) {
          msg = [
            '*GOMEX DISTRIBUIDORA · SERVIÇO AGENDADO DE FROTA*',
            '',
            '*Veículo:* ' + (ocr.veiculo || ocr.placa || 'Frota Gomex'),
            '*Rota:* ' + (ocr.rota || '—'),
            '*Supervisor:* ' + supInfo.supervisorCurto,
            '*Vendedor / Motorista:* ' + (ocr.vendedor || '—'),
            '*Serviço / Motivo:* ' + (ocr.tipo || 'Manutenção'),
            '*Data / Início:* ' + dataFmt + ' às ' + (ocr.hora_inicio || '--:--'),
            '*Tempo Médio Previsto:* ' + formatarMinutosAmigavel(info.tempoMedioMin) + ' (Término previsto: ' + info.horaFimPrevista + ')',
            ocr.local ? ('*Local / Oficina:* ' + ocr.local) : '',
            ocr.custo ? ('*Valor / Despesa:* ' + fmtMoeda(ocr.custo)) : '',
            ocr.descricao ? ('*Detalhes:* ' + ocr.descricao) : '',
            '',
            '*SITUAÇÃO:* AGENDADA (Aguardando início)',
            abertoPor ? ('_Aberto por: ' + abertoPor + '_') : ''
          ].filter(Boolean).join('\n');
        } else if (info.isFinalizado) {
          const periodoWpp = (ocr.data_fim && ocr.data_fim !== ocr.data)
            ? (dataFmt + ' ' + (ocr.hora_inicio || '--:--') + ' até ' + formatarData(ocr.data_fim) + ' ' + (ocr.hora_fim || '--:--'))
            : (dataFmt + ' (' + (ocr.hora_inicio || '--:--') + ' às ' + (ocr.hora_fim || '--:--') + ')');
          msg = [
            '*GOMEX DISTRIBUIDORA · OCORRÊNCIA CONCLUÍDA*',
            '',
            '*Veículo:* ' + (ocr.veiculo || ocr.placa || 'Frota Gomex'),
            '*Rota:* ' + (ocr.rota || '—'),
            '*Supervisor:* ' + supInfo.supervisorCurto,
            '*Vendedor / Motorista:* ' + (ocr.vendedor || '—'),
            '*Motivo / Serviço:* ' + (ocr.tipo || 'Ocorrência'),
            '*Horário:* ' + periodoWpp,
            '*Duração Útil (Seg–Sáb 12h):* ' + formatarMinutosAmigavel(info.tempoDecorridoMin),
            ocr.local ? ('*Local:* ' + ocr.local) : '',
            ocr.custo ? ('*Custo:* ' + fmtMoeda(ocr.custo)) : '',
            ocr.descricao ? ('*Detalhes:* ' + ocr.descricao) : '',
            '',
            '*STATUS:* VENDEDOR LIBERADO / RETORNO À ROTA',
            info.isFimDeSemana ? ('*Regime:* Fim de Semana (' + info.diaFimSemana + ' · Fora do expediente)') : '',
            abertoPor ? ('_Aberto por: ' + abertoPor + '_') : ''
          ].filter(Boolean).join('\n');
        } else if (info.isFimDeSemana) {
          msg = [
            '*GOMEX DISTRIBUIDORA · OCORRÊNCIA DE FIM DE SEMANA*',
            '',
            '*Veículo:* ' + (ocr.veiculo || ocr.placa || 'Frota Gomex'),
            '*Rota:* ' + (ocr.rota || '—'),
            '*Supervisor:* ' + supInfo.supervisorCurto,
            '*Vendedor / Motorista:* ' + (ocr.vendedor || '—'),
            '*Motivo / Serviço:* ' + (ocr.tipo || 'Ocorrência'),
            '*Data / Início:* ' + dataFmt + ' às ' + (ocr.hora_inicio || '--:--'),
            '*Tempo Fim de Semana (Fora do Expediente):* ' + formatarMinutosAmigavel(info.tempoFimSemanaMin),
            ocr.local ? ('*Local:* ' + ocr.local) : '',
            ocr.custo ? ('*Custo:* ' + fmtMoeda(ocr.custo)) : '',
            ocr.descricao ? ('*Detalhes:* ' + ocr.descricao) : '',
            '',
            '*REGIME:* FIM DE SEMANA (Contabilizado separado · fora do relatório)',
            abertoPor ? ('_Aberto por: ' + abertoPor + '_') : ''
          ].filter(Boolean).join('\n');
        } else {
          msg = [
            '*GOMEX DISTRIBUIDORA · OCORRÊNCIA EM ANDAMENTO (PAUSA)*',
            '',
            '*Veículo:* ' + (ocr.veiculo || ocr.placa || 'Frota Gomex'),
            '*Rota:* ' + (ocr.rota || '—'),
            '*Supervisor:* ' + supInfo.supervisorCurto,
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
            abertoPor ? ('_Aberto por: ' + abertoPor + '_') : ''
          ].filter(Boolean).join('\n');
        }

  let copiou = false;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(msg);
      copiou = true;
    } catch (e) { }
  }
  if (!copiou) {
    const ta = document.createElement('textarea');
    ta.value = msg;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); copiou = true; } catch (e) { }
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

function filtrarOcorrenciasPorSupervisor(supKey) {
  ocorrenciasState.supervisor = supKey || 'todos';
  const row = $('ocrSupFilterRow');
  if (row) {
    row.querySelectorAll('.ocr-sup-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sup === ocorrenciasState.supervisor);
    });
  }
  renderOcorrenciasView();
}
window.filtrarOcorrenciasPorSupervisor = filtrarOcorrenciasPorSupervisor;

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
    const supInfo = resolverSupervisorOcorrencia(item);
    return { item, info, supInfo };
  });

  // Contagens operacionais (dias úteis) separadas do fim de semana
  const paradosAgora = processadas.filter(p => p.info.isAberto && !p.info.isFimDeSemana);
  const agendadas = processadas.filter(p => p.info.isAgendadoFuturo);
  const agendadasFds = agendadas.filter(p => p.info.isFimDeSemana);
  const atrasadas = processadas.filter(p => p.info.isAtrasado && !p.info.isFimDeSemana);
  const deHoje = processadas.filter(p => {
    const dtIniItem = (p.item.data || '').slice(0, 10);
    const dtFimItem = (p.item.data_fim || p.item.data || '').slice(0, 10);
    return dtIniItem === hojeStr || (dtIniItem <= hojeStr && dtFimItem >= hojeStr);
  });
  const deHojeUteis = deHoje.filter(p => !p.info.isFimDeSemana);
  const concluidasHoje = deHojeUteis.filter(p => p.item.status === 'finalizado');
  const fimDeSemanaLista = processadas.filter(p => p.info.isFimDeSemana || p.info.tempoFimSemanaMin > 0);

  const tempoHojeUtilMinutos = deHojeUteis.reduce((acc, p) => {
    return acc + (p.info.tempoUtilMin || 0);
  }, 0);
  const tempoFimSemanaTotalMinutos = processadas.reduce((acc, p) => {
    return acc + (p.info.tempoFimSemanaMin || 0);
  }, 0);

  const horaAgoraSub = formatarHoraAtual();
  const dwHoje = obterDiaSemanaData(hojeStr);
  const hojeForaExpediente = ehDataFimDeSemana(hojeStr, horaAgoraSub);

  // Atualização dos KPIs no topo (separando Tempo Útil vs Tempo Fim de Semana)
  if ($('ocrStatParadosAgora')) $('ocrStatParadosAgora').textContent = paradosAgora.length;
  if ($('ocrStatTempoHoje')) $('ocrStatTempoHoje').textContent = formatarMinutosAmigavel(tempoHojeUtilMinutos);
  if ($('ocrStatTempoHojeSub')) {
    $('ocrStatTempoHojeSub').textContent = dwHoje === 0
      ? 'Hoje é domingo (0 útil)'
      : (dwHoje === 6 && hojeForaExpediente
        ? 'Sábado após 12h (expediente encerrado)'
        : (dwHoje === 6 ? 'Sábado (expediente até 12h)' : 'Seg a Sáb (até 12h)'));
  }
  if ($('ocrStatTempoFimSemana')) $('ocrStatTempoFimSemana').textContent = formatarMinutosAmigavel(tempoFimSemanaTotalMinutos);
  if ($('ocrStatTempoFimSemanaSub')) {
    $('ocrStatTempoFimSemanaSub').textContent = fimDeSemanaLista.length + ' reg. sáb >12h / dom (separado)';
  }
  if ($('ocrStatOcrHoje')) $('ocrStatOcrHoje').textContent = deHoje.length;
  if ($('ocrStatOcrHojeSub')) {
    $('ocrStatOcrHojeSub').textContent = dwHoje === 0
      ? 'Hoje · Domingo'
      : (dwHoje === 6 && hojeForaExpediente
        ? 'Hoje · Sábado (após 12h)'
        : (dwHoje === 6 ? 'Hoje · Sábado (até 12h)' : 'Registros no dia'));
  }
  if ($('ocrStatConcluidasHoje')) $('ocrStatConcluidasHoje').textContent = concluidasHoje.length;
  if ($('ocrStatAgendadas')) $('ocrStatAgendadas').textContent = agendadas.length;
  if ($('ocrStatAgendadasSub')) {
    $('ocrStatAgendadasSub').textContent = agendadasFds.length > 0
      ? (agendadasFds.length + ' no fim de semana')
      : 'Serviços futuros';
  }

  // Atualização dos Badges das Abas de Filtros e Pílulas de Supervisor
  if ($('badgeOcrFiltroTodos')) $('badgeOcrFiltroTodos').textContent = todas.length;
  if ($('badgeOcrFiltroAbertos')) $('badgeOcrFiltroAbertos').textContent = paradosAgora.length;
  if ($('badgeOcrFiltroAgendadas')) $('badgeOcrFiltroAgendadas').textContent = agendadas.length;
  if ($('badgeOcrFiltroAtrasados')) $('badgeOcrFiltroAtrasados').textContent = atrasadas.length;
  if ($('badgeOcrFiltroHoje')) $('badgeOcrFiltroHoje').textContent = deHoje.length;
  if ($('badgeOcrFiltroFimSemana')) $('badgeOcrFiltroFimSemana').textContent = fimDeSemanaLista.length;
  if ($('badgeOcrFiltroFinalizados')) $('badgeOcrFiltroFinalizados').textContent = todas.filter(x => x.status === 'finalizado').length;

  if ($('cntOcrSupTodos')) $('cntOcrSupTodos').textContent = processadas.length;
  if ($('cntOcrSup101')) $('cntOcrSup101').textContent = processadas.filter(p => p.supInfo.equipe === '101').length;
  if ($('cntOcrSup102')) $('cntOcrSup102').textContent = processadas.filter(p => p.supInfo.equipe === '102').length;
  if ($('cntOcrSup103')) $('cntOcrSup103').textContent = processadas.filter(p => p.supInfo.equipe === '103').length;

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
    lista = lista.filter(p => {
      const dtIniItem = (p.item.data || '').slice(0, 10);
      const dtFimItem = (p.item.data_fim || p.item.data || '').slice(0, 10);
      return dtIniItem === hojeStr || (dtIniItem <= hojeStr && dtFimItem >= hojeStr);
    });
  } else if (ocorrenciasState.filtro === 'fim_semana') {
    lista = lista.filter(p => p.info.isFimDeSemana || p.info.tempoFimSemanaMin > 0);
  } else if (ocorrenciasState.filtro === 'finalizado') {
    lista = lista.filter(p => p.item.status === 'finalizado');
  }

  // Filtragem por Supervisor
  if (ocorrenciasState.supervisor && ocorrenciasState.supervisor !== 'todos') {
    lista = lista.filter(p => p.supInfo.equipe === ocorrenciasState.supervisor);
  }

  // Busca
  if (ocorrenciasState.busca) {
    const b = ocorrenciasState.busca;
    lista = lista.filter(p => {
      return (p.item.vendedor || '').toLowerCase().includes(b) ||
        (p.item.rota || '').toLowerCase().includes(b) ||
        (p.supInfo.supervisor || '').toLowerCase().includes(b) ||
        (p.supInfo.supervisorCurto || '').toLowerCase().includes(b) ||
        (p.item.responsavel || '').toLowerCase().includes(b) ||
        (p.item.veiculo || '').toLowerCase().includes(b) ||
        (p.item.placa || '').toLowerCase().includes(b) ||
        (p.item.tipo || '').toLowerCase().includes(b) ||
        (p.item.local || '').toLowerCase().includes(b) ||
        (p.item.descricao || '').toLowerCase().includes(b);
    });
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
              <button type="button" class="btn btn-primary" onclick="abrirModalOcorrencia()" style="margin:0 auto">
                <svg class="i"><use href="#i-plus" /></svg>
                <span>Registrar Ocorrência / Agendar</span>
              </button>
            </div>
          `;
    return;
  }

  container.innerHTML = lista.map(({ item, info, supInfo }) => {
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
      : (isAgendado ? 'Aguardando início' : (isAberto ? (formatarMinutosAmigavel(info.tempoDecorridoMin) + ' até agora') : formatarMinutosAmigavel(info.tempoDecorridoMin)));
    const tempoUtilizadoLbl = isFimSemana ? 'Fora Expediente' : 'Tempo Útil';
    const tempoUtilizadoCor = isFimSemana
      ? '#475569'
      : (isAgendado ? '#6366f1' : (isAtrasado ? 'var(--bad)' : (isFinalizado ? 'var(--ok)' : 'var(--warn)')));

    const abertoPor = String(item.responsavel || '').trim();
    const multiDia = Boolean(item.data_fim && item.data_fim !== item.data);
    const dataPeriodoCard = multiDia ? (formatarData(item.data) + ' até ' + formatarData(item.data_fim)) : formatarData(item.data);

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
                    <span>${dataPeriodoCard}</span>
                    <span>·</span>
                    <span title="${esc(supInfo.supervisor)}">Supervisor: <b style="color:var(--ink-2)">${esc(supInfo.supervisorCurto)}</b></span>
                    ${abertoPor ? `<span>·</span><span>Aberto por: <b style="color:var(--ink-2)">${esc(abertoPor)}</b></span>` : ''}
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
                    <span class="ocr-time-val">${esc(item.hora_inicio || '--:--')}${(isAgendado || multiDia) ? ' (' + formatarData(item.data).slice(0, 5) + ')' : ''}</span>
                  </div>
                  <div class="ocr-time-item">
                    <span class="ocr-time-lbl">Tempo Médio</span>
                    <span class="ocr-time-val" style="color:var(--accent-hi)">${formatarMinutosAmigavel(info.tempoMedioMin)}</span>
                  </div>
                  <div class="ocr-time-item">
                    <span class="ocr-time-lbl">${isFinalizado ? 'Retorno' : 'Previsão Término'}</span>
                    <span class="ocr-time-val" style="color:${isAtrasado ? 'var(--bad)' : (isFinalizado ? 'var(--ok)' : 'var(--ink)')}">
                      ${isFinalizado ? (esc(item.hora_fim || '--:--') + (multiDia ? ' (' + formatarData(item.data_fim).slice(0, 5) + ')' : '')) : esc(info.horaFimPrevista)}
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
  if (document.hidden) return;
  if (document.querySelector('.modal-overlay.open')) return;
  if (state.visaoAtual === 'ocorrencias' && typeof renderOcorrenciasView === 'function') {
    renderOcorrenciasView();
  }
}, 30000);

// ==============================================================================