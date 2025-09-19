import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getRegistrationSetting, setRegistrationSetting } from "@/lib/api";
import { Switch } from "@/components/ui/switch";

export default function RegistrationToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    getRegistrationSetting()
      .then((data) => setEnabled(data.allow_registration))
      .catch(() => toast.error("Failed to load registration setting"));
  }, []);

  async function toggle(val: boolean) {
    try {
      await setRegistrationSetting(val);
      setEnabled(val);
      toast.success(`Registration ${val ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update setting");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span>Allow Registration</span>
      <Switch checked={enabled} onCheckedChange={toggle} />
    </div>
  );
}
