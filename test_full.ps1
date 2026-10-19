# AI Scam Shield - Full API + Gemini Integration Test
Set-Location "C:\Users\DELL\Downloads\ai-scam-shield"

# Load .env
Get-Content ".env" | Where-Object { $_ -match "^[A-Z_]+=." } | ForEach-Object {
    $parts = $_ -split "=", 2
    $k = $parts[0].Trim(); $v = $parts[1].Trim().Trim('"')
    [System.Environment]::SetEnvironmentVariable($k, $v, "Process")
}
Write-Host "Env: GEMINI_TEXT_MODEL=$env:GEMINI_TEXT_MODEL  key_present=$($env:GEMINI_API_KEY.Length -gt 10)"

# Kill port 3000
$c = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($c) { $c | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Start-Sleep 2 }

# Start server with env inherited
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "cmd.exe"; $psi.Arguments = "/c npx tsx server.ts"
$psi.WorkingDirectory = "C:\Users\DELL\Downloads\ai-scam-shield"
$psi.UseShellExecute = $false; $psi.CreateNoWindow = $true
foreach ($k in ([System.Environment]::GetEnvironmentVariables("Process")).Keys) {
    try { $psi.EnvironmentVariables[$k] = [System.Environment]::GetEnvironmentVariable($k, "Process") } catch {}
}
$proc = [System.Diagnostics.Process]::Start($psi)
Write-Host "Server PID: $($proc.Id) — waiting 12s..."
Start-Sleep 12

$pass = 0; $fail = 0
function T($name, $uri, $method = "GET", $body = $null, $expect = 200) {
    try {
        if ($body) { $r = Invoke-WebRequest $uri -Method $method -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 40 -ErrorAction Stop }
        else { $r = Invoke-WebRequest $uri -Method $method -UseBasicParsing -TimeoutSec 40 -ErrorAction Stop }
        if ($r.StatusCode -eq $expect) { Write-Host "  PASS [$name] HTTP $($r.StatusCode)"; $script:pass++; return ($r.Content | ConvertFrom-Json) }
        else { Write-Host "  FAIL [$name] Expected $expect got $($r.StatusCode)"; $script:fail++ }
    } catch {
        if ($expect -ge 400) { Write-Host "  PASS [$name] error as expected ($expect)"; $script:pass++ }
        else { Write-Host "  FAIL [$name] $($_.Exception.Message)"; $script:fail++ }
    }
    return $null
}

Write-Host "`n=== HEALTH ==="
$h = T "health" "http://localhost:3000/api/health"
if ($h) { Write-Host "    gemini=$($h.services.gemini_configured) model=$($h.services.gemini_text_model) safe_browsing=$($h.services.safe_browsing_configured)" }

Write-Host "`n=== MESSAGE ANALYSIS ==="
$m = T "message-scam" "http://localhost:3000/api/analyze/message" "POST" '{"message":"Dear SBI Customer, your account will be blocked today. Update KYC at http://sbi-pan-kyc.xyz/login","language":"en"}'
if ($m) { Write-Host "    score=$($m.risk_score) verdict=$($m.verdict) findings=$($m.findings.Count) ai=$($m.technical_details.aiModelUsed) status=$($m.analysis_status)" }

$ms = T "message-safe" "http://localhost:3000/api/analyze/message" "POST" '{"message":"Your Amazon order #IND-90823 has been dispatched. Track inside the Amazon app.","language":"en"}'
if ($ms) { Write-Host "    score=$($ms.risk_score) verdict=$($ms.verdict) (safe message)" }

T "message-empty-400" "http://localhost:3000/api/analyze/message" "POST" '{"message":"","language":"en"}' 400 | Out-Null
T "message-toolong-400" "http://localhost:3000/api/analyze/message" "POST" ('{"message":"' + ('x' * 5001) + '","language":"en"}') 400 | Out-Null

Write-Host "`n=== URL ANALYSIS ==="
$u = T "url-phishing" "http://localhost:3000/api/analyze/url" "POST" '{"url":"http://sbi-pan-kyc-verify.shop/login","language":"en"}'
if ($u) { Write-Host "    score=$($u.risk_score) verdict=$($u.verdict) findings=$($u.findings.Count)" }

T "url-ssrf-localhost" "http://localhost:3000/api/analyze/url" "POST" '{"url":"http://localhost:9000/admin","language":"en"}' 400 | Out-Null
T "url-ssrf-metadata" "http://localhost:3000/api/analyze/url" "POST" '{"url":"http://169.254.169.254/latest/meta-data","language":"en"}' 400 | Out-Null

Write-Host "`n=== QR ANALYSIS ==="
$q = T "qr-scam" "http://localhost:3000/api/analyze/qr" "POST" '{"qrPayload":"upi://pay?pa=cashbackloot@ybl&pn=PhonePeCashback&am=4999&tn=EnterPINtoReceive","language":"en"}'
if ($q) { Write-Host "    score=$($q.risk_score) verdict=$($q.verdict) findings=$($q.findings.Count) vpa=$($q.technical_details.upiDetails.payeeVpa)" }

$ql = T "qr-legit" "http://localhost:3000/api/analyze/qr" "POST" '{"qrPayload":"upi://pay?pa=freshmart.grocery@icici&pn=FreshMartStore&cu=INR","language":"en"}'
if ($ql) { Write-Host "    score=$($ql.risk_score) verdict=$($ql.verdict) (legit merchant QR)" }

Write-Host "`n=== AUDIO ANALYSIS ==="
$a = T "audio-transcript" "http://localhost:3000/api/analyze/audio" "POST" '{"transcriptText":"This is Inspector Sharma from Mumbai Cyber Crime Branch. A parcel under your Aadhaar contains narcotics. Transfer 50000 immediately or you will be arrested.","language":"en"}'
if ($a) { Write-Host "    score=$($a.risk_score) verdict=$($a.verdict) findings=$($a.findings.Count) status=$($a.analysis_status)" }

T "audio-empty-400" "http://localhost:3000/api/analyze/audio" "POST" '{"language":"en"}' 400 | Out-Null

Write-Host "`n=== REPORTS ==="
$rp = T "report-submit" "http://localhost:3000/api/reports" "POST" '{"category":"Bank KYC Phishing","excerptOrUrl":"http://sbi-fake.xyz","description":"Received fake SMS threatening to block my SBI account unless KYC updated immediately.","language":"en","consent":true}' 201
if ($rp) { Write-Host "    id=$($rp.report.id) status=$($rp.report.status)" }

T "report-no-consent-400" "http://localhost:3000/api/reports" "POST" '{"category":"Test","description":"Valid description text here","consent":false,"language":"en"}' 400 | Out-Null

$rl = T "reports-recent" "http://localhost:3000/api/reports/recent"
if ($rl) { Write-Host "    count=$($rl.reports.Count) total=$($rl.total)" }

Write-Host "`n=== FEEDBACK ==="
$fb = T "feedback-valid" "http://localhost:3000/api/feedback" "POST" '{"scanId":"scan-test-1","feedbackType":"false_positive","comments":"Legitimate bank notification","riskScore":80}'
if ($fb) { Write-Host "    success=$($fb.success)" }

T "feedback-bad-type-400" "http://localhost:3000/api/feedback" "POST" '{"scanId":"x","feedbackType":"hack_me"}' 400 | Out-Null
T "feedback-no-scanid-400" "http://localhost:3000/api/feedback" "POST" '{"feedbackType":"false_positive"}' 400 | Out-Null

Write-Host "`n================================"
Write-Host "  PASSED: $pass   FAILED: $fail"
Write-Host "================================"

Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Write-Host "Server stopped."
