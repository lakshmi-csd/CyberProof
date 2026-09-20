const API_URL = "https://cyberproof-backend.onrender.com/api/analyze";

const scanButton = document.getElementById("scanButton");
const scannerInput = document.getElementById("scannerInput");
const resultBox = document.getElementById("scannerResult");

const qrUploadArea = document.getElementById("qrUploadArea");
const qrCameraBtn = document.getElementById("qrCameraBtn");
const qrUploadBtn = document.getElementById("qrUploadBtn");
const qrPasteBtn = document.getElementById("qrPasteBtn");

const qrCameraBox = document.getElementById("qrCameraBox");
const qrUploadBox = document.getElementById("qrUploadBox");
const qrUrlBox = document.getElementById("qrUrlBox");
const qrFile = document.getElementById("qrFile");
const qrUrlInput = document.getElementById("qrUrlInput");

const expectedDestination =
    document.getElementById("expectedDestination");

let currentType = "url";
let currentContext = "expected";
let qrScanner = null;
let latestAnalysis = null;


function saveToHistory(data) {
    const history =
        JSON.parse(localStorage.getItem("cyberproofHistory")) || [];

    const item = {
        id: Date.now(),
        type: currentType,
        input: data.input || scannerInput?.value || "",
        status: data.status || "VERIFY FIRST",
        action: data.action || "Verify first",
        context: currentContext,
        date: new Date().toLocaleString()
    };

    history.unshift(item);

    localStorage.setItem(
        "cyberproofHistory",
        JSON.stringify(history.slice(0, 100))
    );
}


function createExplanation(data) {
    const evidence = data.evidence || {};

    const identity =
        evidence.identity?.message || "";

    const security =
        evidence.security?.message || "";

    const intent =
        evidence.intent?.message || "";

    const context =
        evidence.context?.message || "";

    const history =
        evidence.history?.message || "";

    const status =
        data.status || "VERIFY FIRST";

    let explanation = "";

    if (status === "HIGH CONCERN") {
        explanation =
            "This result is HIGH CONCERN because the analysis found " +
            "signals that require caution. " +
            intent +
            " " +
            security;
    } else if (status === "VERIFY FIRST") {
        explanation =
            "This result is VERIFY FIRST because some signals need " +
            "additional verification before interacting. " +
            intent +
            " " +
            identity;
    } else {
        explanation =
            "This result is LOW CONCERN because no obvious high-risk " +
            "signals were detected. " +
            identity +
            " " +
            security;
    }

    if (history) {
        explanation +=
            " Threat intelligence: " +
            history +
            ".";
    }

    if (context) {
        explanation +=
            " Context: " +
            context +
            ".";
    }

    return explanation.trim();
}


function applyStatusStyle(statusElement, status) {
    if (!statusElement) return;

    statusElement.classList.remove(
        "status-low",
        "status-verify",
        "status-high"
    );

    if (status === "LOW CONCERN") {
        statusElement.classList.add("status-low");
    } else if (status === "VERIFY FIRST") {
        statusElement.classList.add("status-verify");
    } else if (status === "HIGH CONCERN") {
        statusElement.classList.add("status-high");
    }
}


function updateVirusTotalResult(data) {
    const virusTotalElement =
        document.getElementById("virusTotalResult");

    if (!virusTotalElement) return;

    const historyMessage =
        data.evidence?.history?.message || "";

    if (historyMessage) {
        virusTotalElement.textContent = historyMessage;
        return;
    }

    if (
        currentType === "url" ||
        currentType === "qr"
    ) {
        virusTotalElement.textContent =
            "VirusTotal reputation was not available for this analysis.";
    } else {
        virusTotalElement.textContent =
            "VirusTotal URL reputation is used for website and QR destination analysis.";
    }
}


async function analyzeInput() {
    let input = scannerInput
        ? scannerInput.value.trim()
        : "";

    if (
        currentType === "qr" &&
        qrUrlInput?.value.trim()
    ) {
        input = qrUrlInput.value.trim();

        if (scannerInput) {
            scannerInput.value = input;
        }
    }

    if (!input) {
        alert("Please provide something to analyze.");
        return;
    }

    const token =
        localStorage.getItem("cyberproofToken");

    if (!token) {
        alert("Please login before using the scanner.");
        window.location.href = "login.html";
        return;
    }

    scanButton.disabled = true;
    scanButton.textContent = "Analyzing...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                type: currentType,
                input: input,
                context: currentContext,

                expectedDestination:
                    currentType === "qr"
                        ? expectedDestination?.value.trim() || ""
                        : ""
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("cyberproofToken");
                localStorage.removeItem("cyberproofUser");

                alert("Session expired. Please login again.");

                window.location.href = "login.html";
                return;
            }

            throw new Error(
                data.error || "Backend request failed."
            );
        }

        latestAnalysis = data;

        showResult(data);
        saveToHistory(data);

    } catch (error) {
        console.error(error);

        alert(
            error.message ||
            "Backend connection failed. Make sure server.js is running."
        );

    } finally {
        scanButton.disabled = false;
        scanButton.textContent = "Analyze →";
    }
}


function showResult(data) {
    if (!resultBox) return;

    resultBox.classList.remove("hidden");
    resultBox.classList.add("show");

    const statusElement =
        document.getElementById("resultStatus");

    const actionElement =
        document.getElementById("recommendedAction");

    const actionDescription =
        document.getElementById("actionDescription");

    const inputElement =
        document.getElementById("checkedInput");

    const identity =
        document.getElementById("identityResult");

    const security =
        document.getElementById("securityResult");

    const intent =
        document.getElementById("intentResult");

    const context =
        document.getElementById("contextResult");

    const explanation =
        document.getElementById("explanationResult");

    const detailedReportText =
        document.getElementById("detailedReportText");

    const status =
        data.status || "VERIFY FIRST";

    if (statusElement) {
        statusElement.textContent = status;
        applyStatusStyle(statusElement, status);
    }

    if (actionElement) {
        actionElement.textContent =
            data.action || "Verify first";
    }

    if (actionDescription) {
        if (status === "HIGH CONCERN") {
            actionDescription.textContent =
                "Do not interact until the source has been independently verified.";
        } else if (status === "VERIFY FIRST") {
            actionDescription.textContent =
                "Verify the sender, destination or request before interacting.";
        } else {
            actionDescription.textContent =
                "No obvious high-risk signals were detected. Continue with normal caution.";
        }
    }

    if (inputElement) {
        inputElement.textContent =
            data.input ||
            scannerInput?.value ||
            "";
    }

    if (identity) {
        identity.textContent =
            data.evidence?.identity?.message ||
            "Identity could not be verified.";
    }

    if (security) {
        security.textContent =
            data.evidence?.security?.message ||
            "Security details unavailable.";
    }

    if (intent) {
        intent.textContent =
            data.evidence?.intent?.message ||
            "Intent could not be determined.";
    }

    if (context) {
        context.textContent =
            data.evidence?.context?.message ||
            currentContext ||
            "Context unavailable.";
    }

    updateEvidenceIcons(data);
    updateVirusTotalResult(data);

    if (explanation) {
        explanation.textContent =
            createExplanation(data);
    }

    if (detailedReportText) {
        detailedReportText.textContent =
            createDetailedReport(data);
    }
}


function updateEvidenceIcons(data) {
    const status =
        data.status || "VERIFY FIRST";

    const identityIcon =
        document.getElementById("identityIcon");

    const securityIcon =
        document.getElementById("securityIcon");

    const intentIcon =
        document.getElementById("intentIcon");

    const contextIcon =
        document.getElementById("contextIcon");

    if (status === "HIGH CONCERN") {
        if (identityIcon) identityIcon.textContent = "⚠";
        if (securityIcon) securityIcon.textContent = "⚠";
        if (intentIcon) intentIcon.textContent = "⚠";
        if (contextIcon) contextIcon.textContent = "⚠";
    } else if (status === "VERIFY FIRST") {
        if (identityIcon) identityIcon.textContent = "⚠";
        if (securityIcon) securityIcon.textContent = "⚠";
        if (intentIcon) intentIcon.textContent = "⚠";
        if (contextIcon) contextIcon.textContent = "🟡";
    } else {
        if (identityIcon) identityIcon.textContent = "✓";
        if (securityIcon) securityIcon.textContent = "✓";
        if (intentIcon) intentIcon.textContent = "✓";
        if (contextIcon) contextIcon.textContent = "🟢";
    }
}


function createDetailedReport(data) {
    const evidence = data.evidence || {};

    return [
        `Result: ${data.status || "VERIFY FIRST"}`,
        `Recommended action: ${data.action || "Verify first"}`,
        `Identity: ${evidence.identity?.message || "Unavailable"}`,
        `Security: ${evidence.security?.message || "Unavailable"}`,
        `Intent: ${evidence.intent?.message || "Unavailable"}`,
        `Context: ${evidence.context?.message || "Unavailable"}`,
        `Threat intelligence: ${evidence.history?.message || "Unavailable"}`,
        `Input type: ${data.type || currentType}`
    ].join(" | ");
}


function showQrBox(box) {
    if (qrCameraBox) qrCameraBox.classList.remove("active");
    if (qrUploadBox) qrUploadBox.classList.remove("active");
    if (qrUrlBox) qrUrlBox.classList.remove("active");

    if (box) {
        box.classList.add("active");
    }
}


async function stopQrCamera() {
    if (qrScanner) {
        try {
            await qrScanner.stop();
            await qrScanner.clear();
        } catch {
            console.log("QR camera already stopped.");
        }

        qrScanner = null;
    }
}


async function startQrCamera() {
    await stopQrCamera();

    if (!window.Html5Qrcode) {
        alert("QR scanner library could not load.");
        return;
    }

    showQrBox(qrCameraBox);

    qrScanner =
        new Html5Qrcode("qr-reader");

    try {
        await qrScanner.start(
            { facingMode: "environment" },

            {
                fps: 10,

                qrbox: {
                    width: 250,
                    height: 250
                }
            },

            decodedText => {
                if (scannerInput) {
                    scannerInput.value = decodedText;
                }

                if (qrUrlInput) {
                    qrUrlInput.value = decodedText;
                }

                stopQrCamera();

                alert("QR destination detected!");
            },

            () => {}
        );

    } catch (error) {
        console.error(
            "QR camera error:",
            error
        );

        alert(
            "Could not start the camera. You can use Upload QR Image instead."
        );
    }
}


async function scanQrImage(file) {
    if (!file) return;

    if (!window.Html5Qrcode) {
        alert("QR scanner library could not load.");
        return;
    }

    try {
        const scanner =
            new Html5Qrcode("qr-reader");

        const decodedText =
            await scanner.scanFile(
                file,
                true
            );

        if (scannerInput) {
            scannerInput.value = decodedText;
        }

        if (qrUrlInput) {
            qrUrlInput.value = decodedText;
        }

        alert("QR destination detected!");

    } catch (error) {
        console.error(
            "QR image error:",
            error
        );

        alert(
            "Could not read a QR code from this image. Try a clearer QR image."
        );
    }
}


function setScannerType(type) {
    currentType = type;

    stopQrCamera();

    document.querySelectorAll(
        ".scanner-tab"
    ).forEach(tab => {
        tab.classList.remove("active");

        if (tab.dataset.type === type) {
            tab.classList.add("active");
        }
    });

    const title =
        document.getElementById("scannerTitle");

    const description =
        document.getElementById("scannerDescription");

    const inputHint =
        document.getElementById("inputHint");

    if (type === "qr") {
        if (qrUploadArea) {
            qrUploadArea.style.display = "block";
        }

        if (scannerInput) {
            scannerInput.style.display = "none";
        }

        if (inputHint) {
            inputHint.textContent = "QR CODE";
        }

        if (title) {
            title.textContent =
                "Check a QR Code";
        }

        if (description) {
            description.textContent =
                "Verify where a QR code actually leads.";
        }

    } else {
        if (qrUploadArea) {
            qrUploadArea.style.display = "none";
        }

        if (scannerInput) {
            scannerInput.style.display = "block";
        }

        if (inputHint) {
            if (type === "url") {
                inputHint.textContent =
                    "PASTE A URL";
            }

            if (type === "message") {
                inputHint.textContent =
                    "PASTE A MESSAGE";
            }

            if (type === "email") {
                inputHint.textContent =
                    "PASTE AN EMAIL";
            }

            if (type === "otp") {
                inputHint.textContent =
                    "PASTE THE OTP REQUEST";
            }
        }

        if (scannerInput) {
            if (type === "url") {
                scannerInput.placeholder =
                    "Paste a website URL here...";
            }

            if (type === "message") {
                scannerInput.placeholder =
                    "Paste the message or SMS here...";
            }

            if (type === "email") {
                scannerInput.placeholder =
                    "Paste the email content here...";
            }

            if (type === "otp") {
                scannerInput.placeholder =
                    "Paste the OTP request here...";
            }
        }

        if (title) {
            if (type === "url") {
                title.textContent =
                    "Check a website";
            }

            if (type === "message") {
                title.textContent =
                    "Check a Message";
            }

            if (type === "email") {
                title.textContent =
                    "Check an Email";
            }

            if (type === "otp") {
                title.textContent =
                    "Check an OTP Request";
            }
        }

        if (description) {
            if (type === "url") {
                description.textContent =
                    "Analyze a website address for suspicious patterns, security signals and potential risk.";
            }

            if (type === "message") {
                description.textContent =
                    "Check messages for phishing and scam signals.";
            }

            if (type === "email") {
                description.textContent =
                    "Analyze emails for suspicious links and requests.";
            }

            if (type === "otp") {
                description.textContent =
                    "Check whether an OTP request contains suspicious or risky signals.";
            }
        }
    }
}


function setContext(context) {
    currentContext = context;

    document.querySelectorAll(
        ".context-option"
    ).forEach(option => {
        option.classList.remove("active");

        if (option.dataset.context === context) {
            option.classList.add("active");
        }
    });
}


function resetScanner() {
    if (resultBox) {
        resultBox.classList.remove("show");
        resultBox.classList.add("hidden");
    }

    if (scannerInput) {
        scannerInput.value = "";
    }

    if (qrUrlInput) {
        qrUrlInput.value = "";
    }

    if (expectedDestination) {
        expectedDestination.value = "";
    }

    const reportBox =
        document.getElementById("detailedReportBox");

    if (reportBox) {
        reportBox.style.display = "none";
    }

    latestAnalysis = null;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function setupResultButtons() {
    const scanAgainButton =
        document.getElementById("scanAgainButton");

    const reportButton =
        document.getElementById("reportButton");

    const reportBox =
        document.getElementById("detailedReportBox");

    if (scanAgainButton) {
        scanAgainButton.addEventListener(
            "click",
            resetScanner
        );
    }

    if (reportButton) {
        reportButton.addEventListener(
            "click",
            () => {
                if (!reportBox) return;

                if (
                    reportBox.style.display === "none" ||
                    !reportBox.style.display
                ) {
                    reportBox.style.display = "block";
                    reportButton.textContent =
                        "Hide Detailed Report";
                } else {
                    reportBox.style.display = "none";
                    reportButton.textContent =
                        "View Detailed Report";
                }
            }
        );
    }
}


if (scanButton) {
    scanButton.addEventListener(
        "click",
        analyzeInput
    );
}


document.querySelectorAll(
    ".scanner-tab"
).forEach(tab => {
    tab.addEventListener(
        "click",
        () => {
            setScannerType(
                tab.dataset.type
            );
        }
    );
});


document.querySelectorAll(
    ".context-option"
).forEach(option => {
    option.addEventListener(
        "click",
        () => {
            setContext(
                option.dataset.context
            );
        }
    );
});


if (qrCameraBtn) {
    qrCameraBtn.addEventListener(
        "click",
        startQrCamera
    );
}


if (qrUploadBtn) {
    qrUploadBtn.addEventListener(
        "click",
        () => {
            showQrBox(qrUploadBox);

            if (qrFile) {
                qrFile.click();
            }
        }
    );
}


if (qrPasteBtn) {
    qrPasteBtn.addEventListener(
        "click",
        () => {
            showQrBox(qrUrlBox);

            if (qrUrlInput) {
                qrUrlInput.focus();
            }
        }
    );
}


if (qrFile) {
    qrFile.addEventListener(
        "change",
        event => {
            const file =
                event.target.files[0];

            if (file) {
                scanQrImage(file);
            }
        }
    );
}


setupResultButtons();

setContext("expected");
setScannerType("url");
