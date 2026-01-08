# 외국인 유학생 리스크 관리 ERP (FRISK)

네팔 유학생 관리 및 대학교 국제처 리포팅 시스템

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/potensiadev/frisk)

## ✨ 주요 기능

- **학생 관리**: 학생 등록, 동의서 업로드, 상태 관리
- **결석 관리**: 결석 등록, 증빙 파일 업로드, 대학교 자동 알림
- **분기별 점검**: 학생 연락처 확인, 변경 이력 자동 기록
- **월간 리포트**: PDF 형식 출결 보고서 생성
- **감사 로그**: 시스템 접속 및 활동 기록
- **역할 기반 접근 제어**: 관리자 / 유학원 / 대학교

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage + RLS) |
| 이메일 | Resend |
| PDF 생성 | react-pdf |
| 테스트 | Playwright (E2E) |
| 배포 | Vercel |

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/potensiadev/frisk.git
cd frisk
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
RESEND_API_KEY=your-resend-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인하세요.

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── (auth)/            # 인증 페이지 (로그인)
│   ├── (dashboard)/       # 대시보드 페이지
│   │   ├── admin/         # 관리자: 대학/사용자/감사로그
│   │   ├── agency/        # 유학원: 학생/결석/점검
│   │   └── university/    # 대학교: 학생현황/리포트
│   └── api/               # API 라우트
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # UI 기본 컴포넌트
│   ├── forms/            # 폼 컴포넌트 (FileUpload 등)
│   └── dashboard/        # 대시보드 레이아웃
├── lib/                   # 유틸리티
│   ├── supabase/         # Supabase 클라이언트
│   ├── storage/          # 파일 업로드
│   ├── email/            # 이메일 발송
│   ├── pdf/              # PDF 생성
│   └── audit/            # 감사 로그
└── types/                 # TypeScript 타입
```

## 👥 사용자 역할

| 역할 | 접근 경로 | 주요 기능 |
|------|-----------|----------|
| **관리자** (admin) | `/admin` | 전체 관리, 대학/사용자 CRUD, 감사 로그 |
| **네팔 유학원** (nepal_agency) | `/agency` | 학생 관리, 결석 등록, 분기 점검 |
| **대학교 국제처** (university) | `/university` | 소속 학생 조회, 월간 리포트 |

## 🧪 테스트

```bash
# E2E 테스트 실행
npm run test:e2e

# UI 모드로 실행
npm run test:e2e:ui

# 브라우저 보이게 실행
npm run test:e2e:headed
```

## 📋 개발 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint
npm run format       # Prettier
npm run test:e2e     # E2E 테스트
```

## 🔒 보안

- **인증**: Supabase Auth (JWT)
- **권한**: Row Level Security (RLS)
- **파일**: Private Storage + Signed URL
- **헤더**: HSTS, X-Frame-Options 등 적용

자세한 내용은 [SECURITY.md](docs/SECURITY.md) 참조

## 🚢 배포

자세한 배포 가이드는 [DEPLOYMENT.md](docs/DEPLOYMENT.md) 참조

### 빠른 배포 (Vercel)

1. GitHub 저장소를 Vercel에 연결
2. 환경 변수 설정
3. `git push`로 자동 배포

## 📚 문서

| 문서 | 설명 |
|------|------|
| [schema.md](docs/schema.md) | 데이터베이스 스키마 |
| [SECURITY.md](docs/SECURITY.md) | 보안 체크리스트 |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | 배포 가이드 |
| [PRD_v0.1.md](docs/PRD_v0.1.md) | 제품 요구사항 |

## 📄 라이선스

Private - Potensia Dev

---

*Built with ❤️ using Next.js and Supabase*
