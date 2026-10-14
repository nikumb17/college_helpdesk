import connectDb from "@/db/ConfigDb";
import Department from "@/models/Department.model";
import { NextRequest, NextResponse } from "next/server";
import { isAdminValid } from "./auth.controller";
import { ApiError } from "@/utils/ApiError.util";

// GET /api/v1/helpdesk/department/options
async function getDepartmentOptions(request: NextRequest) {
    await connectDb();
    const departments = await Department.find({ isActive: true }).lean();
    return NextResponse.json({
        success: true,
        message: "Department options fetched successfully",
        data: {
            departments,
        },
    }, { status: 200 });
};

// GET /api/v1/helpdesk/admin/departments
async function getAdminDepartments(request: NextRequest) {
    // 1. Authenticate the user.
    const user = await isAdminValid(request);
    // 3. Fetch all departments.
    const departments = await Department.find({})
        .select("_id name code description isActive createdAt updatedAt")
        .sort({ name: 1 })
        .lean();

    // 4. Return the response expected by AdminDepartments.tsx.
    return NextResponse.json(
        {
            success: true,
            message: "Departments fetched successfully.",
            data: {
                departments,
            },
        },
        { status: 200 }
    );
};

// POST /api/v1/helpdesk/admin/departments/add
async function createDepartment(request: NextRequest) {
    // 1. Authenticate and authorize the user.
    const user = await isAdminValid(request);

    // 2. Parse the request body.
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    const { name, code, description } = body;

    // 3. Validate required fields.
    if (
        typeof name !== "string" ||
        typeof code !== "string" ||
        (description !== undefined && typeof description !== "string")
    ) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    const normalizedName = name.trim();
    const normalizedCode = code.trim().toUpperCase();
    const normalizedDescription =
        typeof description === "string" ? description.trim() : "";

    if (
        normalizedName.length < 2 ||
        normalizedName.length > 100 ||
        !/^[A-Z0-9-]{1,20}$/.test(normalizedCode) ||
        normalizedDescription.length > 500
    ) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    // 4. Prevent duplicate department codes.
    const existingDepartment = await Department.findOne({
        code: normalizedCode,
    })
        .select("_id")
        .lean();

    if (existingDepartment) {
        throw new ApiError("DUPLICATE_RECORD");
    }

    // 5. Create the department.
    const department = await Department.create({
        name: normalizedName,
        code: normalizedCode,
        description: normalizedDescription,
        isActive: true,
    });

    return NextResponse.json(
        {
            success: true,
            message: "Department created successfully.",
            data: {
                department: {
                    _id: department._id,
                    name: department.name,
                    code: department.code,
                    description: department.description,
                    isActive: department.isActive,
                    createdAt: department.createdAt,
                    updatedAt: department.updatedAt,
                },
            },
        },
        { status: 201 }
    );
};

export {
    getDepartmentOptions,
    getAdminDepartments,
    createDepartment,
};