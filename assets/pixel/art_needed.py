# art_needed.py

from pathlib import Path

from asset_validator import REQUIRED_FILES


def generate_art_needed(
    asset_root="assets",
    output="ART_NEEDED.md",
):

    root = Path(asset_root)

    missing = [
        asset
        for asset in REQUIRED_FILES
        if not (
            root / asset
        ).exists()
    ]

    lines = [
        "# RoboSwitch — Art Needed",
        "",
        (
            "All artwork listed here should be "
            "physically drawn / handwritten and "
            "then photographed or scanned."
        ),
        "",
        (
            "The game code must not automatically "
            "replace missing artwork with generated "
            "illustrations."
        ),
        "",
    ]

    if not missing:

        lines.extend(
            [
                "No required artwork is currently missing.",
                "",
            ]
        )

    else:

        for asset in missing:

            lines.append(
                f"- [ ] `{asset}`"
            )

    Path(output).write_text(
        "\n".join(lines),
        encoding="utf-8",
    )


if __name__ == "__main__":

    generate_art_needed()
