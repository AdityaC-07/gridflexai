"""Shared DynamoDB helpers. Services communicate through DynamoDB tables.

Tables (with default ``gridflex-`` prefix):
  gridflex-telemetry, gridflex-forecasts, gridflex-feeder-state,
  gridflex-decisions, gridflex-battery, gridflex-reliability-events
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import boto3
from botocore.exceptions import ClientError, NoCredentialsError, NoRegionError

from .config import settings

TABLE_SHORT_NAMES = [
    "telemetry",
    "forecasts",
    "feeder-state",
    "decisions",
    "battery",
    "reliability-events",
]


def table_name(short: str) -> str:
    prefix = settings.table_prefix or "gridflex"
    return f"{prefix}-{short}"


def full_table_names() -> list[str]:
    return [table_name(s) for s in TABLE_SHORT_NAMES]


_client = None


def get_dynamo_resource():
    global _client
    if _client is not None:
        return _client
    kwargs: dict[str, Any] = {"region_name": settings.aws_region or "ap-south-1"}
    if settings.aws_endpoint_url:
        kwargs["endpoint_url"] = settings.aws_endpoint_url
    _client = boto3.resource("dynamodb", **kwargs)
    return _client


def reset_client_cache() -> None:
    global _client
    _client = None


def _friendly_error(op: str, exc: Exception) -> RuntimeError:
    if isinstance(exc, NoCredentialsError):
        return RuntimeError(
            f"DynamoDB {op} failed: no AWS credentials found. "
            "Configure AWS credentials (env/IAM role) or set AWS_ENDPOINT_URL for local DynamoDB."
        )
    if isinstance(exc, NoRegionError):
        return RuntimeError(f"DynamoDB {op} failed: no region. Set AWS_REGION (expected ap-south-1).")
    if isinstance(exc, ClientError):
        code = exc.response.get("Error", {}).get("Code", "")
        if code == "ResourceNotFoundException":
            return RuntimeError(
                f"DynamoDB {op} failed: table not found. "
                f"Run infra/create_tables.py (region {settings.aws_region}). Original: {exc}"
            )
        return RuntimeError(f"DynamoDB {op} failed ({code}): {exc}")
    return RuntimeError(f"DynamoDB {op} failed: {exc}")


def _to_dynamo(obj: Any) -> Any:
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _to_dynamo(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_dynamo(v) for v in obj]
    return obj


def _from_dynamo(obj: Any) -> Any:
    if isinstance(obj, Decimal):
        f = float(obj)
        return int(f) if f.is_integer() and abs(f) < 1e15 else f
    if isinstance(obj, dict):
        return {k: _from_dynamo(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_from_dynamo(v) for v in obj]
    return obj


def _table(short: str):
    try:
        return get_dynamo_resource().Table(table_name(short))
    except Exception as exc:
        raise _friendly_error(f"open table {table_name(short)}", exc)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------- telemetry ----------------

def write_telemetry(item: dict[str, Any]) -> dict[str, Any]:
    try:
        _table("telemetry").put_item(Item=_to_dynamo(item))
        return item
    except Exception as exc:
        raise _friendly_error("write_telemetry", exc)


def get_recent_telemetry(feeder_id: str, limit: int = 96) -> list[dict[str, Any]]:
    """Return most-recent telemetry rows (newest first). Requires table with
    partition key feeder_id and sort key timestamp."""
    try:
        resp = _table("telemetry").query(
            KeyConditionExpression="feeder_id = :f",
            ExpressionAttributeValues={":f": feeder_id},
            ScanIndexForward=False,
            Limit=limit,
        )
        return [_from_dynamo(i) for i in resp.get("Items", [])]
    except Exception as exc:
        raise _friendly_error("get_recent_telemetry", exc)


def get_latest_telemetry(feeder_id: str) -> dict[str, Any] | None:
    items = get_recent_telemetry(feeder_id, limit=1)
    return items[0] if items else None


# ---------------- forecasts ----------------

def write_forecast(item: dict[str, Any]) -> dict[str, Any]:
    try:
        _table("forecasts").put_item(Item=_to_dynamo(item))
        return item
    except Exception as exc:
        raise _friendly_error("write_forecast", exc)


def get_latest_forecast(feeder_id: str) -> dict[str, Any] | None:
    try:
        resp = _table("forecasts").query(
            KeyConditionExpression="feeder_id = :f",
            ExpressionAttributeValues={":f": feeder_id},
            ScanIndexForward=False,
            Limit=1,
        )
        items = resp.get("Items", [])
        return _from_dynamo(items[0]) if items else None
    except Exception as exc:
        raise _friendly_error("get_latest_forecast", exc)


# ---------------- feeder state ----------------

def write_feeder_state(item: dict[str, Any]) -> dict[str, Any]:
    try:
        _table("feeder-state").put_item(Item=_to_dynamo(item))
        return item
    except Exception as exc:
        raise _friendly_error("write_feeder_state", exc)


def get_latest_feeder_state(feeder_id: str) -> dict[str, Any] | None:
    try:
        resp = _table("feeder-state").query(
            KeyConditionExpression="feeder_id = :f",
            ExpressionAttributeValues={":f": feeder_id},
            ScanIndexForward=False,
            Limit=1,
        )
        items = resp.get("Items", [])
        return _from_dynamo(items[0]) if items else None
    except Exception as exc:
        raise _friendly_error("get_latest_feeder_state", exc)


# ---------------- battery ----------------

def get_battery_state(feeder_id: str, default_soc_pct: float = 80.0) -> dict[str, Any]:
    capacity = settings.battery_capacity_kwh
    try:
        resp = _table("battery").get_item(Key={"feeder_id": feeder_id})
        item = resp.get("Item")
        if item:
            return _from_dynamo(item)
    except Exception as exc:
        raise _friendly_error("get_battery_state", exc)
    return {
        "feeder_id": feeder_id,
        "soc_pct": default_soc_pct,
        "soc_kwh": round(capacity * default_soc_pct / 100.0, 2),
        "capacity_kwh": capacity,
        "updated_at": _now_iso(),
        "source": "default",
    }


def write_battery_state(item: dict[str, Any]) -> dict[str, Any]:
    try:
        _table("battery").put_item(Item=_to_dynamo(item))
        return item
    except Exception as exc:
        raise _friendly_error("write_battery_state", exc)


# ---------------- decisions ----------------

def write_decision(item: dict[str, Any]) -> dict[str, Any]:
    try:
        _table("decisions").put_item(Item=_to_dynamo(item))
        return item
    except Exception as exc:
        raise _friendly_error("write_decision", exc)


def get_decision(decision_id: str, feeder_id: str | None = None) -> dict[str, Any] | None:
    """Decisions table key schema: HASH=feeder_id, RANGE=decision_id."""
    try:
        if feeder_id:
            resp = _table("decisions").get_item(Key={"feeder_id": feeder_id, "decision_id": decision_id})
            return _from_dynamo(resp["Item"]) if resp.get("Item") else None
        resp = _table("decisions").scan(
            FilterExpression="decision_id = :d",
            ExpressionAttributeValues={":d": decision_id},
            Limit=5,
        )
        items = resp.get("Items", [])
        return _from_dynamo(items[0]) if items else None
    except Exception as exc:
        raise _friendly_error("get_decision", exc)


def get_latest_decision(feeder_id: str) -> dict[str, Any] | None:
    try:
        resp = _table("decisions").query(
            KeyConditionExpression="feeder_id = :f",
            ExpressionAttributeValues={":f": feeder_id},
            ScanIndexForward=False,
            Limit=1,
        )
        items = resp.get("Items", [])
        return _from_dynamo(items[0]) if items else None
    except Exception as exc:
        # GSI-less fallback: scan small table
        if "ValidationException" in str(exc):
            try:
                resp2 = _table("decisions").scan(Limit=50)
                items2 = [i for i in resp2.get("Items", []) if i.get("feeder_id") == feeder_id]
                if not items2:
                    return None
                items2.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
                return _from_dynamo(items2[0])
            except Exception as exc2:
                raise _friendly_error("get_latest_decision", exc2)
        raise _friendly_error("get_latest_decision", exc)


# ---------------- reliability events ----------------

def write_reliability_event(item: dict[str, Any]) -> dict[str, Any]:
    try:
        _table("reliability-events").put_item(Item=_to_dynamo(item))
        return item
    except Exception as exc:
        raise _friendly_error("write_reliability_event", exc)


def dynamo_available() -> bool:
    try:
        list(get_dynamo_resource().tables.all())
        return True
    except Exception:
        return False
