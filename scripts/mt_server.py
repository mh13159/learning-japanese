"""
Translation server — Meta's NLLB-200-distilled-600M via CTranslate2 (INT8).

CTranslate2 + INT8 quantization typically delivers a 3-5x CPU-inference
speedup over raw PyTorch transformers and roughly halves memory. Output
quality is virtually unchanged for sentence translation.

Exposes a LibreTranslate-compatible /translate endpoint so it's a
drop-in replacement: set LIBRETRANSLATE_URL to this server's URL.

First run requires a one-time conversion (a few minutes); this script
auto-converts on startup if the CT2 directory is missing. To trigger
it manually:
    py -m ctranslate2.converters.transformers \\
        --model facebook/nllb-200-distilled-600M \\
        --output_dir ~/.cache/nllb-200-ct2-int8 --quantization int8

Usage:
    py scripts/mt_server.py                  # binds 127.0.0.1:5001
    py scripts/mt_server.py --port 5002
    py scripts/mt_server.py --beam-size 1    # greedy decoding, faster

Endpoints:
    GET  /            healthcheck
    GET  /languages   list of {code, name, targets} matching LibreTranslate's shape
    POST /translate   { q, source, target, format? } -> { translatedText }

License: this script is part of this repo (its license). NLLB-200 is
CC-BY-NC 4.0 (non-commercial). For commercial use, convert a different
model — staka/fugumt-* or Helsinki-NLP/opus-mt-* are Apache 2.0.
"""

from __future__ import annotations

import argparse
import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import ctranslate2
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoTokenizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("mt")

HF_MODEL = "facebook/nllb-200-distilled-600M"
DEFAULT_CT2_DIR = Path.home() / ".cache" / "nllb-200-ct2-int8"

# NLLB BCP-47-ish language codes.
LANG_CODE = {
    "en": "eng_Latn",
    "ja": "jpn_Jpan",
}

_translator: ctranslate2.Translator | None = None
_tokenizer: AutoTokenizer | None = None
_beam_size: int = 2


def _ensure_ct2_model(ct2_dir: Path) -> None:
    """If the converted model is missing, run the conversion now."""
    if (ct2_dir / "model.bin").exists():
        return
    log.info("CT2 model not found at %s — converting from %s (one-time)", ct2_dir, HF_MODEL)
    from ctranslate2.converters.transformers import TransformersConverter

    ct2_dir.parent.mkdir(parents=True, exist_ok=True)
    converter = TransformersConverter(HF_MODEL)
    converter.convert(str(ct2_dir), quantization="int8", force=True)
    log.info("Conversion done.")


def _translate(text: str, source: str, target: str) -> str:
    assert _translator is not None and _tokenizer is not None
    src = LANG_CODE.get(source)
    tgt = LANG_CODE.get(target)
    if not src or not tgt:
        raise HTTPException(status_code=400, detail=f"Unsupported language pair: {source}->{target}")

    _tokenizer.src_lang = src
    source_tokens = _tokenizer.convert_ids_to_tokens(_tokenizer.encode(text))
    target_prefix = [tgt]
    result = _translator.translate_batch(
        [source_tokens],
        target_prefix=[target_prefix],
        beam_size=_beam_size,
        max_decoding_length=512,
    )
    target_tokens = result[0].hypotheses[0][1:]  # drop the language prefix token
    return _tokenizer.decode(_tokenizer.convert_tokens_to_ids(target_tokens), skip_special_tokens=True)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _translator, _tokenizer
    ct2_dir = Path(os.environ.get("NLLB_CT2_DIR", DEFAULT_CT2_DIR))
    _ensure_ct2_model(ct2_dir)
    log.info("Loading CT2 model from %s (compute_type=int8, beam_size=%d) ...", ct2_dir, _beam_size)
    t0 = time.time()
    _translator = ctranslate2.Translator(str(ct2_dir), device="cpu", compute_type="int8")
    _tokenizer = AutoTokenizer.from_pretrained(HF_MODEL)
    log.info("Ready on /translate in %.1fs", time.time() - t0)
    yield


app = FastAPI(lifespan=lifespan, title="NLLB-200 CT2 translation server")


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
    return {
        "ok": True,
        "service": "nllb-200-ct2",
        "model": HF_MODEL,
        "beam_size": _beam_size,
    }


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
    global _beam_size
    parser = argparse.ArgumentParser(description="NLLB-200 (CTranslate2 INT8) translation server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=5001)
    parser.add_argument("--beam-size", type=int, default=2, help="1=greedy (fastest), higher=better quality")
    args = parser.parse_args()
    _beam_size = args.beam_size
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
