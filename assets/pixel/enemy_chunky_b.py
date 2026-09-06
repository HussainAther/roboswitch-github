# enemy_chunky_b.py

from pathlib import Path

from animation import Animation, Animator
from enemy import RoboEnemy
from spritesheet import SpriteSheet


class ChaosSpindleEnemy(RoboEnemy):

    def __init__(
        self,
        position,
        asset_directory,
    ):

        sheet = SpriteSheet(
            Path(asset_directory)
            / "enemy_chunky_b_sheet.png",
            48,
            48,
        )

        animator = Animator()

        animator.add(
            "idle",
            Animation(
                sheet.strip(0, 0, 4),
                0.11,
            ),
        )

        animator.add(
            "walk",
            Animation(
                sheet.strip(0, 1, 4),
                0.075,
            ),
        )

        animator.add(
            "attack",
            Animation(
                sheet.strip(0, 2, 5),
                0.065,
                loop=False,
            ),
        )

        animator.add(
            "hit",
            Animation(
                sheet.strip(0, 3, 2),
                0.055,
                loop=False,
            ),
        )

        animator.add(
            "death",
            Animation(
                sheet.strip(0, 4, 5),
                0.075,
                loop=False,
                hold_last_frame=True,
            ),
        )

        super().__init__(
            position,
            animator,
            max_health=35,
        )
