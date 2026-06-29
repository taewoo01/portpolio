# Development Rules

## Response Style

* Only output changed code
* Return minimal diff
* Be concise
* Do not explain unless asked
* Keep responses implementation-focused

## Architecture

* Preserve existing architecture
* Avoid unnecessary refactors
* Do not rename files unless required
* Prefer incremental changes
* Keep folder structure consistent

## Code Quality

* Keep code production-ready
* Avoid duplicated logic
* Prefer readable and maintainable code
* Avoid placeholder implementations
* Ask before introducing dependencies

## Performance

* Optimize Flutter rebuilds
* Optimize GIS and map rendering
* Keep API and DB queries efficient

## Data Integrity

* Avoid fake mock data unless requested
* Preserve API abstraction layers
* Keep database schema scalable


## Design Guide

* 참고 레퍼런스: Toss (toss.im) 스타일
* 톤: 깔끔하고 미니멀, 군더더기 없음
* 컬러: Primary #3182F6 (Toss Blue), 배경 흰색/회색 계열
* 타이포: Pretendard, 크기 위계 명확하게
* 간격: 여백 넉넉하게, 답답하지 않게
* 카드: 부드러운 그림자 (shadow-sm ~ shadow-md), border 대신 shadow 선호
* 모서리: rounded-xl ~ rounded-2xl 위주
* 버튼: 모서리 둥글게, 호버 시 자연스러운 전환
* 아이콘: lucide-react 유지
* 애니메이션: 과하지 않게, transition-colors / transition-opacity 정도
* 다크모드: 순수 검정 지양, zinc-900 ~ zinc-950 계열 사용
