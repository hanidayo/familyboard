#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
command -v xcodegen >/dev/null || { echo '먼저 brew install xcodegen 실행'; exit 1; }
xcodegen generate
xcodebuild -project FamilyBoard.xcodeproj -scheme FamilyBoard -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' -archivePath build/FamilyBoard.xcarchive archive CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO
mkdir -p build/package/Payload
cp -R build/FamilyBoard.xcarchive/Products/Applications/FamilyBoard.app build/package/Payload/
(cd build/package && /usr/bin/zip -qry ../FamilyBoard-iOS-unsigned.ipa Payload)
echo '완료: build/FamilyBoard-iOS-unsigned.ipa (서명 없음 · 직접 설치 불가)'
