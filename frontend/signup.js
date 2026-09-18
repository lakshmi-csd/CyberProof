const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

const API_URL = "https://cyberproof-backend.onrender.com";

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
            const signupResponse = await fetch(`${API_URL}/api/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const signupData = await signupResponse.json();

            if (!signupResponse.ok) {
                showMessage(signupData.error || "Signup failed.");
                return;
            }

            showMessage("Account created! Signing you in...");

            const loginResponse = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const loginData = await loginResponse.json();

            if (!loginResponse.ok) {
                showMessage("Account created. Please sign in once.");
                return;
            }

            if (loginData.token) {
                localStorage.setItem("cyberproofToken", loginData.token);
            }

            if (loginData.user) {
                localStorage.setItem(
                    "cyberproofUser",
                    JSON.stringify(loginData.user)
                );
            }

            signupForm.reset();

            window.location.href = "scanner.html";

        } catch (error) {
            console.error("Signup error:", error);
            showMessage("Could not connect to the backend.");
        }
    });
}

function showMessage(message) {
    if (!signupMessage) {
        return;
    }

    signupMessage.textContent = message;
    signupMessage.style.display = "block";
}