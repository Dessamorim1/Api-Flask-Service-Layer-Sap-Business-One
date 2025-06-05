
let concorrentesCadastrados = [];
let concorrentesAtuais = [];
let modificacoesPendentes = false;
let seqAtual = "";
let seqNoAtual = null;


function enviarConcorrente() {
    if (!seqAtual) {
        alert("Você precisa buscar uma oportunidade primeiro.");
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
            alert(data.mensagem || "Concorrente adicionado!");
            buscarOportunidade();
        })
        .catch(err => {
            alert("Erro ao adicionar concorrente: " + err.message);
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
            erro.textContent = err.message;
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

function marcarModificado() {
    if (!modificacoesPendentes) {
        modificacoesPendentes = true;
        document.getElementById("btnSalvar").style.display = "inline-block";
    }
    const campo = event.target;
    campo.classList.add("modificado");
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
   
    if (!nome) {
        alert("Informe o nome do concorrente");
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
            alert("Concorrente adicionado com sucesso!");
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





