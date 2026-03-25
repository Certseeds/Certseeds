#!/usr/bin/env bash
set -euox pipefail
main() {
    local encry_file="${1}"
    local key_file="${2}"
    local decrypted_key_file
    decrypted_key_file=$(mktemp /tmp/XXXXXXXX)
    trap "rm -f '${decrypted_key_file}'" EXIT
    gpg -d \
        --yes \
        -o "${decrypted_key_file}" \
        "${key_file}"
    gpg -d \
        --batch \
        --passphrase-file "${decrypted_key_file}" \
        "${encry_file}"
}
echo "output will occur in stdout" >&2
if [[ "${#}" != "2" ]]; then
    exit 2
fi
main "${1}" "${2}"
