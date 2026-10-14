export const ERRORS = {
    // =========================================================
    // Server
    // =========================================================
    INTERNAL_SERVER_ERROR: {
        status: 500,
        message: "Something went wrong on our side. Please try again later.",
    },

    SERVICE_UNAVAILABLE: {
        status: 503,
        message: "The helpdesk service is temporarily unavailable.",
    },

    NOT_IMPLEMENTED: {
        status: 501,
        message: "This feature is not available yet.",
    },

    REQUEST_TIMEOUT: {
        status: 408,
        message: "The request took too long. Please try again.",
    },

    // =========================================================
    // Request Validation
    // =========================================================
    BAD_REQUEST: {
        status: 400,
        message: "The request is invalid. Please check your input.",
    },

    VALIDATION_ERROR: {
        status: 400,
        message: "Some fields are invalid. Please review your input.",
    },

    MISSING_REQUIRED_FIELDS: {
        status: 400,
        message: "Please provide all required fields.",
    },

    INVALID_REQUEST_BODY: {
        status: 400,
        message: "The request body is invalid or malformed.",
    },

    INVALID_REQUEST_FORMAT: {
        status: 400,
        message: "The request format is not supported.",
    },

    PAYLOAD_TOO_LARGE: {
        status: 413,
        message: "The submitted data is too large.",
    },

    UNSUPPORTED_MEDIA_TYPE: {
        status: 415,
        message: "The submitted content type is not supported.",
    },

    // =========================================================
    // Authentication & Authorization
    // =========================================================
    INVALID_CREDENTIALS: {
        status: 401,
        message: "Invalid email or password.",
    },

    TOKEN_EXPIRED: {
        status: 401,
        message: "Your session has expired. Please log in again.",
    },

    INVALID_TOKEN: {
        status: 401,
        message: "Your session is invalid. Please log in again.",
    },

    REFRESH_TOKEN_EXPIRED: {
        status: 401,
        message: "Your session has expired. Please log in again.",
    },

    ACCOUNT_NOT_VERIFIED: {
        status: 403,
        message: "Please verify your account before continuing.",
    },

    ACCOUNT_INACTIVE: {
        status: 403,
        message: "Your account is currently inactive.",
    },

    ACCOUNT_SUSPENDED: {
        status: 403,
        message: "Your account has been suspended.",
    },

    UNAUTHORIZED: {
        status: 401,
        message: "Authentication is required to perform this action.",
    },

    AUTHENTICATION_REQUIRED: {
        status: 401,
        message: "Please verify your identity to continue.",
    },

    INVALID_SESSION: {
        status: 401,
        message: "Your session is invalid. Please verify your identity again.",
    },

    SESSION_EXPIRED: {
        status: 401,
        message: "Your session has expired. Please verify your identity again.",
    },

    FORBIDDEN: {
        status: 403,
        message: "You do not have permission to perform this action.",
    },

    INSUFFICIENT_PERMISSIONS: {
        status: 403,
        message: "You do not have the required permissions.",
    },

    CSRF_VALIDATION_FAILED: {
        status: 403,
        message: "The request could not be verified. Please refresh and try again.",
    },

    // =========================================================
    // Resource & Routing
    // =========================================================
    NOT_FOUND: {
        status: 404,
        message: "The requested resource could not be found.",
    },

    ROUTE_NOT_FOUND: {
        status: 404,
        message: "The requested endpoint does not exist.",
    },

    METHOD_NOT_ALLOWED: {
        status: 405,
        message: "This HTTP method is not allowed for the requested endpoint.",
    },

    RESOURCE_CONFLICT: {
        status: 409,
        message: "The request conflicts with the current resource state.",
    },

    RESOURCE_GONE: {
        status: 410,
        message: "The requested resource is no longer available.",
    },

    // =========================================================
    // Rate Limiting
    // =========================================================
    TOO_MANY_REQUESTS: {
        status: 429,
        message: "Too many requests. Please wait before trying again.",
    },

    OTP_RATE_LIMIT_EXCEEDED: {
        status: 429,
        message: "Too many verification attempts. Please try again later.",
    },

    OTP_RESEND_LIMIT_EXCEEDED: {
        status: 429,
        message: "You have requested too many OTPs. Please try again later.",
    },

    // =========================================================
    // Helpdesk ID
    // =========================================================
    INVALID_HELPDESK_ID: {
        status: 400,
        message: "The Helpdesk ID format is invalid.",
    },

    HELPDESK_ID_NOT_FOUND: {
        status: 404,
        message: "The Helpdesk ID could not be found.",
    },

    HELPDESK_ID_ALREADY_EXISTS: {
        status: 409,
        message: "A Helpdesk ID has already been issued for this student.",
    },

    HELPDESK_PROFILE_ALREADY_EXISTS: {
        status: 409,
        message: "A Helpdesk profile already exists for this student.",
    },

    HELPDESK_ID_GENERATION_FAILED: {
        status: 500,
        message: "We couldn't generate your Helpdesk ID. Please try again later.",
    },

    HELPDESK_ID_RECOVERY_FAILED: {
        status: 400,
        message: "We couldn't complete the recovery request. Please verify your details and try again.",
    },

    HELPDESK_ID_UNAVAILABLE: {
        status: 503,
        message: "Helpdesk ID services are temporarily unavailable.",
    },

    // =========================================================
    // Student Verification & OTP
    // =========================================================
    STUDENT_VERIFICATION_FAILED: {
        status: 400,
        message: "We couldn't verify your details. Please check them and try again.",
    },

    STUDENT_RECORD_NOT_FOUND: {
        status: 404,
        message: "No matching student record could be found.",
    },

    STUDENT_DETAILS_MISMATCH: {
        status: 400,
        message: "The provided details do not match the student record.",
    },

    OTP_REQUIRED: {
        status: 400,
        message: "Please enter the verification OTP.",
    },

    INVALID_OTP: {
        status: 400,
        message: "The OTP is invalid. Please check it and try again.",
    },

    OTP_EXPIRED: {
        status: 400,
        message: "The OTP has expired. Please request a new one.",
    },

    OTP_ALREADY_USED: {
        status: 400,
        message: "This OTP has already been used. Please request a new one.",
    },

    OTP_ATTEMPTS_EXCEEDED: {
        status: 429,
        message: "The maximum verification attempts have been exceeded. Please try again later.",
    },

    VERIFICATION_CHALLENGE_NOT_FOUND: {
        status: 404,
        message: "The verification request is invalid or has expired.",
    },

    VERIFICATION_CHALLENGE_EXPIRED: {
        status: 400,
        message: "The verification request has expired. Please start again.",
    },

    VERIFICATION_CHALLENGE_ALREADY_USED: {
        status: 400,
        message: "This verification request has already been completed.",
    },

    VERIFICATION_PURPOSE_MISMATCH: {
        status: 400,
        message: "This verification request cannot be used for this action.",
    },

    VERIFICATION_REQUIRED: {
        status: 403,
        message: "Please complete identity verification before continuing.",
    },

    // =========================================================
    // Student Profile
    // =========================================================
    STUDENT_PROFILE_NOT_FOUND: {
        status: 404,
        message: "Your student profile could not be found.",
    },

    STUDENT_PROFILE_INACTIVE: {
        status: 403,
        message: "Your student profile is not currently eligible for this action.",
    },

    STUDENT_PROFILE_FETCH_FAILED: {
        status: 500,
        message: "We couldn't retrieve your student profile. Please try again later.",
    },

    STUDENT_PROFILE_UPDATE_FAILED: {
        status: 500,
        message: "We couldn't update your student profile. Please try again later.",
    },

    // =========================================================
    // Ticket & Query Management
    // =========================================================
    QUERY_NOT_FOUND: {
        status: 404,
        message: "The requested query could not be found.",
    },

    QUERY_SUBJECT_REQUIRED: {
        status: 400,
        message: "Please provide a subject for your query.",
    },

    QUERY_DESCRIPTION_REQUIRED: {
        status: 400,
        message: "Please describe your issue before submitting.",
    },

    INVALID_QUERY_CATEGORY: {
        status: 400,
        message: "Please select a valid query category.",
    },

    INVALID_QUERY_PRIORITY: {
        status: 400,
        message: "Please select a valid query priority.",
    },

    QUERY_DESCRIPTION_TOO_SHORT: {
        status: 400,
        message: "Your query description is too short. Please provide more details.",
    },

    QUERY_DESCRIPTION_TOO_LONG: {
        status: 400,
        message: "Your query description exceeds the maximum allowed length.",
    },

    TICKET_NOT_FOUND: {
        status: 404,
        message: "The requested ticket could not be found.",
    },

    TICKET_ALREADY_EXISTS: {
        status: 409,
        message: "A ticket with this identifier already exists.",
    },

    TICKET_CREATION_FAILED: {
        status: 500,
        message: "We couldn't submit your query. Please try again later.",
    },

    TICKET_UPDATE_FAILED: {
        status: 500,
        message: "We couldn't update your ticket. Please try again later.",
    },

    TICKET_ACCESS_DENIED: {
        status: 403,
        message: "You do not have permission to access this ticket.",
    },

    TICKET_ALREADY_CLOSED: {
        status: 409,
        message: "This ticket has already been closed and cannot be modified.",
    },

    INVALID_TICKET_STATUS: {
        status: 400,
        message: "The requested ticket status is invalid.",
    },

    TICKET_STATUS_UPDATE_FAILED: {
        status: 500,
        message: "We couldn't update the ticket status. Please try again later.",
    },

    TICKET_ID_GENERATION_FAILED: {
        status: 500,
        message: "We couldn't generate a Ticket ID. Please try again later.",
    },

    DUPLICATE_QUERY_SUBMISSION: {
        status: 409,
        message: "This query has already been submitted.",
    },

    // =========================================================
    // Notifications & Email
    // =========================================================
    EMAIL_DELIVERY_FAILED: {
        status: 503,
        message: "We couldn't send the email. Please try again later.",
    },

    OTP_DELIVERY_FAILED: {
        status: 503,
        message: "We couldn't send the verification code. Please try again later.",
    },

    NOTIFICATION_DELIVERY_FAILED: {
        status: 503,
        message: "We couldn't deliver the notification. Please try again later.",
    },

    // =========================================================
    // Database
    // =========================================================
    DATABASE_ERROR: {
        status: 500,
        message: "A database error occurred. Please try again later.",
    },

    DATABASE_CONNECTION_FAILED: {
        status: 503,
        message: "We couldn't connect to the database. Please try again later.",
    },

    DATABASE_OPERATION_FAILED: {
        status: 500,
        message: "We couldn't complete the requested operation.",
    },

    DUPLICATE_RECORD: {
        status: 409,
        message: "A record with the provided information already exists.",
    },

    RECORD_NOT_FOUND: {
        status: 404,
        message: "The requested record could not be found.",
    },

    // =========================================================
    // External Services
    // =========================================================
    EXTERNAL_SERVICE_ERROR: {
        status: 502,
        message: "An external service returned an unexpected response.",
    },

    EXTERNAL_SERVICE_TIMEOUT: {
        status: 504,
        message: "An external service took too long to respond.",
    },

    EMAIL_SERVICE_UNAVAILABLE: {
        status: 503,
        message: "The email service is temporarily unavailable.",
    },
} as const;

export type ErrorCode = keyof typeof ERRORS;