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
  const priority = rule.priority || 5; // Default to 5 if not set
  const priorityMultiplier = priority / 10;
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
  let client;
  try {
    // Get database connection
    if (!pool) {
      console.error('[Page Recommendations] Database pool is not initialized');
      throw new Error('Database connection pool is not available');
    }

    client = await pool.connect();
    
    if (!client) {
      console.error('[Page Recommendations] Failed to get database client');
      throw new Error('Failed to establish database connection');
    }

    const { industry, companySize, primaryFocus, businessGoals } = criteria;

    // First, check if tables exist
    let tableCheck;
    try {
      tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'page_catalog'
        ) as catalog_exists,
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'page_recommendation_rules'
        ) as rules_exists
      `);
    } catch (queryError) {
      console.error('[Page Recommendations] Error checking table existence:', queryError);
      // If we can't check tables, assume they don't exist and return empty
      if (client) client.release();
      return {
        all: [],
        categorized: {
          required: [],
          recommended: [],
          optional: []
        },
        summary: {
          total: 0,
          required: 0,
          recommended: 0,
          optional: 0
        }
      };
    }

    if (!tableCheck || !tableCheck.rows || tableCheck.rows.length === 0) {
      console.warn('[Page Recommendations] Could not check table existence');
      if (client) client.release();
      return {
        all: [],
        categorized: {
          required: [],
          recommended: [],
          optional: []
        },
        summary: {
          total: 0,
          required: 0,
          recommended: 0,
          optional: 0
        }
      };
    }

    const { catalog_exists, rules_exists } = tableCheck.rows[0];

    if (!catalog_exists) {
      console.warn('[Page Recommendations] page_catalog table does not exist');
      // Return empty recommendations if tables don't exist
      if (client) client.release();
      return {
        all: [],
        categorized: {
          required: [],
          recommended: [],
          optional: []
        },
        summary: {
          total: 0,
          required: 0,
          recommended: 0,
          optional: 0
        }
      };
    }

    // Get all active pages with their recommendation rules
    let result;
    try {
      result = await client.query(`
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
    } catch (queryError) {
      console.error('[Page Recommendations] Error querying pages:', queryError);
      console.error('[Page Recommendations] Query error details:', {
        message: queryError.message,
        code: queryError.code,
        detail: queryError.detail
      });
      if (client) client.release();
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    // Group pages by page_id (a page can have multiple rules)
    const pageMap = new Map();

    for (const row of result.rows) {
      const pageId = row.id;
      
      if (!pageMap.has(pageId)) {
        // Safely parse metadata JSONB field
        let metadata = {};
        if (row.metadata) {
          if (typeof row.metadata === 'string') {
            try {
              metadata = JSON.parse(row.metadata);
            } catch {
              metadata = {};
            }
          } else if (typeof row.metadata === 'object') {
            metadata = row.metadata;
          }
        }

        pageMap.set(pageId, {
          id: row.id,
          path: row.path,
          title: row.title,
          description: row.description,
          icon: row.icon,
          category: row.category,
          base_cost: parseFloat(row.base_cost) || 0,
          requires_approval: row.requires_approval || false,
          metadata: metadata,
          rules: [],
          score: 0,
          reasoning: []
        });
      }

      const page = pageMap.get(pageId);

      // Add rule if it exists
      if (row.rule_id) {
        // Safely parse JSONB/array fields
        let industry = row.industry;
        let company_size = row.company_size;
        let primary_focus = row.primary_focus;
        let business_goals = row.business_goals;

        // Handle JSONB/array fields - they might come as strings or arrays
        if (typeof industry === 'string') {
          try {
            industry = JSON.parse(industry);
          } catch {
            industry = industry ? [industry] : null;
          }
        }
        if (typeof company_size === 'string') {
          try {
            company_size = JSON.parse(company_size);
          } catch {
            company_size = company_size ? [company_size] : null;
          }
        }
        if (typeof primary_focus === 'string') {
          try {
            primary_focus = JSON.parse(primary_focus);
          } catch {
            primary_focus = primary_focus ? [primary_focus] : null;
          }
        }
        if (typeof business_goals === 'string') {
          try {
            business_goals = JSON.parse(business_goals);
          } catch {
            business_goals = business_goals ? [business_goals] : null;
          }
        }

        const rule = {
          id: row.rule_id,
          industry: industry,
          company_size: company_size,
          primary_focus: primary_focus,
          business_goals: business_goals,
          priority: row.priority || 5,
          is_required: row.is_required || false
        };
        page.rules.push(rule);

        // Calculate score for this rule
        const ruleScore = calculateScore(rule, { industry, companySize, primaryFocus, businessGoals });
        
        // Use highest score from all rules
        if (ruleScore > page.score) {
          page.score = ruleScore;
        }

        // Build reasoning (safely handle array fields)
        if (rule.is_required) {
          page.reasoning.push('Required for your agency type');
        }
        if (rule.industry && Array.isArray(rule.industry) && rule.industry.includes(industry)) {
          page.reasoning.push(`Recommended for ${industry} industry`);
        }
        if (rule.company_size && Array.isArray(rule.company_size) && rule.company_size.includes(companySize)) {
          page.reasoning.push(`Recommended for ${companySize} companies`);
        }
        if (rule.primary_focus && Array.isArray(rule.primary_focus) && rule.primary_focus.includes(primaryFocus)) {
          page.reasoning.push(`Matches your primary focus: ${primaryFocus}`);
        }
        if (rule.business_goals && Array.isArray(rule.business_goals) && businessGoals && Array.isArray(businessGoals)) {
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
  } catch (error) {
    console.error('[Page Recommendations] Error in getRecommendedPages:', error);
    console.error('[Page Recommendations] Error stack:', error.stack);
    console.error('[Page Recommendations] Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      name: error.name
    });
    
    // Release client if it exists
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('[Page Recommendations] Error releasing client:', releaseError);
      }
    }
    
    // Re-throw to be handled by route handler
    throw error;
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

