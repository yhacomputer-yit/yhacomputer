import { useState, useEffect, useRef, useCallback } from "react";
import { useSeo } from "../seo.js";
import "./exam.css";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwP2m20Mb3Jkmp351o-l4NV9j7B8bDytq229agCj53j3OZV0jX-ONCkv7ES03zARvtsWg/exec";
const EXAM_DURATION = 3600;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    minutes.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0")
  );
}

function getNotificationIcon(type) {
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  };
  return icons[type] || icons.info;
}

function isGithubOrDriveLink(link) {
  return (
    link &&
    (link.includes("raw.githubusercontent.com") ||
      link.includes("drive.google.com"))
  );
}

function getPdfEmbedUrl(link) {
  if (link.includes("drive.google.com")) {
    const match = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    const idMatch = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    }
  }
  return link;
}

function NotificationToast({ notification, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(notification.id), 3000);
    return () => clearTimeout(timer);
  }, [notification.id, onRemove]);

  return (
    <div
      className={`notification-toast notification-${notification.type} show`}
    >
      <i className={getNotificationIcon(notification.type)} />
      {notification.message}
    </div>
  );
}

export default function Exam() {
  const [examIdInput, setExamIdInput] = useState("");
  const [currentExamId, setCurrentExamId] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(EXAM_DURATION);
  const [isExamActive, setIsExamActive] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [pdfLink, setPdfLink] = useState("");
  const [resourceLink, setResourceLink] = useState("");
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("examTheme") || "light"
      : "light",
  );
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [showReport, setShowReport] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [tabSwitchLog, setTabSwitchLog] = useState([]);
  const [securityEventLog, setSecurityEventLog] = useState([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState(false);
  const [showBlur, setShowBlur] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const examStartTimeRef = useRef(null);
  const timerRef = useRef(null);
  const lastFocusLossRef = useRef(null);
  const examSectionRef = useRef(null);

  useSeo({
    title: "YHA Exam System",
    description:
      "Take your YHA exam with secure proctoring, timed questions, and PDF reference materials.",
    url: "/exam",
  });

  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const logSecurityEvent = useCallback((event) => {
    const timestamp = new Date().toLocaleString();
    const logEntry = `${timestamp}: ${event}`;
    setSecurityEventLog((prev) => [...prev, logEntry]);
    console.log(`Security Event: ${event}`);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("examTheme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
    if (document.body) {
      document.body.style.transition = "all 0.3s ease";
      setTimeout(() => {
        document.body.style.transition = "";
      }, 300);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addNotification("Connection restored!", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      addNotification(
        "You're offline. Exam content may not load properly.",
        "warning",
      );
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addNotification]);

  useEffect(() => {
    if (!isExamActive) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      addNotification(
        "Right-click is disabled to protect exam content.",
        "warning",
      );
      logSecurityEvent("Right-click attempt detected");
    };

    const handleKeyDown = (e) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.shiftKey && e.key === "S") ||
        (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4")) ||
        (e.metaKey && e.key === "s") ||
        (e.getModifierState &&
          e.getModifierState("CapsLock") &&
          e.key === "s") ||
        (e.metaKey && e.shiftKey && e.key === "S") ||
        (e.altKey && e.key === "PrintScreen") ||
        (e.ctrlKey && e.key === "S") ||
        (e.ctrlKey && e.key === "s")
      ) {
        e.preventDefault();
        addNotification(
          "Screenshots and Snipping Tool are not allowed during the exam.",
          "error",
        );
        logSecurityEvent(
          `Screenshot/Snipping Tool attempt detected (Key: ${e.key})`,
        );
      }

      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.metaKey && e.altKey && (e.key === "I" || e.key === "J"))
      ) {
        e.preventDefault();
        addNotification(
          "Developer tools are not allowed during the exam.",
          "error",
        );
        logSecurityEvent(`Dev tools attempt detected (Key: ${e.key})`);
      }

      if (e.ctrlKey && (e.key === "c" || e.key === "v")) {
        e.preventDefault();
        addNotification(
          "Copy-paste is disabled during the exam.",
          "warning",
        );
        logSecurityEvent(`Copy-paste attempt detected (Key: ${e.key})`);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setTabSwitchCount((prev) => prev + 1);
        const timestamp = new Date().toLocaleString();
        const logEntry = `Tab switch or focus loss (possible Snipping Tool/AI tool) detected at ${timestamp}`;
        setTabSwitchLog((prev) => [...prev, logEntry]);
        addNotification(
          "Warning: Switching tabs or applications is not allowed. This may indicate Snipping Tool or AI tool usage.",
          "warning",
        );
        logSecurityEvent(logEntry);

        if (
          lastFocusLossRef.current &&
          Date.now() - lastFocusLossRef.current < 5000
        ) {
          setSuspiciousActivity(true);
          addNotification(
            "Frequent tab switching detected. Snipping Tool and AI tool usage are prohibited.",
            "error",
          );
          logSecurityEvent(
            "Suspicious activity: Frequent tab switches (possible Snipping Tool/AI tool)",
          );
        }
        lastFocusLossRef.current = Date.now();
        setShowBlur(true);
      } else if (document.visibilityState === "visible") {
        setShowBlur(false);
      }
    };

    const handleSelectStart = (e) => {
      e.preventDefault();
      addNotification(
        "Text selection is disabled during the exam.",
        "warning",
      );
      logSecurityEvent("Text selection attempt detected");
    };

    const handleDragStart = (e) => {
      e.preventDefault();
      addNotification(
        "Dragging content is not allowed during the exam.",
        "warning",
      );
      logSecurityEvent("Drag attempt detected");
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, [isExamActive, addNotification, logSecurityEvent]);

  useEffect(() => {
    if (!isExamActive) return;

    let devToolsOpen = false;
    const checkDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          addNotification(
            "Developer tools detected. Please close them.",
            "error",
          );
          logSecurityEvent("Developer tools detected");
        }
      } else {
        devToolsOpen = false;
      }
    };

    const interval = setInterval(checkDevTools, 1000);
    return () => clearInterval(interval);
  }, [isExamActive, addNotification, logSecurityEvent]);

  useEffect(() => {
    if (!isExamActive) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isExamActive]);

  useEffect(() => {
    if (isExamActive && timeRemaining <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsExamActive(false);
      addNotification(
        "Time is up! Exam submitted automatically.",
        "warning",
      );
      setShowReport(true);
    }
  }, [timeRemaining, isExamActive, addNotification]);

  

  const loadQuestion = useCallback(
    async (examId, index) => {
      setShowLoading(true);
      setCurrentQuestionIndex(index);

      try {
        const response = await fetch(
          `${API_URL}?action=getExam&examId=${examId}&questionIndex=${index}`,
        );
        const data = await response.json();

        if (data.error) {
          setQuestionText(data.error);
          setPdfLink("");
          setResourceLink("");
          return;
        }

        setTotalQuestions(data.totalQuestions);
        setQuestionText(data.question);
        setPdfLink(data.pdf_link || "");
        setResourceLink(data.resource_link || "");
      } catch (error) {
        setQuestionText(`Error loading question: ${error.message}`);
        setPdfLink("");
        setResourceLink("");
        addNotification(
          "Failed to load question. Please check your connection.",
          "error",
        );
      } finally {
        setShowLoading(false);
      }
    },
    [addNotification],
  );

  const startExam = async () => {
    const id = examIdInput.trim();

    if (!id) {
      addNotification("Please enter an Exam ID", "warning");
      return;
    }

    if (id.length < 2) {
      addNotification("Please enter a valid Exam ID", "error");
      return;
    }

    setShowLoading(true);
    setCurrentExamId(id);
    setCurrentQuestionIndex(0);
    setTabSwitchCount(0);
    setTabSwitchLog([]);
    setSecurityEventLog([]);
    setSuspiciousActivity(false);
    setTimeRemaining(EXAM_DURATION);
    setTotalQuestions(0);
    setQuestionText("");
    setPdfLink("");
    setResourceLink("");
    setShowBlur(false);
    examStartTimeRef.current = new Date();
    setIsExamActive(true);

    try {
      await loadQuestion(id, 0);
      addNotification("Exam started successfully!", "success");
    } catch (error) {
      if (!isOnline) {
        addNotification("Starting in offline mode", "warning");
      } else {
        addNotification(
          "Failed to start exam. Please try again.",
          "error",
        );
      }
    } finally {
      setShowLoading(false);
    }
  };

  const handleNext = () => {
    const newIndex = currentQuestionIndex + 1;
    if (newIndex < totalQuestions) {
      loadQuestion(currentExamId, newIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    const newIndex = currentQuestionIndex - 1;
    if (newIndex >= 0) {
      loadQuestion(currentExamId, newIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFinish = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsExamActive(false);
    setShowBlur(false);
    setShowReport(true);
  };

  const handleRestart = () => {
    setIsExamActive(false);
    setShowReport(false);
    setCurrentExamId("");
    setExamIdInput("");
    setCurrentQuestionIndex(0);
    setTotalQuestions(0);
    setTimeRemaining(EXAM_DURATION);
    setQuestionText("");
    setPdfLink("");
    setResourceLink("");
    setShowBlur(false);
    setSuspiciousActivity(false);
    setTabSwitchCount(0);
    setTabSwitchLog([]);
    setSecurityEventLog([]);
    examStartTimeRef.current = null;
    lastFocusLossRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const syncWhenOnline = () => {
    if (isOnline) {
      addNotification("Connection restored!", "success");
    } else {
      addNotification(
        "Still offline. Please check your connection.",
        "warning",
      );
    }
  };

  const totalExamTime = examStartTimeRef.current
    ? Math.floor((Date.now() - examStartTimeRef.current.getTime()) / 1000)
    : 0;
  const examMinutes = Math.floor(totalExamTime / 60);
  const examSeconds = totalExamTime % 60;

  const timerDisplayClass = `timer-display${
    timeRemaining <= 600
      ? " danger"
      : timeRemaining <= 1200
        ? " warning"
        : ""
  }`;
  const timerBarClass = `timer-bar${
    timeRemaining <= 600
      ? " danger"
      : timeRemaining <= 1200
        ? " warning"
        : ""
  }`;
  const timerBarWidth = `${(timeRemaining / EXAM_DURATION) * 100}%`;
  const progressWidth = `${totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0}%`;

  const canShowPrev = currentQuestionIndex > 0;
  const canShowNext = currentQuestionIndex < totalQuestions - 1;

  return (
    <div className="exam-app" data-theme={theme}>
      {!isOnline && (
        <div className="offline-banner">
          <div className="offline-content">
            <i className="fas fa-wifi-slash" />
            <span>
              You're offline. Exam content may not load properly.
            </span>
            <button onClick={syncWhenOnline} className="sync-btn">
              <i className="fas fa-sync" /> Try to reconnect
            </button>
          </div>
        </div>
      )}

      <div className={`loading-overlay${showLoading ? " active" : ""}`}>
        <div className="loader">
          <div className="spinner" />
          <p>Loading exam...</p>
        </div>
      </div>

      <nav className="modern-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <i className="fas fa-graduation-cap" />
              <span>YHA Exam</span>
            </div>
            <div className="theme-toggle">
              <button
                id="themeToggle"
                className="theme-btn"
                onClick={toggleTheme}
              >
                <i className={theme === "light" ? "fas fa-moon" : "fas fa-sun"} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container main-container">
        {!isExamActive && (
          <div className="welcome-section">
            <div className="welcome-card">
              <div className="welcome-header">
                <i className="fas fa-clipboard-list welcome-icon" />
                <h1 className="welcome-title">Welcome to YHA Exam</h1>
                <p className="welcome-subtitle">
                  Enter your exam ID to begin your Exam
                </p>
              </div>

              <div className="exam-input-section">
                <div className="input-group-modern">
                  <div className="input-wrapper">
                    <i className="fas fa-key input-icon" />
                    <input
                      type="text"
                      className="form-control-modern"
                      placeholder="Enter Exam ID (e.g., E1)"
                      autoComplete="off"
                      value={examIdInput}
                      onChange={(e) => setExamIdInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && startExam()}
                    />
                  </div>
                  <button
                    className="btn-modern btn-primary"
                    style={{
                      opacity: examIdInput.trim().length > 0 ? 1 : 0.6,
                      pointerEvents:
                        examIdInput.trim().length > 0 ? "auto" : "none",
                    }}
                    onClick={startExam}
                  >
                    <span className="btn-text">Start Exam</span>
                    <i className="fas fa-arrow-right btn-icon text-light" />
                  </button>
                </div>
              </div>

              <div className="exam-features">
                <div className="feature-item">
                  <i className="fas fa-shield-alt" />
                  <span>Secure Environment</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-clock" />
                  <span>Timed Assessment</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-file" />
                  <span>Resources</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isExamActive && (
          <div
            className="exam-section"
            ref={examSectionRef}
            style={{
              filter: showBlur ? "blur(8px)" : "none",
              pointerEvents: showBlur ? "none" : "auto",
            }}
          >
            <div className="progress-section">
              <div className="progress-info">
                <span className="progress-text">
                  Question <span>{currentQuestionIndex + 1}</span> of{" "}
                  <span>{totalQuestions}</span>
                </span>
                <div className="timer-section">
                  <div className={timerDisplayClass}>
                    <i className="fas fa-clock" />
                    <span id="timerText">{formatTime(timeRemaining)}</span>
                  </div>
                </div>
                <span className="exam-id-display">
                  Exam ID: <span>{currentExamId}</span>
                </span>
              </div>
              <div className="progress-bar-modern">
                <div
                  className="progress-fill"
                  style={{ width: progressWidth }}
                />
              </div>
              <div className="timer-bar-container">
                <div
                  className={timerBarClass}
                  style={{ width: timerBarWidth }}
                />
              </div>
            </div>

            <div className="question-card">
              <div className="question-header">
                <h2 className="question-title">
                  <i className="fas fa-question-circle" />
                  Question {currentQuestionIndex + 1}
                </h2>
              </div>
              <div className="question-content">
                {questionText ? (
                  <>
                    <h3>Question {currentQuestionIndex + 1}</h3>
                    <p>{questionText}</p>
                  </>
                ) : (
                  <div className="question-loading">
                    Loading question...
                  </div>
                )}
              </div>
            </div>

            {pdfLink && isGithubOrDriveLink(pdfLink) && (
              <div className="pdf-card">
                <div className="card-header">
                  <h3>
                    <i className="fas fa-file-pdf" /> Reference Material
                  </h3>
                </div>
                <div className="pdf-viewer">
                  <iframe
                    src={getPdfEmbedUrl(pdfLink)}
                    title="Reference Material PDF"
                    className="pdf-iframe"
                    frameBorder="0"
                  />
                </div>
              </div>
            )}

            {resourceLink && isGithubOrDriveLink(resourceLink) && (
              <div className="resources-section">
                <div className="resources-card">
                  <h3>
                    <i className="fas fa-download" /> Additional Resources
                  </h3>
                  <a
                    id="resourceDownload"
                    className="btn-download"
                    href={resourceLink}
                  >
                    <i className="fas fa-file-download" />
                    Download Resource
                  </a>
                </div>
              </div>
            )}

            <div className="navigation-section">
              {canShowPrev && (
                <button
                  id="prevBtn"
                  className="btn-nav btn-secondary"
                  onClick={handlePrev}
                >
                  <i className="fas fa-chevron-left" />
                  Previous
                </button>
              )}
              {canShowNext ? (
                <button
                  id="nextBtn"
                  className="btn-nav btn-primary"
                  onClick={handleNext}
                >
                  Next
                  <i className="fas fa-chevron-right" />
                </button>
              ) : (
                <button
                  id="finishBtn"
                  className="btn-nav btn-success"
                  onClick={handleFinish}
                >
                  <i className="fas fa-check" />
                  Finish Exam
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="notification-container">
        {notifications.map((toast) => (
          <NotificationToast
            key={toast.id}
            notification={toast}
            onRemove={removeNotification}
          />
        ))}
      </div>

      {showReport && (
        <div className="modal show" id="examReportModal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modern-modal">
              <div
                className="modal-header"
                style={{
                  background: "var(--success-gradient)",
                  color: "white",
                }}
              >
                <i
                  className="fas fa-check-circle"
                  style={{ fontSize: "1.5rem", marginRight: "0.5rem" }}
                />
                <h5 className="modal-title">Exam Completed</h5>
              </div>
              <div className="modal-body">
                <p>
                  Congratulations! You have successfully completed the exam.
                </p>
                {suspiciousActivity && (
                  <p className="text-danger">
                    Warning: Suspicious activity detected (possible
                    Snipping Tool or AI tool usage).
                  </p>
                )}
                <div className="exam-summary">
                  <div className="summary-item">
                    <span className="label">Exam ID:</span>
                    <span className="value">{currentExamId}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Total Questions:</span>
                    <span className="value">{totalQuestions}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Total Time:</span>
                    <span className="value">
                      {examMinutes}m {examSeconds}s
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Tab Switches Detected:</span>
                    <span className="value">{tabSwitchCount}</span>
                  </div>
                  {tabSwitchLog.length > 0 && (
                    <div className="summary-item">
                      <span className="label">Tab Switch Log:</span>
                      <div className="value">
                        {tabSwitchLog.map((log, i) => (
                          <div key={i}>{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {securityEventLog.length > 0 && (
                    <div className="summary-item">
                      <span className="label">Security Events:</span>
                      <div className="value">
                        {securityEventLog.map((log, i) => (
                          <div key={i}>{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modern btn-primary"
                  onClick={handleRestart}
                >
                  Take Another Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
