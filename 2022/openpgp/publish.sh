#!/usr/bin/env bash
set -euox pipefail
main() {
    local input_file="${1}"
    gpg -s \
        --clearsign \
        -o "${input_file}".sign \
        "${input_file}"
    # -s: sign by your key
    # --clearsign output text=format file
    # -o output file
    # final line is input file
    # now use the sign file for public
    gpg --verify-files \
        "${input_file}".sign
}
if [[ "${#}" != "1" ]]; then
    exit 1
fi
main "${1}"
