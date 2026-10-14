import connectDb from "@/db/ConfigDb";
import User from "@/models/User.model";
import { ApiError } from "@/utils/ApiError.util";
import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

// POST /api/auth/login
const login = async (request: NextRequest) => {
    await connectDb();
    const { email, password } = await request.json();
    if (!email || !password) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
        throw new ApiError("INVALID_CREDENTIALS");
    }
    if (!(await user.isValid(password))) {
        throw new ApiError("INVALID_CREDENTIALS");
    }
    const options = {
        httpOnly: true,
        secure: true,
    };
    const token = await user.generateAccessToken();
    user.accessToken = token;
    await user.save();
    const res = NextResponse.json({ success: true, message: "You are successfully logged in !!!", role: user.role || "STAFF" }, { status: 200 });
    res.cookies.set("auth", token, options);
    return res;
};

const isUserValid = async (request: NextRequest) => {
    await connectDb();
    const authToken = await request.cookies.get("auth")?.value;
    if (!authToken) {
        throw new ApiError("UNAUTHORIZED");
    }
    const payload = jwt.verify(authToken, process.env.ACCESS_TOKEN_KEY as string) as JwtPayload;
    if (!payload) {
        throw new ApiError("INVALID_TOKEN");
    }
    const user = await User.findById(payload._id);
    if (!user) {
        throw new ApiError("UNAUTHORIZED");
    }
    return user;
};

const isAdminValid = async (request: NextRequest) => {
    const user = await isUserValid(request);
    if (user.role !== "ADMIN") {
        throw new ApiError("FORBIDDEN");
    }
    return user;
};

const isDepartmentValid = async (request: NextRequest) => {
    const user = await isUserValid(request);
    if (user.role !== "DEP") {
        throw new ApiError("FORBIDDEN");
    }
    return user;
};

const isStaffValid = async (request: NextRequest) => {
    const user = await isUserValid(request);
    if (user.role !== "STAFF") {
        throw new ApiError("FORBIDDEN");
    }
    return user;
};

// GET /api/v1/helpdesk/auth/logout
async function logout(request: NextRequest) {
    const std = await isUserValid(request);
    const authToken = await request.cookies.get("auth")?.value;
    if (!authToken) {
        throw new ApiError("UNAUTHORIZED");
    }
    const payload = jwt.verify(authToken, process.env.ACCESS_TOKEN_KEY as string);
    if (!payload) {
        throw new ApiError("INVALID_TOKEN");
    }
    const user = await User.findById(std._id);
    if (!user) {
        throw new ApiError("RECORD_NOT_FOUND");
    }
    user.accessToken = null;
    await user.save();
    const res = NextResponse.json({ success: true, message: "You are successfully logged out!!!" }, { status: 200 });
    res.cookies.set('auth', "", {
        httpOnly: true,
        secure: true,
        expires: new Date(0)
    });
    return res;
};

export {
    login,
    isUserValid,
    isAdminValid,
    isDepartmentValid,
    isStaffValid,
    logout,
};