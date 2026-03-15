const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const foundItems = await prisma.foundItem.findMany();
  const lostItems = await prisma.lostItem.findMany();
  const matches = await prisma.match.findMany();
  
  console.log("FOUND ITEMS:", JSON.stringify(foundItems, null, 2));
  console.log("LOST ITEMS:", JSON.stringify(lostItems, null, 2));
  console.log("MATCHES:", JSON.stringify(matches, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
