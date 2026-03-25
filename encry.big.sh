#!/usr/bin/env bash
set -euox pipefail
main() {
    local input_file="${1}"
    local keyFile=$(mktemp "${input_file}".key.XXXX)
    trap "rm -f '${keyFile}'" EXIT
    local key=$(openssl rand 128)
    echo "${key}" | tee "${keyFile}"
    cat "${keyFile}"
    bash ./encry.sh "${keyFile}"
    # -s: sign by your key
    # -e encry
    # --armor output ascii-format file
    # -o output file
    # -R let encry use my public-key's fingerprint find my public-key to encry
    # final line is input file
    gpg --symmetric \
        --batch \
        --passphrase-file "${keyFile}" \
        --cipher-algo AES256 \
        --s2k-digest-algo SHA512 \
        --s2k-cipher-algo AES256 \
        --s2k-count 65011712 \
        --s2k-mode 3 \
        --force-aead \
        --compress-algo none \
        --no-symkey-cache \
        --no-emit-version \
        -o "${input_file}.symmetric.encry" \
        "${input_file}"
    # --symmetric: enable symmetirc encry
    # --cipher-algo: use aes265 algo
    # --batch: enable --passphrase-file, read pass from the file
    # -o output file
    # final line is input file
    echo "please send ${input_file}.sign.encry and ${input_file}.symmetric.encry in the same time"

}
if [[ "${#}" != "1" ]]; then
    exit 1
fi
main "${1}"
