from pathlib import Path
import pygame


class NotebookBackground:

    def __init__(
        self,
        filename,
        screen_size,
    ):
        filename = Path(filename)

        if filename.exists():
            image = pygame.image.load(
                str(filename)
            ).convert()

            self.image = pygame.transform.scale(
                image,
                screen_size,
            )

        else:
            # Temporary development background.
            # This is NOT final RoboSwitch artwork.
            self.image = pygame.Surface(
                screen_size
            )

            self.image.fill(
                (244, 240, 230)
            )

            print(
                f"[DEV PLACEHOLDER] Missing background: {filename}"
            )

    def draw(
        self,
        screen,
    ):
        screen.blit(
            self.image,
            (0, 0),
        )
