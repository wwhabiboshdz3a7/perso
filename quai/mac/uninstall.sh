#!/bin/bash
# Quai pour Mac — désinstallation.
#
#   bash "$HOME/Library/Application Support/Quai/quai/mac/uninstall.sh"
#   ou : curl -fsSL https://raw.githubusercontent.com/wwhabiboshdz3a7/perso/main/quai/mac/uninstall.sh | bash
#
# Retire le service, l'application, les fichiers et les journaux de Quai, et EFFACE le jeton
# GitHub du Trousseau. Pour garder le jeton (réinstallation prévue), ajoute --garder-jeton :
#
#   bash "…/uninstall.sh" --garder-jeton          (ou : curl … | bash -s -- --garder-jeton)
#
# Tes sites déjà publiés ne sont pas touchés : ils restent en ligne sur GitHub.
set -euo pipefail

LABEL="fr.quai.mac"
SERVICE_TROUSSEAU="fr.quai.mac"
COMPTE_TROUSSEAU="jeton-github"

dire() { printf '%s\n' "$*"; }

main() {
  local garder="non" arg
  for arg in "$@"; do
    case "$arg" in
      --garder-jeton) garder="oui" ;;
      *)
        printf 'Option inconnue : %s (seule option : --garder-jeton)\n' "$arg" >&2
        exit 2
        ;;
    esac
  done
  if [ "$(uname -s)" != "Darwin" ]; then
    printf 'Ce script ne concerne que macOS.\n' >&2
    exit 1
  fi
  if [ -z "${HOME:-}" ] || [ ! -d "$HOME" ]; then
    printf 'Dossier personnel introuvable.\n' >&2
    exit 1
  fi

  local dossier="$HOME/Library/Application Support/Quai"
  local journaux="$HOME/Library/Logs/Quai"
  local plist="$HOME/Library/LaunchAgents/$LABEL.plist"
  local appli="$HOME/Applications/Quai.app"
  local cible
  cible="gui/$(id -u)"

  dire "Désinstallation de Quai pour Mac"

  # Le service : arrêté, puis retiré.
  launchctl bootout "$cible/$LABEL" >/dev/null 2>&1 ||
    launchctl unload "$plist" >/dev/null 2>&1 || true
  rm -f "$plist"
  dire "  Service arrêté et retiré."

  rm -rf "$appli"
  dire "  Application retirée."

  rm -rf "$dossier" "$journaux"
  dire "  Fichiers et journaux retirés."

  if [ "$garder" = "oui" ]; then
    dire "  Jeton GitHub conservé dans le Trousseau (élément « $SERVICE_TROUSSEAU »), réglages conservés dans ~/.quai."
  else
    if /usr/bin/security delete-generic-password -s "$SERVICE_TROUSSEAU" -a "$COMPTE_TROUSSEAU" >/dev/null 2>&1; then
      dire "  Jeton GitHub effacé du Trousseau."
    else
      dire "  Aucun jeton GitHub dans le Trousseau."
    fi
    rm -f "$HOME/.quai/config.json"
    rmdir "$HOME/.quai" >/dev/null 2>&1 || true
    dire "  Le jeton existe toujours côté GitHub : tu peux le révoquer sur https://github.com/settings/tokens"
  fi

  dire ""
  dire "Quai est désinstallé. Tes sites publiés restent en ligne."
}

# Tout est dans une fonction : le script peut se supprimer lui-même sans s'interrompre.
main "$@"
