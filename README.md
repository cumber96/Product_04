# Product 04

iPhone Shortcuts에서 전달한 오늘의 걸음 수를 웹앱에서 받아 표시하는 기술 PoC.

## 기술 스택

- React + TypeScript + Vite
- 모바일 우선, 이후 PWA로 확장 예정
- Cloudflare Pages 배포 예정

## 개발

```bash
npm install
npm run dev
```

`?steps=6427` 쿼리 파라미터로 걸음 수를 전달하면 화면에 표시됩니다 (예: `/?steps=6427`).

## 구조

```
src/
  features/
    steps/              # 걸음 수 도메인 로직/컴포넌트
      StepsDisplay.tsx
      useStepsFromQuery.ts
  App.tsx
  main.tsx
```

기능 단위 폴더(`features/*`)로 구성해 이후 기능 확장 시 도메인별로 코드를 추가하기 쉽도록 정리했습니다.
