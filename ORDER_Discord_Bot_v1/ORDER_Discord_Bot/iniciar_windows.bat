@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
    echo Criando o ambiente virtual...
    py -3 -m venv .venv
    if errorlevel 1 (
        echo Erro: instale Python 3.11 ou superior e marque Add Python to PATH.
        pause
        exit /b 1
    )
)
".venv\Scripts\python.exe" -c "import discord, dotenv, PIL; assert hasattr(discord.ui, 'FileUpload')" >nul 2>nul
if errorlevel 1 (
    echo Instalando dependencias...
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt
    if errorlevel 1 (
        echo Erro: verifique a conexao com a internet e tente novamente.
        pause
        exit /b 1
    )
)
if not exist ".env" (
    copy .env.example .env >nul
    echo Arquivo .env criado. Cole seu DISCORD_TOKEN antes de iniciar.
    pause
    exit /b 1
)
".venv\Scripts\python.exe" bot.py
pause
