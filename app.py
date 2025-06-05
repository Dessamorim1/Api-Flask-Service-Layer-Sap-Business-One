from flask import Flask, render_template, request, jsonify
from service_layer import SAPServiceLayer  
import requests


app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/oportunidade')
def buscar_oportunidade():
    seq_no = request.args.get('seq_no')
    if not seq_no or not seq_no.isdigit():
        return jsonify({'erro': 'Número inválido'}), 400

    with SAPServiceLayer() as sap:
        oportunidade = sap.buscar_oportunidade_por_seq(int(seq_no))
        if not oportunidade:
            return jsonify({'erro': 'Oportunidade não encontrada'}), 404

        vendedor_info = sap.get_endpoint(f"SalesPersons?$filter=SalesEmployeeCode eq {oportunidade['SalesPerson']}")
        nome_vendedor = vendedor_info[0]["SalesEmployeeName"] if vendedor_info else "Desconhecido"

        concorrentes_cadastrados = sap.listar_concorrentes_cadastrados()
        mapa_concorrentes = {str(c["SequenceNo"]): c["Name"] for c in concorrentes_cadastrados}

        for c in oportunidade.get("SalesOpportunitiesCompetition", []):
            codigo_concorrente = str(c.get("Competition", "")).strip()
            c["CompetitorName"] = mapa_concorrentes.get(codigo_concorrente, "Desconhecido")

        status_legivel = {
            "sos_Missed": "Perdeu",
            "sos_Sold": "Ganhou", 
            "sos_Open": "Em aberto",
            "sos_Closed": "Fechado"
        }.get(oportunidade.get("Status", ""), "nulo")

        return jsonify({
            "CardCode": oportunidade.get("CardCode", ""),
            "CustomerName": oportunidade.get("CustomerName", ""),
            "OpportunityName": oportunidade.get("OpportunityName", ""),
            "StartDate": oportunidade.get("StartDate", ""),
            "SalesEmployeeName": nome_vendedor,
            "Status": status_legivel,
            "PredictedClosingDate": oportunidade.get("PredictedClosingDate", ""),
            "MaxLocalTotal": oportunidade.get("MaxLocalTotal", 0),
            "SalesOpportunitiesCompetition": oportunidade.get("SalesOpportunitiesCompetition", [])
        })
    

@app.route('/api/competitorsNome', methods=['POST'])
def criar_nome_concorrente():
    dados = request.get_json()
    novo = dados.get("novoConcorrenteNome")
    if not isinstance(novo, dict):
        return jsonify({'erro': 'Dados inválidos'}), 400

    with SAPServiceLayer() as sap:
        concorrentes = sap.listar_concorrentes_cadastrados()
        maiores_no = [c.get("SequenceNo", 0) for c in concorrentes if isinstance(c.get("SequenceNo"), int)]
        proximo_sequence = max(maiores_no, default=0) + 1
        novo["SequenceNo"] = proximo_sequence

        response = sap.post_endpoint("SalesOpportunityCompetitorsSetup", novo)
        if response is not None:
               return jsonify({'mensagem': 'Concorrente criado com sucesso'}), 200
        else:
               return jsonify({'erro': 'Erro ao criar concorrente'}), 500
        

@app.route('/api/concorrentes/<int:seq_no>', methods=['POST'])
def adicionar_concorrente(seq_no):
    dados = request.get_json()
    novo = dados.get("novoConcorrente")
    if not isinstance(novo, dict):
        return jsonify({'erro': 'Dados inválidos'}), 400

    with SAPServiceLayer() as sap:
        oportunidade = sap.buscar_oportunidade_por_seq(seq_no)
        if not oportunidade:
            return jsonify({'erro': 'Oportunidade não encontrada'}), 404

        concorrentes = oportunidade.get("SalesOpportunitiesCompetition", [])
        novo["RowNo"] = len(concorrentes) + 1
        concorrentes.append(novo)
        sucesso = sap.atualizar_oportunidade(seq_no, concorrentes)
        if sucesso:
            return jsonify({'mensagem': 'Concorrente adicionado com sucesso'}), 200
        else:
            return jsonify({'erro': 'Erro ao atualizar concorrentes'}), 500
      

@app.route('/api/competitors')
def listar_competitors():
    with SAPServiceLayer() as sap:
        concorrentes = sap.listar_concorrentes_cadastrados()
        if concorrentes is not None:
            return jsonify(concorrentes)
        else:
            return jsonify({"erro": "Erro ao buscar concorrentes"}), 500
   

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)

