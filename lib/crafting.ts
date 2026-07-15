import raw from "@/data/crafting.json";
import { CraftingDatasetSchema } from "./schema";

export const craftingDataset = CraftingDatasetSchema.parse(raw);
