#!/usr/bin/env bash
set -euox pipefail
main() {
    local target="" # put here something in target's pubkey
    if [[ target -eq "" ]]; then
        exit 1
    fi
    local input_file="${1}"
    gpg -s \
        -e \
        -o "${input_file}".sign.encry \
        -r "${target}" \
        "${input_file}"
    # -s: sign by your key
    # -e encry
    # -o output file
    # -r
      # can be fingerprint of key
      # can be full of UID
      # can be the name part of a UID
      # and so on
      # at least should be something in target's pubkey
    # final line is input file
    # now use the encry file for send
    echo "you can not decrypt it by yourself..."
    echo "target can get the msg by gpg --decrypt"
}
if [[ "${#}" != "1" ]]; then
    exit 2
fi
main "${1}"
