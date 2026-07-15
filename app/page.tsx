import { App } from "@/components/App";
import { Gate } from "@/components/Gate";
import { dataset } from "@/lib/dataset";
import { villagersDataset } from "@/lib/villagers";
import { cookingDataset } from "@/lib/cooking";
import { craftingDataset } from "@/lib/crafting";
import { fishDataset } from "@/lib/fishData";
import { isGated } from "@/lib/gate";

export const dynamic = "force-dynamic";

export default async function Home() {
  const gated = await isGated();
  return (
    <main className="page">
      <h1>Stardew Co-op Tracker</h1>
      <p className="subtitle">
        Community Center &amp; villager gifts · Stardew Valley {dataset.game}
      </p>
      {gated ? (
        <App
          rooms={dataset.rooms}
          villagers={villagersDataset.villagers}
          cooking={cookingDataset.recipes}
          crafting={craftingDataset.recipes}
          fish={fishDataset.fish}
        />
      ) : (
        <Gate />
      )}
    </main>
  );
}
