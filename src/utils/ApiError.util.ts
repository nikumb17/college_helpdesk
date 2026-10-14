import { ERRORS, ErrorCode } from "@/constants/errors";

export class ApiError extends Error {
    public readonly code: ErrorCode;
    public readonly status: number;
    public readonly details: string | null;

    constructor(code: ErrorCode, details: string | null = null) {
        super(ERRORS[code].message);

        this.code = code;
        this.status = ERRORS[code].status;
        this.details = details;

        Error.captureStackTrace(this, ApiError);
    }

    toJSON() {
        return {
            success: false,
            code: this.code,
            message: this.message,
            status: this.status,
            ...(this.details && { details: this.details }),
        };
    }
}