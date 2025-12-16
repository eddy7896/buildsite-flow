import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

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

      // Fetch plans with their features
      const { data: plansData, error: plansError } = await db
        .from('subscription_plans')
        .select(`
          *,
          plan_feature_mappings!inner(
            enabled,
            plan_features(
              id,
              name,
              description,
              feature_key
            )
          )
        `)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (plansError) throw plansError;

      // Transform the data to match our interface
      const transformedPlans: SubscriptionPlan[] = plansData?.map(plan => ({
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
        features: plan.plan_feature_mappings?.map((mapping: any) => ({
          id: mapping.plan_features.id,
          name: mapping.plan_features.name,
          description: mapping.plan_features.description,
          feature_key: mapping.plan_features.feature_key,
          enabled: mapping.enabled
        })) || []
      })) || [];

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
      const { data, error } = await db
        .from('plan_features')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const transformedFeatures: PlanFeature[] = data?.map(feature => ({
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
      const { error } = await db
        .from('subscription_plans')
        .update({
          name: updates.name,
          description: updates.description,
          price: updates.price,
          currency: updates.currency,
          interval: updates.interval,
          is_active: updates.is_active,
          max_users: updates.max_users,
          max_agencies: updates.max_agencies,
          max_storage_gb: updates.max_storage_gb,
          stripe_product_id: updates.stripe_product_id,
          stripe_price_id: updates.stripe_price_id,
        })
        .eq('id', planId);

      if (error) throw error;

      // Update features if provided
      if (updates.features) {
        for (const feature of updates.features) {
          await db
            .from('plan_feature_mappings')
            .upsert({
              plan_id: planId,
              feature_id: feature.id,
              enabled: feature.enabled
            });
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
      const { data: newPlan, error: planError } = await db
        .from('subscription_plans')
        .insert({
          name: planData.name,
          description: planData.description,
          price: planData.price,
          currency: planData.currency,
          interval: planData.interval,
          is_active: planData.is_active,
          max_users: planData.max_users,
          max_agencies: planData.max_agencies,
          max_storage_gb: planData.max_storage_gb,
          stripe_product_id: planData.stripe_product_id,
          stripe_price_id: planData.stripe_price_id,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Add feature mappings
      if (planData.features && planData.features.length > 0) {
        const featureMappings = planData.features.map(feature => ({
          plan_id: newPlan.id,
          feature_id: feature.id,
          enabled: feature.enabled
        }));

        const { error: mappingsError } = await db
          .from('plan_feature_mappings')
          .insert(featureMappings);

        if (mappingsError) throw mappingsError;
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
      const { error } = await db
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('id', planId);

      if (error) throw error;

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
    refreshPlans: fetchPlans
  };
};