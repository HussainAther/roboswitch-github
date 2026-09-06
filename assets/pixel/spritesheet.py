from __future__ import annotations

from pathlib import Path

import pygame


class SpriteSheet:

    def __init__(
        self,
        filename: str | Path,
        cell_width: int,
        cell_height: int,
    ):
        self.filename = Path(filename)

        self.cell_width = cell_width
        self.cell_height = cell_height

        if self.filename.exists():

            self.image = pygame.image.load(
                str(self.filename)
            ).convert_alpha()

        else:

            print(
                f"[DEV PLACEHOLDER] Missing sprite sheet: "
                f"{self.filename}"
            )

            # Make a large enough temporary sprite sheet
            # for RoboSwitch's current animation rows.
            #
            # 8 columns x 16 rows gives us plenty of room.
            placeholder_columns = 8
            placeholder_rows = 16

            width = (
                placeholder_columns
                * cell_width
            )

            height = (
                placeholder_rows
                * cell_height
            )

            self.image = pygame.Surface(
                (width, height),
                pygame.SRCALPHA,
            )

            self._build_debug_sheet(
                placeholder_columns,
                placeholder_rows,
            )

        self.columns = (
            self.image.get_width()
            // self.cell_width
        )

        self.rows = (
            self.image.get_height()
            // self.cell_height
        )

    # ========================================================
    # TEMPORARY DEBUG GRAPHICS
    # ========================================================

    def _build_debug_sheet(
        self,
        columns: int,
        rows: int,
    ) -> None:

        for row in range(rows):

            for column in range(columns):

                x = (
                    column
                    * self.cell_width
                )

                y = (
                    row
                    * self.cell_height
                )

                rect = pygame.Rect(
                    x + 4,
                    y + 4,
                    self.cell_width - 8,
                    self.cell_height - 8,
                )

                # Transparent cell background
                pygame.draw.rect(
                    self.image,
                    (0, 0, 0, 0),
                    pygame.Rect(
                        x,
                        y,
                        self.cell_width,
                        self.cell_height,
                    ),
                )

                # Debug robot/body box
                pygame.draw.rect(
                    self.image,
                    (80, 80, 80, 255),
                    rect,
                )

                pygame.draw.rect(
                    self.image,
                    (20, 20, 20, 255),
                    rect,
                    width=2,
                )

                # Eyes so direction/animation changes
                # remain visually obvious.
                eye_y = (
                    y
                    + self.cell_height // 3
                )

                pygame.draw.circle(
                    self.image,
                    (255, 255, 255, 255),
                    (
                        x
                        + self.cell_width // 3,
                        eye_y,
                    ),
                    3,
                )

                pygame.draw.circle(
                    self.image,
                    (255, 255, 255, 255),
                    (
                        x
                        + (
                            self.cell_width
                            * 2
                        ) // 3,
                        eye_y,
                    ),
                    3,
                )

                # Small per-frame marker.
                #
                # This lets you see animations changing
                # even before actual drawings exist.
                marker_x = (
                    x
                    + 8
                    + (
                        column
                        * 3
                    )
                    % max(
                        1,
                        self.cell_width - 16,
                    )
                )

                pygame.draw.circle(
                    self.image,
                    (230, 59, 59, 255),
                    (
                        marker_x,
                        y
                        + self.cell_height
                        - 10,
                    ),
                    3,
                )

    # ========================================================
    # CELL ACCESS
    # ========================================================

    def get(
        self,
        column: int,
        row: int,
    ) -> pygame.Surface:

        frame = pygame.Surface(
            (
                self.cell_width,
                self.cell_height,
            ),
            pygame.SRCALPHA,
        )

        # Prevent invalid sprite coordinates
        # from crashing development builds.
        if (
            column < 0
            or row < 0
            or column >= self.columns
            or row >= self.rows
        ):

            pygame.draw.rect(
                frame,
                (255, 0, 255),
                frame.get_rect(),
            )

            return frame

        x = (
            column
            * self.cell_width
        )

        y = (
            row
            * self.cell_height
        )

        frame.blit(
            self.image,
            (0, 0),
            pygame.Rect(
                x,
                y,
                self.cell_width,
                self.cell_height,
            ),
        )

        return frame

    def row(
        self,
        row: int,
        count: int | None = None,
        start_column: int = 0,
    ) -> list[pygame.Surface]:

        if count is None:

            count = (
                self.columns
                - start_column
            )

        return [
            self.get(
                column,
                row,
            )
            for column
            in range(
                start_column,
                start_column + count,
            )
        ]

    def strip(
        self,
        start_column: int,
        row: int,
        frame_count: int,
    ) -> list[pygame.Surface]:

        return [
            self.get(
                start_column + i,
                row,
            )
            for i
            in range(frame_count)
        ]
