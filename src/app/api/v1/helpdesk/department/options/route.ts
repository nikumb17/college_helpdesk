import { getDepartmentOptions } from '@/controllers/department.controller';
import { handleApiRequest } from '@/utils/ApiReqHandler.util';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    return handleApiRequest(getDepartmentOptions)(request);
};