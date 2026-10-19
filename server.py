from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
MANUALS = {
    "/manuals/core.pdf": Path(
        r"C:\Users\rodrigo.basniak\OneDrive - AVEVA Solutions Limited\Documents\!rbasniak\Personal\Rulebooks\SE Core _Rulebook1_webquality3.pdf"
    ),
    "/manuals/eagle.pdf": Path(
        r"C:\Users\rodrigo.basniak\OneDrive - AVEVA Solutions Limited\Documents\!rbasniak\Personal\Rulebooks\SE Expansion _Rulebook_webquality2.pdf"
    ),
    "/manuals/kraken.pdf": Path(
        r"C:\Users\rodrigo.basniak\OneDrive - AVEVA Solutions Limited\Documents\!rbasniak\Personal\Rulebooks\Sniper_Elite_Operation_Kraken_Rulebook.pdf"
    ),
    "/manuals/escalation.pdf": Path(
        r"C:\Users\rodrigo.basniak\OneDrive - AVEVA Solutions Limited\Documents\!rbasniak\Personal\Rulebooks\Sniper_Elite_Escalation_Rulebook.pdf"
    ),
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
