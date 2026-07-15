import raw from "@/data/cooking.json";
import { CookingDatasetSchema } from "./schema";

export const cookingDataset = CookingDatasetSchema.parse(raw);
