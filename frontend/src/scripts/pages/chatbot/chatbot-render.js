export function renderBotMessage(data) {
  // fallback text
  if (!data || !data.type) {
    return data;
  }

  if (data.type === "text") {
    return data.content;
  }

  if (data.type === "roadmap") {
    return `
📌 ${data.title}

${data.items.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}
    `.trim();
  }

  if (data.type === "quiz") {
    return `
❓ ${data.question}

${data.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}
    `.trim();
  }

  return "⚠️ Format jawaban tidak dikenali";
}
