//? BuscaCNPJ — consulta à API pública Minha Receita (https://minhareceita.org) */

let lastCompanyData = null;
let currentTab = 'qsa';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('div1-searchForm');
    const input = document.getElementById('div1-searchInput');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        query();
    });

    // máscara de digitação: 00.000.000/0000-00
    input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        input.value = maskCNPJ(input.value);
    });
});

function query() {
    const input = document.getElementById('div1-searchInput');
    const cnpj = onlyDigits(input.value);

    if (cnpj.length !== 14) {
        showInputError('CNPJ inválido — digite os 14 números');
        return;
    }

    setLoading(true);
    hideAllStates();

    fetch(`https://minhareceita.org/${cnpj}`)
        .then(async (response) => {
            if(response.status == 404){
                console.log('response status 404')
                showQueryError('CNPJ não encontrado na base da Receita Federal.');
            }
            if (!response.ok) {
                let message = 'CNPJ não encontrado na base da Receita Federal.';
                if (response.status >= 500) {
                    message = 'A API Minha Receita está indisponível no momento. Tente novamente em instantes.';
                }
                throw new Error(message);
            }
            return response.json();
        })
        .then((data) => {
            lastCompanyData = data;
            renderCompany(data, cnpj);
            renderDAV();
        })
        .catch((error) => {
            console.error(`ERRO NA CONSULTA: ${cnpj}`, error);
            showQueryError(error.message || 'Não foi possível concluir a consulta. Tente novamente.');
            document.getElementById('div1-searchInput').focus();
        })
        .finally(() => {
            setLoading(false);
        });
}

/** ============ ESTADOS DE TELA ============ */

function hideAllStates() {
    document.getElementById('div2-empty').style.display = 'none';
    document.getElementById('div2-content').hidden = true;
    document.getElementById('div2-error').style.display = 'none';
}

function showQueryError(message) {
    hideAllStates();
    document.getElementById('div2-errorText').innerText = message;
    document.getElementById('div2-error').style.display = 'flex';

    lastCompanyData = null;
    renderDAV();
}

function setLoading(isLoading) {
    const form = document.getElementById('div1-searchForm');
    form.classList.toggle('is-loading', isLoading);
}

function showInputError(message) {
    const input = document.getElementById('div1-searchInput');
    const hint = document.getElementById('div1-hint');
    const originalHint = hint.innerText;

    input.classList.add('is-invalid');
    hint.innerText = message;

    setTimeout(() => {
        input.classList.remove('is-invalid');
        hint.innerText = originalHint;
    }, 2200);
}

/** ============ RENDER — FICHA CADASTRAL ============ */

function renderCompany(data, cnpj) {
    hideAllStates();
    document.getElementById('div2-content').hidden = false;

    document.getElementById('razao_social').innerText = data.razao_social || 'Não informado';
    document.getElementById('cnpj_formatted').innerText = maskCNPJ(cnpj);

    setText('nome_fantasia', data.nome_fantasia);
    setText('porte', data.porte);
    setText('natureza_juridica', data.natureza_juridica);
    setText('cnae_fiscal_descricao', data.cnae_fiscal_descricao);
    setTitle('cnae_fiscal_descricao', data.cnae_fiscal_descricao);
    setText('data_inicio_atividade', parseDate(data.data_inicio_atividade));
    setText('data_situacao_cadastral', parseDate(data.data_situacao_cadastral));
    setText('capital_social', formatCurrency(data.capital_social));
    setText('logradouro', joinAddress(data.descricao_tipo_de_logradouro, data.logradouro));
    setText('numero', data.numero);
    setText('complemento', data.complemento);
    setText('bairro', data.bairro);
    setText('municipio', data.municipio);
    setText('uf', data.uf);
    setText('cep', formatCEP(data.cep));
    setText('pais', isNull(data.pais) ? 'BRASIL' : data.pais);
    setText('telefone1', parsePhone(data.ddd_telefone_1));
    setText('telefone2', parsePhone(data.ddd_telefone_2));

    renderStamp(data.descricao_situacao_cadastral);
}

function renderStamp(descricaoSituacao) {
    const stamp = document.getElementById('situacao-stamp');
    const stampText = document.getElementById('situacao-stampText');

    stamp.classList.remove('status-ativa', 'status-inativa');

    if (isNull(descricaoSituacao)) {
        stampText.innerText = 'Sem status';
        return;
    }

    stampText.innerText = descricaoSituacao;
    stamp.classList.add(
        descricaoSituacao.toUpperCase() === 'ATIVA' ? 'status-ativa' : 'status-inativa'
    );
}

function setText(elementId, value) {
    document.getElementById(elementId).innerText = isNull(value) ? 'Não informado' : value;
}
function setTitle(elementId, value) {
    document.getElementById(elementId).title = isNull(value) ? '' : value;
}

/** ============ RENDER — DAV (QSA / CNAEs secundários) ============ */

function DAV_dataSelect(tab) {
    currentTab = tab;
    renderDAV();
}

function renderDAV() {
    const viewer = document.getElementById('DAV-dataviewer');
    const tabButtons = document.querySelectorAll('.DAV-tabBtn');

    tabButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === currentTab);
    });

    const list = lastCompanyData
        ? (currentTab === 'qsa' ? lastCompanyData.qsa : lastCompanyData.cnaes_secundarios)
        : null;

    if (!list || list.length === 0) {
        viewer.setAttribute('dataarray', 'null');
        viewer.innerHTML = '<span id="DAV-dataviewer-NULLopt">Sem informações</span>';
        return;
    }

    viewer.setAttribute('dataarray', 'filled');
    viewer.innerHTML = currentTab === 'qsa'
        ? list.map(renderQsaEntry).join('')
        : list.map(renderCnaeEntry).join('');
}

function renderQsaEntry(socio, index) {
    const nome = escapeHTML(isNull(socio.nome_socio) ? 'Não informado' : socio.nome_socio);
    const qualificacao = escapeHTML(isNull(socio.qualificacao_socio) ? 'Sócio' : socio.qualificacao_socio);
    const desde = isNull(socio.data_entrada_sociedade) ? '' : `desde ${parseDate(socio.data_entrada_sociedade)}`;
    const faixa = isNull(socio.faixa_etaria) ? '' : escapeHTML(socio.faixa_etaria);

    return `
        <div class="DAV-entry">
            <span class="DAV-entryIndex">SÓCIO ${String(index + 1).padStart(2, '0')}</span>
            <span class="DAV-entryTitle">${nome}</span>
            <span class="DAV-entryMeta">${qualificacao}${desde ? ' · ' + desde : ''}${faixa ? ' · ' + faixa : ''}</span>
        </div>
    `;
}

function renderCnaeEntry(cnae, index) {
    const descricao = escapeHTML(isNull(cnae.descricao) ? 'Não informado' : cnae.descricao);
    const codigo = isNull(cnae.codigo) ? '' : formatCNAECode(cnae.codigo);

    return `
        <div class="DAV-entry">
            <span class="DAV-entryIndex">${String(index + 1).padStart(2, '0')} · ${codigo}</span>
            <span class="DAV-entryTitle">${descricao}</span>
        </div>
    `;
}

/** ============ HELPERS ============ */

function isNull(v) {
    return v === null || v === undefined || v === '';
}

function onlyDigits(value) {
    return (value || '').replace(/\D/g, '');
}

function maskCNPJ(value) {
    const digits = onlyDigits(value).slice(0, 14);
    let result = digits;

    if (digits.length > 12) {
        result = digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
    } else if (digits.length > 8) {
        result = digits.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
    } else if (digits.length > 5) {
        result = digits.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (digits.length > 2) {
        result = digits.replace(/(\d{2})(\d{1,3})/, '$1.$2');
    }

    return result;
}

function formatCEP(cep) {
    if (isNull(cep)) return null;
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return cep;
    return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function formatCNAECode(codigo) {
    const digits = String(codigo);
    if (digits.length !== 7) return digits;
    return digits.replace(/(\d{4})(\d{1})(\d{2})/, '$1-$2/$3');
}

function joinAddress(tipoLogradouro, logradouro) {
    if (isNull(logradouro)) return null;
    return isNull(tipoLogradouro) ? logradouro : `${tipoLogradouro} ${logradouro}`;
}

function formatCurrency(value) {
    if (isNull(value)) return null;
    const number = Number(value);
    if (Number.isNaN(number)) return String(value);
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parsePhone(phone) {
    if (isNull(phone)) return null;
    const digits = onlyDigits(phone);
    if (digits.length < 10) return null;
    return digits.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
}

function parseDate(date) {
    if (isNull(date)) return null;
    const [year, month, day] = date.split('-');
    if (!year || !month || !day) return date;
    return `${day}/${month}/${year}`;
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
