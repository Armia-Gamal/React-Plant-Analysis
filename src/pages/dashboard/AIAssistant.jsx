import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import { getFunctions, httpsCallable } from "firebase/functions";
import "./AIAssistant.css";

marked.setOptions({ breaks: true });

export default function AIAssistant() {

  const functions = getFunctions();
  const cohereChat = httpsCallable(functions, "cohereChat");

  const SYSTEM_PREAMBLE = `
  You are Plantifipia, an expert botanist, horticulturist, and plant pathologist.
  
  YOUR PURPOSE:
  1. Assist users with plant care (watering, light, soil, humidity, fertilization).
  2. Help identify plants based on descriptions.
  3. Diagnose plant diseases and suggest organic or chemical remedies.
  4. Provide gardening tips and best practices.
  
  STRICT DOMAIN RULES:
  - Only answer plant-related questions.
  - Politely refuse other topics.
  
  TONE:
  - Earthy, nurturing, scientific but accessible.
  - Use plant metaphors.
  - Be encouraging.
  `;

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: "Welcome to Plantifipia! 🌿 I am your personal botanist.",
      isArabic: false
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const footer = document.querySelector(".footer");
    if (footer) footer.style.display = "none";
    return () => {
      if (footer) footer.style.display = "";
    };
  }, []);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await cohereChat({
        message: input,
        preamble: SYSTEM_PREAMBLE,
        chat_history: messages.map(m => ({
          role: m.role === "user" ? "USER" : "CHATBOT",
          message: m.text
        })),
        temperature: 0.3
      });

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "bot",
        text: result.data.text
      }]);

    } catch (err) {
      console.error(err);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "bot",
        text: "🌱 The roots are tangled... please try again."
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">

      <div className="chat-messages">

        {messages.map(msg => {
          const arabic = msg.isArabic !== undefined ? msg.isArabic : isArabic(msg.text);
          const alignment = msg.role === "user"
            ? "flex-end"
            : (arabic ? "rtl-align" : "ltr-align");

          return (
            <div key={msg.id} className={`chat-row ${alignment}`}>
              <div
                className={`chat-bubble ${msg.role === "user" ? "user" : "bot"}`}
                dir={arabic ? "rtl" : "ltr"}
                dangerouslySetInnerHTML={{
                  __html: marked.parse(msg.text)
                }}
              />
            </div>
          );
        })}

        {loading && (() => {
          const lastUserMessage = messages.filter(m => m.role === "user").pop();
          const isArabicInput = lastUserMessage && isArabic(lastUserMessage.text);
          const loadingText = isArabicInput ? "فحص الجذور..." : "Examining roots...";
          const loadingDir = isArabicInput ? "rtl" : "ltr";
          const loadingAlignment = isArabicInput ? "rtl-align" : "ltr-align";

          return (
            <div className={`chat-row ${loadingAlignment}`}>
              <div className="loading-bubble" dir={loadingDir}>
                <svg className="loading-sprout-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 20h10"/>
                  <path d="M10 20c5.5-2.5.8-6.4 3-10"/>
                  <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.2.4-4.8-.4-1.2-.6-2.1-1.9-2.1-3.3 0-1.9 3-3 4.6-3Z"/>
                  <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-.8 1.6-1.7 1.6-2.6 0-2.6-4.8-2.6-4.8 0Z"/>
                </svg>
                <span className="loading-text">{loadingText}</span>
              </div>
            </div>
          );
        })()}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-area-inner">

          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Ask about wilting leaves..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
          />

          <button
            className="send-btn"
            onClick={handleSend}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 12L21 3L14 21L11 13L3 12Z"/>
            </svg>
          </button>

        </div>

        <div className="chat-disclaimer">
          Ask a plant 🌿 Plantifipia can make mistakes. Check important info.
        </div>
      </div>

    </div>
  );
}