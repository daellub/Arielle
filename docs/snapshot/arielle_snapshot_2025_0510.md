
# Arielle 프로젝트: 멀티모달 관리 시스템 (중간 스냅샷)

## 📅 스냅샷 날짜  
2025-05-10

---

## 1. 프로젝트 전체 목표

Project Arielle은  
**ASR → LLM → Translate → TTS → VRM**으로 이어지는  
**멀티모달 시스템**을 구축하는 것을 목표로 합니다.

각각 ASR 모델을 통한 실시간 입력, LLM 모델을 통한 답변 출력 및 번역, TTS 모델을 통한 답변 생성과 Talking Head를 사용한 상호작용 시스템 구현, 그리고 이를 통합 관리하는 UI 체계를 포함합니다.

---

## 2. 이번 작업 범위 (업데이트 포인트)

- **ASR 모델 다운로드 및 등록 기능 완성**
- **시스템 상태(Status) 및 로그(Log) UI 구성**
- **번역 패널 및 통계 시각화 UI 기초 구현**
- **번역 API 연동 및 백엔드 라우터 정비**

---

## 3. 현재 프로젝트 구조

```
backend/
  asr/
    model_manager.py
    models.py              # [New] DB 모델 정의
    routes/
      asr_status.py        # [New] ASR 상태 확인 API
      hardware_info.py     # [New] 시스템 하드웨어 정보 API
      logs.py              # [New] 로그 데이터 조회 API
    schemas.py
    service.py
    socket_handlers.py
  db/
    config.py
    database.py
  llm/
    api.py                 # [New] LLM API
  translate/
    api.py                 # [New] 번역 API
    service.py             # [New] 번역 처리 로직
    routes/
      asr.py               # [New] 번역 관련 라우터
      llm.py               # [Deprecated]
      translate.py         # [New] 번역 API 라우터
  utils/
    device_resolver.py     # [New] 하드웨어 감지 유틸
    encryption.py          # [New] 암복호화 유틸
  static/icons/            # 다양한 출처별 모델 아이콘

renderer/
  app/
    asr/features/
      components/
        AddModel.tsx
        ConfirmPopup.tsx
        DownloadContext.tsx            # [New]
        DownloadPanel.tsx              # [New]
        DownloadPanel.module.css       # [New]
        HuggingFaceModelCard.tsx
        HuggingFaceModelDrawer.tsx
        LiveTranscriptPanel.tsx
        MicStatus.tsx
        ModelInfoPopup.tsx             # [New]
        ModelPopup.tsx
        Models.tsx
        Notification.tsx
        Settings.tsx
        Sidebar.tsx
        Status.tsx
        StatusFetcher.tsx              # [New]
        SystemLog.tsx                  # [New]
        SystemLog.module.css           # [New]
        LogSearchBar.tsx               # [New]
        LogSearchBar.module.css        # [New]
      hooks/
        initMicSocket.ts
        useMicInputLevel.ts
        useMicSocket.ts
      store/
        useMicStore.ts
        useSelectedModelStore.ts
        useTranscriptStore.ts
        useSystemStatusStore.ts        # [New]
      types/
        Model.ts
      utils/
        api.ts
        huggingFaceAPI.ts
        socket.ts
    translate/features/
      components/
        TranslatePanel.tsx             # [New]
        TranslateCard.tsx              # [New]
        TranslateHistoryList.tsx       # [New]
        TranslateAnalyticsPanel.tsx    # [New]
        charts/PieChartClient.tsx      # [New]
        ui/AnimatedNumber.tsx          # [New]
      utils/
        ExportDropdown.tsx             # [New]
    components/ui/
      CompareModal.tsx                 # [New]
      Notification.tsx
      RecordingStatusIndicator.tsx     # [New]
      Sidebar.tsx
      tooltip.tsx                      # [New]
    store/
      useNotificationStore.ts          # [New]
      useRecordingStore.ts             # [New]
    pages/
      ASRPage.tsx
      TranslatePage.tsx
      HomePage.tsx
    globals.css
    layout.tsx
    page.tsx
```

---

## 4. 새로 추가된 주요 컴포넌트/파일 요약

| 컴포넌트/파일 | 역할 |
|:--|:--|
| `DownloadContext.tsx`, `DownloadPanel.tsx` | 모델 다운로드 상태 표시 및 패널 UI |
| `StatusFetcher.tsx`, `SystemLog.tsx` | 시스템 상태 주기적 fetch 및 로그 출력 UI |
| `useSystemStatusStore.ts` | 마이크, 모델, 하드웨어 상태 관리 zustand 스토어 |
| `TranslatePanel.tsx`, `TranslateAnalyticsPanel.tsx` | 번역 기능 및 통계 시각화 패널 |
| `PieChartClient.tsx`, `AnimatedNumber.tsx` | 번역 통계 시각화 차트 및 숫자 애니메이션 |
| `translate/api.py`, `translate/service.py` | 번역 처리 및 DB 저장 백엔드 로직 |
| `translate/routes/` | 번역, LLM 관련 API 라우터 구성 |
| `asr/routes/` | ASR 상태, 하드웨어 정보, 로그 조회 API |
| `llm/api.py` | LLM 응답 처리용 백엔드 모듈 |
| `device_resolver.py` | CPU/NPU 등 하드웨어 정보 감지 |
| `CompareModal.tsx` | 번역 결과 간 비교용 모달 컴포넌트 |

---

## 5. 현재까지 완성된 기능

- ✅ HuggingFace 모델 탐색 및 등록
- ✅ 모델 다운로드 및 상태 표시 기능
- ✅ 실시간 전사 결과 UI
- ✅ 마이크 상태 및 장치 감지 시스템
- ✅ 모델 로그 저장 및 필터링 UI
- ✅ 번역 API 및 결과 저장
- ✅ 번역 기록 조회 및 카드 UI
- ✅ 번역 통계 시각화 차트

---

## 6. 다음 스텝 (예정 기능)

- [ ] LLM 피드백 시스템 연동 (MCP 기반)
- [ ] Translate → TTS 연결 및 결과 음성화
- [ ] VRM 연동 기반 Talking Head UI
- [ ] 사용자 성향 기반 메모리 피드백 기능
- [ ] 전체 파이프라인 통합 테스트

---

## 7. 기술 스택

- **Electron + Next.js + TypeScript**: 프론트 데스크탑 환경 및 UI
- **FastAPI + Socket.IO**: 실시간 서버 및 REST API 구성
- **MongoDB**: 전사 결과 및 번역 기록 저장
- **HuggingFace Inference API**: ASR/LLM 모델 연결
- **Azure Translator API**: 실시간 번역 처리
- **zustand**: 전역 상태 관리
