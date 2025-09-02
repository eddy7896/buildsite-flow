import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, DollarSign, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: Feature[];
  isActive: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
}

const PlanManagement = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: '1',
      name: 'Basic',
      price: 29,
      currency: 'USD',
      interval: 'month',
      isActive: true,
      features: [
        { id: '1', name: 'Users', description: 'Up to 5 users', enabled: true },
        { id: '2', name: 'Projects', description: 'Up to 10 projects', enabled: true },
        { id: '3', name: 'Storage', description: '1GB storage', enabled: true },
        { id: '4', name: 'AI Features', description: 'AI powered insights', enabled: false },
        { id: '5', name: 'Advanced Analytics', description: 'Detailed reporting', enabled: false },
      ]
    },
    {
      id: '2',
      name: 'Professional',
      price: 79,
      currency: 'USD',
      interval: 'month',
      isActive: true,
      features: [
        { id: '1', name: 'Users', description: 'Up to 25 users', enabled: true },
        { id: '2', name: 'Projects', description: 'Unlimited projects', enabled: true },
        { id: '3', name: 'Storage', description: '10GB storage', enabled: true },
        { id: '4', name: 'AI Features', description: 'AI powered insights', enabled: true },
        { id: '5', name: 'Advanced Analytics', description: 'Detailed reporting', enabled: true },
      ]
    },
    {
      id: '3',
      name: 'Enterprise',
      price: 199,
      currency: 'USD',
      interval: 'month',
      isActive: true,
      features: [
        { id: '1', name: 'Users', description: 'Unlimited users', enabled: true },
        { id: '2', name: 'Projects', description: 'Unlimited projects', enabled: true },
        { id: '3', name: 'Storage', description: 'Unlimited storage', enabled: true },
        { id: '4', name: 'AI Features', description: 'AI powered insights', enabled: true },
        { id: '5', name: 'Advanced Analytics', description: 'Detailed reporting', enabled: true },
      ]
    }
  ]);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handlePlanUpdate = (planId: string, updates: Partial<Plan>) => {
    setPlans(prev => prev.map(plan => 
      plan.id === planId ? { ...plan, ...updates } : plan
    ));
  };

  const handleFeatureToggle = (planId: string, featureId: string) => {
    setPlans(prev => prev.map(plan => 
      plan.id === planId 
        ? {
            ...plan,
            features: plan.features.map(feature =>
              feature.id === featureId 
                ? { ...feature, enabled: !feature.enabled }
                : feature
            )
          }
        : plan
    ));
  };

  const handleSavePlans = async () => {
    try {
      // Here you would typically save to Supabase or call an API
      toast({
        title: "Plans Updated",
        description: "Subscription plans have been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save plans. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addNewPlan = () => {
    const newPlan: Plan = {
      id: Date.now().toString(),
      name: 'New Plan',
      price: 0,
      currency: 'USD',
      interval: 'month',
      isActive: false,
      features: [
        { id: '1', name: 'Users', description: 'Up to X users', enabled: true },
        { id: '2', name: 'Projects', description: 'Up to X projects', enabled: true },
        { id: '3', name: 'Storage', description: 'XGB storage', enabled: true },
        { id: '4', name: 'AI Features', description: 'AI powered insights', enabled: false },
        { id: '5', name: 'Advanced Analytics', description: 'Detailed reporting', enabled: false },
      ]
    };
    setPlans(prev => [...prev, newPlan]);
    setSelectedPlan(newPlan);
    setIsEditing(true);
  };

  const deletePlan = (planId: string) => {
    setPlans(prev => prev.filter(plan => plan.id !== planId));
    if (selectedPlan?.id === planId) {
      setSelectedPlan(null);
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plan Management</h2>
          <p className="text-muted-foreground">Configure subscription plans, pricing, and features</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addNewPlan} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Plan
          </Button>
          <Button onClick={handleSavePlans}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
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
              <Card key={plan.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setIsEditing(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature.id} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${feature.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className={feature.enabled ? 'text-foreground' : 'text-muted-foreground'}>
                          {feature.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPlan && isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Plan: {selectedPlan.name}</CardTitle>
                <CardDescription>Configure plan details and pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planName">Plan Name</Label>
                    <Input
                      id="planName"
                      value={selectedPlan.name}
                      onChange={(e) => handlePlanUpdate(selectedPlan.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planPrice">Price (USD)</Label>
                    <Input
                      id="planPrice"
                      type="number"
                      value={selectedPlan.price}
                      onChange={(e) => handlePlanUpdate(selectedPlan.id, { price: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Features</Label>
                  {selectedPlan.features.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{feature.name}</div>
                        <Input
                          value={feature.description}
                          onChange={(e) => {
                            const updatedFeatures = selectedPlan.features.map(f =>
                              f.id === feature.id ? { ...f, description: e.target.value } : f
                            );
                            handlePlanUpdate(selectedPlan.id, { features: updatedFeatures });
                          }}
                          className="text-sm"
                        />
                      </div>
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={() => handleFeatureToggle(selectedPlan.id, feature.id)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="planActive">Plan Active</Label>
                    <Switch
                      id="planActive"
                      checked={selectedPlan.isActive}
                      onCheckedChange={(checked) => handlePlanUpdate(selectedPlan.id, { isActive: checked })}
                    />
                  </div>
                  <Button onClick={() => setIsEditing(false)}>
                    Done Editing
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Feature Settings</CardTitle>
              <CardDescription>Configure system-wide feature availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Feature management settings will be added here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanManagement;