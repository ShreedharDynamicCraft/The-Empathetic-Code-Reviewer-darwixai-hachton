import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

function buildGithubPrompt(files, tone = "balanced") {
  const fileContents = files.map((file, index) => 
    `### File ${index + 1}: ${file.path}
Language: ${file.language}
Size: ${file.size} bytes

\`\`\`${file.language.toLowerCase()}
${file.content}
\`\`\`
`
  ).join('\n\n');

  return `You are an Empathetic Code Reviewer analyzing a GitHub repository. Desired tone: ${tone} (options: gentle, balanced, direct). 

Provide a comprehensive, empathetic review of the provided code files. Focus on:
1. Code quality and best practices
2. Architecture and design patterns
3. Security considerations
4. Performance opportunities
5. Maintainability improvements
6. Documentation and readability

Use professional, friendly tone. Be constructive and educational. Use Markdown with headings and code fences.

REQUIRED OUTPUT FORMAT:

## Repository Overview
- Brief summary of the codebase structure and purpose
- Key technologies and patterns identified

## Code Quality Analysis

### Strengths 💚
- Highlight positive aspects of the code
- Good practices being followed

### Areas for Improvement 🔧
For each improvement area, provide:
- **Issue**: What could be better
- **Why it matters**: The impact on maintainability, performance, or security
- **Suggested approach**: How to improve it
- **Example**: Show improved code when relevant

## File-by-File Insights

${files.map((file, index) => `
### ${file.path}
* **Language**: ${file.language}
* **Purpose**: [Infer the file's purpose]
* **Key observations**: 
  - [2-3 key observations about this specific file]
* **Suggestions**:
  - [Specific improvements for this file]
`).join('\n')}

## Security Considerations 🔒
- Identify potential security issues
- Suggest security best practices

## Performance Opportunities ⚡
- Areas where performance could be improved
- Optimization suggestions

## Architecture & Design 🏗️
- Overall code organization feedback
- Design pattern suggestions
- Modularity and separation of concerns

## Next Steps 🎯
- Prioritized list of improvements
- Quick wins vs longer-term refactoring
- Resources for learning more

## Encouragement 🌟
- Positive wrap-up highlighting the good work
- Motivation for continued improvement

---

Files to analyze:
${fileContents}

Remember to be encouraging and educational while providing actionable feedback.`;
}

export async function POST(req) {
  try {
const { files, tone = "balanced", model = "models/gemini-2.5-flash" } = await req.json();
    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files provided for review" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing GEMINI_API_KEY environment variable" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch file contents from GitHub
    const filesWithContent = await Promise.all(
      files.slice(0, 10).map(async (file) => { // Limit to 10 files to avoid token limits
        try {
          const response = await fetch(file.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${file.path}`);
          }
          const data = await response.json();
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          
          // Truncate very long files
          const truncatedContent = content.length > 5000 
            ? content.substring(0, 5000) + '\n\n// ... (file truncated for analysis)' 
            : content;
            
          return {
            ...file,
            content: truncatedContent
          };
        } catch (error) {
          console.error(`Error fetching ${file.path}:`, error);
          return {
            ...file,
            content: `// Error: Could not fetch file content\n// ${error.message}`
          };
        }
      })
    );

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const genModel = genAI.getGenerativeModel({ model });
    const prompt = buildGithubPrompt(filesWithContent, tone);

    const response = await genModel.generateContent(prompt);
    const text = response?.response?.text?.() || "";

    return new Response(
      JSON.stringify({ 
        markdown: text,
        filesAnalyzed: filesWithContent.length,
        totalFiles: files.length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("GitHub review error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate GitHub review" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
