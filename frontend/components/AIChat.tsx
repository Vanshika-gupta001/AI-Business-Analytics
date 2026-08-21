"use client";


import {
  useEffect,
  useRef,
  useState
} from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { apiFetch } from "../lib/api";

import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Sparkles,
  Table2
} from "lucide-react";


type ChatTable = {
  columns: string[];
  rows: Record<string, any>[];
};

type ChatMessage = {

  role: "user" | "ai";
  text: string;
  table?: ChatTable;

};


function buildSuggestedQuestions(data: any): string[] {

  if (!data?.dataset_info) return [];

  const columns: any[] = data.column_summary || [];

  const totalRows: number = data.dataset_info?.rows || 0;

  // Same guardrail as Predictive Modeling — don't suggest questions
  // built around ID-like/free-text columns.
  const usableColumns = columns.filter((c: any) => {
    const isNumeric = c.type?.includes("int") || c.type?.includes("float");
    if (isNumeric) return true;
    const uniqueRatio = totalRows > 0 ? c.unique / totalRows : 0;
    return uniqueRatio <= 0.9;
  });

  const numericCols = usableColumns.filter((c: any) => c.type?.includes("int") || c.type?.includes("float"));
  const categoricalCols = usableColumns.filter((c: any) => !c.type?.includes("int") && !c.type?.includes("float"));

  const questions: string[] = [];

  if (categoricalCols[0] && numericCols[0]) {
    questions.push(`Which ${categoricalCols[0].column} has the highest average ${numericCols[0].column}?`);
  }

  questions.push("Summarize the key insights from this dataset");

  if ((data.column_summary || []).some((c: any) => c.missing > 0)) {
    questions.push("Which columns have the most missing values?");
  }

  if (data.anomalies?.length > 0) {
    questions.push("Are there any anomalies I should be concerned about?");
  }

  questions.push("What actions would you recommend based on this data?");

  return questions.slice(0, 4);

}


function buildLightDataset(data: any) {

  if (!data) return null;

  // Only send the lightweight fields the AI actually needs for context.
  // Sending the full payload (200-row preview, chart images, full
  // business report) on every message is what burns through the
  // free-tier rate limits.
  return {

    dataset_info: data.dataset_info,
    column_summary: data.column_summary,
    insights: data.insights,
    health_score: data.health_score,
    grade: data.grade,
    anomalies: data.anomalies

  };

}


export default function AIChat({

  dataset,

  openSignal

}: {

  dataset: any;
  openSignal?: number;

}) {


  const [open, setOpen] = useState(false);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);


  const chatRef = useRef<HTMLDivElement>(null);


  useEffect(() => {

    if (openSignal) {
      setOpen(true);
    }

  }, [openSignal]);


  useEffect(() => {

    chatRef.current?.scrollTo({

      top: chatRef.current.scrollHeight,

      behavior: "smooth"

    });

  }, [messages, loading]);


  const suggestedQuestions = buildSuggestedQuestions(dataset);


  async function sendMessage(overrideText?: string) {

    const textToSend = overrideText ?? message;

    if (!textToSend.trim()) return;

    const userText = textToSend;

    const priorMessages = messages;

    const updatedMessages: ChatMessage[] = [

      ...priorMessages,
      { role: "user", text: userText }

    ];

    setMessages(updatedMessages);

    setMessage("");

    setLoading(true);

    // Try the computational query engine first — if the question maps
    // to a real, groundable operation (group-by, correlation, filter,
    // etc.) this returns an actually-computed answer. If it doesn't fit
    // any supported operation, it fails cleanly and we fall back to
    // conversational chat below, so this single input handles both
    // "what's the average salary by department" and "summarize this
    // dataset for me" without the user needing two separate boxes.
    if (dataset?.dataset_id) {

      try {

        const queryResponse = await apiFetch("/query", {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({
            dataset_id: dataset.dataset_id,
            question: userText
          })

        });

        if (queryResponse.ok) {

          const queryData = await queryResponse.json();

          const table =
            queryData.result?.type === "table" && queryData.result.rows?.length > 0
              ? { columns: queryData.result.columns, rows: queryData.result.rows }
              : undefined;

          setMessages((prev) => [
            ...prev,
            { role: "ai", text: queryData.answer, table }
          ]);

          setLoading(false);

          return;

        }

      } catch {

        // Network or unexpected error — fall through to conversational chat.

      }

    }

    try {

      const response = await apiFetch(

        "/chat",

        {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            message: userText,

            dataset: buildLightDataset(dataset),

            history: priorMessages.slice(-8).map(({ role, text }) => ({ role, text })),

            dataset_id: dataset?.dataset_id

          })

        }

      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(data.detail || "Chat failed");

      }

      setMessages((prev) => [

        ...prev,

        { role: "ai", text: data.reply }

      ]);

    } catch (error: any) {

      setMessages((prev) => [

        ...prev,

        {
          role: "ai",
          text: error.message || "AI service unavailable."
        }

      ]);

    } finally {

      setLoading(false);

    }

  }


  async function copyMessage(text: string, index: number) {

    try {

      await navigator.clipboard.writeText(text);

      setCopiedIndex(index);

      setTimeout(() => setCopiedIndex(null), 1500);

    } catch (error) {

      console.error("Copy failed:", error);

    }

  }


  return (

    <>

      {/* Floating Button */}

      <button

        onClick={() => setOpen(!open)}

        className="
        fixed
        bottom-6
        right-6
        w-16
        h-16
        rounded-full
        bg-[var(--color-accent)]
        text-[var(--color-ink)]
        
        flex
        items-center
        justify-center
        hover:opacity-90
        transition
        z-50
        "

      >

        {open ? <X size={28} /> : <MessageCircle size={28} />}

      </button>


      {open && (

        <div

          className="
          fixed
          bottom-24
          right-6
          w-[420px]
          max-w-[calc(100vw-2rem)]
          h-[680px]
          max-h-[calc(100vh-7rem)]
          bg-[var(--color-ink)]
          border
          border-[var(--color-border)]
          rounded-2xl
          shadow-2xl
          p-6
          z-40
          flex
          flex-col
          "

        >

          {/* Header */}

          <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">

            <div className="relative bg-[var(--color-accent-dim)] p-3 rounded-xl">

              <Bot className="text-[var(--color-accent)]" size={22} />

              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--color-success)] border-2 border-[var(--color-ink)]" />

            </div>

            <div>

              <h2 className="font-semibold text-base">Ava</h2>

              <p className="text-xs text-[var(--color-text-secondary)]">Your AI data assistant</p>

            </div>

          </div>


          {/* Messages */}

          <div ref={chatRef} className="flex-1 overflow-y-auto py-4 space-y-4">

            {messages.length === 0 && (

              <div className="space-y-4">

                <p className="text-[var(--color-text-muted)] text-sm">

                  Hi, I'm Ava — ask me anything about your dataset, or anything else. I'll compute a real answer from your data where I can.

                </p>

                {suggestedQuestions.length > 0 && (

                  <div className="space-y-2">

                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">

                      <Sparkles size={12} />
                      Suggested questions

                    </p>

                    {suggestedQuestions.map((q, index) => (

                      <button

                        key={index}

                        onClick={() => sendMessage(q)}

                        className="
                        block
                        w-full
                        text-left
                        text-sm
                        text-[var(--color-text-secondary)]
                        bg-[var(--color-surface)]
                        hover:bg-[var(--color-surface-raised)]
                        border
                        border-[var(--color-border)]
                        rounded-xl
                        px-3
                        py-2
                        transition
                        "

                      >

                        {q}

                      </button>

                    ))}

                  </div>

                )}

              </div>

            )}

            {messages.map((msg, index) => (

              <div

                key={index}

                className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}

              >

                <div

                  className={

                    msg.role === "user"

                      ? "bg-[var(--color-accent)] text-[var(--color-text-primary)] rounded-xl rounded-br-none px-4 py-3 max-w-[85%]"
                      : "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] rounded-xl rounded-bl-none px-4 py-3 max-w-[90%] group relative"

                  }

                >

                  <div className="flex gap-2 items-center justify-between text-xs opacity-70 mb-1">

                    <span className="flex items-center gap-2">

                      {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}

                      {msg.role === "user" ? "You" : "Ava"}

                    </span>

                    {msg.role === "ai" && (

                      <button

                        onClick={() => copyMessage(msg.text, index)}

                        className="opacity-0 group-hover:opacity-100 transition"

                        title="Copy response"

                      >

                        {copiedIndex === index ? (

                          <Check size={13} className="text-[var(--color-success)]" />

                        ) : (

                          <Copy size={13} />

                        )}

                      </button>

                    )}

                  </div>

                  {msg.role === "ai" ? (

                    <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">

                      <ReactMarkdown

                        remarkPlugins={[remarkGfm]}

                        components={{

                          p: ({ children }) => <p className="mb-2">{children}</p>,

                          ul: ({ children }) => (
                            <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
                          ),

                          ol: ({ children }) => (
                            <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
                          ),

                          strong: ({ children }) => (
                            <strong className="font-semibold text-[var(--color-text-primary)]">{children}</strong>
                          ),

                          code: ({ children }) => (
                            <code className="bg-[var(--color-ink)]/40 px-1 py-0.5 rounded text-xs">
                              {children}
                            </code>
                          )

                        }}

                      >

                        {msg.text}

                      </ReactMarkdown>

                      {msg.table && (

                        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] mt-2">

                          <table className="w-full text-xs">

                            <thead>

                              <tr className="bg-[var(--color-ink)]">

                                {msg.table.columns.map((col) => (

                                  <th

                                    key={col}

                                    className="text-left px-3 py-1.5 text-[var(--color-text-muted)] font-medium flex items-center gap-1"

                                  >

                                    {col === msg.table?.columns[0] && <Table2 size={10} />}

                                    {col}

                                  </th>

                                ))}

                              </tr>

                            </thead>

                            <tbody>

                              {msg.table.rows.slice(0, 10).map((row, rowIndex) => (

                                <tr key={rowIndex} className="border-t border-[var(--color-border)]">

                                  {msg.table?.columns.map((col) => (

                                    <td key={col} className="px-3 py-1.5 text-[var(--color-text-secondary)] data-num">

                                      {String(row[col])}

                                    </td>

                                  ))}

                                </tr>

                              ))}

                            </tbody>

                          </table>

                        </div>

                      )}

                    </div>

                  ) : (

                    <p className="whitespace-pre-line text-sm">{msg.text}</p>

                  )}

                </div>

              </div>

            ))}

            {loading && (

              <div className="text-[var(--color-text-muted)] text-sm flex items-center gap-2">

                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce" />

                AI is thinking...

              </div>

            )}

          </div>


          {/* Input */}

          <div className="flex gap-2 border-t border-[var(--color-border)] pt-4">

            <input

              value={message}

              onChange={(e) => setMessage(e.target.value)}

              onKeyDown={(e) => {

                if (e.key === "Enter" && !loading) sendMessage();

              }}

              placeholder="Message Ava..."

              disabled={loading}

              className="
              flex-1
              bg-[var(--color-ink)]
              border
              border-[var(--color-border)]
              rounded-xl
              px-4
              outline-none
              disabled:opacity-50
              "

            />

            <button

              onClick={() => sendMessage()}

              disabled={loading || !message.trim()}

              className="
              bg-[var(--color-accent)]
              text-[var(--color-ink)]
              rounded-xl
              px-4
              disabled:opacity-40
              "

            >

              <Send size={18} />

            </button>

          </div>

        </div>

      )}

    </>

  );

}