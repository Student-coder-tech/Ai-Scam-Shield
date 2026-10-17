# 🛡️ AI Scam Shield — Detect the Scam. Protect Your Money.

**AI Scam Shield** is a cybersecurity web application engineered to protect digital citizens—especially senior citizens, first-time UPI users, students, and rural communities—from digital financial scams before they lose money.

---

## 🌟 Key Features

1. **Multi-Channel Scam Scanner**:
   - **Message / SMS Scanner**: Analyzes SMS, WhatsApp messages, Telegram offers, and emails for psychological urgency, fake bank KYC locks, electricity power-cut threats, and advance-fee lottery lures.
   - **Link / URL Scanner**: Inspects domain names, TLD reputation, brand typosquatting, SSL status, and applies SSRF protection blocking private subnets and cloud metadata endpoints.
   - **QR Code & UPI Scanner**: Decodes QR code images or camera captures using client-side canvas inspection (`jsQR`). Decodes `upi://pay` URIs, extracts Payee VPA, payee name, amount, and warns against the deceptive **"Scan QR to receive money"** trap.
   - **Voice Call Audio Analyzer**: Supports audio file uploads (MP3, WAV, M4A, WEBM) or live browser microphone recording. Transcribes audio via `gemini-3.5-transcribe` and detects coercion tactics (e.g., Digital Arrest, fake police warrants, bank OTP demands).

2. **Calibrated Risk Gauge & Actionable Reports**:
   - 0–29: Low Risk / Likely Safe
   - 30–69: Suspicious / Proceed with Caution
   - 70–100: High Risk / Scam Alert
   - Highlighted evidence excerpts and plain-language protective advice.
   - Browser Text-to-Speech (TTS) audio narration in English, Hindi, or Marathi.
   - One-click report copying and discrepancy reporting.

3. **Multilingual Inclusivity**:
   - Native support for **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)** across navigation, interactive scanners, educational guides, and AI-generated explanations.

4. **Learn & Stay Safe Hub**:
   - Beginner-friendly case studies on UPI fraud, electricity cutoff SMS, Digital Arrest scams, and part-time job task traps.
   - Interactive **"Spot the Scam" Challenge Quiz** with 5 realistic scenarios and immediate feedback.

5. **Community Scam Reporting & Live Feed**:
   - Anonymized threat reporting with sensitive data redaction.
   - Live community vigilance feed with helpfulness upvotes.

6. **Privacy-First Architecture**:
   - No user account or login required for scanning.
   - Scan history stored in browser session memory with one-click local clearing.
   - Never requests or stores UPI PINs, OTPs, or passwords.
   - Uploaded call recordings are processed in memory and immediately discarded.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Backend**: Express (Node.js/TypeScript with `tsx`) mounted with Vite middleware.
- **AI / NLP**: `@google/genai` with `gemini-3.8-flash` for deep semantic fraud analysis and `gemini-3.5-transcribe` for audio transcription.
- **Security & Heuristics**: Deterministic Indian cybercrime pattern engine, SSRF loopback guard, UPI URI parser, client-side QR decoder.

---

## 🚀 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Variables

Create `.env` using `.env.example`:

```bash
cp .env.example .env
```

Set your Gemini API key (automatically injected in AI Studio):
```env
GEMINI_API_KEY="your-gemini-api-key"
```

*Note: If no API key is configured, AI Scam Shield automatically runs on its built-in deterministic heuristic rule engine, ensuring zero downtime.*

### 3. Running the Application

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### 4. Running Unit Tests

```bash
npm test
```

Verifies SSRF loopback blocking, private IP rejection, and UPI scan-to-receive fraud parsing.

---

## 🛡️ Security & National Helpline

If you or someone you know has been targeted by digital financial fraud in India:
- **National Cyber Crime Helpline**: Dial **1930** immediately.
- **Portal**: [cybercrime.gov.in](https://cybercrime.gov.in)

---

## ⚖️ Disclaimer

AI Scam Shield provides automated risk assessments and educational guidance. Results may be incomplete or incorrect. A low-risk result does not guarantee safety. Always verify payment requests independently and never share your OTP or UPI PIN.
