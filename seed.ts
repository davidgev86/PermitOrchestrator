import { db } from "./server/db";
import { storage } from "./server/storage";
import { resolveAHJ } from "./server/services/location";

async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  try {
    // Create demo organization
    const org = await storage.createOrg({
      name: "D&I Contracting (Demo)"
    });
    console.log(`✅ Created demo org: ${org.name}`);

    // Create demo user
    const orgUser = await storage.createOrgUser({
      userEmail: "demo@local.test",
      role: "owner",
      orgId: org.id
    });
    console.log(`✅ Created demo user: ${orgUser.userEmail}`);

    // Create locations
    const gaithersburgLocation = await storage.createLocation({
      address1: "123 Maple Ave",
      city: "Gaithersburg",
      state: "MD",
      postal: "20878",
      ahjKey: resolveAHJ({ city: "Gaithersburg", state: "MD" })
    });
    console.log(`✅ Created Gaithersburg location: ${gaithersburgLocation.address1}`);

    const germantownLocation = await storage.createLocation({
      address1: "45 Sunrise Dr",
      city: "Germantown",
      state: "MD",
      postal: "20874",
      ahjKey: resolveAHJ({ city: "Germantown", state: "MD" })
    });
    console.log(`✅ Created Germantown location: ${germantownLocation.address1}`);

    // Create demo projects
    const gaithersburgProject = await storage.createProject({
      name: "Kitchen Remodel - Maple Ave",
      orgId: org.id,
      locationId: gaithersburgLocation.id,
      valuationUSD: 15000,
      tradeTags: ["electrical", "plumbing"]
    });
    console.log(`✅ Created Gaithersburg project: ${gaithersburgProject.name}`);

    const germantownProject = await storage.createProject({
      name: "Kitchen Renovation - Sunrise Dr",
      orgId: org.id,
      locationId: germantownLocation.id,
      valuationUSD: 22000,
      tradeTags: ["electrical", "plumbing", "structural"]
    });
    console.log(`✅ Created Germantown project: ${germantownProject.name}`);

    // Create permit cases
    const gaithersburgCase = await storage.createPermitCase({
      orgId: org.id,
      projectId: gaithersburgProject.id,
      ahjKey: gaithersburgLocation.ahjKey,
      permitType: "residential_kitchen_remodel",
      status: "draft",
      forms: {
        "application_main.pdf": {
          filled: false,
          required: true
        }
      },
      attachments: {
        "plans.pdf": { uploaded: false, required: true },
        "site_plan.pdf": { uploaded: true, required: true },
        "contractor_license.pdf": { uploaded: true, required: true },
        "insurance_acord25.pdf": { uploaded: true, required: true }
      }
    });
    console.log(`✅ Created Gaithersburg permit case: ${gaithersburgCase.id}`);

    const germantownCase = await storage.createPermitCase({
      orgId: org.id,
      projectId: germantownProject.id,
      ahjKey: germantownLocation.ahjKey,
      permitType: "residential_kitchen_remodel",
      status: "precheck_ready",
      forms: {
        "building_permit_application.pdf": {
          filled: true,
          required: true
        },
        "residential_alteration_checklist.pdf": {
          filled: false,
          required: true
        }
      },
      attachments: {
        "architectural_plans.pdf": { uploaded: true, required: true },
        "site_plan.pdf": { uploaded: true, required: true },
        "contractor_license.pdf": { uploaded: true, required: true },
        "insurance_acord25.pdf": { uploaded: true, required: true },
        "energy_compliance.pdf": { uploaded: false, required: true }
      },
      feeEstimateUSD: 464
    });
    console.log(`✅ Created Germantown permit case: ${germantownCase.id}`);

    // Create sample events
    await storage.createEvent({
      orgId: org.id,
      entity: "Project",
      entityId: gaithersburgProject.id,
      actor: orgUser.userEmail,
      action: "PROJECT_CREATED",
      after: gaithersburgProject
    });

    await storage.createEvent({
      orgId: org.id,
      entity: "PermitCase",
      entityId: gaithersburgCase.id,
      actor: orgUser.userEmail,
      action: "CASE_CREATED",
      after: gaithersburgCase
    });

    await storage.createEvent({
      orgId: org.id,
      entity: "PermitCase",
      entityId: germantownCase.id,
      actor: "system",
      action: "PRECHECK_COMPLETED",
      before: { status: "draft" },
      after: germantownCase
    });

    console.log("🎉 Database seeded successfully!");
    console.log("\n📋 Demo Data Summary:");
    console.log(`   Organization: ${org.name}`);
    console.log(`   User: ${orgUser.userEmail}`);
    console.log(`   Projects: 2 (${gaithersburgProject.name}, ${germantownProject.name})`);
    console.log(`   Permit Cases: 2`);
    console.log(`   Jurisdictions: Gaithersburg, Montgomery County (Germantown)`);
    console.log("\n🚀 You can now run the application with: npm run dev");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}

export { seedDatabase };
