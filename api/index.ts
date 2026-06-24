import express from "express";
import CryptoJS from "crypto-js";

const app = express();

const getSecretKey = (): string => {
  const codes = [84, 111, 112, 112, 101, 114, 115, 66, 97, 116, 99, 104, 72, 117, 98, 83, 101, 99, 114, 101, 116, 75, 101, 121, 50, 48, 50, 54, 95, 65, 69, 83];
  return String.fromCharCode(...codes);
};

function encryptResponse(data: any) {
  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), getSecretKey()).toString();
  return { encData: ciphertext };
}

function sendEncrypted(res: any, data: any, status = 200) {
  res.status(status).json(encryptResponse(data));
}

// Proxy API requests to bypass CORS
app.get("/api/batches", async (req, res) => {
  try {
    console.log("Proxy request received for /api/batches. Fetching upstream...");
    const apiRes = await fetch("https://rwapi.vercel.app/api/batches", {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!apiRes.ok) {
      throw new Error(`Upstream API status: ${apiRes.status}`);
    }
    
    const responseData = await apiRes.json();
    console.log("Successfully fetched batches from upstream. Batches count:", responseData?.data?.length);
    sendEncrypted(res, responseData);
  } catch (error: any) {
    console.error("Backend proxy error fetching upstream batches:", error);
    sendEncrypted(res, {
      success: false,
      message: "Proxy failed to fetch batches",
      error: error.message || error,
    }, 500);
  }
});

// Proxy API requests for subjects
app.get("/api/subjects", async (req, res) => {
  try {
    const { bid } = req.query;
    if (!bid) {
      return res.status(400).json({ success: false, message: "Missing bid parameter" });
    }
    console.log(`Proxy request received for /api/subjects with bid: ${bid}. Fetching upstream...`);
    const apiRes = await fetch(`https://rwapi.vercel.app/api/subjects?bid=${bid}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!apiRes.ok) {
      throw new Error(`Upstream API status: ${apiRes.status}`);
    }
    
    const responseData = await apiRes.json();
    sendEncrypted(res, responseData);
  } catch (error: any) {
    console.error("Backend proxy error fetching upstream subjects:", error);
    sendEncrypted(res, {
      success: false,
      message: "Proxy failed to fetch subjects",
      error: error.message || error,
    }, 500);
  }
});

// Proxy API requests for topics
app.get("/api/topics", async (req, res) => {
  try {
    const { bid, sid } = req.query;
    if (!bid || !sid) {
      return res.status(400).json({ success: false, message: "Missing bid or sid parameter" });
    }
    console.log(`Proxy request received for /api/topics with bid: ${bid}, sid: ${sid}. Fetching upstream...`);
    const apiRes = await fetch(`https://rwapi.vercel.app/api/topics?bid=${bid}&sid=${sid}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!apiRes.ok) {
      throw new Error(`Upstream API status: ${apiRes.status}`);
    }
    
    const responseData = await apiRes.json();
    sendEncrypted(res, responseData);
  } catch (error: any) {
    console.error("Backend proxy error fetching upstream topics:", error);
    sendEncrypted(res, {
      success: false,
      message: "Proxy failed to fetch topics",
      error: error.message || error,
    }, 500);
  }
});

// Proxy API requests for content (video, notes, etc.)
app.get("/api/content", async (req, res) => {
  try {
    const { bid, sid, tid } = req.query;
    if (!bid || !sid || !tid) {
      return res.status(400).json({ success: false, message: "Missing bid, sid or tid parameter" });
    }
    console.log(`Proxy request received for /api/content with bid: ${bid}, sid: ${sid}, tid: ${tid}. Fetching upstream...`);
    const apiRes = await fetch(`https://rwapi.vercel.app/api/content?bid=${bid}&sid=${sid}&tid=${tid}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!apiRes.ok) {
      throw new Error(`Upstream API status: ${apiRes.status}`);
    }
    
    const responseData = await apiRes.json();
    sendEncrypted(res, responseData);
  } catch (error: any) {
    console.error("Backend proxy error fetching upstream content:", error);
    sendEncrypted(res, {
      success: false,
      message: "Proxy failed to fetch content",
      error: error.message || error,
    }, 500);
  }
});

// Proxy API requests for PDF resolution
app.get("/api/pdf", async (req, res) => {
  try {
    const { l } = req.query;
    if (!l) {
      return res.status(400).json({ success: false, message: "Missing parameter 'l'" });
    }
    console.log(`Proxy request received for /api/pdf with l query parameter. Fetching upstream...`);
    const apiRes = await fetch(`https://rwapi.vercel.app/api/pdf?l=${encodeURIComponent(String(l))}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!apiRes.ok) {
      throw new Error(`Upstream API status: ${apiRes.status}`);
    }
    
    const responseData = await apiRes.json();
    sendEncrypted(res, responseData);
  } catch (error: any) {
    console.error("Backend proxy error fetching PDF url:", error);
    sendEncrypted(res, {
      success: false,
      message: "Proxy failed to fetch PDF details",
      error: error.message || error,
    }, 500);
  }
});

// Proxy API requests for Live & Upcoming Lectures
app.get("/api/liveupcoming", async (req, res) => {
  try {
    const { bid } = req.query;
    if (!bid) {
      return res.status(400).json({ success: false, message: "Missing parameter 'bid'" });
    }
    console.log(`Proxy liveupcoming request for bid: ${bid}`);
    const apiRes = await fetch(`https://rwapi.vercel.app/api/liveupcoming?bid=${bid}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!apiRes.ok) {
      throw new Error(`Upstream API status: ${apiRes.status}`);
    }
    
    const responseData = await apiRes.json();
    sendEncrypted(res, responseData);
  } catch (error: any) {
    console.error("Backend proxy error fetching liveupcoming:", error);
    sendEncrypted(res, {
      success: false,
      message: "Proxy failed to fetch live and upcoming lectures",
      error: error.message || error,
    }, 500);
  }
});

// Proxy API requests for Video details (resolving M3U8 streaming link)
app.get("/api/video", async (req, res) => {
  try {
    const { vid, bid, q } = req.query;
    if (!vid || !bid) {
      return res.status(400).json({ success: false, message: "Missing parameter 'vid' or 'bid'" });
    }
    
    // Always call upstream API without the 'q' parameter to prevent 404.
    const targetUrl = `https://rwapi.vercel.app/api/video?vid=${vid}&bid=${bid}`;
    
    console.log(`Proxy video request for vid: ${vid}, bid: ${bid}, targetUrl: ${targetUrl}`);
    const apiRes = await fetch(targetUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!apiRes.ok) {
      throw new Error(`Upstream API status: ${apiRes.status}`);
    }
    
    const responseData = await apiRes.json();
    if (responseData && typeof responseData.url === "string") {
      console.log("Original parsed video URL:", responseData.url);
      let cleaned = responseData.url.trim();
      
      // Safely strip non-printable Control/ASCII characters and escaped unicode representations
      cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
      cleaned = cleaned.replace(/\\u[0-9a-fA-F]{4}/g, "");
      
      // Find the index of "http" to strip any leading garbage characters
      const httpIndex = cleaned.indexOf("http");
      if (httpIndex !== -1) {
        cleaned = cleaned.substring(httpIndex);
      }
      
      if (q) {
        // If a specific quality is requested, safely adjust the URL levels if 480p is present
        if (cleaned.includes("/480p/")) {
          cleaned = cleaned.replace(/\/480p\//g, `/${q}/`);
        }
        if (cleaned.includes("txCodecTempName=")) {
          cleaned = cleaned.replace(/txCodecTempName=[^&]+/g, `txCodecTempName=${q}`);
        }
        console.log(`Adjusted quality of URL to ${q}:`, cleaned);
      } else {
        console.log("Sanitized and cleaned video URL:", cleaned);
      }
      responseData.url = cleaned;
    }
    sendEncrypted(res, responseData);
  } catch (error: any) {
    console.error("Backend proxy error fetching video info:", error);
    sendEncrypted(res, {
      success: false,
      message: "Proxy failed to fetch video details",
      error: error.message || error,
    }, 500);
  }
});

// Basic health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Toppers Batch Hub Proxy" });
});

// Proxy API requests for testseries
app.get("/api/testseries", async (req, res) => {
  try {
    const { bid } = req.query;
    if (!bid) {
      return res.status(400).json({ success: false, message: "Missing bid parameter" });
    }
    console.log(`Proxy request received for /api/testseries with bid: ${bid}. Fetching upstream...`);
    const apiRes = await fetch(`https://rwapi.vercel.app/api/testseries?bid=${bid}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!apiRes.ok) {
      throw new Error(`Upstream API status: ${apiRes.status}`);
    }
    
    const responseData = await apiRes.json();
    sendEncrypted(res, responseData);
  } catch (error: any) {
    console.error("Backend proxy error fetching upstream testseries:", error);
    sendEncrypted(res, {
      success: false,
      message: "Proxy failed to fetch testseries",
      error: error.message || error,
    }, 500);
  }
});

// Proxy API requests for testsubject
app.get("/api/testsubject", async (req, res) => {
  try {
    const { tsid } = req.query;
    if (!tsid) {
      return res.status(400).json({ success: false, message: "Missing tsid parameter" });
    }
    console.log(`Proxy request received for /api/testsubject with tsid: ${tsid}. Fetching upstream...`);
    const apiRes = await fetch(`https://rwapi.vercel.app/api/testsubject?tsid=${tsid}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!apiRes.ok) {
      throw new Error(`Upstream API status: ${apiRes.status}`);
    }
    
    const responseData = await apiRes.json();
    sendEncrypted(res, responseData);
  } catch (error: any) {
    console.error("Backend proxy error fetching upstream testsubject:", error);
    sendEncrypted(res, {
      success: false,
      message: "Proxy failed to fetch testsubject",
      error: error.message || error,
    }, 500);
  }
});

// Proxy API requests for testtitles
app.get("/api/testtitles", async (req, res) => {
  try {
    const { tsid, sid } = req.query;
    if (!tsid || !sid) {
      return res.status(400).json({ success: false, message: "Missing tsid or sid parameter" });
    }
    console.log(`Proxy request received for /api/testtitles with tsid: ${tsid}, sid: ${sid}. Fetching upstream...`);
    const apiRes = await fetch(`https://rwapi.vercel.app/api/testtitles?tsid=${tsid}&sid=${sid}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!apiRes.ok) {
      throw new Error(`Upstream API status: ${apiRes.status}`);
    }
    
    const responseData = await apiRes.json();
    sendEncrypted(res, responseData);
  } catch (error: any) {
    console.error("Backend proxy error fetching upstream testtitles:", error);
    sendEncrypted(res, {
      success: false,
      message: "Proxy failed to fetch testtitles",
      error: error.message || error,
    }, 500);
  }
});

// Proxy API requests for test questions from ClassX CDN
app.get("/api/questions", async (req, res) => {
  try {
    const { test_id, url } = req.query;
    let questionsUrl = "";

    if (url && typeof url === "string" && url.trim().startsWith("http")) {
      questionsUrl = url.trim();
      console.log(`Proxy request for questions via explicit URL: ${questionsUrl}`);
    } else {
      if (!test_id) {
        return res.status(400).json({ success: false, message: "Missing test_id or url parameter" });
      }
      questionsUrl = `https://testseries-assets-v3.classx.co.in/test_title_question/rozgar_db/${test_id}/${test_id}_questions0.0609933946874508.json`;
      console.log(`Proxy request for questions test_id: ${test_id}. Fetching from ClassX CDN fallback: ${questionsUrl}`);
    }
    
    const apiRes = await fetch(questionsUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!apiRes.ok) {
      throw new Error(`Upstream questions status: ${apiRes.status}`);
    }
    
    const data = await apiRes.json();
    sendEncrypted(res, data);
  } catch (error: any) {
    console.error(`Backend failed questions proxy for test ${req.query.test_id || req.query.url}:`, error);
    sendEncrypted(res, {
      success: false,
      message: "Proxy failed to fetch questions from ClassX, fallback to preset options",
      error: error.message || error,
    }, 500);
  }
});

export default app;
