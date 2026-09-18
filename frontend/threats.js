var threatList = document.getElementById("threatList");
var threatSummary = document.getElementById("threatSummary");

if (threatSummary) {
    threatSummary.innerHTML =
        "<h3>Current Safety Pulse</h3>" +
        "<p>Watch for common digital scam and social-engineering patterns.</p>";
}

if (threatList) {
    threatList.innerHTML =
        "<article class='feature-card'>" +
        "<h3>Phishing</h3>" +
        "<p>Fake login requests may try to steal account information.</p>" +
        "<p><strong>Safe action:</strong> Open the official service directly.</p>" +
        "</article>" +

        "<article class='feature-card'>" +
        "<h3>Payment Scam</h3>" +
        "<p>Urgent payment requests may try to make users act quickly.</p>" +
        "<p><strong>Safe action:</strong> Verify the request independently.</p>" +
        "</article>" +

        "<article class='feature-card'>" +
        "<h3>Impersonation</h3>" +
        "<p>A message may pretend to come from a trusted person or organization.</p>" +
        "<p><strong>Safe action:</strong> Confirm the identity independently.</p>" +
        "</article>" +

        "<article class='feature-card'>" +
        "<h3>Scholarship Scam</h3>" +
        "<p>Fake scholarship offers may request money or personal information.</p>" +
        "<p><strong>Safe action:</strong> Verify the scholarship through the official organization.</p>" +
        "</article>" +

        "<article class='feature-card'>" +
        "<h3>Internship Scam</h3>" +
        "<p>Fake internships may request payments or personal information.</p>" +
        "<p><strong>Safe action:</strong> Check the organization through official channels.</p>" +
        "</article>" +

        "<article class='feature-card'>" +
        "<h3>Credential Theft</h3>" +
        "<p>Unexpected OTP, password or PIN requests can be suspicious.</p>" +
        "<p><strong>Safe action:</strong> Never share authentication codes.</p>" +
        "</article>";
}