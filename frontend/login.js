const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const API_URL = "http://localhost:5000";

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        if (!email || !password) {
            showMessage("Please enter your email and password.");
            return;
        }

        if (password.length < 6) {
            showMessage("Password must contain at least 6 characters.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/login`, {
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
                showMessage(data.error || "Login failed.");
                return;
            }

            if (!data.token) {
                showMessage("Login failed: token was not received.");
                return;
            }

            localStorage.setItem(
                "cyberproofToken",
                data.token
            );

            localStorage.setItem(
                "cyberproofUser",
                data.user?.email || email
            );

            showMessage("Login successful!");

            setTimeout(function () {
                window.location.href = "scanner.html";
            }, 500);

        } catch (error) {
            console.error("Login error:", error);

            showMessage(
                "Backend connection failed. Make sure server.js is running."
            );
        }
    });
}

function showMessage(message) {
    if (!loginMessage) {
        alert(message);
        return;
    }

    loginMessage.textContent = message;
    loginMessage.style.display = "block";
}