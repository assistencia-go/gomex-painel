
      // ==============================================================================
      // MODAL 2: CATÁLOGO DE PRODUTOS, PEÇAS & INSUMOS DA FROTA (COM CÓDIGO)
      // ==============================================================================
      function abrirModalCatalogoProdutos() {
        garantirCodigosProdutos();
        limparFormCatalogoProduto();
        renderTabelaCatalogoProdutos();
        $('modalCatalogoProdutos').classList.add('open');
      }
      window.abrirModalCatalogoProdutos = abrirModalCatalogoProdutos;

      function fecharModalCatalogoProdutos() {
        $('modalCatalogoProdutos').classList.remove('open');
      }
      window.fecharModalCatalogoProdutos = fecharModalCatalogoProdutos;

      function limparFormCatalogoProduto() {
        $('catProdEditId').value = '';
        if ($('catProdCodigo')) $('catProdCodigo').value = sugerirProximoCodigoProduto();
        $('catProdNome').value = '';
        $('catProdCategoria').value = 'Óleo & Lubrificantes';
        $('catProdUnidade').value = 'L';
        $('catProdPreco').value = '';
        $('catFormTitle').textContent = 'Cadastrar Novo Produto / Peça';
        $('btnSalvarCatProdLabel').textContent = 'Cadastrar';
        $('btnCancelarEdicaoProd').hidden = true;
      }
      window.limparFormCatalogoProduto = limparFormCatalogoProduto;

      async function salvarProdutoNoCatalogo() {
        const nome = ($('catProdNome').value || '').trim();
        if (!nome) {
          toast('Informe o nome do produto ou peça.', 'error');
          $('catProdNome').focus();
          return;
        }
        const codigo = ($('catProdCodigo')?.value || '').trim() || sugerirProximoCodigoProduto();
        const categoria = $('catProdCategoria').value || 'Outros';
        const unidade = $('catProdUnidade').value || 'un';
        const preco_base = parseNumeroMoeda($('catProdPreco').value);
        const editId = $('catProdEditId').value;

        if (editId) {
          const idx = gastosState.produtos.findIndex(p => String(p.id) === String(editId));
          if (idx !== -1) {
            gastosState.produtos[idx] = { ...gastosState.produtos[idx], codigo, nome, categoria, unidade, preco_base };
          }
          toast('Produto [' + codigo + '] atualizado no catálogo!');
        } else {
          gastosState.produtos.push({
            id: 'prod_' + Date.now(),
            codigo,
            nome,
            categoria,
            unidade,
            preco_base
          });
          toast('Produto [' + codigo + '] "' + nome + '" adicionado ao catálogo!');
        }

        await sincronizarGastosComServidor('push');
        limparFormCatalogoProduto();
        renderTabelaCatalogoProdutos();
        renderGastosView();
      }
      window.salvarProdutoNoCatalogo = salvarProdutoNoCatalogo;

      function editarProdutoCatalogo(id) {
        const p = gastosState.produtos.find(x => String(x.id) === String(id));
        if (!p) return;
        $('catProdEditId').value = p.id;
        if ($('catProdCodigo')) $('catProdCodigo').value = p.codigo || '';
        $('catProdNome').value = p.nome || '';
        $('catProdCategoria').value = p.categoria || 'Outros';
        $('catProdUnidade').value = p.unidade || 'un';
        $('catProdPreco').value = p.preco_base ? Number(p.preco_base).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
        $('catFormTitle').textContent = 'Editando Produto [' + (p.codigo || '') + ']: ' + p.nome;
        $('btnSalvarCatProdLabel').textContent = 'Salvar Alteração';
        $('btnCancelarEdicaoProd').hidden = false;
        $('catProdNome').focus();
      }
      window.editarProdutoCatalogo = editarProdutoCatalogo;

      async function excluirProdutoCatalogo(id) {
        const p = gastosState.produtos.find(x => String(x.id) === String(id));
        if (!p) return;
        const confirmado = await abrirConfirmacaoGlobal({
          titulo: 'Remover Produto do Catálogo',
          subtitulo: 'Catálogo de peças & insumos',
          mensagem: `Deseja remover <strong>"[${esc(p.codigo || '')}] ${esc(p.nome)}"</strong> do catálogo fixo de produtos?`,
          aviso: 'Os lançamentos já registrados no histórico não serão afetados.',
          textoConfirmar: 'Remover Produto',
          variante: 'perigo',
          icone: 'trash'
        });
        if (!confirmado) return;
        gastosState.produtos = gastosState.produtos.filter(x => String(x.id) !== String(id));
        await sincronizarGastosComServidor('push');
        renderTabelaCatalogoProdutos();
        renderGastosView();
        toast('Produto removido do catálogo.');
      }
      window.excluirProdutoCatalogo = excluirProdutoCatalogo;

      function renderTabelaCatalogoProdutos() {
        const tbody = $('catProdutosTableBody');
        if (!tbody) return;
        garantirCodigosProdutos();
        const q = ($('catBuscaProd')?.value || '').toLowerCase().trim();

        const filtrados = gastosState.produtos.filter(p => {
          if (!q) return true;
          return ((p.codigo || '') + ' ' + p.nome + ' ' + p.categoria + ' ' + p.unidade).toLowerCase().includes(q);
        });

        if ($('catTotalProdCount')) $('catTotalProdCount').textContent = gastosState.produtos.length;

        if (!filtrados.length) {
          tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:20px">Nenhum produto encontrado no catálogo.</td></tr>';
          return;
        }

        tbody.innerHTML = filtrados.map(p => {
          const usos = gastosState.lancamentos.filter(g => g.produto_id === p.id || g.produto_nome === p.nome).length;
          return '<tr>' +
            '<td style="white-space:nowrap"><span class="prod-code-badge">' + esc(p.codigo || '—') + '</span></td>' +
            '<td><strong style="color:var(--ink);font-size:13.5px">' + esc(p.nome) + '</strong></td>' +
            '<td style="white-space:nowrap">' + badgeCategoriaProduto(p.categoria) + '</td>' +
            '<td style="white-space:nowrap"><span class="badge-km" style="white-space:nowrap;padding:3px 8px">' + esc(UNIDADE_LABELS[p.unidade] || p.unidade) + '</span></td>' +
            '<td style="font-weight:700;color:var(--ok);white-space:nowrap">' + (p.preco_base ? fmtMoeda(p.preco_base) : '—') + '</td>' +
            '<td style="white-space:nowrap">' + usos + 'x</td>' +
            '<td style="text-align:right;white-space:nowrap">' +
            '<div style="display:inline-flex;gap:6px">' +
            '<button type="button" class="btn btn-ghost btn-icon" style="height:30px;width:30px;color:var(--accent-hi)" data-action="editarProdutoCatalogo" data-arg="' + esc(p.id) + '" title="Editar produto">' + icon('edit') + '</button>' +
            '<button type="button" class="btn btn-ghost btn-icon" style="height:30px;width:30px;color:var(--bad)" data-action="excluirProdutoCatalogo" data-arg="' + esc(p.id) + '" title="Excluir produto">' + icon('trash') + '</button>' +
            '</div>' +
            '</td>' +
            '</tr>';
        }).join('');
      }
      window.renderTabelaCatalogoProdutos = renderTabelaCatalogoProdutos;

      // ==============================================================================