import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';


export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        let { photoUrl } = body;

        // Validation
        if (photoUrl && typeof photoUrl !== 'string') {
            return NextResponse.json({ error: 'Invalid photo format' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { photoUrl },
            select: {
                id: true,
                name: true,
                email: true,
                photoUrl: true
            }
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                photoUrl: true,
                subscriptionStatus: true,
                subscriptionExpiresAt: true,
                createdAt: true // Correct field
            }
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
