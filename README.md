# PageHub

학생과 선생님을 위한 교육 커뮤니티 플랫폼

## 기술 스택

### Frontend
- React 18
- TypeScript
- Vite
- React Router DOM
- Zustand (상태 관리)

### Backend
- Node.js
- Express
- TypeScript
- MongoDB (Mongoose)
- Socket.io (실시간 통신)
- JWT (인증)
- Multer (파일 업로드)

## 프로젝트 구조

```
PageHub/
├── client/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/        # 재사용 가능한 컴포넌트
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── services/          # API 서비스
│   │   ├── hooks/             # 커스텀 훅
│   │   ├── store/             # Zustand 상태 관리
│   │   ├── types/             # TypeScript 타입 정의
│   │   ├── constants/         # 상수 정의
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/                    # Express 백엔드
│   ├── src/
│   │   ├── models/            # MongoDB 모델
│   │   ├── routes/            # 라우트 정의
│   │   ├── controllers/       # 컨트롤러
│   │   ├── services/          # 비즈니스 로직
│   │   ├── middleware/        # 미들웨어 (인증, 에러 핸들링)
│   │   ├── utils/             # 유틸리티 함수
│   │   ├── config/            # 설정 파일
│   │   ├── types/             # TypeScript 타입 정의
│   │   └── index.ts           # 서버 진입점
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 시작하기

### 환경 변수 설정

1. `server/.env.example`을 참고하여 `server/.env` 파일 생성
2. `client/.env.example`을 참고하여 `client/.env` 파일 생성

### 설치 및 실행

#### 백엔드
```bash
cd server
npm install
npm run dev
```

#### 프론트엔드
```bash
cd client
npm install
npm run dev
```

## 개발 환경

- Node.js 18+
- MongoDB 6+
