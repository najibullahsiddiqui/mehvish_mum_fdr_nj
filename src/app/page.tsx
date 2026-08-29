import { CreatorDashboard } from "@/components/CreatorDashboard";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboard = await getDashboardData();

  return <CreatorDashboard initialData={dashboard} />;
}
