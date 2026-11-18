@echo off
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo Installing npm dependencies...
    npm install
)
echo Starting React Vite Frontend at http://localhost:5173/ ...
npm run dev
