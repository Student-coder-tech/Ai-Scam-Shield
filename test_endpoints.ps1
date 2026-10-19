# AI Scam Shield - API endpoint test script
# Run with: pwsh -File test_endpoints.ps1

Set-Location "C:\Users\DELL\Downloads\ai-scam-shield"

# Kill anything on port 3000
$conns = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($conns) {
    $conns | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}

# Start server
$proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","cd /d C:\Users\DELL\Downloads\ai-scam-shield && npx tsx server.ts" -PassThru -WindowStyle Hidden
Write-Host "Server PID: $($proc.Id)"
Start-Sleep -Seconds 12

$passed = 0
$failed = 0

function Test-Endpoint {
    param($Name, $Uri, $Method = "GET", $Body = $null, $ExpectStatus = 200)
    try {
        if ($Body) {
            $r = Invoke-WebRequest -Uri $Uri -Method $Method -Body $Body -ContentType "application/json" -UseBasicParsing -TimeoutSec 40 -ErrorAction Stop
        } else {
            $r = Invoke-WebRequest -Uri $Uri -Method $Method -UseBasicParsing -TimeoutSec 40 -ErrorAction Stop
        }
        if ($r.StatusCode -eq $ExpectStatus) {
            Write-Host "  PASS [$Name] HTTP $($r.StatusCode)"
            $script:passed++
            return $r.Content | ConvertFrom-Json
        } else {
            Write-Host "  FAIL [$Name] Expected HTTP $ExpectStatus got $($r.StatusCode)"
            $script:failed++
        }
    } catch {
        if ($ExpectStatus -ge 400) {
            Write-Host "  PASS [$Name] Got expected error response"
            $script:passed++
        } else {
            Write-Host "  FAIL [$Name] Error: $($_.Exception.Message)"
            $script:failed++
        }
    }
    return $null
}

Write-Host "`n=== AI Scam Shield API Tests ===`n"

# Test 1: Health
Write-Host "--- Health ---"
$h = Test-Endpoint "health" "http://localhost:3000/api/health"
if ($h) { Write-Host "    Gemini: $($h.services.gemini_configured), Model: $($h.services.gemini_text_model)" }

# Test 2: Message - scam
Write-Host "`n--- Message Analysis ---"
$b = '{"message":"Dear SBI Customer, your account will be blocked today. Update KYC at http://sbi-pan-kyc.xyz/login immediately","language":"en"}'
$m = Test-Endpoint "message scam" "http://localhost:3000/api/analyze/message" "POST" $b
if ($m) { Write-Host "    Score:$($m.risk_score) Verdict:$($m.verdict) Findings:$($m.findings.Count) AI:$($m.technical_details.aiModelUsed)" }

# Test 3: Message - validation error
$b2 = '{"message":"","language":"en"}'
Test-Endpoint "message empty->400" "http://localhost:3000/api/analyze/message" "POST" $b2 400 | Out-Null

# Test 4: URL - phishing
Write-Host "`n--- URL Analysis ---"
$b = '{"url":"http://sbi-pan-kyc-verify.shop/login","language":"en"}'
$u = Test-Endpoint "url phishing" "http://localhost:3000/api/analyze/url" "POST" $b
if ($u) { Write-Host "    Score:$($u.risk_score) Verdict:$($u.verdict) Findings:$($u.findings.Count)" }

# Test 5: URL - SSRF block
$b = '{"url":"http://localhost:8080/admin","language":"en"}'
Test-Endpoint "url ssrf->400" "http://localhost:3000/api/analyze/url" "POST" $b 400 | Out-Null

# Test 6: QR analysis
Write-Host "`n--- QR Analysis ---"
$b = '{"qrPayload":"upi://pay?pa=cashbackloot@ybl&pn=PhonePeCashback&am=4999&tn=EnterPINtoReceive","language":"en"}'
$q = Test-Endpoint "qr upi scam" "http://localhost:3000/api/analyze/qr" "POST" $b
if ($q) { Write-Host "    Score:$($q.risk_score) Verdict:$($q.verdict) Findings:$($q.findings.Count)" }

# Test 7: Audio - transcript mode
Write-Host "`n--- Audio Analysis ---"
$b = '{"transcriptText":"This is Inspector Sharma from Mumbai Cyber Crime Branch. A DHL parcel under your Aadhaar contains narcotics. Transfer 50000 immediately or you will be arrested.","language":"en"}'
$a = Test-Endpoint "audio transcript" "http://localhost:3000/api/analyze/audio" "POST" $b
if ($a) { Write-Host "    Score:$($a.risk_score) Verdict:$($a.verdict) Findings:$($a.findings.Count)" }

# Test 8: Audio - no input
$b = '{"language":"en"}'
Test-Endpoint "audio empty->400" "http://localhost:3000/api/analyze/audio" "POST" $b 400 | Out-Null

# Test 9: Community report - submit
Write-Host "`n--- Community Reports ---"
$b = '{"category":"Bank KYC Phishing","excerptOrUrl":"http://sbi-fake.xyz","description":"Received fake SMS claiming my SBI account will be blocked unless I update KYC immediately.","language":"en","consent":true}'
$rep = Test-Endpoint "report submit" "http://localhost:3000/api/reports" "POST" $b 201
if ($rep) { Write-Host "    ID:$($rep.report.id) Status:$($rep.report.status)" }

# Test 10: Reports - retrieve
$reps = Test-Endpoint "reports recent" "http://localhost:3000/api/reports/recent"
if ($reps) { Write-Host "    Count:$($reps.reports.Count) Total:$($reps.total)" }

# Test 11: Feedback - valid
Write-Host "`n--- Feedback ---"
$b = '{"scanId":"scan-test-123","feedbackType":"false_positive","comments":"Legitimate bank SMS","riskScore":75}'
$fb = Test-Endpoint "feedback valid" "http://localhost:3000/api/feedback" "POST" $b
if ($fb) { Write-Host "    Success:$($fb.success)" }

# Test 12: Feedback - invalid type
$b = '{"scanId":"x","feedbackType":"invalid_type"}'
Test-Endpoint "feedback bad type->400" "http://localhost:3000/api/feedback" "POST" $b 400 | Out-Null

Write-Host "`n================================"
Write-Host "  PASSED: $passed   FAILED: $failed"
Write-Host "================================`n"

Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
