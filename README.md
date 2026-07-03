# ☢️ MELTDOWN

2~8명이 함께 플레이하는 온라인 협동 웹게임. 원자력 발전소 직원이 되어 계속 발생하는
사고를 해결하며 5분 동안 원자로가 폭발하지 않도록 버틴다. 고정 역할은 없고, 누구나
아무 사고나 달려가서 처리할 수 있다. 시간이 지날수록 사고 빈도와 강도가 올라가서
결국 혼자서는 감당할 수 없는 수준까지 치닫는다 — 승패는 실력보다 소통과 팀워크가 가른다.

이 저장소는 플레이 가능한 프로토타입이다: React 클라이언트 + Node.js/Socket.io
서버로 구성된 실시간 멀티플레이어 웹게임.

## 실행 방법

두 개의 터미널이 필요하다 (서버, 클라이언트).

```bash
# 1) 서버
cd server
npm install
npm run dev        # http://localhost:3001

# 2) 클라이언트 (새 터미널)
cd client
npm install
npm run dev         # http://localhost:5173
```

브라우저에서 `http://localhost:5173` 접속 → 빠른 매칭으로 아무 발전소에나
합류하거나, 방을 직접 만들어 코드를 친구에게 공유. 방장이 "가동 시작"을 누르면
게임이 시작된다. 마이크 권한을 허용하면 같은 방 플레이어끼리 음성으로도 대화할
수 있다 (WebRTC, HTTPS 또는 localhost 필요).

## 게임 구조

- **판정은 서버 권위(authoritative)**: 원자로 스탯, 사고 스폰, 진행도는 모두
  `server/src/game/Room.js`에서 계산되고 0.5초마다 모든 플레이어에게 브로드캐스트된다.
- **스탯 5종** (`server/src/game/constants.js`): 온도, 압력, 방사능, 전력, 설비 내구도.
  온도/압력/방사능이 100에 도달하거나, 전력이 0인 채로 15초 이상 지속되거나,
  내구도가 0이 되면 패배.
- **사고 9종**: 냉각수 부족, 배관 파손, 발전기 고장, 정전, 화재, 증기 압력 상승,
  방사능 누출, 보안문 잠김, 센서 오작동. 각 사고는 특정 구역(zone)에 스폰되고,
  방치하면 관련 스탯을 계속 악화시킨다.
- **협동 설계**: 사고 진행도는 그 사고에 "작업 중"인 플레이어 수에 비례해 빠르게
  줄어들지만 체감 수익은 점점 줄어든다. 봇 시뮬레이션(`scratchpad` 참고용 스크립트,
  저장소에는 없음)으로 밸런스를 검증한 결과, 완벽하게 우선순위를 판단하는 조건에서도
  혼자서는 5분을 버티지 못하고(승률 0%), 둘이서는 팽팽하게(약 60%), 셋 이상이면
  안정적으로 버틸 수 있는 곡선으로 맞췄다 — 팀워크가 실제로 승패를 가르도록.
- 정전 중에는 다른 구역 작업 속도가 절반으로 느려지고 사고 정체가 가려지며, 방사능
  누출은 격리 구역 작업을 늦추고, 화재를 오래 방치하면 설비가 추가로 파손된다 — 사고가
  서로 영향을 주며 점점 혼란스러워지는 후반부를 구현한다.
- **난이도 곡선**: 사고 스폰 간격은 시간이 지날수록 18초 → 4초로 줄고, 동시에
  존재할 수 있는 사고 수도 늘어나며, 사고 하나당 스탯에 주는 피해도 후반부로
  갈수록 최대 3.6배까지 커진다.
- **소통**: 텍스트 채팅 + 음성 채팅(WebRTC 메시 연결, 시그널링은 기존 Socket.io
  커넥션을 그대로 사용). 발화 감지로 말하고 있는 사람에게 표시가 뜬다.
- **빠른 매칭**: 대기 중인 공개 방이 있으면 합류하고, 없으면 새로 만들어서
  다른 사람을 기다린다. 방 코드로 직접 초대하는 방식도 그대로 지원한다.

## 코드 구조

```
server/
  src/index.js          Express + Socket.io 진입점, 방/음성 시그널링 이벤트 처리
  src/roomManager.js     방 코드 생성/조회, 빠른 매칭용 공개 방 탐색
  src/game/Room.js       게임 상태 머신 (틱 루프, 사고 스폰, 승패 판정)
  src/game/constants.js  스탯/사고/타이밍 밸런스 상수

client/
  src/App.jsx                  화면 전환 (Home → Lobby → GameScreen) + 소켓 이벤트 연결
  src/socket.js                socket.io-client 인스턴스
  src/useVoice.js               WebRTC 음성 채팅 훅 (연결/음소거/발화 감지)
  src/components/Home.jsx      닉네임 입력, 빠른 매칭/방 생성/참가
  src/components/Lobby.jsx     대기실, 플레이어 목록, 음성 패널, 시작 버튼(방장 전용)
  src/components/GameScreen.jsx 전체 게임 화면 조립 (타이머, 스탯, 구역, 음성, 채팅, 종료 오버레이)
  src/components/ZonePanel.jsx 구역별 사고 카드 + "작업하기" 버튼
  src/components/StatGauge.jsx 원자로 스탯 게이지
  src/components/VoicePanel.jsx 음성 참여/음소거 버튼 + 발화 중 표시
  src/components/Chat.jsx      텍스트 채팅
  src/components/three/        3D 모델 파이프라인 (아래 참고)
  public/models/                glTF(.glb) 에셋을 넣는 자리 (README 포함)
```

## 3D 모델 파이프라인

`client/src/components/three/ModelOrPlaceholder.jsx`가 `client/public/models/`에
실제 `.glb` 파일이 있으면 그걸 로드하고, 없으면 로우폴리 placeholder 도형으로
자동 폴백한다. 지금은 홈 화면의 회전하는 원자로 코어(`ReactorHero.jsx`)가 이
방식으로 연결되어 있다. meshy.ai로 모델을 만들면 `public/models/reactor-core.glb`
자리에 넣기만 하면 바로 반영된다 — 자세한 스펙과 추가로 필요한 모델 목록은
`client/public/models/README.md` 참고.

## 다음 단계 (미구현)

- meshy.ai 실제 3D 모델 적용 (지금은 원자로 코어만 placeholder ↔ 실모델 자동 전환
  구조가 준비되어 있고, 구역별/캐릭터 모델은 아직 목업)
- 실제 사람 대상 플레이테스트를 통한 최종 밸런스 조정 (지금까지는 봇 시뮬레이션 기준)
- 리커넥트(새로고침 시 같은 세션 복귀) 처리
