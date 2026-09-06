# handwritten_text.py

from pathlib import Path

import pygame


class HandwrittenTextLibrary:

    def __init__(
        self,
        directory,
    ):

        self.directory = Path(directory)

        self.cache = {}

    def load(
        self,
        name,
    ):

        if name in self.cache:
            return self.cache[name]

        filename = (
            self.directory
            / f"{name}.png"
        )

        if not filename.exists():

            raise FileNotFoundError(
                f"Missing handwritten text asset: "
                f"{filename}"
            )

        image = pygame.image.load(
            filename
        ).convert_alpha()

        self.cache[name] = image

        return image
