import { assignTicketDepartment } from '@/controllers/ticket.controller';
import { handleApiRequest } from '@/utils/ApiReqHandler.util';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    return handleApiRequest(assignTicketDepartment)(request);
};