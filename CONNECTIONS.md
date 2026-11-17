# 연결 안내

현재 배포 및 앱 설치 설명은 [README.md](README.md), AI 제공자별 설명은 [AI_PROVIDERS.md](AI_PROVIDERS.md)를 따릅니다.

설정·초안·승인본·알람은 FAMILYBOARD_DATA_DIR의 board-state.json에 저장합니다. 업로드 원본과 분석 결과도 같은 영속 경로에 보관합니다. 서버는 단일 프로세스로 실행하며 여러 프로세스의 동일 데이터 폴더 동시 쓰기는 지원하지 않습니다.

Tailscale HTTPS 서버 주소는 각 기기의 첫 실행에서 입력합니다. 사용자별 로그인은 제공하지 않으므로 Tailscale 접근 규칙으로 가족 기기에만 접속을 허용합니다.
