import os
import requests
import urllib3
from dotenv import load_dotenv
from typing import Optional, Dict, List

load_dotenv()

class SAPServiceLayer:
    def __init__(self):
        self.base_url = os.getenv("SAP_BASE_URL")
        self.username = os.getenv("SAP_USERNAME")
        self.password = os.getenv("SAP_PASSWORD")
        self.company_db = os.getenv("SAP_COMPANY_DB")
        self.verify_ssl = os.getenv("SSL_VERIFY", "true").lower() == "true"

        if not self.verify_ssl:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        self.session = requests.Session()
        self.session.verify = self.verify_ssl
        self.session.headers.update({"Content-Type": "application/json"})

    def login(self) -> bool:
        payload = {
            "CompanyDB": self.company_db,
            "UserName": self.username,
            "Password": self.password
        }
        try:
            response = self.session.post(f"{self.base_url}/Login", json=payload)
            response.raise_for_status()
            print("✅ Login realizado com sucesso!")
            return True
        except requests.RequestException as e:
            print(f"❌ Falha no login: {e}")
            if e.response is not None:
                print(f"Detalhes: {e.response.text}")
            return False

    def logout(self):
        try:
            self.session.post(f"{self.base_url}/Logout")
            print("Logout realizado.")
        except requests.RequestException as e:
            print(f"Falha ao fazer logout: {e}")

    def get_endpoint(self, endpoint: str) -> Optional[List[Dict]]:
        resultados = []
        next_link = None

        while True:
            url = (
                f"{self.base_url}/{endpoint}" if not next_link
                else (next_link if next_link.startswith("http")
                      else f"{self.base_url}/{next_link.lstrip('/')}")
            )

            try:
                response = self.session.get(url)
                response.raise_for_status()
                try:
                    data = response.json()
                except ValueError:
                    print("Resposta não contém JSON válido.")
                    return []

                if isinstance(data, dict) and "value" in data:
                    resultados.extend(data["value"])
                    next_link = data.get("odata.nextLink")
                    if not next_link:
                        break
                elif isinstance(data, dict):
                    return [data]
                elif isinstance(data, list):
                    return data
                else:
                    print("Resposta inesperada do SAP:", data)
                    return []

            except requests.RequestException as e:
                print(f"Erro na requisição: {e}")
                if e.response is not None:
                    print(f"Detalhes: {e.response.text}")
                return None

        return resultados

    def patch_endpoint(self, endpoint: str, payload: Dict) -> bool:
        try:
            response = self.session.patch(f"{self.base_url}/{endpoint}", json=payload)
            response.raise_for_status()
            print(f"PATCH realizado com sucesso em {endpoint}")
            return True
        except requests.RequestException as e:
            print(f"Erro no PATCH para {endpoint}: {e}")
            if e.response is not None:
                print(f"Resposta do SAP: {e.response.text}")
            return False
    
        
    def post_endpoint(self, endpoint: str, payload:Dict):
        try:
            response = self.session.post(f"{self.base_url}/{endpoint}" , json=payload)
            response.raise_for_status()
            print(f"POST realizado com sucesso em {endpoint}")
            return True
        except requests.RequestException as e:
            print(f"Erro ao adicionar novo concorrente {e.response.text}")
            return False
        

    def atualizar_oportunidade(self, sequence_no: int, concorrentes: List[Dict]) -> bool:
        payload = {
            "SalesOpportunitiesCompetition": concorrentes
        }
        endpoint = f"SalesOpportunities({sequence_no})"
        return self.patch_endpoint(endpoint, payload)
    

    def buscar_oportunidade_por_seq(self, sequence_no: int) -> Optional[Dict]:
        resultados = self.get_endpoint(f"SalesOpportunities?$filter=SequentialNo eq {sequence_no}")
        return resultados[0] if resultados else None

    

    def listar_concorrentes_cadastrados(self) -> List[Dict]:
        all_concorrentes = []
        next_link = None
        endpoint = "SalesOpportunityCompetitorsSetup"

        while True:
            url = f"{self.base_url}/{endpoint}" if not next_link else (
                next_link if next_link.startswith("http")
                else f"{self.base_url}/{next_link.lstrip('/')}"
            )

            try:
                response = self.session.get(url)
                response.raise_for_status()
                data = response.json()
            except requests.RequestException as e:
                print(f"Erro ao buscar concorrentes: {e}")
                return []

            all_concorrentes.extend(data.get('value', []))
            next_link = data.get('odata.nextLink', None)

            if not next_link:
                break

        return [{"SequenceNo": c.get("SequenceNo"), "Name": c.get("Name")} for c in all_concorrentes]
    

    def __enter__(self):
        if not self.login():
            raise ConnectionError("Erro ao conectar no SAP Service Layer.")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.logout()
