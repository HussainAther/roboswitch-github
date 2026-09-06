# animation.py

from __future__ import annotations

from dataclasses import dataclass

import pygame


@dataclass
class Animation:
    frames: list[pygame.Surface]

    frame_duration: float = 0.12

    loop: bool = True

    hold_last_frame: bool = False


class Animator:
    """
    Generic sprite animation controller.

    Handles:
    - looping
    - one-shot attacks
    - victory animation
    - hit animations
    - mode animations
    """

    def __init__(self):

        self.animations: dict[str, Animation] = {}

        self.current_name: str | None = None
        self.current: Animation | None = None

        self.frame_index = 0
        self.frame_timer = 0.0

        self.finished = False

    def add(
        self,
        name: str,
        animation: Animation,
    ) -> None:

        self.animations[name] = animation

    def play(
        self,
        name: str,
        restart: bool = False,
    ) -> None:

        if name not in self.animations:
            raise KeyError(
                f"Animation '{name}' is not registered."
            )

        if (
            self.current_name == name
            and not restart
        ):
            return

        self.current_name = name

        self.current = self.animations[name]

        self.frame_index = 0
        self.frame_timer = 0

        self.finished = False

    def update(
        self,
        dt: float,
    ) -> None:

        if self.current is None:
            return

        if self.finished:
            return

        self.frame_timer += dt

        if self.frame_timer < self.current.frame_duration:
            return

        self.frame_timer -= self.current.frame_duration

        self.frame_index += 1

        if self.frame_index < len(self.current.frames):
            return

        if self.current.loop:

            self.frame_index = 0

        else:

            self.finished = True

            if self.current.hold_last_frame:
                self.frame_index = (
                    len(self.current.frames) - 1
                )
            else:
                self.frame_index = 0

    def image(self) -> pygame.Surface | None:

        if self.current is None:
            return None

        return self.current.frames[
            self.frame_index
        ]

    def is_playing(
        self,
        name: str,
    ) -> bool:

        return (
            self.current_name == name
            and not self.finished
        )
