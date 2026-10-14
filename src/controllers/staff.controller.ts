import connectDb from "@/db/ConfigDb";
import { NextRequest, NextResponse } from "next/server";
import { isDepartmentValid } from "./auth.controller";
import { ApiError } from "@/utils/ApiError.util";
import User from "@/models/User.model";
import Department from "@/models/Department.model";

// GET /api/v1/helpdesk/department/staff
async function getDepartmentStaffs(request: NextRequest) {
    const departmentHead = await isDepartmentValid(request);

    if (!departmentHead.departmentId) {
        throw new ApiError("RECORD_NOT_FOUND");
    }

    // Return only active staff associated with this department.
    const staff = await User.find({
        role: "STAFF",
        departmentId: departmentHead.departmentId,
        isActive: true,
    })
        .select("_id name email role departmentId")
        .sort({ name: 1 })
        .lean();

    return NextResponse.json(
        {
            success: true,
            message: "Department staff fetched successfully.",
            staff,
        },
        { status: 200 }
    );
};

export {
    getDepartmentStaffs,
};