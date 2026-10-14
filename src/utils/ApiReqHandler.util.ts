import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "./ApiError.util";

type RouteHandler = (
    request: NextRequest
) => Promise<NextResponse> | NextResponse;

export function handleApiRequest(handler: RouteHandler) {
    return async (request: NextRequest): Promise<NextResponse> => {
        try {
            return await handler(request);
        } catch (error) {
            if (error instanceof ApiError) {
                return NextResponse.json(
                    {
                        success: false,
                        code: error.code,
                        message: error.message,
                        details: error.details,
                    },
                    {
                        status: error.status,
                    }
                );
            }

            console.error(error);

            return NextResponse.json(
                {
                    success: false,
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Internal Server Error",
                },
                {
                    status: 500,
                }
            );
        }
    };
}