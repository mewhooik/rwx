import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Menu,
  Maximize2,
  Bookmark,
  Star,
  FileText,
  TrendingUp,
  Award,
  Users,
  Percent,
  CheckCircle,
  HelpCircle,
  Clock
} from "lucide-react";
import { decryptResponse } from "../utils/crypto";

export interface Question {
  id: string;
  test_series_id: string;
  test_id: string;
  question_type: string;
  question_ui_type: string;
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  option_5?: string;
  option_6?: string;
  option_7?: string;
  option_8?: string;
  option_9?: string;
  option_10?: string;
  option_image_1?: string;
  option_image_2?: string;
  option_image_3?: string;
  option_image_4?: string;
  answer: string;
  solution_heading?: string;
  solution_text?: string;
  positive_marks?: string;
  negative_marks?: string;
  subject?: string;
}

interface TestPlayerProps {
  testId: string;
  testTitle: string;
  testTimeMinutes: number; // e.g. 5 or 60
  questionsUrl?: string; // dynamic URL of questions JSON
  onClose: () => void;
  triggerToast: (msg: string) => void;
}

// Inline HTML Renderer that cleans html wrapper boilerplates
function HtmlRenderer({ html }: { html: string }) {
  if (!html) return null;
  const cleanHtml = html
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .trim();
  return (
    <div
      className="text-slate-800 text-sm sm:text-base leading-relaxed tracking-normal font-sans"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}

export default function TestPlayer({
  testId,
  testTitle,
  testTimeMinutes,
  questionsUrl,
  onClose,
  triggerToast
}: TestPlayerProps) {
  // Questions states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exam States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({}); // idx to selected option string matching option_number, e.g. "1" for option_1
  
  // Question Status states:
  // "not_visited" | "unattempted" | "attempted" | "marked" | "attempted_and_marked"
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  
  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState(testTimeMinutes * 60);
  const [testPhase, setTestPhase] = useState<"taking" | "ended_modal" | "results">("taking");
  
  // Dialog visibility
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Results states
  const [resultsTab, setResultsTab] = useState<"overview" | "analysis">("overview");
  const [analysisFilter, setAnalysisFilter] = useState<"all" | "correct" | "incorrect" | "unattempted" | "marked">("all");
  const [selectedAnalysisIdx, setSelectedAnalysisIdx] = useState(0);

  // Fetch Questions
  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      setError(null);
      try {
        console.log(`Loading questions for test_id: ${testId}, questionsUrl: ${questionsUrl}`);
        
        let data: Question[] | null = null;
        let success = false;

        // 1. Try server proxy first (normal dev / fullstack deploy environments)
        try {
          const queryParams = new URLSearchParams();
          queryParams.set("test_id", testId);
          if (questionsUrl) {
            queryParams.set("url", questionsUrl);
          }
          const response = await fetch(`/api/questions?${queryParams.toString()}`);
          if (response.ok) {
            const rawJson = await response.json();
            const json = decryptResponse(rawJson);
            if (Array.isArray(json) && json.length > 0) {
              data = json;
              success = true;
              console.log("Successfully loaded questions via backend proxy.");
            }
          }
        } catch (proxyErr) {
          console.warn("Proxy fetch failed, trying direct client CDN fetch:", proxyErr);
        }

        // 2. Direct client-side fetch fallback (useful on static hosting platforms like Netlify/Vercel where backend doesn't run)
        if (!success && questionsUrl) {
          try {
            console.log(`Fallback 1: Fetching directly from client CDN URL: ${questionsUrl}`);
            const response = await fetch(questionsUrl, {
              headers: {
                "Accept": "application/json"
              }
            });
            if (response.ok) {
              const json = await response.json();
              if (Array.isArray(json) && json.length > 0) {
                data = json;
                success = true;
                console.log("Successfully loaded questions via direct client CDN fetch.");
              }
            }
          } catch (directErr) {
            console.error("Direct CDN fetch failed:", directErr);
          }
        }

        // 3. Last resort fallback with standard test_id naming scheme
        if (!success) {
          try {
            const fallbackUrl = `https://testseries-assets-v3.classx.co.in/test_title_question/rozgar_db/${testId}/${testId}_questions0.0609933946874508.json`;
            console.log(`Fallback 2: Fetching direct standard fallback URL: ${fallbackUrl}`);
            const response = await fetch(fallbackUrl);
            if (response.ok) {
              const json = await response.json();
              if (Array.isArray(json) && json.length > 0) {
                data = json;
                success = true;
                console.log("Successfully loaded questions via standard fallback direct CDN url.");
              }
            }
          } catch (fallback2Err) {
            console.error("Fallback 2 direct CDN fetch failed:", fallback2Err);
          }
        }

        if (success && data && data.length > 0) {
          setQuestions(data);
          // Initialize status of first question to unattempted, others unvisited
          const initialStatuses: Record<number, string> = {};
          data.forEach((_, idx) => {
            initialStatuses[idx] = idx === 0 ? "unattempted" : "not_visited";
          });
          setStatuses(initialStatuses);
          return;
        }

        throw new Error("Could not load test questions from any source (API Proxy, CDN, or Fallback URLs).");
      } catch (err: any) {
        console.error("Failed to load live question content:", err);
        setError("इस टेस्ट के प्रश्न लोड नहीं हो सके। कृपया अपना इंटरनेट कनेक्शन जांचें या बाद में पुनः प्रयास करें। (Failed to load dynamic test data)");
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [testId, questionsUrl]);

  // Exam Countdown Timer
  useEffect(() => {
    if (testPhase !== "taking" || loading || error) return;
    
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto submit when time runs out
          setTestPhase("ended_modal");
          triggerToast("⏰ समय समाप्त! आपका टेस्ट समाप्त हो गया है।");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [testPhase, loading, error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
        <p className="text-sm font-bold text-slate-500 font-mono tracking-wider uppercase">Loading Test Player...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 gap-4">
        <div className="w-16 h-16 bg-red-100 border border-red-200 rounded-full flex items-center justify-center text-red-600 mb-2">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="font-extrabold text-slate-850 text-base sm:text-lg mb-2">Failed to Load Quiz | टेस्ट लोड नहीं हो सका</h2>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-extrabold text-sm transition cursor-pointer"
          >
            Go Back / वापस जाएं
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentIdx];

  // Helper to change current question index and manage unvisited -> unattempted change
  const navigateToQuestion = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    
    // If the current question was not answered but was "unattempted", keep it "unattempted"
    // For the target question, if it was "not_visited", change it to "unattempted"
    setStatuses((prev) => {
      const updated = { ...prev };
      if (updated[targetIdx] === "not_visited") {
        updated[targetIdx] = "unattempted";
      }
      return updated;
    });
    setCurrentIdx(targetIdx);
  };

  // Click Option Handler
  const handleSelectOption = (optionNumber: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionNumber
    }));
    // Note: Do not submit yet, just record answer
  };

  // Actions
  const handleClearResponse = () => {
    setAnswers((prev) => {
      const updated = { ...prev };
      delete updated[currentIdx];
      return updated;
    });
    setStatuses((prev) => ({
      ...prev,
      [currentIdx]: "unattempted"
    }));
  };

  const handleSaveAndNext = () => {
    const hasAnswer = answers[currentIdx] !== undefined;
    setStatuses((prev) => ({
      ...prev,
      [currentIdx]: hasAnswer ? "attempted" : "unattempted"
    }));
    
    if (currentIdx < questions.length - 1) {
      navigateToQuestion(currentIdx + 1);
    } else {
      triggerToast("यह अंतिम प्रश्न है। आप अपना टेस्ट सबमिट कर सकते हैं!");
    }
  };

  const handleReviewAndNext = () => {
    const hasAnswer = answers[currentIdx] !== undefined;
    setStatuses((prev) => ({
      ...prev,
      [currentIdx]: hasAnswer ? "attempted_and_marked" : "marked"
    }));
    
    if (currentIdx < questions.length - 1) {
      navigateToQuestion(currentIdx + 1);
    } else {
      triggerToast("यह अंतिम प्रश्न है। आप अपना टेस्ट सबमिट कर सकते हैं!");
    }
  };

  // Calculate stats for current test state
  const totalQuestionsCount = questions.length;
  const answeredCount = Object.values(statuses).filter(s => s === "attempted").length;
  const markedCount = Object.values(statuses).filter(s => s === "marked").length;
  const attemptedAndMarkedCount = Object.values(statuses).filter(s => s === "attempted_and_marked").length;
  const unattemptedCount = Object.values(statuses).filter(s => s === "unattempted").length;
  const notVisitedCount = Object.values(statuses).filter(s => s === "not_visited").length;

  const totalAttemptedForSummary = answeredCount + attemptedAndMarkedCount;

  // Submit Logic
  const handleSubmitTest = () => {
    setShowSubmitModal(false);
    setTestPhase("ended_modal");
  };

  // scoring metrics
  const positiveMarksReward = parseFloat(currentQuestion?.positive_marks || "1.00");
  const negativeMarkPenalty = parseFloat(questions[0]?.negative_marks || "0.25");

  // Calculate Final Result metrics
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCalculated = 0;
  let scoreCalculated = 0;

  questions.forEach((q, idx) => {
    const userAns = answers[idx];
    if (userAns === undefined) {
      unattemptedCalculated++;
    } else {
      if (userAns === q.answer) {
        correctCount++;
        scoreCalculated += positiveMarksReward;
      } else {
        incorrectCount++;
        scoreCalculated -= negativeMarkPenalty;
      }
    }
  });

  const finalScore = Math.max(0, parseFloat(scoreCalculated.toFixed(2)));
  const maxPossibleMarks = totalQuestionsCount * positiveMarksReward;
  const finalAccuracy = totalAttemptedForSummary > 0 ? Math.round((correctCount / totalAttemptedForSummary) * 100) : 0;
  const finalPercentile = Math.max(10, Math.min(99, Math.round(55 + (correctCount * 4) + Math.random() * 5)));
  const finalRank = Math.round(1805 - (correctCount * 145) + Math.round(Math.random() * 20));

  // Determine section/subject name from questions (or fall back to the dynamic topic of the active test)
  const sectionName = (questions[0]?.subject && questions[0]?.subject !== "English & Reasoning") 
    ? questions[0]?.subject 
    : (testTitle || "General Practice");

  return (
    <div id="test_player_root" className="h-screen overflow-y-auto bg-slate-100 flex flex-col font-sans antialiased">
      
      {/* ----------------- EXAM TAKING PHASE ----------------- */}
      {testPhase === "taking" && (
        <>
          {/* Header Panel */}
          <header className="bg-white border-b border-slate-200 h-16 px-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-50 rounded-full border border-slate-200 overflow-hidden p-1 flex items-center justify-center">
                <img
                  src="https://nocache-appxdb-v2.classx.co.in/subject/2025-02-10-0.12268714003029602.jpeg"
                  alt="RWA Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <h2 className="font-extrabold text-xs sm:text-sm text-slate-800 tracking-tight leading-snug">
                  {testTitle}
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-black tracking-wide uppercase font-mono mt-0.5">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Time Left: {formatTime(secondsRemaining)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden leading-none sm:inline-block bg-slate-100 text-[10px] font-black text-slate-600 font-mono tracking-wider py-1 px-2 border border-slate-200 rounded-lg">
                TEST ID: #{testId}
              </span>
              <button
                onClick={() => {
                  setShowExitModal(true);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Core App Stage */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            
            {/* Left Box: Question Display & Answer Options */}
            <section className="lg:col-span-8 flex flex-col justify-between bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm min-h-[400px] select-none">
              <div>
                
                {/* Score guidelines */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <span className="text-[10px] sm:text-xs text-slate-500 font-bold bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
                    Marks: <span className="text-green-600 font-black">+{positiveMarksReward.toFixed(2)}</span> | Negative: <span className="text-red-500 font-black">-{negativeMarkPenalty.toFixed(2)}</span>
                  </span>
                  <span className="text-xs font-black text-blue-600 font-mono py-1 px-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                    English Mode
                  </span>
                </div>

                {/* Sub-header navigation mode */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-center font-bold text-xs text-slate-600 mb-5">
                  Subject: <span className="text-slate-800 font-black ml-1 uppercase font-mono">{sectionName}</span>
                </div>

                {/* Question rendering */}
                <div className="my-3">
                  <span className="text-xs font-black text-blue-700 tracking-wider font-mono bg-blue-50 border border-blue-105 rounded-lg py-1 px-2.5 inline-block mb-3">
                    Question No: {currentIdx + 1}.
                  </span>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 mb-5">
                    <HtmlRenderer html={currentQuestion.question} />
                  </div>
                </div>

                {/* Options representation */}
                <div className="flex flex-col gap-3">
                  {[
                    { num: "1", text: currentQuestion.option_1, label: "a." },
                    { num: "2", text: currentQuestion.option_2, label: "b." },
                    { num: "3", text: currentQuestion.option_3, label: "c." },
                    { num: "4", text: currentQuestion.option_4, label: "d." }
                  ].map((opt) => {
                    const isSelected = answers[currentIdx] === opt.num;
                    return (
                      <button
                        key={opt.num}
                        onClick={() => handleSelectOption(opt.num)}
                        className={`w-full flex items-center text-left py-3.5 px-5 rounded-2xl border-2 transition active:scale-[0.99] group ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                            : "bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-800"
                        }`}
                      >
                        <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center font-bold text-xs sm:text-sm mr-3 transition ${
                          isSelected
                            ? "bg-white text-blue-600 border-white font-black"
                            : "bg-white text-slate-500 border-slate-200 font-bold"
                        }`}>
                          {opt.label}
                        </span>
                        <div className="flex-1 font-bold text-xs sm:text-sm tracking-tight pt-0.5 group-hover:translate-x-0.5 transition-transform duration-100">
                          <HtmlRenderer html={opt.text} />
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Action bar on the bottom */}
              <div className="border-t border-slate-100 pt-5 mt-8 grid grid-cols-2 sm:flex sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                  <button
                    onClick={() => navigateToQuestion(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-40 text-slate-700 font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={handleReviewAndNext}
                    className="flex-1 sm:flex-initial bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Review & Next</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                  <button
                    onClick={handleClearResponse}
                    className="flex-1 sm:flex-initial bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl transition cursor-pointer"
                  >
                    Clear Response
                  </button>
                  <button
                    onClick={handleSaveAndNext}
                    className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    Save & Next
                  </button>
                </div>
              </div>

            </section>

            {/* Right Box: Grid and Legends panel */}
            <aside className="lg:col-span-4 flex flex-col gap-4">
              
              {/* Legends container */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h3 className="font-extrabold text-xs text-slate-500 font-mono tracking-wider uppercase mb-3 border-b border-slate-100 pb-2">
                  Question Legends
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[10px] sm:text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-2 border border-slate-150">
                    <span className="w-7 h-7 rounded-full bg-violet-600 border border-violet-700 text-white flex items-center justify-center text-xs shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-white text-white" />
                    </span>
                    <span>Marked For Review</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-2 border border-slate-150">
                    <span className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black shadow-sm">✓</span>
                    <span>Attempted</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-2 border border-slate-150">
                    <span className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow-sm font-black">✗</span>
                    <span>Unattempted</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-2 border border-slate-150">
                    <span className="w-7 h-7 rounded-sm border border-slate-200 text-slate-400 flex items-center justify-center text-[10px] shadow-sm bg-white font-bold">1</span>
                    <span>Not Visited</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 bg-slate-55 rounded-xl p-2 border border-slate-150 bg-emerald-50/40">
                    <span className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-[9px] font-black relative shadow-sm">
                      ✓ <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300 absolute -bottom-1 -right-1" />
                    </span>
                    <span className="text-[10px]">Attempted & Marked for Review</span>
                  </div>
                </div>
              </div>

              {/* Grid palette panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex-1 flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-extrabold text-xs text-slate-500 font-mono tracking-wider uppercase">
                      Select Question
                    </h3>
                    <span className="text-[10px] bg-slate-100 border border-slate-200 rounded-lg py-1 px-2 font-black text-slate-600 font-mono uppercase tracking-wider">
                      Done: {answeredCount}/{totalQuestionsCount}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-3 max-h-[220px] overflow-y-auto pr-1">
                    {questions.map((_, idx) => {
                      const stat = statuses[idx];
                      const isCurrent = idx === currentIdx;
                      let btnClass = "bg-white border border-slate-205 text-slate-600 hover:bg-slate-50";
                      let badge = null;

                      if (stat === "attempted") {
                        btnClass = "bg-green-600 border-green-700 text-white font-black shadow-sm";
                      } else if (stat === "unattempted") {
                        btnClass = "bg-red-500 border-red-600 text-white shadow-sm font-black";
                      } else if (stat === "marked") {
                        btnClass = "bg-violet-600 border-violet-700 text-white font-black shadow-sm";
                        badge = <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300 absolute -top-1 -right-1" />;
                      } else if (stat === "attempted_and_marked") {
                        btnClass = "bg-green-600 border-green-700 text-white font-black shadow-sm relative";
                        badge = <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300 absolute -top-1 -right-1" />;
                      }

                      if (isCurrent) {
                        btnClass = "border-amber-400 border-4 bg-amber-50 text-slate-900 font-black scale-105 shadow-md shadow-amber-50/50";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => navigateToQuestion(idx)}
                          className={`w-11 h-11 rounded-full flex items-center justify-center relative font-black text-xs transition duration-150 cursor-pointer active:scale-95 ${btnClass}`}
                        >
                          {idx + 1}
                          {badge}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Container */}
                <div className="border-t border-slate-100 pt-5 mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setShowSubmitModal(true);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] sm:text-xs py-3.5 rounded-xl border border-slate-250 transition tracking-wide uppercase font-mono cursor-pointer"
                  >
                    Submit Section
                  </button>
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] sm:text-xs py-3.5 rounded-xl transition shadow-sm tracking-wide uppercase font-mono cursor-pointer"
                  >
                    Submit Test
                  </button>
                </div>

              </div>

            </aside>
          </main>
        </>
      )}

      {/* ----------------- SELECTION SUBMISSION CONFIRMATION MODAL ----------------- */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 transform scale-100 transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-50 border-2 border-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 animate-bounce">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="font-black text-slate-800 text-lg sm:text-xl mb-2">Confirmation</h3>
              <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm mb-6">
                Are you sure you want to submit this section? <br />
                <span className="text-slate-400 text-xs font-medium">कृपया अपने उत्तरों की समीक्षा करें। सबमिट करने के बाद बदलाव नहीं किया जा सकेगा।</span>
              </p>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl py-3 text-slate-700 font-extrabold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTest}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-extrabold text-sm transition"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- EXIT CONFIRMATION MODAL ----------------- */}
      {showExitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 transform scale-100 transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-55/75 border-2 border-red-200 rounded-full flex items-center justify-center text-red-600 mb-4 animate-bounce">
                <AlertTriangle className="w-7 h-7 text-red-500 fill-red-50/20" />
              </div>
              <h3 className="font-black text-slate-800 text-lg sm:text-xl mb-2">Exit Test? | टेस्ट से बाहर निकलें?</h3>
              <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm mb-6">
                क्या आप सच में टेस्ट से बाहर निकलना चाहते हैं? <br />
                <span className="text-slate-400 text-xs font-medium">आपका उत्तर सहेज लिया जाएगा।</span>
              </p>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl py-3 text-slate-700 font-extrabold text-sm transition"
                >
                  Cancel / रद्द करें
                </button>
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    onClose();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-extrabold text-sm transition"
                >
                  Exit / बाहर निकलें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TEST ENDED TRANSITION MODAL ----------------- */}
      {testPhase === "ended_modal" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-5 mx-auto">
              <CheckCircle className="w-8 h-8 font-black text-blue-600" />
            </div>
            <h2 className="font-extrabold text-slate-800 text-xl sm:text-2xl mb-2 tracking-tight">Your test has ended</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto mb-6">
              Please click on view result to proceed and explore full report analysis.
            </p>
            <button
              onClick={() => {
                setTestPhase("results");
                setResultsTab("overview");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3.5 font-extrabold text-sm transition shadow-md shadow-blue-100 cursor-pointer"
            >
              View Result
            </button>
          </div>
        </div>
      )}

      {/* ----------------- DETAILS REPORT RESULTS PHASE ----------------- */}
      {testPhase === "results" && (
        <div className="flex-1 bg-slate-50 flex flex-col overflow-y-auto">
          {/* Results Navigation Bar */}
          <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <ChevronLeft className="w-5 h-5 font-bold" />
              </button>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight">Results & Analytics</h1>
            </div>

            <button
              onClick={() => {
                setResultsTab("analysis");
                setAnalysisFilter("all");
                setSelectedAnalysisIdx(0);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Solution Analysis
            </button>
          </header>

          {/* Results sub-tab list */}
          <nav className="bg-white border-b border-slate-150 flex items-center justify-center gap-1 overflow-x-auto px-4">
            <button
              onClick={() => setResultsTab("overview")}
              className={`py-3.5 px-6 font-extrabold text-xs tracking-wide uppercase border-b-2 font-mono transition ${
                resultsTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => {
                setResultsTab("analysis");
                setAnalysisFilter("all");
                setSelectedAnalysisIdx(0);
              }}
              className={`py-3.5 px-6 font-extrabold text-xs tracking-wide uppercase border-b-2 font-mono transition ${
                resultsTab === "analysis"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              All Solutions ({totalQuestionsCount})
            </button>
          </nav>

          {/* Content Pane */}
          <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col gap-6">
            
            {resultsTab === "overview" && (
              <>
                {/* Visual score banner */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
                  <h3 className="font-extrabold text-[#1e293b] text-base mb-4 tracking-tight border-b border-slate-100 pb-2">
                    Question Stats
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* Left stats parameters */}
                    <div className="md:col-span-6 flex flex-col gap-3 font-bold text-xs text-slate-600">
                      
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                            <Award className="w-4 h-4 fill-white" />
                          </span>
                          <span>Your Score:</span>
                        </div>
                        <span className="font-extrabold text-sm sm:text-base text-slate-800 font-mono">
                          {finalScore.toFixed(2)} / {maxPossibleMarks.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 border border-slate-203 rounded-2xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">
                            <Users className="w-4 h-4" />
                          </span>
                          <span>Rank:</span>
                        </div>
                        <span className="font-extrabold text-sm sm:text-base text-slate-800 font-mono">
                          {finalRank} / 1850
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 border border-slate-203 rounded-2xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                            <Percent className="w-4 h-4 text-white" />
                          </span>
                          <span>Percentile:</span>
                        </div>
                        <span className="font-extrabold text-sm sm:text-base text-slate-800 font-mono">
                          {finalPercentile}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 border border-slate-203 rounded-2xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-black">✓</span>
                          <span>Correct:</span>
                        </div>
                        <span className="font-extrabold text-sm sm:text-base text-green-600 font-mono">{correctCount}</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 border border-slate-203 rounded-2xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black">✗</span>
                          <span>Incorrect:</span>
                        </div>
                        <span className="font-extrabold text-sm sm:text-base text-red-500 font-mono">{incorrectCount}</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 border border-slate-203 rounded-2xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-slate-400 text-white flex items-center justify-center text-xs">-</span>
                          <span>Unattempted:</span>
                        </div>
                        <span className="font-extrabold text-sm sm:text-base text-slate-500 font-mono">{unattemptedCalculated}</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 border border-slate-203 rounded-2xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs">
                            <TrendingUp className="w-4 h-4" />
                          </span>
                          <span>Accuracy:</span>
                        </div>
                        <span className="font-extrabold text-sm sm:text-base text-cyan-600 font-mono">{finalAccuracy}%</span>
                      </div>

                    </div>

                    {/* Right column: matching columns bar chart */}
                    <div className="md:col-span-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-5 min-h-[220px]">
                      <div className="flex items-end justify-center gap-8 h-40 w-full px-4 mb-4">
                        
                        {/* Correct Bar */}
                        <div className="flex flex-col items-center flex-1 max-w-[50px] h-full justify-end">
                          <span className="text-xs font-black text-green-600 font-mono mb-1">{correctCount}</span>
                          <div
                            className="bg-green-500 w-full rounded-t-xl hover:opacity-80 transition-all shadow-sm"
                            style={{ height: `${Math.max(12, (correctCount / totalQuestionsCount) * 100)}%` }}
                          />
                          <span className="text-[10px] font-extrabold text-slate-500 tracking-tight font-mono uppercase mt-2">Correct</span>
                        </div>

                        {/* Incorrect Bar */}
                        <div className="flex flex-col items-center flex-1 max-w-[50px] h-full justify-end">
                          <span className="text-xs font-black text-red-500 font-mono mb-1">{incorrectCount}</span>
                          <div
                            className="bg-red-500 w-full rounded-t-xl hover:opacity-80 transition-all shadow-sm"
                            style={{ height: `${Math.max(12, (incorrectCount / totalQuestionsCount) * 100)}%` }}
                          />
                          <span className="text-[10px] font-extrabold text-slate-500 tracking-tight font-mono uppercase mt-2">Incorrect</span>
                        </div>

                        {/* Unattempted Bar */}
                        <div className="flex flex-col items-center flex-1 max-w-[50px] h-full justify-end">
                          <span className="text-xs font-black text-slate-400 font-mono mb-1">{unattemptedCalculated}</span>
                          <div
                            className="bg-slate-400 w-full rounded-t-xl hover:opacity-80 transition-all shadow-sm"
                            style={{ height: `${Math.max(12, (unattemptedCalculated / totalQuestionsCount) * 100)}%` }}
                          />
                          <span className="text-[10px] font-extrabold text-slate-500 tracking-tight font-mono uppercase mt-2">Unanswered</span>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

                {/* Sectional Summary Table */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden">
                  <h3 className="font-extrabold text-[#1e293b] text-base mb-4 tracking-tight border-b border-slate-100 pb-2">
                    Sectional Summary
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                          <th className="py-3 px-4">Section Name</th>
                          <th className="py-3 px-4 text-center">Score</th>
                          <th className="py-3 px-4 text-center">Attempted</th>
                          <th className="py-3 px-4 text-center">Correct</th>
                          <th className="py-3 px-4 text-center">Incorrect</th>
                          <th className="py-3 px-4 text-center">Unattempted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr className="hover:bg-slate-50/40">
                          <td className="py-3.5 px-4 font-black text-slate-800">{sectionName}</td>
                          <td className="py-3.5 px-4 text-center font-mono font-black text-blue-600">{finalScore.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-center font-mono">{totalAttemptedForSummary}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-green-600">{correctCount}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-red-500">{incorrectCount}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400">{unattemptedCalculated}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Rank Predictor Slider */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
                  <h3 className="font-extrabold text-[#1e293b] text-base mb-2 tracking-tight">
                    Rank Predictor
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold leading-relaxed mb-4">
                    आपका अनुमानित रैंक अंक (Marks) के आधार पर यहाँ प्रदर्शित है।
                  </p>

                  <div className="py-6 px-4">
                    <div className="w-full bg-slate-150 h-3 rounded-full relative">
                      {/* Active level slider */}
                      <div
                        className="bg-blue-600 h-3 rounded-full absolute left-0 top-0 transition-all duration-300"
                        style={{ width: `${(finalScore / maxPossibleMarks) * 100}%` }}
                      />
                      {/* Thumbs slider button */}
                      <div
                        className="w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-md absolute -top-1.5 -translate-x-1/2 flex items-center justify-center transition-all duration-300"
                        style={{ left: `${(finalScore / maxPossibleMarks) * 100}%` }}
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-slate-400 font-black font-mono text-[9px] uppercase tracking-wider mt-2.5">
                      <span>0 marks</span>
                      <span className="text-blue-600">Your Score: {finalScore}</span>
                      <span>{maxPossibleMarks} marks</span>
                    </div>
                  </div>
                </div>

                {/* Compare with Topper Table */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden">
                  <h3 className="font-extrabold text-[#1e293b] text-base mb-4 tracking-tight border-b border-slate-100 pb-2">
                    Compare with Topper
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase font-mono tracking-wider">
                          <th className="py-3 px-4">Entity</th>
                          <th className="py-3 px-4 text-center">Score</th>
                          <th className="py-3 px-4 text-center">Accuracy</th>
                          <th className="py-3 px-4 text-center">Correct</th>
                          <th className="py-3 px-4 text-center">Wrong</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr className="hover:bg-slate-50/40 font-black">
                          <td className="py-3.5 px-4 text-slate-800">You</td>
                          <td className="py-3.5 px-4 text-center font-mono text-blue-600">{finalScore.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-cyan-600">{finalAccuracy}%</td>
                          <td className="py-3.5 px-4 text-center font-mono">{correctCount}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-red-500">{incorrectCount}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/40 text-slate-500 font-bold">
                          <td className="py-3.5 px-4 text-yellow-600 font-black">Topper</td>
                          <td className="py-3.5 px-4 text-center font-mono font-black text-slate-800">{maxPossibleMarks.toFixed(2)} / {maxPossibleMarks.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-center font-mono">100%</td>
                          <td className="py-3.5 px-4 text-center font-mono">{totalQuestionsCount}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400">0</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm py-4 rounded-xl transition shadow-sm text-center tracking-wider uppercase font-mono mt-2"
                >
                  Exit Result Sheet
                </button>
              </>
            )}

            {resultsTab === "analysis" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left Side: Question List selection filter */}
                <div className="md:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
                  
                  {/* Status Filters */}
                  <div className="flex flex-col gap-1.5 mb-4 border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-extrabold text-slate-400 font-mono uppercase tracking-wider mb-1">
                      Filter Answers
                    </span>
                    <select
                      value={analysisFilter}
                      onChange={(e) => {
                        setAnalysisFilter(e.target.value as any);
                        setSelectedAnalysisIdx(0);
                      }}
                      className="w-full bg-slate-50 border border-slate-220 rounded-xl px-3 py-2.5 font-bold text-xs text-slate-700 outline-none focus:border-blue-500"
                    >
                      <option value="all">All ({totalQuestionsCount})</option>
                      <option value="correct">Correct Answered ({correctCount})</option>
                      <option value="incorrect">Wrong Answered ({incorrectCount})</option>
                      <option value="unattempted">Unanswered ({unattemptedCalculated})</option>
                      <option value="marked">Starred / Review ({markedCount + attemptedAndMarkedCount})</option>
                    </select>
                  </div>

                  {/* Question Grid items */}
                  <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto pr-1">
                    {questions.map((q, idx) => {
                      const userAns = answers[idx];
                      const isCorrect = userAns === q.answer;
                      const stat = statuses[idx];

                      // apply filter checks
                      if (analysisFilter === "correct" && (!userAns || !isCorrect)) return null;
                      if (analysisFilter === "incorrect" && (!userAns || isCorrect)) return null;
                      if (analysisFilter === "unattempted" && userAns !== undefined) return null;
                      if (analysisFilter === "marked" && stat !== "marked" && stat !== "attempted_and_marked") return null;

                      const isSelected = idx === selectedAnalysisIdx;

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedAnalysisIdx(idx)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-left border transition active:scale-[0.98] ${
                            isSelected
                              ? "bg-blue-50/90 border-blue-400 text-blue-800 font-extrabold"
                              : "bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] font-mono ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-white text-slate-500 border border-slate-200"
                            }`}>
                              Q{idx + 1}
                            </span>
                            <span className="text-xs truncate max-w-[120px] font-bold">
                              Answer: Opt {q.answer}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 font-bold font-mono">
                            {userAns === undefined ? (
                              <span className="text-[9px] bg-slate-200 text-slate-600 py-0.5 px-1.5 rounded border border-slate-300">SKIP</span>
                            ) : isCorrect ? (
                              <span className="text-[9px] bg-green-150 text-green-700 py-0.5 px-1.5 rounded border border-green-300">OK</span>
                            ) : (
                              <span className="text-[9px] bg-red-150 text-red-700 py-0.5 px-1.5 rounded border border-red-300">WRONG</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                </div>

                {/* Right Side: Solved Question presentation with Explanations */}
                <div className="md:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
                  {questions[selectedAnalysisIdx] ? (
                    (() => {
                      const qObj = questions[selectedAnalysisIdx];
                      const userAns = answers[selectedAnalysisIdx];
                      
                      return (
                        <div className="flex flex-col gap-5">
                          
                          {/* Banner index */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-black text-blue-700 font-mono tracking-wider bg-blue-50 py-1.5 px-3 rounded-xl border border-blue-100">
                              Question No: {selectedAnalysisIdx + 1} of {totalQuestionsCount}
                            </span>
                            
                            <span className="text-xs font-bold text-slate-500">
                              {userAns === undefined ? (
                                <span className="text-slate-500 font-extrabold bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">Unattempted</span>
                              ) : userAns === qObj.answer ? (
                                <span className="text-green-600 bg-green-50 border border-green-250 px-3 py-1 rounded-xl font-black">Your answer is Correct</span>
                              ) : (
                                <span className="text-red-500 bg-red-50 border border-red-250 px-3 py-1 rounded-xl font-black">Your answer is Incorrect</span>
                              )}
                            </span>
                          </div>

                          {/* Question body */}
                          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                            <HtmlRenderer html={qObj.question} />
                          </div>

                          {/* Options display highlighting right and wrong answers */}
                          <div className="flex flex-col gap-3">
                            {[
                              { num: "1", text: qObj.option_1, label: "a." },
                              { num: "2", text: qObj.option_2, label: "b." },
                              { num: "3", text: qObj.option_3, label: "c." },
                              { num: "4", text: qObj.option_4, label: "d." }
                            ].map((opt) => {
                              const isCorrectOption = opt.num === qObj.answer;
                              const isSelectedByMe = userAns === opt.num;
                              
                              let bgBorderClass = "bg-slate-50 border-slate-200 text-slate-800";
                              let sideBadge = null;

                              if (isCorrectOption) {
                                // Correct option is highlighted green
                                bgBorderClass = "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm";
                                sideBadge = <span className="text-xs font-black text-emerald-600 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-lg ml-auto mr-1.5">CORRECT ANSWER</span>;
                              } else if (isSelectedByMe && !isCorrectOption) {
                                // Incorrect option selected by user is highlighted red
                                bgBorderClass = "bg-rose-50 border-rose-500 text-rose-900";
                                sideBadge = <span className="text-xs font-black text-rose-600 bg-rose-100 border border-rose-300 px-2 py-1 rounded-lg ml-auto mr-1.5">YOUR SELECTION</span>;
                              }

                              return (
                                <div
                                  key={opt.num}
                                  className={`w-full flex items-center text-left py-3.5 px-5 rounded-2xl border-2 group ${bgBorderClass}`}
                                >
                                  <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center font-bold text-xs sm:text-sm mr-3 ${
                                    isCorrectOption
                                      ? "bg-emerald-600 text-white border-emerald-600 font-black"
                                      : isSelectedByMe
                                      ? "bg-rose-500 text-white border-rose-500 font-black"
                                      : "bg-white text-slate-500 border-slate-200"
                                  }`}>
                                    {opt.label}
                                  </span>
                                  <div className="flex-1 font-bold text-xs sm:text-sm tracking-tight pt-0.5">
                                    <HtmlRenderer html={opt.text} />
                                  </div>
                                  {sideBadge}
                                </div>
                              );
                            })}
                          </div>

                          {/* Full Written Solution with english/hindi translation explanation */}
                          {qObj.solution_text && (
                            <div className="bg-blue-50/40 border border-blue-150 rounded-2xl p-4 sm:p-5 mt-3">
                              <h4 className="font-extrabold text-blue-800 text-sm mb-3 flex items-center gap-1 bg-white border border-blue-100 rounded-xl py-1.5 px-3 w-fit">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span>{qObj.solution_heading || "Full Solution / व्याख्या"}</span>
                              </h4>
                              <div className="bg-white border border-slate-105 rounded-xl p-3 shadow-inner">
                                <HtmlRenderer html={qObj.solution_text} />
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-20 text-slate-400 font-bold text-sm">
                      Select a question from filter to inspect the correct answer and explanatory solutions.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
