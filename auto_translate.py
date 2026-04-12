import json
import urllib.request
import urllib.parse
import time
import os
import re

TARGET_LOCALES = ["ar", "ru", "es", "zh", "fr", "de", "ro"]
EN_JSON_PATH = "messages/en.json"

def translate_batch(texts, tl):
    if not texts:
        return []
    
    # Use a unique delimiter that Google Translate usually respects
    separator = " \n\n###\n\n "
    query = separator.join(texts)
    
    # URL encode
    encoded_query = urllib.parse.quote(query)
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={tl}&dt=t&q={encoded_query}"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            
        # The result[0] contains the translated segments
        translated_text = "".join([segment[0] for segment in result[0] if segment[0]])
        
        # Split back
        translated_parts = translated_text.split("###")
        
        # Clean up whitespace
        translated_parts = [p.strip() for p in translated_parts]
        
        # If lengths don't match, fallback to single translation (rate limit/parsing issue)
        if len(translated_parts) != len(texts):
            print(f"[{tl}] Bulk length mismatch ({len(translated_parts)} vs {len(texts)}), falling back to individual translation...")
            return [translate_single(t, tl) for t in texts]
            
        return translated_parts
    except Exception as e:
        print(f"[{tl}] Bulk error: {e}, falling back to individual translation...")
        return [translate_single(t, tl) for t in texts]

def translate_single(text, tl):
    encoded = urllib.parse.quote(text)
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={tl}&dt=t&q={encoded}"
    try:
        time.sleep(0.3) # Avoid ban
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
        translated = "".join([segment[0] for segment in result[0] if segment[0]])
        return translated.strip()
    except Exception as e:
        print(f"Error on {text} -> {tl}: {e}")
        return text

def extract_strings(obj, keys_path, registry):
    for k, v in obj.items():
        current_path = keys_path + [k]
        if isinstance(v, dict):
            extract_strings(v, current_path, registry)
        elif isinstance(v, str):
            registry.append((current_path, v))

def inject_strings(obj, keys_path, translated_value):
    current = obj
    for k in keys_path[:-1]:
        current = current[k]
    current[keys_path[-1]] = translated_value

def sanitize_variables(text):
    # Ensure things like { amount } become {amount}
    text = re.sub(r'\{\s+([a-zA-Z_]+)\s+\}', r'{\1}', text)
    # Also if it translated the word inside, like {Miktar}, revert it... 
    # Actually, Google Translate might translate 'amount' to Russian inside {amount}.
    # We will just accept it for now and hope NextIntl ignores missing vars if text doesn't use them,
    # or NextIntl crashes if variable name changes.
    # A safe trick: replace {amount} with <var_amount_var> before translation, then revert.
    return text

def safe_translate_text(text, tl):
    # Protect vars like {amount}
    var_map = {}
    matches = re.finditer(r'\{([a-zA-Z_]+)\}', text)
    temp_text = text
    for i, m in enumerate(matches):
        placeholder = f"VARXX{i}XXVAR"
        var_map[placeholder] = f"{{{m.group(1)}}}"
        temp_text = temp_text.replace(m.group(0), placeholder)
        
    return temp_text, var_map

def run():
    print("Loading en.json...")
    with open(EN_JSON_PATH, "r", encoding="utf-8") as f:
        en_data = json.load(f)
        
    registry = []
    extract_strings(en_data, [], registry)
    print(f"Found {len(registry)} phrases to translate.")
    
    for tl in TARGET_LOCALES:
        if tl == "zh":
            api_tl = "zh-CN"
        else:
            api_tl = tl
            
        print(f"Translating for {tl}...")
        
        # Prepare texts
        texts_to_translate = []
        var_maps = []
        for path, text in registry:
            t_text, v_map = safe_translate_text(text, api_tl)
            texts_to_translate.append(t_text)
            var_maps.append(v_map)
            
        # Batch size of 20
        translated_results = []
        batch_size = 30
        for i in range(0, len(texts_to_translate), batch_size):
            batch = texts_to_translate[i:i+batch_size]
            t_batch = translate_batch(batch, api_tl)
            translated_results.extend(t_batch)
            time.sleep(1) # delay between batches
            
        # Reconstruct dict
        # Deep copy en.json
        import copy
        new_data = copy.deepcopy(en_data)
        
        for idx, (path, orig_text) in enumerate(registry):
            if idx < len(translated_results):
                t_val = translated_results[idx]
                # Re-inject protected vars
                for placeholder, orig_var in var_maps[idx].items():
                    t_val = t_val.replace(placeholder, orig_var)
                inject_strings(new_data, path, t_val)
                
        # Save
        out_path = f"messages/{tl}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(new_data, f, ensure_ascii=False, indent=2)
        print(f"Saved {out_path}")

if __name__ == "__main__":
    run()
