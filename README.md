# 🎨 세상의 모든 색깔 (Colors of the World)

> 이미지 속 색을 추출하고, 나만의 색상 카드를 만드는 웹 앱

이미지를 업로드하면 핵심 색상을 자동으로 뽑아 **HEX · RGB · CMYK · 비율**로 보여주고,
원하는 색을 골라 텍스트·이모지를 더한 **색상 카드**까지 만들어 다운로드할 수 있습니다.

🔗 **사용해 보기 : [chichiboo123.github.io/cow](https://chichiboo123.github.io/cow/)**

---

## ✨ 주요 기능

### 🖼️ 이미지에서 색상 추출
- **드래그 & 드롭**, **클릭하여 파일 선택**, **클립보드 붙여넣기(Ctrl+V)** 지원
- 지원 형식 : `PNG` · `JPG` · `JPEG` · `WEBP` · `GIF`
- 추출할 색상 개수를 **1 ~ 20개**까지 슬라이더/입력으로 조절
- 각 색상의 **HEX · RGB · 비율(%)** 표시, 확장 정보로 **CMYK**까지 확인
- **비율 높은 순** 또는 **비슷한 색끼리** 정렬
- HEX / RGB 코드 **원클릭 복사**

### 🪪 색상 카드 만들기
- 추출된 색 중 원하는 색을 골라 카드 배경으로 사용
- 배경 레이아웃 : **가로·세로 분할**, **가로·세로·대각선 그라데이션**
- **텍스트 · 이모지 요소** 자유롭게 추가하고 **드래그로 위치 이동**
- 17종의 **한글 폰트**, 글자 색상·크기 지정, 카드에 색상 코드 표시 옵션
- 완성한 카드를 **JPG 다운로드** 또는 **클립보드 복사**

### 🌍 그 외
- **한국어 · English · 日本語** 다국어 지원 (선택값 저장)
- **라이트 / 다크 모드** (시스템 설정 자동 감지 + 선택값 저장)
- **모바일 반응형** UI

---

## 🛠️ 기술 스택

| 분류 | 사용 기술 |
| --- | --- |
| 프레임워크 | React 19 · TypeScript |
| 빌드 도구 | Vite 8 |
| 스타일 | Tailwind CSS 4 |
| 색상 추출 | [ColorThief](https://github.com/lokesh/color-thief) |
| 다국어 | i18next · react-i18next |
| 배포 | GitHub Pages (GitHub Actions) |

---

## 🚀 로컬에서 실행하기

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행 (http://localhost:5173/cow/)
npm run dev

# 3. 프로덕션 빌드
npm run build

# 4. 빌드 결과 미리보기
npm run preview

# 코드 린트
npm run lint
```

> ℹ️ Vite `base`가 `/cow/`로 설정되어 있어 개발 서버 주소에도 `/cow/` 경로가 붙습니다.

---

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── ImageUploader.tsx     # 이미지 업로드 (드롭/클릭/붙여넣기)
│   ├── ColorPalette.tsx      # 추출 색상 목록 · 정렬 · 카드 모드
│   ├── ColorCard.tsx         # 개별 색상 카드 (HEX/RGB/CMYK/복사)
│   ├── CardMakerModal.tsx    # 색상 카드 제작 모달
│   ├── LanguageSwitcher.tsx  # 언어 선택
│   └── emojiData.ts          # 이모지 카테고리 데이터
├── hooks/
│   ├── useColorExtraction.ts # ColorThief 기반 색상 추출 로직
│   └── useClipboardPaste.ts  # 클립보드 이미지 붙여넣기
├── i18n/
│   └── locales/              # ko · en · ja 번역
├── App.tsx
└── index.css
```

---

## 🌐 배포

`main` 브랜치에 푸시되면 **GitHub Actions**가 자동으로 빌드 후 **GitHub Pages**에 배포합니다.
(워크플로 : [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))

---

## 👩‍🏫 만든 사람

**교육뮤지컬 꿈꾸는 치수쌤**

🔗 [litt.ly/chichiboo](https://litt.ly/chichiboo)
