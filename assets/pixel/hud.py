# hud.py

import pygame

from visuals import (
    NOTEBOOK_BG,
    INK,
    PRESSURE,
    CONTROL,
    CHAOS,
)


class HUD:

    def __init__(
        self,
        ui_assets,
    ):

        self.assets = ui_assets

        self.font = pygame.font.Font(
            None,
            24,
        )

    def draw_health(
        self,
        screen,
        player,
    ):

        x = 24
        y = 24

        screen.blit(
            self.assets.hp,
            (x, y),
        )

        ratio = (
            player.health
            / player.max_health
        )

        bar_rect = pygame.Rect(
            x + 42,
            y + 8,
            160,
            16,
        )

        pygame.draw.rect(
            screen,
            NOTEBOOK_BG,
            bar_rect,
        )

        pygame.draw.rect(
            screen,
            INK,
            bar_rect,
            width=2,
        )

        inner = bar_rect.inflate(
            -4,
            -4,
        )

        inner.width = int(
            inner.width * ratio
        )

        pygame.draw.rect(
            screen,
            PRESSURE,
            inner,
        )

    def draw_modes(
        self,
        screen,
        player,
    ):

        y = 64

        entries = [
            (
                "pressure",
                self.assets.pressure,
                PRESSURE,
            ),
            (
                "control",
                self.assets.control,
                CONTROL,
            ),
            (
                "chaos",
                self.assets.chaos,
                CHAOS,
            ),
        ]

        for index, (
            mode,
            icon,
            color,
        ) in enumerate(entries):

            x = 24 + index * 60

            screen.blit(
                icon,
                (x, y),
            )

            if player.mode == mode:

                pygame.draw.rect(
                    screen,
                    color,
                    (
                        x - 3,
                        y - 3,
                        38,
                        38,
                    ),
                    width=3,
                )

    def draw(
        self,
        screen,
        player,
    ):

        self.draw_health(
            screen,
            player,
        )

        self.draw_modes(
            screen,
            player,
        )
