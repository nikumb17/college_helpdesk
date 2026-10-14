import { startHelpdeskPassGeneration } from "@/controllers/helpdeskPass.controller";
import { handleApiRequest } from "@/utils/ApiReqHandler.util";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    return handleApiRequest(startHelpdeskPassGeneration)(request);
}