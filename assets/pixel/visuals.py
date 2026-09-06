# visuals.py
#
# RoboSwitch visual constants and rendering helpers.
#
# Rendering helpers for RoboSwitch sprite and notebook-style assets.

from __future__ import annotations

import random
import pygame


# ============================================================
# CORE COLOR LANGUAGE
# ============================================================

PRESSURE = pygame.Color("#E23B3B")
CONTROL = pygame.Color("#3B7DE2")
CHAOS = pygame.Color("#3BE27A")

PRESSURE_DARK = pygame.Color("#9C2222")
CONTROL_DARK = pygame.Color("#1E4A9C")
CHAOS_DARK = pygame.Color("#1E9C4A")

NOTEBOOK_BG = pygame.Color("#F4F0E6")
INK = pygame.Color("#1A1A1A")

METAL = pygame.Color("#8A8A8A")
METAL_DARK = pygame.Color("#4A4A4A")
RUST = pygame.Color("#A65C3A")

WHITE = pygame.Color("#FFFFFF")
BLACK = pygame.Color("#000000")


# ============================================================
# GAMEPLAY MODES
# ============================================================

MODE_NEUTRAL = "neutral"
MODE_PRESSURE = "pressure"
MODE_CONTROL = "control"
MODE_CHAOS = "chaos"


MODE_COLORS = {
    MODE_NEUTRAL: WHITE,
    MODE_PRESSURE: PRESSURE,
    MODE_CONTROL: CONTROL,
    MODE_CHAOS: CHAOS,
}

MODE_DARK_COLORS = {
    MODE_NEUTRAL: METAL_DARK,
    MODE_PRESSURE: PRESSURE_DARK,
    MODE_CONTROL: CONTROL_DARK,
    MODE_CHAOS: CHAOS_DARK,
}


# ============================================================
# ANIMATION NAMES
# ============================================================

ANIM_IDLE = "idle"
ANIM_WALK = "walk"

ANIM_PRESSURE = "pressure"
ANIM_CONTROL = "control"
ANIM_CHAOS = "chaos"

ANIM_HIT = "hit"
ANIM_LOW_HP = "low_hp"
ANIM_VICTORY = "victory"

ANIM_DEATH = "death"
ANIM_FALL = "fall"

ANIM_JUMP = "jump"
ANIM_LAND = "land"

ANIM_ATTACK = "attack"
ANIM_BLOCK = "block"


# ============================================================
# SPRITE DIMENSIONS
# ============================================================

CELL_WIDTH = 48
CELL_HEIGHT = 48

CELL_SIZE = (CELL_WIDTH, CELL_HEIGHT)


# ============================================================
# VISUAL HELPERS
# ============================================================

def mode_color(mode: str) -> pygame.Color:
    """Return RoboSwitch's canonical color for a gameplay mode."""
    return MODE_COLORS.get(mode, WHITE)


def dark_mode_color(mode: str) -> pygame.Color:
    return MODE_DARK_COLORS.get(mode, METAL_DARK)


def random_sketch_offset(amount: int = 1) -> tuple[int, int]:
    """
    Tiny randomized offset that gives otherwise static images a
    sketch-like / imperfect animation feel.
    """

    return (
        random.randint(-amount, amount),
        random.randint(-amount, amount),
    )


def tint_surface(
    surface: pygame.Surface,
    color: pygame.Color,
    strength: float = 0.35,
) -> pygame.Surface:
    """
    Add a color tint while preserving the original source drawing.

    strength:
        0.0 = untouched
        1.0 = almost entirely mode color
    """

    strength = max(0.0, min(1.0, strength))

    source = surface.copy().convert_alpha()

    tint = pygame.Surface(source.get_size(), pygame.SRCALPHA)
    tint.fill(color)

    result = source.copy()

    tint.set_alpha(int(255 * strength))

    result.blit(
        tint,
        (0, 0),
        special_flags=pygame.BLEND_RGBA_MULT,
    )

    return result


def flash_white(surface: pygame.Surface) -> pygame.Surface:
    """Create a bright hit-flash version of a sprite."""

    result = surface.copy()

    white_overlay = pygame.Surface(
        surface.get_size(),
        pygame.SRCALPHA,
    )

    white_overlay.fill((255, 255, 255, 190))

    result.blit(
        white_overlay,
        (0, 0),
        special_flags=pygame.BLEND_RGBA_ADD,
    )

    return result


def nearest_scale(
    surface: pygame.Surface,
    scale: int,
) -> pygame.Surface:

    width = surface.get_width() * scale
    height = surface.get_height() * scale

    return pygame.transform.scale(
        surface,
        (width, height),
    )
