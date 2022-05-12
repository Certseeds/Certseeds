#!/usr/bin/env bash
set -euox pipefail
main() {
    input_file=""
    gpg -s \
        -e \
        --armor \
        -o "${input_file}".encry \
        -r 7E7FD8B565F042312DAB81D5DC568E1504A44CF3 \
        "${input_file}"
    # -s: sign by your key
    # -e encry
    # --armor output ascii-format file
    # -o output file
    # -r let encry use my public-key's fingerprint find my public-key to encry
    # final line is input file
    # now use the encry file for send
}
main
