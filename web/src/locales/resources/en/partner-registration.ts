export default {
    loading: "Loading...",
    login_required_title: "Sign-in required",
    login_required_desc: "Please sign in to submit a partner request.",
    login_required_cta: "Sign in now",
    success: "Your partner request has been submitted successfully. We will review it and respond as soon as possible.",
    error: "An error occurred while submitting your request. Please try again later.",
    title: "Become a partner (Sell tickets on XeNhanh)",
    description: "Please fill in your business information to request an account upgrade to BusAdmin.",
    fields: {
        company_name: "Bus company / business name",
        license_number: "Business license number (optional)",
        hotline: "Support hotline (optional)",
        reason: "Reason / additional details (optional)",
    },
    placeholders: {
        company_name: "Enter your company name",
        license_number: "Enter the license number (if any)",
        hotline: "Enter the hotline phone number",
        reason: "Describe your scale, operating routes...",
    },
    validation: {
        company_name_required: "Please enter your company name",
    },
    submit: "Submit upgrade request",
} as const;
