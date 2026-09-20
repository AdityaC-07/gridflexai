import json
import subprocess

cmd = ["aws", "cloudfront", "get-distribution-config", "--id", "E39UK91NXD35V9", "--region", "ap-south-1"]
res = subprocess.run(cmd, capture_output=True, text=True, check=True)
data = json.loads(res.stdout)

etag = data["ETag"]
config = data["DistributionConfig"]

found = False
for item in config["Origins"]["Items"]:
    if item["Id"] == "ECS-Backend-Origin":
        item["DomainName"] = "ec2-13-233-48-1.ap-south-1.compute.amazonaws.com"
        found = True
        break

if not found:
    backend_origin = {
        "Id": "ECS-Backend-Origin",
        "DomainName": "ec2-13-233-48-1.ap-south-1.compute.amazonaws.com",
        "OriginPath": "",
        "CustomHeaders": {"Quantity": 0},
        "CustomOriginConfig": {
            "HTTPPort": 8000,
            "HTTPSPort": 443,
            "OriginProtocolPolicy": "http-only",
            "OriginSslProtocols": {
                "Quantity": 1,
                "Items": ["TLSv1.2"]
            },
            "OriginReadTimeout": 30,
            "OriginKeepaliveTimeout": 5
        },
        "ConnectionAttempts": 3,
        "ConnectionTimeout": 10,
        "OriginShield": {"Enabled": False},
        "OriginAccessControlId": ""
    }
    config["Origins"]["Items"].append(backend_origin)
    config["Origins"]["Quantity"] = len(config["Origins"]["Items"])

with open("cf-updated-config.json", "w") as f:
    json.dump(config, f, indent=2)

update_cmd = [
    "aws", "cloudfront", "update-distribution",
    "--id", "E39UK91NXD35V9",
    "--distribution-config", "file://cf-updated-config.json",
    "--if-match", etag,
    "--region", "ap-south-1"
]
res_up = subprocess.run(update_cmd, capture_output=True, text=True)
print("Update stdout:", res_up.stdout[:200])
if res_up.stderr:
    print("Update stderr:", res_up.stderr)
