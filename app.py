from flask import Flask, request, jsonify, send_from_directory
import os, json, datetime

app = Flask(__name__, static_folder='static', static_url_path='/static')

DATA_FILE = os.path.join('static', 'history.json')

def analyze_text_rule_based(text):
    t = text.lower()
    tags = []
    suggestions = []
    if any(x in t for x in ['burnout','overwhelmed','tired','exhausted','frustrat']):
        tags.append('Burnout')
        suggestions += ['Take a 5-minute deep breathing break.','Try the 4-7-8 breathing technique.','Schedule a 30-minute rest after current task.']
    if any(x in t for x in ['stress','anx','panic','angry']):
        if 'Stress' not in tags: tags.append('Stress')
        suggestions.append('Do a short grounding exercise (5 mins).')
    if any(x in t for x in ['sad','down','hopeless','depress']):
        if 'Low Mood' not in tags: tags.append('Low Mood')
        suggestions += ['Listen to calming music for 10 minutes.','Reach out to a friend or write a short journal.']
    if not tags:
        tags.append('Positive / Neutral')
        suggestions.append('Maintain your routine and take regular breaks.')
    return {'tags': tags, 'suggestions': suggestions}

def save_history(text,result):
    entry = {'text': text, 'result': result, 'timestamp': datetime.datetime.utcnow().isoformat()+'Z'}
    try:
        arr = []
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE,'r',encoding='utf-8') as f:
                arr = json.load(f)
        arr.append(entry)
        with open(DATA_FILE,'w',encoding='utf-8') as f:
            json.dump(arr,f,indent=2)
    except Exception as e:
        print('history save failed', e)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error':'Invalid request'}),400
    text = data['text']
    result = analyze_text_rule_based(text)
    try: save_history(text,result)
    except: pass
    return jsonify(result)

@app.route('/history', methods=['GET'])
def history():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE,'r',encoding='utf-8') as f:
            return jsonify(json.load(f))
    return jsonify([])

if __name__ == '__main__':
    app.run(debug=True,port=5000)
