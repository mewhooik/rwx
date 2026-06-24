import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Heart,
  Phone,
  Share2,
  Calendar,
  Ticket,
  CheckCircle2,
  Home,
  CreditCard,
  Download,
  Clock,
  Sparkles,
  Filter,
  Tag,
  ChevronLeft,
  ArrowLeft,
  X,
  Plus,
  HelpCircle,
  FileCheck2,
  Users,
  Compass,
  ArrowRight,
  BookMarked,
  Check,
  Play,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Lock
} from "lucide-react";
import { localBatches, Batch } from "./data/batches";
import TestPlayer from "./components/TestPlayer";
import { decryptResponse } from "./utils/crypto";

const RWA_LOGO = "https://nocache-appxdb-v2.classx.co.in/subject/2025-02-10-0.12268714003029602.jpeg";

export default function App() {
  // Batches state
  const [batches, setBatches] = useState<Batch[]>(localBatches);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState<"All" | "Free" | "Under1000" | "Premium">("All");

  // Favorites (localStorage backed)
  const [savedFavorites, setSavedFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("nt_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Enrolled courses (localStorage backed)
  const [enrolledBatches, setEnrolledBatches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("nt_enrolled");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Active student stats/info (localStorage backed)
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem("nt_student_name") || "Student Guest";
  });
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempStudentName, setTempStudentName] = useState(studentName);

  // Selected batch for detail modal view
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchSubjects, setBatchSubjects] = useState<any[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedBatchTab, setSelectedBatchTab] = useState<"content" | "live" | "test">("content");
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [subjectTopics, setSubjectTopics] = useState<any[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);

  // Exam / Test Simulator States
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(0);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [notifiedBatches, setNotifiedBatches] = useState<string[]>([]);

  // Live & Upcoming States
  const [liveUpcomingData, setLiveUpcomingData] = useState<{upcoming: any[], live: any[]} | null>(null);
  const [liveUpcomingLoading, setLiveUpcomingLoading] = useState(false);
  const [liveUpcomingError, setLiveUpcomingError] = useState<string | null>(null);
  const [topicContents, setTopicContents] = useState<any[]>([]);
  const [contentsLoading, setContentsLoading] = useState(false);
  const mainScrollPosRef = useRef<number>(0);
  const [activeContentTab, setActiveContentTab] = useState<"video" | "pdf">("video");

  // Test Series States
  const [testSeriesList, setTestSeriesList] = useState<any[]>([]);
  const [testSeriesLoading, setTestSeriesLoading] = useState(false);
  const [testSeriesError, setTestSeriesError] = useState<string | null>(null);
  const [selectedTestSeries, setSelectedTestSeries] = useState<any | null>(null);
  const [testSubjectsList, setTestSubjectsList] = useState<any[]>([]);
  const [testSubjectsLoading, setTestSubjectsLoading] = useState(false);
  const [testSubjectsError, setTestSubjectsError] = useState<string | null>(null);
  const [selectedTestSubject, setSelectedTestSubject] = useState<any | null>(null);
  const [testTitlesList, setTestTitlesList] = useState<any[]>([]);
  const [testTitlesLoading, setTestTitlesLoading] = useState(false);
  const [testTitlesError, setTestTitlesError] = useState<string | null>(null);
  const [activeTestPlayer, setActiveTestPlayer] = useState<{
    id: string;
    title: string;
    time: number;
    questionsUrl?: string;
  } | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [playingVideoTitle, setPlayingVideoTitle] = useState<string | null>(null);
  const handlePlayVideo = async (item: any, cleanTitle: string, isFromLiveTab: boolean = false) => {
    const vid = item.id || item.Id || item.video_id;
    if (!vid) {
      const fallbackUrl = item.video_player_lower_url || item.video_player_url || "https://player.appx.co.in/";
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const bid = selectedBatch?.id || "";

    // Open blank tab immediately to satisfy pop-up blockers
    const newWindow = window.open("about:blank", "_blank");
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <title>${cleanTitle.replace(/"/g, '&quot;')} - Toppers Batch Hub</title>
          <style>
            html, body {
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              background: radial-gradient(circle at top, #f8fafc, #f1f5f9) !important;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
              touch-action: none;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes spin-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
          </style>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 480px; width: calc(100% - 32px); background: #ffffff; border-radius: 20px; padding: 32px 24px; box-sizing: border-box; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05); border: 1.5px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            
            <!-- Sleek Branded Header -->
            <div style="background: #eff6ff; color: #2563eb; font-weight: 800; font-size: 10px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; border: 1px solid #dbeafe; box-shadow: 0 1px 2px rgba(0,0,0,0.02)">
              ✨ PREMIUM BATCH PLAYBACK
            </div>
            
            <!-- Beautiful fluid premium preloader -->
            <div style="position: relative; width: 56px; height: 56px; margin-bottom: 20px;">
              <div style="position: absolute; border: 4px solid #eff6ff; border-top: 4px solid #2563eb; border-radius: 50%; width: 100%; height: 100%; box-sizing: border-box; animation: spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;"></div>
              <div style="position: absolute; top: 10px; left: 10px; border: 4px solid #eff6ff; border-bottom: 4px solid #3b82f6; border-radius: 50%; width: 36px; height: 36px; box-sizing: border-box; animation: spin-reverse 1.2s ease-in-out infinite;"></div>
            </div>

            <!-- Warm human-friendly greetings and information -->
            <h2 style="font-size: 18px; font-weight: 850; line-height: 1.3; color: #1e293b; margin: 0 0 10px 0; letter-spacing: -0.02em;">
              वीडियो शुरू किया जा रहा है...
            </h2>
            
            <p style="font-size: 13px; font-weight: 600; color: #475569; margin: 0 0 12px 0; line-height: 1.5; width: 100%; box-sizing: border-box; padding: 10px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word; text-align: center;">
              "${cleanTitle.replace(/"/g, '&quot;')}"
            </p>

            <span style="font-size: 11px; color: #64748b; font-weight: 550; max-width: 320px; line-height: 1.4; text-align: center;">
              आपका प्रीमियम वीडियो लिंक तैयार किया जा रहा है। कृपया कुछ सेकंड प्रतीक्षा करें...
            </span>
          </div>

          <p style="margin-top: 20px; font-size: 10px; font-weight: 600; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; text-align: center;">
            Toppers Batch Hub © 2026
          </p>
        </body>
        </html>
      `);
      newWindow.document.close();
    }

    triggerToast(`'${cleanTitle}' लोड हो रहा है...`);

    try {
      const urlParams = `vid=${encodeURIComponent(vid)}&bid=${encodeURIComponent(bid)}`;
        
      const res = await fetch(`/api/video?${urlParams}`);
      if (!res.ok) throw new Error("Status " + res.status);
      const rawJson = await res.json();
      const data = decryptResponse(rawJson);
      
      if (data && data.ok && data.url) {
        let cleanedUrl = data.url;
        if (typeof cleanedUrl === "string") {
          cleanedUrl = cleanedUrl.trim();
          
          // Safely strip non-printable Control/ASCII characters and escaped unicode representations
          cleanedUrl = cleanedUrl.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
          cleanedUrl = cleanedUrl.replace(/\\u[0-9a-fA-F]{4}/g, "");
          
          // Find the index of "http" to strip any leading garbage characters
          const httpIndex = cleanedUrl.indexOf("http");
          if (httpIndex !== -1) {
            cleanedUrl = cleanedUrl.substring(httpIndex);
          }
        }
        
        if (isFromLiveTab) {
          // Open main/original URL directly for live/upcoming broadcast without proxy player
          if (newWindow) {
            newWindow.location.href = cleanedUrl;
          } else {
            window.open(cleanedUrl, "_blank", "noopener,noreferrer");
          }
        } else {
          // For regular contents, use our proxy player wrapper
          const proxiedPlayerUrl = `https://rwaxplayerx.vercel.app/proxy?url=${cleanedUrl}`;
          if (newWindow) {
            newWindow.location.href = proxiedPlayerUrl;
          } else {
            window.open(proxiedPlayerUrl, "_blank", "noopener,noreferrer");
          }
        }
      } else {
        throw new Error("No URL in response");
      }
    } catch (err) {
      console.error("Error loading video proxy:", err);
      const fallbackUrl = item.video_player_lower_url || item.video_player_url || "https://player.appx.co.in/";
      if (newWindow) {
        newWindow.location.href = fallbackUrl;
      } else {
        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleViewPdf = async (item: any, cleanTitle: string) => {
    const pdfRef = item._pdf_ref;
    if (!pdfRef) {
      if (item.pdf_summary_link) {
        window.open(item.pdf_summary_link, "_blank", "noopener,noreferrer");
      } else {
        triggerToast("PDF link not available");
      }
      return;
    }

    // Open blank tab immediately to satisfy pop-up blockers
    const newWindow = window.open("about:blank", "_blank");
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <title>Loading PDF... - Toppers Batch Hub</title>
          <style>
            html, body {
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              background: radial-gradient(circle at top, #f8fafc, #f1f5f9) !important;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
              touch-action: none;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes spin-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
          </style>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 480px; width: calc(100% - 32px); background: #ffffff; border-radius: 20px; padding: 32px 24px; box-sizing: border-box; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05); border: 1.5px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
            
            <!-- Sleek Branded Header -->
            <div style="background: #eff6ff; color: #2563eb; font-weight: 800; font-size: 10px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; border: 1px solid #dbeafe; box-shadow: 0 1px 2px rgba(0,0,0,0.02)">
              📚 PREMIUM NOTES LOADER
            </div>
            
            <div style="position: relative; width: 56px; height: 56px; margin-bottom: 20px;">
              <div style="position: absolute; border: 4px solid #eff6ff; border-top: 4px solid #2563eb; border-radius: 50%; width: 100%; height: 100%; box-sizing: border-box; animation: spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;"></div>
              <div style="position: absolute; top: 10px; left: 10px; border: 4px solid #eff6ff; border-bottom: 4px solid #3b82f6; border-radius: 50%; width: 36px; height: 36px; box-sizing: border-box; animation: spin-reverse 1.2s ease-in-out infinite;"></div>
            </div>

            <h2 style="font-size: 18px; font-weight: 850; line-height: 1.3; color: #1e293b; margin: 0 0 10px 0; letter-spacing: -0.02em;">
              पीडीएफ लोड हो रहा है...
            </h2>
            
            <p style="font-size: 13px; font-weight: 600; color: #475569; margin: 0 0 12px 0; line-height: 1.5; width: 100%; box-sizing: border-box; padding: 10px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; word-break: break-word; overflow-wrap: break-word;">
              "${cleanTitle}"
            </p>

            <span style="font-size: 11px; color: #64748b; font-weight: 550; max-width: 320px; line-height: 1.4;">
              दस्तावेज़ कनेक्शन सुरक्षित किया जा रहा है। कृपया प्रतीक्षा करें...
            </span>
          </div>

          <p style="margin-top: 20px; font-size: 10px; font-weight: 600; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase;">
            Toppers Batch Hub © 2026
          </p>
        </body>
        </html>
      `);
      newWindow.document.close();
    }

    try {
      triggerToast(`Loading secure PDF: '${cleanTitle}'...`);
      const res = await fetch(`/api/pdf?l=${encodeURIComponent(pdfRef)}`);
      
      if (!res.ok) {
        throw new Error("Proxy error status " + res.status);
      }
      
      const rawJson = await res.json();
      const data = decryptResponse(rawJson);
      if (data && data.ok && data.url) {
        if (newWindow) {
          newWindow.document.open();
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="referrer" content="no-referrer">
              <title>${cleanTitle.replace(/"/g, '&quot;')} - PDF Link</title>
              <script>
                window.location.replace("${data.url.replace(/"/g, '\\"')}");
              </script>
            </head>
            <body></body>
            </html>
          `);
          newWindow.document.close();
        } else {
          // Fallback if pop-up was blocked or not kept
          const fallbackWindow = window.open("", "_blank");
          if (fallbackWindow) {
            fallbackWindow.document.open();
            fallbackWindow.document.write(`
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="referrer" content="no-referrer">
                <title>${cleanTitle.replace(/"/g, '&quot;')} - PDF Link</title>
                <script>
                  window.location.replace("${data.url.replace(/"/g, '\\"')}");
                </script>
              </head>
              <body></body>
              </html>
            `);
            fallbackWindow.document.close();
          } else {
            window.open(data.url, "_blank", "noopener,noreferrer");
          }
        }
      } else {
        throw new Error("Unexpected response from server API");
      }
    } catch (err) {
      console.error("Error loading PDF:", err);
      triggerToast("PDF खोलने में समस्या आई! कृपया पुनः प्रयास करें।");
      if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <title>Failed to Load PDF</title>
            <style>
              html, body {
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                background-color: #f8fafc !important;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
              }
            </style>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 480px; width: calc(100% - 32px); background: #ffffff; border-radius: 20px; padding: 32px 24px; box-sizing: border-box; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05),  0 4px 6px -4px rgba(0, 0, 0, 0.05); border: 1.5px solid #ef4444; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
              <svg style="width: 56px; height: 56px; color: #ef4444; margin-bottom: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <h2 style="font-size: 18px; font-weight: 850; line-height: 1.3; color: #1e293b; margin: 0 0 10px 0;">Failed to Load PDF</h2>
              <p style="font-size: 13px; color: #475569; margin: 0 0 20px 0; line-height: 1.5;">Could not fetch secure PDF link from server. Please try again or open this app directly in a full browser tab.</p>
              <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 10px 20px; font-weight: 800; font-size: 12px; border-radius: 9999px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: opacity 0.2s;">Close Window</button>
            </div>
          </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  // Lock document scrolling on active batch content overlay or home screen popup to prevent background scrolling/peeking
  useEffect(() => {
    if (selectedBatch || (showWhatsAppPopup && !selectedBatch)) {
      if (selectedBatch) {
        mainScrollPosRef.current = window.scrollY;
      }
      document.body.style.overflow = "hidden";
      document.body.style.height = "100%";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.height = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
      
      const savedPos = mainScrollPosRef.current;
      if (savedPos > 0) {
        setTimeout(() => {
          window.scrollTo(0, savedPos);
        }, 30);
      }
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
    };
  }, [selectedBatch, showWhatsAppPopup]);

  const fetchLiveUpcoming = async (batchId: string) => {
    if (!batchId) return;
    setLiveUpcomingLoading(true);
    setLiveUpcomingError(null);
    try {
      const res = await fetch(`/api/liveupcoming?bid=${encodeURIComponent(batchId)}`);
      if (!res.ok) throw new Error("लाइव जानकारी लोड करने में समस्या हुई। (Unable to fetch live lectures)");
      const rawJson = await res.json();
      const json = decryptResponse(rawJson);
      if (json && json.ok && json.data) {
        setLiveUpcomingData(json.data);
      } else {
        setLiveUpcomingData({ upcoming: [], live: [] });
      }
    } catch (err: any) {
      console.error("Error fetching liveupcoming:", err);
      setLiveUpcomingError(err.message || "त्रुटि उत्पन्न हुई (An error occurred)");
    } finally {
      setLiveUpcomingLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatch && selectedBatchTab === "live") {
      fetchLiveUpcoming(selectedBatch.id || selectedBatch.Id);
    }
  }, [selectedBatch, selectedBatchTab]);

  const fetchTestSeries = async (batchId: string) => {
    if (!batchId) return;
    setTestSeriesLoading(true);
    setTestSeriesError(null);
    try {
      const res = await fetch(`/api/testseries?bid=${encodeURIComponent(batchId)}`);
      if (!res.ok) throw new Error("टेस्ट सीरीज लोड करने में असमर्थ। (Unable to fetch test series)");
      const rawJson = await res.json();
      const json = decryptResponse(rawJson);
      if (json && json.ok && Array.isArray(json.data)) {
        setTestSeriesList(json.data);
      } else if (json && json.data && Array.isArray(json.data)) {
        setTestSeriesList(json.data);
      } else {
        setTestSeriesList([]);
      }
    } catch (err: any) {
      console.error("Error fetching test series:", err);
      setTestSeriesError(err.message || "त्रुटि उत्पन्न हुई (An error occurred)");
    } finally {
      setTestSeriesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatch && selectedBatchTab === "test") {
      fetchTestSeries(selectedBatch.id || selectedBatch.Id);
    }
  }, [selectedBatch, selectedBatchTab]);

  const fetchTestSubjects = async (testSeriesId: string) => {
    if (!testSeriesId) return;
    setTestSubjectsLoading(true);
    setTestSubjectsError(null);
    try {
      const res = await fetch(`/api/testsubject?tsid=${encodeURIComponent(testSeriesId)}`);
      if (!res.ok) throw new Error("विषय लोड करने में असमर्थ। (Unable to fetch test subjects)");
      const rawJson = await res.json();
      const json = decryptResponse(rawJson);
      if (json && json.ok && Array.isArray(json.data)) {
        setTestSubjectsList(json.data);
      } else if (json && json.data && Array.isArray(json.data)) {
        setTestSubjectsList(json.data);
      } else {
        setTestSubjectsList([]);
      }
    } catch (err: any) {
      console.error("Error fetching test subjects:", err);
      setTestSubjectsError(err.message || "त्रुटि उत्पन्न हुई (An error occurred)");
    } finally {
      setTestSubjectsLoading(false);
    }
  };

  const fetchTestTitles = async (testSeriesId: string, subjectId: string) => {
    if (!testSeriesId || !subjectId) return;
    setTestTitlesLoading(true);
    setTestTitlesError(null);
    try {
      const res = await fetch(`/api/testtitles?tsid=${encodeURIComponent(testSeriesId)}&sid=${encodeURIComponent(subjectId)}`);
      if (!res.ok) throw new Error("टेस्ट सूची लोड करने में असमर्थ। (Unable to fetch tests)");
      const rawJson = await res.json();
      const json = decryptResponse(rawJson);
      if (json && json.ok && Array.isArray(json.test_titles)) {
        setTestTitlesList(json.test_titles);
      } else if (json && Array.isArray(json.test_titles)) {
        setTestTitlesList(json.test_titles);
      } else {
        setTestTitlesList([]);
      }
    } catch (err: any) {
      console.error("Error fetching test titles:", err);
      setTestTitlesError(err.message || "त्रुटि उत्पन्न हुई (An error occurred)");
    } finally {
      setTestTitlesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTestSeries) {
      fetchTestSubjects(selectedTestSeries.id || selectedTestSeries.Id);
    } else {
      setTestSubjectsList([]);
      setSelectedTestSubject(null);
    }
  }, [selectedTestSeries]);

  useEffect(() => {
    if (selectedTestSeries && selectedTestSubject) {
      fetchTestTitles(
        selectedTestSeries.id || selectedTestSeries.Id,
        selectedTestSubject.subjectid
      );
    } else {
      setTestTitlesList([]);
    }
  }, [selectedTestSeries, selectedTestSubject]);

  useEffect(() => {
    setSelectedTestSeries(null);
    setSelectedTestSubject(null);
  }, [selectedBatch, selectedBatchTab]);

  useEffect(() => {
    if (!selectedTopic || !selectedSubject || !selectedBatch) {
      setTopicContents([]);
      return;
    }

    const fetchContents = async () => {
      try {
        setContentsLoading(true);
        const res = await fetch(`/api/content?bid=${selectedBatch.id}&sid=${selectedSubject.subjectid}&tid=${selectedTopic.topicid}`);
        if (!res.ok) throw new Error("Status code " + res.status);
        const rawJson = await res.json();
        const result = decryptResponse(rawJson);
        if (result && result.data && Array.isArray(result.data)) {
          setTopicContents(result.data);
          
          // Auto preset tab selection
          const hasVideos = result.data.some((item: any) => item.material_type === "VIDEO");
          if (hasVideos) {
            setActiveContentTab("video");
          } else {
            setActiveContentTab("pdf");
          }
        } else {
          setTopicContents([]);
        }
      } catch (err) {
        console.error("Error fetching subject topic contents:", err);
        // High fidelity fallback when offline/CORS triggers
        const fallbackTitleBase = selectedTopic.topic_name.replace(/##|#|\.$/g, "").trim();
        setTopicContents([
          {
            id: "fallback_1",
            Title: `Class - 01 : ${fallbackTitleBase} (Introductory Session & Principles)`,
            material_type: "VIDEO",
            thumbnail: "https://appx-content-v2.classx.co.in/subject/2026-05-11-0_2587837016964035.jpg",
            video_player_lower_url: "https://player.appx.co.in/",
            duration: "2169",
            date_and_time: "12-05-2026 at 09:00 pm"
          },
          {
            id: "fallback_2",
            Title: `Class - 02 : ${fallbackTitleBase} (Concepts & Direct Formula Chart)`,
            material_type: "VIDEO",
            thumbnail: "https://appx-content-v2.classx.co.in/paid_course3/2026-05-10-0_32620004939313485.jpg",
            video_player_lower_url: "https://player.appx.co.in/",
            duration: "2333",
            date_and_time: "13-05-2026 at 09:00 pm"
          },
          {
            id: "fallback_pdf_1",
            Title: `Class Notes - ${fallbackTitleBase} (Handwritten Lesson PDF Blueprint)`,
            material_type: "PDF",
            thumbnail: "",
            pdf_summary_link: "https://player.appx.co.in/",
            date_and_time: "12-05-2026 at 09:12 pm"
          }
        ]);
        setActiveContentTab("video");
      } finally {
        setContentsLoading(false);
      }
    };

    fetchContents();
  }, [selectedTopic, selectedSubject, selectedBatch]);

  useEffect(() => {
    if (!selectedSubject || !selectedBatch) {
      setSubjectTopics([]);
      setSelectedTopic(null);
      return;
    }

    const fetchTopics = async () => {
      try {
        setTopicsLoading(true);
        const res = await fetch(`/api/topics?bid=${selectedBatch.id}&sid=${selectedSubject.subjectid}`);
        if (!res.ok) throw new Error("Status code " + res.status);
        const rawJson = await res.json();
        const result = decryptResponse(rawJson);
        if (result && result.data && Array.isArray(result.data)) {
          setSubjectTopics(result.data);
        } else {
          setSubjectTopics([]);
        }
      } catch (err) {
        console.error("Error fetching subject topics:", err);
        setSubjectTopics([]);
      } finally {
        setTopicsLoading(false);
      }
    };

    fetchTopics();
    setSelectedTopic(null);
  }, [selectedSubject, selectedBatch]);

  useEffect(() => {
    if (!selectedBatch) {
      setBatchSubjects([]);
      setSelectedSubject(null);
      return;
    }

    const fetchSubjects = async () => {
      try {
        setSubjectsLoading(true);
        const res = await fetch(`/api/subjects?bid=${selectedBatch.id}`);
        if (!res.ok) throw new Error("Status code " + res.status);
        const rawJson = await res.json();
        const result = decryptResponse(rawJson);
        if (result && result.data && Array.isArray(result.data)) {
          setBatchSubjects(result.data);
        } else {
          setBatchSubjects([]);
        }
      } catch (err) {
        console.error("Error fetching batch subjects:", err);
        setBatchSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
    setSelectedBatchTab("content");
  }, [selectedBatch]);

  // Prevent background body scroll when a batch detail page is open
  useEffect(() => {
    if (selectedBatch) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedBatch]);

  // Countdown Timer for active exam quiz
  useEffect(() => {
    let interval: any;
    if (activeQuiz && !isQuizSubmitted && quizTimeRemaining > 0) {
      interval = setInterval(() => {
        setQuizTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsQuizSubmitted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeQuiz, isQuizSubmitted, quizTimeRemaining]);
  
  // Checkout Modal State
  const [checkoutBatch, setCheckoutBatch] = useState<Batch | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in rupees
  const [couponMessage, setCouponMessage] = useState("");
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [isPurchaseSuccess, setIsPurchaseSuccess] = useState(false);
  const [generatedIdCard, setGeneratedIdCard] = useState<{
    id: string;
    student: string;
    course: string;
    roll: string;
    date: string;
  } | null>(null);

  // Tabs inside details modal: "About" | "Syllabus" | "FAQ"
  const [detailsTab, setDetailsTab] = useState<"about" | "syllabus" | "features">("about");

  // Show favorite tab only toggle
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Share system confirmation toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Contact simulated help ticket
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [queryName, setQueryName] = useState("");
  const [queryEmail, setQueryEmail] = useState("");
  const [queryText, setQueryText] = useState("");
  const [querySubmitted, setQuerySubmitted] = useState(false);

  // Load more pagination & scroll helper states
  const [visibleCount, setVisibleCount] = useState(21);
  const [showScrollSearch, setShowScrollSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset page limit when filters change
  useEffect(() => {
    setVisibleCount(21);
  }, [searchQuery, selectedCategory, priceFilter, showOnlyFavorites]);

  // Handle scroll detection for floating search button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 220) {
        setShowScrollSearch(true);
      } else {
        setShowScrollSearch(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToSearch = () => {
    const searchSection = document.getElementById("search-section");
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 450);
  };

  // Fetch API, falling back to rich localBatches structured perfectly
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/batches");
        if (!res.ok) throw new Error("API responded with code " + res.status);
        const rawJson = await res.json();
        const result = decryptResponse(rawJson);
        
        if (result && result.data && Array.isArray(result.data)) {
          // Format API response to confirm to standard Batch interface
          const formatted: Batch[] = result.data.map((item: any) => {
            // Determine a clean category name for filtering
            let category = "State Exams";
            const nameLower = (item.course_name || "").toLowerCase();
            const originalCat = (item.exam_category || "").trim();
            
            if (originalCat && originalCat !== "For All" && originalCat !== "All") {
              category = originalCat;
            } else if (nameLower.includes("ssc") || nameLower.includes("cgl") || nameLower.includes("cpo") || nameLower.includes("gd")) {
              category = "SSC Exams";
            } else if (nameLower.includes("navy") || nameLower.includes("airforce") || nameLower.includes("bsf") || nameLower.includes("nda") || nameLower.includes("army") || nameLower.includes("capf") || nameLower.includes("ssb") || nameLower.includes("crpf") || nameLower.includes("hcm") || nameLower.includes("cds")) {
              category = "Defense Exams";
            } else if (nameLower.includes("ctet") || nameLower.includes("uptet") || nameLower.includes("net") || nameLower.includes("teacher") || nameLower.includes("teaching")) {
              category = "Teaching Exams";
            } else if (nameLower.includes("nee") || nameLower.includes("jee") || nameLower.includes("medical") || nameLower.includes("gnm") || nameLower.includes("iit")) {
              category = "NEET & JEE";
            } else if (nameLower.includes("rajasthan") || nameLower.includes("rpsc")) {
              category = "Rajasthan Exams";
            } else if (nameLower.includes("bihar") || nameLower.includes("bpsc")) {
              category = "Bihar Exams";
            } else if (nameLower.includes("up") || nameLower.includes("upsssc") || nameLower.includes("allahabad")) {
              category = "UP State Exams";
            } else if (nameLower.includes("memory") || nameLower.includes("booster") || nameLower.includes("skill") || nameLower.includes("self")) {
              category = "Self Growth";
            }

            return {
              id: item.id || String(Math.random()),
              course_name: item.course_name || "Course Batch",
              course_slug: item.course_slug || "course-batch",
              course_description: item.course_description || "Detailed course information...",
              course_feature_1: item.course_feature_1 || "Exam Oriented Live Video Classes",
              course_feature_2: item.course_feature_2 || "Comprehensive PDFs and Structured Materials",
              course_feature_3: item.course_feature_3 || "Active Telegram Study & Support circles",
              course_feature_4: item.course_feature_4 || "Affordable course packages with validity",
              course_feature_5: item.course_feature_5 || "Mock test suites to measure score progress.",
              exam_name: item.exam_name || "All",
              exam_category: category,
              sub_exam_category: item.sub_exam_category || "All",
              course_thumbnail: item.course_thumbnail || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=80",
              price: item.price || "-1",
              price_kicker: item.price_kicker || "0.00",
              mrp: item.mrp || "0",
              crm_price: item.crm_price || "0",
              seats: item.seats || "0",
              video_count: item.video_count || "0",
              pdf_count: item.pdf_count || "0",
              test_count: item.test_count || "0",
              start_date: item.start_date || "2026-06-15",
              end_date: item.end_date || "2025-06-01",
              validity: item.validity || "12",
              validity_type: item.validity_type || "MONTHS",
              likes_count: item.likes_count || "150",
              is_paid: item.is_paid || "1",
              expiryDate: item.expiryDate || "2027-06-21"
            };
          });
          
          if (formatted.length > 0) {
            setBatches(formatted);
          }
        }
      } catch (err) {
        console.warn("Direct API fetch failed (usually CORS block). Using structured high-fidelity preloaded dataset fallback.", err);
        setApiError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatches();
  }, []);

  // Show simulated toast messages
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Toggle favorite
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (savedFavorites.includes(id)) {
      updated = savedFavorites.filter((favId) => favId !== id);
    } else {
      updated = [...savedFavorites, id];
    }
    setSavedFavorites(updated);
    localStorage.setItem("nt_favorites", JSON.stringify(updated));
  };

  // Get categories from both local & fetched batches
  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    batches.forEach((b) => {
      if (b.exam_category) list.add(b.exam_category);
    });
    return ["All", ...Array.from(list)];
  }, [batches]);

  // Handle student name change
  const handleSaveName = () => {
    setIsEditingName(false);
    const trimmed = tempStudentName.trim() || "Student Guest";
    setStudentName(trimmed);
    localStorage.setItem("nt_student_name", trimmed);
    triggerToast(`प्रोफ़ाइल नाम बदला गया: ${trimmed}`);
  };

  // Safe pricing resolver
  const computePrices = (b: Batch) => {
    const priceNum = parseFloat(b.price);
    const isFree = b.price === "0" || b.price === "-1";
    let displayPrice = "";
    let originalPrice = "";
    let discountStr = "";

    if (isFree) {
      // Parse description fallback
      if (b.course_description.includes("₹499")) {
        displayPrice = "₹499";
        originalPrice = "₹999";
        discountStr = "50% OFF";
      } else if (b.course_description.includes("₹599")) {
        displayPrice = "₹599";
        originalPrice = "₹1199";
        discountStr = "50% OFF";
      } else if (b.course_description.includes("₹699")) {
        displayPrice = "₹699";
        originalPrice = "₹1499";
        discountStr = "53% OFF";
      } else {
        displayPrice = "₹499";
        originalPrice = "₹799";
        discountStr = "37% OFF";
      }
    } else {
      displayPrice = `₹${b.price}`;
      // Calculate a beautiful original price for mockup fidelity
      const basePrice = Math.floor(priceNum * 1.5);
      originalPrice = `₹${basePrice}`;
      discountStr = `${Math.floor(((basePrice - priceNum) / basePrice) * 100)}% OFF`;
    }

    return { displayPrice, originalPrice, discountStr };
  };

  // Apply Coupon calculation during purchase flow
  const handleApplyCoupon = (batch: Batch) => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === "VAYU20" && batch.course_name.toLowerCase().includes("airforce")) {
      const discount = Math.floor(parseFloat(batch.price === "-1" ? "699" : batch.price) * 0.2);
      setAppliedDiscount(discount);
      setCouponMessage("कूपन 'VAYU20' लागू किया गया! 20% की अतिरिक्त छूट! 🎉");
      triggerToast("कूपन सफल: 20% छूट");
    } else if (code === "AGNI20" && batch.course_name.toLowerCase().includes("bsf")) {
      const discount = Math.floor(parseFloat(batch.price === "-1" ? "699" : batch.price) * 0.2);
      setAppliedDiscount(discount);
      setCouponMessage("कूपन 'AGNI20' लागू किया गया! 20% की अतिरिक्त छूट! 🎉");
      triggerToast("कूपन सफल: 20% छूट");
    } else if (code === "UPSSSC20" && batch.course_name.toLowerCase().includes("accountant")) {
      const discount = Math.floor(parseFloat(batch.price === "-1" ? "625" : batch.price) * 0.2);
      setAppliedDiscount(discount);
      setCouponMessage("कूपन 'UPSSSC20' लागू किया गया! 20% की अतिरिक्त छूट! 🎉");
      triggerToast("कूपन सफल: 20% छूट");
    } else if (code === "TOPPERS10") {
      const discount = Math.floor(parseFloat(batch.price === "-1" ? "999" : batch.price) * 0.1);
      setAppliedDiscount(discount);
      setCouponMessage("कूपन 'TOPPERS10' लागू किया गया! 10% की अतिरिक्त छूट! 🎉");
      triggerToast("कूपन सफल: 10% छूट");
    } else {
      setAppliedDiscount(0);
      setCouponMessage("अमान्य कूपन कोड या यह कोड इस बैच के लिए लागू नहीं है।");
    }
  };

  const handlePurchaseSubmit = (e: React.FormEvent, batch: Batch) => {
    e.preventDefault();
    if (!checkoutName.trim() || !checkoutPhone.trim()) {
      alert("कृपया अपना नाम और मोबाइल नंबर दर्ज करें।");
      return;
    }

    const updated = [...enrolledBatches, batch.id];
    setEnrolledBatches(updated);
    localStorage.setItem("nt_enrolled", JSON.stringify(updated));

    // Generate cute student ID card
    const randomRoll = "NT" + Math.floor(100000 + Math.random() * 900000);
    const today = new Date().toLocaleDateString("hi-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    setGeneratedIdCard({
      id: batch.id,
      student: checkoutName.trim(),
      course: batch.course_name,
      roll: randomRoll,
      date: today,
    });

    setIsPurchaseSuccess(true);
    triggerToast("बैच सफलतापूर्वक ख़रीदा गया! पढ़ाई शुरू करें। 🎓");
  };

  const closeCheckoutFlow = () => {
    setCheckoutBatch(null);
    setCouponCode("");
    setAppliedDiscount(0);
    setCouponMessage("");
    setIsPurchaseSuccess(false);
    setCheckoutName("");
    setCheckoutPhone("");
    setGeneratedIdCard(null);
  };

  // Submit help ticket
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryName.trim() || !queryText.trim()) return;
    setQuerySubmitted(true);
    setTimeout(() => {
      setShowSupportModal(false);
      setQuerySubmitted(false);
      setQueryName("");
      setQueryEmail("");
      setQueryText("");
      triggerToast("हमारी सहायता टीम 9818489147 आपसे शीघ्र ही संपर्क करेगी! 📞");
    }, 3000);
  };

  // Simulated share with copy link fallback
  const handleShareCourse = (b: Batch, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/batch/${b.course_slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      triggerToast("कोर्स लिंक क्लिपबोर्ड पर कॉपी किया गया! 🔗");
    } else {
      triggerToast("साझा करें: " + b.course_name);
    }
  };

  // Filter batches list
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        b.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.exam_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.course_description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || b.exam_category === selectedCategory;

      const priceNum = parseFloat(b.price);
      let matchesPrice = true;
      if (priceFilter === "Free") {
        matchesPrice = b.price === "0" || b.price === "-1";
      } else if (priceFilter === "Under1000") {
        matchesPrice = priceNum <= 1000 && b.price !== "-1" && b.price !== "0";
      } else if (priceFilter === "Premium") {
        matchesPrice = priceNum > 1000;
      }

      const matchesFavorites = !showOnlyFavorites || savedFavorites.includes(b.id);

      return matchesSearch && matchesCategory && matchesPrice && matchesFavorites;
    });
  }, [batches, searchQuery, selectedCategory, priceFilter, showOnlyFavorites, savedFavorites]);

  if (activeTestPlayer) {
    return (
      <TestPlayer
        testId={activeTestPlayer.id}
        testTitle={activeTestPlayer.title}
        testTimeMinutes={activeTestPlayer.time || 20}
        questionsUrl={activeTestPlayer.questionsUrl}
        onClose={() => setActiveTestPlayer(null)}
        triggerToast={triggerToast}
      />
    );
  }

  return (
    <div id="app-root" className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-800 font-sans selection:bg-slate-200 antialiased flex flex-col pb-8">

      {/* Main Clean Header */}
      <header id="app-header" className={`${selectedBatch ? "hidden" : "block"} bg-neutral-950/75 border-b border-white/10 fixed top-0 left-0 right-0 z-40 shadow-md backdrop-blur-lg`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo Branding - RWA Logo */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img 
              src="https://nocache-appxdb-v2.classx.co.in/subject/2025-02-10-0.12268714003029602.jpeg" 
              alt="RWA Logo"
              referrerPolicy="no-referrer"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border border-neutral-800 shadow-sm shrink-0"
            />
            <span className="text-sm sm:text-base font-black tracking-wider text-white uppercase shrink-0">
              RWA x PAIN
            </span>
          </div>

          {/* Favorites Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="fav-toggle-btn"
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex items-center gap-1.5 border rounded-xl px-3.5 py-1.5 text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all duration-150 active:scale-95 hover:scale-[1.02] shadow-sm cursor-pointer ${
                showOnlyFavorites
                  ? "bg-red-500 border-transparent text-white"
                  : "bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? "fill-current text-white animate-pulse" : "text-red-500 fill-current"}`} />
              <span>Fav ({savedFavorites.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className={`${selectedBatch ? "hidden" : "flex"} flex-1 max-w-7xl w-full mx-auto pt-20 p-3 sm:pt-24 sm:p-5 flex-col gap-5 sm:gap-6`}>
        
        {/* Simple & Responsive Search Bar Container */}
        <section id="search-section" className="w-full">
          <div className="relative bg-white border border-slate-200 rounded-2xl p-2 flex items-center shadow-sm focus-within:border-slate-300 focus-within:shadow-md transition-all duration-350">
            <div className="flex-1 relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="तैयारी के लिए अपना पसंदीदा सरकारी बैच खोजें... (जैसे: RO/ARO, Airforce, BSF, CTET)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-10 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-250 focus:bg-white transition-all duration-250"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 hover:bg-slate-200 rounded-full absolute right-3 text-slate-400 hover:text-slate-700 transition active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Categories Carousel with Pill Tabs */}
        <section id="categories-tabs" className="flex flex-col gap-2">
          {selectedCategory !== "All" && (
            <div className="flex items-center justify-end">
              <button
                onClick={() => setSelectedCategory("All")}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1 active:scale-95 transition"
              >
                रीसेट करें <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 scroll-smooth">
            {categoriesList.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider duration-150 active:scale-95 transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                    isActive
                      ? "bg-slate-900 border-transparent text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:text-black hover:border-slate-350"
                  }`}
                >
                  {cat === "All" ? "सभी बैचेस" : cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin"></div>
            <p className="text-sm font-bold text-slate-550">तैयारी के सारे बैच लोड हो रहे हैं, कृपया प्रतीक्षा करें...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          /* Empty Search results state */
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-slate-100/50 rounded-full blur-xl"></div>
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-850">कोई संबंधित बैच नहीं मिला</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              आपके द्वारा सर्च किए गए '{searchQuery}' या चुने गए फिल्टर के अनुसार कोई बैच वर्तमान में उपलब्ध नहीं है। कृपया कोई अन्य शब्द सर्च करें।
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setPriceFilter("All");
                setShowOnlyFavorites(false);
              }}
              className="mt-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl px-5 py-3 text-xs font-black tracking-wider uppercase transition-all duration-150 active:scale-90 cursor-pointer shadow-sm"
            >
              सभी फिल्टर रीसेट करें
            </button>
          </div>
        ) : (
          /* High-Fidelity Course Cards Grid with Premium Glowing States */
          <div id="batches-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.slice(0, visibleCount).map((batch) => {
              const { displayPrice, originalPrice, discountStr } = computePrices(batch);
              const isEnrolled = enrolledBatches.includes(batch.id);

              return (
                <div
                  key={batch.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-slate-350 hover:shadow-md transition-all duration-300 flex flex-col group transform hover:-translate-y-1 cursor-default active:scale-[0.985]"
                >
                  {/* Thumbnail / Header Area */}
                  <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                    {batch.course_thumbnail ? (
                      <img
                        src={batch.course_thumbnail || RWA_LOGO}
                        alt={batch.course_name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        onError={(e) => {
                          // Fallback placeholder image
                          (e.target as HTMLImageElement).src = RWA_LOGO;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-150 flex items-center justify-center text-slate-400">
                        No Thumbnail
                      </div>
                    )}

                    <div className="absolute top-3 right-3 z-10">
                      <button
                        onClick={(e) => toggleFavorite(batch.id, e)}
                        className={`p-2.5 rounded-xl shadow-md border bg-white/95 transition-all duration-150 active:scale-75 cursor-pointer ${
                          savedFavorites.includes(batch.id)
                            ? "border-rose-100 text-red-500"
                            : "text-slate-400 border-slate-200 hover:text-red-500 hover:bg-white"
                        }`}
                        title="पसंदीदा सूची में जोड़ें"
                      >
                        <Heart className={`w-3.5 h-3.5 ${savedFavorites.includes(batch.id) ? "fill-current text-red-500 animate-pulse" : "text-slate-400"}`} />
                      </button>
                    </div>

                    {/* Price Tag Floating Overlay */}
                    <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-white font-extrabold text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-md flex items-center gap-1.5 z-10">
                      <Tag className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 tracking-wide">{displayPrice}</span>
                      <span className="text-slate-400 line-through text-[10px] font-normal">{originalPrice}</span>
                    </div>
                  </div>

                  {/* Body Content Area */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      {/* Exam Categories Category badge */}
                      <span className="text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-100 rounded px-2 py-0.5 w-fit uppercase tracking-wider">
                        {batch.exam_category}
                      </span>

                      {/* Course Title */}
                      <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-black transition-colors duration-200">
                        {batch.course_name}
                      </h3>
                    </div>

                    {/* Footer Interactive Actions */}
                    <div className="border-t border-slate-100 pt-3 mt-auto">
                      <button
                        onClick={() => {
                          setSelectedBatch(batch);
                          setDetailsTab("about");
                        }}
                        className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Explore Batch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && filteredBatches.length > visibleCount && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setVisibleCount((prev) => prev + 21)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-md transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-transparent hover:border-slate-700"
            >
              <span>और बैच देखें (Load More)</span>
              <ArrowRight className="w-4 h-4 rotate-90" />
            </button>
          </div>
        )}



      </main>

      {/* Global simulated Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-black py-3.5 px-5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-850 animate-slide-up">
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
          <span className="tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* DETAILED COURSE FULLSCREEN CONTENT OVERLAY */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 bg-[#f8f9fa] overflow-y-auto flex flex-col animate-scale-up">
          
          {/* Header Bar */}
          <header className="bg-white border-b border-slate-200/85 px-4 sm:px-6 py-4 sticky top-0 z-50 shadow-sm flex items-center gap-3">
            <button
              onClick={() => {
                if (selectedTestSubject) {
                  setSelectedTestSubject(null);
                } else if (selectedTestSeries) {
                  setSelectedTestSeries(null);
                } else if (selectedTopic) {
                  setSelectedTopic(null);
                } else if (selectedSubject) {
                  setSelectedSubject(null);
                } else {
                  setSelectedBatch(null);
                  setSelectedSubject(null);
                }
              }}
              className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-black hover:border-slate-300 transition duration-150 shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <h2 className="font-extrabold text-[#0070f3] text-sm sm:text-base md:text-lg leading-tight flex-1">
              {selectedTestSubject
                ? selectedTestSubject.subject_name
                : selectedTestSeries
                  ? "Select Subject"
                  : selectedTopic 
                    ? selectedTopic.topic_name.replace(/##|#|\.$/g, "").trim()
                    : selectedSubject 
                      ? selectedSubject.subject_name 
                      : selectedBatch.course_name}
            </h2>
          </header>

          {/* Navigation Tabs Bar */}
          {!selectedSubject && !selectedTestSeries && !selectedTestSubject && (
            <div className="flex border-b border-slate-200 bg-white sticky top-[69px] z-40 px-4 sm:px-6 shadow-sm shrink-0">
              <button
                onClick={() => {
                  setSelectedBatchTab("content");
                  setSelectedSubject(null);
                }}
                className={`py-3.5 px-5 font-black text-xs sm:text-sm uppercase tracking-wider border-b-[3px] -mb-[1.5px] cursor-pointer transition-all ${
                  selectedBatchTab === "content"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Content
              </button>
              <button
                onClick={() => {
                  setSelectedBatchTab("live");
                  setSelectedSubject(null);
                }}
                className={`py-3.5 px-5 font-black text-xs sm:text-sm uppercase tracking-wider border-b-[3px] -mb-[1.5px] cursor-pointer transition-all ${
                  selectedBatchTab === "live"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Live & Upcoming
              </button>
              <button
                onClick={() => {
                  setSelectedBatchTab("test");
                  setSelectedSubject(null);
                }}
                className={`py-3.5 px-5 font-black text-xs sm:text-sm uppercase tracking-wider border-b-[3px] -mb-[1.5px] cursor-pointer transition-all ${
                  selectedBatchTab === "test"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                TEST
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto pb-12 bg-[#f8f9fa]">
            
            {/* 1. Content Tab active */}
            {selectedBatchTab === "content" && (
              <div>
                
                {/* 1a. If no subject is active: Show Subjects grid */}
                {!selectedSubject ? (
                  <div className="max-w-7xl mx-auto w-full p-4 sm:p-6">
                    {subjectsLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, idx) => (
                          <div key={idx} className="bg-[#f8f9fa] rounded-2xl border border-slate-200 p-5 flex flex-col items-center justify-center gap-3 animate-pulse">
                            <div className="w-20 h-20 rounded-full bg-slate-200"></div>
                            <div className="h-4 bg-slate-200 rounded w-24"></div>
                          </div>
                        ))}
                      </div>
                    ) : batchSubjects.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
                          <HelpCircle className="w-8 h-8" />
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-base">पाठ्यक्रम सामग्री अभी उपलब्ध नहीं है</h3>
                        <p className="text-slate-500 text-xs mt-1.5 font-bold">कृपया बाद में पुनः प्रयास करें। हमारे विशेषज्ञ शिक्षक जल्द ही नए व्याख्यान एवं विषय जोड़ेंगे।</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {batchSubjects.map((sub: any) => (
                          <div
                            key={sub.subjectid}
                            onClick={() => setSelectedSubject(sub)}
                            className="bg-white hover:bg-[#fafbfd] rounded-2xl border-2 border-slate-400 hover:border-blue-500 p-5 flex flex-col items-center justify-center gap-3 w-full cursor-pointer transition-all duration-205 group active:scale-95 shadow-md"
                          >
                            <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full border-[3px] border-[#0070f3] p-0.5 overflow-hidden flex items-center justify-center bg-white transition duration-200 group-hover:scale-105 shrink-0 shadow-sm">
                              <img
                                src={sub.subject_logo || RWA_LOGO}
                                alt={sub.subject_name}
                                className="w-full h-full object-cover rounded-full"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = RWA_LOGO;
                                }}
                              />
                            </div>
                            <span className="text-slate-800 text-xs sm:text-xs font-black text-center leading-tight line-clamp-2 mt-1 px-1">
                              {sub.subject_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-5 animate-fade-in">
                    
                    {/* If a topic is selected, render nested lecture lists. Else render chapter cards grid directly */}
                    {selectedTopic ? (
                      (() => {
                        const videosList = topicContents.filter((item: any) => {
                          return item.material_type?.toUpperCase() === "VIDEO" || item.video_player_lower_url;
                        });

                        const pdfList = topicContents.filter((item: any) => {
                          return item.material_type?.toUpperCase() === "PDF" || (item._pdf_ref && item._pdf_ref.trim() !== "");
                        });

                        const currentList = activeContentTab === "video" ? videosList : pdfList;

                        return (
                          <div className="flex flex-col gap-6 animate-fade-in">
                            
                            {/* Beautiful Thicker and Wider Content Tabs Switcher in English (Videos / PDF) */}
                            <div className="grid grid-cols-2 p-2 bg-slate-100 rounded-2xl w-full max-w-md border-2 border-slate-350 shadow-md">
                              <button
                                type="button"
                                onClick={() => setActiveContentTab("video")}
                                className={`py-4 px-6 rounded-xl text-center flex items-center justify-center gap-2 text-xs sm:text-sm font-black tracking-wide transition-all duration-150 cursor-pointer ${
                                  activeContentTab === "video"
                                    ? "bg-blue-600 text-white shadow-md transform scale-[1.01]"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                                }`}
                              >
                                <Play className="w-4 h-4 fill-current shrink-0" />
                                <span>VIDEOS ({videosList.length})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveContentTab("pdf")}
                                className={`py-4 px-6 rounded-xl text-center flex items-center justify-center gap-2 text-xs sm:text-sm font-black tracking-wide transition-all duration-150 cursor-pointer ${
                                  activeContentTab === "pdf"
                                    ? "bg-blue-600 text-white shadow-md transform scale-[1.01]"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                                }`}
                              >
                                <FileText className="w-4 h-4 shrink-0" />
                                <span>PDF ({pdfList.length})</span>
                              </button>
                            </div>

                            {/* Contents Grid/List */}
                            {contentsLoading ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(2)].map((_, idx) => (
                                  <div key={idx} className="bg-white border-2 border-slate-300 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
                                    <div className="w-full aspect-video bg-slate-200 rounded-lg"></div>
                                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                                    <div className="h-8 bg-slate-100 rounded w-full"></div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentList.map((item: any, itemIdx: number) => {
                                  const cleanTitle = item.Title.replace(/##|#|\.$/g, "").trim();
                                  return (
                                    <div
                                      key={item.id || itemIdx}
                                      className="bg-white hover:bg-[#fafbfd] border-2 border-slate-400 rounded-2xl p-4 flex flex-col gap-4 shadow-md transition hover:shadow-lg"
                                    >
                                      {/* Thumbnail rendering */}
                                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-350 shrink-0 group">
                                        <img
                                          src={item.thumbnail || "https://appx-content-v2.classx.co.in/subject/2026-05-11-0_2587837016964035.jpg"}
                                          alt={cleanTitle}
                                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                          referrerPolicy="no-referrer"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = RWA_LOGO;
                                          }}
                                        />
                                        {activeContentTab === "video" && item.duration && (
                                          <div className="absolute bottom-2 right-2 bg-black/75 px-2 py-0.5 rounded text-[10px] font-black text-white font-mono">
                                            {Math.floor(parseInt(item.duration) / 60) || "50"} min
                                          </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center">
                                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                                            {activeContentTab === "video" ? (
                                              <Play className="w-4 h-4 fill-current ml-0.5" />
                                            ) : (
                                              <FileText className="w-4 h-4 text-white" />
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Text Info */}
                                      <div className="flex flex-col gap-1.5 flex-1 justify-between">
                                        <div>
                                          <h5 className="text-slate-900 font-extrabold text-[12px] sm:text-xs md:text-sm leading-snug line-clamp-2">
                                            {cleanTitle}
                                          </h5>
                                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-black mt-1.5">
                                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                              {activeContentTab === "video" ? "VIDEO" : "PDF"}
                                            </span>
                                            {item.date_and_time && (
                                              <span>• 📆 {item.date_and_time}</span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Play / View action ONLY (Full Width, No DL button) */}
                                        <div className="mt-3">
                                          {activeContentTab === "video" ? (
                                            <button
                                              type="button"
                                              onClick={() => handlePlayVideo(item, cleanTitle)}
                                              className="w-full bg-blue-600 hover:bg-blue-750 text-white font-black text-sm tracking-widest py-3.5 sm:py-4 px-5 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase duration-150"
                                            >
                                              <Play className="w-4 h-4 fill-current shrink-0" />
                                              <span>PLAY</span>
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handleViewPdf(item, cleanTitle)}
                                              className="w-full bg-blue-600 hover:bg-blue-750 text-white font-black text-sm tracking-widest py-3.5 sm:py-4 px-5 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-center uppercase duration-150"
                                            >
                                              <FileText className="w-4 h-4 shrink-0" />
                                              <span>VIEW PDF</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {currentList.length === 0 && (
                                  <div className="col-span-1 md:col-span-2 bg-white border-2 border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                                      <HelpCircle className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-extrabold text-slate-850 text-sm">कोई सामग्री उपलब्ध नहीं है</h4>
                                    <p className="text-slate-550 text-xs mt-1 font-bold">इस श्रेणी के लिए सामग्री जल्द ही लाइव की जाएगी।</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      /* Display fetched Topics/Chapters grid directly under header */
                      <div className="flex flex-col gap-4 animate-fade-in">
                        {topicsLoading ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, idx) => (
                              <div key={idx} className="bg-white rounded-2xl border-2 border-slate-400 p-5 flex flex-col items-center justify-center gap-3 animate-pulse">
                                <div className="w-16 h-16 rounded-full bg-slate-200"></div>
                                <div className="h-4 bg-slate-200 rounded w-24"></div>
                              </div>
                            ))}
                          </div>
                        ) : subjectTopics.length === 0 ? (
                          <div className="bg-white border-2 border-slate-350 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-300">
                              <HelpCircle className="w-6 h-6" />
                            </div>
                            <h4 className="font-extrabold text-slate-800 text-sm">कोई अध्याय अभी नहीं मिला</h4>
                            <p className="text-slate-550 text-[11px] mt-1 font-bold">इस विषय के लिए अध्याय सामग्री शीघ्र ही लाइव होगी।</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {subjectTopics.map((topic: any) => (
                              <div
                                key={topic.topicid}
                                onClick={() => setSelectedTopic(topic)}
                                className="bg-white hover:bg-[#fafbfd] rounded-2xl border-2 border-slate-400 hover:border-blue-500 p-5 flex flex-col items-center justify-center gap-4 w-full cursor-pointer transition-all duration-205 group active:scale-95 shadow-md hover:shadow-lg"
                              >
                                {/* Circular topic logo */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-[#0070f3] p-0.5 overflow-hidden flex items-center justify-center bg-white transition duration-200 group-hover:scale-105 shrink-0 shadow-sm">
                                  <img
                                    src={topic.topic_logo || RWA_LOGO}
                                    alt={topic.topic_name}
                                    className="w-full h-full object-cover rounded-full"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = RWA_LOGO;
                                    }}
                                  />
                                </div>
                                <span className="text-slate-850 text-[11px] sm:text-xs font-black text-center leading-tight line-clamp-2 mt-1 px-1">
                                  {topic.topic_name.replace(/##|#|\.$/g, "").trim()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. Live & Upcoming Tab active */}
            {selectedBatchTab === "live" && (
              <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-8 animate-fade-in">
                
                {/* 1. Loading State */}
                {liveUpcomingLoading && (
                  <div className="flex flex-col gap-6 w-full py-8">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                      <span className="text-xs font-black text-slate-550 uppercase tracking-widest font-mono">लाइव व्याख्यान लोड किए जा रहे हैं...</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, idx) => (
                        <div key={idx} className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
                          <div className="aspect-[16/9] bg-slate-100 rounded-xl relative overflow-hidden">
                            <div className="absolute top-3 left-3 w-16 h-5 bg-slate-200 rounded-full"></div>
                          </div>
                          <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                          <div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
                          <div className="h-10 bg-slate-100 rounded-xl w-full mt-2"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Error State */}
                {!liveUpcomingLoading && liveUpcomingError && (
                  <div className="max-w-lg mx-auto bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-4 my-8">
                    <div className="w-12 h-12 rounded-full bg-rose-150 flex items-center justify-center text-rose-600 border border-rose-250 animate-pulse">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm md:text-base">लाइव व्याख्यान लोड करने में समस्या</h3>
                    <p className="text-slate-550 text-xs font-bold leading-relaxed">{liveUpcomingError}</p>
                    <button
                      onClick={() => fetchLiveUpcoming(selectedBatch.id || selectedBatch.Id || "")}
                      className="mt-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl px-5 py-3 transition active:scale-95 shadow-sm"
                    >
                      पुनः प्रयास करें (Retry)
                    </button>
                  </div>
                )}

                {/* 3. Loaded State */}
                {!liveUpcomingLoading && !liveUpcomingError && (() => {
                  const liveList = liveUpcomingData?.live || [];
                  const upcomingList = liveUpcomingData?.upcoming || [];
                  const isEnrolled = enrolledBatches.includes(selectedBatch.id || selectedBatch.Id || "");

                  if (liveList.length === 0 && upcomingList.length === 0) {
                    return (
                      <div className="max-w-md mx-auto w-full p-8 sm:p-16 flex flex-col items-center justify-center text-center my-8">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200 shadow-inner">
                          <Clock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-black text-slate-800 text-base">कोई लाइव या शेड्यूल क्लास नहीं है</h3>
                        <p className="text-slate-500 text-xs mt-2 font-bold leading-relaxed">इस समय इस बैच के लिए कोई भी आगामी या लाइव व्याख्यान उपलब्ध नहीं है। कृपया बाद में चेक करें।</p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-8 w-full text-left">
                      
                      {/* Active Live Broadcasts */}
                      {liveList.length > 0 && (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                            </span>
                            <h3 className="font-black text-[11px] sm:text-xs uppercase tracking-widest text-rose-605 font-mono">लाइव प्रसारण (Live Now)</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {liveList.map((item: any) => {
                              const isFree = item.free_flag === "1";
                              const canPlay = isEnrolled || isFree;
                              
                              return (
                                <div
                                  key={item.id}
                                  className="bg-white border-2 border-slate-400 hover:border-rose-450 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 flex flex-col group justify-between"
                                >
                                  {/* Thumbnail Area */}
                                  <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                                    <img
                                      src={item.thumbnail || RWA_LOGO}
                                      alt={item.Title}
                                      className="w-full h-full object-cover transition duration-305 group-hover:scale-102"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = RWA_LOGO;
                                      }}
                                      referrerPolicy="no-referrer"
                                    />
                                    {/* Badges Layer */}
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                      <span className="bg-rose-600 text-white font-extrabold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                        LIVE
                                      </span>
                                      {isFree && (
                                        <span className="bg-emerald-600 text-white font-extrabold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm">
                                          FREE
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Floating Indicator */}
                                    <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-[10px] font-bold text-white px-2 py-0.5 rounded-md">
                                      🔴 Live Feed
                                    </div>
                                  </div>

                                  {/* Content info */}
                                  <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-slate-50/50">
                                    <div className="flex flex-col gap-1.5">
                                      <h4 className="font-extrabold text-[#192131] text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                                        {item.Title}
                                      </h4>
                                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{item.date_and_time}</span>
                                      </div>
                                    </div>

                                    {/* Action button */}
                                    <button
                                      onClick={() => handlePlayVideo(item, item.Title, true)}
                                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
                                    >
                                      <Play className="w-4 h-4 fill-white" />
                                      <span>JOIN CLASS</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Scheduled Upcoming Lectures */}
                      {upcomingList.length > 0 && (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2">
                            <Clock className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                            <h3 className="font-black text-xs uppercase tracking-widest text-[#1e293b] font-mono">आगामी कक्षाएं (Scheduled Classes)</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingList.map((item: any) => {
                              const isFree = item.free_flag === "1";

                              return (
                                <div
                                  key={item.id}
                                  className="bg-white border-2 border-slate-350 hover:border-blue-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group justify-between"
                                >
                                  {/* Thumbnail Area */}
                                  <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                                    <img
                                      src={item.thumbnail || RWA_LOGO}
                                      alt={item.Title}
                                      className="w-full h-full object-cover transition duration-305 group-hover:scale-102"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = RWA_LOGO;
                                      }}
                                      referrerPolicy="no-referrer"
                                    />
                                    {/* Badges Layer */}
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                      <span className="bg-blue-600 text-white font-extrabold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                                        UPCOMING
                                      </span>
                                      {isFree && (
                                        <span className="bg-emerald-600 text-white font-extrabold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm">
                                          FREE
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Content info */}
                                  <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-slate-50/50">
                                    <div className="flex flex-col gap-1.5">
                                      <h4 className="font-extrabold text-[#192131] text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                                        {item.Title}
                                      </h4>
                                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{item.date_and_time || item.upcoming_date_time}</span>
                                      </div>
                                    </div>

                                    {/* Action button */}
                                    <button
                                      disabled
                                      className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-black text-xs uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                      <Clock className="w-4 h-4" />
                                      <span>WAITING...</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {selectedBatchTab === "test" && (
              <div className="max-w-5xl mx-auto w-full px-4 py-8 animate-scale-up">
                {selectedTestSeries && selectedTestSubject ? (
                  /* --- TEST LIST / QUIZZES SUB-VIEW --- */
                  <div className="flex flex-col gap-6">
                    {testTitlesLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-10 h-10 rounded-full border-4 border-slate-205 border-t-blue-600 animate-spin"></div>
                        <p className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">Loading Tests...</p>
                      </div>
                    ) : testTitlesError ? (
                      <div className="max-w-md mx-auto bg-rose-50 border border-rose-250 rounded-2xl p-6 text-center flex flex-col items-center gap-3 mt-4">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 border border-rose-200">
                          ⚠️
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-sm">लोड करने में समस्या आई</h3>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">{testTitlesError}</p>
                        <button
                          onClick={() => {
                            fetchTestTitles(
                              selectedTestSeries.id || selectedTestSeries.Id,
                              selectedTestSubject.subjectid
                            );
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition active:scale-95"
                        >
                          पुनः प्रयास करें (Retry)
                        </button>
                      </div>
                    ) : testTitlesList.length === 0 ? (
                      <div className="max-w-md mx-auto w-full py-12">
                        <div className="bg-white rounded-2xl border border-slate-150 p-8 text-center flex flex-col items-center justify-center shadow-sm">
                          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-4">
                            <FileText className="w-5 h-5" />
                          </div>
                          <h3 className="font-extrabold text-[#1e293b] text-base mb-1.5 HindiRef">
                            कोई टेस्ट उपलब्ध नहीं है
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xs mb-4">
                            इस विषय के अंतर्गत अभी टेस्ट तैयार किए जा रहे हैं।
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {testTitlesList.map((test, idx) => (
                          <div
                            key={test.id || idx}
                            className="bg-white border-2 border-slate-150 hover:border-blue-400 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-150"
                          >
                            <div className="flex flex-col gap-3">
                              <div>
                                <h4 className="font-black text-slate-800 text-sm sm:text-base leading-snug tracking-tight">
                                  {test.title}
                                </h4>
                                <span className="text-[10px] sm:text-xs text-slate-505 font-bold tracking-tight">
                                  Remaining attempt - {test.remaining_attempt || test.max_test_attempt || "2"}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 my-2">
                                <div className="bg-blue-50/75 border border-blue-105 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                                  <span className="font-black text-blue-700 text-sm sm:text-base">{test.questions}</span>
                                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-tight font-mono">Questions</span>
                                </div>
                                <div className="bg-blue-50/75 border border-blue-105 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                                  <span className="font-black text-blue-700 text-sm sm:text-base">{test.marks}</span>
                                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-tight font-mono">Marks</span>
                                </div>
                                <div className="bg-blue-50/75 border border-blue-105 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                                  <span className="font-black text-blue-700 text-sm sm:text-base">{test.time}</span>
                                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-tight font-mono">Minutes</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                triggerToast(`📝 ${test.title} शुरू हो रहा है...`);
                                setActiveTestPlayer({
                                  id: test.id || test.Id || "35505",
                                  title: test.title,
                                  time: parseInt(test.time || "5"),
                                  questionsUrl: test.test_questions_url
                                });
                              }}
                              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition duration-150 active:scale-95 flex items-center justify-center gap-1 cursor-pointer shadow-sm font-mono"
                            >
                              <span>Attempt</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : selectedTestSeries ? (
                  /* --- SUBJECT SELECTION SUB-VIEW --- */
                  <div className="flex flex-col gap-6">

                    {testSubjectsLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-10 h-10 rounded-full border-4 border-slate-205 border-t-blue-600 animate-spin"></div>
                        <p className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">Loading Subjects...</p>
                      </div>
                    ) : testSubjectsError ? (
                      <div className="max-w-md mx-auto bg-rose-50 border border-rose-250 rounded-2xl p-6 text-center flex flex-col items-center gap-3 mt-4">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 border border-rose-200">
                          ⚠️
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-sm">लोड करने में समस्या आई</h3>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">{testSubjectsError}</p>
                        <button
                          onClick={() => {
                            fetchTestSubjects(selectedTestSeries.id || selectedTestSeries.Id);
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition active:scale-95"
                        >
                          पुनः प्रयास करें (Retry)
                        </button>
                      </div>
                    ) : testSubjectsList.length === 0 ? (
                      <div className="max-w-md mx-auto w-full py-12">
                        <div className="bg-white rounded-2xl border border-slate-150 p-8 text-center flex flex-col items-center justify-center shadow-sm">
                          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-4">
                            <FileText className="w-5 h-5" />
                          </div>
                          <h3 className="font-extrabold text-[#1e293b] text-base mb-1.5 HindiRef">
                            कोई विषय उपलब्ध नहीं है
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xs mb-4">
                            इस टेस्ट सीरीज़ के लिए अभी विषय तैयार किए जा रहे हैं।
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {testSubjectsList.map((subject, idx) => (
                          <div
                            key={subject.subjectid || idx}
                            onClick={() => {
                              setSelectedTestSubject(subject);
                              fetchTestTitles(selectedTestSeries.id || selectedTestSeries.Id, subject.subjectid);
                            }}
                            className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition duration-150 active:scale-[0.98] shadow-sm"
                          >
                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white border border-slate-200 rounded-full flex items-center justify-center overflow-hidden p-2 mb-4">
                              <img
                                src={subject.subject_logo || RWA_LOGO}
                                alt={subject.subject_name}
                                className="w-full h-full object-contain rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = RWA_LOGO;
                                }}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <h4 className="font-bold text-slate-800 text-xs sm:text-sm text-center tracking-tight leading-snug">
                              {subject.subject_name}
                            </h4>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : testSeriesList.length === 0 ? (
                  <div className="max-w-md mx-auto w-full py-8">
                    <div className="bg-white rounded-2xl border border-slate-150 p-8 text-center flex flex-col items-center justify-center shadow-sm">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-4">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-[#1e293b] text-base mb-1.5 HindiRef">
                        टेस्ट सीरीज़ उपलब्ध नहीं है
                      </h3>
                      <p className="text-xs text-slate-550 font-semibold leading-relaxed max-w-xs mb-4">
                        इस बैच के लिए टेस्ट सीरीज़ अभी तैयार की जा रही है। जल्द ही यहाँ उपलब्ध कराई जाएगी।
                      </p>
                      <span className="inline-flex bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-md">
                        ⏳ COMING SOON
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-2 border-b border-slate-150 pb-2.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-800 font-mono">
                          उपलब्ध टेस्ट सीरीज़ (Available Test Series)
                        </h3>
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-black font-mono px-2 py-0.5 rounded-full">
                          {testSeriesList.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {testSeriesList.map((test) => (
                          <div key={test.id} className="bg-white border-2 border-slate-150 hover:border-blue-400 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex flex-col items-center text-center gap-3">
                              <div className="w-full aspect-square bg-slate-50 border border-slate-100 rounded-xl overflow-hidden p-1 flex items-center justify-center relative">
                                <img
                                  src={test.logo || RWA_LOGO}
                                  alt={test.title}
                                  className="w-full h-full object-contain rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = RWA_LOGO;
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <h4 className="font-bold text-slate-800 text-[11px] sm:text-xs line-clamp-2 leading-snug tracking-tight px-1 h-9 flex items-center justify-center">
                                {test.title}
                              </h4>
                            </div>
                            
                            <button
                              onClick={() => {
                                setSelectedTestSeries(test);
                              }}
                              className="mt-4 w-full bg-blue-600 hover:bg-blue-755 text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider py-2.5 rounded-xl transition duration-150 active:scale-95 flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                            >
                              <span>View Details</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

          </div>
        </div>
      )}



      {/* CHECKOUT MODAL & PURCHASE FLOW (MOBILE FRIENDLY) */}
      {checkoutBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            
            {/* Title block */}
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between border-b border-slate-955">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-white" />
                <h3 className="font-extrabold text-sm md:text-base">सुरक्षित प्रवेश भुगतान (Sandbox)</h3>
              </div>
              <button
                onClick={closeCheckoutFlow}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition active:scale-95 animate-pulse"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inner flow depending on purchase status */}
            {!isPurchaseSuccess ? (
              <div className="p-5 flex flex-col gap-4 text-xs font-semibold">
                
                {/* Course name snippet */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-3 items-center">
                  <img
                    src={checkoutBatch.course_thumbnail || RWA_LOGO}
                    alt={checkoutBatch.course_name}
                    className="w-12 h-12 object-cover rounded-md border border-slate-150"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = RWA_LOGO;
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-rose-500 uppercase font-black tracking-wider">{checkoutBatch.exam_category}</span>
                    <span className="font-extrabold text-slate-850 line-clamp-1">{checkoutBatch.course_name}</span>
                  </div>
                </div>

                <form onSubmit={(e) => handlePurchaseSubmit(e, checkoutBatch)} className="flex flex-col gap-3.5 font-medium">
                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 text-xs font-bold leading-none">विद्यार्थी का नाम (Student Name) *</label>
                    <input
                      type="text"
                      required
                      placeholder="पूरा नाम दर्ज करें (जैसे: राहुल कुमार)"
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      className="border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:border-slate-350"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 text-xs font-bold leading-none">मोबाइल संख्या (Phone Number) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-अंकों का नंबर दर्ज करें (जैसे: 981848xxxx)"
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      className="border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:border-slate-350"
                    />
                  </div>

                  {/* Sandbox Card inputs - styled but no action required */}
                  <div className="border border-slate-200 bg-slate-50 rounded-xl p-3.5 flex flex-col gap-2 shadow-inner">
                    <span className="text-[10px] uppercase font-black text-slate-700 tracking-widest leading-none">टोकन डेमो भुगतान क्रेडेंशियल्स</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold">
                      <div>कार्ड संख्या: •••• •••• •••• 4242</div>
                      <div>सीवीवी: *** &nbsp; वैधता: 12/29</div>
                    </div>
                  </div>

                  {/* Coupons area */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <label className="text-slate-500 text-xs font-bold col-span-3">कूपन कोड (Coupon Code)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="जैसे: VAYU20, AGNI20"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 bg-slate-50 placeholder-slate-400 focus:outline-none focus:border-slate-350"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(checkoutBatch)}
                        className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-black tracking-wider uppercase cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        लागू करें
                      </button>
                    </div>
                    {couponMessage && (
                      <span className={`text-[10px] font-bold mt-1 ${appliedDiscount > 0 ? "text-emerald-600 animate-pulse" : "text-slate-500"}`}>
                        {couponMessage}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                      <span>मूल्य (MRP):</span>
                      <span className="line-through">{checkoutBatch.price === "-1" ? "₹699" : `₹${checkoutBatch.price}`}</span>
                    </div>
                    {appliedDiscount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 text-xs font-bold">
                        <span>कूपन छूट:</span>
                        <span>- ₹{appliedDiscount}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-800 font-extrabold text-sm border-t border-slate-200 pt-1.5">
                      <span>कुल देय राशि:</span>
                      <span className="text-rose-600 font-black">
                        ₹{Math.max(0, parseInt(checkoutBatch.price === "-1" ? "699" : checkoutBatch.price) - appliedDiscount)}
                      </span>
                    </div>
                  </div>

                  {/* Submission buttons */}
                  <button
                    type="submit"
                    className="mt-3 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs py-3.5 rounded-xl transition duration-75 active:scale-95 flex items-center justify-center gap-1 cursor-pointer shadow-md"
                  >
                    <span>सुरक्षित पेमेंट करें</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

              </div>
            ) : (
              /* Simulated ID card showing elegant validation student onboarding */
              <div className="p-5 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner animate-bounce">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">प्रवेश कार्ड जनरेट किया गया!</h4>
                  <p className="text-slate-500 text-xs font-semibold">बैच में आपका एडमिशन सफल रहा। अपनी डिजिटल आईडी सहेजें।</p>
                </div>

                {/* Digital High-Fidelity ID Card */}
                {generatedIdCard && (
                  <div className="w-full bg-slate-900 text-white border border-slate-950 rounded-2xl shadow-xl overflow-hidden text-left flex flex-col relative">
                    {/* Header */}
                    <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-200">RWA x PAIN Academy</span>
                      </div>
                      <span className="text-[8px] bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                        ACTIVE STUDENT
                      </span>
                    </div>

                    {/* ID Body */}
                    <div className="p-4 flex flex-col gap-3 relative z-10 text-[11px] font-semibold text-slate-300">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400">कोर्स बैच (Course Name):</span>
                        <span className="text-xs font-bold text-white line-clamp-1">{generatedIdCard.course}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-400">छात्र (Student):</span>
                          <span className="font-bold text-white">{generatedIdCard.student}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-400">अनुक्रमांक (Roll No):</span>
                          <span className="font-mono font-bold text-white">{generatedIdCard.roll}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-[8px] text-slate-400">
                        <span>प्रवेश तिथि (Admission Date):</span>
                        <span className="font-bold text-white">{generatedIdCard.date}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex w-full gap-2 mt-2">
                  <button
                    onClick={() => {
                      if (generatedIdCard) {
                        // Simulated download action
                        triggerToast("स्टूडेंट प्रवेश पत्र डाउनलोड किया गया! 📥");
                      }
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-extrabold text-xs py-3 rounded-xl border border-slate-900 transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>डाउनलोड करें</span>
                  </button>
                  <button
                    onClick={closeCheckoutFlow}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer active:scale-95 shadow-sm"
                  >
                    सहेजें और बंद करें
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/*Simulated User Query Ticket modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow border border-slate-200 overflow-hidden animate-scale-up">
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between border-b border-slate-900">
              <span className="text-sm font-extrabold flex items-center gap-1.5 text-slate-100">
                <HelpCircle className="w-4 h-4 text-white" /> सहायता टिकट अनुरोध (Help Desk Query)
              </span>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-1 hover:bg-slate-800 rounded bg-slate-900 text-slate-400 hover:text-white transition active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
               {!querySubmitted ? (
                <form onSubmit={handleSupportSubmit} className="flex flex-col gap-3.5 text-xs font-semibold text-slate-500">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold leading-none">आपका नाम (Full Name) *</label>
                    <input
                      type="text"
                      required
                      placeholder="अपना नाम दर्ज करें"
                      value={queryName}
                      onChange={(e) => setQueryName(e.target.value)}
                      className="border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:border-slate-350"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold leading-none">ईमेल या मोबाइल नंबर (Email/Phone) *</label>
                    <input
                      type="text"
                      required
                      placeholder="आपसे संपर्क करने की जानकारी"
                      value={queryEmail}
                      onChange={(e) => setQueryEmail(e.target.value)}
                      className="border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:border-slate-350"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-500 font-bold leading-none">अपनी क्वेरी या संदेश दर्ज करें (Your Query) *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="अपनी सहायता का विषय संक्षेप में लिखें (जैसे: वीर बैच एक्टिवेट नहीं हुआ है)"
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      className="border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:border-slate-350 resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-sm cursor-pointer text-center active:scale-95 duration-100"
                  >
                    टिकट जमा करें (Submit Ticket)
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-6 gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin"></div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">प्रक्रिया सहेजी जा रही है...</h4>
                    <p className="text-slate-500 text-xs mt-0.5 font-bold">आपका सहायता अनुरोध सर्वर पर दर्ज किया जा रहा है।</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Scroll to Search assist action button */}
      {showScrollSearch && (
        <button
          onClick={handleScrollToSearch}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-full shadow-xl transition-all duration-200 active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center border border-slate-700 hover:border-slate-600 group"
          title="खोज बॉक्स पर वापस जाएं"
        >
          <Search className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-150" />
        </button>
      )}

      {/* WHATSAPP MODAL POPUP */}
      {showWhatsAppPopup && !selectedBatch && (
        <div id="whatsapp-popup-overlay" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-[340px] bg-[#121212] border border-[#262626] rounded-[28px] p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button top right */}
            <button
              onClick={() => setShowWhatsAppPopup(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition duration-150 p-1.5 bg-transparent rounded-full hover:bg-white/5 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* WhatsApp Premium Icon Ring Container with premium subtle pulse */}
            <div className="relative flex items-center justify-center w-20 h-20 bg-[#1c1c1c] rounded-full mb-6 border border-neutral-800/60 gola-pulse-animate shadow-inner">
              {/* Outer halo shadow */}
              <div className="absolute inset-0 bg-[#25D366]/2 rounded-full blur-xl"></div>
              {/* White circle containing WhatsApp logo */}
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                <svg className="w-6.5 h-6.5 text-[#111111] fill-[#111111]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
            </div>

            {/* Title Block */}
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase mb-2">
              JOIN OUR WHATSAPP!
            </h3>

            {/* Description Subtext */}
            <p className="text-xs sm:text-sm text-[#9f9f9f] font-semibold leading-relaxed px-2 mb-6">
              Get the latest updates, exclusive content, and new links if our site gets blocked.
            </p>

            {/* Actions Stack */}
            <div className="w-full flex flex-col gap-3">
              {/* Join Button */}
              <a
                href="https://www.whatsapp.com/channel/0029VbCUE8230LKHYMCduo13"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowWhatsAppPopup(false)}
                className="w-full h-11 bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 cursor-pointer"
              >
                {/* Embedded dynamic whatsapp phone like icon */}
                <svg className="w-4 h-4 text-[#25D366] fill-[#25D366]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Join Channel
              </a>

              {/* Cancel Button */}
              <button
                onClick={() => setShowWhatsAppPopup(false)}
                className="w-full h-11 bg-transparent hover:bg-white/5 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Helper function to mock chapters and lectures depending on subject name
function getMockChapters(subjectName: string) {
  const name = (subjectName || "").toLowerCase();
  if (name.includes("math") || name.includes("numerical") || name.includes("quant") || name.includes("calculation") || name.includes("गणित")) {
    return [
      {
        title: "Chapter 01: Number System (संख्या पद्धति)",
        lectures: [
          { name: "L-01 : Classification of Numbers", duration: "52 min", date: "2026-06-01" },
          { name: "L-02 : Divisibility Rules & Unit Digit", duration: "48 min", date: "2026-06-02" },
          { name: "L-03 : Number of Zeroes & Remainder Theorem", duration: "55 min", date: "2026-06-03" },
        ]
      },
      {
        title: "Chapter 02: Percentage (प्रतिशत)",
        lectures: [
          { name: "L-01 : Percentage Fractional Conversions", duration: "44 min", date: "2026-06-05" },
          { name: "L-02 : Population & Election Based Questions", duration: "50 min", date: "2026-06-06" },
          { name: "L-03 : Exam & Venn Diagram Concepts", duration: "58 min", date: "2026-06-07" },
        ]
      },
      {
        title: "Chapter 03: Profit, Loss & Discount (लाभ, हानि और बट्टा)",
        lectures: [
          { name: "L-01 : Cost Price & Selling Price Core Basics", duration: "45 min", date: "2026-06-10" },
          { name: "L-02 : Dishonest Shopkeeper problems", duration: "53 min", date: "2026-06-11" },
        ]
      }
    ];
  } else if (name.includes("hindi") || name.includes("हिंदी")) {
    return [
      {
        title: "Chapter 01: वर्ण विचार एवं वर्णमाला (Hindi Alphabet)",
        lectures: [
          { name: "L-01 : स्वर और व्यंजन का वर्गीकरण", duration: "40 min", date: "2026-06-01" },
          { name: "L-02 : उच्चारण स्थान एवं प्रयत्न के आधार पर भेद", duration: "45 min", date: "2026-06-02" },
        ]
      },
      {
        title: "Chapter 02: संज्ञा, सर्वनाम एवं क्रिया (Grammar Roots)",
        lectures: [
          { name: "L-01 : संज्ञा और उसके भेद (संज्ञा की पहचान)", duration: "42 min", date: "2026-06-04" },
          { name: "L-02 : सर्वनाम एवं विशेषण परिभाषा व भेद", duration: "50 min", date: "2026-06-05" },
        ]
      }
    ];
  } else if (name.includes("computer") || name.includes("कंप्यूटर")) {
    return [
      {
        title: "Chapter 01: Introduction & Generation of Computers",
        lectures: [
          { name: "L-01 : History, Characteristics & Generations", duration: "38 min", date: "2026-06-01" },
          { name: "L-02 : Computer Hardware & CPU Anatomy", duration: "45 min", date: "2026-06-02" },
        ]
      },
      {
        title: "Chapter 02: MS Office Suite (Word, Excel & PowerPoint)",
        lectures: [
          { name: "L-01 : MS Word Core shortcuts & Commands", duration: "51 min", date: "2026-06-04" },
          { name: "L-02 : MS Excel Basic Formulas & Cell references", duration: "54 min", date: "2026-06-05" },
        ]
      }
    ];
  } else if (name.includes("polity") || name.includes("संविधान") || name.includes("राजव्यवस्था")) {
    return [
      {
        title: "Chapter 01: Constitution of India (भारतीय संविधान निर्माण)",
        lectures: [
          { name: "L-01 : Constituent Assembly & Framing of Constitution", duration: "49 min", date: "2026-06-01" },
          { name: "L-02 : Preamble of the Constitution & Key Sources", duration: "41 min", date: "2026-06-02" },
        ]
      },
      {
        title: "Chapter 02: Fundamental Rights & Duties (मौलिक अधिकार)",
        lectures: [
          { name: "L-01 : Article 14 to 18 : Right to Equality", duration: "52 min", date: "2026-06-05" },
          { name: "L-02 : Article 19 to 22 : Right to Freedom", duration: "48 min", date: "2026-06-06" },
        ]
      }
    ];
  } else {
    // Default fallback chapters
    return [
      {
        title: "Chapter 01: बुनियादी अवधारणाएं (Foundation Core Rules)",
        lectures: [
          { name: "L-01 : Syllabus Analysis & Foundation Theory", duration: "45 min", date: "2026-06-01" },
          { name: "L-02 : Concept Clearing Session & Practice Rules", duration: "50 min", date: "2026-06-03" },
        ]
      },
      {
        title: "Chapter 02: विस्तृत पाठ्यक्रम व्याख्यान (Detailed Lectures)",
        lectures: [
          { name: "L-01 : Principal Core Chapter Lectures (Part 1)", duration: "55 min", date: "2026-06-08" },
          { name: "L-02 : Principal Core Chapter Lectures (Part 2)", duration: "48 min", date: "2026-06-10" },
        ]
      }
    ];
  }
}

// Accordion for rendering subject chapters
function ChapterAccordion({ 
  title, 
  lectures, 
  idx, 
  onAction 
}: any) {
  const [isOpen, setIsOpen] = useState(idx === 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:border-slate-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-5 py-4 text-left flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50 transition"
      >
        <span className="font-extrabold text-slate-800 text-xs sm:text-sm line-clamp-1">{title}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 font-extrabold px-2.5 py-1 rounded-full">
            {lectures.length} Classes
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="divide-y divide-slate-100 px-4 sm:px-5 py-1 bg-white">
          {lectures.map((lec: any, index: number) => (
            <div key={index} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 bg-blue-50 text-[#0070f3] font-black text-xs rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Play className="w-3 h-3 fill-current" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-800 font-black text-xs leading-snug">{lec.name}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                    <span>⏱ {lec.duration}</span>
                    <span>•</span>
                    <span>📆 {lec.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onAction(`'${lec.name}' वीडियो रेंडर हो रहा है... (Starting demo presentation)`)}
                  className="bg-[#0070f3] hover:bg-blue-600 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Watch Video</span>
                </button>
                <button
                  onClick={() => onAction(`L-0${index+1} Hand Written Class Notes.pdf डाउनलोड की जा रही है...`)}
                  className="border border-slate-250 text-slate-700 bg-white hover:bg-slate-50 font-extrabold text-[10px] px-3.5 py-2 rounded-xl transition active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-2.5 h-2.5" />
                  <span>View PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
