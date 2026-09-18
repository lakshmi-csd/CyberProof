const lessons = [
    {
        icon: "🔗",
        title: "Spot Suspicious Links",
        description:
            "Check the domain, spelling, HTTPS connection and unexpected redirects before opening a link.",
        tips: [
            "Look carefully at the domain name.",
            "Watch for unusual spelling.",
            "Do not trust HTTPS alone."
        ]
    },

    {
        icon: "🎣",
        title: "Understand Phishing",
        description:
            "Phishing messages try to make you reveal information or perform an action through deception.",
        tips: [
            "Be careful with urgent requests.",
            "Verify unexpected login requests.",
            "Use official websites directly."
        ]
    },

    {
        icon: "🔐",
        title: "Protect OTPs and Passwords",
        description:
            "Authentication codes and passwords should remain private.",
        tips: [
            "Never share an OTP.",
            "Use strong unique passwords.",
            "Enable multi-factor authentication when available."
        ]
    },

    {
        icon: "💳",
        title: "Recognize Payment Scams",
        description:
            "Unexpected payment requests often use urgency, fear or attractive offers.",
        tips: [
            "Pause before sending money.",
            "Verify the recipient.",
            "Contact the organization independently."
        ]
    },

    {
        icon: "🎓",
        title: "Check Internships and Scholarships",
        description:
            "Fake opportunities may ask for fees, documents or personal information.",
        tips: [
            "Check the official organization.",
            "Verify the opportunity independently.",
            "Be cautious about unexpected fees."
        ]
    },

    {
        icon: "📱",
        title: "Stay Safe With QR Codes",
        description:
            "A QR code can lead to a website or other content that is not immediately visible.",
        tips: [
            "Check the destination after scanning.",
            "Be careful with unexpected QR codes.",
            "Verify payment destinations before paying."
        ]
    }
];


const learningGrid =
    document.getElementById("learningGrid");


function renderLessons() {

    if (!learningGrid) return;

    learningGrid.innerHTML = lessons.map((lesson, index) => {

        return `
            <article class="feature-card">

                <div style="
                    font-size:36px;
                    margin-bottom:18px;
                ">
                    ${lesson.icon}
                </div>

                <small style="
                    font-weight:900;
                    color:#666;
                    font-size:11px;
                ">
                    LESSON ${index + 1}
                </small>

                <h3 style="margin-top:10px;">
                    ${lesson.title}
                </h3>

                <p>
                    ${lesson.description}
                </p>

                <div style="
                    margin-top:20px;
                    padding-top:18px;
                    border-top:1px solid #ddddda;
                ">

                    <strong>
                        Remember
                    </strong>

                    <ul style="
                        margin-top:10px;
                        padding-left:20px;
                    ">

                        ${lesson.tips.map(tip => `
                            <li style="
                                margin-bottom:7px;
                                color:#666;
                            ">
                                ${tip}
                            </li>
                        `).join("")}

                    </ul>

                </div>

            </article>
        `;

    }).join("");
}


renderLessons();