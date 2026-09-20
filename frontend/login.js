const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const API_URL = "https://cyberproof-backend.onrender.com";

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
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

        const button = loginForm.querySelector("button[type='submit']");
        const originalText = button ? button.textContent : "";

        if (button) {
            button.disabled = true;
            button.textContent = "Signing in...";
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
                showMessage("Login failed: token not received.");
                return;
            }

            localStorage.setItem("cyberproofToken", data.token);

            localStorage.setItem(
                "cyberproofUser",
                JSON.stringify({
                    email: data.user?.email || email
                })
            );

            showMessage("Login successful!");

            window.location.href = "scanner.html";

        } catch (error) {
            console.error("Login error:", error);
            showMessage("Unable to connect to CyberProof server.");
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
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