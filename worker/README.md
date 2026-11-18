# 1. Ubícate en la carpeta de tu worker/backend
cd worker

# 2. Crea el entorno virtual
python -m venv .venv

# 3. Actívalo (en Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# 4. Instala tus dependencias
pip install -r requirements.txt


# 5. Seleccionar el intérprete de Python correcto en VS Code
Pulsa la combinación de teclas Ctrl + Shift + P (o Cmd + Shift + P en Mac) para abrir la paleta de comandos.

Escribe y selecciona: Python: Select Interpreter (Python: Seleccionar intérprete).

Busca y elige la ruta del entorno virtual que creaste para tu worker (por ejemplo, la que apunta a .\worker\.venv\Scripts\python.exe o la ruta donde tengas tu .venv).