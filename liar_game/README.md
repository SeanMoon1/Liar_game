# 라이어 게임 (React 버전)

거짓말쟁이를 찾아내는 소셜 게임입니다. React + TypeScript + Firebase로 구현되었습니다.

## 🎮 게임 규칙

1. **게임 시작**: 방장이 주제를 선택하고 게임을 시작합니다.
2. **라이어 선정**: 한 명의 플레이어가 랜덤으로 라이어로 선정됩니다.
3. **키워드 배정**: 
   - 일반 플레이어: 모두 같은 키워드를 받습니다
   - 라이어: 비슷하지만 다른 키워드를 받습니다
4. **대화**: 실시간 채팅으로 키워드에 대해 대화합니다.
5. **투표**: 라이어를 찾아내기 위해 투표합니다.
6. **승리 조건**:
   - 일반 플레이어: 라이어를 찾아내면 승리
   - 라이어: 들키지 않으면 승리

## 🚀 기술 스택

- **Frontend**: React 19, TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Backend**: Firebase Realtime Database
- **Deployment**: Firebase Hosting

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Button.tsx
│   └── Input.tsx
├── pages/              # 페이지 컴포넌트
│   ├── HomePage.tsx
│   └── RoomSelectPage.tsx
├── store/              # 상태 관리
│   └── gameStore.ts
├── api/                # Firebase API
│   └── firebase.ts
├── utils/              # 유틸리티 함수
│   └── keywords.ts
├── types/              # TypeScript 타입 정의
│   └── index.ts
├── App.tsx
└── index.tsx
```

## 🛠️ 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. Firebase 설정
1. Firebase Console에서 새 프로젝트 생성
2. Realtime Database 활성화
3. `src/api/firebase.ts` 파일의 설정 정보 업데이트:
   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

### 3. 개발 서버 실행
```bash
npm start
```

### 4. 빌드 및 배포
```bash
npm run build
```

## 🎯 주요 기능

### ✅ 구현 완료
- [x] 홈 화면
- [x] 방 선택 (새 방 만들기 / 기존 방 참가)
- [x] 닉네임 입력 (구조만)
- [x] 대기실 (구조만)
- [x] 주제 선택 (구조만)
- [x] 게임 진행 (구조만)
- [x] 투표 (구조만)
- [x] 결과 화면 (구조만)
- [x] Firebase 연동
- [x] 상태 관리 (Zustand)
- [x] TypeScript 타입 정의

### 🚧 구현 예정
- [ ] 닉네임 입력 기능
- [ ] 대기실 실시간 플레이어 목록
- [ ] 주제 선택 및 게임 시작
- [ ] 실시간 채팅
- [ ] 투표 시스템
- [ ] 게임 결과 계산
- [ ] 방 코드 복사 기능

## 🔧 개발 환경 설정

### 필수 요구사항
- Node.js 16+
- npm 또는 yarn

### 권장 개발 도구
- VS Code
- React Developer Tools
- Firebase CLI

## 📝 주제 및 키워드

게임에서 사용되는 주제들:
- **정치**: 대통령, 국회, 정부, 민주주의, 선거, 정책, 법률, 외교
- **경제**: 주식, 은행, 투자, 경제, 금융, 부동산, 무역, 인플레이션
- **역사**: 고조선, 삼국시대, 고려, 조선, 일제강점기, 독립운동, 6.25전쟁, 민주화
- **상식**: 지구, 태양, 달, 별, 우주, 은하수, 행성, 소행성
- **문화**: 한복, 김치, 태권도, 판소리, 한글, 불교, 유교, 전통
- **동물**: 호랑이, 곰, 사자, 코끼리, 기린, 팬더, 펭귄, 고래
- **식물**: 소나무, 벚꽃, 장미, 해바라기, 튤립, 국화, 난초, 수국
- **게임**: 롤, 오버워치, 마인크래프트, 포켓몬, 피파, 배틀그라운드, 스타크래프트, 디아블로
- **영화**: 아바타, 타이타닉, 스타워즈, 해리포터, 반지의제왕, 인터스텔라, 인셉션, 어벤져스
- **음악**: BTS, 블랙핑크, 아이유, 싸이, 빅뱅, 소녀시대, 엑소, 레드벨벳

## 🔒 보안 주의사항

- Firebase API 키는 절대 GitHub에 커밋하지 마세요
- `.env` 파일을 사용하여 환경변수 관리
- Firebase 보안 규칙 설정 필수

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
