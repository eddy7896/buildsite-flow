import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, DollarSign, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePlanManagement, type SubscriptionPlan, type PlanFeature } from '@/hooks/usePlanManagement';

const PlanManagement = () => {
  const { toast } = useToast();
  const { plans, availableFeatures, loading, updatePlan, createPlan, deletePlan } = usePlanManagement();
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({});

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setEditForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      is_active: plan.is_active,
      max_users: plan.max_users,
      max_agencies: plan.max_agencies,
      max_storage_gb: plan.max_storage_gb,
      features: [...plan.features]
    });
    setIsEditing(true);
  };

  const handleSavePlan = async () => {
    if (!selectedPlan || !editForm) return;

    await updatePlan(selectedPlan.id, editForm);
    setIsEditing(false);
    setSelectedPlan(null);
    setEditForm({});
  };

  const handleFeatureToggle = (featureId: string) => {
    setEditForm(prev => ({
      ...prev,
      features: prev.features?.map(feature =>
        feature.id === featureId 
          ? { ...feature, enabled: !feature.enabled }
          : feature
      ) || []
    }));
  };

  const handleAddNewPlan = () => {
    const newPlanForm: Partial<SubscriptionPlan> = {
      name: 'New Plan',
      description: 'Plan description',
      price: 0,
      currency: 'usd',
      interval: 'month',
      is_active: false,
      max_users: 5,
      max_agencies: 1,
      max_storage_gb: 10,
      features: availableFeatures.map(feature => ({
        ...feature,
        enabled: false
      }))
    };
    
    setSelectedPlan(null);
    setEditForm(newPlanForm);
    setIsEditing(true);
  };

  const handleCreateNewPlan = async () => {
    if (!editForm) return;
    
    await createPlan(editForm as Omit<SubscriptionPlan, 'id'>);
    setIsEditing(false);
    setEditForm({});
  };

  const handleDeletePlan = async (planId: string) => {
    await deletePlan(planId);
    if (selectedPlan?.id === planId) {
      setSelectedPlan(null);
      setIsEditing(false);
      setEditForm({});
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading plans...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plan Management</h2>
          <p className="text-muted-foreground">Configure subscription plans, pricing, and features</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddNewPlan} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Plan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="features">Feature Management</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlanSelect(plan)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span>Max {plan.max_users} users</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-blue-500" />
                      <span>{plan.max_storage_gb}GB storage</span>
                    </div>
                    {plan.features.slice(0, 3).map((feature) => (
                      <div key={feature.id} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          feature.enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className={feature.enabled ? 'text-foreground' : 'text-muted-foreground'}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                    {plan.features.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        +{plan.features.length - 3} more features
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedPlan ? `Edit Plan: ${selectedPlan.name}` : 'Create New Plan'}
                </CardTitle>
                <CardDescription>Configure plan details and pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planName">Plan Name</Label>
                    <Input
                      id="planName"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planPrice">Price (USD)</Label>
                    <Input
                      id="planPrice"
                      type="number"
                      value={editForm.price || 0}
                      onChange={(e) => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planDescription">Description</Label>
                    <Input
                      id="planDescription"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planInterval">Billing Interval</Label>
                    <select
                      id="planInterval"
                      value={editForm.interval || 'month'}
                      onChange={(e) => setEditForm(prev => ({ ...prev, interval: e.target.value }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsers">Max Users</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={editForm.max_users || 0}
                      onChange={(e) => setEditForm(prev => ({ ...prev, max_users: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStorage">Max Storage (GB)</Label>
                    <Input
                      id="maxStorage"
                      type="number"
                      value={editForm.max_storage_gb || 0}
                      onChange={(e) => setEditForm(prev => ({ ...prev, max_storage_gb: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Features</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(editForm.features || availableFeatures).map((feature) => (
                      <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{feature.name}</div>
                          <div className="text-sm text-muted-foreground">{feature.description}</div>
                        </div>
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={() => handleFeatureToggle(feature.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="planActive">Plan Active</Label>
                    <Switch
                      id="planActive"
                      checked={editForm.is_active || false}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    {selectedPlan ? (
                      <Button onClick={handleSavePlan}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    ) : (
                      <Button onClick={handleCreateNewPlan}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Plan
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Features</CardTitle>
              <CardDescription>Manage system-wide feature definitions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableFeatures.map((feature) => (
                  <Card key={feature.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">{feature.name}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                        <Badge variant="outline">{feature.feature_key}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanManagement;