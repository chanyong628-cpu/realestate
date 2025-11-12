# 🏢 Real Estate HUB Info (건축물정보 통합조회)

이 웹앱은 **국토교통부 건축HUB 오픈API**와 **행정안전부 법정동코드 API**를 이용해  
주소를 입력하면 건축물대장 기본정보, 층별정보, 위반건축물 여부를 실시간으로 조회합니다.

## 🔧 구성
- index.html : UI
- style.css : 디자인
- script.js : API 호출 및 로직
- vercel.json : Vercel 배포 설정

## 🚀 실행방법
1. 공공데이터포털에서 `건축HUB_건축물대장정보 서비스` API키를 발급받습니다.
2. script.js 내 `serviceKey`에 복사해 넣습니다.
3. Vercel 계정에서 **New Project → Upload folder → Deploy** 클릭.
4. 자동으로 도메인(URL)이 생성됩니다.
