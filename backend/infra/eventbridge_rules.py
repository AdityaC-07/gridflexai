"""EventBridge Rules Configuration for Reliability Event Lifecycle.

This script defines the EventBridge rules that would be set up to automate
the reliability event lifecycle. In production, these would be deployed via
CloudFormation, Terraform, or AWS CDK.

Event Lifecycle:
PREDICTED → ACTIVE → OPERATOR_APPROVED → DISPATCHED → VERIFYING → VERIFIED/CLOSED
         ↘ OPERATOR_REJECTED → MANUAL_HANDLING
"""
import os
import boto3
from shared.config import settings

# EventBridge Event Bus
EVENT_BUS_NAME = "gridflex-events"

# Event Types
EVENT_TYPES = {
    "ForecastUpdated": "com.gridflex.forecast.updated",
    "FeederRiskChanged": "com.gridflex.feeder.risk.changed",
    "ReliabilityEventCreated": "com.gridflex.reliability-event.created",
    "ReliabilityEventUpdated": "com.gridflex.reliability-event.updated",
    "OperatorApproved": "com.gridflex.reliability-event.approved",
    "OperatorRejected": "com.gridflex.reliability-event.rejected",
    "DispatchCompleted": "com.gridflex.reliability-event.dispatched",
    "VerificationCompleted": "com.gridflex.reliability-event.verified",
}

# Rules Configuration
RULES = [
    {
        "name": "ForecastUpdated-TriggerEventDetection",
        "description": "Trigger event detection when forecast is updated",
        "event_pattern": {
            "source": ["com.gridflex.forecast"],
            "detail-type": ["ForecastUpdated"],
        },
        "targets": [
            {
                "type": "lambda",
                "arn": "arn:aws:lambda:ap-south-1:ACCOUNT_ID:function:gridflex-event-detection",
            }
        ],
    },
    {
        "name": "FeederRiskChanged-TriggerEventDetection",
        "description": "Trigger event detection when feeder risk crosses threshold",
        "event_pattern": {
            "source": ["com.gridflex.grid-intelligence"],
            "detail-type": ["FeederRiskChanged"],
            "detail": {
                "risk_level": ["HIGH", "CRITICAL"],
            },
        },
        "targets": [
            {
                "type": "lambda",
                "arn": "arn:aws:lambda:ap-south-1:ACCOUNT_ID:function:gridflex-event-detection",
            }
        ],
    },
    {
        "name": "ReliabilityEventCreated-SendAlert",
        "description": "Send SNS alert when HIGH/CRITICAL reliability event is created",
        "event_pattern": {
            "source": ["com.gridflex.reliability"],
            "detail-type": ["ReliabilityEventCreated"],
            "detail": {
                "risk_level": ["HIGH", "CRITICAL"],
            },
        },
        "targets": [
            {
                "type": "sns",
                "arn": os.getenv("SNS_TOPIC_ARN"),
            }
        ],
    },
    {
        "name": "OperatorApproved-TriggerOptimization",
        "description": "Trigger reliability budget optimization when operator approves event",
        "event_pattern": {
            "source": ["com.gridflex.reliability"],
            "detail-type": ["OperatorApproved"],
        },
        "targets": [
            {
                "type": "lambda",
                "arn": "arn:aws:lambda:ap-south-1:ACCOUNT_ID:function:gridflex-optimization-trigger",
            }
        ],
    },
    {
        "name": "DispatchCompleted-StartVerificationTimer",
        "description": "Start verification timer after dispatch completes",
        "event_pattern": {
            "source": ["com.gridflex.reliability"],
            "detail-type": ["DispatchCompleted"],
        },
        "targets": [
            {
                "type": "lambda",
                "arn": "arn:aws:lambda:ap-south-1:ACCOUNT_ID:function:gridflex-verification-timer",
            }
        ],
    },
    {
        "name": "VerificationCompleted-UpdateEventStatus",
        "description": "Update event status to VERIFIED after verification completes",
        "event_pattern": {
            "source": ["com.gridflex.verification"],
            "detail-type": ["VerificationCompleted"],
        },
        "targets": [
            {
                "type": "lambda",
                "arn": "arn:aws:lambda:ap-south-1:ACCOUNT_ID:function:gridflex-event-updater",
            }
        ],
    },
]


def setup_eventbridge_rules():
    """Create EventBridge rules for the reliability event lifecycle.

    Note: This is a demonstration script. In production, use AWS CDK/CloudFormation.
    """
    client = boto3.client("events", region_name=settings.aws_region or "ap-south-1")

    # Create event bus if it doesn't exist
    try:
        client.create_event_bus(Name=EVENT_BUS_NAME)
        print(f"Created Event Bus: {EVENT_BUS_NAME}")
    except client.exceptions.ResourceAlreadyExistsException:
        print(f"Event Bus already exists: {EVENT_BUS_NAME}")

    # Create rules
    for rule in RULES:
        try:
            client.put_rule(
                Name=rule["name"],
                EventPattern=rule["event_pattern"],
                Description=rule["description"],
                State="ENABLED",
                EventBusName=EVENT_BUS_NAME,
            )
            print(f"Created Rule: {rule['name']}")

            # Add targets
            for target in rule["targets"]:
                client.put_targets(
                    Rule=rule["name"],
                    EventBusName=EVENT_BUS_NAME,
                    Targets=[target],
                )
                print(f"  Added target: {target['type']}")

        except Exception as e:
            print(f"Failed to create rule {rule['name']}: {e}")


if __name__ == "__main__":
    print("Setting up EventBridge rules for GridFlex reliability event lifecycle...")
    setup_eventbridge_rules()
    print("EventBridge setup complete.")
