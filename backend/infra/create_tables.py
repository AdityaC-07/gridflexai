"""Create GridFlex DynamoDB tables (PAY_PER_REQUEST, region ap-south-1)."""
from __future__ import annotations

import os
import sys

import boto3

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

REGION = os.getenv("AWS_REGION", "ap-south-1")
PREFIX = os.getenv("DYNAMODB_TABLE_PREFIX", "gridflex")
ENDPOINT = os.getenv("AWS_ENDPOINT_URL") or None

# (short_name, hash_key, range_key|None)
TABLES = [
    ("telemetry", "feeder_id", "timestamp"),
    ("forecasts", "feeder_id", "timestamp"),
    ("feeder-state", "feeder_id", "timestamp"),
    ("decisions", "feeder_id", "decision_id"),
    ("battery", "feeder_id", None),
    ("reliability-events", "feeder_id", "timestamp"),  # Matches existing AWS schema
    ("flexibility-pool", "resource_id", None),
]


def main() -> None:
    kwargs: dict = {"region_name": REGION}
    if ENDPOINT:
        kwargs["endpoint_url"] = ENDPOINT
    client = boto3.client("dynamodb", **kwargs)
    existing = set(client.list_tables().get("TableNames", []))
    for short, hk, rk in TABLES:
        name = f"{PREFIX}-{short}"
        if name in existing:
            print(f"EXISTS  {name}")
            continue
        key_schema = [{"AttributeName": hk, "KeyType": "HASH"}]
        attr_defs = [{"AttributeName": hk, "AttributeType": "S"}]
        if rk:
            key_schema.append({"AttributeName": rk, "KeyType": "RANGE"})
            attr_defs.append({"AttributeName": rk, "AttributeType": "S"})
        client.create_table(
            TableName=name,
            KeySchema=key_schema,
            AttributeDefinitions=attr_defs,
            BillingMode="PAY_PER_REQUEST",
        )
        print(f"CREATED {name} (PAY_PER_REQUEST)")


if __name__ == "__main__":
    main()
