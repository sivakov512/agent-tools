. "$(dirname "$0")/../lib.sh"
setup_config; setup_repo; use_mode forge
printf '\n## Install\n\n    pip install tool\n' >>README.md
