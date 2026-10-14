import { randomInt } from "crypto";
import { customAlphabet } from "nanoid";

const generateToken = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    6
);

export function generatePublicId(
    prefix: "HDS" | "TKT" | "HDC",
): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const suffix = randomInt(0, 1_000_000)
        .toString()
        .padStart(6, "0");

    return `${prefix}-${year}-${suffix}`;
}