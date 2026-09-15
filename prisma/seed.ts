import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPORTSBOOKS = ["Playdoit", "Draftea", "Caliente", "Codere", "bet365"];

const SPORTS_WITH_LEAGUES: Record<string, string[]> = {
  Fútbol: ["Liga MX", "Premier League", "La Liga", "Champions League", "MLS"],
  NFL: ["NFL"],
  NBA: ["NBA"],
  MLB: ["MLB"],
  "Box/MMA": ["UFC", "Boxeo"],
  Tenis: ["ATP", "WTA"],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Sembrando catálogo inicial...");

  for (const name of SPORTSBOOKS) {
    await prisma.sportsbook.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }

  for (const [sportName, leagues] of Object.entries(SPORTS_WITH_LEAGUES)) {
    const sport = await prisma.sport.upsert({
      where: { slug: slugify(sportName) },
      update: {},
      create: { name: sportName, slug: slugify(sportName) },
    });

    for (const leagueName of leagues) {
      await prisma.league.upsert({
        where: { name_sportId: { name: leagueName, sportId: sport.id } },
        update: {},
        create: { name: leagueName, sportId: sport.id },
      });
    }
  }

  console.log("Catálogo sembrado correctamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
