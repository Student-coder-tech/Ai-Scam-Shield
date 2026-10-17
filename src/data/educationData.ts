import { EducationalArticle, QuizQuestion } from '../types';

export const educationalArticles: EducationalArticle[] = [
  {
    id: 'upi-fraud-scan-receive',
    title: 'The "Scan QR to Receive Money" Fraud',
    category: 'UPI Safety',
    readTime: '3 min read',
    summary: 'One of the most widespread frauds in digital payments. Scammers claim they are sending you an advance payment or cashback, but send a payment QR instead.',
    exampleScenario: 'You list furniture on OLX for ₹5,000. A buyer offers to pay immediately via UPI and sends a QR code: "Scan this QR and enter your 4-digit UPI PIN to claim ₹5,000 in your bank account."',
    warningSigns: [
      'Anyone telling you to "scan a QR code" or "enter your PIN" to receive money.',
      'The QR screen displaying "Paying to..." instead of your own name.',
      'Caller urging you to complete it within 5 minutes or the link expires.'
    ],
    protectionSteps: [
      'Golden Rule of UPI: You NEVER enter your UPI PIN to receive money. PIN is ONLY used to DEDUCT money.',
      'To receive money, you only need to provide your UPI ID or mobile number. No scanning needed.',
      'Reject and report any buyer requesting you to scan anything.'
    ],
    actionIfVictim: [
      'Immediately dial 1930 (National Cyber Crime Helpline) within the golden hour.',
      'Block your UPI app / debit card via your bank mobile app or helpline.',
      'File a complaint at https://cybercrime.gov.in with transaction ID and recipient UPI VPA.'
    ]
  },
  {
    id: 'fake-kyc-bank-block',
    title: 'Fake Bank & Electricity Bill Disconnection SMS',
    category: 'Phishing & SMS',
    readTime: '4 min read',
    summary: 'Urgent threats claiming your bank account or electricity will be suspended unless you immediately verify KYC or pay a tiny penalty via an unverified link.',
    exampleScenario: '"Dear Consumer, your electricity connection will be disconnected tonight at 9:30 PM from the power office because your previous month bill was not updated. Please immediately contact officer on 9876543210."',
    warningSigns: [
      'Message sent from personal 10-digit mobile numbers (+91...) instead of registered sender IDs like VM-SBINB or AX-MSEB.',
      'Threatening imminent cutoff or account freeze within hours.',
      'Links pointing to unofficial domains like .xyz, .top, .live, or .app instead of official bank/utility websites.'
    ],
    protectionSteps: [
      'Discoms and power boards never send cutoff notices on WhatsApp or personal mobile numbers without prior written postal/meter notices.',
      'Always check your bill status directly inside official apps like Mahavitaran, BSES, Tata Power, or official bank apps.',
      'Never download APK files sent over WhatsApp (e.g., "ElectricityQuickBill.apk") — they contain remote access trojans (RATs).'
    ],
    actionIfVictim: [
      'If you installed an APK, turn on Airplane Mode immediately to stop remote control.',
      'Uninstall the malicious application from Settings > Apps, or factory reset the phone.',
      'Call your bank immediately to block internet banking and debit cards.'
    ]
  },
  {
    id: 'digital-arrest-customs',
    title: 'Digital Arrest & Fake Police / CBI Video Calls',
    category: 'Impersonation & Coercion',
    readTime: '5 min read',
    summary: 'A sophisticated psychological coercion scam where scammers pose as CBI, Mumbai Police, FedEx, or Customs claiming illegal drugs were found in a parcel under your Aadhaar.',
    exampleScenario: 'You receive a call: "A courier parcel to Cambodia containing 5 passports and contraband MDMA has been intercepted in your name. You are under Digital Arrest. Keep Skype on and do not tell family or police will arrive."',
    warningSigns: [
      'Callers in fake police uniforms using Skype/WhatsApp video calls with fake police station backgrounds.',
      'Claims of "Digital Arrest" — Indian law and police procedures have NO concept of "digital arrest".',
      'Demands to transfer your savings into a "Secret RBI Verification Account" for verification.'
    ],
    protectionSteps: [
      'The Supreme Court and Police have repeatedly clarified: Police, CBI, and ED NEVER conduct interrogations or arrests via Skype/WhatsApp video.',
      'No government agency or court will ever ask you to transfer funds to a private bank account for "clearance".',
      'Simply disconnect the call and report the phone number to 1930 and the local police station.'
    ],
    actionIfVictim: [
      'Do not panic. Notify family members and trusted people immediately.',
      'Report the beneficiary bank account numbers and UTR details to 1930 immediately.',
      'File an official cyber crime report at cybercrime.gov.in.'
    ]
  },
  {
    id: 'part-time-task-telegram',
    title: 'Part-Time "Like YouTube Videos & Rate Hotels" Scam',
    category: 'Job & Investment',
    readTime: '3 min read',
    summary: 'Victims are promised ₹1,500 to ₹5,000 per day for simple online tasks like rating hotels on Google Maps or liking videos, then coerced into "crypto investment" tasks.',
    exampleScenario: 'An HR manager contacts you on WhatsApp: "Work from home 20 mins a day, like 3 videos and earn ₹150 instantly." You get ₹150 credited to build trust. Then you are asked to pay ₹10,000 into a trading pool for 300% return.',
    warningSigns: [
      'Unsolicited job offers sent via WhatsApp or Telegram from foreign or unknown numbers.',
      'Paying you real small amounts (₹100-₹500) initially as psychological bait.',
      'Requiring you to deposit money to "unlock" or "withdraw" your earned salary.'
    ],
    protectionSteps: [
      'Legitimate employers never ask candidates to pay money or deposit security funds to work.',
      'Rating reviews for money violates platform terms and is a classic gateway to investment fraud.',
      'Block and report numbers offering easy instant money.'
    ],
    actionIfVictim: [
      'Cease all communication and stop depositing further "tax" or "unlock" payments.',
      'Take screenshots of Telegram chats, transaction receipts, and deposit UPI IDs.',
      'Lodge a report on National Cyber Crime Portal (1930).'
    ]
  }
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    scenario: 'You are selling an old washing machine on an online classifieds site.',
    type: 'UPI Payment Request',
    sender: 'Buyer on WhatsApp',
    content: '"Brother, I am sending you ₹8,500 advance payment. I have sent you a QR code. Please scan it in PhonePe/GooglePay and enter your UPI PIN to receive the money in your account right now."',
    options: [
      {
        text: 'Scan the QR and enter your 4-digit UPI PIN to claim the ₹8,500.',
        isCorrect: false,
        explanation: 'DANGEROUS! Entering your UPI PIN will DEDUCT ₹8,500 from your account, not credit it. You never enter PIN to receive money.'
      },
      {
        text: 'Refuse to scan. Tell the buyer you only need to share your mobile number or UPI ID to receive money.',
        isCorrect: true,
        explanation: 'CORRECT! To receive money via UPI, you only share your UPI ID or mobile number. Scanning a QR code or entering a PIN is ALWAYS for paying out!'
      },
      {
        text: 'Scan the QR code but enter a wrong PIN 3 times.',
        isCorrect: false,
        explanation: 'Unnecessary risk. The correct step is to immediately stop and not interact with payment requests sent by buyers.'
      }
    ]
  },
  {
    id: 2,
    scenario: 'You receive an SMS on a Saturday evening.',
    type: 'Utility Bill Disconnection',
    sender: '+91 97112 34567',
    content: '"Urgent Notice: Dear Consumer, your power supply will be disconnected at 9:30 PM due to unpaid electricity bill of ₹450. Call Chief Engineer Sharma at 9711234567 immediately to avoid power cut."',
    options: [
      {
        text: 'Call the 10-digit number immediately and pay the ₹450 to avoid having your electricity cut off.',
        isCorrect: false,
        explanation: 'DANGEROUS! This is a classic fraud. Electricity boards never send disconnections via random 10-digit mobile numbers with immediate same-night cutoffs.'
      },
      {
        text: 'Ignore the SMS, open your official electricity board app (or utility website), and verify your real bill status.',
        isCorrect: true,
        explanation: 'CORRECT! Always verify utility bills inside official consumer portals. Electricity boards follow formal meter reading and billing cycles, not frantic evening SMS threats.'
      },
      {
        text: 'Reply to the SMS asking for an official receipt first.',
        isCorrect: false,
        explanation: 'Replying confirms your phone number is active to the scammer. Verify only through your official electricity provider channel.'
      }
    ]
  },
  {
    id: 3,
    scenario: 'A WhatsApp message arrives from an unknown international number (+84 ...).',
    type: 'Part-Time Job Task',
    sender: '+84 92 817 2910',
    content: '"Hello! I am Natasha from Global Media HR. You can earn ₹3,000 - ₹8,000 daily by simply subscribing to YouTube channels and giving 5-star Google Map reviews. Click here to claim your ₹200 joining bonus."',
    options: [
      {
        text: 'Click the link and complete the first task to see if they really send the ₹200.',
        isCorrect: false,
        explanation: 'DANGEROUS! They intentionally send the first ₹200 to build your confidence, then lure you into transferring thousands of rupees in "prepaid VIP tasks".'
      },
      {
        text: 'Block the number and report as spam on WhatsApp.',
        isCorrect: true,
        explanation: 'CORRECT! Legitimate global HR departments do not solicit random phone numbers on WhatsApp offering high daily pay for clicking "like" buttons.'
      },
      {
        text: 'Forward the message to your friends so everyone can make extra pocket money.',
        isCorrect: false,
        explanation: 'Never forward unsolicited job scams. It puts your friends and family at risk of losing their hard-earned money.'
      }
    ]
  },
  {
    id: 4,
    scenario: 'A video call on WhatsApp from a person in police uniform.',
    type: 'Digital Arrest / Customs Impersonation',
    sender: 'Inspector V. Rathore (DP shows Police Logo)',
    content: '"A DHL package sent from your name to Malaysia contains fake passports and 140 grams of cocaine. A non-bailable warrant is issued. Do not disconnect this call or local police will raid your house."',
    options: [
      {
        text: 'Transfer your bank savings into the "RBI Verification Escrow Account" they provide to prove your innocence.',
        isCorrect: false,
        explanation: 'DANGEROUS! There is NO such thing as an "RBI Escrow verification account". Once transferred, your money is funneled through mule bank accounts.'
      },
      {
        text: 'Recognize this as a "Digital Arrest" scam. Disconnect the video call immediately and dial 1930.',
        isCorrect: true,
        explanation: 'CORRECT! Indian law does not have any concept of "Digital Arrest". Police never conduct legal interrogations or demand fund transfers over WhatsApp video calls!'
      },
      {
        text: 'Beg the caller for mercy and offer to pay them a private bribe over Google Pay.',
        isCorrect: false,
        explanation: 'Never transfer any money. The callers are impersonators operating from remote call centers using fake props and uniforms.'
      }
    ]
  },
  {
    id: 5,
    scenario: 'You receive an urgent text message about your State Bank account.',
    type: 'KYC Phishing Link',
    sender: 'DZ-SBINB-ALERT',
    content: '"Your SBI account will be suspended today at 8:00 PM due to pending PAN/KYC update. Kindly click here to update immediately: http://sbi-pan-kyc-verify.shop/login"',
    options: [
      {
        text: 'Notice that the link ends in ".shop" and not official "onlinesbi.sbi". Do not click and report.',
        isCorrect: true,
        explanation: 'CORRECT! Banks only use verified official domains (e.g. sbi.co.in or onlinesbi.sbi). They never use generic TLDs like .shop, .xyz, or .top.'
      },
      {
        text: 'Click the link and enter your internet banking username and password to keep your account safe.',
        isCorrect: false,
        explanation: 'DANGEROUS! Entering your credentials on a fake phishing domain hands over your banking credentials and OTP to cyber criminals.'
      },
      {
        text: 'Click the link, but only provide your PAN card number and not your password.',
        isCorrect: false,
        explanation: 'Do not click the link at all. Phishing sites can also silently trigger malicious script downloads or track your device fingerprint.'
      }
    ]
  }
];
