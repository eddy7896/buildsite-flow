import { useState, useEffect } from 'react';
import { queryMainDatabase } from '@/integrations/postgresql/client-http';
import { useToast } from '@/hooks/use-toast';
import { generateUUID } from '@/lib/uuid';

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  feature_key: string;
  enabled: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  is_active: boolean;
  max_users?: number;
  max_agencies?: number;
  max_storage_gb?: number;
  stripe_product_id?: string;
  stripe_price_id?: string;
  features: PlanFeature[];
}

export const usePlanManagement = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<PlanFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      setLoading(true);

      // Fetch all plans from main database (including inactive)
      const plansResult = await queryMainDatabase<any>(
        `SELECT * FROM public.subscription_plans ORDER BY price ASC, created_at DESC`,
        []
      );
      const plansData = plansResult.rows || [];

      // Fetch feature mappings for all plans
      const planIds = plansData.map((p: any) => p.id);
      let featureMappings: any[] = [];
      if (planIds.length > 0) {
        const placeholders = planIds.map((_, i) => `$${i + 1}`).join(',');
        const mappingsResult = await queryMainDatabase<any>(
          `SELECT 
            pfm.plan_id,
            pfm.feature_id,
            pfm.enabled,
            pf.id,
            pf.name,
            pf.description,
            pf.feature_key
          FROM public.plan_feature_mappings pfm
          INNER JOIN public.plan_features pf ON pfm.feature_id = pf.id
          WHERE pfm.plan_id IN (${placeholders})`,
          planIds
        );
        featureMappings = mappingsResult.rows || [];
      }

      // Group feature mappings by plan_id
      const mappingsByPlan = featureMappings.reduce((acc: any, mapping: any) => {
        if (!acc[mapping.plan_id]) {
          acc[mapping.plan_id] = [];
        }
        acc[mapping.plan_id].push({
          id: mapping.id,
          name: mapping.name,
          description: mapping.description,
          feature_key: mapping.feature_key,
          enabled: mapping.enabled
        });
        return acc;
      }, {});

      // Transform the data to match our interface
      const transformedPlans: SubscriptionPlan[] = plansData.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        price: Number(plan.price),
        currency: plan.currency,
        interval: plan.interval,
        is_active: plan.is_active,
        max_users: plan.max_users,
        max_agencies: plan.max_agencies,
        max_storage_gb: plan.max_storage_gb,
        stripe_product_id: plan.stripe_product_id,
        stripe_price_id: plan.stripe_price_id,
        features: mappingsByPlan[plan.id] || []
      }));

      setPlans(transformedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFeatures = async () => {
    try {
      // Fetch features from main database
      const featuresResult = await queryMainDatabase<any>(
        `SELECT * FROM public.plan_features WHERE is_active = $1 ORDER BY name ASC`,
        [true]
      );

      const transformedFeatures: PlanFeature[] = featuresResult.rows?.map((feature: any) => ({
        id: feature.id,
        name: feature.name,
        description: feature.description || '',
        feature_key: feature.feature_key,
        enabled: false // Default for available features
      })) || [];

      setAvailableFeatures(transformedFeatures);
    } catch (error) {
      console.error('Error fetching features:', error);
      toast({
        title: "Error",
        description: "Failed to load available features",
        variant: "destructive",
      });
    }
  };

  const updatePlan = async (planId: string, updates: Partial<SubscriptionPlan>) => {
    try {
      // Update plan in main database
      const updateResult = await queryMainDatabase<any>(
        `UPDATE public.subscription_plans 
         SET name = $1, description = $2, price = $3, currency = $4, interval = $5, 
             is_active = $6, max_users = $7, max_agencies = $8, max_storage_gb = $9,
             stripe_product_id = $10, stripe_price_id = $11, updated_at = NOW()
         WHERE id = $12
         RETURNING *`,
        [
          updates.name,
          updates.description,
          updates.price,
          updates.currency,
          updates.interval,
          updates.is_active,
          updates.max_users,
          updates.max_agencies,
          updates.max_storage_gb,
          updates.stripe_product_id,
          updates.stripe_price_id,
          planId
        ]
      );

      if (updateResult.rowCount === 0) {
        throw new Error('Plan not found');
      }

      // Update features if provided
      if (updates.features) {
        // Delete existing mappings
        await queryMainDatabase(
          `DELETE FROM public.plan_feature_mappings WHERE plan_id = $1`,
          [planId]
        );

        // Insert new mappings
        if (updates.features.length > 0) {
          const values = updates.features.map((_, i) => 
            `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`
          ).join(',');
          const params = updates.features.flatMap(f => [planId, f.id, f.enabled]);
          
          await queryMainDatabase(
            `INSERT INTO public.plan_feature_mappings (plan_id, feature_id, enabled) 
             VALUES ${values}
             ON CONFLICT (plan_id, feature_id) DO UPDATE SET enabled = EXCLUDED.enabled`,
            params
          );
        }
      }

      toast({
        title: "Success",
        description: "Plan updated successfully",
      });

      fetchPlans(); // Refresh data
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive",
      });
    }
  };

  const createPlan = async (planData: Omit<SubscriptionPlan, 'id'>) => {
    try {
      // Generate UUID for new plan
      const planId = generateUUID();

      // Insert plan in main database
      const insertResult = await queryMainDatabase<any>(
        `INSERT INTO public.subscription_plans 
         (id, name, description, price, currency, interval, is_active, 
          max_users, max_agencies, max_storage_gb, stripe_product_id, stripe_price_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         RETURNING *`,
        [
          planId,
          planData.name,
          planData.description,
          planData.price,
          planData.currency,
          planData.interval,
          planData.is_active,
          planData.max_users,
          planData.max_agencies,
          planData.max_storage_gb,
          planData.stripe_product_id,
          planData.stripe_price_id
        ]
      );

      const newPlan = insertResult.rows[0];
      if (!newPlan) {
        throw new Error('Failed to create plan');
      }

      // Add feature mappings
      if (planData.features && planData.features.length > 0) {
        const values = planData.features.map((_, i) => 
          `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`
        ).join(',');
        const params = planData.features.flatMap(f => [planId, f.id, f.enabled]);

        await queryMainDatabase(
          `INSERT INTO public.plan_feature_mappings (plan_id, feature_id, enabled) 
           VALUES ${values}`,
          params
        );
      }

      toast({
        title: "Success",
        description: "Plan created successfully",
      });

      fetchPlans(); // Refresh data
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Error",
        description: "Failed to create plan",
        variant: "destructive",
      });
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      // Deactivate plan in main database
      const updateResult = await queryMainDatabase(
        `UPDATE public.subscription_plans 
         SET is_active = $1, updated_at = NOW()
         WHERE id = $2`,
        [false, planId]
      );

      if (updateResult.rowCount === 0) {
        throw new Error('Plan not found');
      }

      toast({
        title: "Success",
        description: "Plan deactivated successfully",
      });

      fetchPlans(); // Refresh data
    } catch (error) {
      console.error('Error deactivating plan:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate plan",
        variant: "destructive",
      });
    }
  };

  const createFeature = async (featureData: Omit<PlanFeature, 'id' | 'enabled'>) => {
    try {
      const featureId = generateUUID();

      const insertResult = await queryMainDatabase<any>(
        `INSERT INTO public.plan_features 
         (id, name, description, feature_key, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [
          featureId,
          featureData.name,
          featureData.description,
          featureData.feature_key,
          true
        ]
      );

      if (!insertResult.rows[0]) {
        throw new Error('Failed to create feature');
      }

      toast({
        title: "Success",
        description: "Feature created successfully",
      });

      await fetchAvailableFeatures();
    } catch (error: any) {
      console.error('Error creating feature:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create feature",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateFeature = async (featureId: string, updates: Partial<Omit<PlanFeature, 'id' | 'enabled'>>) => {
    try {
      const updateResult = await queryMainDatabase<any>(
        `UPDATE public.plan_features 
         SET name = COALESCE($1, name), 
             description = COALESCE($2, description),
             feature_key = COALESCE($3, feature_key),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [
          updates.name,
          updates.description,
          updates.feature_key,
          featureId
        ]
      );

      if (updateResult.rowCount === 0) {
        throw new Error('Feature not found');
      }

      toast({
        title: "Success",
        description: "Feature updated successfully",
      });

      await fetchAvailableFeatures();
    } catch (error: any) {
      console.error('Error updating feature:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update feature",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteFeature = async (featureId: string) => {
    try {
      // Check if feature is used in any plans
      const usageResult = await queryMainDatabase<any>(
        `SELECT COUNT(*) as count FROM public.plan_feature_mappings WHERE feature_id = $1`,
        [featureId]
      );

      const usageCount = parseInt(usageResult.rows[0]?.count || '0');

      if (usageCount > 0) {
        // Deactivate instead of delete
        await queryMainDatabase(
          `UPDATE public.plan_features 
           SET is_active = $1, updated_at = NOW()
           WHERE id = $2`,
          [false, featureId]
        );
        toast({
          title: "Success",
          description: "Feature deactivated (it's still used in plans)",
        });
      } else {
        // Safe to delete
        const deleteResult = await queryMainDatabase(
          `DELETE FROM public.plan_features WHERE id = $1`,
          [featureId]
        );

        if (deleteResult.rowCount === 0) {
          throw new Error('Feature not found');
        }

        toast({
          title: "Success",
          description: "Feature deleted successfully",
        });
      }

      await fetchAvailableFeatures();
    } catch (error: any) {
      console.error('Error deleting feature:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete feature",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchAvailableFeatures();
  }, []);

  return {
    plans,
    availableFeatures,
    loading,
    updatePlan,
    createPlan,
    deletePlan,
    refreshPlans: fetchPlans,
    createFeature,
    updateFeature,
    deleteFeature,
    refreshFeatures: fetchAvailableFeatures
  };
};