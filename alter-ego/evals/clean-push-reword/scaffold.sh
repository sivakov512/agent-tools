. "$(dirname "$0")/../lib.sh"
setup_config; setup_repo; use_mode clean
printf '\n## Install\n\n    pip install tool\n' >>README.md
git commit -qam $'Add install instructions\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'
