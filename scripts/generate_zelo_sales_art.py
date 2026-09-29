"""Create text-free editorial artwork for the Zelo sales deck with GPT Image."""
from __future__ import annotations
import base64, json
from pathlib import Path
import requests

ENV=Path('/root/.hermes/.env')
OUT=Path('/root/.hermes/artifacts/zelo-gpt-image/sales-art')
COMMON='''For a premium Brazilian B2B sales presentation. No text, no letters, no numbers, no logos, no buttons, no UI widgets, no people, no watermark. Use only deep navy #0E2A47, electric teal #17C3C9, cobalt #3F7DE0, soft aqua #F0FBFC and white. Elegant, quiet, high-end editorial art; cinematic lighting; substantial whitespace for presentation copy; 3:2 landscape.'''
PROMPTS={
'cover': COMMON+''' Composition weighted to the RIGHT: a sculptural translucent glass ribbon emerging from navy shadows into a soft aqua field, with subtle flowing layered shapes suggesting clarity, signal and guidance. The LEFT 45% must remain calm, pale and open for title text.''',
'law': COMMON+''' A sophisticated dark-navy abstract composition: a translucent layered topographic field, ordered grid lines and soft teal light paths, suggesting regulation, structure and evidence. Keep the upper left and central left open and dark for white presentation copy.''',
'journey': COMMON+''' A refined luminous pathway of five subtle connected light points moving from lower left to upper right through a deep navy space, suggesting a guided operational journey. Keep broad dark empty space for presentation copy; no literal numerals or arrows.''',
'price': COMMON+''' An airy near-white and pale aqua editorial background with a single translucent teal-blue glass prism positioned at the far right edge, suggesting value and clarity. Keep almost all of the left and center clean for presentation copy.''',
}

def key():
    for line in ENV.read_text().splitlines():
        if line.startswith('OPENAI_API_KEY='):
            return line.split('=',1)[1].strip().strip('"').strip("'")
    raise RuntimeError('No OpenAI key')

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    for name,prompt in PROMPTS.items():
        r=requests.post('https://api.openai.com/v1/images/generations',headers={'Authorization':f'Bearer {key()}','Content-Type':'application/json'},json={'model':'gpt-image-1','prompt':prompt,'size':'1536x1024','quality':'high','output_format':'png'},timeout=300)
        if r.status_code != 200:
            print(json.dumps({'name':name,'status':r.status_code,'error':r.text[:500]}));raise SystemExit(1)
        path=OUT/f'{name}.png'
        path.write_bytes(base64.b64decode(r.json()['data'][0]['b64_json']))
        print(json.dumps({'name':name,'file':str(path),'bytes':path.stat().st_size}))
if __name__=='__main__':main()
