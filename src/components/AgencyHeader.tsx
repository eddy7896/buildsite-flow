import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotificationCenter } from "./NotificationCenter";

interface AgencyInfo {
  agency_name: string | null;
  logo_url: string | null;
}

export const AgencyHeader = () => {
  const [agencyInfo, setAgencyInfo] = useState<AgencyInfo>({
    agency_name: null,
    logo_url: null
  });

  useEffect(() => {
    fetchAgencyInfo();
  }, []);

  const fetchAgencyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('agency_settings')
        .select('agency_name, logo_url')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching agency info:', error);
        return;
      }

      if (data) {
        console.log('Agency data fetched:', data);
        setAgencyInfo({
          agency_name: data.agency_name,
          logo_url: data.logo_url
        });
      }
    } catch (error) {
      console.error('Error fetching agency info:', error);
    }
  };

  if (!agencyInfo.agency_name && !agencyInfo.logo_url) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 ml-auto">
      <NotificationCenter />
      {agencyInfo.logo_url && (
        <img
          src={agencyInfo.logo_url}
          alt="Agency Logo"
          className="h-8 w-8 object-contain"
        />
      )}
      {agencyInfo.agency_name && (
        <span className="font-semibold text-foreground">
          {agencyInfo.agency_name}
        </span>
      )}
    </div>
  );
};