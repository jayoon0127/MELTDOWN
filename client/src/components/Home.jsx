import { useState } from "react";

export default function Home({ onCreate, onJoin, error }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState("create");

  const submit = (e) => {
    e.preventDefault();
    if (mode === "create") onCreate(name);
    else onJoin(name, code);
  };

  return (
    <div className="screen home-screen">
      <div className="reactor-badge">☢️</div>
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

        {error && <div className="error">{error}</div>}

        <button type="submit" className="primary-btn">
          {mode === "create" ? "발전소 개소하기" : "발전소 입장하기"}
        </button>
      </form>

      <p className="hint">2~8명이 함께 플레이하는 협동 웹게임 · 5분 생존</p>
    </div>
  );
}
