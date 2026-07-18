@echo off
echo Starting MediBot Server...
start cmd /k "cd server && node index.js"

echo Starting MediBot Client...
start cmd /k "cd client && npm run dev"

echo Both Server and Client are starting in separate windows!
echo Please wait a few seconds, then open http://localhost:5173 in your browser.
pause
