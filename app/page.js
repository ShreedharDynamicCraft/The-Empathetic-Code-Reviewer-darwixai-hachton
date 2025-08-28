"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { 
  Code2, 
  Sparkles, 
  Download, 
  Copy, 
  FileText, 
  Settings, 
  Moon, 
  Sun, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  History,
  Play,
  Eye,
  EyeOff,
  Zap,
  Heart,
  Star,
  Palette
} from "lucide-react";

function GlassCard({ children, className = "", gradient = false }) {
  return (
    <motion.div
      className={`rounded-2xl border border-white/20 ${
        gradient 
          ? 'bg-gradient-to-br from-white/[0.08] via-white/[0.06] to-white/[0.04]' 
          : 'bg-white/[0.06]'
      } backdrop-blur-xl shadow-2xl shadow-black/20 hover:shadow-black/30 transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.005, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}

function FloatingIcon({ icon: Icon, color = "bg-gradient-to-r from-blue-500 to-purple-500", className = "" }) {
  return (
    <motion.div
      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} shadow-lg ${className}`}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Icon size={20} className="text-white" />
    </motion.div>
  );
}

export default function Home() {
  const [code, setCode] = useState("// Paste your code here\n");
  const [comments, setComments] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [sections, setSections] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("editor"); // editor | output | history | github
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("gemini-1.5-flash");
  const [tone, setTone] = useState("balanced");
  const [language, setLanguage] = useState("typescript");
  const [githubUrl, setGithubUrl] = useState("");
  const [githubFiles, setGithubFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const controllerRef = useRef(null);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const languages = {
    typescript: { name: "TypeScript", placeholder: "// Paste your TypeScript code here\n", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    javascript: { name: "JavaScript", placeholder: "// Paste your JavaScript code here\n", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    python: { name: "Python", placeholder: "# Paste your Python code here\n", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    cpp: { name: "C++", placeholder: "// Paste your C++ code here\n", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    java: { name: "Java", placeholder: "// Paste your Java code here\n", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    go: { name: "Go", placeholder: "// Paste your Go code here\n", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    rust: { name: "Rust", placeholder: "// Paste your Rust code here\n", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    php: { name: "PHP", placeholder: "<?php\n// Paste your PHP code here\n", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" }
  };

  const commentsArray = useMemo(
    () =>
      comments
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean),
    [comments]
  );

  async function handleGenerate() {
    if (!code.trim() || commentsArray.length === 0) {
      toast.error("Provide code and at least one comment.");
      return;
    }
    setLoading(true);
    controllerRef.current = new AbortController();
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controllerRef.current.signal,
        body: JSON.stringify({ code, comments: commentsArray, model, tone, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate");
      setMarkdown(data.markdown || "");
      // Parse sections
      if (data.markdown) {
        setSections(parseSections(data.markdown));
      } else {
        setSections([]);
      }
      // Save session
      const entry = {
        id: `${Date.now()}`,
        ts: new Date().toISOString(),
        code,
        comments: commentsArray,
        tone,
        language,
        markdown: data.markdown || "",
      };
      const next = [entry, ...history].slice(0, 10);
      setHistory(next);
      try {
        localStorage.setItem("ecr_history", JSON.stringify(next));
      } catch {}
      toast.success("Empathetic review generated.");
      // Auto-download output.md
      if (data.markdown) {
        const blob = new Blob([data.markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "output.md";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      toast.error(e.message || "Error generating review");
    } finally {
      setLoading(false);
    }
  }
  function extractHolistic(md) {
    const idx = md.indexOf("## Holistic Summary");
    if (idx === -1) return "";
    return md.slice(idx);
  }

  function parseSections(md) {
    try {
      const lines = md.split(/\r?\n/);
      const indices = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("### Analysis of Comment:")) indices.push(i);
      }
      const chunks = [];
      for (let i = 0; i < indices.length; i++) {
        const start = indices[i];
        const end = i + 1 < indices.length ? indices[i + 1] : lines.length;
        const chunk = lines.slice(start, end).join("\n");
        const title = lines[start].replace("### ", "").trim();
        const links = Array.from(chunk.matchAll(/https?:\/\/[^\s)]+/g)).map((m) => m[0]);
        const severity = inferSeverity(chunk);
        chunks.push({ title, chunk, links, severity, open: true });
      }
      return chunks;
    } catch (_) {
      return [];
    }
  }

  function inferSeverity(text) {
    const t = text.toLowerCase();
    if (/security|vulnerab|xss|injection|leak|correct|bug/.test(t)) return "high";
    if (/perform|complex|memory|optimiz/.test(t)) return "medium";
    return "low";
  }

  async function fetchGithubRepo() {
    if (!githubUrl.trim()) {
      toast.error("Please enter a GitHub repository URL");
      return;
    }

    // Extract owner and repo from URL
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      toast.error("Invalid GitHub URL format. Use: https://github.com/owner/repo");
      return;
    }

    const [, owner, repo] = match;
    setGithubLoading(true);
    
    try {
      const response = await fetch(`/api/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to fetch repository");

      setGithubFiles(data.files || []);
      setActiveTab("github");
      toast.success(`Found ${data.files?.length || 0} code files in repository`);
    } catch (error) {
      toast.error(error.message || "Error fetching repository");
    } finally {
      setGithubLoading(false);
    }
  }

  async function generateGithubReview() {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to review");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/github-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          files: selectedFiles,
          tone,
          model 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to generate review");

      setMarkdown(data.markdown || "");
      if (data.markdown) {
        setSections(parseSections(data.markdown));
      } else {
        setSections([]);
      }
      
      setActiveTab("output");
      toast.success("GitHub repository review generated!");
    } catch (error) {
      toast.error(error.message || "Error generating review");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
      // Tab switching
      if (e.altKey && e.key === "1") { e.preventDefault(); setActiveTab("editor"); }
      if (e.altKey && e.key === "2") { e.preventDefault(); setActiveTab("github"); }
      if (e.altKey && e.key === "3") { e.preventDefault(); setActiveTab("output"); }
      if (e.altKey && e.key === "4") { e.preventDefault(); setActiveTab("history"); }
      // Expand/Collapse all
      if (e.altKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        if (!sections.length) return;
        const anyClosed = sections.some(s => !s.open);
        setSections(sections.map(s => ({ ...s, open: anyClosed })));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [code, commentsArray]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ecr_history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10">
        {/* Primary gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-blue-900/20 to-emerald-900/30" />
        
        {/* Animated floating orbs */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -80, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30" />
      </div>

      {/* Landing Hero */}
      <section className="relative flex min-h-[90vh] items-center justify-center px-4 overflow-hidden">
        <div className="mx-auto max-w-4xl text-center relative">
          {/* Floating background accent */}
          <motion.div
            className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-full blur-2xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.img
              src="https://cdn.prod.website-files.com/676fc1b20e9771077431aa16/678e054ff787050cd1390e05_darwix_AI_white_3.0.svg"
              alt="Darwix AI"
              className="mx-auto h-16 w-auto md:h-20 mb-8"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            
            <motion.h1
              className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Empathetic Code
              <span className="block bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Reviewer
              </span>
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Transform terse review comments into kind, educational guidance with 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> AI-powered empathy</span>
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Button 
                onClick={() => document.getElementById('main-app')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-violet-500/25 transition-all duration-300 border-0"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Reviewing
              </Button>
              <Button 
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-8 py-4 text-lg rounded-xl backdrop-blur-sm"
              >
                <Heart className="mr-2 h-5 w-5" />
                Learn More
              </Button>
            </motion.div>
            
            <motion.p
              className="text-sm text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              Created with ❤️ by <span className="text-purple-400 font-semibold">Shreedhar Anand</span> for Darwix AI Hackathon
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Main App */}
      <div id="main-app" className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        {/* Enhanced Header */}
        <motion.div 
          className="mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <FloatingIcon icon={Code2} color="bg-gradient-to-r from-violet-500 to-purple-500" />
            <div>
              <h2 className="text-2xl font-bold text-white">Code Analysis Dashboard</h2>
              <p className="text-white/70">Transform your code reviews with AI empathy</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-white/70" />
                <span className="text-sm text-white/70">Model:</span>
              </div>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-[180px] bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="gemini-1.5-flash"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 text-white/70" />
              <select
                className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-purple-400 focus:outline-none"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="gentle" className="bg-slate-900">🌸 Gentle</option>
                <option value="balanced" className="bg-slate-900">⚖️ Balanced</option>
                <option value="direct" className="bg-slate-900">⚡ Direct</option>
              </select>
            </div>
            
            <Button
              variant="secondary"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
            >
              {mounted ? (resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Settings className="h-4 w-4" />}
            </Button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-1 rounded-xl bg-white/5 border border-white/20 p-1 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                  activeTab === "editor"
                    ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-white border border-violet-500/30"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Code2 className="mr-2 h-4 w-4 inline" />
                Code Review
              </button>
              <button
                onClick={() => setActiveTab("github")}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                  activeTab === "github"
                    ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-white border border-violet-500/30"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <svg className="mr-2 h-4 w-4 inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub Review
              </button>
              <button
                onClick={() => setActiveTab("output")}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                  activeTab === "output"
                    ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-white border border-violet-500/30"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Eye className="mr-2 h-4 w-4 inline" />
                Results
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content - Code Editor */}
        {activeTab === "editor" && (
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Code Editor Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GlassCard gradient>
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FloatingIcon icon={Code2} color="bg-gradient-to-r from-blue-500 to-cyan-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Code Snippet</h3>
                    <p className="text-sm text-white/60">Paste your code for review</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className={`rounded-lg border px-3 py-1 text-xs font-medium ${languages[language].color}`}
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setCode(languages[e.target.value].placeholder);
                    }}
                  >
                    {Object.entries(languages).map(([key, lang]) => (
                      <option key={key} value={key} className="bg-slate-900">
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-6">
                <div className="h-[400px] rounded-xl overflow-hidden border border-white/20 shadow-inner">
                  <Editor
                    height="400px"
                    defaultLanguage={language}
                    language={language}
                    theme="vs-dark"
                    value={code}
                    onChange={(v) => setCode(v ?? "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      fontFamily: "JetBrains Mono, Consolas, monospace",
                      lineNumbers: "on",
                      folding: true,
                      bracketPairColorization: { enabled: true },
                      renderWhitespace: "selection",
                    }}
                  />
                </div>
                <motion.p 
                  className="mt-4 text-xs text-white/60 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Zap className="h-3 w-3" />
                  Supports any programming language with intelligent analysis
                </motion.p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <GlassCard gradient>
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FloatingIcon icon={FileText} color="bg-gradient-to-r from-purple-500 to-pink-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Review Comments</h3>
                    <p className="text-sm text-white/60">One comment per line</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/30">
                    {commentsArray.length} comments
                  </span>
                </div>
              </div>
              <div className="p-6">
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Examples:&#10;• Function names are unclear&#10;• Missing error handling&#10;• Performance could be better&#10;• Code structure needs improvement&#10;• Consider adding documentation"
                  className="min-h-[300px] resize-none bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                />
                
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 h-12 text-lg font-medium rounded-xl shadow-lg hover:shadow-violet-500/25 transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate Empathetic Review
                      </>
                    )}
                  </Button>
                </div>
                
                <motion.div 
                  className="mt-4 flex items-center justify-center gap-4 text-xs text-white/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">Ctrl</kbd> + 
                    <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">Enter</kbd>
                  </span>
                  <span>to generate</span>
                </motion.div>
                
                {/* History Section */}
                {history.length > 0 && (
                  <motion.div 
                    className="mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <History className="h-4 w-4 text-white/70" />
                      <span className="text-sm font-medium text-white/80">Recent Sessions</span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20">
                      {history.map((h) => (
                        <motion.div 
                          key={h.id} 
                          className="flex items-center justify-between rounded-xl border border-white/10 p-4 bg-white/5 hover:bg-white/10 transition-all duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white/90 truncate">{h.comments[0] || "Untitled session"}</div>
                            <div className="text-xs text-white/50 mt-1">{new Date(h.ts).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setCode(h.code);
                                setComments(h.comments.join("\n"));
                                setTone(h.tone || "balanced");
                                setLanguage(h.language || "typescript");
                                setMarkdown(h.markdown);
                                setSections(parseSections(h.markdown));
                                toast.success("Session loaded successfully!");
                              }}
                              className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs px-3 py-1"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Load
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                const next = history.filter((x) => x.id !== h.id);
                                setHistory(next);
                                try { localStorage.setItem("ecr_history", JSON.stringify(next)); } catch {}
                                toast.success("Session deleted");
                              }}
                              className="bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-300 text-xs px-2 py-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
        )}

        {/* GitHub Review Section */}
        {activeTab === "github" && (
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GlassCard gradient>
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FloatingIcon icon={() => (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  )} color="bg-gradient-to-r from-gray-700 to-gray-900" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">GitHub Repository Review</h3>
                    <p className="text-sm text-white/60">Analyze public GitHub repositories</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {/* GitHub URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Repository URL
                    </label>
                    <div className="flex gap-3">
                      <Input
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/owner/repository"
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                      <Button
                        onClick={fetchGithubRepo}
                        disabled={githubLoading}
                        className="bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white border-0"
                      >
                        {githubLoading ? (
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        ) : (
                          <>
                            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                            Fetch Files
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* File Selection */}
                  {githubFiles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Select Files to Review ({selectedFiles.length} selected)
                      </label>
                      <div className="max-h-[400px] overflow-auto bg-white/5 rounded-xl border border-white/20 p-4">
                        <div className="space-y-2">
                          {githubFiles.map((file, index) => (
                            <label key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedFiles.some(f => f.path === file.path)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedFiles([...selectedFiles, file]);
                                  } else {
                                    setSelectedFiles(selectedFiles.filter(f => f.path !== file.path));
                                  }
                                }}
                                className="rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500"
                              />
                              <div className="flex-1">
                                <div className="text-white/90 text-sm">{file.path}</div>
                                <div className="text-white/60 text-xs">{file.language} • {file.size} bytes</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-3">
                        <Button
                          onClick={() => setSelectedFiles(githubFiles)}
                          variant="secondary"
                          className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                        >
                          Select All
                        </Button>
                        <Button
                          onClick={() => setSelectedFiles([])}
                          variant="secondary"
                          className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                        >
                          Clear All
                        </Button>
                        <Button
                          onClick={generateGithubReview}
                          disabled={selectedFiles.length === 0 || loading}
                          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                        >
                          {loading ? (
                            <>
                              <motion.div
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate Review
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
        )}

        {/* Enhanced Output Section */}
        {activeTab === "output" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <GlassCard gradient className="overflow-hidden">
            <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FloatingIcon icon={Eye} color="bg-gradient-to-r from-emerald-500 to-teal-500" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
                  <p className="text-sm text-white/60">AI-powered empathetic code review</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(markdown || "");
                    toast.success("Copied to clipboard! ✨");
                  }}
                  disabled={!markdown}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const blob = new Blob([markdown || ""], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `empathetic-review-${Date.now()}.md`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    toast.success("Downloaded successfully! 📁");
                  }}
                  disabled={!markdown}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="raw">
                    <FileText className="mr-2 h-4 w-4" />
                    Markdown
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-[400px] w-full rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/20 flex items-center justify-center"
                      >
                        <div className="text-center">
                          <motion.div
                            className="w-16 h-16 border-4 border-white/30 border-t-violet-500 rounded-full mx-auto mb-4"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <p className="text-white/80 text-lg font-medium">Analyzing your code...</p>
                          <p className="text-white/60 text-sm mt-2">Generating empathetic insights</p>
                        </div>
                      </motion.div>
                    ) : sections.length > 0 ? (
                      <motion.div
                        key="cards"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                        data-preview-root
                      >
                        {sections.map((s, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.08] via-white/[0.06] to-white/[0.04] backdrop-blur-xl p-6 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
                          >
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-white">{s.title}</h4>
                                  <div
                                    className={`px-3 py-1 rounded-full border text-xs font-medium ${
                                      s.severity === "high" 
                                        ? "border-red-400/40 text-red-300 bg-red-500/10" 
                                        : s.severity === "medium" 
                                        ? "border-amber-400/40 text-amber-300 bg-amber-500/10" 
                                        : "border-emerald-400/40 text-emerald-300 bg-emerald-500/10"
                                    }`}
                                  >
                                    {s.severity === "high" ? "🔴 High" : s.severity === "medium" ? "🟡 Medium" : "🟢 Low"} Impact
                                  </div>
                                </div>
                                {s.links?.length > 0 && (
                                  <div className="flex items-center gap-2 text-xs text-white/60">
                                    <Star className="h-3 w-3" />
                                    <span>{s.links.length} helpful resources included</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    navigator.clipboard.writeText(s.chunk);
                                    toast.success("Section copied! ✨");
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    const next = [...sections];
                                    next[idx] = { ...s, open: !s.open };
                                    setSections(next);
                                  }}
                                >
                                  {s.open ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                              </div>
                            </div>
                            
                            <AnimatePresence>
                              {s.open && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="prose prose-invert max-w-none"
                                >
                                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                      {s.chunk}
                                    </ReactMarkdown>
                                  </div>
                                  {s.links?.length > 0 && (
                                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                                      <div className="text-sm text-white/90 font-medium mb-2 flex items-center gap-2">
                                        <Star className="h-4 w-4" />
                                        Helpful Resources
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {s.links.slice(0, 3).map((l, i) => (
                                          <a 
                                            key={i} 
                                            className="text-xs text-blue-300 hover:text-blue-200 underline decoration-dotted transition-colors px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20" 
                                            href={l} 
                                            target="_blank" 
                                            rel="noreferrer"
                                          >
                                            📖 {new URL(l).hostname}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                        
                        {/* Holistic Summary */}
                        {markdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: sections.length * 0.1 + 0.2 }}
                            className="rounded-2xl border-2 border-gradient-to-r from-violet-500/30 to-purple-500/30 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur p-6"
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <FloatingIcon icon={Sparkles} color="bg-gradient-to-r from-violet-500 to-purple-500" />
                              <h4 className="text-xl font-bold text-white">Holistic Summary</h4>
                            </div>
                            <div className="prose prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                {extractHolistic(markdown)}
                              </ReactMarkdown>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : markdown ? (
                      <motion.div
                        key="fallback"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                      >
                        <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.08] via-white/[0.06] to-white/[0.04] backdrop-blur-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <FloatingIcon icon={Sparkles} color="bg-gradient-to-r from-violet-500 to-purple-500" />
                            <h4 className="text-xl font-bold text-white">Empathetic Code Review</h4>
                          </div>
                          <div className="prose prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                              {markdown}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-[400px] w-full rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/20 flex items-center justify-center"
                      >
                        <div className="text-center">
                          <FloatingIcon icon={Heart} color="bg-gradient-to-r from-pink-500 to-purple-500" className="mx-auto mb-4" />
                          <p className="text-white/80 text-lg font-medium mb-2">Ready for empathetic analysis</p>
                          <p className="text-white/60 text-sm">Add your code and comments above to get started</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TabsContent>
                
                <TabsContent value="raw">
                  <div className="h-[400px] rounded-xl bg-black/40 border border-white/20 overflow-hidden">
                    <pre className="h-full overflow-auto p-6 text-white/90 text-sm whitespace-pre-wrap font-mono">
                      {markdown || "// The raw markdown output will appear here after generation"}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </GlassCard>
        </motion.div>
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Inspired by Darwix AI’s ethos of agent-led, empathetic assistance. Learn more at <a className="underline" href="https://www.darwix.ai/" target="_blank" rel="noreferrer">darwix.ai</a>.
        </footer>
      </div>
    </div>
  );
}
