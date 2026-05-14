import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { checklistSeedData } from "../src/services/checklistService.js"

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      passwordHash,
      name: "Demo Admin",
      role: "admin",
    },
  })

  console.log("Created admin user:", admin.email)

  const demoLeads = [
    { title: "React Dashboard MVP", source: "upwork", budgetText: "$5,000 - $8,000", stackText: "React, TypeScript, Node.js", description: "Build a real-time analytics dashboard with interactive charts, user management, and data export features. Customer has detailed wireframes and API spec ready.", status: "new", userId: admin.id, redFlags: "" },
    { title: "Node.js API Integration", source: "referral", budgetText: "$3,000", stackText: "Node.js, Express, PostgreSQL", description: "Integrate third-party payment gateway and CRM API into existing Node.js backend. Requires thorough testing and documentation.", status: "reviewed", userId: admin.id, redFlags: "" },
    { title: "E-commerce Platform", source: "direct", budgetText: "Equity only", stackText: "Python, Django, React", description: "Build a full e-commerce platform from scratch with marketplace features.", status: "applied", userId: admin.id, redFlags: "equity, revshare" },
    { title: "Kubernetes Migration", source: "linkedin", budgetText: "$15,000 - $25,000", stackText: "Docker, Kubernetes, AWS, Terraform", description: "Migrate monolithic application to microservices architecture on AWS EKS. Must have CI/CD pipeline and monitoring setup.", status: "rejected", userId: admin.id, redFlags: "" },
    { title: "Mobile App Backend", source: "upwork", budgetText: "$10,000", stackText: "Node.js, GraphQL, MongoDB", description: "Design and implement GraphQL API for a fitness tracking mobile app. Need real-time notifications, social features, and payment integration.", status: "won", userId: admin.id, redFlags: "" },
    { title: "Legacy System Upgrade", source: "direct", budgetText: "", stackText: "Go, Rust, PostgreSQL", description: "Rewrite legacy PHP monolith in Go/Rust for 10x performance improvement. Very urgent timeline with no budget clarity.", status: "lost", userId: admin.id, redFlags: "urgent, no budget" },
  ]

  for (const leadData of demoLeads) {
    await prisma.lead.create({ data: leadData })
  }

  console.log(`Created ${demoLeads.length} demo leads`)

  const allLeads = await prisma.lead.findMany({ take: 2 })
  for (const lead of allLeads) {
    const { scoreLead } = await import("../src/services/leadScoring.js")
    const result = scoreLead({
      title: lead.title,
      source: lead.source,
      budgetText: lead.budgetText,
      stackText: lead.stackText,
      description: lead.description,
      redFlags: lead.redFlags,
    })

    await prisma.leadScore.create({
      data: {
        leadId: lead.id,
        score: result.score,
        reasons: result.reasons,
        redFlags: result.redFlags,
      },
    })

    await prisma.lead.update({
      where: { id: lead.id },
      data: { fitScore: result.score },
    })
  }

  console.log("Scored 2 leads")

  for (const template of checklistSeedData) {
    await prisma.checklistTemplate.create({
      data: {
        name: template.name,
        category: template.category,
        description: template.description,
        items: {
          create: template.items,
        },
      },
    })
  }

  console.log("Created checklist templates")

  await prisma.deploymentEvent.create({
    data: {
      environment: "production",
      version: "1.0.0",
      commitSha: "abc123def456",
      status: "success",
      message: "Initial deployment of MVP-ready API",
    },
  })

  console.log("Created deployment event")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
