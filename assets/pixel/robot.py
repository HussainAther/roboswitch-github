# robot.py

from __future__ import annotations

import random

import pygame

from robo_assets import RoboAssets
from visuals import (
    MODE_NEUTRAL,
    MODE_PRESSURE,
    MODE_CONTROL,
    MODE_CHAOS,
    random_sketch_offset,
    tint_surface,
    flash_white,
    mode_color,
)


class RoboSwitchPlayer(pygame.sprite.Sprite):

    def __init__(
        self,
        position: tuple[int, int],
        assets: RoboAssets,
    ):

        super().__init__()

        self.animator = assets.make_animator()

        self.animator.play("idle")

        self.image = self.animator.image()

        assert self.image is not None

        self.rect = self.image.get_rect(
            center=position
        )

        # --------------------------------------------
        # Movement
        # --------------------------------------------

        self.position = pygame.Vector2(
            self.rect.center
        )

        self.velocity = pygame.Vector2()

        self.speed = 160

        self.facing = 1

        # --------------------------------------------
        # Health
        # --------------------------------------------

        self.max_health = 100
        self.health = 100

        # --------------------------------------------
        # RoboSwitch mode
        # --------------------------------------------

        self.mode = MODE_NEUTRAL

        # --------------------------------------------
        # Action state
        # --------------------------------------------

        self.action_locked = False

        # --------------------------------------------
        # Hit flash
        # --------------------------------------------

        self.hit_flash_timer = 0

        # --------------------------------------------
        # Handmade-style jitter
        # --------------------------------------------

        self.jitter_timer = 0
        self.jitter = pygame.Vector2()

        # --------------------------------------------
        # Mode pulse
        # --------------------------------------------

        self.mode_tint_strength = 0.12

    # ========================================================
    # MODE SWITCHING
    # ========================================================

    def set_mode(
        self,
        mode: str,
    ) -> None:

        if mode not in {
            MODE_NEUTRAL,
            MODE_PRESSURE,
            MODE_CONTROL,
            MODE_CHAOS,
        }:
            return

        self.mode = mode

    # ========================================================
    # ACTIONS
    # ========================================================

    def pressure_attack(self):

        if self.action_locked:
            return

        self.mode = MODE_PRESSURE

        self.animator.play(
            "pressure",
            restart=True,
        )

        self.action_locked = True

    def control_action(self):

        if self.action_locked:
            return

        self.mode = MODE_CONTROL

        self.animator.play(
            "control",
            restart=True,
        )

        self.action_locked = True

    def chaos_attack(self):

        if self.action_locked:
            return

        self.mode = MODE_CHAOS

        self.animator.play(
            "chaos",
            restart=True,
        )

        self.action_locked = True

    # ========================================================
    # DAMAGE
    # ========================================================

    def damage(
        self,
        amount: int,
    ):

        if amount <= 0:
            return

        self.health -= amount

        self.health = max(
            0,
            self.health,
        )

        self.hit_flash_timer = 0.12

        self.animator.play(
            "hit",
            restart=True,
        )

        self.action_locked = True

    # ========================================================
    # MOVEMENT
    # ========================================================

    def read_input(self):

        keys = pygame.key.get_pressed()

        self.velocity.x = 0
        self.velocity.y = 0

        if self.action_locked:
            return

        if keys[pygame.K_LEFT] or keys[pygame.K_a]:

            self.velocity.x = -1
            self.facing = -1

        elif keys[pygame.K_RIGHT] or keys[pygame.K_d]:

            self.velocity.x = 1
            self.facing = 1

        if keys[pygame.K_UP] or keys[pygame.K_w]:
            self.velocity.y = -1

        elif keys[pygame.K_DOWN] or keys[pygame.K_s]:
            self.velocity.y = 1

        if self.velocity.length_squared() > 0:

            self.velocity = (
                self.velocity.normalize()
                * self.speed
            )

    # ========================================================
    # BASE ANIMATION STATE
    # ========================================================

    def update_base_animation(self):

        if self.action_locked:
            return

        health_ratio = (
            self.health
            / self.max_health
        )

        if health_ratio <= 0.25:

            self.animator.play(
                "low_hp"
            )

        elif self.velocity.length_squared() > 0:

            self.animator.play(
                "walk"
            )

        else:

            self.animator.play(
                "idle"
            )

    # ========================================================
    # ACTION COMPLETION
    # ========================================================

    def update_action_state(self):

        if not self.action_locked:
            return

        if not self.animator.finished:
            return

        self.action_locked = False

        self.animator.play(
            "idle",
            restart=True,
        )

    # ========================================================
    # IMPERFECT IDLE JITTER
    # ========================================================

    def update_jitter(
        self,
        dt: float,
    ):

        self.jitter_timer -= dt

        if self.jitter_timer > 0:
            return

        self.jitter_timer = random.uniform(
            0.10,
            0.24,
        )

        x, y = random_sketch_offset(1)

        self.jitter.update(
            x,
            y,
        )

    # ========================================================
    # UPDATE
    # ========================================================

    def update(
        self,
        dt: float,
    ):

        self.read_input()

        self.position += (
            self.velocity * dt
        )

        self.update_base_animation()

        self.animator.update(dt)

        self.update_action_state()

        self.update_jitter(dt)

        self.hit_flash_timer = max(
            0,
            self.hit_flash_timer - dt,
        )

        base_image = self.animator.image()

        if base_image is None:
            return

        image = base_image.copy()

        # --------------------------------------------
        # Mode tint
        # --------------------------------------------

        if self.mode != MODE_NEUTRAL:

            image = tint_surface(
                image,
                mode_color(self.mode),
                self.mode_tint_strength,
            )

        # --------------------------------------------
        # Damage flash
        # --------------------------------------------

        if self.hit_flash_timer > 0:

            image = flash_white(image)

        # --------------------------------------------
        # Facing direction
        # --------------------------------------------

        if self.facing < 0:

            image = pygame.transform.flip(
                image,
                True,
                False,
            )

        self.image = image

        self.rect = self.image.get_rect(
            center=(
                round(self.position.x + self.jitter.x),
                round(self.position.y + self.jitter.y),
            )
        )
