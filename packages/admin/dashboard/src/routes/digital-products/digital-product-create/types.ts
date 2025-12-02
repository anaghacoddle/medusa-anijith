import { z } from "zod";
import { EditProductMediaSchema, DigitalProductCreateSchema } from "./constants";

export type DigitalProductCreateSchemaType = z.infer<typeof DigitalProductCreateSchema>;

export type EditProductMediaSchemaType = z.infer<typeof EditProductMediaSchema>;
