import pandas as pd
import numpy as np
from datetime import datetime, timedelta


def generate_training_data(n_days=7, feeder_id="F01"):
    """
    Generate synthetic Indian urban load profile data.

    50 households
    30-minute intervals
    7 days = 336 records
    """

    slots = []

    base_time = datetime.now().replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    ) - timedelta(days=n_days)

    for day in range(n_days):

        for slot in range(48):

            # Timestamp for this 30-minute slot
            t = base_time + timedelta(
                days=day,
                minutes=slot * 30
            )

            hour = t.hour + t.minute / 60.0

            # -------------------------------------------------
            # DEMAND MODEL
            # -------------------------------------------------

            # Morning peak around 8 AM
            morning_peak = np.exp(
                -0.5 * ((hour - 8.0) / 1.0) ** 2
            )

            # Evening peak around 7 PM
            evening_peak = np.exp(
                -0.5 * ((hour - 19.0) / 1.5) ** 2
            )

            # Base demand for 50 households
            base_load = 80

            demand = (
                base_load
                + 50 * morning_peak
                + 70 * evening_peak
                + np.random.normal(0, 5)
            )

            # Prevent unrealistic low demand
            demand = max(40, demand)

            # -------------------------------------------------
            # SOLAR MODEL
            # -------------------------------------------------

            # Approximate sunrise = 6 AM
            # Approximate sunset = 6 PM
            solar_elevation = max(
                0,
                np.sin(np.pi * (hour - 6) / 12)
            )

            # Mostly clear sky
            cloud_factor = np.random.beta(5, 2)

            # 150 kW peak solar array
            solar = (
                150
                * solar_elevation
                * cloud_factor
            )

            solar = max(0, solar)

            # -------------------------------------------------
            # TEMPERATURE MODEL
            # -------------------------------------------------

            temperature = (
                28
                + 8 * np.sin(
                    np.pi * (hour - 6) / 12
                )
                + np.random.normal(0, 1)
            )

            # -------------------------------------------------
            # STORE RECORD
            # -------------------------------------------------

            slots.append({
                "feeder_id": feeder_id,
                "timestamp": t.isoformat(),

                "hour_of_day": t.hour,

                "minute_of_day": (
                    t.hour * 60 + t.minute
                ),

                "day_of_week": t.weekday(),

                "is_weekend": int(
                    t.weekday() >= 5
                ),

                "slot_of_day": slot,

                "demand_kw": round(
                    demand, 2
                ),

                "solar_kw": round(
                    solar, 2
                ),

                "cloud_factor": round(
                    cloud_factor, 3
                ),

                "temperature_c": round(
                    temperature, 2
                ),
            })

    return pd.DataFrame(slots)


if __name__ == "__main__":

    print("Generating GridFlex training dataset...")

    df = generate_training_data(
        n_days=7,
        feeder_id="F01"
    )

    print()
    print("Dataset generated successfully!")
    print()

    print(f"Rows: {len(df)}")
    print(f"Columns: {len(df.columns)}")
    print()

    print("Columns:")
    print(df.columns.tolist())

    print()
    print("First 5 rows:")
    print(df.head())

    print()
    print("Dataset statistics:")
    print(df[[
        "demand_kw",
        "solar_kw",
        "cloud_factor",
        "temperature_c"
    ]].describe())

    # Save dataset
    output_path = "forecast_service/training_data.csv"

    df.to_csv(
        output_path,
        index=False
    )

    print()
    print(f"Saved dataset to: {output_path}")