require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const databaseUrl = process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/perkara_pos_local";
const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  const deleted = await prisma.shiftLog.deleteMany({});
  console.log(`Successfully cleared ${deleted.count} attendance/shift logs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
