# enemy.py

from __future__ import annotations

import pygame

from animation import Animator
from visuals import flash_white


class RoboEnemy(pygame.sprite.Sprite):

    def __init__(
        self,
        position: tuple[int, int],
        animator: Animator,
        max_health: int = 30,
    ):

        super().__init__()

        self.animator = animator

        self.animator.play("idle")

        image = self.animator.image()

        if image is None:
            raise RuntimeError(
                "Enemy animator requires idle animation."
            )

        self.image = image

        self.rect = image.get_rect(
            center=position
        )

        self.position = pygame.Vector2(
            position
        )

        self.max_health = max_health
        self.health = max_health

        self.hit_flash = 0

        self.dead = False

    def damage(
        self,
        amount: int,
    ):

        if self.dead:
            return

        self.health -= amount

        self.hit_flash = 0.1

        if self.health <= 0:

            self.health = 0

            self.dead = True

            if "death" in self.animator.animations:

                self.animator.play(
                    "death",
                    restart=True,
                )

        elif "hit" in self.animator.animations:

            self.animator.play(
                "hit",
                restart=True,
            )

    def update(
        self,
        dt: float,
    ):

        self.animator.update(dt)

        self.hit_flash = max(
            0,
            self.hit_flash - dt,
        )

        image = self.animator.image()

        if image is None:
            return

        if self.hit_flash > 0:

            image = flash_white(image)

        self.image = image

        self.rect = image.get_rect(
            center=self.position
        )
