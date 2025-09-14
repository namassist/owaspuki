import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { password: hashed, role: "Pentester", name: "Admin" },
    create: { email: "admin@example.com", name: "Admin", password: hashed, role: "Pentester" },
  });
  console.log("✅ admin@example.com (Pentester)");
}
main().finally(()=>prisma.$disconnect());