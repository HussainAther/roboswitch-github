# asset_validator.py

from pathlib import Path


REQUIRED_FILES = [
    # Player
    "robot/robo_protagonist_sheet.png",

    # Enemies
    "enemies/enemy_chunky_a_sheet.png",
    "enemies/enemy_chunky_b_sheet.png",

    # UI
    "ui/ui_icons.png",

    # Effects
    "effects/pressure_mark.png",
    "effects/control_mark.png",
    "effects/chaos_mark.png",
    "effects/spark_01.png",
    "effects/spark_02.png",

    # Environment
    "environment/notebook_background.png",

    # Handwriting
    "text/start.png",
    "text/options.png",
    "text/exit.png",
    "text/pressure.png",
    "text/control.png",
    "text/chaos.png",
    "text/game_over.png",
    "text/you_win.png",
]


def validate_assets(
    asset_root="assets",
):

    root = Path(asset_root)

    missing = []

    for relative_path in REQUIRED_FILES:

        full_path = (
            root
            / relative_path
        )

        if not full_path.exists():
            missing.append(
                relative_path
            )

    if not missing:

        print(
            "All RoboSwitch artwork is present."
        )

        return True

    print(
        "\nRoboSwitch development mode:"
    )

    print(
        "Finished artwork is missing, "
        "so temporary placeholders will be used."
    )

    for item in missing:
        print(
            f"  - {item}"
        )

    print()

    # IMPORTANT:
    # Missing artwork should NOT prevent
    # the game from running.
    return False

if __name__ == "__main__":

    validate_assets()
