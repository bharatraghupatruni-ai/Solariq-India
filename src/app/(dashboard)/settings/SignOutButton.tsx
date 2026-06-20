"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClayButton } from "@/components/ui/ClayButton";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <ClayButton
      variant="danger"
      size="md"
      loading={loading}
      onClick={handleSignOut}
    >
      Sign Out
    </ClayButton>
  );
}
