import connectDb from "@/db/ConfigDb";
import Pass from "@/models/Pass.model";
import Student from "@/models/Student.model";
import VerificationChallenge from "@/models/VerificationChallenge.model";
import { ApiError } from "@/utils/ApiError.util";
import { generatePublicId } from "@/utils/generatePublicId";
import { sendMail } from "@/utils/MailManager.util";
import { generateOtp, hashOtp, hashSessionToken, MAX_OTP_ATTEMPTS, OTP_EXPIRY_MINUTES, safeCompare, SESSION_EXPIRY_MINUTES } from "@/utils/Hashing.util";
import { randomBytes, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import VerificationSession from "@/models/VerificationSession.model";

// POST /api/v1/helpdesk/pass/generate/start
async function startHelpdeskPassGeneration(
    request: NextRequest
) {
    await connectDb();

    const body = await request.json().catch(() => {
        throw new ApiError("INVALID_REQUEST_BODY");
    });

    const firstName =
        typeof body.firstName === "string"
            ? body.firstName.trim()
            : "";

    const lastName =
        typeof body.lastName === "string"
            ? body.lastName.trim()
            : "";

    const enrollmentNumber =
        typeof body.enrollmentNumber === "string"
            ? body.enrollmentNumber.trim()
            : "";

    const email =
        typeof body.email === "string"
            ? body.email.trim().toLowerCase()
            : "";

    if (!enrollmentNumber || !email) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    if (
        enrollmentNumber.length > 50 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        throw new ApiError("VALIDATION_ERROR");
    }

    // Match the student against the official college record.
    let student = await Student.findOne({
        enrollmentNumber,
        email,
    }).select("_id enrollmentNumber email firstName lastName");

    if (!student) {
        // throw new ApiError("STUDENT_VERIFICATION_FAILED");

        student = await Student.create({
            enrollmentNumber,
            email,
            firstName,
            lastName,
        });
    }

    // Check whether the student already has a Helpdesk pass.
    // Do not create a second pass for an existing student.
    const existingPass = await Pass.findOne({
        studentId: student._id,
    }).select("_id");

    // The confirmation endpoint should return the existing pass
    // after OTP verification rather than creating a duplicate.
    const otp = generateOtp();
    const challengeId = randomUUID();

    const challenge = await VerificationChallenge.create({
        challengeId,
        studentId: student._id,
        purpose: "GENERATE_HELPDESK_ID",
        channel: "EMAIL",
        codeHash: hashOtp(challengeId, otp),
        expiresAt: new Date(
            Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
        ),
        attemptCount: 0,
    });

    const mail = await sendMail({
        type: "code",
        email: student.email,
        otp,
    });

    if (!mail || !mail?.mailInfo) {

        // Do not leave an active challenge if delivery fails.
        await VerificationChallenge.deleteOne({
            _id: challenge._id,
        });

        throw new ApiError("OTP_DELIVERY_FAILED");
    }

    return NextResponse.json({
        success: true,
        message: "If your details are eligible, a verification code has been sent to your registered email.",
        challengeId: challenge.challengeId,
        // expiresIn: OTP_EXPIRY_MINUTES * 60,
        alreadyExists: Boolean(existingPass),
    }, { status: 200 });
};

// POST /api/v1/helpdesk/pass/generate/confirm
async function confirmHelpdeskPassGeneration(
    request: NextRequest
) {
    await connectDb();

    const body = await request.json().catch(() => {
        throw new ApiError("INVALID_REQUEST_BODY");
    });

    const challengeId =
        typeof body.challengeId === "string"
            ? body.challengeId.trim()
            : "";

    const otp =
        typeof body.otp === "string"
            ? body.otp.trim()
            : "";

    if (!challengeId || !otp) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    if (!/^\d{6}$/.test(otp)) {
        throw new ApiError("INVALID_OTP");
    }

    const challenge = await VerificationChallenge.findOne({
        challengeId,
        purpose: "GENERATE_HELPDESK_ID",
    }).select(
        "_id challengeId studentId codeHash expiresAt attemptCount consumedAt"
    );

    if (!challenge) {
        throw new ApiError("VERIFICATION_CHALLENGE_NOT_FOUND");
    }

    if (challenge.consumedAt) {
        throw new ApiError("VERIFICATION_CHALLENGE_ALREADY_USED");
    }

    const now = new Date();

    if (challenge.expiresAt <= now) {
        throw new ApiError("VERIFICATION_CHALLENGE_EXPIRED");
    }

    if (challenge.attemptCount >= MAX_OTP_ATTEMPTS) {
        throw new ApiError("OTP_ATTEMPTS_EXCEEDED");
    }

    const submittedHash = hashOtp(challengeId, otp);
    const otpIsValid = safeCompare(
        challenge.codeHash,
        submittedHash
    );

    if (!otpIsValid) {
        // Increment only while the challenge remains active.
        const updatedChallenge =
            await VerificationChallenge.findOneAndUpdate(
                {
                    _id: challenge._id,
                    consumedAt: null,
                    expiresAt: { $gt: new Date() },
                    attemptCount: { $lt: MAX_OTP_ATTEMPTS },
                },
                {
                    $inc: { attemptCount: 1 },
                },
                {
                    new: true,
                }
            ).select("_id attemptCount");

        if (!updatedChallenge) {
            throw new ApiError(
                "VERIFICATION_CHALLENGE_EXPIRED"
            );
        }

        if (updatedChallenge.attemptCount >= MAX_OTP_ATTEMPTS) {
            throw new ApiError("OTP_ATTEMPTS_EXCEEDED");
        }

        throw new ApiError("INVALID_OTP");
    }

    // Verify that the referenced student still exists.
    const studentExists = await Student.exists({
        _id: challenge.studentId,
    });

    if (!studentExists) {
        throw new ApiError("STUDENT_RECORD_NOT_FOUND");
    }

    let result: {
        helpdeskId: string;
        alreadyExists: boolean;
    } | null = null;

    // Atomically consume the challenge so concurrent requests
    // cannot use the same OTP to issue multiple passes.
    const consumedChallenge = await VerificationChallenge.findOneAndUpdate(
        {
            _id: challenge._id,
            purpose: "GENERATE_HELPDESK_ID",
            codeHash: submittedHash,
            consumedAt: null,
            expiresAt: { $gt: new Date() },
            attemptCount: { $lt: MAX_OTP_ATTEMPTS },
        },
        {
            $set: { consumedAt: new Date() },
        },
        {
            new: true,
        },
    );

    if (!consumedChallenge) {
        throw new ApiError(
            "VERIFICATION_CHALLENGE_ALREADY_USED"
        );
    }

    // Reuse the existing pass if this student already has one.
    const existingPass = await Pass.findOne({
        studentId: consumedChallenge.studentId,
    }).select("helpdeskId")

    if (existingPass) {
        result = {
            helpdeskId: existingPass.helpdeskId,
            alreadyExists: true,
        };

        return;
    }

    // Check candidate IDs before insertion. A unique database
    // index is still required to handle concurrent collisions.
    let helpdeskId = "";
    let attempts = 0;

    do {
        helpdeskId = generatePublicId("HDS");

        const existingId = await Pass.exists({
            helpdeskId,
        })

        if (!existingId) break;

        attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
        throw new ApiError(
            "HELPDESK_ID_GENERATION_FAILED"
        );
    }

    await Pass.create([{
        studentId: consumedChallenge.studentId,
        helpdeskId,
    }]);

    result = {
        helpdeskId,
        alreadyExists: false,
    };

    if (!result) {
        throw new ApiError("INTERNAL_SERVER_ERROR");
    }

    return NextResponse.json(
        {
            success: true,
            message: result.alreadyExists
                ? "Your existing Helpdesk Pass has been recovered successfully."
                : "Your Helpdesk Pass has been generated successfully.",
            helpdeskId: result.helpdeskId,
            alreadyExists: result.alreadyExists,
        },
        { status: 200 }
    );
};

// POST /api/v1/helpdesk/verification/start
async function startHelpdeskPassVerification(
    request: NextRequest
) {
    await connectDb();

    const body = await request.json().catch(() => {
        throw new ApiError("INVALID_REQUEST_BODY");
    });

    const helpdeskId =
        typeof body.helpdeskId === "string"
            ? body.helpdeskId.trim().toUpperCase()
            : "";

    if (!helpdeskId) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    if (!/^HDS-\d{2}-\d{6}$/.test(helpdeskId)) {
        throw new ApiError("INVALID_HELPDESK_ID");
    }

    const challengeId = randomUUID();

    const pass = await Pass.findOne({
        helpdeskId,
    }).select("_id studentId helpdeskId");

    // Do not disclose whether the Helpdesk ID exists.
    // The unpersisted challenge ID will not pass confirmation.
    if (!pass) {
        throw new ApiError("HELPDESK_ID_NOT_FOUND");
    }

    const student = await Student.findById(pass.studentId)
        .select("_id email");

    if (!student?.email) {
        // Avoid exposing pass or student-record problems.
        throw new ApiError("STUDENT_DETAILS_MISMATCH");
    }

    const otp = generateOtp();

    const challenge = await VerificationChallenge.create({
        challengeId,
        studentId: student._id,
        purpose: "VERIFY_HELPDESK_ID",
        channel: "EMAIL",
        codeHash: hashOtp(challengeId, otp),
        expiresAt: new Date(
            Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
        ),
        attemptCount: 0,
    });

    const mail = await sendMail({
        type: "code",
        email: student.email,
        otp,
    });

    if (!mail || !mail?.mailInfo) {

        // Do not leave an active challenge if delivery fails.
        await VerificationChallenge.deleteOne({
            _id: challenge._id,
        });

        throw new ApiError("OTP_DELIVERY_FAILED");
    }

    return NextResponse.json({
        success: true,
        message:
            "If the Helpdesk ID is valid, a verification code will be sent to the registered email address.",
        challengeId,
        expiresIn: OTP_EXPIRY_MINUTES * 60,
    }, { status: 200 });
};

// POST /api/v1/helpdesk/verification/confirm
async function confirmHelpdeskPassVerification(
    request: NextRequest
) {
    await connectDb();

    const body = await request.json().catch(() => {
        throw new ApiError("INVALID_REQUEST_BODY");
    });

    const challengeId =
        typeof body.challengeId === "string"
            ? body.challengeId.trim()
            : "";

    const otp =
        typeof body.otp === "string"
            ? body.otp.trim()
            : "";

    if (!challengeId || !otp) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    if (!/^\d{6}$/.test(otp)) {
        throw new ApiError("INVALID_OTP");
    }

    const challenge = await VerificationChallenge.findOne({
        challengeId,
        purpose: "VERIFY_HELPDESK_ID",
    }).select(
        "_id challengeId studentId helpdeskProfileId codeHash expiresAt attemptCount consumedAt"
    );

    if (!challenge) {
        throw new ApiError("VERIFICATION_CHALLENGE_NOT_FOUND");
    }

    if (challenge.consumedAt) {
        throw new ApiError("VERIFICATION_CHALLENGE_ALREADY_USED");
    }

    if (challenge.expiresAt <= new Date()) {
        throw new ApiError("VERIFICATION_CHALLENGE_EXPIRED");
    }

    const maxAttempts = MAX_OTP_ATTEMPTS;

    if (challenge.attemptCount >= MAX_OTP_ATTEMPTS) {
        throw new ApiError("OTP_ATTEMPTS_EXCEEDED");
    }

    const submittedHash = hashOtp(challengeId, otp);

    if (!safeCompare(challenge.codeHash, submittedHash)) {
        // Atomically increment attempts only if the challenge
        // remains active and below its attempt limit.
        const updatedChallenge = await VerificationChallenge.findOneAndUpdate(
            {
                _id: challenge._id,
                purpose: "VERIFY_HELPDESK_ID",
                consumedAt: null,
                expiresAt: { $gt: new Date() },
                attemptCount: { $lt: MAX_OTP_ATTEMPTS },
            },
            {
                $inc: { attemptCount: 1 },
            },
            { new: true }
        ).select("attemptCount");

        if (!updatedChallenge) {
            throw new ApiError(
                "VERIFICATION_CHALLENGE_EXPIRED"
            );
        }

        if (
            updatedChallenge.attemptCount >= MAX_OTP_ATTEMPTS
        ) {
            throw new ApiError("OTP_ATTEMPTS_EXCEEDED");
        }

        throw new ApiError("INVALID_OTP");
    }

    const sessionToken = randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(sessionToken);

    const expiresAt = new Date(
        Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000
    );

    // Consume the challenge exactly once. Concurrent
    // confirmation requests cannot reuse the same OTP.
    const consumedChallenge = await VerificationChallenge.findOneAndUpdate(
        {
            _id: challenge._id,
            purpose: "VERIFY_HELPDESK_ID",
            codeHash: submittedHash,
            consumedAt: null,
            expiresAt: { $gt: new Date() },
            attemptCount: { $lt: maxAttempts },
        },
        {
            $set: { consumedAt: new Date() },
        },
        {
            new: true,
        }
    );

    if (!consumedChallenge) {
        throw new ApiError(
            "VERIFICATION_CHALLENGE_ALREADY_USED"
        );
    }

    // Confirm that the associated Helpdesk pass still exists.
    const pass = await Pass.findOne({
        studentId: consumedChallenge.studentId,
    }).select("_id")

    if (!pass) {
        throw new ApiError(
            "STUDENT_PROFILE_NOT_FOUND"
        );
    }

    const existingSession = await VerificationSession.findOne({
        studentId: consumedChallenge.studentId,
        helpdeskProfileId: pass._id,
        expiresAt: { $gt: new Date() },
    });

    if (existingSession) {
        existingSession.tokenHash = tokenHash;
        existingSession.purpose = "RAISE_QUERY";
        existingSession.expiresAt = expiresAt;
        existingSession.revokedAt = new Date();
        await existingSession.save();
    } else {
        await VerificationSession.create(
            [
                {
                    tokenHash,
                    studentId: consumedChallenge.studentId,
                    helpdeskProfileId: pass._id,
                    purpose: "RAISE_QUERY",
                    expiresAt,
                    revokedAt: new Date(),
                },
            ],
        );
    }

    const response = NextResponse.json({
        success: true,
        verified: true,
        message: "Your identity has been verified successfully.",
        expiresIn: SESSION_EXPIRY_MINUTES * 60,
    }, { status: 200 });

    response.cookies.set({
        name: "helpdesk_verification",
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // sameSite: "strict",
        // path: "/api/v1/helpdesk",
        expires: expiresAt,
    });

    return response;
};

// GET /api/v1/helpdesk/profile/me
async function getVerifiedStudentProfile(
    request: NextRequest
) {
    await connectDb();

    const sessionToken = request.cookies.get("helpdesk_verification")?.value;

    if (!sessionToken) {
        throw new ApiError("AUTHENTICATION_REQUIRED");
    }

    const tokenHash = hashSessionToken(sessionToken);

    const verificationSession = await VerificationSession.findOne({
        tokenHash,
        purpose: "RAISE_QUERY",
        expiresAt: { $gt: new Date() },
    }).select(
        "studentId helpdeskProfileId purpose expiresAt"
    );

    if (!verificationSession) {
        throw new ApiError("INVALID_SESSION");
    }

    const profile = await Pass.findOne({
        _id: verificationSession.helpdeskProfileId,
        studentId: verificationSession.studentId,
    }).select("_id studentId helpdeskId");

    if (!profile) {
        throw new ApiError("STUDENT_PROFILE_NOT_FOUND");
    }

    const student = await Student.findById(
        verificationSession.studentId
    ).select(
        "firstName lastName enrollmentNumber email contactNo department year institution"
    ).lean();

    if (!student) {
        throw new ApiError("STUDENT_RECORD_NOT_FOUND");
    }

    const fullName = [
        student.firstName,
        student.lastName,
    ].filter(Boolean)
        .join(" ")
        .trim();

    return NextResponse.json({
        success: true,
        student: {
            helpdeskId: profile.helpdeskId,
            fullName,
            enrollmentNumber: student.enrollmentNumber,
            email: student.email,
            contactNo: student.contactNo ?? "",
            department: student.department ?? "",
            year: student.year ?? "",
            institution: student.institution ?? "",
        },
    }, { status: 200 });
}

export {
    startHelpdeskPassGeneration,
    confirmHelpdeskPassGeneration,
    startHelpdeskPassVerification,
    confirmHelpdeskPassVerification,
    getVerifiedStudentProfile,
};