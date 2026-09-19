"""SNS Alerts for HIGH/CRITICAL reliability events."""
from __future__ import annotations

import logging
import os
import sys

import boto3

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.config import settings

logger = logging.getLogger("grid-intelligence.sns-alerts")

# SNS Topic for reliability event alerts
SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN", "")
SNS_ENABLED = os.getenv("SNS_ENABLED", "false").lower() == "true"


def get_sns_client():
    """Get SNS client with appropriate configuration."""
    kwargs: dict = {"region_name": settings.aws_region or "ap-south-1"}
    if settings.aws_endpoint_url:
        kwargs["endpoint_url"] = settings.aws_endpoint_url
    return boto3.client("sns", **kwargs)


def send_reliability_event_alert(event: dict) -> bool:
    """Send SNS alert when a HIGH/CRITICAL reliability event is created.

    Args:
        event: Reliability event dictionary

    Returns:
        True if alert sent successfully, False otherwise
    """
    if not SNS_ENABLED or not SNS_TOPIC_ARN:
        logger.info("SNS alerts disabled or topic ARN not configured")
        return False

    if event.get("risk_level") not in ["HIGH", "CRITICAL"]:
        logger.info("Event risk level %s does not require SNS alert", event.get("risk_level"))
        return False

    try:
        sns = get_sns_client()

        subject = f"⚠️ GridFlex Reliability Alert: {event.get('event_id')} - {event.get('risk_level')} RISK"

        message = f"""
GRIDFLEX RELIABILITY EVENT ALERT

Event ID: {event.get('event_id')}
Feeder: {event.get('feeder_id')}
Risk Level: {event.get('risk_level')}
Status: {event.get('status')}

EVENT DETAILS:
- Predicted Gap: {event.get('predicted_gap_kw')} kW
- Duration: {event.get('duration_minutes')} minutes
- Time to Event: {event.get('time_to_event_minutes', 45)} minutes
- Forecast Confidence: {(event.get('forecast_confidence', 0) * 100):.0f}%

CRITICAL LOADS:
- Protected: {event.get('critical_load_kw')} kW

FLEXIBILITY AVAILABLE:
- Total Available: {event.get('flexibility_available_kw')} kW
- Gap to Cover: {event.get('predicted_gap_kw')} kW

ACTION REQUIRED:
Operator review and approval needed for dispatch plan.

Generated at: {event.get('created_at')}
GridFlex AI - Neighbourhood Reliability Orchestrator
"""

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message,
            MessageStructure="string"
        )

        logger.info("SNS alert sent for event %s", event.get("event_id"))
        return True

    except Exception as exc:
        logger.error("Failed to send SNS alert for event %s: %s", event.get("event_id"), exc)
        return False


def send_event_status_update(event: dict, previous_status: str) -> bool:
    """Send SNS notification when event status changes significantly.

    Args:
        event: Updated reliability event dictionary
        previous_status: Previous status before update

    Returns:
        True if notification sent successfully, False otherwise
    """
    if not SNS_ENABLED or not SNS_TOPIC_ARN:
        return False

    # Only notify on significant status changes
    significant_transitions = [
        ("PREDICTED", "OPERATOR_APPROVED"),
        ("OPERATOR_APPROVED", "DISPATCHED"),
        ("DISPATCHED", "VERIFIED"),
    ]

    if (previous_status, event.get("status")) not in significant_transitions:
        return False

    try:
        sns = get_sns_client()

        subject = f"GridFlex Event Update: {event.get('event_id')} - {event.get('status')}"

        message = f"""
GRIDFLEX RELIABILITY EVENT STATUS UPDATE

Event ID: {event.get('event_id')}
Previous Status: {previous_status}
Current Status: {event.get('status')}

Updated at: {event.get('approved_at') or event.get('verified_at') or event.get('created_at')}

GridFlex AI - Neighbourhood Reliability Orchestrator
"""

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message,
            MessageStructure="string"
        )

        logger.info("SNS status update sent for event %s", event.get("event_id"))
        return True

    except Exception as exc:
        logger.error("Failed to send SNS status update for event %s: %s", event.get("event_id"), exc)
        return False
