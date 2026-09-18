const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const https = require("https");
require("dotenv").config();

const User = require("./models/User");
const Scan = require("./models/Scan");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;

// =========================
// AUTH
// =========================

function authenticateToken(req, res, next) {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({
            error: "Authentication required."
        });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({
            error: "Invalid or expired token."
        });
    }
}

// =========================
// URL HELPERS
// =========================

function isValidUrl(value) {
    try {
        const url = new URL(value);

        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );
    } catch {
        return false;
    }
}

function normalizeUrl(value) {
    try {
        const url = new URL(value.trim());

        return (
            url.protocol.toLowerCase() +
            "//" +
            url.hostname.toLowerCase() +
            url.pathname.replace(/\/$/, "")
        );
    } catch {
        return value.trim().toLowerCase();
    }
}

function isIpAddress(hostname) {
    const parts = hostname.split(".");

    if (parts.length !== 4) {
        return false;
    }

    return parts.every(part => {
        const number = Number(part);

        return (
            part !== "" &&
            Number.isInteger(number) &&
            number >= 0 &&
            number <= 255
        );
    });
}

// =========================
// BASE EVIDENCE
// =========================

function baseEvidence() {
    return {
        identity: {
            message: "Identity could not be fully verified."
        },
        security: {
            message: "Security information is limited."
        },
        intent: {
            message: "Intent could not be fully determined."
        },
        context: {
            message: "Context will be considered."
        },
        history: {
            message: "No previous history available."
        }
    };
}

// =========================
// CONTEXT
// =========================

function applyContext(result, context) {
    if (context === "expected") {
        result.evidence.context = {
            message: "You expected this content or link."
        };
    }

    if (context === "unexpected") {
        result.evidence.context = {
            message: "You did not expect this content or link."
        };

        if (result.status === "LOW CONCERN") {
            result.status = "VERIFY FIRST";
            result.action = "Verify first";
        }
    }

    if (context === "unknown") {
        result.evidence.context = {
            message: "You are not sure whether you expected this."
        };

        if (result.status === "LOW CONCERN") {
            result.status = "VERIFY FIRST";
            result.action = "Verify first";
        }
    }

    return result;
}

// =========================
// WEBSITE / URL ANALYSIS
// =========================

function analyzeUrl(input) {
    let url;

    try {
        url = new URL(input.trim());
    } catch {
        return {
            status: "VERIFY FIRST",
            evidence: {
                identity: {
                    message: "This is not a valid website URL."
                },
                security: {
                    message: "Security could not be checked."
                },
                intent: {
                    message: "Website intent could not be determined."
                },
                context: {
                    message: "Context unavailable."
                },
                history: {
                    message: "No previous history available."
                }
            },
            action: "Verify first"
        };
    }

    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    const suspiciousWords = [
        "login",
        "verify",
        "account",
        "secure",
        "update",
        "payment",
        "wallet",
        "bonus",
        "reward",
        "claim",
        "password",
        "signin",
        "sign-in"
    ];

    const downloadWords = [
        "download",
        "install",
        ".exe",
        ".apk",
        ".zip"
    ];

    const sensitiveWords = [
        "login",
        "signin",
        "password",
        "payment",
        "account",
        "bank",
        "wallet"
    ];

    let suspicious = false;
    let download = false;
    let sensitive = false;

    for (const word of suspiciousWords) {
        if (
            hostname.includes(word) ||
            pathname.includes(word)
        ) {
            suspicious = true;
            break;
        }
    }

    for (const word of downloadWords) {
        if (
            hostname.includes(word) ||
            pathname.includes(word)
        ) {
            download = true;
            break;
        }
    }

    for (const word of sensitiveWords) {
        if (
            pathname.includes(word) ||
            hostname.includes(word)
        ) {
            sensitive = true;
            break;
        }
    }

    const ipAddress = isIpAddress(hostname);
    const httpsConnection = url.protocol === "https:";

    let status = "LOW CONCERN";
    let action = "Proceed";

    let identityMessage =
        "Website address structure is readable.";

    let securityMessage = httpsConnection
        ? "HTTPS connection is used."
        : "Website is not using HTTPS.";

    let intentMessage =
        "No obvious high-risk intent detected.";

    if (ipAddress) {
        identityMessage =
            "Website uses a direct IP address instead of a normal domain name.";

        status = "VERIFY FIRST";
        action = "Verify first";
    }

    if (suspicious) {
        identityMessage =
            "URL contains a potentially sensitive or deceptive pattern.";

        intentMessage =
            "URL may involve login, account, payment, verification, or reward activity.";

        status = "VERIFY FIRST";
        action = "Verify first";
    }

    if (sensitive) {
        intentMessage =
            "URL appears related to login, account, password, banking, or payment activity.";

        status = "VERIFY FIRST";
        action = "Verify first";
    }

    if (download) {
        intentMessage =
            "URL appears to involve downloading or installing content.";

        status = "VERIFY FIRST";
        action = "Verify first";
    }

    if (!httpsConnection) {
        securityMessage =
            "The website is not using HTTPS.";

        if (
            suspicious ||
            sensitive ||
            download ||
            ipAddress
        ) {
            status = "HIGH CONCERN";
            action = "Do not interact";
        } else {
            status = "VERIFY FIRST";
            action = "Verify first";
        }
    }

    return {
        status,
        evidence: {
            identity: {
                message: identityMessage
            },
            security: {
                message: securityMessage
            },
            intent: {
                message: intentMessage
            },
            context: {
                message: "Context will be considered."
            },
            history: {
                message: "No previous history available."
            }
        },
        action
    };
}

// =========================
// MESSAGE / EMAIL
// =========================

function analyzeText(input) {
    const text = input.toLowerCase();

    const hasLink =
        text.includes("http://") ||
        text.includes("https://") ||
        text.includes("www.");

    const urgencyWords = [
        "urgent",
        "immediately",
        "act now",
        "hurry",
        "last chance",
        "expires",
        "within 24 hours",
        "blocked",
        "suspended"
    ];

    const sensitiveWords = [
        "otp",
        "password",
        "pin",
        "cvv",
        "card number",
        "bank account",
        "verification code",
        "login details"
    ];

    const rewardWords = [
        "winner",
        "won",
        "prize",
        "reward",
        "bonus",
        "free money",
        "cashback"
    ];

    const paymentWords = [
        "send money",
        "transfer money",
        "pay now",
        "upi",
        "payment",
        "registration fee",
        "processing fee"
    ];

    const impersonationWords = [
        "official",
        "customer support",
        "account team",
        "bank support",
        "security team",
        "verify your account"
    ];

    const urgency =
        urgencyWords.some(word => text.includes(word));

    const sensitive =
        sensitiveWords.some(word => text.includes(word));

    const reward =
        rewardWords.some(word => text.includes(word));

    const payment =
        paymentWords.some(word => text.includes(word));

    const impersonation =
        impersonationWords.some(word =>
            text.includes(word)
        );

    let status = "LOW CONCERN";

    if (sensitive && (hasLink || urgency)) {
        status = "HIGH CONCERN";
    } else if (payment && (hasLink || urgency)) {
        status = "HIGH CONCERN";
    } else if (impersonation && sensitive) {
        status = "HIGH CONCERN";
    } else if (
        urgency ||
        reward ||
        hasLink ||
        payment ||
        impersonation
    ) {
        status = "VERIFY FIRST";
    }

    let identity =
        "No obvious impersonation signal detected.";

    if (impersonation) {
        identity =
            "Message contains language that may imitate an organization or support team.";
    }

    let security =
        "No suspicious link detected.";

    if (hasLink) {
        security =
            "Message contains a link that should be checked.";
    }

    let intent =
        "No obvious high-risk request detected.";

    if (sensitive) {
        intent =
            "Message requests sensitive information.";
    } else if (payment) {
        intent =
            "Message requests payment or money transfer.";
    } else if (reward) {
        intent =
            "Message contains a reward or prize claim.";
    } else if (hasLink) {
        intent =
            "Message contains a link that requires verification.";
    }

    let action = "Proceed";

    if (status === "VERIFY FIRST") {
        action = "Verify first";
    }

    if (status === "HIGH CONCERN") {
        action = "Do not interact";
    }

    return {
        status,
        evidence: {
            identity: {
                message: identity
            },
            security: {
                message: security
            },
            intent: {
                message: intent
            },
            context: {
                message: "Context will be considered."
            },
            history: {
                message: "No previous history available."
            }
        },
        action
    };
}

// =========================
// OTP ANALYSIS
// =========================

function analyzeOtp(input) {
    const text = input.toLowerCase();

    const asksToShareOtp =
        text.includes("share otp") ||
        text.includes("tell me otp") ||
        text.includes("send otp") ||
        text.includes("give otp") ||
        text.includes("share the otp") ||
        text.includes("send the otp");

    const mentionsVerificationCode =
        text.includes("verification code") ||
        text.includes("one time password") ||
        text.includes("otp");

    const urgency =
        text.includes("urgent") ||
        text.includes("immediately") ||
        text.includes("act now") ||
        text.includes("expires") ||
        text.includes("within");

    if (
        asksToShareOtp ||
        (mentionsVerificationCode && urgency)
    ) {
        return {
            status: "HIGH CONCERN",
            evidence: {
                identity: {
                    message:
                        "The request asks for an authentication code."
                },
                security: {
                    message:
                        "OTP or verification codes should not be shared with another person."
                },
                intent: {
                    message:
                        "The request may attempt to obtain an authentication credential."
                },
                context: {
                    message:
                        "OTP requests require careful verification."
                },
                history: {
                    message:
                        "No previous incident history available."
                }
            },
            action: "Do not interact"
        };
    }

    return {
        status: "VERIFY FIRST",
        evidence: {
            identity: {
                message:
                    "The source of the OTP request should be verified."
            },
            security: {
                message:
                    "Never disclose an OTP unless you are completing the intended authentication flow yourself."
            },
            intent: {
                message:
                    "OTP activity can involve account authentication."
            },
            context: {
                message:
                    "Verify who initiated the authentication request."
            },
            history: {
                message:
                    "No previous incident history available."
            }
        },
        action: "Verify first"
    };
}

// =========================
// WEBSITE VERIFY
// =========================

function analyzeWebsiteVerification(input) {
    const result = analyzeUrl(input);

    result.evidence.identity = {
        message:
            "Website identity was checked using its domain structure and URL characteristics."
    };

    result.evidence.security = {
        message:
            result.status === "HIGH CONCERN"
                ? "Website has security signals requiring strong caution."
                : "Basic website security indicators were reviewed."
    };

    return result;
}

// =========================
// INCIDENT CHECK
// =========================

function analyzeIncident(input) {
    const text = input.toLowerCase();

    const indicators = [
        "fraud",
        "scam",
        "phishing",
        "unauthorized",
        "unknown payment",
        "unknown transaction",
        "otp",
        "account hacked",
        "fake website",
        "money stolen",
        "suspicious login"
    ];

    const detected = indicators.filter(word =>
        text.includes(word)
    );

    if (detected.length >= 2) {
        return {
            status: "HIGH CONCERN",
            evidence: {
                identity: {
                    message:
                        "The incident description contains multiple security-related indicators."
                },
                security: {
                    message:
                        "Potential account, payment, phishing, or unauthorized-access signals were detected."
                },
                intent: {
                    message:
                        "The incident may require immediate verification and reporting."
                },
                context: {
                    message:
                        "Incident context indicates a possible security event."
                },
                history: {
                    message:
                        "This is an initial assessment, not a confirmed incident investigation."
                }
            },
            action: "Report incident"
        };
    }

    if (detected.length === 1) {
        return {
            status: "VERIFY FIRST",
            evidence: {
                identity: {
                    message:
                        "The incident contains one security-related indicator."
                },
                security: {
                    message:
                        "Additional details are needed to assess the incident."
                },
                intent: {
                    message:
                        "The situation may require verification."
                },
                context: {
                    message:
                        "Incident context is partially available."
                },
                history: {
                    message:
                        "No confirmed incident history available."
                }
            },
            action: "Verify first"
        };
    }

    return {
        status: "LOW CONCERN",
        evidence: {
            identity: {
                message:
                    "No obvious security incident indicator was detected."
            },
            security: {
                message:
                    "No strong fraud or unauthorized-access signal was detected."
            },
            intent: {
                message:
                    "No obvious malicious intent was identified."
            },
            context: {
                message:
                    "Incident information appears limited."
            },
            history: {
                message:
                    "No confirmed incident history available."
            }
        },
        action: "Proceed"
    };
}

// =========================
// VIRUSTOTAL
// =========================

function getVirusTotalUrlId(input) {
    return Buffer
        .from(input.trim())
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function getVirusTotalReport(input) {
    return new Promise(resolve => {
        if (!VIRUSTOTAL_API_KEY) {
            resolve({
                available: false,
                message: "VirusTotal API is not configured."
            });
            return;
        }

        const urlId = getVirusTotalUrlId(input);

        const options = {
            hostname: "www.virustotal.com",
            path: "/api/v3/urls/" + urlId,
            method: "GET",
            headers: {
                "x-apikey": VIRUSTOTAL_API_KEY,
                "Accept": "application/json"
            }
        };

        const request = https.request(
            options,
            response => {
                let body = "";

                response.on("data", chunk => {
                    body += chunk;
                });

                response.on("end", () => {
                    if (response.statusCode !== 200) {
                        resolve({
                            available: false,
                            message:
                                "VirusTotal reputation could not be retrieved."
                        });
                        return;
                    }

                    try {
                        const parsed = JSON.parse(body);

                        const stats =
                            parsed.data?.attributes
                                ?.last_analysis_stats;

                        if (!stats) {
                            resolve({
                                available: false,
                                message:
                                    "VirusTotal did not return reputation statistics."
                            });
                            return;
                        }

                        const malicious =
                            Number(stats.malicious || 0);

                        const suspicious =
                            Number(stats.suspicious || 0);

                        const harmless =
                            Number(stats.harmless || 0);

                        if (malicious > 0) {
                            resolve({
                                available: true,
                                malicious,
                                suspicious,
                                harmless,
                                message:
                                    malicious +
                                    " security engine(s) flagged this URL as malicious."
                            });
                            return;
                        }

                        if (suspicious > 0) {
                            resolve({
                                available: true,
                                malicious,
                                suspicious,
                                harmless,
                                message:
                                    suspicious +
                                    " security engine(s) flagged this URL as suspicious."
                            });
                            return;
                        }

                        resolve({
                            available: true,
                            malicious: 0,
                            suspicious: 0,
                            harmless,
                            message:
                                "VirusTotal did not report malicious or suspicious detections."
                        });
                    } catch {
                        resolve({
                            available: false,
                            message:
                                "VirusTotal response could not be read."
                        });
                    }
                });
            }
        );

        request.on("error", () => {
            resolve({
                available: false,
                message:
                    "VirusTotal connection failed."
            });
        });

        request.setTimeout(8000, () => {
            request.destroy();

            resolve({
                available: false,
                message:
                    "VirusTotal request timed out."
            });
        });

        request.end();
    });
}

function applyVirusTotalResult(result, vtResult) {
    if (!vtResult || !vtResult.available) {
        return result;
    }

    result.evidence.history = {
        message: vtResult.message
    };

    if (vtResult.malicious > 0) {
        result.status = "HIGH CONCERN";
        result.action = "Do not interact";

        result.evidence.security = {
            message:
                "VirusTotal found malicious detections for this URL."
        };

        result.evidence.intent = {
            message:
                "External threat intelligence indicates this URL requires strong caution."
        };

        return result;
    }

    if (vtResult.suspicious > 0) {
        if (result.status === "LOW CONCERN") {
            result.status = "VERIFY FIRST";
            result.action = "Verify first";
        }

        result.evidence.security = {
            message:
                "VirusTotal found suspicious detections for this URL."
        };
    }

    return result;
}

// =========================
// SIGNUP
// =========================

app.post("/api/signup", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({
                error:
                    "Email and password are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error:
                    "Password must contain at least 6 characters."
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingUser) {
            return res.status(409).json({
                error:
                    "An account with this email already exists."
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user =
            await User.create({
                email: normalizedEmail,
                password: hashedPassword
            });

        res.status(201).json({
            message:
                "Account created successfully.",
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (error) {
        console.error(
            "Signup error:",
            error
        );

        res.status(500).json({
            error:
                "Could not create account."
        });
    }
});

// =========================
// LOGIN
// =========================

app.post("/api/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({
                error:
                    "Email and password are required."
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        if (!user) {
            return res.status(401).json({
                error:
                    "Invalid email or password."
            });
        }

        const match =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!match) {
            return res.status(401).json({
                error:
                    "Invalid email or password."
            });
        }

        const token =
            jwt.sign(
                {
                    userId: user._id,
                    email: user.email
                },
                JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );

        res.json({
            message:
                "Login successful.",
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            error:
                "Login failed."
        });
    }
});

// =========================
// ANALYZE
// =========================

app.post(
    "/api/analyze",
    authenticateToken,
    async (req, res) => {
        try {
            const type = req.body.type;
            const input = req.body.input;
            const context =
                req.body.context || "unknown";

            const expectedDestination =
                req.body.expectedDestination || "";

            if (
                !input ||
                typeof input !== "string"
            ) {
                return res.status(400).json({
                    error:
                        "Input is required."
                });
            }

            let result;

            // WEBSITE
            if (type === "url") {
                result = analyzeUrl(input);

                const vtResult =
                    await getVirusTotalReport(input);

                result =
                    applyVirusTotalResult(
                        result,
                        vtResult
                    );
            }

            // QR
            else if (type === "qr") {
                if (!isValidUrl(input)) {
                    result = {
                        status: "VERIFY FIRST",
                        evidence: {
                            identity: {
                                message:
                                    "QR does not contain a valid website URL."
                            },
                            security: {
                                message:
                                    "Destination URL could not be checked."
                            },
                            intent: {
                                message:
                                    "QR destination could not be determined."
                            },
                            context: {
                                message:
                                    "Context will be considered."
                            },
                            history: {
                                message:
                                    "No previous history available."
                            }
                        },
                        action:
                            "Verify first"
                    };
                } else {
                    result =
                        analyzeUrl(input);

                    const vtResult =
                        await getVirusTotalReport(input);

                    result =
                        applyVirusTotalResult(
                            result,
                            vtResult
                        );

                    if (
                        expectedDestination &&
                        isValidUrl(
                            expectedDestination
                        )
                    ) {
                        const actual =
                            normalizeUrl(input);

                        const expected =
                            normalizeUrl(
                                expectedDestination
                            );

                        if (actual !== expected) {
                            result.status =
                                "HIGH CONCERN";

                            result.evidence.identity = {
                                message:
                                    "QR destination does not match the expected destination."
                            };

                            result.evidence.intent = {
                                message:
                                    "The QR destination differs from the expected destination."
                            };

                            result.action =
                                "Do not interact";
                        } else {
                            result.evidence.identity = {
                                message:
                                    "QR destination matches the expected destination."
                            };
                        }
                    }
                }
            }

            // EMAIL / MESSAGE
            else if (
                type === "message" ||
                type === "email"
            ) {
                result =
                    analyzeText(input);
            }

            // OTP
            else if (type === "otp") {
                result =
                    analyzeOtp(input);
            }

            // WEBSITE VERIFY
            else if (type === "website") {
                result =
                    analyzeWebsiteVerification(input);

                if (isValidUrl(input)) {
                    const vtResult =
                        await getVirusTotalReport(input);

                    result =
                        applyVirusTotalResult(
                            result,
                            vtResult
                        );
                }
            }

            // INCIDENT CHECK
            else if (type === "incident") {
                result =
                    analyzeIncident(input);
            }

            else {
                return res.status(400).json({
                    error:
                        "Unsupported scanner type."
                });
            }

            result =
                applyContext(
                    result,
                    context
                );

            result.input = input;
            result.context = context;
            result.type = type;

            const scan =
                await Scan.create({
                    userId:
                        req.user.userId,
                    type,
                    input,
                    status:
                        result.status,
                    action:
                        result.action,
                    context
                });

            result.scanId =
                scan._id;

            res.json(result);
        } catch (error) {
            console.error(
                "Analyze error:",
                error
            );

            res.status(500).json({
                error:
                    "Analysis failed."
            });
        }
    }
);

// =========================
// HISTORY
// =========================

app.get(
    "/api/history",
    authenticateToken,
    async (req, res) => {
        try {
            const filter = {
                userId:
                    req.user.userId
            };

            if (
                req.query.type &&
                req.query.type !== "all"
            ) {
                filter.type =
                    req.query.type;
            }

            const scans =
                await Scan.find(filter)
                    .sort({
                        createdAt: -1
                    })
                    .limit(100);

            res.json(scans);
        } catch (error) {
            console.error(
                "History error:",
                error
            );

            res.status(500).json({
                error:
                    "Could not load scan history."
            });
        }
    }
);

// =========================
// DETAILED REPORT
// =========================

app.get(
    "/api/report/:id",
    authenticateToken,
    async (req, res) => {
        try {
            const scan =
                await Scan.findOne({
                    _id:
                        req.params.id,
                    userId:
                        req.user.userId
                });

            if (!scan) {
                return res.status(404).json({
                    error:
                        "Scan report not found."
                });
            }

            let analysis;

            if (
                scan.type === "url" ||
                scan.type === "website" ||
                scan.type === "qr"
            ) {
                analysis =
                    analyzeUrl(
                        scan.input
                    );
            } else if (
                scan.type === "email" ||
                scan.type === "message"
            ) {
                analysis =
                    analyzeText(
                        scan.input
                    );
            } else if (scan.type === "otp") {
                analysis =
                    analyzeOtp(
                        scan.input
                    );
            } else if (scan.type === "incident") {
                analysis =
                    analyzeIncident(
                        scan.input
                    );
            } else {
                analysis = {
                    status:
                        scan.status,
                    action:
                        scan.action,
                    evidence:
                        baseEvidence()
                };
            }

            analysis.scan = scan;

            res.json(analysis);
        } catch (error) {
            console.error(
                "Report error:",
                error
            );

            res.status(500).json({
                error:
                    "Could not load detailed report."
            });
        }
    }
);

// =========================
// TIMELINE
// =========================

app.get(
    "/api/timeline",
    authenticateToken,
    async (req, res) => {
        try {
            const scans =
                await Scan.find({
                    userId:
                        req.user.userId
                })
                    .sort({
                        createdAt: 1
                    })
                    .limit(100);

            const timeline =
                scans.map(scan => ({
                    date:
                        scan.createdAt,
                    type:
                        scan.type,
                    status:
                        scan.status,
                    action:
                        scan.action,
                    input:
                        scan.input
                }));

            res.json(timeline);
        } catch (error) {
            console.error(
                "Timeline error:",
                error
            );

            res.status(500).json({
                error:
                    "Could not load trust timeline."
            });
        }
    }
);

// =========================
// DASHBOARD
// =========================

app.get(
    "/api/dashboard",
    authenticateToken,
    async (req, res) => {
        try {
            const scans =
                await Scan.find({
                    userId:
                        req.user.userId
                })
                    .sort({
                        createdAt: -1
                    })
                    .limit(100);

            const summary = {
                total:
                    scans.length,

                lowConcern:
                    scans.filter(
                        scan =>
                            scan.status ===
                            "LOW CONCERN"
                    ).length,

                verifyFirst:
                    scans.filter(
                        scan =>
                            scan.status ===
                            "VERIFY FIRST"
                    ).length,

                highConcern:
                    scans.filter(
                        scan =>
                            scan.status ===
                            "HIGH CONCERN"
                    ).length,

                url:
                    scans.filter(
                        scan =>
                            scan.type === "url"
                    ).length,

                qr:
                    scans.filter(
                        scan =>
                            scan.type === "qr"
                    ).length,

                email:
                    scans.filter(
                        scan =>
                            scan.type === "email"
                    ).length,

                message:
                    scans.filter(
                        scan =>
                            scan.type === "message"
                    ).length,

                otp:
                    scans.filter(
                        scan =>
                            scan.type === "otp"
                    ).length,

                website:
                    scans.filter(
                        scan =>
                            scan.type === "website"
                    ).length,

                incident:
                    scans.filter(
                        scan =>
                            scan.type === "incident"
                    ).length
            };

            res.json(summary);
        } catch (error) {
            console.error(
                "Dashboard error:",
                error
            );

            res.status(500).json({
                error:
                    "Could not load dashboard."
            });
        }
    }
);

// =========================
// HEALTH
// =========================

app.get("/", (req, res) => {
    res.send(
        "CyberProof backend is running."
    );
});

// =========================
// START SERVER
// =========================

async function startServer() {
    try {
        if (!MONGODB_URI) {
            throw new Error(
                "MONGODB_URI is missing in .env"
            );
        }

        if (!JWT_SECRET) {
            throw new Error(
                "JWT_SECRET is missing in .env"
            );
        }

        if (!VIRUSTOTAL_API_KEY) {
            console.log(
                "Warning: VIRUSTOTAL_API_KEY is missing."
            );
        } else {
            console.log(
                "VirusTotal API key detected."
            );
        }

        await mongoose.connect(
            MONGODB_URI
        );

        console.log(
            "MongoDB connected successfully."
        );

        app.listen(
            PORT,
            "0.0.0.0",
            () => {
                console.log(
                    `CyberProof backend running on port ${PORT}`
                );
            }
        );
    } catch (error) {
        console.error(
            "MongoDB connection failed:"
        );

        console.error(
            error.message
        );
    }
}

startServer();