const STACK_KEYWORDS = ["react", "node", "python", "docker", "typescript", "go", "rust", "aws", "kubernetes", "postgresql", "graphql"]
const RED_FLAG_KEYWORDS = ["urgent", "unpaid", "equity", "revshare", "spec work", "no budget"]

function matchesKeywords(text: string | null | undefined, keywords: string[]): string[] {
  if (!text) return []
  const lower = text.toLowerCase()
  return keywords.filter((kw) => lower.includes(kw))
}

export function scoreLead(lead: { title: string; source: string; budgetText: string | null; stackText: string | null; description: string | null; redFlags: string | null }) {
  let score = 0
  const reasons: string[] = []
  const detectedRedFlags: string[] = []

  const stackMatches = matchesKeywords(lead.stackText, STACK_KEYWORDS)
  if (stackMatches.length > 0) {
    score += 20
    reasons.push(`Stack matches: ${stackMatches.join(", ")} (+20)`)
  }

  if (lead.budgetText && /\d/.test(lead.budgetText)) {
    score += 15
    reasons.push("Budget contains numbers (+15)")
  }

  if (lead.description) {
    if (lead.description.length > 100) {
      score += 15
      reasons.push("Description is very clear (>100 chars) (+15)")
    } else if (lead.description.length > 50) {
      score += 8
      reasons.push("Description is somewhat clear (>50 chars) (+8)")
    }
  }

  if (lead.source === "referral" || lead.source === "upwork") {
    score += 5
    reasons.push(`Source is "${lead.source}" (+5)`)
  }

  const fieldRedFlags = matchesKeywords(lead.redFlags, RED_FLAG_KEYWORDS)
  detectedRedFlags.push(...fieldRedFlags)

  const descRedFlags = matchesKeywords(lead.description, RED_FLAG_KEYWORDS)
  detectedRedFlags.push(...descRedFlags)

  const uniqueRedFlags = [...new Set(detectedRedFlags)]
  const redFlagPenalty = uniqueRedFlags.length * 10
  if (redFlagPenalty > 0) {
    score -= redFlagPenalty
    reasons.push(`Red flags detected: ${uniqueRedFlags.join(", ")} (-${redFlagPenalty})`)
  }

  score = Math.max(0, Math.min(100, score))

  return { score, reasons, redFlags: uniqueRedFlags }
}
