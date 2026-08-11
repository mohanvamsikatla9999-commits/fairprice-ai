import type { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError, ForbiddenError } from "@/lib/api/errors";
import { slugify } from "@/lib/utils";
import { nanoid } from "nanoid";

export type CreateListingInput = {
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  priceInr: number;
  conditionGrade?: Prisma.ListingCreateInput["conditionGrade"];
  productId?: string;
  variantId?: string;
  city?: string;
  state?: string;
  area?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  sellerType?: "INDIVIDUAL" | "BUSINESS";
  originalPriceInr?: number;
  attributes?: Array<{ key: string; value: string }>;
  images?: Array<{
    storageKey: string;
    url: string;
    alt?: string;
    isPrimary?: boolean;
    mimeType?: string;
    sizeBytes?: number;
  }>;
};

export type UpdateListingInput = Partial<
  Omit<CreateListingInput, "sellerId" | "categoryId" | "attributes" | "images">
> & {
  categoryId?: string;
  status?: ListingStatus;
};

function uniqueSlug(title: string): string {
  const base = slugify(title) || "listing";
  return `${base}-${nanoid(8)}`;
}

export class ListingsService {
  async create(input: CreateListingInput) {
    const slug = uniqueSlug(input.title);
    return prisma.listing.create({
      data: {
        sellerId: input.sellerId,
        categoryId: input.categoryId,
        productId: input.productId,
        variantId: input.variantId,
        title: input.title,
        slug,
        description: input.description,
        priceInr: input.priceInr,
        originalPriceInr: input.originalPriceInr,
        conditionGrade: input.conditionGrade ?? "GOOD",
        city: input.city,
        state: input.state,
        area: input.area,
        postalCode: input.postalCode,
        lat: input.lat,
        lng: input.lng,
        sellerType: input.sellerType ?? "INDIVIDUAL",
        status: "DRAFT",
        attributes: input.attributes
          ? {
              create: input.attributes.map((a) => ({
                key: a.key,
                value: a.value,
              })),
            }
          : undefined,
        images: input.images
          ? {
              create: input.images.map((img, index) => ({
                storageKey: img.storageKey,
                url: img.url,
                alt: img.alt,
                isPrimary: img.isPrimary ?? index === 0,
                mimeType: img.mimeType,
                sizeBytes: img.sizeBytes,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        attributes: true,
        category: true,
      },
    });
  }

  async getById(id: string) {
    const listing = await prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        attributes: true,
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            sellerTrustScore: true,
            verificationLevel: true,
            emailVerified: true,
            phoneVerified: true,
            identityVerifiedAt: true,
            faceVerifiedAt: true,
            livenessVerifiedAt: true,
            createdAt: true,
            profile: {
              select: {
                completedSales: true,
                responseRate: true,
              },
            },
            reviewsReceived: { select: { rating: true } },
          },
        },
        condition: true,
        valuations: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!listing) throw new NotFoundError("Listing not found");
    return listing;
  }

  async getBySlug(slug: string) {
    const listing = await prisma.listing.findFirst({
      where: { slug, deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        attributes: true,
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            sellerTrustScore: true,
            verificationLevel: true,
            emailVerified: true,
            phoneVerified: true,
            identityVerifiedAt: true,
            faceVerifiedAt: true,
            livenessVerifiedAt: true,
            createdAt: true,
            profile: {
              select: {
                completedSales: true,
                responseRate: true,
              },
            },
            reviewsReceived: { select: { rating: true } },
          },
        },
      },
    });
    if (!listing) throw new NotFoundError("Listing not found");
    return listing;
  }

  async update(id: string, sellerId: string, input: UpdateListingInput) {
    const existing = await prisma.listing.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Listing not found");
    if (existing.sellerId !== sellerId) {
      throw new ForbiddenError("You can only edit your own listings");
    }

    return prisma.listing.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.priceInr !== undefined ? { priceInr: input.priceInr } : {}),
        ...(input.originalPriceInr !== undefined
          ? { originalPriceInr: input.originalPriceInr }
          : {}),
        ...(input.conditionGrade ? { conditionGrade: input.conditionGrade } : {}),
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input.productId !== undefined ? { productId: input.productId } : {}),
        ...(input.variantId !== undefined ? { variantId: input.variantId } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        ...(input.area !== undefined ? { area: input.area } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.status
          ? {
              status: input.status,
              ...(input.status === "SOLD" ? { soldAt: new Date() } : {}),
              ...(input.status === "ACTIVE"
                ? { publishedAt: existing.publishedAt ?? new Date() }
                : {}),
            }
          : {}),
      },
      include: { images: true, attributes: true, category: true },
    });
  }

  async publish(id: string, sellerId: string) {
    return this.update(id, sellerId, { status: "PENDING_REVIEW" });
  }

  async softDelete(id: string, sellerId: string) {
    const existing = await prisma.listing.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Listing not found");
    if (existing.sellerId !== sellerId) {
      throw new ForbiddenError("You can only delete your own listings");
    }
    return prisma.listing.update({
      where: { id },
      data: { deletedAt: new Date(), status: "DELETED" },
    });
  }

  async listBySeller(sellerId: string, take = 50) {
    return prisma.listing.findMany({
      where: { sellerId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: true,
      },
    });
  }

  async incrementViews(id: string, unique = false) {
    return prisma.listing.update({
      where: { id },
      data: {
        views: { increment: 1 },
        ...(unique ? { uniqueViews: { increment: 1 } } : {}),
      },
    });
  }
}

export const listingsService = new ListingsService();
