import { useState } from "react";
import ReactorHero from "./three/ReactorHero";

export default function Home({ onCreate, onJoin, onQuickMatch, error }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState("create");

  const submit = (e) => {
    e.preventDefault();
    if (mode === "create") onCreate(name);
    else if (mode === "join") onJoin(name, code);
    else onQuickMatch(name);
  };

  return (
    <div className="screen home-screen">
      <ReactorHero />
      <h1>MELTDOWN</h1>
      <p className="tagline">원자로가 터지기 전에, 팀으로 버텨라.</p>

      <form className="card" onSubmit={submit}>
        <label>
          닉네임
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="요원 이름"
            maxLength={20}
          />
        </label>

        <div className="tabs">
          <button
            type="button"
            className={mode === "quickmatch" ? "tab active" : "tab"}
            onClick={() => setMode("quickmatch")}
          >
            빠른 매칭
          </button>
          <button
            type="button"
            className={mode === "create" ? "tab active" : "tab"}
            onClick={() => setMode("create")}
          >
            방 만들기
          </button>
          <button
            type="button"
            className={mode === "join" ? "tab active" : "tab"}
            onClick={() => setMode("join")}
          >
            방 참가하기
          </button>
        </div>

        {mode === "join" && (
          <label>
            방 코드
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="예: A3F9K"
              maxLength={6}
            />
          </label>
        )}

        {mode === "quickmatch" && (
          <p className="hint" style={{ margin: 0 }}>
            대기 중인 공개 발전소가 있으면 바로 합류하고, 없으면 새로 개소해서
            다른 사람이 들어올 때까지 기다립니다.
          </p>
        )}

        {error && <div className="error">{error}</div>}

        <button type="submit" className="primary-btn">
          {mode === "create" && "발전소 개소하기"}
          {mode === "join" && "발전소 입장하기"}
          {mode === "quickmatch" && "빠른 매칭 시작"}
        </button>
      </form>

      <p className="hint">2~8명이 함께 플레이하는 협동 웹게임 · 5분 생존</p>
    </div>
  );
}
