import { Language } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  mission: string;
  nav: {
    home: string;
    scan: string;
    howItWorks: string;
    learn: string;
    about: string;
    reports: string;
    scanNow: string;
    history: string;
  };
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trust1: string;
    trust1Desc: string;
    trust2: string;
    trust2Desc: string;
    trust3: string;
    trust3Desc: string;
    liveDemoBadge: string;
    sampleMessage: string;
    riskScore: string;
    highRisk: string;
    demoNote: string;
  };
  scanner: {
    title: string;
    subtitle: string;
    tabs: {
      message: string;
      messageDesc: string;
      url: string;
      urlDesc: string;
      qr: string;
      qrDesc: string;
      audio: string;
      audioDesc: string;
    };
    message: {
      placeholder: string;
      chars: string;
      clear: string;
      analyze: string;
      analyzing: string;
      trySamples: string;
      sample1: string;
      sample2: string;
      sample3: string;
      sampleSafe: string;
    };
    url: {
      label: string;
      placeholder: string;
      analyze: string;
      analyzing: string;
      trySamples: string;
      ssrfNotice: string;
    };
    qr: {
      title: string;
      dragDrop: string;
      browse: string;
      cameraBtn: string;
      stopCamera: string;
      sampleQrBtn: string;
      upiDisclaimer: string;
      analyzing: string;
    };
    audio: {
      title: string;
      dragDrop: string;
      orRecord: string;
      startRecord: string;
      stopRecord: string;
      sampleAudioBtn: string;
      audioDisclaimer: string;
      analyzing: string;
    };
  };
  results: {
    title: string;
    scoreLabel: string;
    verdictSafe: string;
    verdictSuspicious: string;
    verdictScam: string;
    confidence: string;
    evidenceHeading: string;
    actionsHeading: string;
    technicalDetails: string;
    listenExplanation: string;
    listening: string;
    stopListening: string;
    copyReport: string;
    copied: string;
    newScan: string;
    reportFalsePositive: string;
    safetyDisclaimer: string;
    enginesUsed: string;
  };
  howItWorks: {
    badge: string;
    title: string;
    subtitle: string;
    steps: {
      step1Title: string;
      step1Desc: string;
      step2Title: string;
      step2Desc: string;
      step3Title: string;
      step3Desc: string;
      step4Title: string;
      step4Desc: string;
    };
  };
  audience: {
    badge: string;
    title: string;
    subtitle: string;
    seniorsTitle: string;
    seniorsDesc: string;
    upiTitle: string;
    upiDesc: string;
    studentsTitle: string;
    studentsDesc: string;
    businessTitle: string;
    businessDesc: string;
  };
  learn: {
    badge: string;
    title: string;
    subtitle: string;
    quizBadge: string;
    quizTitle: string;
    quizSubtitle: string;
    quizScore: string;
    checkAnswer: string;
    nextQuestion: string;
    restartQuiz: string;
  };
  reports: {
    title: string;
    subtitle: string;
    submitBtn: string;
    categoryLabel: string;
    excerptLabel: string;
    descLabel: string;
    consentLabel: string;
    submitting: string;
    successMsg: string;
    recentHeading: string;
  };
  footer: {
    tagline: string;
    disclaimer: string;
    rights: string;
    privacy: string;
    terms: string;
    emergencyHelpline: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'AI Scam Shield',
    tagline: 'Detect the Scam. Protect Your Money.',
    mission: 'Empowering everyday digital citizens with AI-driven protection against SMS, UPI, QR, URL, and voice call fraud.',
    nav: {
      home: 'Home',
      scan: 'Scan a Scam',
      howItWorks: 'How It Works',
      learn: 'Learn & Stay Safe',
      about: 'About',
      reports: 'Community Reports',
      scanNow: 'Scan Now',
      history: 'History',
    },
    hero: {
      badge: 'Certified Digital Fraud Prevention',
      headline: 'One Click Before You Pay. One Step Ahead of Scammers.',
      subheadline: 'Scan suspicious messages, links, QR codes, and call recordings. Understand the risks in seconds with AI-powered protection in English, Hindi, and Marathi.',
      ctaPrimary: 'Check for Scams',
      ctaSecondary: 'Explore How It Works',
      trust1: 'Multi-Channel Detection',
      trust1Desc: 'Analyzes SMS, WhatsApp, UPI QR, URLs & Voice',
      trust2: 'Simple Language',
      trust2Desc: 'No technical jargon, crystal-clear warnings',
      trust3: 'Privacy-First Architecture',
      trust3Desc: 'No sensitive credentials or banking PINs stored',
      liveDemoBadge: 'Interactive Threat Preview',
      sampleMessage: 'Urgent: SBI electricity bill unpaid! Power will be disconnected tonight at 9:30 PM. Call officer 9876543210 immediately.',
      riskScore: '92 / 100',
      highRisk: 'High Risk Scam Detected',
      demoNote: 'Sample threat analysis demonstration. Real-time scoring uses AI & rule validation.',
    },
    scanner: {
      title: 'What Would You Like to Check Today?',
      subtitle: 'Paste any text, link, QR code, or voice note below for instant security evaluation.',
      tabs: {
        message: 'Message / SMS',
        messageDesc: 'SMS, WhatsApp, Email, Telegram',
        url: 'Suspicious Link',
        urlDesc: 'Web addresses, short links, banking portals',
        qr: 'QR Code & UPI',
        qrDesc: 'Scan-to-pay QR, payment requests, VPA checks',
        audio: 'Voice Call',
        audioDesc: 'Recorded calls, voice notes, digital arrest audio',
      },
      message: {
        placeholder: 'Paste the suspicious SMS, WhatsApp message, email, or offer here...\n\nExample: "Dear customer, your bank account will be blocked today due to pending KYC. Click http://sbi-kyc-verify.xyz to update now."',
        chars: 'characters',
        clear: 'Clear',
        analyze: 'Analyze Message',
        analyzing: 'Analyzing text against fraud patterns...',
        trySamples: 'Try realistic scam examples:',
        sample1: 'Bank KYC Block Alert',
        sample2: 'Electricity Cutoff Threat',
        sample3: 'Part-Time Work from Home Scam',
        sampleSafe: 'Legitimate Delivery Notification',
      },
      url: {
        label: 'Enter full web address or link',
        placeholder: 'https://example-banking-update.xyz/login',
        analyze: 'Analyze Link',
        analyzing: 'Inspecting domain, SSL, redirects, and threat reputation...',
        trySamples: 'Try sample links:',
        ssrfNotice: 'Protected: Safe sandbox inspection prevents harmful internal redirects.',
      },
      qr: {
        title: 'Upload QR Image or Use Device Camera',
        dragDrop: 'Drag and drop your QR code image here, or',
        browse: 'Browse Image',
        cameraBtn: 'Scan with Camera',
        stopCamera: 'Stop Camera',
        sampleQrBtn: 'Load Sample UPI Scams',
        upiDisclaimer: 'Security Notice: AI Scam Shield never prompts for UPI PIN or banking passwords. Scanning a QR code only sends money, never receives money.',
        analyzing: 'Extracting QR payload and verifying UPI intent...',
      },
      audio: {
        title: 'Upload Audio Recording or Record Call',
        dragDrop: 'Drop audio file here (MP3, WAV, M4A, WEBM, max 15MB)',
        orRecord: 'or record directly with microphone:',
        startRecord: 'Start Mic Recording',
        stopRecord: 'Stop & Analyze Recording',
        sampleAudioBtn: 'Try Sample Call Transcripts',
        audioDisclaimer: 'Privacy Notice: Audio is processed in memory for scam indicators and discarded immediately. We do not store private call recordings.',
        analyzing: 'Transcribing speech and detecting psychological pressure tactics...',
      },
    },
    results: {
      title: 'Scam Risk Assessment',
      scoreLabel: 'Risk Score',
      verdictSafe: 'Likely Safe / Legitimate',
      verdictSuspicious: 'Suspicious / Proceed with Caution',
      verdictScam: 'High Risk Scam Alert',
      confidence: 'Confidence',
      evidenceHeading: 'Why This Was Flagged (Evidence & Indicators)',
      actionsHeading: 'What You Should Do (Protective Steps)',
      technicalDetails: 'Technical Intelligence Details',
      listenExplanation: 'Listen to Explanation',
      listening: 'Playing Audio Explanation...',
      stopListening: 'Stop Listening',
      copyReport: 'Copy Report',
      copied: 'Report Copied to Clipboard!',
      newScan: 'Start New Scan',
      reportFalsePositive: 'Report Discrepancy',
      safetyDisclaimer: 'Notice: Automated AI assessments are advisory. A low-risk result is not a guarantee of safety. Never share your OTP, UPI PIN, or bank passwords with anyone.',
      enginesUsed: 'Engines Analyzed',
    },
    howItWorks: {
      badge: 'Defensive Architecture',
      title: 'How AI Scam Shield Protects You in 4 Steps',
      subtitle: 'Combining deterministic rule engines, Indian fraud heuristics, domain intelligence, and deep AI semantic reasoning.',
      steps: {
        step1Title: '1. Multi-Modal Input',
        step1Desc: 'Submit suspect text, URLs, UPI QR images, or voice call recordings directly.',
        step2Title: '2. Multi-Layer Detection',
        step2Desc: 'Deterministic rules catch known tactics; AI evaluates psychological urgency & intent.',
        step3Title: '3. Calibrated Scoring',
        step3Desc: 'Signals merge into an objective 0–100 risk score with clear uncertainty boundaries.',
        step4Title: '4. Plain-Language Guidance',
        step4Desc: 'Receive actionable next steps in English, Hindi, or Marathi with voice narration.',
      },
    },
    audience: {
      badge: 'Inclusive Digital Safety',
      title: 'Built for Everyone, Not Just Tech Experts',
      subtitle: 'Scammers target the most vulnerable. Our interface is designed for high legibility, zero confusing jargon, and clear safety advice.',
      seniorsTitle: 'Senior Citizens',
      seniorsDesc: 'Protected from fear-inducing calls claiming electricity disconnections, pension lapses, or digital arrest warrants.',
      upiTitle: 'First-Time UPI Users',
      upiDesc: 'Clear warnings against the common "Scan QR / enter PIN to receive money" cashback trick.',
      studentsTitle: 'Students & Job Seekers',
      studentsDesc: 'Flags fake part-time Telegram review tasks, YouTube like-job offers, and college loan phishing.',
      businessTitle: 'Small Business Merchants',
      businessDesc: 'Verifies fake payment screenshot notifications and tampered merchant QR codes.',
    },
    learn: {
      badge: 'Cybersecurity Education',
      title: 'Learn Common Digital Traps',
      subtitle: 'Read simple case studies and take our interactive quiz to sharpen your scam detection skills.',
      quizBadge: 'Interactive Practice',
      quizTitle: 'Spot the Scam Challenge',
      quizSubtitle: 'Test your instincts with 5 realistic digital payment and message scenarios.',
      quizScore: 'Your Score',
      checkAnswer: 'Check Answer',
      nextQuestion: 'Next Scenario',
      restartQuiz: 'Try Again',
    },
    reports: {
      title: 'Community Scam Reporting',
      subtitle: 'Help protect fellow citizens by reporting emerging fraud patterns. Submissions are anonymized and reviewed.',
      submitBtn: 'Submit Scam Report',
      categoryLabel: 'Scam Type / Category',
      excerptLabel: 'Message Excerpt, Domain or UPI ID (Do not include private personal info)',
      descLabel: 'Brief Description of What Happened',
      consentLabel: 'I consent to sharing this anonymized threat pattern to alert the community.',
      submitting: 'Submitting report...',
      successMsg: 'Report submitted successfully! Thank you for keeping others safe.',
      recentHeading: 'Recent Anonymized Community Alerts',
    },
    footer: {
      tagline: 'Detect the Scam. Protect Your Money.',
      disclaimer: 'AI Scam Shield provides automated risk assessments and educational guidance. Results may be incomplete or incorrect. A low-risk result does not guarantee safety. Always verify payment requests independently and never share your OTP or UPI PIN.',
      rights: 'All rights reserved. Dedicated to digital citizen safety across India.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Use',
      emergencyHelpline: 'National Cyber Crime Helpline: Dial 1930 (cybercrime.gov.in)',
    },
  },
  hi: {
    appName: 'AI स्कैम शील्ड',
    tagline: 'धोखाधड़ी पहचानें। अपना पैसा बचाएं।',
    mission: 'संदेश, UPI, QR कोड, लिंक और कॉल में होने वाले डिजिटल फ्रॉड से हर नागरिक को AI से सुरक्षा।',
    nav: {
      home: 'होम',
      scan: 'स्कैम जांचें',
      howItWorks: 'यह कैसे काम करता है',
      learn: 'सीखें और सुरक्षित रहें',
      about: 'हमारे बारे में',
      reports: 'कम्युनिटी रिपोर्ट',
      scanNow: 'अभी जांचें',
      history: 'इतिहास',
    },
    hero: {
      badge: 'प्रमाणित डिजिटल धोखाधड़ी सुरक्षा',
      headline: 'पैसे भेजने से पहले एक क्लिक। धोखेबाजों से एक कदम आगे।',
      subheadline: 'संदिग्ध संदेश, लिंक, QR कोड और कॉल रिकॉर्डिंग की तुरंत जांच करें। हिंदी, मराठी और अंग्रेजी में आसान शब्दों में खतरा समझें।',
      ctaPrimary: 'स्कैम की जांच करें',
      ctaSecondary: 'जानें कैसे काम करता है',
      trust1: 'मल्टी-चैनल जांच',
      trust1Desc: 'SMS, व्हाट्सएप, UPI QR, लिंक और वॉयस कॉल की पड़ताल',
      trust2: 'सरल भाषा में समझें',
      trust2Desc: 'बिना किसी तकनीकी उलझन के स्पष्ट चेतावनी',
      trust3: 'गोपनीयता सर्वप्रथम',
      trust3Desc: 'आपका पासवर्ड या बैंक पिन कभी भी सेव नहीं होता',
      liveDemoBadge: 'लाइव थ्रेट डेमो',
      sampleMessage: 'जरूरी सूचना: आपका बिजली बिल बकाया है! आज रात 9:30 बजे बिजली काट दी जाएगी। तुरंत अधिकारी 9876543210 पर कॉल करें।',
      riskScore: '92 / 100',
      highRisk: 'गंभीर स्कैम का खतरा',
      demoNote: 'नमूना विश्लेषण डेमो। वास्तविक जांच AI और साइबर सुरक्षा नियमों पर आधारित है।',
    },
    scanner: {
      title: 'आज आप किस चीज़ की जांच करना चाहते हैं?',
      subtitle: 'तुरंत सुरक्षा रिपोर्ट पाने के लिए नीचे कोई भी संदेश, लिंक, QR कोड या वॉयस नोट दर्ज करें।',
      tabs: {
        message: 'संदेश / SMS',
        messageDesc: 'SMS, व्हाट्सएप, ईमेल, टेलीग्राम संदेश',
        url: 'संदिग्ध लिंक',
        urlDesc: 'वेबसाइट, बैंक पोर्टल, शॉर्ट लिंक्स',
        qr: 'QR कोड और UPI',
        qrDesc: 'पेमेंट QR, UPI रिक्वेस्ट, पैसे लेने का झांसा',
        audio: 'कॉल रिकॉर्डिंग',
        audioDesc: 'धमकी भरी कॉल, पुलिस या बैंक अफसर बनकर फोन',
      },
      message: {
        placeholder: 'संदिग्ध SMS, व्हाट्सएप संदेश या ईमेल यहाँ पेस्ट करें...\n\nउदाहरण: "प्रिय ग्राहक, KYC न होने के कारण आपका बैंक खाता आज ब्लॉक हो जाएगा। तुरंत अपडेट करने के लिए इस लिंक पर क्लिक करें..."',
        chars: 'अक्षर',
        clear: 'साफ़ करें',
        analyze: 'संदेश की जांच करें',
        analyzing: 'धोखाधड़ी के संकेतों की जांच हो रही है...',
        trySamples: 'अक्सर पूछे जाने वाले स्कैम उदाहरण:',
        sample1: 'बैंक KYC ब्लॉक की चेतावनी',
        sample2: 'बिजली कटने की धमकी',
        sample3: 'घर बैठे पार्ट-टाइम नौकरी का झांसा',
        sampleSafe: 'असली डिलीवरी सूचना',
      },
      url: {
        label: 'वेबसाइट लिंक या URL दर्ज करें',
        placeholder: 'https://sbi-kyc-update-portal.xyz',
        analyze: 'लिंक की जांच करें',
        analyzing: 'डोमेन, सुरक्षा प्रमाणपत्र और खतरे की जांच जारी...',
        trySamples: 'नमूना लिंक देखें:',
        ssrfNotice: 'सुरक्षित सैंडबॉक्स: यह लिंक आपके डिवाइस पर सीधे कभी नहीं खुलेगा।',
      },
      qr: {
        title: 'QR कोड अपलोड करें या कैमरा चालू करें',
        dragDrop: 'QR कोड की फोटो यहाँ ड्रैग करें, या',
        browse: 'गैलरी से चुनें',
        cameraBtn: 'कैमरे से स्कैन करें',
        stopCamera: 'कैमरा बंद करें',
        sampleQrBtn: 'UPI फ्रॉड के नमूने देखें',
        upiDisclaimer: 'महत्वपूर्ण नियम: पैसे पाने के लिए कभी भी QR कोड स्कैन करने या UPI PIN डालने की आवश्यकता नहीं होती। QR स्कैन करने से केवल पैसे कटते हैं!',
        analyzing: 'QR कोड और UPI आईडी की जांच हो रही है...',
      },
      audio: {
        title: 'ऑडियो कॉल अपलोड करें या रिकॉर्ड करें',
        dragDrop: 'ऑडियो फ़ाइल यहाँ डालें (MP3, WAV, M4A, अधिकतम 15MB)',
        orRecord: 'या सीधे माइक से अपनी बात रिकॉर्ड करें:',
        startRecord: 'रिकॉर्डिंग शुरू करें',
        stopRecord: 'रोकें और जांचें',
        sampleAudioBtn: 'नमूना फ्रॉड कॉल सुनें',
        audioDisclaimer: 'गोपनीयता: ऑडियो का उपयोग केवल खतरे की जांच के लिए होता है और तुरंत मिटा दिया जाता है।',
        analyzing: 'आवाज़ की जांच और दबाव बनाने के तरीकों का विश्लेषण जारी...',
      },
    },
    results: {
      title: 'सुरक्षा रिपोर्ट और जोखिम स्तर',
      scoreLabel: 'जोखिम स्कोर',
      verdictSafe: 'संभवतः सुरक्षित / असली',
      verdictSuspicious: 'संदिग्ध / सावधानी बरतें',
      verdictScam: 'गंभीर स्कैम चेतावनी',
      confidence: 'सटीकता विश्वास',
      evidenceHeading: 'यह क्यों संदिग्ध है? (सबूत और संकेत)',
      actionsHeading: 'अब आपको क्या करना चाहिए? (बचाव के कदम)',
      technicalDetails: 'तकनीकी जानकारी',
      listenExplanation: 'आवाज़ में सुनें',
      listening: 'रिपोर्ट सुनाई जा रही है...',
      stopListening: 'रोकें',
      copyReport: 'रिपोर्ट कॉपी करें',
      copied: 'रिपोर्ट कॉपी हो गई!',
      newScan: 'नई जांच करें',
      reportFalsePositive: 'गलत परिणाम रिपोर्ट करें',
      safetyDisclaimer: 'सूचना: यह स्वचालित सलाह है। कम जोखिम का अर्थ यह नहीं कि सब पूरी तरह सुरक्षित है। कभी भी अपना OTP या UPI PIN किसी को न बताएं।',
      enginesUsed: 'उपयोग किए गए डिटेक्शन इंजन',
    },
    howItWorks: {
      badge: 'सुरक्षा प्रणाली',
      title: 'AI स्कैम शील्ड 4 चरणों में आपकी रक्षा कैसे करता है',
      subtitle: 'नियम-आधारित सुरक्षा, भारतीय ऑनलाइन फ्रॉड के पैटर्न और उन्नत AI समझ का सटीक संगम।',
      steps: {
        step1Title: '1. इनपुट दर्ज करें',
        step1Desc: 'संदेश, लिंक, UPI QR इमेज या वॉयस रिकॉर्डिंग दर्ज करें।',
        step2Title: '2. बहुस्तरीय जांच',
        step2Desc: 'धमकी, तात्कालिक दबाव, नकली बैंक व सरकारी विभाग के दावों की पड़ताल।',
        step3Title: '3. 0 से 100 तक स्कोर',
        step3Desc: 'सभी सिग्नलों को जोड़कर स्पष्ट जोखिम स्तर निर्धारित किया जाता है।',
        step4Title: '4. सरल भाषा में मार्गदर्शन',
        step4Desc: 'हिंदी में स्पष्ट व्याख्या और बचने के ठोस कदम प्राप्त करें।',
      },
    },
    audience: {
      badge: 'सबके लिए सरल',
      title: 'हर भारतीय के लिए सुरक्षित, तकनीकी ज्ञान की आवश्यकता नहीं',
      subtitle: 'धोखेबाज अक्सर डर और लालच का फायदा उठाते हैं। हमारा इंटरफ़ेस बड़ा, स्पष्ट और समझने में बेहद आसान है।',
      seniorsTitle: 'वरिष्ठ नागरिक',
      seniorsDesc: 'बिजली कटने, पेंशन बंद होने या पुलिस अरेस्ट की झूठी धमकियों से बचाव।',
      upiTitle: 'नए UPI उपभोक्ता',
      upiDesc: '"पैसे पाने के लिए PIN डालें" वाले सबसे आम फ्रॉड से सुरक्षा।',
      studentsTitle: 'विद्यार्थी और युवा',
      studentsDesc: 'टेलीग्राम पार्ट-टाइम जॉब, यूट्यूब लाइक टास्क और फर्जी लोन ऐप्स की पहचान।',
      businessTitle: 'छोटे दुकानदार व व्यापारी',
      businessDesc: 'फर्जी पेमेंट स्क्रीनशॉट और बदले हुए QR कोड से सतर्कता।',
    },
    learn: {
      badge: 'साइबर शिक्षा',
      title: 'डिजिटल ठगी के मुख्य प्रकार और बचाव',
      subtitle: 'असली उदाहरण पढ़ें और यह क्विज़ खेलकर अपनी पहचान क्षमता परखें।',
      quizBadge: 'अभ्यास क्विज़',
      quizTitle: 'स्कैम पहचानो चुनौती',
      quizSubtitle: '5 वास्तविक परिस्थितियों में अपनी समझ परखें।',
      quizScore: 'आपका स्कोर',
      checkAnswer: 'उत्तर जांचें',
      nextQuestion: 'अगला सवाल',
      restartQuiz: 'फिर से खेलें',
    },
    reports: {
      title: 'कम्युनिटी स्कैम रिपोर्टिंग',
      subtitle: 'नए फ्रॉड की जानकारी देकर दूसरों को सतर्क करें। सभी रिपोर्ट बिना किसी निजी जानकारी के प्रकाशित होती हैं।',
      submitBtn: 'स्कैम की जानकारी दें',
      categoryLabel: 'धोखाधड़ी का प्रकार',
      excerptLabel: 'संदेश का अंश, लिंक या UPI आईडी (अपनी निजी जानकारी न डालें)',
      descLabel: 'क्या हुआ था, संक्षेप में लिखें',
      consentLabel: 'मैं इस जानकारी को जनहित में साझा करने की सहमति देता/देती हूँ।',
      submitting: 'जानकारी भेजी जा रही है...',
      successMsg: 'धन्यवाद! आपकी रिपोर्ट दर्ज हो गई है।',
      recentHeading: 'हाल ही में दर्ज की गई चेतावनियाँ',
    },
    footer: {
      tagline: 'धोखाधड़ी पहचानें। अपना पैसा बचाएं।',
      disclaimer: 'AI स्कैम शील्ड एक स्वचालित सुरक्षा और शैक्षणिक साधन है। कम जोखिम पूरी सुरक्षा की गारंटी नहीं है। कभी भी अपना OTP या UPI PIN किसी से शेयर न करें।',
      rights: 'सर्वाधिकार सुरक्षित। सुरक्षित डिजिटल भारत के लिए समर्पित।',
      privacy: 'गोपनीयता नीति',
      terms: 'उपयोग की शर्तें',
      emergencyHelpline: 'राष्ट्रीय साइबर अपराध हेल्पलाइन: 1930 डायल करें (cybercrime.gov.in)',
    },
  },
  mr: {
    appName: 'AI स्कॅम शील्ड',
    tagline: 'फसवणूक ओळखा. आपले पैसे वाचवा.',
    mission: 'संदेश, UPI, QR कोड, लिंक्स आणि कॉलमध्ये होणाऱ्या डिजिटल फसवणुकीपासून प्रत्येक नागरिकाचे AI द्वारे संरक्षण.',
    nav: {
      home: 'मुख्यपृष्ठ',
      scan: 'स्कॅम तपासा',
      howItWorks: 'हे कसे कार्य करते',
      learn: 'माहिती व सुरक्षा',
      about: 'आमच्याबद्दल',
      reports: 'कम्युनिटी रिपोर्ट',
      scanNow: 'आता तपासा',
      history: 'इतिहास',
    },
    hero: {
      badge: 'प्रमाणित डिजिटल फसवणूक सुरक्षा',
      headline: 'पैसे पाठवण्यापूर्वी एक क्लिक. फसवणाऱ्यांपेक्षा एक पाऊल पुढे.',
      subheadline: 'संशयास्पद मेसेज, लिंक्स, QR कोड आणि कॉल रेकॉर्डिंग सेकंदात तपासा. मराठी, हिंदी आणि इंग्रजीत सोप्या भाषेत धोका समजून घ्या.',
      ctaPrimary: 'स्कॅम तपासा',
      ctaSecondary: 'कसे कार्य करते ते पाहा',
      trust1: 'सर्व माध्यमांची तपासणी',
      trust1Desc: 'SMS, व्हॉट्सअ‍ॅप, UPI QR, लिंक्स आणि व्हॉइस कॉल',
      trust2: 'सोप्या मराठीत समज',
      trust2Desc: 'कोणत्याही तांत्रिक गुंतागुंतीशिवाय स्पष्ट इशारा',
      trust3: 'गोपनीयतेची हमी',
      trust3Desc: 'तुमचा बँक पिन किंवा पासवर्ड कधीही जतन केला जात नाही',
      liveDemoBadge: 'थेट तपासणी डेमो',
      sampleMessage: 'तातडीची सूचना: तुमचे वीज बिल थकीत आहे! आज रात्री 9:30 वाजता वीज खंडित केली जाईल. तातडीने अधिकारी 9876543210 वर संपर्क साधा.',
      riskScore: '92 / 100',
      highRisk: 'गंभीर स्कॅमचा धोका',
      demoNote: 'प्रात्यक्षिक तपासणी डेमो. खरी तपासणी AI आणि सायबर नियमांवर आधारित आहे.',
    },
    scanner: {
      title: 'आज तुम्हाला कशाची तपासणी करायची आहे?',
      subtitle: 'सुरक्षा अहवाल मिळवण्यासाठी खाली कोणताही मजकूर, लिंक, QR कोड किंवा ऑडिओ नोंदवा.',
      tabs: {
        message: 'मेसेज / SMS',
        messageDesc: 'SMS, व्हॉट्सअ‍ॅप, ईमेल, टेलिग्राम मेसेज',
        url: 'संशयास्पद लिंक',
        urlDesc: 'वेबसाइट, बँक पोर्टल, शॉर्ट लिंक्स',
        qr: 'QR कोड आणि UPI',
        qrDesc: 'पेमेंट QR, UPI रिक्वेस्ट, पैसे मिळण्याचे आमिष',
        audio: 'कॉल रेकॉर्डिंग',
        audioDesc: 'धमकीचे कॉल, पोलिस किंवा बँक अधिकारी भासवून आलेला फोन',
      },
      message: {
        placeholder: 'संशयास्पद SMS, व्हॉट्सअ‍ॅप मेसेज किंवा ईमेल इथे पेस्ट करा...\n\nउदा: "प्रिय ग्राहक, KYC न केल्यामुळे तुमचे बँक खाते आज बंद केले जाईल. त्वरित अपडेट करण्यासाठी या लिंकवर क्लिक करा..."',
        chars: 'अक्षरे',
        clear: 'साफ करा',
        analyze: 'मेसेज तपासा',
        analyzing: 'फसवणुकीच्या लक्षणांची तपासणी चालू आहे...',
        trySamples: 'नेहमी विचारले जाणारे स्कॅम प्रकार:',
        sample1: 'बँक KYC बंद होण्याचा इशारा',
        sample2: 'वीज तोडण्याची खोटी धमकी',
        sample3: 'वर्क फ्रॉम होम पार्ट-टाइम नोकरी',
        sampleSafe: 'अधिकृत पार्सल डिलिव्हरी मेसेज',
      },
      url: {
        label: 'वेबसाइट लिंक किंवा URL टाका',
        placeholder: 'https://sbi-kyc-update-portal.xyz',
        analyze: 'लिंक तपासा',
        analyzing: 'डोमेन, सुरक्षा प्रमाणपत्र आणि धोक्याची तपासणी सुरू...',
        trySamples: 'नमुना लिंक्स पहा:',
        ssrfNotice: 'संरक्षित सँडबॉक्स: ही लिंक तुमच्या डिव्हाइसवर कधीही थेट उघडली जात नाही.',
      },
      qr: {
        title: 'QR कोड अपलोड करा किंवा कॅमेरा सुरू करा',
        dragDrop: 'QR कोड फोटो येथे ड्रॅग करा, किंवा',
        browse: 'गॅलरीतून निवडा',
        cameraBtn: 'कॅमेऱ्याने स्कॅन करा',
        stopCamera: 'कॅमेरा बंद करा',
        sampleQrBtn: 'UPI फसवणुकीचे नमुने पहा',
        upiDisclaimer: 'महत्त्वाचा नियम: पैसे मिळवण्यासाठी कधीही QR कोड स्कॅन करावा लागत नाही किंवा UPI PIN टाकावा लागत नाही. QR स्कॅन केल्याने फक्त पैसे खात्यातून वजा होतात!',
        analyzing: 'QR कोड आणि UPI आयडीची तपासणी चालू आहे...',
      },
      audio: {
        title: 'ऑडिओ कॉल अपलोड करा किंवा रेकॉर्ड करा',
        dragDrop: 'ऑडिओ फाईल टाका (MP3, WAV, M4A, कमाल 15MB)',
        orRecord: 'किंवा मायक्रोफोनने थेट रेकॉर्ड करा:',
        startRecord: 'रेकॉर्डिंग सुरू करा',
        stopRecord: 'थांबवा आणि तपासा',
        sampleAudioBtn: 'नमुना फ्रॉड कॉल ऐका',
        audioDisclaimer: 'गोपनीयता: ऑडिओ फक्त धोक्याची तपासणी करण्यासाठी वापरला जातो व त्वरित नष्ट केला जातो.',
        analyzing: 'आवाजाची तपासणी व मानसिक दबावाच्या पद्धतींचे विश्लेषण सुरू...',
      },
    },
    results: {
      title: 'सुरक्षा अहवाल आणि जोखीम पातळी',
      scoreLabel: 'जोखीम गुण',
      verdictSafe: 'बहुतांश सुरक्षित / खरे',
      verdictSuspicious: 'संशयास्पद / काळजीपूर्वक वागा',
      verdictScam: 'गंभीर स्कॅमचा इशारा',
      confidence: 'अचूकता विश्वास',
      evidenceHeading: 'हे संशयास्पद का वाटले? (पुरावे व लक्षणे)',
      actionsHeading: 'आता तुम्ही काय केले पाहिजे? (सुरक्षेची पावले)',
      technicalDetails: 'तांत्रिक तपशील',
      listenExplanation: 'आवाजात ऐका',
      listening: 'अहवाल ऐकवला जात आहे...',
      stopListening: 'थांबवा',
      copyReport: 'अहवाल कॉपी करा',
      copied: 'अहवाल कॉपी केला!',
      newScan: 'नवीन तपासणी करा',
      reportFalsePositive: 'चुकीचा निकाल नोंदवा',
      safetyDisclaimer: 'सूचना: हा स्वयंचलित सल्ला आहे. कमी जोखीम म्हणजे १००% सुरक्षेची हमी नव्हे. कधीही आपला OTP किंवा UPI PIN कोणालाही सांगू नका.',
      enginesUsed: 'वापरलेली तपासणी इंजिने',
    },
    howItWorks: {
      badge: 'सुरक्षा यंत्रणा',
      title: 'AI स्कॅम शील्ड ४ टप्प्यांत तुमचे संरक्षण कसे करते',
      subtitle: 'नियम-आधारित सुरक्षा, भारतीय ऑनलाइन फ्रॉड पद्धती आणि प्रगत AI तंत्रज्ञानाचा अचूक संगम.',
      steps: {
        step1Title: '१. इनपुट द्या',
        step1Desc: 'मेसेज, लिंक, UPI QR इमेज किंवा व्हॉइस कॉल टाका.',
        step2Title: '२. बहुस्तरीय तपासणी',
        step2Desc: 'धमकी, तातडीचा दबाव आणि बनावट सरकारी दाव्यांची पडताळणी.',
        step3Title: '३. ० ते १०० गुण',
        step3Desc: 'सर्व लक्षणांचा मेळ घालून अचूक जोखीम पातळी ठरवली जाते.',
        step4Title: '४. सोप्या भाषेत सल्ला',
        step4Desc: 'मराठीत स्पष्ट स्पष्टीकरण आणि बचावाचे ठोस उपाय मिळवा.',
      },
    },
    audience: {
      badge: 'सर्वांसाठी सोपे',
      title: 'प्रत्येक मराठी नागरिकासाठी सुरक्षित, तांत्रिक ज्ञानाची गरज नाही',
      subtitle: 'फसवणारे लोक भीती आणि आमिषाचा गैरफायदा घेतात. आमचा इंटरफेस मोठा, स्पष्ट आणि समजायला अतिशय सोपा आहे.',
      seniorsTitle: 'ज्येष्ठ नागरिक',
      seniorsDesc: 'वीज तोडणे, पेन्शन थांबणे किंवा पोलिस अटकेच्या खोट्या धमक्यांपासून बचाव.',
      upiTitle: 'नवीन UPI वापरकर्ते',
      upiDesc: '"पैसे मिळण्यासाठी PIN टाका" अशा सर्वात मोठ्या फसवणुकीपासून रक्षण.',
      studentsTitle: 'विद्यार्थी व तरुण',
      studentsDesc: 'टेलिग्राम पार्ट-टाइम जॉब्स, लाईक-शेअर टास्क आणि बनावट लोन अ‍ॅप्सची ओळख.',
      businessTitle: 'छोटे दुकानदार व व्यापारी',
      businessDesc: 'बनावट पेमेंट स्क्रीनशॉट आणि बदललेल्या QR कोडपासून संरक्षण.',
    },
    learn: {
      badge: 'सायबर शिक्षण',
      title: 'डिजिटल फसवणुकीचे प्रकार आणि घ्यायची काळजी',
      subtitle: 'खरे अनुभव वाचा आणि हा क्विझ सोडवून आपली सजगता तपासा.',
      quizBadge: 'सराव क्विझ',
      quizTitle: 'स्कॅम ओळखा आव्हान',
      quizSubtitle: '५ वास्तविक घटनांमध्ये आपली समज तपासा.',
      quizScore: 'तुमचे गुण',
      checkAnswer: 'उत्तर तपासा',
      nextQuestion: 'पुढील प्रश्न',
      restartQuiz: 'पुन्हा प्रयत्न करा',
    },
    reports: {
      title: 'कम्युनिटी स्कॅम रिपोर्टिंग',
      subtitle: 'नवीन फसवणुकीची माहिती देऊन इतरांना सतर्क करा. सर्व अहवाल खाजगी माहिती वगळून प्रसिद्ध होतात.',
      submitBtn: 'माहिती नोंदवा',
      categoryLabel: 'फसवणुकीचा प्रकार',
      excerptLabel: 'मेसेजचा भाग, लिंक किंवा UPI आयडी (स्वतःची खाजगी माहिती टाळणे)',
      descLabel: 'नेमके काय घडले ते थोडक्यात लिहा',
      consentLabel: 'मी ही माहिती जनजागृतीसाठी सामायिक करण्यास संमती देतो/देते.',
      submitting: 'माहिती पाठवली जात आहे...',
      successMsg: 'धन्यवाद! तुमचा अहवाल नोंदवला गेला आहे.',
      recentHeading: 'अलीकडील नोंदवलेले इशारे',
    },
    footer: {
      tagline: 'फसवणूक ओळखा. आपले पैसे वाचवा.',
      disclaimer: 'AI स्कॅम शील्ड हे स्वयंचलित सुरक्षा साधन आहे. कमी जोखीम म्हणजे संपूर्ण सुरक्षेची खात्री नाही. आपला OTP किंवा UPI PIN कोणालाही शेअर करू नका.',
      rights: 'सर्व हक्क राखीव. सुरक्षित डिजिटल भारतासाठी समर्पित.',
      privacy: 'गोपनीयता धोरण',
      terms: 'वापराच्या अटी',
      emergencyHelpline: 'राष्ट्रीय सायबर गुन्हे हेल्पलाइन: १९३० डायल करा (cybercrime.gov.in)',
    },
  },
};
