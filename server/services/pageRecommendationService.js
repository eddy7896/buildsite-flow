/**
 * Page Recommendation Service
 * Provides intelligent page recommendations based on agency characteristics
 */

const { pool } = require('../config/database');

/**
 * Calculate recommendation score for a page based on criteria
 * @param {Object} rule - Recommendation rule from database
 * @param {Object} criteria - Agency criteria (industry, companySize, primaryFocus, businessGoals)
 * @returns {number} Score (0-100+)
 */
function calculateScore(rule, criteria) {
  let score = 0;
  const { industry, companySize, primaryFocus, businessGoals } = criteria;

  // Exact industry match: +10 points
  if (rule.industry && Array.isArray(rule.industry) && rule.industry.length > 0) {
    if (rule.industry.includes(industry)) {
      score += 10;
    }
  }

  // Exact company size match: +5 points
  if (rule.company_size && Array.isArray(rule.company_size) && rule.company_size.length > 0) {
    if (rule.company_size.includes(companySize)) {
      score += 5;
    }
  }

  // Exact primary focus match: +8 points
  if (rule.primary_focus && Array.isArray(rule.primary_focus) && rule.primary_focus.length > 0) {
    if (rule.primary_focus.includes(primaryFocus)) {
      score += 8;
    }
  }

  // Business goal matches: +6 points per matching goal
  if (rule.business_goals && Array.isArray(rule.business_goals) && rule.business_goals.length > 0) {
    if (businessGoals && Array.isArray(businessGoals)) {
      const matchingGoals = businessGoals.filter(goal => rule.business_goals.includes(goal));
      score += matchingGoals.length * 6;
    }
  }

  // Required flag: +20 points (always included)
  if (rule.is_required) {
    score += 20;
  }

  // Priority multiplier: score × (priority / 10)
  const priorityMultiplier = rule.priority / 10;
  score = score * priorityMultiplier;

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Get recommended pages based on agency criteria
 * @param {Object} criteria - Agency characteristics
 * @param {string} criteria.industry - Industry type
 * @param {string} criteria.companySize - Company size
 * @param {string} criteria.primaryFocus - Primary focus area
 * @param {string[]} criteria.businessGoals - Array of business goals
 * @returns {Promise<Array>} Array of recommended pages with scores and reasoning
 */
async function getRecommendedPages(criteria) {
  const client = await pool.connect();
  try {
    const { industry, companySize, primaryFocus, businessGoals } = criteria;

    // Get all active pages with their recommendation rules
    const result = await client.query(`
      SELECT 
        pc.id,
        pc.path,
        pc.title,
        pc.description,
        pc.icon,
        pc.category,
        pc.base_cost,
        pc.requires_approval,
        pc.metadata,
        prr.id as rule_id,
        prr.industry,
        prr.company_size,
        prr.primary_focus,
        prr.business_goals,
        prr.priority,
        prr.is_required
      FROM public.page_catalog pc
      LEFT JOIN public.page_recommendation_rules prr ON pc.id = prr.page_id
      WHERE pc.is_active = true
      ORDER BY pc.category, pc.title
    `);

    // Group pages by page_id (a page can have multiple rules)
    const pageMap = new Map();

    for (const row of result.rows) {
      const pageId = row.id;
      
      if (!pageMap.has(pageId)) {
        pageMap.set(pageId, {
          id: row.id,
          path: row.path,
          title: row.title,
          description: row.description,
          icon: row.icon,
          category: row.category,
          base_cost: parseFloat(row.base_cost) || 0,
          requires_approval: row.requires_approval,
          metadata: row.metadata || {},
          rules: [],
          score: 0,
          reasoning: []
        });
      }

      const page = pageMap.get(pageId);

      // Add rule if it exists
      if (row.rule_id) {
        const rule = {
          id: row.rule_id,
          industry: row.industry,
          company_size: row.company_size,
          primary_focus: row.primary_focus,
          business_goals: row.business_goals,
          priority: row.priority,
          is_required: row.is_required
        };
        page.rules.push(rule);

        // Calculate score for this rule
        const ruleScore = calculateScore(rule, { industry, companySize, primaryFocus, businessGoals });
        
        // Use highest score from all rules
        if (ruleScore > page.score) {
          page.score = ruleScore;
        }

        // Build reasoning
        if (rule.is_required) {
          page.reasoning.push('Required for your agency type');
        }
        if (rule.industry && rule.industry.includes(industry)) {
          page.reasoning.push(`Recommended for ${industry} industry`);
        }
        if (rule.company_size && rule.company_size.includes(companySize)) {
          page.reasoning.push(`Recommended for ${companySize} companies`);
        }
        if (rule.primary_focus && rule.primary_focus.includes(primaryFocus)) {
          page.reasoning.push(`Matches your primary focus: ${primaryFocus}`);
        }
        if (rule.business_goals && businessGoals) {
          const matchingGoals = businessGoals.filter(goal => rule.business_goals.includes(goal));
          if (matchingGoals.length > 0) {
            page.reasoning.push(`Supports your goals: ${matchingGoals.join(', ')}`);
          }
        }
      } else {
        // Page has no rules, give it a base score of 1 (optional)
        if (page.score === 0) {
          page.score = 1;
        }
      }
    }

    // Convert map to array and sort by score (descending)
    const pages = Array.from(pageMap.values());
    
    // Sort by: required first, then by score descending
    pages.sort((a, b) => {
      const aRequired = a.rules.some(r => r.is_required);
      const bRequired = b.rules.some(r => r.is_required);
      
      if (aRequired && !bRequired) return -1;
      if (!aRequired && bRequired) return 1;
      
      return b.score - a.score;
    });

    // Categorize pages
    const categorized = {
      required: pages.filter(p => p.rules.some(r => r.is_required)),
      recommended: pages.filter(p => 
        !p.rules.some(r => r.is_required) && 
        p.score >= 10
      ),
      optional: pages.filter(p => 
        !p.rules.some(r => r.is_required) && 
        p.score < 10 && 
        p.score > 0
      )
    };

    return {
      all: pages,
      categorized,
      summary: {
        total: pages.length,
        required: categorized.required.length,
        recommended: categorized.recommended.length,
        optional: categorized.optional.length
      }
    };
  } finally {
    client.release();
  }
}

/**
 * Preview recommendations without saving
 * @param {Object} criteria - Agency characteristics
 * @returns {Promise<Object>} Preview of recommendations
 */
async function previewRecommendations(criteria) {
  return await getRecommendedPages(criteria);
}

module.exports = {
  getRecommendedPages,
  previewRecommendations,
  calculateScore
};

