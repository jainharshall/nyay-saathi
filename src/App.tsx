/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  FileSearch, 
  BookOpen, 
  ArrowRightLeft, 
  Scale, 
  FileText, 
  ScanText, 
  PenLine, 
  Languages, 
  Home, 
  AlertCircle, 
  Banknote, 
  FileCheck, 
  MessageSquareWarning,
  Plus,
  ArrowUp,
  Sparkles,
  ExternalLink,
  Scan,
  Lock,
  User,
  Copy,
  Image as ImageIcon,
  Mic,
  MicOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GoogleGenAI } from "@google/genai";
import { Auth } from "./components/Auth";
import { supabase } from "./lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useLanguage } from "./contexts/LanguageContext";
import { LanguageSelector } from "./components/LanguageSelector";

// Initialize Gemini SDK on the frontend as per system guidelines
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

type ToolType = 
  | 'research' | 'case_search' | 'section_search' | 'ipc_bns' 
  | 'arguments' | 'summarize' | 'ocr' | 'draft' 
  | 'risk_scoring' | 'title_search' | 'notary' | 'affidavit' | 'consumer_complaint';

interface NavItemProps {
  id: ToolType;
  icon: React.ReactNode;
  label: string;
  isNew?: boolean;
  isActive: boolean;
  onClick: () => void;
  isPublic?: boolean;
}

const NavItem = ({ icon, label, isNew, isActive, onClick, isPublic }: NavItemProps) => {
  const { t } = useLanguage();
  return (
  <button
    onClick={onClick}
    className={`group flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all duration-200 ${
      isActive 
        ? "bg-[#0C2431] text-[#0EA5E9]" 
        : "text-[#8E9299] hover:bg-[#1A1B1E] hover:text-white"
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`${isActive ? "text-[#0EA5E9]" : "text-[#8E9299] group-hover:text-white"}`}>
        {icon}
      </div>
      <span className="text-sm font-medium tracking-tight whitespace-nowrap">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {isNew && (
        <span className="bg-[#0EA5E9] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
          {t('labels.new')}
        </span>
      )}
      {isActive && <div className="w-1 h-1 rounded-full bg-[#0EA5E9] ml-2" />}
      {isPublic && <ExternalLink size={14} className="opacity-0 group-hover:opacity-50" />}
    </div>
  </button>
  );
};

export default function App() {
  const { t, language } = useLanguage();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingSession(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  const [activeTool, setActiveTool] = useState<ToolType>('research');
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [researchData, setResearchData] = useState<{ 
    analysis: string; 
    title?: string;
    relevant_statutes?: string[];
    legal_notes?: string;
    draft?: string;
    risk_level?: string;
    error?: string;
  } | null>(null);

  // Clear results when switching tools
  useEffect(() => {
    setResearchData(null);
    setShowResults(false);
    setSearchQuery("");
    setSelectedFile(null);
  }, [activeTool]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result?.toString().split(',')[1];
        resolve(base64String || "");
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const toggleVoiceInput = () => {
    setMicError(null);
    
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(prev => prev ? prev + ' ' + transcript : transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setMicError("Microphone permission denied.");
      }
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSearch = async (overrideQuery?: string) => {
    const queryToUse = overrideQuery || searchQuery;
    if (!queryToUse.trim() && !selectedFile) return;
    
    setIsSearching(true);
    try {
      let contents: any = queryToUse || "Summarize the attached document.";

      if (selectedFile) {
        const base64Data = await fileToBase64(selectedFile);
        contents = {
          parts: [
            { text: queryToUse || "Please summarize this document thoroughly." },
            { 
              inlineData: { 
                mimeType: selectedFile.type || "application/pdf", 
                data: base64Data 
              } 
            }
          ]
        };
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: `You are "NyayaSaathi AI", a strict tool-based Indian legal assistant.
You MUST ONLY respond according to the selected tool: ${activeTool}.
You are NOT allowed to switch tools based on user input.

STRICT JSON RULE:
- You MUST return ONLY valid JSON.
- Do NOT write any explanation, preamble, or markdown code blocks (like \`\`\`json) before or after the JSON.
- If you fail to follow JSON format, the response is invalid.

STRICT RULES:
1. Tool Name (${activeTool}) is FINAL. Ignore if user input matches another tool.
2. If input does not match the selected tool, return an error message in the "error" field and explanation in "analysis".
3. Output format MUST be this JSON ONLY:
{
  "title": "Clear Title",
  "tool": "${activeTool}",
  "analysis": "Markdown analysis/summary (Leave empty if only drafting)",
  "relevant_statutes": ["Section X IPC/BNS..."],
  "draft": "Full professional draft/template (Only for drafting tools)",
  "risk_level": "Low/Medium/High (ONLY for Risk Scoring)",
  "legal_notes": "Important cautions/notes",
  "error": "Error message if input mismatch"
}

${language === 'hi' ? 'CRITICAL REQUIREMENT: YOU MUST GENERATE ALL TEXT (title, analysis, relevant_statutes, draft, legal_notes, error) ENTIRELY IN HINDI LANGUAGE. THE JSON KEYS MUST REMAIN IN ENGLISH, BUT THE VALUES MUST BE IN HINDI.' : 'CRITICAL REQUIREMENT: YOU MUST GENERATE ALL TEXT ENTIRELY IN ENGLISH.'}

TOOL SPECIFIC ACTIONS:
- Title Search: Provide legal analysis + IPC/BNS mapping. Leave "draft" null.
- Research: Provide structured legal research. DO NOT use paragraphs. Use ONLY bullet points, bold headings, and lists to present information clearly.
- Digital Notary / Affidavit / Consumer Complaint: Provide professional draft in "draft" field. Leave "analysis" brief or empty if draft is complete.
- Risk Scoring: Set "risk_level" to Low/Medium/High. Provide reasoning in "analysis". Leave "draft" null.
- IPC to BNS: Provide mapping in "relevant_statutes". Explain changes in "analysis".
- Summarize: Provide thorough summary in "analysis" using clearly structured markdown with bold headings and bullet points for readability.
- OCR Extraction: You are a high-precision OCR engine. Extract all text from the provided image/document. Maintain formatting and structure. Return in "analysis".

CRITICAL: The "analysis" field MUST be formatted with high-quality Markdown. You are FORBIDDEN from using long paragraphs. Use ONLY bullet points, bold text for emphasis, and structured lists to ensure information is neat and easy to read. Each distinct point or fact MUST be its own bullet point.
CRITICAL: Do not provide information irrelevant to the ${activeTool} tool. If a field is not relevant to ${activeTool}, it MUST be null or empty. All responses MUST be ONLY valid JSON with no markdown formatting surrounding the JSON block.`,
          responseMimeType: "application/json"
        }
      });
      
      if (!response.text) throw new Error("No response from AI");
      
      try {
        const parsedData = JSON.parse(response.text);
        setResearchData({
          analysis: parsedData.analysis || "",
          title: parsedData.title,
          relevant_statutes: parsedData.relevant_statutes,
          legal_notes: parsedData.legal_notes,
          draft: parsedData.draft,
          risk_level: parsedData.risk_level,
          error: parsedData.error
        });
      } catch (e) {
        setResearchData({
          analysis: response.text
        });
      }
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setResearchData({
        analysis: "### ⚠️ Error\nAn error occurred while connecting to NyayaSaathi AI. Please ensure your Gemini API configuration is correct.\n\n" + (error instanceof Error ? error.message : String(error))
      });
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const mainTools: { id: ToolType; icon: React.ReactNode; label: string; isNew?: boolean }[] = [
    { id: 'research', icon: <Search size={18} />, label: t('tools.research') },
    { id: 'case_search', icon: <FileSearch size={18} />, label: t('tools.case_search') },
    { id: 'section_search', icon: <BookOpen size={18} />, label: t('tools.section_search') },
    { id: 'ipc_bns', icon: <ArrowRightLeft size={18} />, label: t('tools.ipc_bns'), isNew: true },
    { id: 'arguments', icon: <Scale size={18} />, label: t('tools.arguments'), isNew: true },
    { id: 'summarize', icon: <FileText size={18} />, label: t('tools.summarize') },
    { id: 'ocr', icon: <Scan size={18} />, label: t('tools.ocr'), isNew: true },
    { id: 'draft', icon: <PenLine size={18} />, label: t('tools.draft') },
  ];

  const publicTools: { id: ToolType; icon: React.ReactNode; label: string; isNew?: boolean }[] = [
    { id: 'risk_scoring', icon: <AlertCircle size={18} />, label: t('tools.risk_scoring') },
    { id: 'title_search', icon: <Home size={18} />, label: t('tools.title_search') },
    { id: 'notary', icon: <PenLine size={18} />, label: t('tools.notary') },
    { id: 'affidavit', icon: <FileCheck size={18} />, label: t('tools.affidavit') },
    { id: 'consumer_complaint', icon: <MessageSquareWarning size={18} />, label: t('tools.consumer_complaint') },
  ];

  const suggestions = [
    t('suggestions.s1'),
    t('suggestions.s2'),
    t('suggestions.s3'),
    t('suggestions.s4')
  ];

  // Map tool headings
  const getToolTitle = (id: ToolType) => {
    return mainTools.find(tool => tool.id === id)?.label || publicTools.find(tool => tool.id === id)?.label || "Legal AI";
  };

  if (loadingSession) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="w-8 h-8 border-4 border-[#0EA5E9]/30 border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#141414] font-sans selection:bg-[#0EA5E9]/30 selection:text-[#0EA5E9]">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0C0D0E] flex flex-col p-4 border-r border-[#1A1B1E] overflow-y-auto shrink-0">
        <div className="mb-8 px-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0EA5E9] rounded-lg flex items-center justify-center">
            <Scale className="text-white" size={20} />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">NyayaSaathi AI</span>
        </div>

        <div className="flex flex-col gap-1 mb-10">
          <p className="px-4 text-[11px] font-bold text-[#555] uppercase tracking-widest mb-2">{t('headings.tools')}</p>
          {mainTools.map((tool) => (
            <NavItem 
              key={tool.id} 
              {...tool} 
              isActive={activeTool === tool.id}
              onClick={() => setActiveTool(tool.id)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="px-4 text-[11px] font-bold text-[#555] uppercase tracking-widest mb-2">{t('headings.public_tools')}</p>
          {publicTools.map((tool) => (
            <NavItem 
              key={tool.id} 
              {...tool} 
              isPublic
              isActive={activeTool === tool.id}
              onClick={() => setActiveTool(tool.id)}
            />
          ))}
        </div>


      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header/Status */}
        <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{getToolTitle(activeTool)} {t('headings.mode')}</span>
          </div>
          <div className="flex items-center gap-4">
             <LanguageSelector />
             <div className="flex items-center gap-2 px-4 border-x border-gray-100">
               <div className="w-8 h-8 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center text-[#0EA5E9]">
                 <User size={16} />
               </div>
               <div className="flex flex-col">
                 <span className="text-sm font-bold text-gray-700">
                   {user.user_metadata?.full_name || user.email?.split('@')[0] || t('labels.councillor')}
                 </span>
                 <span className="text-[10px] text-gray-500">{user.email}</span>
               </div>
             </div>
             <button 
              onClick={handleLogout}
              className="px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-bold hover:bg-gray-50 active:scale-95 transition-all"
             >
               {t('actions.sign_out')}
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
              <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0EA5E9]/5 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0EA5E9]/3 rounded-full blur-[100px]" />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                  key={activeTool}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                  className="max-w-4xl mx-auto py-20 px-8"
                >
                  {!showResults ? (
                    <div className="flex flex-col items-center">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 bg-[#0EA5E9]/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-[#0EA5E9]/20"
                      >
                        <Sparkles className="text-[#0EA5E9]" size={32} />
                      </motion.div>
                      <h1 className="text-4xl font-bold tracking-tight text-[#111827] mb-2">{getToolTitle(activeTool)}</h1>
                      <p className="text-[#6B7280] text-center mb-10 max-w-lg leading-relaxed">
                        {t('headings.hero_subtitle')}
                      </p>

                      <div className="w-full max-w-2xl flex flex-col gap-4 mb-8">
                        {(activeTool === 'summarize' || activeTool === 'ocr') && (
                          <div className="w-full">
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#E5E7EB] rounded-3xl bg-white hover:bg-[#0EA5E9]/5 hover:border-[#0EA5E9] transition-all cursor-pointer group relative overflow-hidden">
                              {selectedFile ? (
                                <div className="flex flex-col items-center gap-2">
                                  {selectedFile.type.startsWith('image/') ? <ImageIcon className="text-[#0EA5E9]" size={32} /> : <FileText className="text-[#0EA5E9]" size={32} />}
                                  <span className="text-sm font-semibold text-[#111827]">{selectedFile.name}</span>
                                  <span className="text-xs text-[#6B7280]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedFile(null);
                                    }}
                                    className="mt-2 text-xs font-bold text-red-500 hover:text-red-600"
                                  >
                                    {t('actions.remove_file')}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-12 h-12 bg-[#F3F4F6] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus className="text-[#6B7280] group-hover:text-[#0EA5E9]" size={24} />
                                  </div>
                                  <p className="text-sm font-medium text-[#6B7280]">
                                    <span className="text-[#0EA5E9] font-bold">{t('labels.click_to_upload')}</span> {t('labels.drag_and_drop')}
                                  </p>
                                  <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                                    {activeTool === 'ocr' ? t('labels.supports_images') : t('labels.supports_docs')}
                                  </p>
                                </div>
                              )}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              />
                            </label>
                          </div>
                        )}

                        <div className="relative group">
                          <div className="absolute inset-0 bg-[#0EA5E9]/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                          <div className="relative bg-white rounded-3xl border-2 border-[#E5E7EB] shadow-2xl shadow-[#0EA5E9]/5 group-focus-within:border-[#0EA5E9] transition-all p-1.5 flex items-center">
                            <input 
                              type="text" 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                              placeholder={activeTool === 'summarize' ? t('placeholders.summarize') : `${t('placeholders.search').replace('...', '')} ${getToolTitle(activeTool)}...`}
                              className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-lg placeholder:text-[#9CA3AF]"
                            />
                            <div className="flex items-center gap-2 pr-2">
                              <button
                                onClick={toggleVoiceInput}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                  isListening 
                                    ? 'bg-red-50 text-red-500 animate-pulse' 
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                                title="Voice Input"
                              >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                              </button>
                              <button 
                                onClick={() => handleSearch()}
                                disabled={isSearching || (activeTool === 'summarize' && !selectedFile && !searchQuery)}
                                className="w-12 h-12 bg-[#0EA5E9] text-white rounded-2xl flex items-center justify-center hover:bg-[#0284C7] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative"
                              >
                                <AnimatePresence mode="wait">
                                  {isSearching ? (
                                    <motion.div
                                      key="loading"
                                      initial={{ y: 20 }}
                                      animate={{ y: 0 }}
                                      exit={{ y: -20 }}
                                      className="flex items-center justify-center"
                                    >
                                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    </motion.div>
                                  ) : (
                                    <motion.div
                                      key="arrow"
                                      initial={{ y: 20 }}
                                      animate={{ y: 0 }}
                                      exit={{ y: -20 }}
                                    >
                                      <ArrowUp size={24} />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </button>
                            </div>
                          </div>
                          {micError && (
                            <p className="absolute -bottom-6 left-6 text-xs text-red-500 font-medium">
                              {micError}
                            </p>
                          )}
                          {isListening && (
                            <p className="absolute -bottom-6 left-6 text-xs text-[#0EA5E9] font-medium flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-[#0EA5E9] rounded-full animate-ping"></span>
                              Listening...
                            </p>
                          )}
                        </div>

                        {/* Suggestions */}
                        {activeTool === 'research' && (
                          <div className="grid grid-cols-2 gap-3 w-full mt-4">
                            {suggestions.map((s, idx) => (
                              <button 
                                key={idx}
                                onClick={() => {
                                  setSearchQuery(s);
                                  handleSearch(s);
                                }}
                                className="text-left px-5 py-4 bg-white border border-[#E5E7EB] rounded-2xl text-[13px] font-medium text-[#4B5563] hover:border-[#0EA5E9] hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/5 hover:shadow-lg transition-all"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-3xl flex flex-col gap-8">
                      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                        <button 
                          onClick={() => setShowResults(false)}
                          className="text-[#6B7280] hover:text-[#111827] flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                          <ArrowRightLeft size={16} className="rotate-180" /> {t('actions.change_query')}
                        </button>
                        <div className="flex items-center gap-2">
                           <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-gray-50 flex items-center gap-1.5">
                             <PenLine size={14} /> {t('actions.draft_note')}
                           </button>
                           <button className="px-3 py-1.5 rounded-lg bg-[#1A1B1E] text-white text-xs font-semibold hover:bg-black flex items-center gap-1.5">
                             <FileText size={14} /> {t('actions.export_pdf')}
                           </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[#0EA5E9] text-xs font-bold uppercase tracking-widest">
                          <Scale size={14} /> {getToolTitle(activeTool)} {t('headings.output')}
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-[#111827] leading-tight">
                          {researchData?.title || searchQuery || (selectedFile ? selectedFile.name : "Legal Document Analysis")}
                        </h2>
                        
                        <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] leading-relaxed text-[#374151] space-y-10">
                           {researchData?.error && (
                             <div className="flex items-center gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600">
                               <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                                 <AlertCircle size={20} />
                               </div>
                               <div>
                                 <p className="text-sm font-bold">{t('headings.system_alert')}</p>
                                 <p className="text-xs opacity-80">{researchData.error}</p>
                               </div>
                             </div>
                           )}

                           <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                              <div className="flex items-center gap-3 text-[#0EA5E9] bg-[#0EA5E9]/5 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider">
                                <Sparkles size={16} /> {t('headings.ai_analysis')}
                              </div>
                              {activeTool === 'risk_scoring' && researchData?.risk_level && (
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider ${
                                  researchData.risk_level.toLowerCase() === 'high' ? 'bg-red-50 text-red-600' : 
                                  researchData.risk_level.toLowerCase() === 'medium' ? 'bg-orange-50 text-orange-600' : 
                                  'bg-green-50 text-green-600'
                                }`}>
                                  <AlertCircle size={14} /> {t('headings.risk')} {researchData.risk_level}
                                </div>
                              )}
                           </div>

                           {researchData?.analysis && (
                             <div className="markdown-body prose prose-slate prose-lg max-w-none prose-headings:text-[#111827] prose-headings:font-bold prose-headings:tracking-tight prose-p:text-[#4B5563] prose-li:text-[#4B5563] prose-strong:text-[#111827] prose-a:text-[#0EA5E9] prose-img:rounded-3xl prose-blockquote:border-l-[#0EA5E9] prose-blockquote:bg-gray-50 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl">
                               <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                 {researchData.analysis}
                               </ReactMarkdown>
                             </div>
                           )}

                           {['notary', 'affidavit', 'consumer_complaint', 'draft'].includes(activeTool) && researchData?.draft && (
                             <div className="p-8 bg-[#F8F9FA] rounded-[32px] border border-gray-100 relative overflow-hidden group">
                               <div className="absolute top-0 right-0 w-32 h-32 bg-[#0EA5E9]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                               
                               <h4 className="text-xs font-bold text-[#9CA3AF] mb-6 uppercase tracking-[0.2em] flex items-center justify-between relative z-10">
                                 <span>{t('headings.official_draft')}</span>
                                 <button 
                                   onClick={() => {
                                     navigator.clipboard.writeText(researchData.draft || "");
                                   }}
                                   className="flex items-center gap-2 bg-white text-[#111827] px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 lowercase font-medium"
                                 >
                                   <Copy size={14} /> {t('actions.copy_draft')}
                                 </button>
                               </h4>
                               <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative z-10">
                                 <pre className="text-sm font-mono text-[#374151] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                   {researchData.draft}
                                 </pre>
                               </div>
                             </div>
                           )}

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                             {['research', 'case_search', 'section_search', 'ipc_bns', 'title_search', 'arguments', 'summarize'].includes(activeTool) && researchData?.relevant_statutes && researchData.relevant_statutes.length > 0 && (
                               <div className="space-y-4">
                                 <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest flex items-center gap-2">
                                   <BookOpen size={14} className="text-[#0EA5E9]" /> {t('headings.legal_citations')}
                                 </h4>
                                 <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                   <ul className="space-y-3">
                                     {researchData.relevant_statutes.map((section, idx) => (
                                       <li key={idx} className="text-sm text-[#6B7280] flex gap-3">
                                         <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] mt-2 shrink-0" />
                                         {section}
                                       </li>
                                     ))}
                                   </ul>
                                 </div>
                               </div>
                             )}

                             {researchData?.legal_notes && (
                               <div className="space-y-4">
                                 <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest flex items-center gap-2">
                                   <AlertCircle size={14} className="text-[#0EA5E9]" /> {t('headings.legal_advisory')}
                                 </h4>
                                 <div className="bg-[#0EA5E9]/5 rounded-2xl p-6 border border-[#0EA5E9]/10">
                                   <p className="text-sm text-[#0EA5E9] leading-relaxed font-medium italic">
                                     "{researchData.legal_notes}"
                                   </p>
                                 </div>
                               </div>
                             )}
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            setShowResults(false);
                            setResearchData(null);
                            setSelectedFile(null);
                            setSearchQuery("");
                          }}
                          className="mt-8 px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"
                        >
                          {t('actions.new_research')}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      );
    }
