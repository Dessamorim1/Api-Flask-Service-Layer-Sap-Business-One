
let concorrentesCadastrados = [];
let concorrentesAtuais = [];
let modificacoesPendentes = false;
let seqAtual = "";
let seqNoAtual = null;

window.onload = function () {
    fetch('/api/competitors')
        .then(res => res.json())
        .then(lista => {
            concorrentesCadastrados = lista;

            // Preencher o select de entrada (form de adicionar concorrente)
            const select = document.getElementById("concorrente");
            select.innerHTML = '<option value="">Selecione</option>';
            lista.forEach(c => {
                const option = document.createElement("option");
                option.value = c.SequenceNo;
                option.text = c.Name;
                select.appendChild(option);
            });
            const optNovo = document.createElement("option");
            optNovo.value = "novo";
            optNovo.text = " Definir Novo";

            select.appendChild(optNovo);


            // Adicionar listener para detectar seleção da opção “novo”
            select.addEventListener("change", function () {
                if (this.value === "novo") {
                    this.value = "";  // Reseta a seleção
                    abrirModal();     // Abre o modal     
                }

            });



        });
};

function enviarConcorrente() {
    const btn = document.getElementById("btnadd");
    btn.disabled = true;

    if (!seqAtual) {
        Swal.fire({
            icon: 'info',
            title: 'Nenhuma oportunidade selecionada',
            text: 'Você precisa buscar uma oportunidade primeiro.',
            confirmButtonText: 'Fechar',
            customClass: {
                popup: 'meu-alerta-popup',
                title: 'meu-alerta-titulo',
                confirmButton: 'meu-alerta-botao',
            }
        });
        btn.disabled = false;
        return;
    }

    const status = document.getElementById("status").value.trim().toLowerCase();
    if (status === 'ganhou' || status === 'perdeu') {
        Swal.fire({
            icon: 'error',
            title: 'Oportunidade Fechada',
            text: 'Não podem ser adicionados novos concorrentes!',
            confirmButtonText: 'Fechar',
            customClass: {
                popup: 'meu-alerta-popup',
                title: 'meu-alerta-titulo',
                confirmButton: 'meu-alerta-botao',
            }
        });
        btn.disabled = false;
        return;
    }

    const concorrenteVal = document.getElementById("concorrente").value.trim();
    const threatLevelVal = document.getElementById("grau").value.trim();

    if (!concorrenteVal) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo concorrente obrigatório',
            text: 'Por favor, selecione um concorrente.',
            confirmButtonText: 'Fechar',
            customClass: {
                popup: 'meu-alerta-popup',
                title: 'meu-alerta-titulo',
                confirmButton: 'meu-alerta-botao',
            }
        });
        btn.disabled = false;
        return;
    }

    if (!threatLevelVal) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo Ameaça obrigatório',
            text: 'Por favor, selecione o grau de ameaça.',
            confirmButtonText: 'Fechar',
            customClass: {
                popup: 'meu-alerta-popup',
                title: 'meu-alerta-titulo',
                confirmButton: 'meu-alerta-botao',
            }
        });
        btn.disabled = false;
        return;
    }

    const concorrente = {
        Competition: document.getElementById("concorrente").value.trim(),
        ThreatLevel: document.getElementById("grau").value.trim(),
        U_Marca: document.getElementById("marca").value.trim(),
        U_Modelo: document.getElementById("modelo").value.trim(),
        U_Quantidade: Number(document.getElementById("quantidade").value),
        U_ValorUnit: Number(document.getElementById("valorUnit").value),
        U_ValorTot: Number(document.getElementById("valorTot").value),
        Details: document.getElementById("obs").value.trim()
    };

    fetch(`/api/concorrentes/${seqAtual}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novoConcorrente: concorrente })
    })
        .then(res => res.json())
        .then(data => {
            Swal.fire({
                icon: 'success',
                title: 'Concorrente adicionado',
                text: data.mensagem || 'Concorrente foi adicionado com sucesso!',
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'meu-alerta-popup',
                    title: 'meu-alerta-titulo',
                    confirmButton: 'meu-alerta-botao',
                }
            }).then(() => {
                modificacoesPendentes = true;   
                limparCamposConcorrente();
                buscarOportunidade();
                btn.disabled = false;// Executa após o usuário clicar em OK
            });
        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Erro ao adicionar concorrente',
                text: err.message,
                confirmButtonText: 'Fechar',
                customClass: {
                    popup: 'meu-alerta-popup',
                    title: 'meu-alerta-titulo',
                    confirmButton: 'meu-alerta-botao',
                }

            });
            btn.disabled = false;
        });
}


function buscarOportunidade() {
    const seq_no = document.getElementById("op").value;
    const erro = document.getElementById("erro");
    erro.textContent = "";
    seqAtual = seq_no;
    modificacoesPendentes = false;


    fetch(`/api/oportunidade?seq_no=${encodeURIComponent(seq_no)}`)
        .then(res => {
            if (!res.ok) return res.json().then(err => { throw new Error(err.erro); });
            return res.json();
        })
        .then(data => {
            document.getElementById("cod").value = data.CardCode || "";
            document.getElementById("cliente").value = data.CustomerName || "";
            document.getElementById("nomeopor").value = data.OpportunityName || "";
            document.getElementById("dataaber").value = data.StartDate || "";
            document.getElementById("fechamento").value = data.PredictedClosingDate || "";
            document.getElementById("valor").value = data.MaxLocalTotal || "";
            document.getElementById("vendedor").value = data.SalesEmployeeName || "";
            document.getElementById("status").value = data.Status || "";
            atualizarCorStatus();


            concorrentesAtuais = data.SalesOpportunitiesCompetition || [];
            preencherConcorrentes(concorrentesAtuais);

            seqNoAtual = seq_no;


        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Erro ao buscar oportunidade',
                text: err.message || 'Erro desconhecido ao buscar oportunidade!',
                confirmButtonText: 'Fechar',
                customClass: {
                    popup: 'meu-alerta-popup',
                    title: 'meu-alerta-titulo',
                    confirmButton: 'meu-alerta-botao',
                }
            });

            // Limpa os campos se houver erro
            document.querySelectorAll("input[disabled]").forEach(el => el.value = "");
            preencherConcorrentes([]);
        });
}

function preencherConcorrentes(lista) {
    const linhas = document.querySelectorAll(".concorrentes-grid div input, .concorrentes-grid div select");

    for (let i = 0; i < linhas.length; i += 9) {
        const camposLinha = Array.from(linhas).slice(i, i + 9);

        camposLinha[1].innerHTML = '<option value="">Selecione</option>';
        camposLinha[2].innerHTML = '<option value="">Selecione</option><option value="Baixo">Baixo</option><option value="Médio">Médio</option><option value="Alto">Alto</option>';
        for (let j = 3; j <= 8; j++) {
            camposLinha[j].value = "";
        }
    }

    const total = lista.length;


    for (let i = 0; i < total; i++) {
        const c = lista[i] || {};
        const campos = Array.from(linhas).slice(i * 9, (i + 1) * 9);
        if (campos.length < 9) break;
        campos[0].value = i + 1;
        const select = campos[1]; // o campo "concorrente" da linha
        select.innerHTML = '';
        concorrentesCadastrados.forEach(cOpt => {
            const opt = document.createElement("option");
            opt.value = cOpt.SequenceNo;
            opt.text = cOpt.Name;
            select.appendChild(opt);
        });


        select.value = c.Competition || "";
        const grauSelect = campos[2];
        switch (c.ThreatLevel) {
            case 'tlLow': grauSelect.value = "Baixo"; break;
            case 'tlMedium': grauSelect.value = "Médio"; break;
            case 'tlHigh': grauSelect.value = "Alto"; break;
            default: grauSelect.value = "";

        }

        campos[3].value = c.U_Marca || '';
        campos[4].value = c.U_Modelo || '';
        campos[5].value = c.U_Quantidade || '';
        campos[6].value = c.U_ValorUnit || '';
        campos[7].value = c.U_ValorTot || '';
        campos[8].value = c.Details || '';
    }

}

// Função para atualizar as informações da oportunidade
function atualizarOportunidade(data) {
    document.getElementById('cardcode').textContent = data.CardCode || "N/A";
    document.getElementById('customername').textContent = data.CustomerName || "N/A";
    document.getElementById('opportunityname').textContent = data.OpportunityName || "N/A";
    document.getElementById('salespersonname').textContent = data.SalesEmployeeName || "Desconhecido";
    document.getElementById('status').textContent = data.Status || "N/A";
}



function abrirModal() {
    document.getElementById("modalConcorrente").style.display = "block";
}


function fecharModal() {
    document.getElementById("modalConcorrente").style.display = "none";
}

function salvarNovoConcorrente() {
    const nome = document.getElementById("nomeCompetidor").value.trim();
    const nomeDigitado = nome.toLowerCase();

    const selectConcorrente = document.getElementById("concorrente");
    let nomeExiste = false;

    for (let option of selectConcorrente.options) {
        if (option.text.trim().toLowerCase() === nomeDigitado) {
            nomeExiste = true;
            break;
        }
    }

    if (nomeExiste) {
        Swal.fire({
            icon: 'info',
            title: 'Concorrente já cadastrado',
            text: 'Este nome de concorrente já existe, tente um novo.',
            confirmButtonText: 'Fechar',
            customClass: {
                popup: 'meu-alerta-popup',
                title: 'meu-alerta-titulo',
                confirmButton: 'meu-alerta-botao',
            }
        });
        return;

    }
    if (!nome) {
        Swal.fire({
            icon: 'error',
            title: 'Nome do Concorrente não informado',
            text: 'Você precisa informar um nome válido.',
            confirmButtonText: 'Fechar',
            customClass: {
                popup: 'meu-alerta-popup',
                title: 'meu-alerta-titulo',
                confirmButton: 'meu-alerta-botao',
            }
        });
        return;
    }

    fetch('/api/competitorsNome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novoConcorrenteNome: { Name: nome, } })
    })
        .then(res => {
            if (!res.ok) throw new Error("Erro ao criar concorrente");
            return res.json();
        })
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Concorrente adicionado com Sucesso',
                text: 'Você já pode usar o novo concorrente cadastrado.',
                confirmButtonText: 'Fechar',
                customClass: {
                    popup: 'meu-alerta-popup',
                    title: 'meu-alerta-titulo',
                    confirmButton: 'meu-alerta-botao',
                }
            });
            document.getElementById("nomeCompetidor").value = "";
            fecharModal();

            return fetch('/api/competitors');
        })
        .then(res => res.json())

        .then(lista => {
            concorrentesCadastrados = lista;
            document.querySelectorAll(".concorrente-select").forEach(select => {
                select.innerHTML = '<option value="">Selecione</option>';
                lista.forEach(c => {
                    const option = document.createElement("option");
                    option.value = c.SequenceNo;
                    option.text = c.Name;
                    select.appendChild(option);
                });
                const optNovo = document.createElement("option");
                optNovo.value = "novo";
                optNovo.text = " Criar novo concorrente";
                select.appendChild(optNovo);
            });



            const select = document.getElementById("concorrente");
            if (select) {
                select.innerHTML = '<option value="">Selecione</option>';
                lista.forEach(c => {
                    const option = document.createElement("option");
                    option.value = c.SequenceNo;
                    option.text = c.Name;
                    select.appendChild(option);
                });
            }
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao adicionar concorrente");
        });
}


function atualizarCorStatus() {
    const input = document.getElementById('status');
    const valor = input.value.trim().toLowerCase();

    input.classList.remove('ganhou', 'perdeu');

    if (valor === 'ganhou') {
        input.classList.add('ganhou');
    } else if (valor === 'perdeu') {
        input.classList.add('perdeu');
    }
}

function limparCamposConcorrente() {
    document.getElementById("concorrente").value = "";
    document.getElementById("grau").value = "";
    document.getElementById("marca").value = "";
    document.getElementById("modelo").value = "";
    document.getElementById("quantidade").value = "";
    document.getElementById("valorUnit").value = "";
    document.getElementById("valorTot").value = "";
    document.getElementById("obs").value = "";
}




