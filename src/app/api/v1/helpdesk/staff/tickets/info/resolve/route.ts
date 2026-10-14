import { resolveStaffTicket } from '@/controllers/ticketResponse.controller';
import { handleApiRequest } from '@/utils/ApiReqHandler.util';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    return handleApiRequest(resolveStaffTicket)(request);
};