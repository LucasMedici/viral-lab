import { AppShell } from "@/components/app-shell";
import { listAccounts } from "@/features/accounts/queries";
import { getStorageUsage } from "@/features/videos/queries";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  const [accounts, usage] = await Promise.all([listAccounts(), getStorageUsage()]);

  return (
    <AppShell
      accounts={accounts.map(({ id, platform, username, display_name, pending_count }) => ({
        id,
        platform,
        username,
        display_name,
        pending_count,
      }))}
      usage={usage}
    >
      {children}
    </AppShell>
  );
}
