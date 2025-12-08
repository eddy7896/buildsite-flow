import { NotificationCenter } from "./NotificationCenter";
import { useAgencySettings } from "@/hooks/useAgencySettings";

export const AgencyHeader = () => {
  const { settings: agencySettings, loading } = useAgencySettings();

  if (loading || (!agencySettings?.agency_name && !agencySettings?.logo_url)) {
    return (
      <div className="flex items-center gap-3 ml-auto">
        <NotificationCenter />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 ml-auto">
      <NotificationCenter />
      {agencySettings?.logo_url && (
        <img
          src={agencySettings.logo_url}
          alt="Agency Logo"
          className="h-8 w-8 object-contain"
        />
      )}
      {agencySettings?.agency_name && (
        <span className="font-semibold text-foreground">
          {agencySettings.agency_name}
        </span>
      )}
    </div>
  );
};
