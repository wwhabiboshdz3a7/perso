#!/bin/bash
# Quai pour Mac — installation (ou mise à jour) en une commande :
#
#   curl -fsSL https://raw.githubusercontent.com/wwhabiboshdz3a7/perso/main/quai/mac/install.sh | bash
#
# Ce que fait ce script, sans jamais demander de mot de passe administrateur :
#   1. télécharge Quai dans ~/Library/Application Support/Quai/
#   2. trouve Node.js (version 18 ou plus) ou en télécharge une copie privée, somme SHA-256 vérifiée
#   3. installe un service de fond (LaunchAgent) qui démarre avec ta session
#   4. crée l'application ~/Applications/Quai.app
#   5. ouvre http://localhost:4747
#
# Compatible avec le bash 3.2 livré avec macOS.
set -euo pipefail

DEPOT="${QUAI_DEPOT:-wwhabiboshdz3a7/perso}"
BRANCHE="${QUAI_BRANCHE:-main}"
ARCHIVE_URL="${QUAI_ARCHIVE_URL:-https://codeload.github.com/$DEPOT/tar.gz/refs/heads/$BRANCHE}"
NODE_DIST="${QUAI_NODE_DIST:-https://nodejs.org/dist}"
PORT="${QUAI_MAC_PORT:-4747}"
LABEL="fr.quai.mac"

TMP=""

dire() { printf '%s\n' "$*"; }
etape() { printf '\n[%s/5] %s\n' "$1" "$2"; }
echec() {
  printf '\nInstallation interrompue : %s\n' "$*" >&2
  exit 1
}
nettoyer() {
  if [ -n "$TMP" ]; then rm -rf "$TMP"; fi
}

# Pour écrire un chemin dans un fichier .plist (XML).
xml() { printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }

node_convient() {
  [ -n "$1" ] && [ -x "$1" ] &&
    "$1" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 18 ? 0 : 1)' >/dev/null 2>&1
}

# Affiche le chemin d'un Node qui convient : celui du PATH, sinon Homebrew, sinon la copie privée.
trouver_node() {
  local candidat reel
  candidat="$(command -v node 2>/dev/null || true)"
  if node_convient "$candidat"; then
    case "$candidat" in
      /opt/homebrew/bin/node | /usr/local/bin/node) ;;
      *)
        # Certains gestionnaires de versions exposent un lien provisoire : on garde le vrai chemin.
        reel="$("$candidat" -p 'process.execPath' 2>/dev/null || true)"
        if node_convient "$reel"; then candidat="$reel"; fi
        ;;
    esac
    printf '%s\n' "$candidat"
    return 0
  fi
  for candidat in /opt/homebrew/bin/node /usr/local/bin/node "$DOSSIER/node/bin/node"; do
    if node_convient "$candidat"; then
      printf '%s\n' "$candidat"
      return 0
    fi
  done
  return 1
}

# Télécharge la version LTS officielle de Node.js dans le dossier de Quai.
installer_node() {
  local arch majeure systeme base ligne attendu fichier obtenu
  if [ "$(sysctl -n hw.optional.arm64 2>/dev/null || true)" = "1" ]; then
    arch="arm64" # Mac Apple Silicon, même si le Terminal tourne sous Rosetta
  else
    case "$(uname -m)" in
      arm64) arch="arm64" ;;
      x86_64) arch="x64" ;;
      *) echec "processeur non pris en charge ($(uname -m))." ;;
    esac
  fi
  majeure="${QUAI_NODE_MAJEURE:-}"
  if [ -z "$majeure" ]; then
    # Node 24 demande macOS 13.5 ou plus récent ; Node 22 fonctionne à partir de macOS 11.
    systeme="$(sw_vers -productVersion 2>/dev/null | cut -d. -f1 || true)"
    case "$systeme" in
      '' | *[!0-9]*) majeure="22" ;;
      *) if [ "$systeme" -ge 14 ]; then majeure="24"; else majeure="22"; fi ;;
    esac
  fi
  base="$NODE_DIST/latest-v$majeure.x"

  dire "    Node.js est absent : téléchargement de la version $majeure officielle ($arch) depuis nodejs.org…"
  curl -fsSL --retry 3 --connect-timeout 20 -o "$TMP/SHASUMS256.txt" "$base/SHASUMS256.txt" ||
    echec "impossible de télécharger la liste des sommes de contrôle de Node.js. Vérifie ta connexion internet."
  ligne="$(grep -E "^[0-9a-f]{64}  node-v[0-9]+\.[0-9]+\.[0-9]+-darwin-$arch\.tar\.gz\$" "$TMP/SHASUMS256.txt" | sed -n '1p' || true)"
  attendu="${ligne%% *}"
  fichier="${ligne##* }"
  if [ -z "$ligne" ] || [ "${#attendu}" -ne 64 ]; then
    echec "la version de Node.js pour ce Mac ($arch) est introuvable sur nodejs.org."
  fi
  curl -fL --retry 3 --connect-timeout 20 --progress-bar -o "$TMP/$fichier" "$base/$fichier" ||
    echec "le téléchargement de Node.js a échoué. Vérifie ta connexion internet, puis relance la commande."
  obtenu="$(shasum -a 256 "$TMP/$fichier" | awk '{print $1}')"
  if [ "$obtenu" != "$attendu" ]; then
    echec "la somme de contrôle SHA-256 de Node.js ne correspond pas (fichier abîmé ou modifié). Node.js n'a pas été installé et le service n'a pas été démarré."
  fi
  dire "    Somme SHA-256 vérifiée."

  rm -rf "$DOSSIER/node.nouveau"
  mkdir -p "$DOSSIER/node.nouveau"
  tar -xzf "$TMP/$fichier" -C "$DOSSIER/node.nouveau" --strip-components=1 ||
    echec "l'archive de Node.js n'a pas pu être décompressée."
  if ! node_convient "$DOSSIER/node.nouveau/bin/node"; then
    rm -rf "$DOSSIER/node.nouveau"
    echec "le Node.js téléchargé ne fonctionne pas sur ce Mac."
  fi
  rm -rf "$DOSSIER/node"
  mv "$DOSSIER/node.nouveau" "$DOSSIER/node"
}

repond() {
  curl -fs -o /dev/null --max-time 2 -H 'X-Quai: 1' "http://127.0.0.1:$PORT/api/ping"
}

main() {
  [ "$(uname -s)" = "Darwin" ] || echec "Quai pour Mac ne s'installe que sur macOS."
  if [ -z "${HOME:-}" ] || [ ! -d "$HOME" ]; then echec "dossier personnel introuvable."; fi
  [ "$(id -u)" != "0" ] || echec "lance cette commande sans sudo, depuis ta session habituelle."
  case "$PORT" in
    '' | *[!0-9]*) echec "QUAI_MAC_PORT doit être un nombre." ;;
  esac
  for outil in curl tar shasum launchctl; do
    command -v "$outil" >/dev/null 2>&1 || echec "la commande « $outil » est introuvable sur ce Mac."
  done

  DOSSIER="$HOME/Library/Application Support/Quai"
  JOURNAUX="$HOME/Library/Logs/Quai"
  AGENTS="$HOME/Library/LaunchAgents"
  PLIST="$AGENTS/$LABEL.plist"
  APPLI="$HOME/Applications/Quai.app"
  LANCEUR="$DOSSIER/bin/quai-service"
  CIBLE="gui/$(id -u)"

  TMP="$(mktemp -d "${TMPDIR:-/tmp}/quai-installation.XXXXXX")"
  trap nettoyer EXIT

  dire "Installation de Quai pour Mac"

  # ---------- 1. le programme ----------
  etape 1 "Téléchargement de Quai…"
  curl -fsSL --retry 3 --connect-timeout 20 -o "$TMP/quai.tar.gz" "$ARCHIVE_URL" ||
    echec "le téléchargement de Quai a échoué. Vérifie ta connexion internet, puis relance la commande."
  # L'archive de GitHub range tout dans un dossier « depot-branche ».
  racine="$(tar -tzf "$TMP/quai.tar.gz" | awk -F/ 'NR == 1 { print $1 }')" || echec "l'archive téléchargée est illisible."
  case "$racine" in
    '' | .*) echec "l'archive téléchargée est illisible." ;;
  esac
  mkdir "$TMP/extrait"
  # Seuls quai/mac et quai/lib sont extraits ; la structure est gardée pour que mac/ retrouve ../lib.
  tar -xzf "$TMP/quai.tar.gz" -C "$TMP/extrait" --strip-components=1 "$racine/quai/mac" "$racine/quai/lib" ||
    echec "l'archive téléchargée ne contient pas Quai pour Mac."
  for fichier in quai/mac/server.js quai/mac/github.js quai/mac/secrets.js quai/mac/public/index.html quai/lib/zip.js quai/lib/store.js; do
    [ -f "$TMP/extrait/$fichier" ] || echec "l'archive téléchargée est incomplète ($fichier manque)."
  done

  mkdir -p "$DOSSIER/bin" "$JOURNAUX" "$AGENTS" "$HOME/Applications"
  rm -rf "$DOSSIER/quai.ancien"
  if [ -d "$DOSSIER/quai" ]; then
    mv "$DOSSIER/quai" "$DOSSIER/quai.ancien"
    dire "    Une version précédente est installée : mise à jour."
  fi
  mv "$TMP/extrait/quai" "$DOSSIER/quai"
  rm -rf "$DOSSIER/quai.ancien"
  dire "    Quai est dans $DOSSIER"

  # ---------- 2. Node.js ----------
  etape 2 "Recherche de Node.js (version 18 ou plus)…"
  NODE="$(trouver_node || true)"
  if [ -z "$NODE" ]; then
    installer_node
    NODE="$DOSSIER/node/bin/node"
  fi
  dire "    Node.js utilisé : $NODE ($("$NODE" --version))"
  printf '%s\n' "$NODE" >"$DOSSIER/node-path"

  # Le service passe par ce petit lanceur : si le Node habituel disparaît (mise à jour,
  # désinstallation), il en essaie un autre au lieu de tomber en panne.
  cat >"$LANCEUR" <<'LANCEUR_EOF'
#!/bin/bash
# Lance le serveur de Quai avec le premier Node.js (version 18 ou plus) qui convient.
DOSSIER="$(cd "$(dirname "$0")/.." && pwd)"
PREFERE=""
if [ -f "$DOSSIER/node-path" ]; then IFS= read -r PREFERE <"$DOSSIER/node-path"; fi
for NODE in "$PREFERE" /opt/homebrew/bin/node /usr/local/bin/node "$DOSSIER/node/bin/node"; do
  if [ -n "$NODE" ] && [ -x "$NODE" ] &&
    "$NODE" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 18 ? 0 : 1)' 2>/dev/null; then
    exec "$NODE" "$DOSSIER/quai/mac/server.js"
  fi
done
echo "Quai : Node.js (version 18 ou plus) est introuvable. Relance la commande d'installation." >&2
sleep 30 # laisse souffler launchd avant sa prochaine tentative
exit 1
LANCEUR_EOF
  chmod 755 "$LANCEUR"

  # ---------- 3. le service de fond ----------
  etape 3 "Installation du service (démarre avec ta session)…"
  cat >"$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$(xml "$LANCEUR")</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$(xml "$DOSSIER")</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>QUAI_MAC_PORT</key>
    <string>$PORT</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>StandardOutPath</key>
  <string>$(xml "$JOURNAUX/quai.log")</string>
  <key>StandardErrorPath</key>
  <string>$(xml "$JOURNAUX/quai.log")</string>
</dict>
</plist>
PLIST_EOF
  chmod 644 "$PLIST"
  if command -v plutil >/dev/null 2>&1; then
    plutil -lint "$PLIST" >/dev/null || echec "le fichier du service ($PLIST) est invalide."
  fi

  # Arrêt de l'ancien service s'il tourne, puis démarrage du nouveau.
  launchctl bootout "$CIBLE/$LABEL" >/dev/null 2>&1 || true
  for essai in 1 2 3 4 5 6 7 8 9 10; do
    launchctl print "$CIBLE/$LABEL" >/dev/null 2>&1 || break
    sleep 0.5
  done
  launchctl enable "$CIBLE/$LABEL" >/dev/null 2>&1 || true
  charge="non"
  for essai in 1 2 3 4; do
    if launchctl bootstrap "$CIBLE" "$PLIST" >/dev/null 2>&1; then
      charge="oui"
      break
    fi
    sleep 1
  done
  if [ "$charge" = "non" ]; then
    # Anciennes versions de macOS, ou service encore en cours d'arrêt.
    launchctl unload "$PLIST" >/dev/null 2>&1 || true
    launchctl load -w "$PLIST" >/dev/null 2>&1 || echec "le service n'a pas pu être démarré (launchctl)."
  fi

  pret="non"
  for essai in $(seq 1 40); do
    if repond; then
      pret="oui"
      break
    fi
    sleep 0.5
  done
  if [ "$pret" = "non" ]; then
    echec "Quai est installé mais ne répond pas sur le port $PORT. Le journal donne la raison : $JOURNAUX/quai.log"
  fi
  dire "    Le service tourne. Journal : $JOURNAUX/quai.log"

  # ---------- 4. l'application ----------
  etape 4 "Création de l'application Quai…"
  rm -rf "$APPLI"
  mkdir -p "$APPLI/Contents/MacOS"
  cat >"$APPLI/Contents/Info.plist" <<'INFO_EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Quai</string>
  <key>CFBundleDisplayName</key>
  <string>Quai</string>
  <key>CFBundleIdentifier</key>
  <string>fr.quai.mac.app</string>
  <key>CFBundleExecutable</key>
  <string>Quai</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>LSUIElement</key>
  <true/>
</dict>
</plist>
INFO_EOF
  # Seul le port est inscrit par l'installation ; tout le reste est écrit tel quel.
  {
    printf '#!/bin/bash\n# Quai.app : ouvre la page de Quai, et relance le service s'"'"'il ne répond pas.\nPORT=%s\n' "$PORT"
    cat <<'APPLI_EOF'
LABEL="fr.quai.mac"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
CIBLE="gui/$(/usr/bin/id -u)"

repond() {
  /usr/bin/curl -fs -o /dev/null --max-time 2 -H 'X-Quai: 1' "http://127.0.0.1:$PORT/api/ping"
}

if ! repond; then
  /bin/launchctl bootstrap "$CIBLE" "$PLIST" >/dev/null 2>&1 || true
  /bin/launchctl kickstart "$CIBLE/$LABEL" >/dev/null 2>&1 || true
  for essai in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    if repond; then break; fi
    /bin/sleep 0.5
  done
fi

if repond; then
  /usr/bin/open "http://localhost:$PORT"
else
  /usr/bin/osascript -e 'display dialog "Quai ne démarre pas. Relance la commande d’installation, ou regarde le journal dans ~/Library/Logs/Quai." buttons {"OK"} default button 1 with title "Quai" with icon caution' >/dev/null 2>&1 || true
fi
APPLI_EOF
  } >"$APPLI/Contents/MacOS/Quai"
  chmod 755 "$APPLI/Contents/MacOS/Quai"
  touch "$APPLI"
  dire "    $APPLI"

  # ---------- 5. c'est prêt ----------
  etape 5 "Ouverture de Quai…"
  if [ "${QUAI_SANS_OUVRIR:-}" != "1" ]; then
    open "http://localhost:$PORT" >/dev/null 2>&1 || true
  fi
  dire ""
  dire "Quai est installé."
  dire "  Page      : http://localhost:$PORT"
  dire "  Appli     : Quai, dans le dossier Applications de ton dossier personnel (ou via Spotlight)"
  dire "  Mettre à jour : relance la même commande d'installation"
  dire "  Désinstaller  : bash \"$DOSSIER/quai/mac/uninstall.sh\""
}

# Tout est dans des fonctions : si le téléchargement du script est coupé en route, rien ne s'exécute.
main "$@"
