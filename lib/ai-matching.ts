import {
  type AIRecommendation,
  type FreelancerProfile,
  type Opportunity,
  type RecommendationBreakdown,
  type RecommendationDetails,
} from "@/types";
import { clampScore } from "@/lib/utils";

function arrayOrEmpty<T>(value: T[] | unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function calculateSkillsMatch(
  freelancer: FreelancerProfile,
  opportunity: Opportunity
) {
  const sourceSkills = arrayOrEmpty<string>(freelancer.skills);
  const opportunitySkills = arrayOrEmpty<string>(opportunity.requiredSkills);
  const profileSkills = sourceSkills.map((skill) => skill.toLowerCase());
  const requiredSkills = opportunitySkills.map((skill) => skill.toLowerCase());
  const matchedSkills = opportunitySkills.filter((skill) =>
    profileSkills.some((profileSkill) => profileSkill.includes(skill.toLowerCase()))
  );

  const score = requiredSkills.length
    ? (matchedSkills.length / requiredSkills.length) * 100
    : 0;

  return {
    matchedSkills,
    score: clampScore(score),
  };
}

function calculateExperienceMatch(
  freelancer: FreelancerProfile,
  opportunity: Opportunity
) {
  const ratio = freelancer.yearsExperience / Math.max(opportunity.minExperience, 1);
  if (ratio >= 1.35) return 100;
  if (ratio >= 1) return 90;
  if (ratio >= 0.8) return 72;
  if (ratio >= 0.5) return 48;
  return 24;
}

function calculateBudgetCompatibility(
  freelancer: FreelancerProfile,
  opportunity: Opportunity
) {
  const midpoint = (opportunity.budgetMin + opportunity.budgetMax) / 2;
  const diffRatio = Math.abs(freelancer.desiredMonthlyBudget - midpoint) / midpoint;

  if (diffRatio <= 0.15) return { score: 100, band: "excellent" as const };
  if (diffRatio <= 0.3) return { score: 80, band: "good" as const };
  if (diffRatio <= 0.5) return { score: 55, band: "fair" as const };
  return { score: 28, band: "poor" as const };
}

function calculateIndustryRelevance(
  freelancer: FreelancerProfile,
  opportunity: Opportunity
) {
  const sectors = arrayOrEmpty<string>(freelancer.sectors).map((sector) =>
    sector.toLowerCase()
  );
  const industry = opportunity.industry?.toLowerCase() ?? "";
  const category = opportunity.category?.toLowerCase() ?? "";

  const sectorHit = sectors.includes(industry)
    ? 100
    : sectors.some((sector) => sector.includes(industry) || industry.includes(sector))
      ? 82
      : 55;

  const categoryBoost = (freelancer.bio ?? "").toLowerCase().includes(category)
    ? 10
    : 0;
  return clampScore(sectorHit + categoryBoost);
}

export function buildRecommendation(
  startupId: string,
  freelancer: FreelancerProfile,
  opportunity: Opportunity
): Omit<AIRecommendation, "id" | "createdAt" | "updatedAt"> {
  const skills = calculateSkillsMatch(freelancer, opportunity);
  const experienceMatch = calculateExperienceMatch(freelancer, opportunity);
  const budget = calculateBudgetCompatibility(freelancer, opportunity);
  const industry = calculateIndustryRelevance(freelancer, opportunity);

  const breakdown: RecommendationBreakdown = {
    skillsMatch: skills.score,
    experienceMatch,
    budgetCompatibility: budget.score,
    industryRelevance: industry,
  };

  const score = clampScore(
    breakdown.skillsMatch * 0.4 +
      breakdown.experienceMatch * 0.25 +
      breakdown.budgetCompatibility * 0.2 +
      breakdown.industryRelevance * 0.15
  );

  const details: RecommendationDetails = {
    matchedSkills: skills.matchedSkills,
    budgetBand: budget.band,
    experienceSummary:
      freelancer.yearsExperience >= opportunity.minExperience
        ? `${freelancer.yearsExperience} years covers the ${opportunity.minExperience}+ year ask`
        : `${opportunity.minExperience - freelancer.yearsExperience} more year(s) would close the gap`,
    categorySummary: `${freelancer.focusRole} strength applied to ${opportunity.category}`,
  };

  return {
    startupId,
    freelancerId: freelancer.id,
    opportunityId: opportunity.id,
    score,
    breakdown,
    details,
  };
}
