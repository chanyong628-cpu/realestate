import type { Property } from "../../types/database";
import type { CreatePropertyInput, UpdatePropertyInput } from "./schema";

export interface PropertyRepository {
  findByIdentifier(identifier: string): Promise<Property | null>;
  search(query: string, limit: number): Promise<Property[]>;
  existsByPropertyNumber(propertyNumber: string): Promise<boolean>;
  create(input: CreatePropertyInput): Promise<Property>;
  update(
    identifier: string,
    input: UpdatePropertyInput,
  ): Promise<Property | null>;
  setPublished(identifier: string, isPublished: boolean): Promise<Property | null>;
}

export class PropertyStoreError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}
