import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("seller1234", 12);
  const u = await prisma.user.upsert({
    where: { email: "seller@fairprice.ai" },
    create: {
      email: "seller@fairprice.ai",
      passwordHash: hash,
      name: "Local Seller",
      displayName: "Seller",
      role: "SELLER",
      onboardingDone: true,
      emailVerified: new Date(),
      verificationLevel: "EMAIL_VERIFIED",
      profile: {
        create: { city: "Hyderabad", state: "Telangana", country: "IN" },
      },
    },
    update: {
      passwordHash: hash,
      deletedAt: null,
      isBlocked: false,
    },
  });
  console.log("Seller ready:", u.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
