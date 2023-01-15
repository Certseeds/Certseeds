#!/usr/bin/env bash
set -euox pipefail
main() {
    local encry_file="${1}"
    local key_file="${2}"
    local key=$(gpg -d ${key_file})
    gpg -d \
        --batch \
        --passphrase "${key}" \
        "${encry_file}"
}
echo "output will occur in stdout"
if [[ "${#}" != "2" ]]; then
    exit 2
fi
main "${1}" "${2}"

