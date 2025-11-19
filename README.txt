NeuraCare Option C — Face + Text Advanced Project
------------------------------------------------

What's included:
- index.html (UI with animated avatar)
- static/css/style.css
- static/js/main.js (face-api.js integration + avatar animations)
- static/models/ (empty) — you must download models (instructions below)
- app.py (Flask backend for text analysis + history)
- static/history.json (created at runtime)
- README (this file)

Important: face-api.js models are NOT included due to size. Download required model files and place them into static/models/.

Models required (from face-api.js weights repo):
- tiny_face_detector_model-weights_manifest.json and corresponding shard files
- face_expression_model-weights_manifest.json and shard files

Example model source:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Steps to run:
1. Place downloaded model files into static/models/
2. Create virtualenv and install Flask:
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install Flask
3. Run:
   python app.py
4. Open http://127.0.0.1:5000 and click 'Start Camera Scan' (allow camera)

Notes:
- Face detection runs in browser; images are not sent to server.
- If models are missing the app will fallback to text-only analysis.
- For best results, ensure decent front lighting.

