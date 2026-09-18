const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

const API_URL = "http://localhost:5000";

if (signupForm) {
    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !password) {
            showMessage("Please enter your email and password.");
            return;
        }

        if (password.length < 6) {
            showMessage("Password must contain at least 6 characters.");
            return;
        }

        try {
            const response = await fetch(API_URL + "/api/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(data.error || "Signup failed.");
                return;
            }

            showMessage("Account created successfully. You can now login.");
            signupForm.reset();

        } catch (error) {
            console.error("Signup error:", error);
            showMessage("Could not connect to the backend.");
        }
    });
}

function showMessage(message) {
    if (!signupMessage) return;

    signupMessage.textContent = message;
    signupMessage.style.display = "block";
}