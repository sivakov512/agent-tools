. "$(dirname "$0")/../lib.sh"
setup_config; setup_repo
printf '\nUsage: tool run\n' >>README.md && git commit -qam "Document usage"
