#!/usr/bin/env python3
"""
Script de instalação para o sistema Python de gestão de suprimentos
Instala dependências e configura o ambiente
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Instalar dependências do requirements.txt"""
    try:
        print("📦 Instalando dependências Python...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        print("✅ Dependências instaladas com sucesso!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao instalar dependências: {e}")
        return False

def create_directories():
    """Criar diretórios necessários"""
    directories = [
        "data",
        "logs", 
        "exports",
        "backups",
        "models"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"📁 Diretório criado: {directory}")

def check_python_version():
    """Verificar versão do Python"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ é necessário")
        return False
    print(f"✅ Python {sys.version} detectado")
    return True

def main():
    """Função principal de instalação"""
    print("🚀 Iniciando instalação do sistema Python...")
    
    if not check_python_version():
        sys.exit(1)
    
    create_directories()
    
    if not install_requirements():
        sys.exit(1)
    
    print("\n🎉 Instalação concluída com sucesso!")
    print("Para iniciar o servidor Python:")
    print("  python main.py")
    print("\nOu para desenvolvimento:")
    print("  uvicorn main:app --reload --host 0.0.0.0 --port 8001")

if __name__ == "__main__":
    main()