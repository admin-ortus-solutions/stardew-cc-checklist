import raw from "@/data/fish.json";
import { FishDatasetSchema } from "./schema";

export const fishDataset = FishDatasetSchema.parse(raw);
