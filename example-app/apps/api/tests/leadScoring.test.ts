import { describe, it, expect } from "vitest"
import { scoreLead } from "../src/services/leadScoring.js"

describe("leadScoring", () => {
  it("should add points for stack keyword matches", () => {
    const result = scoreLead({
      title: "React Dashboard",
      source: "upwork",
      budgetText: null,
      stackText: "React, TypeScript, Node.js, Docker",
      description: null,
      redFlags: null,
    })

    expect(result.score).toBeGreaterThanOrEqual(20)
    expect(result.reasons.some((r) => r.includes("Stack matches"))).toBe(true)
  })

  it("should penalize red flags", () => {
    const result = scoreLead({
      title: "Urgent Project",
      source: "direct",
      budgetText: null,
      stackText: null,
      description: "This is an urgent project with equity only",
      redFlags: "unpaid, equity",
    })

    expect(result.score).toBeLessThan(100)
    expect(result.redFlags.length).toBeGreaterThanOrEqual(1)
  })

  it("should add points for clear budget and description", () => {
    const result = scoreLead({
      title: "Well Defined Project",
      source: "manual",
      budgetText: "$10,000 budget available",
      stackText: null,
      description: "A" + " very clear and detailed project description with lots of context and requirements that exceeds one hundred characters easily to get the full bonus points.",
      redFlags: null,
    })

    expect(result.score).toBeGreaterThanOrEqual(30)
    expect(result.reasons.some((r) => r.includes("Budget contains numbers"))).toBe(true)
    expect(result.reasons.some((r) => r.includes("very clear"))).toBe(true)
  })

  it("should clamp score between 0 and 100", () => {
    const resultNoPenalty = scoreLead({
      title: "Perfect Lead",
      source: "referral",
      budgetText: "$50,000",
      stackText: "React, TypeScript, Node.js, Docker, AWS, Kubernetes, Python, Go, Rust",
      description: "A".repeat(200),
      redFlags: null,
    })

    expect(resultNoPenalty.score).toBeLessThanOrEqual(100)

    const resultHeavyPenalty = scoreLead({
      title: "Terrible Lead",
      source: "direct",
      budgetText: null,
      stackText: null,
      description: "urgent unpaid equity revshare no budget spec work",
      redFlags: "urgent, unpaid, equity, revshare, spec work, no budget",
    })

    expect(resultHeavyPenalty.score).toBeGreaterThanOrEqual(0)
  })
})
