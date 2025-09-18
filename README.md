# 🇩🇪 독일어-한국어 번역기 🇰🇷

모바일 웹에 최적화된 독일어-한국어 실시간 번역기입니다. 카메라를 통해 독일어 텍스트를 인식하고 한국어로 번역합니다.

## ✨ 주요 기능

- 📷 **실시간 카메라 번역**: 모바일 카메라로 독일어 텍스트를 실시간으로 인식하고 번역
- 🔍 **OCR 텍스트 인식**: Tesseract.js를 사용한 고정밀 독일어 텍스트 인식
- 🌐 **Google Translate API**: 정확한 독일어-한국어 번역
- 📸 **사진 촬영 및 저장**: 번역 결과와 함께 사진을 저장
- 📱 **모바일 최적화**: 터치 친화적인 반응형 디자인
- 💾 **로컬 저장**: 번역 기록을 브라우저에 자동 저장
- 🚀 **PWA 지원**: 앱처럼 설치 가능한 웹 애플리케이션

## 🚀 사용법

### 1. 카메라 시작
- "📷 카메라 시작" 버튼을 클릭
- 카메라 접근 권한 허용
- 후면 카메라가 자동으로 활성화됩니다

### 2. 실시간 번역
- 카메라가 시작되면 5초마다 자동으로 독일어 텍스트를 인식
- 인식된 텍스트가 실시간으로 번역되어 테이블에 표시
- 번역 결과는 시간순으로 정렬됩니다

### 3. 사진 촬영 및 저장
- "📸 사진 촬영" 버튼을 클릭
- 현재 화면이 캡처되고 독일어 텍스트가 번역됩니다
- 사진과 번역 결과가 함께 저장됩니다

### 4. 저장된 번역 보기
- 하단의 "저장된 번역" 섹션에서 이전 번역 기록을 확인
- 각 사진과 함께 독일어-한국어 매칭 결과를 볼 수 있습니다

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **OCR**: Tesseract.js (독일어 지원)
- **번역 API**: Google Translate API
- **카메라**: WebRTC getUserMedia API
- **저장소**: LocalStorage
- **PWA**: Service Worker, Web App Manifest

## 📱 모바일 최적화

- **반응형 디자인**: 모든 화면 크기에 최적화
- **터치 친화적**: 큰 버튼과 직관적인 UI
- **성능 최적화**: 빠른 로딩과 부드러운 애니메이션
- **오프라인 지원**: PWA 기능으로 네트워크 없이도 기본 기능 사용 가능

## 🔧 설치 및 실행

### 로컬 서버 실행
```bash
# Python 3 사용
python -m http.server 8000

# Node.js 사용
npx http-server

# PHP 사용
php -S localhost:8000
```

### 브라우저에서 접속
```
http://localhost:8000
```

## 🚀 Vercel 배포 (권장)

### 1. GitHub 저장소 생성
```bash
# Git 초기화
git init

# GitHub 저장소 생성 후
git remote add origin https://github.com/your-username/german-korean-translator.git

# 파일들 추가
git add .

# 커밋
git commit -m "Initial commit: German-Korean Translator"

# GitHub에 푸시
git push -u origin main
```

### 2. Vercel 배포
1. [Vercel](https://vercel.com) 계정 생성 (GitHub 연동)
2. "New Project" 클릭
3. GitHub 저장소 선택: `german-korean-translator`
4. "Import" 클릭
5. 프로젝트 설정:
   - **Framework Preset**: `Other`
   - **Build Command**: (비워두기)
   - **Output Directory**: `./`
6. "Deploy" 클릭

### 3. 환경 변수 설정 (선택사항)
Vercel 대시보드에서 환경 변수 추가:
- `REACT_APP_SUPABASE_URL`: `https://lpcsklsszksgrjfttglf.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. 배포 완료
배포 완료 후 다음과 같은 URL이 생성됩니다:
```
https://german-korean-translator.vercel.app
```

## 🗄️ Supabase 설정 (데이터 저장용)

### 1. Supabase 프로젝트 생성
1. [Supabase](https://supabase.com) 웹사이트 방문
2. GitHub 계정으로 로그인
3. 새 프로젝트 생성: `german-korean-translator`
4. 리전: `Northeast Asia (Seoul)` 선택

### 2. 데이터베이스 설정
1. Supabase 대시보드에서 "SQL Editor" 클릭
2. `cloud-schema.sql` 파일 내용 복사하여 실행
3. "Settings" → "API"에서 URL과 키 복사

### 3. 설정 파일 업데이트
`script-extended.js` 파일에서 실제 값으로 교체:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co', // 실제 URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // 실제 키
};
```

## 🌐 다른 배포 옵션

### Netlify 배포
1. [Netlify](https://netlify.com)에서 GitHub 저장소 연결
2. 빌드 설정: 빌드 명령 없음, 퍼블리시 디렉토리: `/`
3. 환경 변수 설정

### GitHub Pages 배포
1. GitHub 저장소 → Settings → Pages
2. Source: Deploy from a branch
3. Branch: main
4. 폴더: / (root)

## 📋 요구사항

- **모바일 브라우저**: Chrome, Safari, Firefox (최신 버전)
- **카메라 권한**: 카메라 접근 권한 필요
- **인터넷 연결**: 번역 API 사용을 위해 필요
- **HTTPS**: 프로덕션 환경에서는 HTTPS 필수 (카메라 접근을 위해)

## 🎯 사용 시나리오

1. **여행 중**: 독일어 표지판, 메뉴판, 안내문 번역
2. **학습**: 독일어 텍스트 학습 및 번역 연습
3. **업무**: 독일어 문서나 이메일 번역
4. **일상**: 독일어 상품 설명서나 설명서 번역

## 🔒 개인정보 보호

- 모든 번역 데이터는 로컬 브라우저에만 저장됩니다
- 외부 서버로 개인 데이터가 전송되지 않습니다
- 번역 API 사용 시에만 텍스트가 Google로 전송됩니다

## 🐛 문제 해결

### 카메라가 작동하지 않는 경우
- 브라우저에서 카메라 권한을 허용했는지 확인
- HTTPS 환경에서 실행하고 있는지 확인
- 다른 앱에서 카메라를 사용 중인지 확인

### 번역이 되지 않는 경우
- 인터넷 연결 상태 확인
- 독일어 텍스트가 명확하게 보이는지 확인
- 텍스트 크기와 대비가 충분한지 확인

### OCR 인식률이 낮은 경우
- 카메라를 텍스트에 더 가깝게 이동
- 조명을 충분히 확보
- 텍스트가 수평으로 정렬되도록 조정

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 🤝 기여하기

버그 리포트, 기능 제안, 코드 기여를 환영합니다!

---

**개발자**: AI Assistant  
**버전**: 1.0.0  
**최종 업데이트**: 2024년
