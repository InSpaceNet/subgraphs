// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class Gateway extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Gateway entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Gateway entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Gateway", id.toString(), this);
    }
  }

  static load(id: string): Gateway | null {
    return changetype<Gateway | null>(store.get("Gateway", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get tokens(): Array<string> | null {
    let value = this.get("tokens");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set tokens(value: Array<string> | null) {
    if (!value) {
      this.unset("tokens");
    } else {
      this.set("tokens", Value.fromStringArray(<Array<string>>value));
    }
  }
}

export class Token extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Token entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Token entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Token", id.toString(), this);
    }
  }

  static load(id: string): Token | null {
    return changetype<Token | null>(store.get("Token", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get l2Address(): Bytes | null {
    let value = this.get("l2Address");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set l2Address(value: Bytes | null) {
    if (!value) {
      this.unset("l2Address");
    } else {
      this.set("l2Address", Value.fromBytes(<Bytes>value));
    }
  }

  get gateway(): Array<string> | null {
    let value = this.get("gateway");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set gateway(value: Array<string> | null) {
    if (!value) {
      this.unset("gateway");
    } else {
      this.set("gateway", Value.fromStringArray(<Array<string>>value));
    }
  }
}

export class TokenGatewayJoinTable extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("gateway", Value.fromString(""));
    this.set("token", Value.fromString(""));
  }

  save(): void {
    let id = this.get("id");
    assert(
      id != null,
      "Cannot save TokenGatewayJoinTable entity without an ID"
    );
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save TokenGatewayJoinTable entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("TokenGatewayJoinTable", id.toString(), this);
    }
  }

  static load(id: string): TokenGatewayJoinTable | null {
    return changetype<TokenGatewayJoinTable | null>(
      store.get("TokenGatewayJoinTable", id)
    );
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get gateway(): string {
    let value = this.get("gateway");
    return value!.toString();
  }

  set gateway(value: string) {
    this.set("gateway", Value.fromString(value));
  }

  get token(): string {
    let value = this.get("token");
    return value!.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }
}
