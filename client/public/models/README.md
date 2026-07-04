# 3D 모델 자리

이 폴더에 glTF Binary(`.glb`) 파일을 넣으면 자동으로 로드되어 지금의 로우폴리
placeholder 도형을 대체한다. 파일이 없으면 조용히 placeholder로 폴백하므로
전부 준비될 때까지 게임은 항상 정상 작동한다. (`client/src/components/three/ModelOrPlaceholder.jsx`)

## 지금 연결되어 있는 것

| 파일명 | 사용처 | 설명 |
| --- | --- | --- |
| `reactor-core.glb` | 홈 화면 히어로(`ReactorHero.jsx`) | 회전하는 원자로 노심 |
| `zone-reactor.glb` | 맵의 "원자로 노심" 구역 (`three/ZoneNode.jsx`) | 냉각 배관 |
| `zone-generator.glb` | 맵의 "발전기실" 구역 | 발전기 |
| `zone-electrical.glb` | 맵의 "전기실" 구역 | 차단기 패널 |
| `zone-control.glb` | 맵의 "제어실" 구역 | 모니터 콘솔 |
| `zone-security.glb` | 맵의 "보안실" 구역 | 보안문/장애물 구조물 |
| `worker.glb` | 다른 플레이어 아바타 (`three/PlayerAvatarMesh.jsx`) | 로우폴리 작업자 캐릭터. 애니메이션은 없음(정적 메시) — 걷기 사이클이 있으면 훨씬 자연스러워지니 원하면 요청해도 좋다. |

이제 격리 구역(containment)만 실모델이 없어서 손으로 만든 절차적 placeholder를
쓴다(방사능 통, `three/placeholders/ContainmentPlaceholder.jsx`).

모델마다 원점(Y=0) 기준이 제각각이라(정중앙 정렬이라 절반이 바닥에 묻힘)
`ZoneNode.jsx`의 `MODEL_Y_OFFSET`에서 모델별로 살짝 들어 올려 바닥에 발이
닿게 맞췄다. 새 모델을 넣을 때 바닥에 묻혀 보이면 여기 오프셋을 추가/조정하면
된다.

원본 파일은 텍스처가 2048px라 개당 6~14MB였다. 웹에서 여러 개를 동시에 띄우기엔
너무 무거워서 `@gltf-transform/cli optimize --texture-compress webp --texture-size 512`로
텍스처만 축소해 넣었다 (Draco 지오메트리 압축은 일부러 뺐다 — 압축을 풀려면
외부 CDN에서 디코더를 받아와야 하는데, 그 의존성 없이 오프라인/제한된 네트워크
환경에서도 항상 로드되게 하기 위함).

## meshy.ai 생성 요청 시 참고 스펙

- 포맷: **glTF Binary (.glb)**, 텍스처는 파일에 내장.
- 스타일: 로우폴리, 밝고 약간 코믹한 색감(원색 위주, 사실적 PBR 지양). 참고
  팔레트: 주황/노랑(#ffb020, #ff7a3d), 초록(#37d67a), 빨강(#ff5757), 남색
  패널(#2a4568).
- 트라이앵글 수: 오브젝트당 2,000~6,000 tris 권장 (웹에서 여러 개를 동시에
  렌더링하므로 너무 무겁지 않게).
- 스케일/원점: 모델 원점(0,0,0)이 바닥 중심에 오도록, 대략 1~2 유닛(미터) 높이로
  export. 회전은 +Y가 위쪽.
- 정적 메시로 충분하지만, 작업자 캐릭터(worker.glb)는 걷기 애니메이션이 있으면
  훨씬 자연스럽다 — 시간 되면 만들어줘도 좋음.

## 아직 없는 모델

1. **격리 컨테이너 (zone-containment.glb)** — 방사능 통, 노란/검정 경고 줄무늬.

파일을 이 폴더(`client/public/models/`)에 위 이름 그대로 넣기만 하면 되고,
`client/src/components/three/ZoneNode.jsx`의 `ZONE_MODELS` 맵에 한 줄만
추가하면 곧바로 붙는다.
