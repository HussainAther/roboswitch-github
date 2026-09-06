from pathlib import Path

import pygame

from spritesheet import SpriteSheet


class UIAssets:

    def __init__(
        self,
        directory,
    ):

        directory = Path(directory)

        filename = (
            directory
            / "ui_icons.png"
        )

        if filename.exists():

            sheet = SpriteSheet(
                filename,
                32,
                32,
            )

            self.cursor = sheet.get(0, 0)
            self.select_arrow = sheet.get(1, 0)

            self.button_normal = sheet.get(2, 0)
            self.button_selected = sheet.get(3, 0)

            self.hp = sheet.get(0, 1)
            self.shield = sheet.get(1, 1)

            self.pressure = sheet.get(2, 1)
            self.control = sheet.get(3, 1)
            self.chaos = sheet.get(4, 1)

        else:

            print(
                f"[DEV PLACEHOLDER] Missing UI sheet: "
                f"{filename}"
            )

            self.cursor = self._make_icon(
                ">"
            )

            self.select_arrow = self._make_icon(
                ">"
            )

            self.button_normal = self._make_icon(
                "B"
            )

            self.button_selected = self._make_icon(
                "*"
            )

            self.hp = self._make_icon(
                "+"
            )

            self.shield = self._make_icon(
                "S"
            )

            self.pressure = self._make_icon(
                "P"
            )

            self.control = self._make_icon(
                "C"
            )

            self.chaos = self._make_icon(
                "X"
            )

    def _make_icon(
        self,
        label: str,
    ) -> pygame.Surface:

        surface = pygame.Surface(
            (32, 32),
            pygame.SRCALPHA,
        )

        pygame.draw.rect(
            surface,
            (244, 240, 230),
            (
                1,
                1,
                30,
                30,
            ),
        )

        pygame.draw.rect(
            surface,
            (26, 26, 26),
            (
                1,
                1,
                30,
                30,
            ),
            width=2,
        )

        font = pygame.font.Font(
            None,
            24,
        )

        text = font.render(
            label,
            True,
            (26, 26, 26),
        )

        text_rect = text.get_rect(
            center=(
                16,
                16,
            )
        )

        surface.blit(
            text,
            text_rect,
        )

        return surface
