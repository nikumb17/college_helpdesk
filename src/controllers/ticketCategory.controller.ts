import connectDb from "@/db/ConfigDb";
import TicketCategory from "@/models/TicketCategory.model";
import { ApiError } from "@/utils/ApiError.util";
import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/tickets/category/options
async function getCategoryOptions(request: NextRequest) {
    await connectDb();
    const ticketCategoryOptions = await TicketCategory.find({}).lean();
    return NextResponse.json({
        success: true,
        options: ticketCategoryOptions,
    }, { status: 200 });
};

async function addTicketCategpory(request: NextRequest) {
    await connectDb();
    const { value, label } = await request.json();

    const categoryExists = await TicketCategory.findOne({ value });
    if (categoryExists) {
        throw new ApiError("DUPLICATE_RECORD");
    }

    await TicketCategory.create({
        value,
        label,
    });

    return NextResponse.json({
        success: true,
        message: "",
    }, { status: 200 });
};

export {
    getCategoryOptions,
    addTicketCategpory,
};