// ========================================
// CONFIGURAÇÃO
// ========================================

const API_URL = "https://localhost:7063";

let paginaAtual = 1;
let ordemAtual = "DataCadastro";
let direcaoAtual = "DESC";


// ========================================
// ELEMENTOS DA PÁGINA
// ========================================

const formulario = document.getElementById("formulario");
const formLembrete = document.getElementById("formLembrete");

const lembreteId = document.getElementById("lembreteId");
const descricao = document.getElementById("descricao");

const listaLembretes = document.getElementById("listaLembretes");
const mensagemVazia = document.getElementById("mensagemVazia");

const filtroDescricao = document.getElementById("filtroDescricao");
const tamanhoPagina = document.getElementById("tamanhoPagina");
const filtroDataCadastroInicial = document.getElementById("filtroDataCadastroInicial");
const filtroDataCadastroFinal = document.getElementById("filtroDataCadastroFinal");
const filtroDataAtualizacaoInicial = document.getElementById("filtroDataAtualizacaoInicial");
const filtroDataAtualizacaoFinal = document.getElementById("filtroDataAtualizacaoFinal");

const totalRegistros = document.getElementById("totalRegistros");
const paginaAtualElemento = document.getElementById("paginaAtual");

const btnImprimir = document.getElementById("btnImprimir");
const btnNovo = document.getElementById("btnNovo");
const btnCancelar = document.getElementById("btnCancelar");
const btnFiltrar = document.getElementById("btnFiltrar");

const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");

const tituloFormulario = document.getElementById("tituloFormulario");

const botoesOrdenar = document.querySelectorAll(".btn-ordenar");


// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    filtrarLembretes();
});

// ========================================
// GET /lembretes/filtro
// ========================================
async function filtrarLembretes() {
    atualizarSetasOrdenacao();

    try {
        const params = montarParametros();

        console.log('filtro-> params', params);

        const response = await fetch(
            `${API_URL}/lembretes/filtro?${params}`
        );

        if (!response.ok) {
            throw new Error("Erro ao filtrar lembretes.");
        }

        const resultado = await response.json();

        if (resultado.lembretes.length === 0 && paginaAtual > 1) {
            paginaAtual--;
            await filtrarLembretes();
            return;
        }

        renderizarLembretes(resultado.lembretes);

        const totalPaginas = Math.max(1, Math.ceil(resultado.total / resultado.tamanhoPagina));

        totalRegistros.textContent =
            `${resultado.total} ${resultado.total === 1 ? "registro" : "registros"}`;

        paginaAtualElemento.textContent =
            `Página ${resultado.numeroPagina} de ${totalPaginas}`;

        btnAnterior.disabled =
            paginaAtual <= 1;

        btnProximo.disabled =
            paginaAtual >= totalPaginas;

    } catch (error) {

        console.error(error);

        listaLembretes.innerHTML = "";
        mensagemVazia.textContent = "Não foi possível carregar os lembretes.";
        mensagemVazia.classList.remove("hidden");

        btnAnterior.disabled = true;
        btnProximo.disabled = true;

        mostrarToast(
            mensagemDeErro(error, "Erro ao realizar o filtro."),
            "erro"
        );
    }
}

// ========================================
// GET /lembretes/imprimir
// ========================================
async function imprimirLembretes() {
    try {
        const params = montarParametros();

        const response = await fetch(
            `${API_URL}/lembretes/imprimir?${params}`
        );

        if (!response.ok) {
            throw new Error("Erro ao filtrar lembretes.");
        }
        
        console.log("teste");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "relatorio-lembretes.pdf";

        document.body.appendChild(a)
        a.click();
        a.remove();

        setTimeout(() => URL.revokeObjectURL(url), 10000)

    } catch (error) {

        console.error(error);

        mostrarToast(
            mensagemDeErro(error, "Não foi possível gerar o relatório."),
            "erro"
        );
    }
}

// ========================================
// POST /lembretes
// ========================================

async function criarLembrete() {
    try {

        const dados = { 
            descricao: descricao.value
        };

        const response = await fetch(
            `${API_URL}/lembretes`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            }
        );

        if (!response.ok) {
            throw new Error("Erro ao criar lembrete.");
        }

        mostrarToast("Lembrete criado com sucesso!");

        fecharFormulario();

        await filtrarLembretes();

    } catch (error) {

        console.error(error);

        mostrarToast(mensagemDeErro(error, "Não foi possível criar o lembrete."), "erro");
    }
}


// ========================================
// GET /lembretes/{id}
// ========================================
async function buscarLembrete(id) {

    try {

        const response = await fetch(
            `${API_URL}/lembretes/${id}`
        );

        if (!response.ok) {
            throw new Error("Lembrete não encontrado.");
        }

        const lembrete = await response.json();

        lembreteId.value = lembrete.id;
        descricao.value = lembrete.descricao;

        tituloFormulario.textContent = "Editar lembrete";

        formulario.classList.remove("hidden");

    } catch (error) {

        console.error(error);

        mostrarToast(
            mensagemDeErro(error, "Não foi possível buscar o lembrete."),
            "erro"
        );
    }
}


// ========================================
// PUT /lembretes/{id}
// ========================================

async function atualizarLembrete() {

    try {

        const dados = {
            descricao: descricao.value
        };

        const response = await fetch(
            `${API_URL}/lembretes/${lembreteId.value}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(dados)
            }
        );

        if (!response.ok) {
            throw new Error("Erro ao atualizar.");
        }

        mostrarToast(
            "Lembrete atualizado com sucesso!"
        );

        fecharFormulario();

        await filtrarLembretes();

    } catch (error) {

        console.error(error);

        mostrarToast(
            mensagemDeErro(error, "Não foi possível atualizar o lembrete."),
            "erro"
        );
    }
}


// ========================================
// DELETE /lembretes/{id}
// ========================================
async function excluirLembrete(id) {

    const confirmou = confirm(
        "Deseja realmente excluir este lembrete?"
    );

    if (!confirmou) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/lembretes/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Erro ao excluir.");
        }

        mostrarToast(
            "Lembrete excluído com sucesso!"
        );

        await filtrarLembretes();

    } catch (error) {

        console.error(error);

        mostrarToast(
            mensagemDeErro(error, "Não foi possível excluir o lembrete."),
            "erro"
        );
    }
}


// ========================================
// RENDERIZAÇÃO
// ========================================
function renderizarLembretes(lembretes) {
    listaLembretes.innerHTML = "";

    if (!lembretes || lembretes.length === 0) {
        mensagemVazia.textContent = "Nenhum lembrete encontrado.";
        mensagemVazia.classList.remove("hidden");

        return;
    }

    mensagemVazia.classList.add("hidden");

    lembretes.forEach(lembrete => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>
                ${lembrete.descricao}
            </td>

            <td>
                ${formatarData(lembrete.dataCadastro)}
            </td>

            <td>
                ${formatarData(lembrete.dataAtualizacao)}
            </td>

            <td>
                <span class="status ${
                    lembrete.isAtivo
                        ? "status-ativo"
                        : "status-inativo"
                }">
                    ${
                        lembrete.isAtivo
                            ? "Ativo"
                            : "Inativo"
                    }
                </span>
            </td>

            <td>
                <div class="actions">

                    <button
                        class="btn btn-edit"
                        onclick="buscarLembrete('${lembrete.id}')">
                        Editar
                    </button>

                    <button
                        class="btn btn-danger"
                        onclick="excluirLembrete('${lembrete.id}')">
                        Excluir
                    </button>

                </div>
            </td>
        `;

        listaLembretes.appendChild(tr);
    });
}


// ========================================
// FORMULÁRIO
// ========================================
btnImprimir.addEventListener("click", () => {
    console.log('click-> imprimir lembretes');
    imprimirLembretes();
});

btnNovo.addEventListener("click", () => {
    abrirFormularioNovo();
});


btnCancelar.addEventListener("click", () => {
    fecharFormulario();
});

formLembrete.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!descricao.value.trim()) {
        descricao.classList.add("campo-invalido");
        descricao.focus();

        mostrarToast("Informe uma descrição.", "aviso");

        return;
    }

    if (lembreteId.value) {
        await atualizarLembrete();
    } else {
        await criarLembrete();
    }
});


function abrirFormularioNovo() {
    lembreteId.value = "";
    descricao.value = "";

    tituloFormulario.textContent = "Novo lembrete";

    formulario.classList.remove("hidden");
    descricao.focus();
}

function fecharFormulario() {
    formulario.classList.add("hidden");
    formLembrete.reset();
    lembreteId.value = "";
    descricao.classList.remove("campo-invalido");
}

descricao.addEventListener("input", () => {
    descricao.classList.remove("campo-invalido");
});

// ========================================
// FILTRO
// ========================================
btnFiltrar.addEventListener("click", () => {
    paginaAtual = 1;
    filtrarLembretes();
});

filtroDescricao.addEventListener("keyup", event => {
    if (event.key === "Enter") {
        paginaAtual = 1;
        filtrarLembretes();
    }
});

// ========================================
// PAGINAÇÃO
// ========================================
btnAnterior.addEventListener("click", () => {
    if (paginaAtual > 1) {
        paginaAtual--;
        filtrarLembretes();
    }
});

btnProximo.addEventListener("click", () => {
    paginaAtual++;
    filtrarLembretes();
});

tamanhoPagina.addEventListener("change", () => {
    paginaAtual = 1;
    filtrarLembretes();
});

botoesOrdenar.forEach(botao => {
    botao.addEventListener("click", () => {
        if (ordemAtual === botao.dataset.ordem) {
            direcaoAtual = direcaoAtual === "ASC" ? "DESC" : "ASC";
        } else {
            ordemAtual = botao.dataset.ordem;
            direcaoAtual = "ASC";
        }

        paginaAtual = 1;
        filtrarLembretes();
    });
});

function atualizarSetasOrdenacao() {
    botoesOrdenar.forEach(botao => {
        const ativo = botao.dataset.ordem === ordemAtual;

        botao.classList.toggle("ativo", ativo);
        botao.querySelector(".seta").textContent = ativo ? (direcaoAtual === "ASC" ? "▲" : "▼") : "";
    });
}


// ========================================
// UTILITÁRIOS
// ========================================
function montarParametros() {
    const params = new URLSearchParams();

    params.append("NumeroPagina", paginaAtual);
    params.append("TamanhoPagina", tamanhoPagina.value);
    params.append("Descricao", filtroDescricao.value);
    params.append("Ordem", ordemAtual);
    params.append("Direcao", direcaoAtual);

    if (filtroDataCadastroInicial.value) {
        params.append("DataCadastroInicial", filtroDataCadastroInicial.value);
    }

    if (filtroDataCadastroFinal.value) {
        params.append("DataCadastroFinal", filtroDataCadastroFinal.value);
    }

    if (filtroDataAtualizacaoInicial.value) {
        params.append("DataAtualizacaoInicial", filtroDataAtualizacaoInicial.value);
    }

    if (filtroDataAtualizacaoFinal.value) {
        params.append("DataAtualizacaoFinal", filtroDataAtualizacaoFinal.value);
    }

    return params;
}

function formatarData(data) {

    if (!data) {
        return "-";
    }

    return new Date(data).toLocaleString(
        "pt-BR"
    );
}


let timeoutToast;

function mostrarToast(mensagem, tipo = "sucesso") {
    const toast = document.getElementById("toast");

    toast.textContent = mensagem;

    toast.className = `toast toast-${tipo}`;

    clearTimeout(timeoutToast);
    timeoutToast = setTimeout(() => { toast.classList.add("hidden"); }, 4000);
}

function mensagemDeErro(error, mensagemPadrao) {
    if (error instanceof TypeError) {
        return "Não foi possível se comunicar com a API. Verifique se ela está em execução.";
    }

    return mensagemPadrao;
}