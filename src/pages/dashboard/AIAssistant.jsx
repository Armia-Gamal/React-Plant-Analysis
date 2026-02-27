import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import { getFunctions, httpsCallable } from "firebase/functions";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import htmlToPdfmake from "html-to-pdfmake";import "./AIAssistant.css";
pdfMake.vfs = pdfFonts.vfs;
import nabtaLogo from "../../assets/images/Logo.png";

marked.setOptions({ breaks: true });

export default function AIAssistant({ pendingReport, onReportProcessed, newChatTrigger }) {

  const functions = getFunctions();
  const cohereChat = httpsCallable(functions, "cohereChat");

  const SYSTEM_PREAMBLE = `
  You are Nabta AI Assistant, an expert botanist, horticulturist, and plant pathologist.
  
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

  const initialMessages = [
    {
      id: 1,
      role: "bot",
      text: "Welcome to Nabta AI Assistant! 🌿 I am your personal botanist. How can I help your garden grow today? I can help with plant identification, care tips, or diagnosing diseases.",
      isArabic: false
    }
  ];

  // Load messages from localStorage or use initial messages
  const STORAGE_KEY = "nabta_messages";

  const [messages, setMessages] = useState(() => {
    try {
      // migrate old storage if present
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("plantifipia_messages");
      return saved ? JSON.parse(saved) : initialMessages;
    } catch (e) {
      return initialMessages;
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const hasProcessedReportRef = useRef(false);

  const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // create a professional PDF from markdown report
  const downloadPdf = async (markdownText) => {

    const cleaned = markdownText

      /* ===============================
        1️⃣ Replace Section Emojis
      =============================== */

      .replace(/🌿/g, "")
      .replace(/🌱/g, "")
      .replace(/📌/g, "")
      .replace(/📊/g, "")
      .replace(/📈/g, "")
      .replace(/⚠/g, "")
      .replace(/🧠/g, "")
      .replace(/🚑/g, "Immediate Actions")
      .replace(/✂️/g, "Pruning")
      .replace(/🧪/g, "Treatment")
      .replace(/📅/g, "Schedule")
      .replace(/🛡/g, "Protection")
      .replace(/🌦/g, "Environmental")
      .replace(/🌬/g, "Ventilation")
      .replace(/📏/g, "Spacing")
      .replace(/💦/g, "Irrigation")
      .replace(/🌾/g, "Fertilization")
      .replace(/🧼/g, "Sanitation")
      .replace(/🧑‍🌾/g, "Monitoring")
      .replace(/🔄/g, "Spread")

      /* ===============================
        2️⃣ Replace Number Emojis
      =============================== */

      .replace(/1️⃣/g, "1.")
      .replace(/2️⃣/g, "2.")
      .replace(/3️⃣/g, "3.")
      .replace(/4️⃣/g, "4.")
      .replace(/5️⃣/g, "5.")
      .replace(/6️⃣/g, "6.")
      .replace(/7️⃣/g, "7.")
      .replace(/8️⃣/g, "8.")
      .replace(/9️⃣/g, "9.")
      .replace(/🔟/g, "10.")

      .replace(/\*\*\s+Overall/g, "**Overall")
      .replace(/\*\*\s+Most/g, "**Most")
      .replace(/\*\*\s+Recommended/g, "**Recommended")
      .replace(/[\uFE0F\u20E3]/g, "")      
      .replace(/[\u200B-\u200D\uFEFF]/g, "") 
      .replace(/[\uE000-\uF8FF]/g, "");   
        
    const html = marked.parse(cleaned);
    const converted = htmlToPdfmake(html);

    const toBase64 = (url) =>
      fetch(url)
        .then(res => res.blob())
        .then(blob => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }));

    const logoBase64 = await toBase64(nabtaLogo);

    const documentDefinition = {
      pageSize: "A4",
      pageMargins: [40, 100, 40, 60],

      header: {
        margin: [40, 30, 40, 10],
        stack: [
          {
            columns: [
              { image: logoBase64, width: 65 },
              {
                width: "*",
                stack: [
                  {
                    text: "Nabta AI Smart Plant Report",
                    alignment: "center",
                    fontSize: 22,
                    bold: true
                  },
                  {
                    text: "Generated on: " + new Date().toLocaleString(),
                    alignment: "center",
                    fontSize: 10,
                    color: "gray",
                    margin: [0, 5, 0, 5]
                  }
                ]
              }
            ]
          },
          {
            canvas: [
              {
                type: "rect",
                x: 0,
                y: 0,
                w: 515,
                h: 3,
                color: "#22C55E"
              }
            ]
          }
        ]
      },

      footer: function (currentPage, pageCount) {
        return {
          margin: [40, 0, 40, 20],
          columns: [
            { text: "Nabta AI Assistant", fontSize: 8, color: "gray" },
            {
              text: `Page ${currentPage} of ${pageCount}`,
              alignment: "right",
              fontSize: 8,
              color: "gray"
            }
          ]
        };
      },

      content: [
        {
          stack: converted,
          fontSize: 11,
          lineHeight: 1.5
        }
      ],

      styles: {
        h1: { fontSize: 20, bold: true, margin: [0, 15, 0, 8] },
        h2: { fontSize: 16, bold: true, margin: [0, 12, 0, 6] },
        h3: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
      }
    };

    pdfMake.createPdf(documentDefinition).download("Nabta_AI_Report.pdf");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const footer = document.querySelector(".footer");
    if (footer) footer.style.display = "none";
    return () => {
      if (footer) footer.style.display = "";
    };
  }, []);

  // Auto-send pending report when available
  useEffect(() => {
    if (pendingReport && !hasProcessedReportRef.current && !loading) {
      hasProcessedReportRef.current = true;
      const { prompt, isHidden } = pendingReport;
      
      if (isHidden) {
        // Send hidden prompt (don't show as user message)
        handleSendHidden(prompt, true);
      } else {
        // Normal flow: show message in chat
        setInput(prompt);
        setTimeout(() => {
          handleSend(prompt, true);
        }, 0);
      }
    }
  }, [pendingReport, loading]);

  // Listen for new chat trigger from navbar
  useEffect(() => {
    if (newChatTrigger > 0) {
      setMessages([
        {
          id: 1,
          role: "bot",
          text: "Welcome to Nabta AI Assistant! 🌿 I am your personal botanist. How can I help your garden grow today? I can help with plant identification, care tips, or diagnosing diseases.",
          isArabic: false
        }
      ]);
      setInput("");
      hasProcessedReportRef.current = false;
    }
  }, [newChatTrigger]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const handleSend = async (messageText = null, isReport = false) => {
    const textToSend = messageText !== null ? messageText : input;
    if (!textToSend.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: textToSend
    };

    setMessages(prev => [...prev, userMessage]);
    if (messageText === null) {
      setInput("");
    }
    setLoading(true);

    try {
      const result = await cohereChat({
        message: textToSend,
        preamble: SYSTEM_PREAMBLE,
        chat_history: messages.map(m => ({
          role: m.role === "user" ? "USER" : "CHATBOT",
          message: m.text
        })),
        temperature: 0.3
      });

      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        text: result.data.text,
        isReport
      };
      setMessages(prev => [...prev, botMsg]);

      // if this was a report response, enqueue a download hint after
      if (isReport) {
        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          role: "bot",
          text: "Download Professional PDF Report",
          isDownloadLink: true,
          originalText: result.data.text
        }]);
      }

      // Notify parent that report has been processed
      if (onReportProcessed) {
        hasProcessedReportRef.current = false;
        onReportProcessed();
      }

    } catch (err) {
      console.error(err);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "bot",
        text: "🌱 The roots are tangled... please try again."
      }]);

      // Reset ref so we can try again
      hasProcessedReportRef.current = false;
    }

    setLoading(false);
  };

  const handleSendHidden = async (prompt) => {
    // Don't show user message, just show loading state
    setLoading(true);

    try {
      const result = await cohereChat({
        message: prompt,
        preamble: SYSTEM_PREAMBLE,
        chat_history: messages.map(m => ({
          role: m.role === "user" ? "USER" : "CHATBOT",
          message: m.text
        })),
        temperature: 0.3
      });

      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "bot",
        text: result.data.text,
        isReport: true
      }]);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "bot",
        isDownloadLink: true,
        originalText: result.data.text
      }]);
      // Notify parent that report has been processed
      if (onReportProcessed) {
        hasProcessedReportRef.current = false;
        onReportProcessed();
      }

    } catch (err) {
      console.error(err);

      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "bot",
        text: "🌱 The roots are tangled... please try again."
      }]);

      // Reset ref so we can try again
      hasProcessedReportRef.current = false;
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(null);
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

          // special case for download link entries
          if (msg.isDownloadLink) {
            return (
              <div key={msg.id} className={`chat-row ${alignment}`}>
                <div className="download-pdf-link">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      downloadPdf(msg.originalText);
                    }}
                  >
                    📄 Download Professional PDF Report
                  </a>
                </div>
              </div>
            );
          }

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
            onClick={() => handleSend(null)}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 12L21 3L14 21L11 13L3 12Z"/>
            </svg>
          </button>

        </div>

        <div className="chat-disclaimer">
          Ask a plant 🌿 Nabta AI Assistant can make mistakes. Check important info.
        </div>
      </div>

    </div>
  );
}