# enemy_chunky_a.py

from pathlib import Path

from animation import Animation, Animator
from enemy import RoboEnemy
from spritesheet import SpriteSheet


class ChunkyPressureEnemy(RoboEnemy):

    def __init__(
        self,
        position,
        asset_directory,
    ):

        asset_directory = Path(
            asset_directory
        )

        sheet = SpriteSheet(
            asset_directory
            / "enemy_chunky_a_sheet.png",
            48,
            48,
        )

        animator = Animator()

        animator.add(
            "idle",
            Animation(
                sheet.strip(0, 0, 3),
                frame_duration=0.24,
            ),
        )

        animator.add(
            "walk",
            Animation(
                sheet.strip(0, 1, 4),
                frame_duration=0.14,
            ),
        )

        animator.add(
            "attack",
            Animation(
                sheet.strip(0, 2, 4),
                frame_duration=0.10,
                loop=False,
            ),
        )

        animator.add(
            "hit",
            Animation(
                sheet.strip(0, 3, 2),
                frame_duration=0.07,
                loop=False,
            ),
        )

        animator.add(
            "death",
            Animation(
                sheet.strip(0, 4, 4),
                frame_duration=0.11,
                loop=False,
                hold_last_frame=True,
            ),
        )

        super().__init__(
            position,
            animator,
            max_health=80,
        )
