import raw from "@/data/community-center.json";
import { DatasetSchema } from "./schema";

export const dataset = DatasetSchema.parse(raw);
