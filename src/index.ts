import { prisma } from "./lib/prisma";

async function main() {
  //create a user
  const user = await prisma.user.create({
    data: {
      name: "John Doe",
    },
  });

  console.log("User created:", user);

  //fetch all users
  const users = await prisma.user.findMany();
  console.log("All users:", users);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
