"""Generate a Zelo visual slide with GPT Image; never logs the API key."""
from __future__ import annotations

import base64
import json
import os
import sys
from pathlib import Path

import requests

ENV_PATH = Path('/root/.hermes/.env')
OUTPUT = Path('/root/.hermes/artifacts/zelo-gpt-image/cover.png')
LOGO = Path('/root/projects/nr1-saas/public/logo-zelo-3.png')
SCREENS = Path('/root/projects/nr1-saas/public/telas-zelo.png')

PROMPT = '''Create one polished 3:2 LANDSCAPE presentation cover for the Brazilian SaaS brand ZELO.
Use the supplied transparent ZELO logo EXACTLY as provided, without redrawing it, at the upper left with generous whitespace. Use the supplied real Zelo dashboard screenshot inside an elegant white, rounded, floating desktop-panel frame on the RIGHT, keeping its visible interface intact.

Art direction: premium modern Brazilian B2B technology editorial design, as refined as a top-tier product keynote. Authentic ZELO palette: very light aqua #F0FBFC transitioning to white; deep navy #0E2A47 for typography; a restrained teal-to-blue #17C3C9 to #3F7DE0 accent. Subtle soft gradients and a few translucent organic curves; clean white space; NO clip art, NO emojis, NO generic people, NO fake UI, NO cards grid.

On the LEFT, render ONLY this Portuguese text, exactly and with clear typographic hierarchy:
NR-1, com clareza.
Diagnóstico, documentos e plano de ação para sua empresa.

Do not add any other readable text, pricing, labels, watermarks, extra logos, or misspelled content. The slide must be presentation-ready and visually restrained.'''


def env_value(name: str) -> str | None:
    for raw in ENV_PATH.read_text(encoding='utf-8').splitlines():
        if raw.startswith(name + '='):
            return raw.split('=', 1)[1].strip().strip('"').strip("'")
    return None


def main() -> None:
    key = env_value('OPENAI_API_KEY')
    if not key:
        raise SystemExit('OPENAI_API_KEY unavailable')
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with LOGO.open('rb') as logo, SCREENS.open('rb') as screens:
        response = requests.post(
            'https://api.openai.com/v1/images/edits',
            headers={'Authorization': f'Bearer {key}'},
            data={'model': 'gpt-image-1', 'prompt': PROMPT, 'size': '1536x1024', 'quality': 'high', 'output_format': 'png'},
            files=[('image[]', ('zelo-logo.png', logo, 'image/png')), ('image[]', ('zelo-screens.png', screens, 'image/png'))],
            timeout=300,
        )
    if response.status_code != 200:
        print(json.dumps({'status': response.status_code, 'error': response.text[:500]}))
        raise SystemExit(1)
    payload = response.json()
    image = payload['data'][0]['b64_json']
    OUTPUT.write_bytes(base64.b64decode(image))
    print(json.dumps({'created': str(OUTPUT), 'bytes': OUTPUT.stat().st_size}))


if __name__ == '__main__':
    main()
