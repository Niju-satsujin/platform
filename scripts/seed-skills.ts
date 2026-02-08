import { prisma } from "@/lib/db";
import { CORE_SKILLS } from "@/lib/skill-tree";

/**
 * Seed 25 core skills to the database
 * Run: npx tsx scripts/seed-skills.ts
 */
async function seedSkills() {
  try {
    console.log("🌱 Seeding 25 core skills...");

    for (const skill of CORE_SKILLS) {
      const existing = await prisma.skill.findUnique({
        where: { slug: skill.slug },
      });

      if (existing) {
        console.log(`  ✓ ${skill.slug} (already exists)`);
      } else {
        await prisma.skill.create({
          data: {
            slug: skill.slug,
            title: skill.title,
            description: skill.description,
            category: skill.category,
            spineOrder: skill.spineOrder,
            xpPerUse: skill.xpPerUse,
          },
        });
        console.log(`  ✓ Created: ${skill.title} (${skill.slug})`);
      }
    }

    console.log("✅ Skill seeding complete!");
  } catch (error) {
    console.error("❌ Skill seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedSkills();
