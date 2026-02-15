import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


// GET /api/signals — public (limited) or authenticated (full)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        // Use a more specific type assertion or optional chaining to avoid 'any'
        const userRole = session?.user ? (session.user as { role: string }).role : null;

        if (!session || userRole !== 'ADMIN') {
            where.isVisibleToCustomers = true;
        }

        if (status) {
            if (status === 'active') {
                where.status = { in: ['PENDING', 'ACTIVE'] };
            } else if (status === 'closed') {
                where.status = { in: ['TARGET_HIT', 'STOP_LOSS', 'CLOSED_MANUAL'] };
            } else {
                where.status = status;
            }
        }

        const [signals, total] = await Promise.all([
            prisma.signal.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
                include: {
                    screenshots: true,
                    createdBy: {
                        select: { name: true },
                    },
                },
            }),
            prisma.signal.count({ where }),
        ]);

        return NextResponse.json({ signals, total, page, limit });
    } catch (error) {
        console.error('Error fetching signals:', error);
        return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
    }
}

// POST /api/signals — admin only
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user ? (session.user as { role: string }).role : null;

        if (!session || userRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();

        // Extract fields
        const symbol = formData.get('symbol') as string;
        const companyName = formData.get('companyName') as string;
        const segment = formData.get('segment') as string;
        const signalType = formData.get('signalType') as string;
        const direction = formData.get('direction') as string;
        const entryPrice = formData.get('entryPrice') as string;
        const targetPrice = formData.get('targetPrice') as string;
        const stopLossPrice = formData.get('stopLossPrice') as string;
        const notes = formData.get('notes') as string;
        const isVisibleToCustomers = formData.get('isVisibleToCustomers') === 'true';
        const status = formData.get('status') as string;
        const file = formData.get('image') as File | null;

        if (!symbol || !companyName || !direction || !entryPrice || !targetPrice || !stopLossPrice) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let imageUrl = null;
        // Image upload disabled for now as Cloudinary was removed.
        // if (file && file.size > 0) { ... }

        const signal = await prisma.signal.create({
            data: {
                createdById: (session.user as { id: string }).id,
                symbol: symbol.toUpperCase(),
                companyName,
                segment: segment || 'Equity',
                signalType: signalType || 'Swing',
                direction,
                entryPrice: parseFloat(entryPrice),
                targetPrice: parseFloat(targetPrice),
                stopLossPrice: parseFloat(stopLossPrice),
                notes: notes || null,
                isVisibleToCustomers: isVisibleToCustomers,
                status: status || 'ACTIVE',
                screenshots: imageUrl ? {
                    create: { imageUrl }
                } : undefined,
            },
        });

        // Send immediate notifications to all customers
        const customers = await prisma.user.findMany({
            where: { role: 'CUSTOMER', isActive: true },
            select: { id: true }
        });

        if (customers.length > 0) {
            const notifications = customers.map(customer => ({
                userId: customer.id,
                title: `New Signal: ${symbol}`,
                message: `${direction} ${symbol} @ ${entryPrice}. Target: ${targetPrice}, SL: ${stopLossPrice}`,
                type: 'signal',
                link: `/dashboard`,
                createdAt: new Date(),
                isRead: false
            }));

            await prisma.notification.createMany({
                data: notifications
            });
        }

        return NextResponse.json({ signal }, { status: 201 });
    } catch (error) {
        console.error('Error creating signal:', error);
        return NextResponse.json({ error: 'Failed to create signal' }, { status: 500 });
    }
}
