
# Arielle 프로젝트: ASR 관리 시스템 (중간 스냅샷)

## 📅 스냅샷 날짜
2024-04-27

---

## 1. 프로젝트 전체 목표

Project Arielle 은
**ASR → LLM → Translate → TTS → VRM**으로 이어지는  
**멀티모달 시스템**을 구축하는 것을 목표로 합니다.

각각 ASR 모델을 통한 실시간 입력, LLM 모델을 통한 답변 출력 및 번역, TTS 모델을 통한 답변 대답과 Talking Head를 사용한 상호작용 시스템 구현과 이를 관리할 UI 체계 구축을 목표로 합니다.

---

## 2. 이번 작업 범위 (중간 포인트)

- **ASR 모델 탐색 및 등록 시스템 구축**
- HuggingFace API와 연동하여 서버 상에 업로드된 ASR 모델을 실시간으로 탐색 가능하게 만들기
- 선택한 모델을 시스템에 등록할 수 있도록 지원

---

## 3. 현재 프로젝트 구조

```
backend/ (백엔드 프로세스 관리)
  main.py
  sio.py # Socket.IO 서버 관리
  asr/
    model_manager.py # 백엔드 모델 관리
    schemas.py # DB 구성
    service.py # 백엔드 API 관리
    socket_handlers.py # 웹소켓 연동 관리
  db/
    config.py # DB 구성
    database.py # DB 관리
  static/
    icons/

main/ (Electron 프로세스)
  main.js
  preload.js
  dist/

renderer/ (Electron Renderer - Next.js + TypeScript)
  app/
    features/
      asr/
        components/ ## 기능 관련 UI 컴포넌트 디렉토리
          AddModel.tsx # 모델 추가 UI
          ConfirmPopup.tsx # 확인 / 취소 UI
          [+] HuggingFaceModelCard.tsx # Added. HuggingFace 모델 카드 UI
          [+] HuggingFaceModelDrawer.tsx # Added. HuggingFace 모델 탐색 UI
          LiveTranscriptPanel.tsx # 실시간 음성 전사 UI
          MicStatus.tsx # 마이크 상태 UI
          ModelPopup.tsx # 모델 팝업 UI
          Models.tsx # 모델 UI
          Notification.tsx # 팝업 알림 UI
          Settings.tsx # 환경설정 UI
          Sidebar.tsx # 시스템 사이드바 UI
          Status.tsx # TODO
        hooks/ ## 마이크 입력 및 소켓 연결 관리 디렉토리
          initMicSocket.ts
          useMicInputLevel.ts
          useMicSocket.ts
        store/ ## ASR 시스템 상태 관리용 zustand 스토어 디렉토리
          useMicStore.ts
          useSelectedModelStore.ts
          useTranscriptStore.ts
        types/ ## ASR 기능 타입 정의 디렉토리
          Model.ts
        utils/ ## 공통 유틸리티 함수 디렉토리
          api.ts
          [+] huggingFaceApi.ts # Added
          socket.ts
      llm/ # TODO
      tts/ # TODO
```

---

## 4. 주요 컴포넌트 및 파일 설명

| 컴포넌트/파일 | 역할 |
|:--|:--|
| `AddModel.tsx` | 모델 추가 UI (직접 등록 + HuggingFace 모델 탐색 버튼) |
| `HuggingFaceModelDrawer.tsx` | HuggingFace 모델 리스트 탐색 Drawer |
| `HuggingFaceModelCard.tsx` | 모델 카드 렌더링 (썸네일, 이름, 설명) |
| `huggingFaceApi.ts` | 모델 리스트 fetch + description 자동 생성 |
| `backend/asr/model_manager.py` | ASR 모델 로딩 및 관리 로직 |
| `backend/asr/service.py` | 모델 inference 처리 (socket 연결) |

컴포넌트/파일 | 역할
| `AddModel.tsx` | 모델 추가 UI (직접 등록 + HuggingFace 모델 탐색 버튼 포함)
| `ConfirmPopup.tsx` | 모델 삭제, 변경 등 확인/취소 모달 UI
| `HuggingFaceModelDrawer.tsx` | HuggingFace 모델 리스트 탐색 Drawer UI
| `HuggingFaceModelCard.tsx` | 개별 HuggingFace 모델 카드 렌더링 (썸네일, 이름, 설명)
| `LiveTranscriptPanel.tsx` | 실시간 마이크 음성 전사 결과 패널
| `MicStatus.tsx` | 마이크 연결 상태 및 입력 레벨 UI 표시
| `ModelPopup.tsx` | 모델 세부 정보 조회 및 설정 팝업 UI
| `Models.tsx` | 모델 목록 및 선택 화면 UI
| `Notification.tsx` | 시스템 알림(Notification) UI
| `Settings.tsx` | ASR 시스템 설정(샘플레이트, 소켓 설정 등) 화면 UI
| `Sidebar.tsx` | 시스템 사이드바 메뉴 UI
| `Status.tsx` | (TODO) 시스템 전체 상태(마이크/모델 등) 요약 UI 예정
| `initMicSocket.ts` | 마이크 소켓 연결 초기화 커스텀 훅
| `useMicInputLevel.ts` | 마이크 입력 레벨 측정 커스텀 훅
| `useMicSocket.ts` | 마이크 오디오 스트림을 소켓에 전달하는 훅
| `useMicStore.ts` | 마이크 상태(연결 여부, 입력 레벨 등) zustand 스토어
| `useSelectedModelStore.ts` | 현재 선택된 모델 정보를 관리하는 zustand 스토어
| `useTranscriptStore.ts` | 실시간 전사 결과를 저장하는 zustand 스토어
| `Model.ts` | ASR 모델 타입(TypeScript) 정의 (id, 이름, 경로 등)
| `api.ts` | 일반적인 백엔드 API 통신 유틸
| `huggingFaceApi.ts` | HuggingFace API 연결 및 모델 설명 자동 생성 유틸
| `socket.ts` | WebSocket 통신 유틸리티 모듈
| `backend/asr/model_manager.py` | Whisper(OpenAI) 모델 로딩/관리 Python 모듈
| `backend/asr/service.py` | ASR 모델 inference 및 socket 이벤트 처리 모듈
| `backend/asr/schemas.py` | 백엔드 모델 등록/조회/업데이트용 데이터 스키마 정의
| `backend/asr/socket_handlers.py` | 웹소켓 이벤트 핸들러(마이크 데이터 수신 등)
| `backend/db/config.py` | MongoDB 연결 환경 설정
| `backend/db/database.py` | MongoDB 모델 등록/조회/업데이트 데이터베이스 연동 로직
| `backend/static/icons/` | HuggingFace 및 라이브러리 기본 아이콘 저장 디렉토리

---

## 5. 현재까지 완성된 기능

- ✅ HuggingFace ASR 모델 리스트 가져오기
- ✅ 모델 별 'Transformer.svg' 아이콘 등록
- ✅ 좋아요/다운로드 수 포맷 적용
- ✅ API에서 'Tag' 가져온 뒤 설명 생성
- ✅ 모델 검색 필터링 기능
- ✅ Drawer 오픈/클로즈 애니메이션
- ✅ Floating 닫기 버튼 구현

---

## 6. 남은 기능 및 다음 스텝

- [ ] HuggingFace 모델 Clone 기능 추가 (선택한 모델 git clone)
- [ ] Clone 완료 후 모델 추가 폼 자동 세팅
- [ ] Clone 실패 대비 에러/로딩 처리
- [ ] 전체 등록 프로세스 테스트
- [ ] 실시간 전사 기능 테스트
- [ ] 이후 단계: Status UI 구성 및 로그 UI 구성

---

## 7. 기술 스택
- Electron: 데스크탑 앱 환경 구성
- Next.js + React + TypeScript: 프론트엔드 UI 개발
- FastAPI + Socket.IO: 백엔드 API 및 실시간 통신 구성
- HuggingFace Inference API: 모델 데이터 제공