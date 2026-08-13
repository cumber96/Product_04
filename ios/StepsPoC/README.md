# StepsPoC

HealthKit `HKStatisticsQuery(.cumulativeSum)`으로 조회한 오늘 걸음 수가
Apple 건강 앱 표시값과 일치하는지만 확인하는 최소 SwiftUI 앱.

Product 04 PWA와는 연결되어 있지 않다. 정확도 검증 전용.

## 파일

- `StepsPoCApp.swift` — 앱 진입점
- `ContentView.swift` — 걸음 수 표시 화면, 새로고침 버튼
- `HealthKitManager.swift` — 권한 요청 + `HKStatisticsQuery` 조회

## Xcode 프로젝트 만들기 (Mac에서)

이 저장소에는 `.xcodeproj`가 없다 (Linux 환경이라 Xcode로 생성/검증 불가).
Xcode의 SwiftUI App 템플릿으로 새 프로젝트를 만들고 이 파일들로 교체한다.

1. Xcode → File → New → Project → iOS → App
2. 설정값:
   - Product Name: `StepsPoC`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: None (Core Data 체크 해제)
   - Include Tests: 체크 해제해도 무방
3. 프로젝트 생성 후, 템플릿이 만든 `StepsPoCApp.swift`, `ContentView.swift`를
   이 폴더의 동일 파일 내용으로 교체
4. 이 폴더의 `HealthKitManager.swift`를 프로젝트에 새 파일로 추가
   (File → Add Files to "StepsPoC"...)

## HealthKit capability 추가

1. 프로젝트 네비게이터에서 프로젝트 선택 → TARGETS → StepsPoC
2. **Signing & Capabilities** 탭 → `+ Capability` → **HealthKit** 추가
   - 이 단계에서 `StepsPoC.entitlements` 파일이 자동 생성되고
     `com.apple.developer.healthkit = true`가 들어간다
   - "Clinical Health Records" 등 하위 옵션은 체크하지 않는다 (걸음 수만 필요)

## Info.plist — 권한 문구 추가

**Info** 탭 (또는 `Info.plist`)에 아래 키를 추가:

| Key | Value |
|---|---|
| `Privacy - Health Share Usage Description` (`NSHealthShareUsageDescription`) | 오늘 걸음 수를 확인하기 위해 건강 데이터를 읽습니다. |

`NSHealthShareUsageDescription`이 없으면 권한 요청 시 앱이 즉시 크래시한다.

## 서명 (개인 기기 설치)

1. **Signing & Capabilities** 탭 → Team에 본인 Apple ID 선택
   (무료 Apple ID로 충분 — 단, 7일마다 Xcode로 재설치 필요)
2. Bundle Identifier는 고유하게 (예: `com.yourname.stepspoc`)

## 빌드 결과

- 시뮬레이터: **비추천/거의 무의미** — 실제 Health 앱 데이터와 비교가 목적이므로
  반드시 실기기로 테스트해야 한다
- 실기기 빌드는 위 서명 설정만 되어 있으면 Xcode에서 device 선택 후 Run(⌘R)으로 바로 됨

## 실제 iPhone에서 테스트하는 방법

1. iPhone을 Mac에 USB(또는 같은 Wi-Fi로 무선 디버깅) 연결
2. Xcode 상단 device selector에서 본인 iPhone 선택
3. ⌘R로 실행
4. 최초 실행 시 "건강 데이터 접근 허용" 시스템 시트가 뜸 → 걸음 수(Step Count) **읽기(Read)** 허용
   - 만약 아무 시트도 안 뜨고 바로 에러가 나면: 설정 → 개인정보 보호 및 보안 → 건강
     → StepsPoC에서 권한이 거부되어 있는지 확인 (거부된 경우 앱 삭제 후 재설치해야
     시트가 다시 뜬다 — iOS 정책상 앱이 스스로 권한 설정 화면을 열 수는 없음)
5. 화면에 뜬 숫자와 iPhone Health 앱 → 오늘 요약 → 걸음 수를 **같은 시각 기준으로** 비교
6. 필요하면 새로고침 버튼으로 재조회

일치 여부만 확인하면 이 PoC의 목적은 끝. 다음 단계(PWA 연동)는 여기서 숫자가
Health 앱과 맞는 것을 실기기에서 확인한 뒤에 진행.

## MVP 브랜딩 정리 (앱 이름 / 아이콘)

이 저장소에는 실제 `.xcodeproj`가 없고(Mac에만 존재), 앱 이름·Bundle ID 같은
프로젝트 설정값은 Swift 소스 파일이 아니라 Xcode 프로젝트 설정 안에 들어있다.
따라서 아래 항목은 **Mac의 Xcode에서 직접 변경**해야 한다 — 이 저장소의 파일을
고쳐서 자동 반영되는 부분이 아니다.

### 앱 표시 이름 (Display Name)

1. 프로젝트 네비게이터 → 프로젝트 선택 → TARGETS → StepsPoC
2. **General** 탭 → Identity 섹션 → **Display Name** 필드에 `Product 04` 입력
   (비어 있으면 Build Settings에서 `INFOPLIST_KEY_CFBundleDisplayName` 검색해도 동일 필드)

이 한 곳만 바꾸면 아래 두 곳에 모두 반영된다 (별도로 손댈 필요 없음):
- 홈 화면 아이콘 아래 표시되는 이름
- HealthKit 권한 요청 시스템 시트에 뜨는 앱 이름 ("Product 04이(가) 건강 데이터
  접근을 요청합니다" 형태) — 이 시트는 앱의 Display Name을 그대로 가져다 쓰므로
  별도 설정이 없다

Bundle Identifier, Product Name(내부 타깃/스킴 이름)은 그대로 둔다 — 사용자에게
보이지 않고, 바꾸면 서명/재설치가 꼬일 수 있다.

### 앱 아이콘

기존 Product 04 PWA 아이콘(`public/icons/icon-512.png`)을 1024×1024로 업스케일한
파일을 이 폴더에 준비해뒀다:

```
ios/StepsPoC/AppIcon.appiconset/
├── Contents.json
└── AppIcon-1024.png
```

`Contents.json`은 Xcode 14+ 신규 프로젝트가 기본으로 쓰는 "단일 사이즈(1024×1024)"
AppIcon 포맷이다. Xcode 프로젝트가 이 포맷이면:

1. Finder에서 `AppIcon.appiconset` 폴더 전체를 Xcode 프로젝트의
   `Assets.xcassets` 안 기존 `AppIcon.appiconset`에 덮어쓰기(또는 기존 걸 지우고
   이 폴더를 `Assets.xcassets`로 드래그)

프로젝트가 구형 다중 사이즈 포맷(20/29/40/60/76/83.5/1024pt별 슬롯이 여러 개)이면:
1. `Assets.xcassets` → `AppIcon` 선택
2. "App Store" 1024×1024 슬롯에 `AppIcon-1024.png`만 드래그해서 채운다
   (나머지 슬롯은 MVP 개인 설치 단계에서는 비어 있어도 빌드/설치에 지장 없음 —
   Xcode가 경고만 띄울 수 있고, 아이콘이 필요한 자리는 Xcode가 자동으로
   1024 원본을 리사이즈해서 채워주는 최신 프로젝트 포맷이면 이 단계 자체가 불필요)

새로운 디자인 작업은 하지 않았다 — 기존 PWA 아이콘을 그대로 확대한 것.
