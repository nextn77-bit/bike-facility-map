# 🚴 자전거 편의시설 지도 | Bike Facility Map

전국 자전거 공기주입기, 대여소 위치를 한눈에 확인하는 지도 서비스

## 기술 스택

- React 18 + Vite
- react-leaflet (지도)
- 생활안전지도 WMS (공기주입기/자전거길 레이어)
- 공공데이터 포털 API (자전거 대여소)
- GitHub Pages (배포)

## 로컬 실행

```bash
npm install
npm run dev
```

## 배포

### GitHub Pages 자동 배포 (권장)
`main` 브랜치에 push하면 GitHub Actions가 자동으로 배포합니다.

1. GitHub → Settings → Pages → Source: **GitHub Actions** 선택
2. `vite.config.js`의 `base`를 본인 repo 이름으로 수정

### 수동 배포
```bash
npm run build
npm run deploy
```

## API 키 설정

1. [공공데이터 포털](https://www.data.go.kr) 회원가입
2. `전국자전거대여소표준데이터` 활용 신청
3. 서비스 키 발급 후 앱 상단 🔑 버튼에서 입력

## 데이터 출처

- 자전거 대여소: 공공데이터 포털 `전국자전거대여소표준데이터`
- 공기주입기/자전거길: 행정안전부 생활안전지도 WMS
