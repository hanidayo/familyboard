# FamilyBoard

가로형 안드로이드 태블릿의 가족 알림판과 아이폰 관리 앱입니다. Ubuntu 서버를 Tailscale HTTPS 주소로 연결합니다. 기본 순서는 첫째 → 둘째 → 아빠이며 이름과 학교를 바꿀 수 있습니다.

## 설치 파일

[Actions → Build FamilyBoard](https://github.com/hanidayo/familyboard/actions/workflows/build.yml)의 성공한 실행에서 Artifacts를 내려받습니다.

| 파일 | 용도 |
| --- | --- |
| FamilyBoard-Android-test.apk | Android 8 이상 직접 설치용 테스트 APK. 빌드 시스템의 임시 디버그 키로 서명. |
| FamilyBoard-iOS-unsigned.ipa | 실제 iPhone ARM64 앱을 담은 **미서명** IPA. 바로 설치할 수 없으며 설치 전에 별도 서명 필요. |
| FamilyBoard-server-public.tar.gz | Ubuntu 서버용. 공개 예제라 가족 문서·식단·학교 연결은 비어 있음. |

안드로이드는 웹뷰 최신 업데이트가 필요합니다. 디버그 키는 매 빌드 바뀔 수 있으므로 다음 APK가 설치되지 않으면 기존 앱을 삭제하고 다시 설치합니다. 서버 데이터는 유지되고 앱의 서버 주소는 다시 입력해야 합니다. 장기 배포 시에는 사용자가 보관하는 릴리스 키를 연결해야 합니다.

## Ubuntu 서버: Docker 방식

Ubuntu에 Docker Compose와 Tailscale이 설치·로그인되어 있어야 합니다. 저장소 루트에서:

```sh
cp deploy/settings.env.example deploy/settings.env
# 원하는 AI API와 나이스 키만 settings.env에 입력
docker compose -f deploy/compose.yaml up -d --build
curl http://127.0.0.1:8790/api/status
sudo tailscale serve --bg http://127.0.0.1:8790
tailscale serve status
```

마지막 출력에 나오는 **실제 `https://….ts.net` 주소**를 두 앱의 첫 화면에 입력합니다. 임의 서버 주소는 만들어 넣지 않았습니다. 태블릿·아이폰에도 Tailscale을 설치하고 같은 네트워크에 로그인해야 합니다. Tailscale Serve는 해당 네트워크 안에서 제공되며, 외부 공개용 Funnel은 사용하지 않습니다. 서버의 8790 포트는 localhost에만 공개합니다. Tailscale 접근 규칙으로 가족 기기만 허용하세요. 앱에는 별도 사용자 계정이 없으므로 접근이 허용된 기기는 관리 기능을 사용할 수 있습니다.

`familyboard-data` Docker 볼륨에 수정본·승인본·설정·업로드 원본이 저장됩니다. **볼륨과 가족 자료가 포함된 web/data.js·web/assets도 백업**합니다. 저장소 재복제는 가족 데이터 복원이 아닙니다.

## 구독 CLI 분석: Ubuntu 직접 실행

Docker 이미지는 각 AI CLI를 포함하지 않습니다. Codex·Claude Code·Gemini CLI 구독 로그인을 사용할 경우 Node 24+, Poppler와 해당 공식 CLI를 호스트에 설치한 뒤 **같은 실행 계정으로 로그인**합니다. 사용자별 플랜 이용 가능 여부를 먼저 확인합니다.

```sh
cd web
HOST=127.0.0.1 PORT=8790 FAMILYBOARD_DATA_DIR=/지속보관할/경로 node server.cjs
```

운영 서비스 예시는 `deploy/familyboard.service`입니다. `/opt/familyboard`에 파일을 배치하고 `familyboard` 사용자를 만든 뒤 `/etc/familyboard.env`와 CLI 로그인 경로를 맞추세요. CLI 로그인은 서비스를 실행하는 `familyboard` 계정의 HOME(`/var/lib/familyboard`)에서 수행합니다. 서비스는 로그인된 사용자의 인증서를 자동 복사하지 않습니다. Docker와 직접 실행 방식 중 하나만 사용하세요. 공급자별 설정은 [AI_PROVIDERS.md](AI_PROVIDERS.md)를 참고하세요.

## 기능과 범위

- 이미지/PDF 자료 업로드 → 선택한 AI로 날짜·식단·행사 분석 → 수정 → 보호자 승인. 실제 날짜가 없는 항목은 추정하지 않습니다.
- 가족별 이름·학교 변경과 나이스 학교 검색·급식 불러오기. 나이스 키가 없으면 제한 조회, 운영용 키 권장.
- 설정·초안·승인본은 서버에 저장하고 다른 기기가 약 2초마다 확인합니다. 동시 수정은 오래된 저장을 거절하며 오류를 표시합니다. 분석 중에는 다른 관리 기기에서 동시에 편집하지 마세요.
- 서울 시각 기준 여러 켜짐/꺼짐 알람. 초기 4개는 **비활성 샘플**입니다. 앱이 열려 있을 때 적용되며 재시작 시 최근 알람을 계산합니다.
- 꺼짐 중 터치하면 설정 시간 동안 켜지고 다음 꺼짐 알람 또는 유지 시간 만료 시 다시 대기합니다. 내용 잠금은 유지됩니다.
- Android 앱은 항상 켜짐 유지 + 꺼짐 상태 최저 밝기와 검은 화면입니다. 완전한 백라이트 전원 제어·OS 버튼/설정 차단·부팅 자동 실행·백그라운드 알람은 제공하지 않습니다. 필요한 경우 기기 화면 고정 기능을 사용하세요.
- 날씨와 미세먼지는 아직 연결 전이며 수치를 임의로 채우지 않습니다. 기기별 수신 확인/접속 목록은 아직 없습니다.
- 공개 저장소에는 가족 원본·실제 가족 자료를 포함하지 않습니다. 별도 제공한 비공개 서버 묶음에는 문서에서 확인한 자료가 포함됩니다. 공개 기본 화면은 빈 상태입니다.

## 빌드·검증

```sh
node --test web/*.test.cjs
# Android: JDK 17, Android SDK 36, Gradle 8.14.3
gradle -p android assembleDebug
# iOS: Mac + Xcode + XcodeGen
bash ios/build-unsigned.sh
```

IPA는 Xcode의 iphoneos 아카이브에서 생성하며 인증서와 프로비저닝 파일은 포함하지 않습니다. App Store/TestFlight 배포용 파일이 아닙니다. 기기 설치를 위해서는 사용자의 Apple 서명과 기기에 맞는 배포 프로파일이 필요합니다. 미서명 요청에 맞춰 CI는 Apple 비밀 설정을 사용하지 않습니다.

GitHub 빌드 검증은 실기기 설치 검증과 다릅니다. 실제 태블릿 밝기·터치·파일 선택, 아이폰 사진/PDF 업로드는 기기에서 확인해야 합니다.
