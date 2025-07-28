# 📌 프로젝트명: [Liar Game - 실시간 멀티플레이어 게임]

> 이 프로젝트는 [React/TypeScript/Firebase] 기술을 활용한 실시간 멀티플레이어 라이어 게임입니다.  
> 실시간 데이터 동기화와 사용자 인터랙션을 통해 온라인 게임 개발 경험을 목표로 하였습니다.

---

## 📆 프로젝트 기간

- 시작일: 2024.12.20
- 종료일: 2024.12.21

---

## 🎯 주요 목표

- ✅ [핵심 기능1: 실시간 멀티플레이어 방 시스템 구현]
- ✅ [핵심 기능2: Firebase Realtime Database를 활용한 실시간 데이터 동기화]
- ✅ [핵심 기능3: React + TypeScript + Zustand를 활용한 상태 관리]
- ✅ [핵심 기능4: 반응형 웹 디자인과 사용자 경험 최적화]

---

## ⚙️ 사용 기술 스택

| 분류     | 기술명                            |
|--------|----------------------------------|
| 프론트엔드 | React, TypeScript, CSS3 |
| 상태 관리 | Zustand |
| 백엔드/DB | Firebase Realtime Database |
| 배포 | Firebase Hosting |
| 개발 도구 | Vite, ESLint, Prettier |

---

## 🧱 프로젝트 구조

```bash
📁 liar_game/
├── src/
│   ├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── pages/              # 게임 화면별 페이지 컴포넌트
│   ├── store/              # Zustand 상태 관리
│   ├── api/                # Firebase API 연동
│   ├── utils/              # 유틸리티 함수
│   └── types/              # TypeScript 타입 정의
├── public/                 # 정적 파일
├── database.rules.json     # Firebase 보안 규칙
├── firebase.json          # Firebase 설정
└── package.json           # 프로젝트 의존성
```

---

## 💡 주요 기능 설명

### ✨ 기능 1: [실시간 멀티플레이어 방 시스템]

* 6자리 랜덤 방 코드 생성 및 공유
* 실시간 플레이어 입장/퇴장 동기화
* 방장 권한 관리 및 게임 시작 제어

### 🌐 기능 2: [Firebase 실시간 데이터 동기화]

* Firebase Realtime Database를 활용한 실시간 채팅
* 실시간 투표 시스템 및 결과 동기화
* 최적화된 데이터 구조로 비용 효율성 확보

### 🎮 기능 3: [라이어 게임 로직]

* 라이어/일반 플레이어 역할 분배
* 키워드 추측 시스템
* 플레이어별 발언 순서 관리
* 투표 시스템 및 결과 표시

### 📱 기능 4: [반응형 UI/UX]

* 모바일/데스크톱 반응형 디자인
* 실시간 채팅 및 메시지 관리
* 직관적인 게임 진행 인터페이스

---

## 🖼️ 데모 화면

| 주요 화면 | 설명                      |
| ----- | -------------------------- |
| 홈 화면  | 게임 시작 및 방 참여 선택 |
| 대기실 | 플레이어 목록 및 게임 시작 |
| 게임 화면 | 실시간 채팅 및 키워드 표시 |
| 투표 화면 | 투표 시스템 및 결과 표시 |

---

## 🧠 회고 요약

* 어려웠던 점: Firebase 보안 규칙 설정과 실시간 데이터 동기화 최적화 과정에서 `PERMISSION_DENIED` 오류가 발생하여 해결 과정을 공부하게 됨
* 배운 점: React + TypeScript + Zustand 조합으로 상태 관리하는 방법, Firebase Realtime Database의 실시간 구독 패턴 이해
* 개선하고 싶은 점: 게임 로직을 더욱 정교하게 구현하고, 애니메이션 효과를 추가하여 사용자 경험을 향상시키고 싶음

---

## 📦 배포 주소

* Firebase Hosting
* `https://liar-game-f0259.web.app`

---

## 🙋‍♀️ 개발자

| 이름  | GitHub                                           |
| --- | ------------------------------------------------ |
| 문승연 | [github.com/SeanMoon1](https://github.com/SeanMoon1) |

---

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 프로덕션 빌드
npm run build

# Firebase 배포
firebase deploy
```

---

## 🔧 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_DATABASE_URL=your_database_url
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```
