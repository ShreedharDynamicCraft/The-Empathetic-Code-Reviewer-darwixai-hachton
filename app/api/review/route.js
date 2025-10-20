import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

function buildPrompt(code, comments, tone = "balanced", language = "typescript") {
  const joinedComments = comments
    .map((c, i) => `- Comment ${i + 1}: ${c}`)
    .join("\n");

  const languageMap = {
    typescript: "TypeScript",
    javascript: "JavaScript", 
    python: "Python",
    cpp: "C++",
    java: "Java",
    go: "Go",
    rust: "Rust",
    php: "PHP"
  };

  const languageName = languageMap[language] || "the provided language";

  return `You are an Empathetic Code Reviewer for a hackathon demo. Desired tone: ${tone} (options: gentle, balanced, direct). Turn terse or harsh review comments into kind, educational, specific guidance. Adapt tone based on severity of the original comment: gentle for minor/style issues, more direct yet supportive for correctness/security. Include improved code examples where helpful. Use professional, friendly tone. Use Markdown with headings and code fences.

The code is written in ${languageName}. Please provide language-specific suggestions and follow ${languageName} best practices and conventions.

REQUIRED OUTPUT FORMAT (strict): For EACH original comment, produce a section with EXACTLY these sub-sections:

## Summary
- Briefly summarize the key issues and goals.

## Step-by-step guidance
- Explain the why for each point and how to fix it.

## Improved examples
- Provide short, focused code snippets with explanations.

## Next actions
- Bullet list of what to change and how to verify.

THEN, for EACH COMMENT provide:
### Analysis of Comment: "<original comment>"
* **Positive Rephrasing:** <empathetic rewrite>
* **The 'Why':** <principle and reasoning>
* **Suggested Improvement:**
\`\`\`${language}
<improved snippet>
\`\`\`
* **Learn more:** Provide 1-2 relevant links (docs, style guides like PEP 8 for Python, MDN for JavaScript, ${languageName} official docs, or algorithmic complexity resources) that support the suggestion.

Finally, end with:
## Holistic Summary
- An encouraging, high-level wrap-up of strengths, themes, and next steps.

Context code:
\n\n\n--- CODE START ---\n\n${code}\n\n--- CODE END ---\n\n\nReview comments to rewrite empathetically (one per line):\n${joinedComments}\n\nConstraints:
- Avoid shaming language; be supportive.
- Prefer best practices and idiomatic patterns.
- If comments are incorrect, gently correct them with reasoning.
- Use the same language/framework as in the code when giving examples.
- Keep total output under ~800 words.
`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    // Support both { code, comments } and { code_snippet, review_comments }
    const code = body?.code ?? body?.code_snippet ?? "";
    const comments = Array.isArray(body?.comments)
      ? body.comments
      : Array.isArray(body?.review_comments)
      ? body.review_comments
      : [];
    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing GEMINI_API_KEY environment variable. Please add it to your .env.local file." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof code !== "string" || !Array.isArray(comments)) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const tone = typeof body?.tone === "string" ? body.tone : "balanced";
    const language = typeof body?.language === "string" ? body.language : "typescript";
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
    const prompt = buildPrompt(code, comments, tone, language);

    const response = await model.generateContent(prompt);
    const text = response?.response?.text?.() || "";

    return new Response(JSON.stringify({ markdown: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err?.message || "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


