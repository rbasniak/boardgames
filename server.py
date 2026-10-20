from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
MANUALS = {
    "/manuals/core.pdf": ROOT / "manuals" / "core.pdf",
    "/manuals/eagle.pdf": ROOT / "manuals" / "eagle.pdf",
    "/manuals/kraken.pdf": ROOT / "manuals" / "kraken.pdf",
    "/manuals/escalation.pdf": ROOT / "manuals" / "escalation.pdf",
    "/manuals/not-enough-mana_core.pdf": ROOT / "manuals" / "not-enough-mana_core.pdf",
    "/manuals/avalon_core.pdf": ROOT / "manuals" / "avalon_core.pdf",
}


class RulebookHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        manual = MANUALS.get(urlsplit(path).path)
        if manual is not None:
            return str(manual)
        return super().translate_path(path)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8765), RulebookHandler)
    print("Field Manual: http://127.0.0.1:8765")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
