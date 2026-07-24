import { Dashboard } from "@/components/(base)/dashboard";
import { getServerPortada } from "@/components/(base)/layout/actions";

export default async function DashboardPage() {
  const initialPortada = await getServerPortada();
  return <Dashboard initialPortada={initialPortada} />;
}
