"""
Translation server — Meta's NLLB-200 distilled-600M.

Mirrors the subset of the LibreTranslate JSON API the app needs, so it's
a drop-in replacement: set LIBRETRANSLATE_URL to this server's address.

NLLB-200 is one model that handles both EN<->JA (and 200+ other pairs).
~1.3 GB on disk after download. CPU inference works but is ~2-5s per
sentence on a modern laptop — acceptable for an interactive translator.

The previous version of this script used Helsinki-NLP/opus-mt-en-jap
(stale 2019 model, mangled outputs) and then staka/fugumt-en-ja (newer
but drops proper nouns like "Mount Fuji" → just "山"). Both were inferior
to NLLB-200 on the QA corpus.

Usage:
    py scripts/opus_mt_server.py           # binds 127.0.0.1:5001
    py scripts/opus_mt_server.py --port 5002

Endpoints:
    GET  /            healthcheck
    GET  /languages   list of {code, name, targets} matching LibreTranslate's shape
    POST /translate   { q, source, target, format? } -> { translatedText }

License: this script is part of this repo. NLLB-200 is CC-BY-NC 4.0.
For commercial use, swap MODEL_NAME for an Apache-2.0 alternative
(e.g. staka/fugumt-* or Helsinki-NLP/opus-mt-* — see git history).
"""

from __future__ import annotations

import argparse
import logging
from contextlib import asynccontextmanager
from typing import Literal

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("nllb")

MODEL_NAME = "facebook/nllb-200-distilled-600M"

# NLLB uses BCP-47-ish "<iso639-3>_<script>" language codes.
LANG_CODE = {
    "en": "eng_Latn",
    "ja": "jpn_Jpan",
}

# Populated by lifespan startup.
_tokenizer: AutoTokenizer | None = None
_model: AutoModelForSeq2SeqLM | None = None


def _translate(text: str, source: str, target: str) -> str:
    assert _tokenizer is not None and _model is not None
    src = LANG_CODE.get(source)
    tgt = LANG_CODE.get(target)
    if not src or not tgt:
        raise HTTPException(status_code=400, detail=f"Unsupported language pair: {source}->{target}")

    _tokenizer.src_lang = src
    inputs = _tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    forced_bos = _tokenizer.convert_tokens_to_ids(tgt)
    out = _model.generate(
        **inputs,
        forced_bos_token_id=forced_bos,
        max_length=512,
        num_beams=5,
        no_repeat_ngram_size=3,
    )
    return _tokenizer.batch_decode(out, skip_special_tokens=True)[0]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _tokenizer, _model
    log.info("Loading %s ...", MODEL_NAME)
    _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    _model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    _model.eval()
    log.info("Ready on /translate")
    yield


app = FastAPI(lifespan=lifespan, title="NLLB-200 translation server")


class TranslateRequest(BaseModel):
    q: str = Field(..., description="text to translate")
    source: Literal["en", "ja"] = "en"
    target: Literal["en", "ja"] = "ja"
    format: Literal["text", "html"] | None = "text"
    api_key: str | None = None


class TranslateResponse(BaseModel):
    translatedText: str
    detectedLanguage: dict | None = None


@app.get("/")
def root() -> dict:
    return {"ok": True, "service": "nllb-200", "model": MODEL_NAME}


@app.get("/languages")
def languages() -> list[dict]:
    return [
        {"code": "en", "name": "English", "targets": ["en", "ja"]},
        {"code": "ja", "name": "Japanese", "targets": ["en", "ja"]},
    ]


@app.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest) -> TranslateResponse:
    text = req.q.strip()
    if not text:
        return TranslateResponse(translatedText="")
    if req.source == req.target:
        return TranslateResponse(translatedText=text)
    try:
        translated = _translate(text, req.source, req.target)
        return TranslateResponse(translatedText=translated)
    except HTTPException:
        raise
    except Exception as e:
        log.exception("translation failed")
        raise HTTPException(status_code=500, detail=str(e)) from e


def main() -> None:
    parser = argparse.ArgumentParser(description="NLLB-200 EN<->JA translation server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=5001)
    args = parser.parse_args()
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
