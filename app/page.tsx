import { Checklist } from "@/components/Checklist";
import { dataset } from "@/lib/dataset";

export default function Home() {
  return (
    <main className="page">
      <h1>Community Center Checklist</h1>
      <p className="subtitle">Stardew Valley {dataset.game} · default bundles</p>
      <Checklist rooms={dataset.rooms} />
    </main>
  );
}
