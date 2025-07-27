# Liar Game

실시간 멀티플레이어 라이어 게임입니다.

## 🎮 게임 규칙

1. **게임 시작**: 방장이 주제를 선택하고 게임을 시작합니다.
2. **역할 배정**: 한 명이 라이어로 선정되고, 나머지는 일반 플레이어가 됩니다.
3. **키워드 배정**: 일반 플레이어들은 같은 키워드를 받고, 라이어는 다른 키워드를 받습니다.
4. **채팅**: 모든 플레이어가 키워드에 대해 대화합니다.
5. **투표**: 라이어로 의심되는 플레이어를 투표합니다.
6. **결과**: 라이어가 지목되면 시민 승리, 그렇지 않으면 라이어 승리입니다.

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase Realtime Database
- **State Management**: Zustand
- **Deployment**: Firebase Hosting

## 📁 프로젝트 구조

```
src/
├── components/     # 재사용 가능한 컴포넌트
├── pages/         # 페이지 컴포넌트
├── store/         # Zustand 상태 관리
├── api/           # Firebase API 함수
├── utils/         # 유틸리티 함수
└── types/         # TypeScript 타입 정의
```

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. 개발 서버 실행
```bash
npm start
```

### 4. 빌드
```bash
npm run build
```

### 5. Firebase 배포
```bash
firebase deploy
```

## 🔧 Firebase 설정

1. Firebase Console에서 새 프로젝트를 생성합니다.
2. Realtime Database를 활성화합니다.
3. Hosting을 설정합니다.
4. 환경 변수에 Firebase 설정 값을 입력합니다.

## 🔒 보안

- API 키는 환경 변수로 관리됩니다.
- `.env` 파일은 `.gitignore`에 포함되어 GitHub에 업로드되지 않습니다.
- Firebase 보안 규칙이 설정되어 있습니다.

## 📝 주의사항

- `.env` 파일을 직접 생성해야 합니다.
- Firebase 프로젝트 설정이 필요합니다.
- 환경 변수는 `REACT_APP_` 접두사로 시작해야 합니다.

## 🎯 주요 기능

- ✅ 실시간 멀티플레이어 게임
- ✅ 방 생성 및 참가
- ✅ 실시간 채팅
- ✅ 투표 시스템
- ✅ 게임 결과 표시
- ✅ 반응형 디자인
