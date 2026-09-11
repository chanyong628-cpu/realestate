import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createPropertyApiHandlers } from "../src/lib/cy-property-api/handlers";
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
} from "../src/lib/cy-property-api/schema";
import type { PropertyRepository } from "../src/lib/cy-property-api/types";
import type { Property } from "../src/types/database";

const SECRET = "test-secret-with-at-least-32-characters";

function propertyFixture(overrides: Partial<Property> = {}): Property {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    property_number: "CY-0001",
    title: "기존 매물",
    category: "office",
    deposit: 3_000,
    monthly_rent: 250,
    maintenance_fee: 30,
    public_address: "서울특별시 송파구 문정동",
    private_address: "서울특별시 송파구 문정동 1-1",
    latitude: 37.48,
    longitude: 127.12,
    exclusive_area: 99,
    supply_area: 120,
    floor: "3층",
    total_floor: "8층",
    parking_available: true,
    elevator_available: true,
    total_parking_count: 10,
    available_parking_count: 1,
    building_use: "업무시설",
    approval_date: "2020-01-01",
    building_direction: "남향",
    room_count: 2,
    restroom_count: 1,
    air_conditioner_type: "시스템",
    is_violating_building: false,
    restroom_type: "internal_private",
    move_in_date: "즉시입주",
    is_recommended: false,
    is_published: true,
    image_urls: [],
    description: "설명",
    private_memo: "관리자 메모",
    view_count: 0,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

class MemoryPropertyRepository implements PropertyRepository {
  private readonly properties: Property[];

  constructor(initial: Property[] = [propertyFixture()]) {
    this.properties = structuredClone(initial);
  }

  async findByIdentifier(identifier: string) {
    return (
      this.properties.find(
        (property) =>
          property.id === identifier || property.property_number === identifier,
      ) ?? null
    );
  }

  async search(query: string, limit: number) {
    const normalized = query.toLowerCase();
    return this.properties
      .filter((property) =>
        [
          property.property_number,
          property.title,
          property.public_address,
          property.private_address,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalized)),
      )
      .slice(0, limit);
  }

  async existsByPropertyNumber(propertyNumber: string) {
    return this.properties.some(
      (property) => property.property_number === propertyNumber,
    );
  }

  async create(input: CreatePropertyInput) {
    const property = propertyFixture({
      ...input,
      id: "22222222-2222-4222-8222-222222222222",
      property_number: input.property_number ?? "CY-0002",
      is_published: false,
      is_recommended: input.is_recommended ?? false,
      parking_available: input.parking_available ?? false,
      elevator_available: input.elevator_available ?? false,
      is_violating_building: input.is_violating_building ?? false,
      image_urls: input.image_urls ?? [],
    });
    this.properties.push(property);
    return property;
  }

  async update(identifier: string, input: UpdatePropertyInput) {
    const property = await this.findByIdentifier(identifier);
    if (!property) return null;
    Object.assign(property, input, { updated_at: "2026-09-11T00:00:00.000Z" });
    return property;
  }

  async setPublished(identifier: string, isPublished: boolean) {
    const property = await this.findByIdentifier(identifier);
    if (!property) return null;
    property.is_published = isPublished;
    return property;
  }
}

function setup(repository = new MemoryPropertyRepository()) {
  const logs: string[] = [];
  const handlers = createPropertyApiHandlers({
    repository,
    getSecret: () => SECRET,
    getSupabaseUrl: () => "https://project.supabase.co",
    revalidate: () => undefined,
    logger: {
      info: (message) => logs.push(message),
      error: (message) => logs.push(message),
    },
    now: () => new Date("2026-09-11T00:00:00.000Z"),
  });
  return { handlers, repository, logs };
}

function request(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  secret: string | null = SECRET,
) {
  return new Request(`https://cy-office.com${path}`, {
    method,
    headers: {
      ...(secret ? { authorization: `Bearer ${secret}` } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

interface ApiTestResponse {
  success?: boolean;
  error?: { code?: string };
  property?: Property;
  properties?: Property[];
}

async function json(response: Response) {
  return (await response.json()) as ApiTestResponse;
}

describe("C.Y Property API", () => {
  test("Secret 없이 요청하면 401", async () => {
    const { handlers } = setup();
    const response = await handlers.get(
      request("GET", "/api/cy/properties/CY-0001", undefined, null),
      "CY-0001",
    );
    assert.equal(response.status, 401);
    assert.equal((await json(response)).error?.code, "UNAUTHORIZED");
  });

  test("잘못된 Secret이면 401", async () => {
    const { handlers } = setup();
    const response = await handlers.get(
      request("GET", "/api/cy/properties/CY-0001", undefined, "wrong"),
      "CY-0001",
    );
    assert.equal(response.status, 401);
  });

  test("존재하는 매물을 조회한다", async () => {
    const { handlers } = setup();
    const response = await handlers.get(
      request("GET", "/api/cy/properties/CY-0001"),
      "CY-0001",
    );
    const body = await json(response);
    assert.equal(response.status, 200);
    assert.equal(body.property?.property_number, "CY-0001");
  });

  test("존재하지 않는 매물은 404", async () => {
    const { handlers } = setup();
    const response = await handlers.get(
      request("GET", "/api/cy/properties/CY-9999"),
      "CY-9999",
    );
    assert.equal(response.status, 404);
    assert.equal((await json(response)).error?.code, "PROPERTY_NOT_FOUND");
  });

  test("신규 매물은 비공개로 등록한다", async () => {
    const { handlers, logs } = setup();
    const response = await handlers.create(
      request("POST", "/api/cy/properties", {
        property_number: "CY-0002",
        title: "신규 사무실",
        category: "office",
      }),
    );
    const body = await json(response);
    assert.equal(response.status, 201);
    assert.equal(body.property?.is_published, false);
    assert.match(logs[0], /CREATE_PROPERTY/);
  });

  test("신규 등록 요청에서 공개 상태를 직접 지정할 수 없다", async () => {
    const { handlers } = setup();
    const response = await handlers.create(
      request("POST", "/api/cy/properties", {
        title: "공개 상태 우회 시도",
        category: "office",
        is_published: true,
      }),
    );
    assert.equal(response.status, 400);
    assert.equal((await json(response)).error?.code, "VALIDATION_ERROR");
  });

  test("중복 매물번호 등록은 409", async () => {
    const { handlers } = setup();
    const response = await handlers.create(
      request("POST", "/api/cy/properties", {
        property_number: "CY-0001",
        title: "중복 매물",
        category: "office",
      }),
    );
    assert.equal(response.status, 409);
    assert.equal(
      (await json(response)).error?.code,
      "PROPERTY_NUMBER_CONFLICT",
    );
  });

  test("PATCH는 지정한 필드만 변경한다", async () => {
    const { handlers, repository } = setup();
    const response = await handlers.update(
      request("PATCH", "/api/cy/properties/CY-0001", {
        monthly_rent: 230,
      }),
      "CY-0001",
    );
    const property = await repository.findByIdentifier("CY-0001");
    assert.equal(response.status, 200);
    assert.equal(property?.monthly_rent, 230);
    assert.equal(property?.title, "기존 매물");
  });

  test("PATCH의 허용되지 않은 필드를 차단한다", async () => {
    const { handlers } = setup();
    const response = await handlers.update(
      request("PATCH", "/api/cy/properties/CY-0001", {
        id: "33333333-3333-4333-8333-333333333333",
      }),
      "CY-0001",
    );
    assert.equal(response.status, 400);
    assert.equal((await json(response)).error?.code, "VALIDATION_ERROR");
  });

  test("존재하지 않는 날짜를 차단한다", async () => {
    const { handlers } = setup();
    const response = await handlers.update(
      request("PATCH", "/api/cy/properties/CY-0001", {
        approval_date: "2026-02-31",
      }),
      "CY-0001",
    );
    assert.equal(response.status, 400);
    assert.equal((await json(response)).error?.code, "VALIDATION_ERROR");
  });

  test("64 KiB를 넘는 요청 본문을 차단한다", async () => {
    const { handlers } = setup();
    const response = await handlers.update(
      request("PATCH", "/api/cy/properties/CY-0001", {
        description: "가".repeat(70_000),
      }),
      "CY-0001",
    );
    assert.equal(response.status, 413);
    assert.equal((await json(response)).error?.code, "PAYLOAD_TOO_LARGE");
  });

  test("publish가 공개 상태를 true로 변경한다", async () => {
    const repository = new MemoryPropertyRepository([
      propertyFixture({ is_published: false }),
    ]);
    const { handlers } = setup(repository);
    const response = await handlers.setPublished(
      request("POST", "/api/cy/properties/CY-0001/publish"),
      "CY-0001",
      true,
    );
    const body = await json(response);
    assert.equal(response.status, 200);
    assert.equal(body.property?.is_published, true);
  });

  test("unpublish가 공개 상태를 false로 변경한다", async () => {
    const { handlers } = setup();
    const response = await handlers.setPublished(
      request("POST", "/api/cy/properties/CY-0001/unpublish"),
      "CY-0001",
      false,
    );
    const body = await json(response);
    assert.equal(response.status, 200);
    assert.equal(body.property?.is_published, false);
  });
});
