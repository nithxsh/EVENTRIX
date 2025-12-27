
// In-memory store for OTPs: mobile number -> code
const otpStore = new Map<string, string>();

export const sendOTP = (mobile: string): string => {
    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store it (overwriting any previous one)
    otpStore.set(mobile, code);

    // In a real app, integrate SMS gateway here.
    // For MVP, we log to console.
    console.log(`[OTP SERVICE] Generated OTP for ${mobile}: ${code}`);

    // Auto-expire after 5 minutes
    setTimeout(() => {
        if (otpStore.get(mobile) === code) {
            otpStore.delete(mobile);
        }
    }, 5 * 60 * 1000);

    return code;
};

export const verifyOTP = (mobile: string, code: string): boolean => {
    const storedCode = otpStore.get(mobile);
    if (storedCode && storedCode === code) {
        otpStore.delete(mobile); // Consume OTP
        return true;
    }
    return false;
};
