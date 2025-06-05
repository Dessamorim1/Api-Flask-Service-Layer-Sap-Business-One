print("Importando waitress...")
from waitress import serve
print("Importando app...")
from app import app 
print("Tudo importado com sucesso!")

if __name__ == '__main__':
    print("Iniciando o servidor com Waitress...")
    serve(app, host='0.0.0.0', port=5000)
