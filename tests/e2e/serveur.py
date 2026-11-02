# Serveur statique de test : sert le site comme Netlify, avec les mêmes
# en-têtes de sécurité (CSP, Permissions-Policy) lus dans netlify.toml.
# Usage : python3 tests/e2e/serveur.py <racine> <port>
import functools
import http.server
import os
import re
import socketserver
import sys

racine, port = sys.argv[1], int(sys.argv[2])
toml = open(os.path.join(racine, 'netlify.toml'), encoding='utf-8').read()
CSP = re.search(r'Content-Security-Policy = "([^"]+)"', toml).group(1)
PERM = re.search(r'Permissions-Policy = "([^"]+)"', toml).group(1)


class Gestionnaire(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.wasm': 'application/wasm',
        '.mjs': 'text/javascript',
        '.js': 'text/javascript',
        '.webmanifest': 'application/manifest+json',
        '.task': 'application/octet-stream',
    }

    def end_headers(self):
        self.send_header('Content-Security-Policy', CSP)
        self.send_header('Permissions-Policy', PERM)
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, *args):
        pass


socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('127.0.0.1', port), functools.partial(Gestionnaire, directory=racine)) as serveur:
    serveur.serve_forever()
