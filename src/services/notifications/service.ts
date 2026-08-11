import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createEmailProvider } from "@/providers/email";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  data?: Prisma.InputJsonValue;
  email?: boolean;
};

export class NotificationsService {
  async create(input: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
        data: input.data,
      },
    });

    if (input.email) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });
      if (user?.email) {
        const email = createEmailProvider();
        await email.send({
          to: user.email,
          subject: input.title,
          text: input.body,
          html: `<p>${input.body}</p>${input.href ? `<p><a href="${input.href}">Open</a></p>` : ""}`,
        });
      }
    }

    return notification;
  }

  async listForUser(userId: string, options?: { unreadOnly?: boolean; take?: number }) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(options?.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: options?.take ?? 50,
    });
  }

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, readAt: null },
    });
  }
}

export const notificationsService = new NotificationsService();
