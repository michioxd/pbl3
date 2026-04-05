const auth = {
    fields: {
        fullName: "Full name",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm password",
    },
    login: {
        tab: "Sign in",
        badge: "Customer account",
        title: "Welcome back",
        description: "Sign in to manage tickets, track trips, and unlock personalized deals.",
        helper: "Access your booking history and real-time trip status.",
        submit: "Sign in",
        switchPrompt: "Don't have an account?",
        placeholders: {
            email: "Enter your email",
            password: "Enter your password",
        },
    },
    register: {
        tab: "Sign up",
        badge: "Create a new account",
        title: "Create your XeNhanh account",
        description: "Register in just a few steps to save passenger details and receive promotions first.",
        helper: "By signing up, you agree to XeNhanh's terms and privacy policy.",
        submit: "Create account",
        switchPrompt: "Already have an account?",
        placeholders: {
            fullName: "Enter your full name",
            email: "Enter your registration email",
            password: "Create a password",
            confirmPassword: "Confirm your password",
        },
    },
    forgot: {
        badge: "Password recovery",
        title: "Forgot your password?",
        description: "Enter your email to receive reset instructions and get back to your next journey.",
        helper: "We'll send a recovery link to your registered email address.",
        submit: "Send reset link",
        cta: "Forgot password?",
        back: "Back to sign in",
        placeholders: {
            email: "Enter your email for recovery",
        },
    },
};

export default auth;
