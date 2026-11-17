# 자료 분석 AI 선택

관리 화면 → 자료 → 분석할 AI에서 선택합니다. 선택은 서버를 통해 공유하며, 각 자료에는 실제 분석한 AI 이름을 남깁니다. 분석 중 선택을 바꿔도 이미 시작한 작업의 제공자는 바뀌지 않습니다. 실패했을 때 다른 AI로 자동 전환하거나 재전송하지 않습니다.

## 선택지

| 선택 | 이용 방식 | 준비 |
|---|---|---|
| Codex | ChatGPT 계정 로그인 사용 한도 | 서버의 Codex 설치·ChatGPT 로그인 |
| Claude Code | Claude Code를 이용할 수 있는 구독 계정 | 서버의 Claude Code 설치·구독 로그인 |
| Gemini CLI | Google 로그인 계정의 할당량 | 서버의 Gemini CLI 설치·Google 로그인 |
| OpenAI API | 별도 API 사용료 | OPENAI_API_KEY, 선택적 OPENAI_MODEL |
| Claude API | 별도 API 사용료 | ANTHROPIC_API_KEY, ANTHROPIC_MODEL |
| Gemini API | 해당 API 요금·한도 | GEMINI_API_KEY, GEMINI_MODEL |
| Ollama 로컬 AI | 서버에서 모델 실행 | OLLAMA_URL, 이미지 판독 가능한 OLLAMA_MODEL |
| 다른 AI 결과 가져오기 | 원하는 서비스에서 분석 후 결과 파일 입력 | 분석 요청문 복사 → AI에 자료와 함께 제공 → 결과 JSON 가져오기 |

각 서비스의 구독·요금·한도는 서로 다릅니다. 웹 채팅 구독을 모든 API의 사용권으로 취급하지 않습니다. CLI 방식은 해당 회사의 공식 프로그램을 호출하고, 브라우저 로그인 토큰을 추출하거나 자체 API에 재사용하지 않습니다.

## 현재 확인 결과

현재 Windows 미리보기 컴퓨터에서 Codex 프로그램과 ChatGPT 로그인 모드를 확인했습니다. 실제 문서 분석은 실행하지 않았으므로 모델 사용 한도·문서 판독 성공까지 검증했다는 의미는 아닙니다. Claude Code·Gemini CLI는 미설치, API 키·로컬 모델은 미설정으로 표시합니다. Ubuntu 서버에는 별도로 프로그램·로그인·모델을 준비해야 합니다.

화면의 `설치 확인`, `키·모델 설정됨`, `설정 확인`은 실제 판독 성공과 구분됩니다. 연결 상태 확인 버튼은 모델에 문서를 보내지 않습니다. API는 키·모델 설정만 확인하며 실제 유료 분석 요청을 시험하지 않습니다.

## 서버 구성

실행은 기존처럼 `cd web && node server.cjs 8790`입니다. 현재 컴퓨터의 기관 인증서 환경에서는 `node --use-system-ca server.cjs 8790`을 사용합니다. 환경변수 예제는 `deploy/settings.env.example`에 있습니다. 실행 파일을 PATH에서 찾을 수 없으면 다음 경로 변수를 지정합니다.

- FAMILYBOARD_CODEX_BIN
- FAMILYBOARD_CLAUDE_BIN
- FAMILYBOARD_GEMINI_BIN
- PDFTOPPM_BIN, PDFINFO_BIN (PDF 변환이 필요한 방식)

API 키·로그인 정보는 브라우저로 전달하지 않습니다. 서버는 제공자 ID를 고정 목록으로 확인하고 셸 문자열 대신 실행 파일과 인수 배열로 공식 CLI를 호출합니다. CLI 방식은 전용 서버 계정·작업 폴더에서 개인 자료만 처리하는 용도로 준비해야 합니다. CLI가 추가로 읽을 수 있는 파일과 계정 설정은 운영 환경에서 별도로 제한해야 합니다. 공개 다중 사용자 분석 서비스의 인증·작업 격리 구현은 이 시안에 포함되지 않습니다.

Codex CLI는 read-only 실행과 이미지 입력, JSON Schema 출력으로 연결합니다. API 키 환경변수는 CLI 실행 환경에서 제거하고 ChatGPT 로그인 모드를 확인합니다. Claude Code는 Read 도구만 허용하며 구독 로그인 모드를 확인합니다. Gemini CLI는 Google 로그인 캐시를 확인하고 계획 모드에서 이미지 파일을 참조합니다. CLI 설치 버전에 따라 인수·권한·이미지 처리 동작을 실기 확인해야 합니다. 설치나 사용 한도를 넘으면 오류로 남기며 다른 제공자로 전환하지 않습니다.

CLI와 로컬 모델의 PDF 입력은 `pdfinfo`로 페이지 수를 확인하고 `pdftoppm`으로 이미지로 변환합니다. 이 방식은 12페이지 이하 PDF만 받습니다. 그보다 크거나 변환 도구가 없으면 자료를 나누거나 다른 입력 방식을 사용하도록 안내합니다. 일부 API는 PDF를 직접 입력합니다. Ollama는 설치된 이미지 판독 모델이 필요하며 모델을 자동 다운로드하지 않습니다.

## API

- GET /api/ai/providers: 선택 목록과 설치·설정 상태. 비밀번호·키·개인 계정 정보는 반환하지 않음.
- POST /api/ai/check: `{provider}` 연결 준비 확인. 모델 분석 요청 아님.
- POST /api/analyze: `{provider, mime, fileData, filename}`. 선택한 제공자만 실행.
- GET /api/analysis/schema: 공통 결과 형식과 분석 요청문.
- POST /api/analysis/import: `{analysis, sourceName}`. 외부 결과를 공통 검증기에 통과시켜 초안으로 반환.

결과는 `analysis-schema.json`의 공통 형식입니다. 제공자와 상관없이 날짜, 배열, 숫자, 식단 날짜 중복을 검증합니다. 판독이 불명확한 날짜를 현재 날짜로 채우지 않습니다. 검증된 결과도 보호자 검토·승인을 거쳐 표시합니다. 외부 결과만 가져온 자료는 원본 미첨부임을 표시하고 과거 안내문을 새 원본으로 연결하지 않습니다.

## 검증 범위

- 제공자 선택·기억, Codex 로그인 확인, 다른 AI 설치 필요 표시.
- 공통 JSON 검증, 잘못된 날짜·중복 날짜 거절, API 키의 CLI 환경 제외, 미설정 제공자의 자동 전환 방지 테스트.
- 기존 학교 검색·급식 조회와 가족 3명 전광판 유지.
- 실제 Codex/Claude/Gemini/Ollama 문서 판독 및 각 API의 유료 분석 요청은 미실행. 어댑터 연결 코드는 구현했으며 각 설치 환경에서 실제 자료 검증이 필요합니다.

## 공식 참고

- [Codex 스크립트 실행·로그인](https://learn.chatgpt.com/docs/non-interactive-mode)
- [Claude Code 자동 실행](https://code.claude.com/docs/en/headless), [계정 인증](https://code.claude.com/docs/en/authentication)
- [Gemini CLI 로그인](https://geminicli.com/docs/get-started/authentication/), [자동 실행](https://geminicli.com/docs/cli/headless/)
- [OpenAI 파일 입력](https://developers.openai.com/api/docs/guides/file-inputs)
- [Claude 구조화 응답](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Gemini 구조화 응답](https://ai.google.dev/gemini-api/docs/structured-output)
- [Ollama 이미지·구조화 응답](https://docs.ollama.com/capabilities/structured-outputs)

공식 문서 확인일: 2026-11-17.
