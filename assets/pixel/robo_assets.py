# robo_assets.py

from __future__ import annotations

from pathlib import Path

from animation import Animation, Animator
from spritesheet import SpriteSheet


ROBOT_CELL = 48


class RoboAssets:

    def __init__(
        self,
        asset_directory: str | Path,
    ):

        asset_directory = Path(asset_directory)

        sheet_path = (
            asset_directory
            / "robo_protagonist_sheet.png"
        )

        self.sheet = SpriteSheet(
            sheet_path,
            ROBOT_CELL,
            ROBOT_CELL,
        )

    def make_animator(self) -> Animator:

        animator = Animator()

        # --------------------------------------------
        # ROW 0
        # idle
        # --------------------------------------------

        animator.add(
            "idle",
            Animation(
                frames=self.sheet.strip(
                    0,
                    0,
                    3,
                ),
                frame_duration=0.22,
                loop=True,
            ),
        )

        # --------------------------------------------
        # ROW 1
        # walking
        # --------------------------------------------

        animator.add(
            "walk",
            Animation(
                frames=self.sheet.strip(
                    0,
                    1,
                    4,
                ),
                frame_duration=0.11,
                loop=True,
            ),
        )

        # --------------------------------------------
        # ROW 2
        # Pressure attack
        # --------------------------------------------

        animator.add(
            "pressure",
            Animation(
                frames=self.sheet.strip(
                    0,
                    2,
                    3,
                ),
                frame_duration=0.085,
                loop=False,
            ),
        )

        # --------------------------------------------
        # ROW 3
        # Control action
        # --------------------------------------------

        animator.add(
            "control",
            Animation(
                frames=self.sheet.strip(
                    0,
                    3,
                    3,
                ),
                frame_duration=0.12,
                loop=False,
            ),
        )

        # --------------------------------------------
        # ROW 4
        # Chaos attack
        # --------------------------------------------

        animator.add(
            "chaos",
            Animation(
                frames=self.sheet.strip(
                    0,
                    4,
                    3,
                ),
                frame_duration=0.065,
                loop=False,
            ),
        )

        # --------------------------------------------
        # ROW 5
        # Hit
        # --------------------------------------------

        animator.add(
            "hit",
            Animation(
                frames=self.sheet.strip(
                    0,
                    5,
                    2,
                ),
                frame_duration=0.07,
                loop=False,
            ),
        )

        # --------------------------------------------
        # ROW 6
        # Low HP
        # --------------------------------------------

        animator.add(
            "low_hp",
            Animation(
                frames=self.sheet.strip(
                    0,
                    6,
                    3,
                ),
                frame_duration=0.25,
                loop=True,
            ),
        )

        # --------------------------------------------
        # ROW 7
        # Victory
        # --------------------------------------------

        animator.add(
            "victory",
            Animation(
                frames=self.sheet.strip(
                    0,
                    7,
                    4,
                ),
                frame_duration=0.15,
                loop=False,
                hold_last_frame=True,
            ),
        )

        return animator
