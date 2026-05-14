import Fastify from "fastify"
import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  lead: {
    findMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  leadScore: {
    create: vi.fn(),
  },
  checklistTemplate: {
    findMany: vi.fn(),
  },
  checklistItem: {
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}))

vi.mock("../src/server.js", () => ({
  prisma: prismaMock,
}))

import healthRoutes from "../src/routes/health.js"
import leadRoutes from "../src/routes/leads.js"
import checklistRoutes from "../src/routes/checklists.js"

function buildApp() {
  const app = Fastify()
  app.decorate("authenticate", async (request: { user?: { userId: string; email: string } }) => {
    request.user = { userId: "user-1", email: "demo@example.com" }
  })
  return app
}

beforeEach(() => {
  vi.resetAllMocks()
  prismaMock.$queryRaw.mockResolvedValue({})
  prismaMock.lead.findMany.mockResolvedValue([])
  prismaMock.lead.create.mockImplementation(async ({ data }) => ({
    id: "lead-1",
    title: data.title,
    source: data.source ?? "manual",
    budgetText: data.budgetText ?? "",
    stackText: data.stackText ?? "",
    description: data.description ?? "",
    status: data.status ?? "new",
    fitScore: data.fitScore ?? 0,
    redFlags: data.redFlags ?? "",
    notes: data.notes ?? "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: data.userId,
  }))
  prismaMock.lead.findUnique.mockResolvedValue({
    id: "lead-1",
    title: "React Dashboard MVP",
    source: "upwork",
    budgetText: "$5k",
    stackText: "React, Node, PostgreSQL",
    description: "Build an internal dashboard",
    status: "new",
    fitScore: 0,
    redFlags: "",
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "user-1",
  })
  prismaMock.lead.update.mockImplementation(async ({ data }) => ({
    id: "lead-1",
    title: data.title ?? "React Dashboard MVP",
    source: data.source ?? "upwork",
    budgetText: data.budgetText ?? "$5k",
    stackText: data.stackText ?? "React, Node, PostgreSQL",
    description: data.description ?? "Build an internal dashboard",
    status: data.status ?? "reviewed",
    fitScore: 42,
    redFlags: data.redFlags ?? "",
    notes: data.notes ?? "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "user-1",
  }))
  prismaMock.leadScore.create.mockResolvedValue({ id: "score-1", leadId: "lead-1", score: 42, reasons: "", redFlags: "" })
  prismaMock.checklistTemplate.findMany.mockResolvedValue([
    {
      id: "tpl-1",
      name: "Docker",
      category: "docker",
      description: "Docker checks",
      createdAt: new Date().toISOString(),
      items: [],
    },
  ])
  prismaMock.checklistItem.update.mockResolvedValue({
    id: "item-1",
    templateId: "tpl-1",
    title: "Healthcheck configured",
    description: "Set healthcheck",
    severity: "medium",
    status: "pass",
    evidence: "checked",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
})

describe("route integration", () => {
  it("GET /ready reports database connectivity", async () => {
    const app = buildApp()
    await app.register(healthRoutes)
    await app.ready()

    const res = await app.inject({ method: "GET", url: "/ready" })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.status).toBe("ok")
    expect(body.database).toBe("connected")
    await app.close()
  })

  it("GET/POST/PATCH /api/leads works with mocked prisma", async () => {
    const app = buildApp()
    await app.register(leadRoutes)
    await app.ready()

    const list = await app.inject({ method: "GET", url: "/api/leads" })
    expect(list.statusCode).toBe(200)
    expect(list.json()).toHaveProperty("leads")

    const created = await app.inject({
      method: "POST",
      url: "/api/leads",
      payload: {
        title: "React Dashboard MVP",
        source: "upwork",
        budgetText: "$5k",
        stackText: "React, Node, PostgreSQL",
        description: "Build an internal dashboard",
        status: "new",
        redFlags: "",
        notes: "",
      },
    })
    expect(created.statusCode).toBe(201)
    expect(created.json().lead.title).toBe("React Dashboard MVP")

    const patched = await app.inject({
      method: "PATCH",
      url: "/api/leads/lead-1",
      payload: { status: "reviewed", notes: "updated" },
    })
    expect(patched.statusCode).toBe(200)
    expect(patched.json().lead.status).toBe("reviewed")

    await app.close()
  })

  it("GET/POST /api/checklists works with mocked prisma", async () => {
    const app = buildApp()
    await app.register(checklistRoutes)
    await app.ready()

    const list = await app.inject({ method: "GET", url: "/api/checklists" })
    expect(list.statusCode).toBe(200)
    expect(list.json().templates).toHaveLength(1)

    const updated = await app.inject({
      method: "POST",
      url: "/api/checklists",
      payload: {
        itemId: "item-1",
        status: "pass",
        evidence: "checked",
      },
    })
    expect(updated.statusCode).toBe(200)
    expect(updated.json().item.status).toBe("pass")

    await app.close()
  })
})
