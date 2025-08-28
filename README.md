# 🌟 Empathetic Code Reviewer

> Transform terse code review comments into kind, educational guidance with AI-powered empathy

[![Darwix AI](https://img.shields.io/badge/Powered%20by-Darwix%20AI-purple?style=for-the-badge)](https://darwix.ai)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Google AI](https://img.shields.io/badge/AI-Google%20Gemini-blue?style=for-the-badge)](https://ai.google.dev)
[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-brightgreen?style=for-the-badge)](https://the-empathetic-code-reviewer-darwix.vercel.app/)

## 🎯 Overview

**Empathetic Code Reviewer** is an AI-powered tool that transforms harsh or terse code review comments into constructive, educational, and empathetic feedback. Built for the **Darwix AI Hackathon**, this application helps foster a more positive and learning-oriented development culture.

🔗 **Live Demo**: [https://the-empathetic-code-reviewer-darwix.vercel.app/](https://the-empathetic-code-reviewer-darwix.vercel.app/)

### ✨ Key Features

- 🔄 **Multi-Language Support**: TypeScript, JavaScript, Python, C++, Java, Go, Rust, PHP
- 🐙 **GitHub Integration**: Analyze entire public repositories with smart file selection
- 🎨 **Beautiful UI**: Modern glassmorphism design with smooth animations
- 🤖 **AI-Powered**: Uses Google Gemini for intelligent analysis
- 📊 **Smart Analysis**: Categorizes feedback by severity and impact
- 📚 **Educational**: Provides learning resources and best practices
- 💾 **Session Management**: Save and restore previous reviews
- 🌙 **Dark Mode**: Eye-friendly interface
- 📱 **Responsive**: Works on desktop and mobile

## 🚀 Quick Start

### 🌐 Try the Live Demo
**No setup required!** Experience the app instantly:
👉 **[https://the-empathetic-code-reviewer-darwix.vercel.app/](https://the-empathetic-code-reviewer-darwix.vercel.app/)**

### 💻 Local Development

#### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Google AI API Key

#### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/empathetic-code-reviewer.git
   cd empathetic-code-reviewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Google AI API Configuration
   GEMINI_API_KEY=your_google_ai_api_key_here
   
   # Optional: Disable Next.js telemetry
   NEXT_TELEMETRY_DISABLED=1
   
   # Optional: Set different model (default: gemini-1.5-flash)
   # GOOGLE_AI_MODEL=gemini-1.5-pro
   
   # Optional: Enable debug mode
   # DEBUG=true
   ```

4. **Get Google AI API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env.local` file

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open the application**
   - **Local**: Navigate to [http://localhost:3000](http://localhost:3000)
   - **Live Demo**: Visit [https://the-empathetic-code-reviewer-darwix.vercel.app/](https://the-empathetic-code-reviewer-darwix.vercel.app/)

## 💡 How It Works

### 🎯 Code Review Mode

#### Step 1: Choose Your Language
Select from 8 supported programming languages using the dropdown in the code editor.

#### Step 2: Paste Your Code
Add the code snippet you want reviewed in the Monaco editor.

#### Step 3: Add Review Comments
Enter harsh or terse review comments (one per line) such as:
- "Function names are unclear"
- "Missing error handling"
- "Performance could be better"
- "Code structure needs improvement"

#### Step 4: Generate Empathetic Review
Click "Generate Empathetic Review" and watch as AI transforms your comments into:
- **Positive Rephrasing**: Kind, constructive language
- **Educational Context**: The "why" behind each suggestion
- **Code Examples**: Improved snippets with explanations
- **Learning Resources**: Relevant documentation and guides
- **Severity Classification**: High/Medium/Low impact indicators

### 🐙 GitHub Repository Review Mode

#### Step 1: Enter Repository URL
Paste a public GitHub repository URL (e.g., `https://github.com/owner/repo`)

#### Step 2: Fetch Repository Files
Click "Fetch Files" to automatically discover all code files in the repository

#### Step 3: Select Files for Review
Choose which files you want to analyze (supports up to 10 files per review)

#### Step 4: Generate Repository Review
Get a comprehensive analysis including:
- **Repository Overview**: Structure and technology assessment
- **Code Quality Analysis**: Strengths and improvement areas
- **File-by-File Insights**: Specific feedback for each file
- **Security Considerations**: Potential security issues
- **Performance Opportunities**: Optimization suggestions
- **Architecture Feedback**: Design pattern recommendations

### Step 5: Review & Share
- Preview the formatted output
- Copy or download as Markdown
- Save sessions for future reference

## 🎛️ Configuration Options

### Tone Settings
- **🌸 Gentle**: Extra supportive for sensitive contexts
- **⚖️ Balanced**: Professional yet friendly (default)
- **⚡ Direct**: Straightforward but respectful

### AI Models
- `gemini-1.5-flash` (default): Fast, efficient
- `gemini-1.5-pro`: More detailed analysis

## 📁 Project Structure

```
empathetic-code-reviewer/
├── app/
│   ├── api/
│   │   ├── review/route.js          # Individual code review endpoint
│   │   ├── github/route.js          # GitHub repository fetching
│   │   └── github-review/route.js   # GitHub repository analysis
│   ├── globals.css                  # Global styles
│   ├── layout.js                   # Root layout
│   └── page.js                     # Main application
├── components/ui/                  # Reusable UI components
├── lib/                           # Utility functions
├── public/                        # Static assets
├── .env.local                     # Environment variables
├── package.json                   # Dependencies
└── README.md                      # This file
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19
- **Styling**: Tailwind CSS 4, Framer Motion
- **Code Editor**: Monaco Editor
- **AI**: Google Generative AI (Gemini)
- **Markdown**: React Markdown, Syntax Highlighting
- **UI Components**: Custom glassmorphism design
- **Icons**: Lucide React

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### API Endpoints

- `POST /api/review`: Processes individual code snippets and comments through AI
- `POST /api/github`: Fetches file list from public GitHub repositories  
- `POST /api/github-review`: Analyzes selected files from GitHub repositories

### Key Dependencies

```json
{
  "@google/generative-ai": "AI processing",
  "@monaco-editor/react": "Code editor",
  "framer-motion": "Animations",
  "react-markdown": "Markdown rendering",
  "rehype-highlight": "Syntax highlighting",
  "next-themes": "Theme management",
  "sonner": "Toast notifications"
}
```

## 🎨 Features in Detail

### Multi-Language Support
- **TypeScript**: Full IntelliSense support
- **JavaScript**: ES6+ features
- **Python**: PEP 8 compliant suggestions
- **C++**: Modern C++ standards
- **Java**: Enterprise patterns
- **Go**: Idiomatic Go practices
- **Rust**: Memory safety focus
- **PHP**: Modern PHP 8+ features

### AI-Powered Analysis
- Context-aware feedback transformation
- Severity-based response adaptation
- Educational resource recommendations
- Code improvement suggestions
- Best practice guidance

### User Experience
- Smooth animations and transitions
- Responsive design for all devices
- Keyboard shortcuts (Ctrl+Enter to generate)
- Session persistence with localStorage
- Real-time preview updates

## 🌟 Demo Examples

### Input
```
Bad function names
No error handling
Slow code
```

### Output
```markdown
### Analysis of Comment: "Bad function names"
* **Positive Rephrasing:** Let's work on making function names more descriptive and self-documenting
* **The 'Why':** Clear function names improve code readability and maintainability
* **Suggested Improvement:**
```javascript
// Instead of: process()
// Try: processUserData()
```
* **Learn more:** [Clean Code Naming Conventions](https://...)
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Darwix AI** for hosting this amazing hackathon
- **Google AI** for providing powerful Gemini models
- **Next.js team** for the excellent framework
- **Open source community** for all the wonderful libraries

## 📞 Support

For questions or support, please reach out:
- **Creator**: Shreedhar Anand
- **Event**: Darwix AI Hackathon 2025
- **Theme**: Agent-led, empathetic AI assistance

---

<div align="center">
  
**Built with ❤️ for the Darwix AI Hackathon**

[Visit Darwix AI](https://darwix.ai) | [🚀 Live Demo](https://the-empathetic-code-reviewer-darwix.vercel.app/)

</div>
