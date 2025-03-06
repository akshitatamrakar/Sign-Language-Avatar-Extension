from flask import Flask, jsonify
from flask_cors import CORS
import os
import json
import re

app = Flask(__name__)
CORS(app)
json_cache = {}

def load_json_files():
    folder_path = "/home/akshattamrakar/Desktop/sign-language-avatar-extension/server/sign_jsons"
    
    if not os.path.exists(folder_path):
        print(f"Error: {folder_path} does not exist!")
        return
    
    loaded_count = 0
    failed_count = 0
    
    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.json'):
            file_path = os.path.join(folder_path, filename)
            try:
                word = os.path.splitext(filename)[0].lower()
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    json_data = json.load(f)
                
                json_cache[word] = json_data
                loaded_count += 1
            
            except Exception as e:
                print(f"Failed to load {filename}: {e}")
                failed_count += 1
    
    print(f"JSON Loading Complete: {loaded_count} files loaded, {failed_count} files failed")

def process_sentence(sentence):
    cleaned = re.sub(r'[^a-zA-Z\s]', '', sentence.lower())
    
    words = [word for word in cleaned.split() if word]
    
    return words

@app.route('/')
def home():
    return f"Sign JSON Server is running. Cached {len(json_cache)} words."

@app.route('/getSignJson/<sentence>')
def get_sign_json(sentence):
    words = process_sentence(sentence)
    
    matching_jsons = {}
    for word in words:
        if word in json_cache:
            matching_jsons[word] = json_cache[word]
    
    response = {
        "input_words": words,
        "found_matches": list(matching_jsons.keys()),
        "json_data": matching_jsons
    }
    
    return jsonify(response)

if __name__ == '__main__':
    load_json_files()
    
    app.run(debug=True, host='0.0.0.0', port=5000)