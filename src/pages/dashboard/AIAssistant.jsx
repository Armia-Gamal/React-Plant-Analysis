import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import { getFunctions, httpsCallable } from "firebase/functions";
import pdfMake from "pdfmake/build/pdfmake";
import htmlToPdfmake from "html-to-pdfmake";
import "./AIAssistant.css";

pdfMake.fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};
// Import logo as base64 data URL for PDF generation (works in production)
import nabtaLogo from "../../assets/images/New Project (1).png";

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
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [typedText, setTypedText] = useState("");

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

    /* ======================================
      1️⃣ Replace Section Emojis With Text
    ====================================== */

    .replace(/🌿/g, "")
    .replace(/🌱/g, "")
    .replace(/📊/g, "")
    .replace(/📈/g, "")
    .replace(/📋/g, "")
    .replace(/📌/g, "")
    .replace(/⚠️?/g, "")
    .replace(/🧠/g, "")

    // Treatment & Action Icons
    .replace(/🚑/g, "Immediate Actions")
    .replace(/✂️?/g, "Pruning")
    .replace(/🧪/g, "Recommended Treatment")
    .replace(/📅/g, "Treatment Schedule")
    .replace(/🛡️?/g, "Protection Measures")

    // Prevention Icons
    .replace(/🌦️?/g, "Environmental Factors")
    .replace(/🌬️?/g, "Ventilation")
    .replace(/📏/g, "Proper Spacing")
    .replace(/💦/g, "Irrigation Management")
    .replace(/🌾/g, "Fertilization Strategy")
    .replace(/🧼/g, "Sanitation Practices")
    .replace(/🧑‍🌾/g, "Monitoring Plan")
    .replace(/🔄/g, "Disease Spread")

    /* ======================================
      2️⃣ Replace Number Emojis
    ====================================== */

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

    /* ======================================
      3️⃣ Clean Invisible Unicode Garbage
    ====================================== */

    .replace(/[\uFE0F]/g, "")          // Variation selectors
    .replace(/[\u200B-\u200D]/g, "")   // Zero width chars
    .replace(/[\uFEFF]/g, "")          // BOM
    .replace(/[\u20E3]/g, "")          // Keycap
    .replace(/[\uE000-\uF8FF]/g, "")   // Private use area

    /* ======================================
      4️⃣ Remove Any Remaining Emojis Globally
      (Full Unicode Emoji Strip)
    ====================================== */
    .replace(/\*\*\s+Soil/g, "**Soil")
    .replace(/\*\*\s+Watering:/g, "**Watering")
    .replace(/\*\*\s+Fertilization/g, "**Fertilization")

    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");


    
    const html = marked.parse(cleaned);
    const converted = htmlToPdfmake(html);

    // Convert image URL to base64 with CORS handling for production
    const toBase64 = async (url) => {
      try {
        // Try fetching with no-cors mode first
        const res = await fetch(url, { mode: 'cors' });
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        // Fallback: use Image element to convert to base64
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => {
            // Return empty string if all methods fail - PDF will generate without logo
            resolve('');
          };
          img.src = url;
        });
      }
    };

    const logoBase64 = await toBase64(nabtaLogo);

    // Build header columns - only include logo if successfully loaded
    const headerColumns = [];
    if (logoBase64) {
      headerColumns.push({ image: logoBase64, width: 130 });
    }
    headerColumns.push({
      width: "*",
      stack: [
        {
          text: "Nabta AI Smart Plant Report",
          alignment: logoBase64 ? "center" : "left",
          fontSize: 22,
          bold: true
        },
        {
          text: "Generated on: " + new Date().toLocaleString(),
          alignment: logoBase64 ? "center" : "left",
          fontSize: 10,
          color: "gray",
          margin: [0, 5, 0, 5]
        }
      ]
    });

    const documentDefinition = {
      pageSize: "A4",
      pageMargins: [40, 100, 40, 60],
        defaultStyle: {
          font: "Helvetica"
        },
      header: {
        margin: [40, 30, 40, 10],
        stack: [
          {
            columns: headerColumns
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

    return new Promise((resolve) => {
      pdfMake.createPdf(documentDefinition).download("Nabta_AI_Report.pdf");
      resolve();
    });
  };

  const handleDownloadWithProgress = async (msgId, originalText) => {
    setDownloadingId(msgId);
    setDownloadProgress(0);
    
    // Simulate progress while PDF is being generated
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 100);
    
    try {
      await downloadPdf(originalText);
      setDownloadProgress(100);
      setTimeout(() => {
        setDownloadingId(null);
        setDownloadProgress(0);
      }, 500);
    } catch (err) {
      console.error(err);
      setDownloadingId(null);
      setDownloadProgress(0);
    } finally {
      clearInterval(progressInterval);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, typedText]);

  // Scroll to bottom on initial mount
  useEffect(() => {
    // Wait for DOM to fully render then scroll
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Typing animation effect
  useEffect(() => {
    if (!typingMessageId) return;
    const msg = messages.find(m => m.id === typingMessageId);
    if (!msg) return;

    const fullText = msg.text;
    if (typedText.length >= fullText.length) {
      setTypingMessageId(null);
      setTypedText("");
      return;
    }

    // Type word by word - speed based on message length
    const words = fullText.split(/(?<=\s)/);
    const typedWords = typedText.split(/(?<=\s)/);
    const nextWordIndex = typedWords.length;
    
    if (nextWordIndex >= words.length) {
      setTypingMessageId(null);
      setTypedText("");
      return;
    }

    // Dynamic speed: more words per tick for longer messages
    // Short (<100 words): 1 word at a time, 20ms
    // Medium (100-500 words): 2-3 words at a time, 15ms
    // Long (>500 words): 5-10 words at a time, 10ms
    let wordsPerTick = 1;
    let delay = 20;
    
    if (words.length > 500) {
      wordsPerTick = Math.ceil(words.length / 100); // finish in ~100 ticks
      delay = 5;
    } else if (words.length > 200) {
      wordsPerTick = 3;
      delay = 10;
    } else if (words.length > 100) {
      wordsPerTick = 2;
      delay = 15;
    }

    const timer = setTimeout(() => {
      const newIndex = Math.min(nextWordIndex + wordsPerTick, words.length);
      setTypedText(words.slice(0, newIndex).join(""));
    }, delay);

    return () => clearTimeout(timer);
  }, [typingMessageId, typedText, messages]);

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

    // Build chat history for Cohere (exclude download links)
    const chatHistory = messages
      .filter(m => !m.isDownloadLink)
      .map(m => ({
        role: m.role === "user" ? "USER" : "CHATBOT",
        message: m.text
      }));

    setMessages(prev => [...prev, userMessage]);
    if (messageText === null) {
      setInput("");
    }
    setLoading(true);

    try {
      const result = await cohereChat({
        message: textToSend,
        preamble: SYSTEM_PREAMBLE,
        chat_history: chatHistory,
        temperature: 0.3
      });

      const botMsgId = Date.now() + 1;
      const botMsg = {
        id: botMsgId,
        role: "bot",
        text: result.data.text,
        isReport
      };
      setMessages(prev => [...prev, botMsg]);
      setTypingMessageId(botMsgId);
      setTypedText("");

      // if this was a report response, show download link
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
      // Reset ref so we can try again
      hasProcessedReportRef.current = false;
    }

    setLoading(false);
  };

  const handleSendHidden = async (prompt) => {
    // Don't show user message, just show loading state
    setLoading(true);
    setIsReportLoading(true);

    try {
      let combinedText = "";

      // Check if it's a batch request
      if (prompt && prompt.isBatch && Array.isArray(prompt.prompts)) {
        // Run all batch prompts in parallel
        const results = await Promise.all(
          prompt.prompts.map(p => 
            cohereChat({
              message: p,
              preamble: SYSTEM_PREAMBLE,
              temperature: 0.3
            })
          )
        );
        // Combine all responses
        combinedText = results.map(r => r.data.text).join("\n\n---\n\n");
      } else {
        // Single prompt
        const result = await cohereChat({
          message: prompt,
          preamble: SYSTEM_PREAMBLE,
          temperature: 0.3
        });
        combinedText = result.data.text;
      }

      const hiddenBotMsgId = Date.now();
      setMessages(prev => [...prev, {
        id: hiddenBotMsgId,
        role: "bot",
        text: combinedText,
        isReport: true
      }]);
      setTypingMessageId(hiddenBotMsgId);
      setTypedText("");

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "bot",
        isDownloadLink: true,
        originalText: combinedText
      }]);
      // Notify parent that report has been processed
      if (onReportProcessed) {
        hasProcessedReportRef.current = false;
        onReportProcessed();
      }

    } catch (err) {
      console.error(err);
      // Reset ref so we can try again
      hasProcessedReportRef.current = false;
    }

    setLoading(false);
    setIsReportLoading(false);
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

          // special case for download link entries - hide while typing is in progress
          if (msg.isDownloadLink) {
            // Don't show download link while bot is still typing
            if (typingMessageId) return null;

            const isDownloading = downloadingId === msg.id;
            return (
              <div key={msg.id} className={`chat-row ${alignment}`}>
                <div className="download-pdf-link">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isDownloading) {
                        handleDownloadWithProgress(msg.id, msg.originalText);
                      }
                    }}
                    style={{ pointerEvents: isDownloading ? 'none' : 'auto' }}
                  >
                    {isDownloading 
                      ? `⏳ Downloading... ${downloadProgress}%`
                      : '📄 Download Professional PDF Report'
                    }
                  </a>
                </div>
              </div>
            );
          }

          const displayText = (typingMessageId === msg.id && msg.role === "bot")
            ? typedText
            : msg.text;

          return (
            <div key={msg.id} className={`chat-row ${alignment}`}>
              <div
                className={`chat-bubble ${msg.role === "user" ? "user" : "bot"}`}
                dir={arabic ? "rtl" : "ltr"}
                dangerouslySetInnerHTML={{
                  __html: marked.parse(displayText || " ")
                }}
              />
              {typingMessageId === msg.id && (
                <span className="typing-cursor">▌</span>
              )}
            </div>
          );
        })}

        {loading && (() => {
          const lastUserMessage = messages.filter(m => m.role === "user").pop();
          // For report prompts, always use English loading text
          const isArabicInput = !isReportLoading && lastUserMessage && lastUserMessage.text && isArabic(lastUserMessage.text);
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