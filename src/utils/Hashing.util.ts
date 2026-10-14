import { createHmac, randomInt, timingSafeEqual } from "crypto";

export const OTP_EXPIRY_MINUTES = 5;
export const MAX_OTP_ATTEMPTS = 5;

export const SESSION_EXPIRY_MINUTES = 15;

const generateOtp = () => {
    return randomInt(100000, 1000000).toString();
};

const hashOtp = (challengeId: string, otp: string) => {
    const secret = process.env.OTP_SECRET;

    if (!secret) {
        throw new Error("OTP_SECRET is not configured.");
    }

    return createHmac("sha256", secret)
        .update(`${challengeId}:${otp}`)
        .digest("hex");
};

const hashSessionToken = (token: string): string => {
    const secret = process.env.SESSION_SECRET;

    if (!secret) {
        throw new Error("SESSION_SECRET is not configured.");
    }

    return createHmac("sha256", secret)
        .update(token)
        .digest("hex");
};

const safeCompare = (a: string, b: string): boolean => {
    const bufferA = Buffer.from(a, "hex");
    const bufferB = Buffer.from(b, "hex");

    return (
        bufferA.length === bufferB.length &&
        bufferA.length > 0 &&
        timingSafeEqual(bufferA, bufferB)
    );
};

export {
    generateOtp,
    hashOtp,
    hashSessionToken,
    safeCompare,
};