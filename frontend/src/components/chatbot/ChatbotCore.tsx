"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Message, useChatbotStore } from "@/lib/store/chatbotStore";
import WindowSendButton from "@/components/chatbot/WindowSendButton";
import './style.css';




type ParsedWeek = {
  week: string
  actions: string[]
}


type ParsedDetail = {
  label: string
  value: string
}

type ParsedAI = {
  title: string
  period?: string
  details: ParsedDetail[]
  weeks: ParsedWeek[]
}

export default function ChatbotCore() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    loading,
    sendMessage,
    clearChat,
    loadFromStorage,
  } = useChatbotStore();

  

 

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const cleanMarkdown = (s = '') =>
  s
    .replace(/(^|\n)\s*[-*•]\s+/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\*{1,3}/g, '')
    .trim()


function analyticsTextToMarkdown(raw = ''): string {
  const text = raw.replace(/\r\n/g, '\n').trim()
  if (!text) return ''

  // Normalize spaces but keep newlines
  const normalized = text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // --- Split SUMMARY / ACTIONS even if they're in same line ---
  const upper = normalized.toUpperCase()
  const sIdx = upper.indexOf('SUMMARY')
  const aIdx = upper.indexOf('ACTIONS')

  const summaryPart =
    sIdx >= 0 && aIdx > sIdx ? normalized.slice(sIdx + 'SUMMARY'.length, aIdx).trim() : ''
  const actionsPart =
    aIdx >= 0 ? normalized.slice(aIdx + 'ACTIONS'.length).trim() : normalized.trim()

  const splitSentences = (s: string) =>
    s
      .replace(/\s+/g, ' ')
      .split(/(?<=[.?!])\s+/)
      .map((x) => x.trim())
      .filter(Boolean)

  let md = ''

  // --- SUMMARY ---
  if (sIdx >= 0) {
    md += `## **SUMMARY**\n\n`
    const bullets = splitSentences(summaryPart)
    bullets.forEach((b) => {
      md += `- ${b}\n`
    })
    md += `\n---\n\n`
  }

  // --- ACTIONS ---
  md += `## **ACTIONS**\n\n`

  // Handle both:
  // 1) "Product name - Classic ..." (single line)
  // 2) Multi-line blocks
  const productChunks = actionsPart
    .split(/Product\s*name\s*[-:]\s*/i)
    .map((x) => x.trim())
    .filter(Boolean)

  // If "Product name -" not present, fallback to old newline-based logic (optional)
  if (productChunks.length === 0) return md.trim()

  let p = 0

  for (const chunk of productChunks) {
    p++

    // Product name = text before first known sentence starter
    const nameMatch = chunk.match(
      /^(.*?)(?=\s+(There is|The increase|The ASP|Sales mix|The sales mix)\b)/i
    )
    const productName = (nameMatch?.[1] || chunk.split('. ')[0] || chunk).trim()

    // Body = rest after productName
    const body = chunk.slice(productName.length).trim()
    const sentences = splitSentences(body)

    const metric1 = sentences[0] || ''
    const metric2 = sentences[1] || ''

    // Remaining sentences -> action (often "Review..." / "Check...")
    const rest = sentences.slice(2).join(' ').trim()
    const actionText = rest.replace(/^Actions?\s*[:\-]\s*/i, '').trim()

    // Outer numbered product
    md += `${p}. **${productName}**\n`

    // Inner points (2 only)
    if (metric1) md += `    1. ${metric1}\n`
    if (metric2) md += `    2. ${metric2}\n`

    // Actions bold (no numeral)
    if (actionText) md += `\n    **Actions: ${actionText}**\n\n`

    md += `\n`
  }

  return md.trim()
}





function parseAIResponse(rawText: string): ParsedAI {
  const result: ParsedAI = { title: '', details: [], weeks: [] }
  if (!rawText) return result

const text = rawText || ''
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  // Find an explicit markdown title if present: "### Title: ..."
  let explicitTitle = ''
  for (const line of lines) {
    const m = line.match(/^#{1,6}\s*Title:\s*(.+)$/i)
    if (m) {
      explicitTitle = m[1].trim()
      break
    }
  }

  // Fallback title: the first non "Key: Value" line
  let fallbackTitle = ''
  for (const line of lines) {
    if (!/^([^:]+):\s*(.+)$/.test(line) && !/^#{1,6}\s*Title:/i.test(line)) {
      fallbackTitle = line
      break
    }
  }

  result.title = explicitTitle || fallbackTitle || ''

  // Optional: try to detect a period range if present in the title line
  const periodMatch = result.title.match(/\(([^)]+)\)/)
  if (periodMatch) {
    result.period = periodMatch[1]
  }

  // Extract "Key: Value" pairs from bullet or normal lines
  for (const line of lines) {
    // Skip the explicit or fallback title line to avoid duplication
    if (
      result.title &&
      (line === result.title || line.replace(/^Title:\s*/i, '').trim() === result.title)
    ) {
      continue
    }
    const kv = line.match(/^\s*(?:[-*•]\s*)?([^:]+):\s*(.+)\s*$/)
    if (kv) {
      const label = kv[1].trim()
      const value = kv[2].trim()
      result.details.push({ label, value })
    }
  }

  // Optional: parse "Week N ..." sections
  const weekRegex = /(Week\s+\d+[^\n]*)([\s\S]*?)(?=Week\s+\d+|$)/gi
  let wk: RegExpExecArray | null
  while ((wk = weekRegex.exec(text)) !== null) {
    const weekTitle = wk[1].trim()
    const actions = wk[2]
      .split(/\r?\n/)
      .map((l) => cleanMarkdown(l).trim())
      .filter(Boolean)
    if (actions.length) result.weeks.push({ week: weekTitle, actions })
  }

  return result
}

  function convertPlainTextToMarkdown(text: string): string {
  const lines = text.split('\n');
  let out: string[] = [];

  let productIndex = 0;
  let collectingProductPoints = false;
  let productPoints: string[] = [];

  let inConsolidatedActions = false;
  let consolidatedPoints: string[] = [];

  const flushProductPoints = () => {
    if (productPoints.length > 0) {
      productPoints.forEach(p => out.push(`1. ${p}`)); // ordered list
      productPoints = [];
    }
  };

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // ================= SUMMARY =================
    if (/^SUMMARY$/i.test(line)) {
      flushProductPoints();
      out.push('## **SUMMARY**');
      collectingProductPoints = false;
      inConsolidatedActions = false;
      continue;
    }

    // ================= ACTIONS =================
    if (/^ACTIONS$/i.test(line)) {
      flushProductPoints();
      out.push('\n## **ACTIONS**');
      collectingProductPoints = false;
      inConsolidatedActions = false;
      continue;
    }

    // ========== CONSOLIDATED ACTIONS ==========
    if (/^CONSOLIDATED ACTIONS$/i.test(line)) {
      flushProductPoints();
      out.push('\n## **CONSOLIDATED ACTIONS**');
      collectingProductPoints = false;
      inConsolidatedActions = true;
      continue;
    }

    // ================= PRODUCT NAME =================
    const productMatch = line.match(/^Product name\s*-\s*(.+)$/i);
    if (productMatch) {
      flushProductPoints();
      productIndex++;
      out.push(`\n### ${productIndex}. **Product name – ${productMatch[1].trim()}**`);
      collectingProductPoints = true;
      inConsolidatedActions = false;
      continue;
    }

    // ================= ACTION LINE =================
    if (/^(Review|Check)\b/i.test(line)) {
      flushProductPoints();
      out.push(`\n**Action: ${line}**\n`);
      collectingProductPoints = false;
      inConsolidatedActions = false;
      continue;
    }

    // ================= PRODUCT POINTS =================
    if (collectingProductPoints) {
      const sentences = line
        .split(/(?<=[.])\s+/)
        .map(s => s.trim())
        .filter(Boolean);

      productPoints.push(...sentences);
      continue;
    }

    // ========== CONSOLIDATED ACTION POINTS ==========
    if (inConsolidatedActions) {
      consolidatedPoints.push(line);
      continue;
    }

    // ================= SUMMARY BULLETS =================
    out.push(`- ${line}`);
  }

  // Flush remaining product points
  flushProductPoints();

  // Flush consolidated actions as ordered list
  if (consolidatedPoints.length > 0) {
    consolidatedPoints.forEach(p => out.push(`1. ${p}`));
  }

  return out.join('\n');
}

  return (
<div className="flex flex-col h-full overflow-hidden">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3"
      >
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-16">
            Start a conversation 💬
          </p>
        )}

{Array.from(
  new Map(
    messages
      .filter(
        (msg): msg is Message =>
          !!msg && typeof msg === "object" && typeof msg.sender === "string"
      )
      .map((m) => [m.id, m])
  ).values()
).map((msg) => (
  <div
    key={msg.id}
    className={`flex ${
      msg.sender === "user" ? "justify-end" : "justify-start"
    }`}
  >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm
                ${
                  msg.sender === "user"
                    ? "bg-[#5EA68E] text-white rounded-br-md"
                    : "bg-[#F1F1F1] text-gray-800 rounded-bl-md"
                }`}
            >
             {msg.sender !== "user" && msg.text ? (
  (() => {
    const parsed = parseAIResponse(msg.text)
    const isStructured =
      parsed.weeks.length > 0 ||
      /Title:/i.test(msg.text) ||
      /Week\s+\d+/i.test(msg.text)

    if (isStructured && (parsed.title || parsed.details.length > 0)) {
      return (
        <div className="space-y-1 markdown-body">
          {parsed.title && (
            <h3 className="font-semibold text-gray-800">{parsed.title}</h3>
          )}

          {parsed.weeks.length > 0 && (
            <div className="mt-2 space-y-2">
              {parsed.weeks.map((w, idx) => (
                <div key={idx}>
                  <h4 className="font-semibold text-sm text-gray-800">
                    {w.week}
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
                    {w.actions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <ul className="space-y-2">
            {parsed.details.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold">{d.label}:</span>
                <span>{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }

  

    return (
      <div className="markdown-body">
        <ReactMarkdown>
         {convertPlainTextToMarkdown(msg.text)}
        </ReactMarkdown>
      </div>
    )
  })()
) : (
  msg.text
)}

            </div>
          </div>
        ))}

        {loading && (
          <p className="text-xs text-gray-400">Bot typing...</p>
        )}
      </div>

      {/* Input */}
      <div className="px-2 border-t border-gray-300 py-2">
        <div className="flex-1 flex items-center bg-[#D9D9D9] rounded-full px-3 py-2">
        <input
          placeholder="Ask me anything..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = "";
            }
          }}
          className="flex-1 bg-transparent text-black caret-black outline-none text-xs sm:text-sm md:text-[0.75rem] lg:text-[0.875rem] h-full cursor-text"
        />
       <WindowSendButton
  onClick={() => {
    const input = document.querySelector<HTMLInputElement>(
      'input[placeholder="Ask me anything..."]'
    );
    if (input?.value) {
      sendMessage(input.value);
      input.value = "";
    }
  }}
  disabled={loading}
/>
        </div>
        
      </div>

      <p className="text-[10px] text-center text-gray-400 pb-2">
        AI-generated responses. Verify critical info.
      </p>
    </div>
  );
}
