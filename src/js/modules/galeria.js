      // MÓDULO 3: GALERIA DE FOTOS DOS VEÍCULOS (PLACA, DATA, MOTORISTA, CATEGORIA, OBS)
      // ==============================================================================
      function comprimirImagemParaDataUrl(file, maxDim = 1100, quality = 0.80) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
              let w = img.width;
              let h = img.height;
              if (w > maxDim || h > maxDim) {
                if (w > h) {
                  h = Math.round((h * maxDim) / w);
                  w = maxDim;
                } else {
                  w = Math.round((w * maxDim) / h);
                  h = maxDim;
                }
              }
              const cv = document.createElement('canvas');
              cv.width = w;
              cv.height = h;
              const ctx = cv.getContext('2d');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, w, h);
              ctx.drawImage(img, 0, 0, w, h);
              resolve(cv.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = ev.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      function abrirModalSubirFoto(placaPadrao = '', motoristaPadrao = '') {
        const pNorm = (placaPadrao || '').toUpperCase().trim();
        popularDatalistEPlacasNoModalGasto();
        const info = pNorm ? obterInfoPlacaNaFrota(pNorm) : { placa: '', veiculo: '', motorista: '', km: '' };

        gastosState.galUploadsDraft = [];
        if ($('galFileInput')) $('galFileInput').value = '';
        renderPreviewUploadsGaleria();

        $('galInputPlaca').value = pNorm;
        $('galInputVeiculo').value = info.veiculo || '';
        $('galInputData').value = isoLocal(new Date());
        $('galInputMotorista').value = motoristaPadrao || info.motorista || '';
        $('galInputCategoria').value = 'Estado Geral / Vistoria';
        $('galInputKm').value = info.km || '';
        $('galInputObs').value = '';

        $('modalSubirFotoGaleria').classList.add('open');
      }
      window.abrirModalSubirFoto = abrirModalSubirFoto;

      function fecharModalSubirFoto() {
        $('modalSubirFotoGaleria').classList.remove('open');
      }
      window.fecharModalSubirFoto = fecharModalSubirFoto;

      function onDigitarPlacaNoModalGaleria(placaRaw) {
        const p = (placaRaw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
        if (p.length >= 7) {
          const info = obterInfoPlacaNaFrota(p);
          if (info.veiculo && $('galInputVeiculo')) $('galInputVeiculo').value = info.veiculo;
          if (info.motorista && $('galInputMotorista') && !$('galInputMotorista').value) $('galInputMotorista').value = info.motorista;
          if (info.km && $('galInputKm') && !$('galInputKm').value) $('galInputKm').value = info.km;
        }
      }
      window.onDigitarPlacaNoModalGaleria = onDigitarPlacaNoModalGaleria;

      function acionarSeletorFotosGaleria() {
        const input = $('galFileInput');
        if (!input) return;
        input.value = '';
        input.click();
      }
      window.acionarSeletorFotosGaleria = acionarSeletorFotosGaleria;

      function limparUploadsDraftGaleria() {
        gastosState.galUploadsDraft = [];
        if ($('galFileInput')) $('galFileInput').value = '';
        renderPreviewUploadsGaleria();
      }
      window.limparUploadsDraftGaleria = limparUploadsDraftGaleria;

      async function onSelecionarArquivosGaleria(fileList) {
        if (!fileList || !fileList.length) return;
        const files = Array.from(fileList).filter(f => f.type && f.type.startsWith('image/'));
        if (!files.length) {
          toast('Selecione arquivos de imagem válidos (JPG, PNG, WEBP).', 'error');
          return;
        }
        let adicionadas = 0;
        for (const f of files) {
          try {
            const dataUrl = await comprimirImagemParaDataUrl(f);
            gastosState.galUploadsDraft.push({
              uid: 'up_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
              nome: f.name,
              dataUrl
            });
            adicionadas++;
          } catch (e) { }
        }
        if ($('galFileInput')) $('galFileInput').value = '';
        renderPreviewUploadsGaleria();
        if (adicionadas > 0) {
          toast(adicionadas + (adicionadas === 1 ? ' foto adicionada!' : ' fotos adicionadas!') + ' Você pode adicionar mais se quiser.');
        }
      }
      window.onSelecionarArquivosGaleria = onSelecionarArquivosGaleria;

      function removerUploadDraftGaleria(idx) {
        gastosState.galUploadsDraft.splice(idx, 1);
        renderPreviewUploadsGaleria();
      }
      window.removerUploadDraftGaleria = removerUploadDraftGaleria;

      function renderPreviewUploadsGaleria() {
        const grid = $('galUploadPreviewGrid');
        const statusHeader = $('galUploadStatusHeader');
        const countText = $('galUploadCountText');
        const btnEscolherLabel = $('galBtnEscolherLabel');
        const btnSalvar = $('btnSalvarFotoGaleria');
        if (!grid) return;
        const list = gastosState.galUploadsDraft || [];
        if (!list.length) {
          grid.hidden = true;
          grid.style.display = 'none';
          grid.innerHTML = '';
          if (statusHeader) {
            statusHeader.hidden = true;
            statusHeader.style.display = 'none';
          }
          if (btnEscolherLabel) btnEscolherLabel.textContent = 'Escolher Fotos do Computador';
          if (btnSalvar && !btnSalvar.disabled) {
            btnSalvar.innerHTML = icon('check') + ' <span>Salvar na Galeria do Veículo</span>';
          }
          return;
        }
        grid.hidden = false;
        grid.style.display = 'grid';
        if (statusHeader) {
          statusHeader.hidden = false;
          statusHeader.style.display = 'flex';
        }
        if (countText) {
          countText.textContent = list.length + (list.length === 1 ? ' foto pronta para enviar' : ' fotos prontas para enviar');
        }
        if (btnEscolherLabel) btnEscolherLabel.textContent = 'Selecionar Mais Fotos do Computador';
        if (btnSalvar && !btnSalvar.disabled) {
          btnSalvar.innerHTML = icon('check') + ' <span>Salvar ' + list.length + (list.length === 1 ? ' Foto' : ' Fotos') + ' na Galeria</span>';
        }
        grid.innerHTML = list.map((u, idx) =>
          '<div class="upload-preview-item" title="' + escapeHtml(u.nome || ('Foto ' + (idx + 1))) + '">' +
          '<img src="' + u.dataUrl + '" alt="Preview">' +
          '<button type="button" class="upload-preview-remove" onclick="event.stopPropagation(); removerUploadDraftGaleria(' + idx + ')" title="Remover esta foto">×</button>' +
          '</div>'
        ).join('') +
          '<button type="button" onclick="event.stopPropagation(); acionarSeletorFotosGaleria()" title="Clique para adicionar mais fotos" style="height:82px;border-radius:8px;border:1.5px dashed var(--accent);background:var(--accent-tint);color:var(--accent-hi);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;font-size:11px;font-weight:700">' +
          '<span style="font-size:18px;line-height:1">+</span>' +
          '<span>Mais fotos</span>' +
          '</button>';
      }

      // Suporte a Arrastar e Soltar (Drag & Drop) e Colar (Ctrl+V do WhatsApp) no modal de Galeria
      setTimeout(() => {
        const dz = $('galDropzone');
        if (dz) {
          dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
          dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
          dz.addEventListener('drop', e => {
            e.preventDefault();
            dz.classList.remove('dragover');
            if (e.dataTransfer && e.dataTransfer.files) {
              onSelecionarArquivosGaleria(e.dataTransfer.files);
            }
          });
        }
        document.addEventListener('paste', e => {
          if (!$('modalSubirFotoGaleria') || !$('modalSubirFotoGaleria').classList.contains('open')) return;
          const items = e.clipboardData && e.clipboardData.items;
          if (!items) return;
          const imgFiles = [];
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              const f = items[i].getAsFile();
              if (f) imgFiles.push(f);
            }
          }
          if (imgFiles.length) {
            onSelecionarArquivosGaleria(imgFiles);
            toast(imgFiles.length + ' foto(s) colada(s) da área de transferência!');
          }
        });
      }, 200);

      async function salvarFotosGaleria() {
        if (!gastosState.galUploadsDraft || !gastosState.galUploadsDraft.length) {
          toast('Selecione ou cole ao menos 1 foto do veículo.', 'error');
          return;
        }
        const placa = ($('galInputPlaca').value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
        if (!placa) {
          toast('Informe a placa do veículo.', 'error');
          $('galInputPlaca').focus();
          return;
        }
        const motorista = ($('galInputMotorista').value || '').trim();
        if (!motorista) {
          toast('Informe qual era o motorista.', 'error');
          $('galInputMotorista').focus();
          return;
        }
        const infoPlaca = obterInfoPlacaNaFrota(placa);
        const veiculo = ($('galInputVeiculo').value || '').trim() || infoPlaca.veiculo || 'Veículo da Frota';
        const data = $('galInputData').value || isoLocal(new Date());
        const categoria = $('galInputCategoria').value || 'Estado Geral / Vistoria';
        const km = $('galInputKm').value ? Number($('galInputKm').value) : null;
        const obs = ($('galInputObs').value || '').trim();
        const usuarioLogado = ($('userNameLabel')?.textContent || 'gomex').trim();

        const btn = $('btnSalvarFotoGaleria');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Salvando fotos no banco...';
        }

        try {
          if (!Array.isArray(gastosState.galeria)) gastosState.galeria = [];
          const baseTs = Date.now();
          const qtdFotos = gastosState.galUploadsDraft.length;

          gastosState.galUploadsDraft.forEach((u, i) => {
            gastosState.galeria.unshift({
              id: 'foto_' + (baseTs + i) + '_' + Math.random().toString(36).slice(2, 6),
              created_ts: baseTs + i,
              placa,
              veiculo,
              data,
              motorista,
              categoria,
              km,
              obs,
              imagem: u.dataUrl,
              registrado_por: usuarioLogado
            });
          });

          await sincronizarGastosComServidor('push');
          fecharModalSubirFoto();
          renderGaleriaView();
          toast(qtdFotos + (qtdFotos === 1 ? ' foto salva' : ' fotos salvas') + ' na galeria da placa ' + placa + '!');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = icon('check') + ' <span>Salvar na Galeria do Veículo</span>';
          }
        }
      }
      window.salvarFotosGaleria = salvarFotosGaleria;

      function irParaGaleriaDaPlaca(placa) {
        const p = (placa || '').toUpperCase().trim();
        alternarVisaoPrincipal('galeria');
        if ($('galFiltroPlaca')) {
          popularFiltrosGaleria();
          $('galFiltroPlaca').value = p;
        }
        renderGaleriaView();
      }
      window.irParaGaleriaDaPlaca = irParaGaleriaDaPlaca;

      function limparFiltrosGaleria() {
        if ($('galFiltroBusca')) $('galFiltroBusca').value = '';
        if ($('galFiltroPlaca')) $('galFiltroPlaca').value = '';
        if ($('galFiltroMotorista')) $('galFiltroMotorista').value = '';
        if ($('galFiltroCategoria')) $('galFiltroCategoria').value = '';
        renderGaleriaView();
      }
      window.limparFiltrosGaleria = limparFiltrosGaleria;

      function popularFiltrosGaleria() {
        const selPlaca = $('galFiltroPlaca');
        if (selPlaca) {
          const valAtual = selPlaca.value;
          const placas = obterTodasPlacasConhecidas();
          selPlaca.innerHTML = '<option value="">Todas as placas (' + placas.length + ')</option>' +
            placas.map(x => '<option value="' + esc(x.placa) + '">' + esc(x.placa) + (x.veiculo ? ' · ' + esc(x.veiculo) : '') + '</option>').join('');
          selPlaca.value = valAtual;
        }
        const selMot = $('galFiltroMotorista');
        if (selMot) {
          const valAtualM = selMot.value;
          const mots = obterTodosMotoristasConhecidos();
          selMot.innerHTML = '<option value="">Todos os motoristas (' + mots.length + ')</option>' +
            mots.map(m => '<option value="' + esc(m) + '">' + esc(m) + '</option>').join('');
          selMot.value = valAtualM;
        }
      }

      function renderGaleriaView() {
        const grid = $('galeriaGridContainer');
        if (!grid) return;

        popularFiltrosGaleria();

        const fotos = Array.isArray(gastosState.galeria) ? gastosState.galeria : [];
        const placasUnicas = new Set(fotos.map(f => (f.placa || '').toUpperCase().trim()).filter(Boolean));
        const motsUnicos = new Set(fotos.map(f => (f.motorista || '').trim()).filter(Boolean));

        if ($('galStatTotal')) $('galStatTotal').textContent = fotos.length;
        if ($('galStatPlacas')) $('galStatPlacas').textContent = placasUnicas.size;
        if ($('galStatMotoristas')) $('galStatMotoristas').textContent = motsUnicos.size;
        if (fotos.length > 0) {
          const rec = fotos[0];
          if ($('galStatUltimaData')) $('galStatUltimaData').textContent = formatarData(rec.data);
          if ($('galStatUltimaSub')) $('galStatUltimaSub').textContent = (rec.placa || '') + ' · ' + (rec.motorista || '');
        } else {
          if ($('galStatUltimaData')) $('galStatUltimaData').textContent = '–';
          if ($('galStatUltimaSub')) $('galStatUltimaSub').textContent = 'Nenhuma foto enviada ainda';
        }

        const q = ($('galFiltroBusca')?.value || '').toLowerCase().trim();
        const fPlaca = ($('galFiltroPlaca')?.value || '').toUpperCase().trim();
        const fMot = ($('galFiltroMotorista')?.value || '').toLowerCase().trim();
        const fCat = ($('galFiltroCategoria')?.value || '').trim();

        if ($('btnLimparFiltrosGaleria')) {
          $('btnLimparFiltrosGaleria').hidden = !Boolean(q || fPlaca || fMot || fCat);
        }

        const filtradas = fotos.filter(f => {
          if (fPlaca && (f.placa || '').toUpperCase().trim() !== fPlaca) return false;
          if (fMot && (f.motorista || '').toLowerCase().trim() !== fMot) return false;
          if (fCat && (f.categoria || '') !== fCat) return false;
          if (q) {
            const hay = ((f.placa || '') + ' ' + (f.veiculo || '') + ' ' + (f.motorista || '') + ' ' + (f.categoria || '') + ' ' + (f.obs || '')).toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });

        if ($('galeriaFooterInfo')) {
          $('galeriaFooterInfo').textContent = filtradas.length + (filtradas.length === 1 ? ' foto exibida' : ' fotos exibidas');
        }

        if (!filtradas.length) {
          grid.innerHTML = '<div style="grid-column:1/-1" class="empty">' +
            '<div class="empty-icon-wrap"><svg class="i"><use href="#i-camera"/></svg></div>' +
            '<h2>Nenhuma foto encontrada na galeria</h2>' +
            '<p>Suba as fotos encaminhadas pelos motoristas com a placa do veículo, data da foto e nome do motorista.</p>' +
            '<div class="empty-action">' +
            '<button type="button" class="btn btn-primary" onclick="abrirModalSubirFoto(\'' + esc(fPlaca) + '\')">' +
            '<svg class="i"><use href="#i-camera"/></svg> <span>+ Subir Foto na Galeria</span>' +
            '</button>' +
            '</div>' +
            '</div>';
          return;
        }

        grid.innerHTML = filtradas.map(f => {
          return '<article class="galeria-card">' +
            '<div class="galeria-img-wrap" onclick="abrirLightboxFoto(\'' + esc(f.id) + '\')">' +
            '<img src="' + f.imagem + '" alt="Foto ' + esc(f.placa) + '" loading="lazy">' +
            '<div class="galeria-img-badges">' +
            '<span class="plate" style="font-size:11px;background:rgba(9,9,11,0.88);backdrop-filter:blur(4px)">' + esc(f.placa) + '</span>' +
            '<span class="badge-cat-prod" style="background:rgba(9,9,11,0.82);color:#fff;border-color:rgba(255,255,255,0.2)">' + esc(f.categoria || 'Vistoria') + '</span>' +
            '</div>' +
            '</div>' +
            '<div class="galeria-body">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px">' +
            '<strong style="font-size:13px;color:var(--ink)">' + esc(f.veiculo || 'Veículo da Frota') + '</strong>' +
            '<span style="font-size:11.5px;font-weight:700;color:var(--accent-hi)">' + formatarData(f.data) + '</span>' +
            '</div>' +
            '<div class="galeria-meta">' +
            '<div>Motorista: <strong>' + esc(f.motorista || 'Não informado') + '</strong></div>' +
            (f.km ? '<div>Quilometragem: <strong>' + fmtKm(f.km) + '</strong></div>' : '') +
            '</div>' +
            (f.obs ? '<div class="galeria-obs">' + esc(f.obs) + '</div>' : '') +
            '</div>' +
            '<div class="galeria-foot">' +
            '<button type="button" class="btn btn-ghost" style="height:26px;padding:0 8px;font-size:11.5px;color:var(--accent-hi)" onclick="abrirLightboxFoto(\'' + esc(f.id) + '\')">' +
            icon('eye') + ' <span>Ampliar</span>' +
            '</button>' +
            '<div style="display:flex;gap:4px">' +
            '<button type="button" class="btn btn-ghost btn-icon" style="height:26px;width:26px" onclick="baixarFotoGaleria(\'' + esc(f.id) + '\')" title="Baixar foto">' + icon('download') + '</button>' +
            '<button type="button" class="btn btn-ghost btn-icon" style="height:26px;width:26px;color:var(--bad)" onclick="excluirFotoGaleria(\'' + esc(f.id) + '\')" title="Excluir foto">' + icon('trash') + '</button>' +
            '</div>' +
            '</div>' +
            '</article>';
        }).join('');
      }
      window.renderGaleriaView = renderGaleriaView;

      function abrirLightboxFoto(id) {
        const f = (gastosState.galeria || []).find(x => String(x.id) === String(id));
        if (!f) return;
        $('lightboxFotoPlaca').textContent = f.placa || '—';
        $('lightboxFotoTitulo').textContent = (f.veiculo || 'Veículo') + ' · Motorista: ' + (f.motorista || '—');
        $('lightboxFotoImg').src = f.imagem;
        $('lightboxFotoData').textContent = formatarData(f.data);
        $('lightboxFotoMotorista').textContent = f.motorista || '—';
        $('lightboxFotoCategoria').textContent = f.categoria || '—';
        $('lightboxFotoKm').textContent = f.km ? fmtKm(f.km) : 'Não informado';
        const obsWrap = $('lightboxFotoObsWrap');
        if (obsWrap) {
          obsWrap.hidden = !f.obs;
          obsWrap.textContent = f.obs ? 'Observação: ' + f.obs : '';
        }
        $('btnBaixarFotoLightbox').onclick = () => baixarFotoGaleria(f.id);
        $('btnExcluirFotoLightbox').onclick = () => { fecharLightboxFoto(); excluirFotoGaleria(f.id); };
        $('modalVerFotoGaleria').classList.add('open');
      }
      window.abrirLightboxFoto = abrirLightboxFoto;

      function fecharLightboxFoto() {
        $('modalVerFotoGaleria').classList.remove('open');
      }
      window.fecharLightboxFoto = fecharLightboxFoto;

      function baixarFotoGaleria(id) {
        const f = (gastosState.galeria || []).find(x => String(x.id) === String(id));
        if (!f || !f.imagem) return;
        const a = document.createElement('a');
        a.href = f.imagem;
        a.download = 'Foto_' + (f.placa || 'Veiculo') + '_' + (f.data || isoLocal(new Date())) + '_' + (f.motorista || 'Motorista').replace(/\s+/g, '_') + '.jpg';
        a.click();
      }
      window.baixarFotoGaleria = baixarFotoGaleria;

      async function excluirFotoGaleria(id) {
        const f = (gastosState.galeria || []).find(x => String(x.id) === String(id));
        if (!f) return;
        const confirmado = await abrirConfirmacaoGlobal({
          titulo: 'Excluir Foto da Galeria',
          subtitulo: 'Registro visual do veículo',
          mensagem: `Deseja realmente excluir esta foto do veículo <strong>${esc(f.placa)}</strong> (Motorista: <strong>${esc(f.motorista)}</strong>)?`,
          aviso: 'A foto será removida permanentemente da galeria da frota.',
          textoConfirmar: 'Excluir Foto',
          variante: 'perigo',
          icone: 'trash'
        });
        if (!confirmado) return;
        gastosState.galeria = (gastosState.galeria || []).filter(x => String(x.id) !== String(id));
        await sincronizarGastosComServidor('push');
        renderGaleriaView();
        toast('Foto excluída da galeria.');
      }
      window.excluirFotoGaleria = excluirFotoGaleria;

      function renderResumoGaleriaNoModalHistorico(placa) {
        const p = (placa || '').toUpperCase().trim();
        const fotos = (gastosState.galeria || []).filter(f => (f.placa || '').toUpperCase().trim() === p);
        if ($('histGaleriaCount')) $('histGaleriaCount').textContent = fotos.length;
        const listEl = $('histGaleriaPlacaList');
        if (!listEl) return;
        if (!fotos.length) {
          listEl.innerHTML = '<div class="muted" style="grid-column:1/-1;font-size:12px;padding:4px 0">Nenhuma foto enviada para a placa ' + esc(p) + ' ainda.</div>';
          return;
        }
        listEl.innerHTML = fotos.slice(0, 6).map(f =>
          '<div style="cursor:pointer;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--raised)" onclick="abrirLightboxFoto(\'' + esc(f.id) + '\')" title="' + esc(formatarData(f.data) + ' · ' + f.motorista) + '">' +
          '<img src="' + f.imagem + '" alt="Foto" style="width:100%;height:74px;object-fit:cover;display:block">' +
          '<div style="padding:4px 6px;font-size:10.5px;line-height:1.25">' +
          '<strong style="color:var(--ink);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(f.motorista) + '</strong>' +
          '<span style="color:var(--ink-3)">' + formatarData(f.data) + '</span>' +
          '</div>' +
          '</div>'
        ).join('');
      }
      window.renderResumoGaleriaNoModalHistorico = renderResumoGaleriaNoModalHistorico;

      if ($('modalLancarGasto')) {
        $('modalLancarGasto').addEventListener('click', e => {
          if (!e.target.closest('.prod-autocomplete-wrap')) {
            fecharTodosMenusSugestaoProd();
          }
          if (e.target === $('modalLancarGasto')) fecharModalLancarGasto();
        });
      }

      document.addEventListener('click', e => {
        if (!e.target.closest('.prod-autocomplete-wrap')) {
          fecharTodosMenusSugestaoProd();
        }
      });
      if ($('modalNotificacoesPush')) {
        $('modalNotificacoesPush').addEventListener('click', e => {
          if (e.target === $('modalNotificacoesPush')) fecharModalNotificacoesPush();
        });
      }
      if ($('modalCatalogoProdutos')) {
        $('modalCatalogoProdutos').addEventListener('click', e => {
          if (e.target === $('modalCatalogoProdutos')) fecharModalCatalogoProdutos();
        });
      }
      if ($('modalSubirFotoGaleria')) {
        $('modalSubirFotoGaleria').addEventListener('click', e => {
          if (e.target === $('modalSubirFotoGaleria')) fecharModalSubirFoto();
        });
      }
      if ($('modalVerFotoGaleria')) {
        $('modalVerFotoGaleria').addEventListener('click', e => {
          if (e.target === $('modalVerFotoGaleria')) fecharLightboxFoto();
        });
      }
      if ($('modalCopiarWhatsApp')) {
        $('modalCopiarWhatsApp').addEventListener('click', e => {
          if (e.target === $('modalCopiarWhatsApp')) fecharModalCopiarWhatsApp();
        });
      }
      if ($('modalCadastrarVeiculo')) {
        $('modalCadastrarVeiculo').addEventListener('click', e => {
          if (e.target === $('modalCadastrarVeiculo')) fecharModalCadastrarVeiculo();
        });
      }

      // ==============================================================================