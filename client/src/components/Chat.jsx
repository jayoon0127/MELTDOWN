import { useState, useRef, useEffect } from "react";

export default function Chat({ chat, onSend }) {
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chat.length]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="chat-box">
      <div className="chat-messages" ref={listRef}>
        {chat.map((m) => (
          <div key={m.id} className="chat-message">
            <strong>{m.name}:</strong> {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="냉각수 갈게! 라고 외쳐보세요"
          maxLength={300}
        />
        <button type="submit">전송</button>
      </form>
    </div>
  );
}
