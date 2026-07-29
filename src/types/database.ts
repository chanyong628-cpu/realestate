export type PropertyCategory = "office" | "store" | "etc";

export type RestroomType =
  | "internal_shared"
  | "internal_private"
  | "external_shared"
  | "external_private";

export interface Property {
  id: string;
  property_number: string;
  title: string;
  category: PropertyCategory;
  deposit: number | null;
  monthly_rent: number | null;
  maintenance_fee: number | null;
  public_address: string | null;
  private_address: string | null;
  latitude: number | null;
  longitude: number | null;
  exclusive_area: number | null;
  supply_area: number | null;
  floor: string | null;
  total_floor: string | null;
  parking_available: boolean;
  elevator_available: boolean;
  total_parking_count: number | null;
  available_parking_count: number | null;
  building_use: string | null;
  approval_date: string | null;
  building_direction: string | null;
  room_count: number | null;
  restroom_count: number | null;
  air_conditioner_type: string | null;
  is_violating_building: boolean;
  restroom_type: RestroomType | null;
  move_in_date: string | null;
  is_recommended: boolean;
  is_published: boolean;
  image_urls: string[];
  description: string | null;
  private_memo: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerBlock {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_memo: string | null;
  shared_slug: string;
  shared_title: string | null;
  shared_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerBlockProperty {
  id: string;
  customer_block_id: string;
  property_id: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: Property;
        Insert: Partial<Property> & {
          title: string;
          category: PropertyCategory;
        };
        Update: Partial<Property>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
