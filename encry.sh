#!/usr/bin/env bash
set -euox pipefail
main() {
    local input_file="${1}"
    gpg -s \
        -e \
        --armor \
        -o "${input_file}".sign.encry \
        -R 7E7FD8B565F042312DAB81D5DC568E1504A44CF3 \
        "${input_file}"
    # -s: sign by your key
    # -e encry
    # --armor output ascii-format file
    # -o output file
    # -R let encry use my pubkey's fingerprint, find my pubkey to encry and do not put keyID in result
    # final line is input file
    # now use the encry file for send
}
if [[ "${#}" != "1" ]]; then
    exit 1
fi
main "${1}"
