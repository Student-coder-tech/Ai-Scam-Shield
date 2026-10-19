import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Link2,
  QrCode,
  Mic,
  MicOff,
  Upload,
  Camera,
  CameraOff,
  Trash2,
  AlertCircle,
  Loader2,
  FileAudio,
  Shield,
} from 'lucide-react';
import { ScannerMode, ScanResult, Language } from '../types';
import { translations } from '../translations';
import { api } from '../services/api';
import { readQrFromFile, readQrFromVideoFrame } from '../utils/qrReader';
import { RiskScoreCard } from './RiskScoreCard';

interface ScannerSectionProps {
  language: Language;
  onScanCompleted: (result: ScanResult) => void;
  onReportFalsePositive: (result: ScanResult) => void;
  resetKey?: number;
}

export const ScannerSection: React.FC<ScannerSectionProps> = ({
  language,
  onScanCompleted,
  onReportFalsePositive,
  resetKey,
}) => {
  const [activeTab, setActiveTab] = useState<ScannerMode>('message');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);

  // Track the active scan so we can cancel it when the user switches tabs.
  const activeScanRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Tab 1: Message state
  const [messageText, setMessageText] = useState('');

  // Tab 2: URL state
  const [urlInput, setUrlInput] = useState('');

  // Tab 3: QR state
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [qrExtractedText, setQrExtractedText] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraIntervalRef = useRef<number | null>(null);

  // Tab 4: Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<number | null>(null);

  const resultRef = useRef<HTMLDivElement | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement | null>(null);
  const t = translations[language];

  // Handle external resetKey trigger (e.g. from "New Scan" in TopHeader)
  useEffect(() => {
    if (resetKey && resetKey > 0) {
      setCurrentResult(null);
      setMessageText('');
      setUrlInput('');
      setQrFile(null);
      setQrPreviewUrl(null);
      setAudioFile(null);
      setError(null);
      scannerContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [resetKey]);

  // Cleanup camera stream
  const stopCameraStream = () => {
    if (cameraIntervalRef.current) {
      window.clearInterval(cameraIntervalRef.current);
      cameraIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
      if (recordIntervalRef.current) {
        window.clearInterval(recordIntervalRef.current);
      }
    };
  }, []);

  const handleStartCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);

      // Frame inspection loop
      cameraIntervalRef.current = window.setInterval(() => {
        if (videoRef.current) {
          const payload = readQrFromVideoFrame(videoRef.current);
          if (payload) {
            setQrExtractedText(payload);
            stopCameraStream();
            handleAnalyzeQr(payload);
          }
        }
      }, 500);
    } catch (err) {
      setError('Camera access denied or not available. You can upload a QR image instead.');
    }
  };

  // QR File selection
  const handleQrFileSelected = async (file: File) => {
    setError(null);
    setQrFile(file);
    const objectUrl = URL.createObjectURL(file);
    setQrPreviewUrl(objectUrl);

    try {
      setLoading(true);
      setLoadingStep('Extracting QR code pixels from image...');
      const payload = await readQrFromFile(file);
      setQrExtractedText(payload);
      setLoading(false);
      handleAnalyzeQr(payload);
    } catch (err: unknown) {
      setLoading(false);
      const errMsg = err instanceof Error ? err.message : 'Could not decode QR code';
      setError(errMsg);
    }
  };

  // Recording handler
  const handleToggleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (recordIntervalRef.current) {
        window.clearInterval(recordIntervalRef.current);
      }
      setIsRecording(false);
    } else {
      try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach((track) => track.stop());

          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            handleAnalyzeAudio({
              audioBase64: base64Data,
              mimeType: 'audio/webm',
            });
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingDuration(0);
        recordIntervalRef.current = window.setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        setError('Microphone permission denied or not supported. You can upload an audio file or test sample voice calls.');
      }
    }
  };

  // API Call Handlers
  const handleAnalyzeMessage = async (customText?: string) => {
    const textToScan = customText !== undefined ? customText : messageText;
    if (!textToScan.trim()) {
      setError('Please paste or type a message to analyze.');
      return;
    }

    const scanToken = { cancelled: false };
    activeScanRef.current = scanToken;

    try {
      setError(null);
      setLoading(true);
      setLoadingStep(t.scanner.message.analyzing);
      const result = await api.analyzeMessage(textToScan, language);
      if (scanToken.cancelled) return;
      setCurrentResult(result);
      onScanCompleted(result);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      if (scanToken.cancelled) return;
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
    } finally {
      if (!scanToken.cancelled) setLoading(false);
    }
  };

  const handleAnalyzeUrl = async (customUrl?: string) => {
    const urlToScan = customUrl !== undefined ? customUrl : urlInput;
    if (!urlToScan.trim()) {
      setError('Please enter a website link to analyze.');
      return;
    }

    const scanToken = { cancelled: false };
    activeScanRef.current = scanToken;

    try {
      setError(null);
      setLoading(true);
      setLoadingStep(t.scanner.url.analyzing);
      const result = await api.analyzeUrl(urlToScan, language);
      if (scanToken.cancelled) return;
      setCurrentResult(result);
      onScanCompleted(result);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      if (scanToken.cancelled) return;
      const msg = err instanceof Error ? err.message : 'URL analysis failed';
      setError(msg);
    } finally {
      if (!scanToken.cancelled) setLoading(false);
    }
  };

  const handleAnalyzeQr = async (payloadToScan: string) => {
    if (!payloadToScan.trim()) {
      setError('No QR code payload detected.');
      return;
    }

    const scanToken = { cancelled: false };
    activeScanRef.current = scanToken;

    try {
      setError(null);
      setLoading(true);
      setLoadingStep(t.scanner.qr.analyzing);
      const result = await api.analyzeQr(payloadToScan, language);
      if (scanToken.cancelled) return;
      setCurrentResult(result);
      onScanCompleted(result);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      if (scanToken.cancelled) return;
      const msg = err instanceof Error ? err.message : 'QR analysis failed';
      setError(msg);
    } finally {
      if (!scanToken.cancelled) setLoading(false);
    }
  };

  const handleAnalyzeAudio = async (payload: {
    audioBase64?: string;
    transcriptText?: string;
    mimeType?: string;
  }) => {
    const scanToken = { cancelled: false };
    activeScanRef.current = scanToken;

    try {
      setError(null);
      setLoading(true);
      setLoadingStep(t.scanner.audio.analyzing);
      const result = await api.analyzeAudio(payload, language);
      if (scanToken.cancelled) return;
      setCurrentResult(result);
      onScanCompleted(result);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      if (scanToken.cancelled) return;
      const msg = err instanceof Error ? err.message : 'Audio analysis failed';
      setError(msg);
    } finally {
      if (!scanToken.cancelled) setLoading(false);
    }
  };

  // Sample Scenarios
  const sampleMessages = [
    {
      label: t.scanner.message.sample1,
      text: 'Dear SBI Customer, your bank account will be blocked today by 8:00 PM due to pending PAN KYC. Click http://sbi-pan-kyc-verify.shop/login to update immediately.',
    },
    {
      label: t.scanner.message.sample2,
      text: 'URGENT NOTICE: Dear Consumer, your power supply will be disconnected tonight at 9:30 PM from the electricity board because your bill was not updated. Immediately call officer Sharma on 9876543210.',
    },
    {
      label: t.scanner.message.sample3,
      text: 'Hello! You are selected for online part-time job. Work 15 mins a day by liking YouTube videos and rating hotels on Google Maps. Earn ₹2,500 - ₹5,000 daily. WhatsApp +84928172910 to receive ₹200 joining bonus.',
    },
    {
      label: t.scanner.message.sampleSafe,
      text: 'Your order #IND-90823 from Amazon has been dispatched with delivery agent Rahul (OTP 4812). Track your parcel inside the Amazon mobile app.',
    },
  ];

  const sampleUrls = [
    {
      label: 'Bank KYC Phishing Link',
      url: 'http://sbi-pan-kyc-verify.shop/login',
    },
    {
      label: 'Free Gift Spin-Wheel Link',
      url: 'http://spin-and-win-iphone15-cashback.xyz/claim',
    },
    {
      label: 'Legitimate Bank Domain',
      url: 'https://www.onlinesbi.sbi',
    },
  ];

  const sampleQrs = [
    {
      label: 'Scan to Receive Money Trap (Debits ₹4,999)',
      payload: 'upi://pay?pa=cashbackloot@ybl&pn=PhonePeCashback&am=4999&tn=Enter+PIN+to+receive+cashback',
    },
    {
      label: 'Electricity Bill to Personal UPI Spoof',
      payload: 'upi://pay?pa=raju9921@okicici&pn=MahavitaranElectricityOffice&am=650&tn=UrgentBillClearance',
    },
    {
      label: 'Legitimate Grocery Store QR',
      payload: 'upi://pay?pa=freshmart.grocery@icici&pn=FreshMartStore&cu=INR',
    },
  ];

  const sampleAudios = [
    {
      label: 'Digital Arrest / Police Impersonation',
      transcript:
        'This is Inspector Sharma from Mumbai Cyber Crime Branch. A DHL courier sent from Mumbai to Cambodia under your Aadhaar number contains fake passports and 150 grams of MDMA narcotics. A non-bailable warrant has been issued. Do not disconnect this Skype call or police will raid your house within 20 minutes. You must immediately transfer ₹50,000 to the official RBI security verification escrow account to verify your innocence.',
    },
    {
      label: 'Bank Manager Asking for OTP',
      transcript:
        'Hello sir, I am calling from HDFC Bank Card Security Cell. We noticed an unauthorized debit of ₹24,999 on your debit card ending in 4021. To block this transaction immediately and reverse the funds, please tell me the 6-digit OTP just sent to your phone number.',
    },
    {
      label: 'Legitimate Clinic Appointment Call',
      transcript:
        'Hello Mr. Verma, this is Dr. Rao\'s clinic calling to confirm your routine dental checkup scheduled for tomorrow at 4:30 PM. Please bring your appointment card.',
    },
  ];

  return (
    <section
      id="scanner"
      ref={scannerContainerRef}
      className="py-12 bg-slate-50/50 dark:bg-[#0B1220] border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors duration-200"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>AI FRAUD DEFENSE ENGINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t.scanner.title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
            {t.scanner.subtitle}
          </p>
        </div>

        {/* 4 Mode Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-[#111C30] border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setActiveTab('message');
              setError(null);
              // Cancel any in-progress scan when switching tabs
              activeScanRef.current = { cancelled: true };
              setLoading(false);
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all cursor-pointer ${
              activeTab === 'message'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs font-semibold border border-slate-200/80 dark:border-transparent'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 mb-1" />
            <span className="text-xs sm:text-sm font-semibold">{t.scanner.tabs.message}</span>
            <span className="text-[10px] opacity-75 hidden sm:block mt-0.5">
              {t.scanner.tabs.messageDesc}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('url');
              setError(null);
              activeScanRef.current = { cancelled: true };
              setLoading(false);
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs font-semibold border border-slate-200/80 dark:border-transparent'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Link2 className="w-4 h-4 mb-1" />
            <span className="text-xs sm:text-sm font-semibold">{t.scanner.tabs.url}</span>
            <span className="text-[10px] opacity-75 hidden sm:block mt-0.5">
              {t.scanner.tabs.urlDesc}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('qr');
              setError(null);
              activeScanRef.current = { cancelled: true };
              setLoading(false);
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs font-semibold border border-slate-200/80 dark:border-transparent'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-4 h-4 mb-1" />
            <span className="text-xs sm:text-sm font-semibold">{t.scanner.tabs.qr}</span>
            <span className="text-[10px] opacity-75 hidden sm:block mt-0.5">
              {t.scanner.tabs.qrDesc}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('audio');
              setError(null);
              activeScanRef.current = { cancelled: true };
              setLoading(false);
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs font-semibold border border-slate-200/80 dark:border-transparent'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Mic className="w-4 h-4 mb-1" />
            <span className="text-xs sm:text-sm font-semibold">{t.scanner.tabs.audio}</span>
            <span className="text-[10px] opacity-75 hidden sm:block mt-0.5">
              {t.scanner.tabs.audioDesc}
            </span>
          </button>
        </div>

        {/* Scanner Card Container */}
        <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-xl relative transition-colors duration-200">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Attention Needed</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* TAB 1: MESSAGE SCANNER */}
          {activeTab === 'message' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Paste SMS, WhatsApp, Telegram or Email content</span>
                  <span>{messageText.length} / 5000 {t.scanner.message.chars}</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={5}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={t.scanner.message.placeholder}
                    className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700/90 rounded-xl p-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-y"
                  />
                  {messageText.length > 0 && (
                    <button
                      onClick={() => setMessageText('')}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs transition-colors"
                      title={t.scanner.message.clear}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sample Presets */}
              <div className="space-y-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t.scanner.message.trySamples}
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleMessages.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMessageText(sample.text);
                        handleAnalyzeMessage(sample.text);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#0B1220] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  disabled={loading || !messageText.trim()}
                  onClick={() => handleAnalyzeMessage()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{loadingStep || t.scanner.message.analyzing}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>{t.scanner.message.analyze}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LINK SCANNER */}
          {activeTab === 'url' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
                  {t.scanner.url.label}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={t.scanner.url.placeholder}
                    className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700/90 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  {urlInput.length > 0 && (
                    <button
                      onClick={() => setUrlInput('')}
                      className="absolute right-3 top-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-teal-600 dark:text-teal-400/90 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  {t.scanner.url.ssrfNotice}
                </p>
              </div>

              {/* Sample Links */}
              <div className="space-y-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t.scanner.url.trySamples}
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleUrls.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setUrlInput(sample.url);
                        handleAnalyzeUrl(sample.url);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#0B1220] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  disabled={loading || !urlInput.trim()}
                  onClick={() => handleAnalyzeUrl()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{loadingStep || t.scanner.url.analyzing}</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>{t.scanner.url.analyze}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: QR CODE & UPI SCANNER */}
          {activeTab === 'qr' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.scanner.qr.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.scanner.qr.upiDisclaimer}</p>
                  </div>

                  {/* Camera Toggle */}
                  <div className="flex gap-2 shrink-0">
                    {isCameraActive ? (
                      <button
                        onClick={stopCameraStream}
                        className="px-3.5 py-2 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-600/20 dark:hover:bg-red-600/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <CameraOff className="w-4 h-4" />
                        <span>{t.scanner.qr.stopCamera}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStartCamera}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{t.scanner.qr.cameraBtn}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Camera View */}
                {isCameraActive && (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-md mx-auto border-2 border-teal-500/40">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-2 border-teal-400/50 m-8 rounded-lg pointer-events-none animate-pulse flex items-center justify-center">
                      <span className="text-[11px] bg-black/70 px-2.5 py-1 rounded text-teal-300 font-medium">
                        Align QR code inside box
                      </span>
                    </div>
                  </div>
                )}

                {/* Upload File Zone */}
                {!isCameraActive && (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-blue-500/60 rounded-xl p-8 text-center transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.scanner.qr.dragDrop}</p>
                    <label className="mt-3 inline-block px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer transition-colors">
                      <span>{t.scanner.qr.browse}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleQrFileSelected(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {qrPreviewUrl && (
                      <div className="mt-4 flex flex-col items-center">
                        <img
                          src={qrPreviewUrl}
                          alt="Uploaded QR"
                          className="w-24 h-24 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                        />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Image loaded</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sample QR Presets */}
              <div className="space-y-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t.scanner.qr.sampleQrBtn}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleQrs.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQrExtractedText(sample.payload);
                        handleAnalyzeQr(sample.payload);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#0B1220] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VOICE CALL AUDIO ANALYZER */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.scanner.audio.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.scanner.audio.audioDisclaimer}
                    </p>
                  </div>

                  {/* Microphone Record Button */}
                  <div className="flex items-center gap-3">
                    {isRecording && (
                      <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-mono font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        {Math.floor(recordingDuration / 60)}:
                        {(recordingDuration % 60).toString().padStart(2, '0')}
                      </span>
                    )}

                    <button
                      onClick={handleToggleRecord}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isRecording
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          <span>{t.scanner.audio.stopRecord}</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span>{t.scanner.audio.startRecord}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Upload File Zone */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700/80 rounded-xl p-6 text-center">
                  <FileAudio className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 dark:text-slate-300">{t.scanner.audio.dragDrop}</p>
                  <label className="mt-3 inline-block px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer transition-colors">
                    <span>Choose Audio File</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setAudioFile(file);
                          const reader = new FileReader();
                          reader.readAsDataURL(file);
                          reader.onloadend = () => {
                            const base64Data = (reader.result as string).split(',')[1];
                            handleAnalyzeAudio({
                              audioBase64: base64Data,
                              mimeType: file.type || 'audio/mp3',
                            });
                          };
                        }
                      }}
                    />
                  </label>
                  {audioFile && (
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-2 font-mono">
                      Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>

              {/* Sample Call Scenarios */}
              <div className="space-y-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t.scanner.audio.sampleAudioBtn}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleAudios.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleAnalyzeAudio({ transcriptText: sample.transcript });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#0B1220] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Anchor */}
        <div ref={resultRef} className="pt-2">
          {currentResult && (
            <RiskScoreCard
              result={currentResult}
              language={language}
              onNewScan={() => {
                setCurrentResult(null);
                setMessageText('');
                setUrlInput('');
                setQrFile(null);
                setQrPreviewUrl(null);
                setAudioFile(null);
              }}
              onReportFalsePositive={() => onReportFalsePositive(currentResult)}
            />
          )}
        </div>
      </div>
    </section>
  );
};
