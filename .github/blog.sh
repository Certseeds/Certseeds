#!/usr/bin/env bash
set -euox pipefail
main() {
    mkdirsandmv
    archiveFile
    searchFile
}
archiveFile() {
    echo '---' >./content/archives.md
    echo 'title: "Archive"' >>./content/archives.md
    echo 'layout: "archives"' >>./content/archives.md
    echo 'summary: "archives"' >>./content/archives.md
    echo '---' >>./content/archives.md
}
searchFile() {
    echo '---' >./content/search.md
    echo 'title: "Search"' >>./content/search.md
    echo 'layout: "search"' >>./content/search.md
    echo 'summary: "search"' >>./content/search.md
    echo 'placeholder: "2022? 2021? 2077?"' >>./content/search.md
    echo '---' >>./content/search.md
}
mkdirsandmv() {
    mkdir -p ./content/posts
    mv ./2021 ./content/posts/
    mv ./2022 ./content/posts/
    mv ./2023 ./content/posts/
    mv ./2024 ./content/posts/
    mv ./2025 ./content/posts/
    mv ./LICENSE.md ./content/posts/
    mv ./README.md ./content/posts/
    mv ./README.words.md ./content/posts/
}
main
