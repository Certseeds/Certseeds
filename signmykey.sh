#!/usr/bin/env bash
set -euox pipefail
main() {
    local keyfinger="7E7FD8B565F042312DAB81D5DC568E1504A44CF3"
    echo 'please ensure the enviorment exist only one secret key(of course, yours) to sign'
    gpg \
        --delete-keys \
        "${keyfinger}"
    # remove last key
    curl -sSL 'https://raw.githubusercontent.com/Certseeds/Certseeds/master/public.key' | gpg --import -
    # get the newest key
    gpg \
        --expert \
        --ask-cert-level \
        --edit-key "${keyfinger}"
    echo 'then in command line'
    # gpg> tsign
    ## input how can you ensure the key under my control
    # then three questions about trust signature
    ## input how you trust me,
    ## input how far you allow me to make trust signatures on your behalf
    ## and something about sign to domain, i do not know what's that..., just press enter is fine
    gpg \
        --armor \
        -o ./certseeds.pri.key.pub.signed \
        --export "${keyfinger}"
    ./encry.sh ./certseeds.pri.key.pub.signed # prevent others send out the key first
    echo 'then send ./certseeds.pri.key.pub.signed.sign.encry on discussion'
}
main
