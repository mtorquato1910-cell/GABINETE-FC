@echo off
REM ============================================================
REM Gabinete FC — Start Dev Server
REM
REM IMPORTANTE: Rodar SEMPRE de C:\gfc (junction sem Á no caminho)
REM O Turbopack do Next.js 16 tem um bug com "Á" em "Área de Trabalho"
REM ============================================================

echo [Gabinete FC] Iniciando servidor de desenvolvimento...

REM Verificar se junction existe, criar se necessário
if not exist "C:\gfc" (
    echo [Gabinete FC] Criando junction C:\gfc...
    mklink /J "C:\gfc" "%~dp0"
    if errorlevel 1 (
        echo [ERRO] Falha ao criar junction. Execute como Administrador.
        pause
        exit /b 1
    )
)

cd /d "C:\gfc"
echo [Gabinete FC] Servidor em http://localhost:3000
echo.
npm run dev
