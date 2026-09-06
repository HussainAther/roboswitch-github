# generate_roboswitch_assets.py
#
# RoboSwitch procedural/vector asset factory.
#
# Generates:
#
# assets/robot/robo_protagonist_sheet.png
# assets/enemies/enemy_chunky_a_sheet.png
# assets/enemies/enemy_chunky_b_sheet.png
# assets/ui/ui_icons.png
#
# assets/effects/pressure_mark.png
# assets/effects/control_mark.png
# assets/effects/chaos_mark.png
# assets/effects/spark_01.png
# assets/effects/spark_02.png
#
# assets/environment/notebook_background.png
#
# assets/text/start.png
# assets/text/options.png
# assets/text/exit.png
# assets/text/pressure.png
# assets/text/control.png
# assets/text/chaos.png
# assets/text/game_over.png
# assets/text/you_win.png
#
# Run:
#
#     python generate_roboswitch_assets.py
#
# Then:
#
#     python main.py
#
# The existing loaders should automatically start using these PNGs.

from __future__ import annotations

import math
from pathlib import Path

import pygame


pygame.init()


# ============================================================
# OUTPUT
# ============================================================

ROOT = Path("assets")

ROBOT_DIR = ROOT / "robot"
ENEMY_DIR = ROOT / "enemies"
UI_DIR = ROOT / "ui"
EFFECT_DIR = ROOT / "effects"
ENV_DIR = ROOT / "environment"
TEXT_DIR = ROOT / "text"


for directory in (
    ROBOT_DIR,
    ENEMY_DIR,
    UI_DIR,
    EFFECT_DIR,
    ENV_DIR,
    TEXT_DIR,
):
    directory.mkdir(
        parents=True,
        exist_ok=True,
    )


# ============================================================
# COLORS
# ============================================================

PAPER = (238, 232, 210)
PAPER_LIGHT = (247, 243, 228)

INK = (24, 26, 32)

ARMOR = (188, 198, 207)
ARMOR_LIGHT = (245, 248, 250)
ARMOR_DARK = (86, 96, 108)

JOINT = (55, 60, 68)

PRESSURE = (225, 65, 55)
PRESSURE_DARK = (150, 35, 35)

CHAOS = (135, 72, 190)
CHAOS_DARK = (77, 38, 115)

CONTROL = (45, 150, 210)
CONTROL_DARK = (27, 88, 135)

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

TRANSPARENT = (0, 0, 0, 0)


# ============================================================
# DIMENSIONS
# ============================================================

ROBOT_CELL = 48
ENEMY_CELL = 48
UI_CELL = 32


# ============================================================
# GENERAL DRAW HELPERS
# ============================================================

def save(
    surface: pygame.Surface,
    filename: Path,
) -> None:

    pygame.image.save(
        surface,
        str(filename),
    )

    print(
        f"generated: {filename}"
    )


def poly(
    surface: pygame.Surface,
    points,
    color,
    width=0,
):

    pygame.draw.polygon(
        surface,
        color,
        points,
        width,
    )


def line(
    surface: pygame.Surface,
    a,
    b,
    color,
    width,
):

    pygame.draw.line(
        surface,
        color,
        a,
        b,
        width,
    )


def circle(
    surface: pygame.Surface,
    pos,
    radius,
    color,
    width=0,
):

    pygame.draw.circle(
        surface,
        color,
        pos,
        radius,
        width,
    )


def rotated_point(
    point,
    pivot,
    degrees,
):

    angle = math.radians(
        degrees
    )

    px, py = point
    ox, oy = pivot

    dx = px - ox
    dy = py - oy

    return (
        ox
        + math.cos(angle) * dx
        - math.sin(angle) * dy,

        oy
        + math.sin(angle) * dx
        + math.cos(angle) * dy,
    )


def thick_limb(
    surface,
    start,
    end,
    fill,
    width,
    outline=INK,
):

    line(
        surface,
        start,
        end,
        outline,
        width + 3,
    )

    line(
        surface,
        start,
        end,
        fill,
        width,
    )


# ============================================================
# MODE GEAR
# ============================================================

def draw_mode_gear(
    surface,
    cx,
    cy,
    radius,
    rotation=0,
):

    teeth = 10

    points = []

    for i in range(
        teeth * 2
    ):

        angle = (
            rotation
            + i
            * (
                360
                / (teeth * 2)
            )
        )

        current_radius = (
            radius
            if i % 2 == 0
            else radius * 0.82
        )

        x = (
            cx
            + math.cos(
                math.radians(angle)
            )
            * current_radius
        )

        y = (
            cy
            + math.sin(
                math.radians(angle)
            )
            * current_radius
        )

        points.append(
            (x, y)
        )

    poly(
        surface,
        points,
        ARMOR_DARK,
    )

    poly(
        surface,
        points,
        INK,
        2,
    )

    circle(
        surface,
        (cx, cy),
        int(radius * 0.60),
        ARMOR,
    )

    circle(
        surface,
        (cx, cy),
        int(radius * 0.60),
        INK,
        2,
    )

    gear_rect = pygame.Rect(
        int(cx - radius * 0.43),
        int(cy - radius * 0.43),
        int(radius * 0.86),
        int(radius * 0.86),
    )

    pygame.draw.arc(
        surface,
        PRESSURE,
        gear_rect,
        math.radians(-75),
        math.radians(35),
        max(
            2,
            int(radius * 0.15),
        ),
    )

    pygame.draw.arc(
        surface,
        CHAOS,
        gear_rect,
        math.radians(45),
        math.radians(155),
        max(
            2,
            int(radius * 0.15),
        ),
    )

    pygame.draw.arc(
        surface,
        CONTROL,
        gear_rect,
        math.radians(165),
        math.radians(275),
        max(
            2,
            int(radius * 0.15),
        ),
    )

    circle(
        surface,
        (cx, cy),
        max(
            2,
            int(radius * 0.16),
        ),
        INK,
    )

    selector_angle = (
        rotation - 90
    )

    sx = (
        cx
        + math.cos(
            math.radians(
                selector_angle
            )
        )
        * radius
        * 0.42
    )

    sy = (
        cy
        + math.sin(
            math.radians(
                selector_angle
            )
        )
        * radius
        * 0.42
    )

    line(
        surface,
        (cx, cy),
        (sx, sy),
        ARMOR_LIGHT,
        max(
            2,
            int(radius * 0.11),
        ),
    )


# ============================================================
# PROTAGONIST
# ============================================================

def draw_robot_frame(
    surface,
    frame_x,
    frame_y,
    pose="idle",
    phase=0,
):

    cx = (
        frame_x
        + ROBOT_CELL // 2
    )

    base_y = (
        frame_y + 43
    )

    # --------------------------------------------------------
    # Animation parameters
    # --------------------------------------------------------

    bob = 0

    left_arm_delta = 0
    right_arm_delta = 0

    left_leg_delta = 0
    right_leg_delta = 0

    gear_rotation = -10

    eye_offset = 0

    if pose == "idle":

        bob = (
            0
            if phase % 3 == 0
            else -1
        )

        gear_rotation += (
            phase * 5
        )

    elif pose == "walk":

        bob = (
            -1
            if phase % 2
            else 0
        )

        if phase % 4 == 0:
            left_arm_delta = -3
            right_arm_delta = 3
            left_leg_delta = 3
            right_leg_delta = -3

        elif phase % 4 == 1:
            left_arm_delta = 1
            right_arm_delta = -1

        elif phase % 4 == 2:
            left_arm_delta = 3
            right_arm_delta = -3
            left_leg_delta = -3
            right_leg_delta = 3

        else:
            left_arm_delta = -1
            right_arm_delta = 1

    elif pose == "pressure":

        gear_rotation = (
            -10
            + phase * 30
        )

        right_arm_delta = (
            -2 - phase
        )

    elif pose == "control":

        gear_rotation = (
            180
            + phase * 8
        )

        right_arm_delta = -2

    elif pose == "chaos":

        gear_rotation = (
            phase * 70
        )

        bob = (
            -1
            if phase % 2 == 0
            else 1
        )

        eye_offset = (
            -1
            if phase % 2
            else 1
        )

    elif pose == "hit":

        bob = 1

        left_arm_delta = 2
        right_arm_delta = -2

    elif pose == "low_hp":

        bob = (
            phase % 2
        )

        left_arm_delta = 2
        right_arm_delta = 2

    elif pose == "victory":

        bob = -2

        left_arm_delta = (
            -5 - phase
        )

        right_arm_delta = (
            -3
        )

    # --------------------------------------------------------
    # Simplified 48px RoboSwitch
    # --------------------------------------------------------

    body_y = (
        base_y
        - 22
        + bob
    )

    # Legs

    left_hip = (
        cx - 6,
        body_y + 10,
    )

    right_hip = (
        cx + 6,
        body_y + 10,
    )

    left_knee = (
        cx - 8
        + left_leg_delta,
        body_y + 19,
    )

    right_knee = (
        cx + 8
        + right_leg_delta,
        body_y + 19,
    )

    left_foot = (
        cx - 10
        + left_leg_delta,
        body_y + 27,
    )

    right_foot = (
        cx + 10
        + right_leg_delta,
        body_y + 27,
    )

    thick_limb(
        surface,
        left_hip,
        left_knee,
        ARMOR_DARK,
        5,
    )

    thick_limb(
        surface,
        left_knee,
        left_foot,
        ARMOR,
        5,
    )

    thick_limb(
        surface,
        right_hip,
        right_knee,
        ARMOR_DARK,
        5,
    )

    thick_limb(
        surface,
        right_knee,
        right_foot,
        ARMOR,
        5,
    )

    circle(
        surface,
        left_knee,
        3,
        ARMOR_LIGHT,
    )

    circle(
        surface,
        right_knee,
        3,
        ARMOR_LIGHT,
    )

    line(
        surface,
        (
            left_foot[0] - 4,
            left_foot[1] + 2,
        ),
        (
            left_foot[0] + 3,
            left_foot[1] + 2,
        ),
        INK,
        4,
    )

    line(
        surface,
        (
            right_foot[0] - 3,
            right_foot[1] + 2,
        ),
        (
            right_foot[0] + 4,
            right_foot[1] + 2,
        ),
        INK,
        4,
    )

    # Torso

    torso = [
        (
            cx - 10,
            body_y - 6,
        ),
        (
            cx + 10,
            body_y - 6,
        ),
        (
            cx + 8,
            body_y + 10,
        ),
        (
            cx,
            body_y + 14,
        ),
        (
            cx - 8,
            body_y + 10,
        ),
    ]

    poly(
        surface,
        torso,
        ARMOR,
    )

    poly(
        surface,
        torso,
        INK,
        2,
    )

    chest = [
        (
            cx - 4,
            body_y - 2,
        ),
        (
            cx + 5,
            body_y - 2,
        ),
        (
            cx + 3,
            body_y + 7,
        ),
        (
            cx,
            body_y + 10,
        ),
        (
            cx - 3,
            body_y + 7,
        ),
    ]

    poly(
        surface,
        chest,
        ARMOR_DARK,
    )

    circle(
        surface,
        (
            cx,
            body_y + 3,
        ),
        2,
        ARMOR_LIGHT,
    )

    # Arms

    left_shoulder = (
        cx - 11,
        body_y - 3,
    )

    right_shoulder = (
        cx + 11,
        body_y - 3,
    )

    left_elbow = (
        cx - 15,
        body_y + 4
        + left_arm_delta,
    )

    left_wrist = (
        cx - 18,
        body_y + 11
        + left_arm_delta,
    )

    right_elbow = (
        cx + 15,
        body_y + 4
        + right_arm_delta,
    )

    right_wrist = (
        cx + 18,
        body_y + 10
        + right_arm_delta,
    )

    circle(
        surface,
        left_shoulder,
        4,
        JOINT,
    )

    circle(
        surface,
        right_shoulder,
        4,
        JOINT,
    )

    thick_limb(
        surface,
        left_shoulder,
        left_elbow,
        ARMOR_DARK,
        4,
    )

    thick_limb(
        surface,
        left_elbow,
        left_wrist,
        ARMOR,
        4,
    )

    thick_limb(
        surface,
        right_shoulder,
        right_elbow,
        ARMOR,
        4,
    )

    thick_limb(
        surface,
        right_elbow,
        right_wrist,
        ARMOR_DARK,
        4,
    )

    # Mode gear

    draw_mode_gear(
        surface,
        int(
            right_wrist[0]
        ),
        int(
            right_wrist[1]
        ),
        7,
        gear_rotation,
    )

    # Neck

    line(
        surface,
        (
            cx,
            body_y - 7,
        ),
        (
            cx,
            body_y - 11,
        ),
        JOINT,
        5,
    )

    # Helmet

    head_y = (
        body_y - 17
    )

    helmet = [
        (
            cx - 8,
            head_y + 5,
        ),
        (
            cx - 8,
            head_y - 3,
        ),
        (
            cx - 5,
            head_y - 7,
        ),
        (
            cx - 3,
            head_y - 12,
        ),
        (
            cx,
            head_y - 8,
        ),
        (
            cx + 3,
            head_y - 13,
        ),
        (
            cx + 4,
            head_y - 8,
        ),
        (
            cx + 9,
            head_y - 11,
        ),
        (
            cx + 7,
            head_y - 5,
        ),
        (
            cx + 11,
            head_y - 3,
        ),
        (
            cx + 8,
            head_y + 2,
        ),
        (
            cx + 8,
            head_y + 6,
        ),
        (
            cx + 4,
            head_y + 9,
        ),
        (
            cx - 4,
            head_y + 9,
        ),
    ]

    poly(
        surface,
        helmet,
        ARMOR,
    )

    poly(
        surface,
        helmet,
        INK,
        2,
    )

    # Face

    face = pygame.Rect(
        cx - 6,
        head_y - 2,
        13,
        8,
    )

    pygame.draw.rect(
        surface,
        ARMOR_LIGHT,
        face,
    )

    pygame.draw.rect(
        surface,
        INK,
        face,
        1,
    )

    # Eyes

    left_eye_x = (
        cx - 3
        + eye_offset
    )

    right_eye_x = (
        cx + 3
        + eye_offset
    )

    eye_y = head_y + 1

    circle(
        surface,
        (
            left_eye_x,
            eye_y,
        ),
        1,
        INK,
    )

    circle(
        surface,
        (
            right_eye_x,
            eye_y,
        ),
        1,
        INK,
    )

    # Tiny skeptical mouth

    line(
        surface,
        (
            cx - 2,
            head_y + 4,
        ),
        (
            cx + 2,
            head_y + 4,
        ),
        INK,
        1,
    )

    # --------------------------------------------------------
    # Mode overlays
    # --------------------------------------------------------

    if pose == "pressure":

        circle(
            surface,
            (
                cx,
                body_y + 3,
            ),
            3 + phase,
            PRESSURE,
            1,
        )

    elif pose == "control":

        pygame.draw.rect(
            surface,
            CONTROL,
            pygame.Rect(
                cx - 12 - phase,
                body_y - 12 - phase,
                24 + phase * 2,
                30 + phase * 2,
            ),
            1,
        )

    elif pose == "chaos":

        for n in range(
            3 + phase
        ):

            gx = (
                cx
                - 13
                + (
                    n * 9
                    + phase * 3
                )
                % 27
            )

            gy = (
                body_y
                - 12
                + (
                    n * 7
                    + phase * 5
                )
                % 30
            )

            circle(
                surface,
                (
                    gx,
                    gy,
                ),
                1,
                CHAOS,
            )

    elif pose == "hit":

        if phase % 2 == 0:

            line(
                surface,
                (
                    cx - 13,
                    head_y - 5,
                ),
                (
                    cx + 13,
                    body_y + 14,
                ),
                PRESSURE,
                2,
            )


def generate_protagonist_sheet():

    columns = 4
    rows = 8

    sheet = pygame.Surface(
        (
            columns * ROBOT_CELL,
            rows * ROBOT_CELL,
        ),
        pygame.SRCALPHA,
    )

    sheet.fill(
        TRANSPARENT
    )

    animation_rows = (
        ("idle", 3),
        ("walk", 4),
        ("pressure", 3),
        ("control", 3),
        ("chaos", 3),
        ("hit", 2),
        ("low_hp", 3),
        ("victory", 4),
    )

    for row, (
        animation,
        count,
    ) in enumerate(
        animation_rows
    ):

        for frame in range(
            count
        ):

            draw_robot_frame(
                sheet,
                frame * ROBOT_CELL,
                row * ROBOT_CELL,
                animation,
                frame,
            )

    save(
        sheet,
        ROBOT_DIR
        / "robo_protagonist_sheet.png",
    )


# ============================================================
# PRESSURE ENEMY
# ============================================================

def draw_pressure_enemy(
    surface,
    frame_x,
    frame_y,
    pose,
    phase,
):

    cx = (
        frame_x
        + ENEMY_CELL // 2
    )

    cy = (
        frame_y + 26
    )

    bob = (
        -1
        if phase % 2
        else 0
    )

    cy += bob

    if pose == "death":

        cy += (
            phase * 3
        )

    # Heavy feet

    line(
        surface,
        (
            cx - 9,
            cy + 12,
        ),
        (
            cx - 11,
            cy + 19,
        ),
        ARMOR_DARK,
        6,
    )

    line(
        surface,
        (
            cx + 9,
            cy + 12,
        ),
        (
            cx + 11,
            cy + 19,
        ),
        ARMOR_DARK,
        6,
    )

    # Tank body

    body = pygame.Rect(
        cx - 14,
        cy - 11,
        28,
        25,
    )

    pygame.draw.rect(
        surface,
        PRESSURE_DARK,
        body,
        border_radius=6,
    )

    pygame.draw.rect(
        surface,
        INK,
        body,
        width=2,
        border_radius=6,
    )

    # Shoulder armor

    circle(
        surface,
        (
            cx - 14,
            cy - 4,
        ),
        6,
        PRESSURE,
    )

    circle(
        surface,
        (
            cx + 14,
            cy - 4,
        ),
        6,
        PRESSURE,
    )

    # Face slit

    pygame.draw.rect(
        surface,
        INK,
        (
            cx - 8,
            cy - 7,
            16,
            5,
        ),
    )

    circle(
        surface,
        (
            cx + 4,
            cy - 5,
        ),
        1,
        WHITE,
    )

    # Pressure core

    circle(
        surface,
        (
            cx,
            cy + 5,
        ),
        5,
        INK,
    )

    circle(
        surface,
        (
            cx,
            cy + 5,
        ),
        3,
        PRESSURE,
    )

    if pose == "attack":

        extension = (
            5 + phase * 3
        )

        line(
            surface,
            (
                cx + 13,
                cy - 1,
            ),
            (
                cx + 13 + extension,
                cy - 4,
            ),
            PRESSURE,
            5,
        )

    if pose == "hit":

        line(
            surface,
            (
                cx - 15,
                cy - 14,
            ),
            (
                cx + 15,
                cy + 15,
            ),
            WHITE,
            2,
        )


def generate_pressure_enemy():

    columns = 5
    rows = 5

    sheet = pygame.Surface(
        (
            columns * ENEMY_CELL,
            rows * ENEMY_CELL,
        ),
        pygame.SRCALPHA,
    )

    animations = (
        ("idle", 3),
        ("walk", 4),
        ("attack", 4),
        ("hit", 2),
        ("death", 4),
    )

    for row, (
        pose,
        count,
    ) in enumerate(
        animations
    ):

        for frame in range(
            count
        ):

            draw_pressure_enemy(
                sheet,
                frame * ENEMY_CELL,
                row * ENEMY_CELL,
                pose,
                frame,
            )

    save(
        sheet,
        ENEMY_DIR
        / "enemy_chunky_a_sheet.png",
    )


# ============================================================
# CHAOS ENEMY
# ============================================================

def draw_chaos_enemy(
    surface,
    frame_x,
    frame_y,
    pose,
    phase,
):

    cx = (
        frame_x
        + ENEMY_CELL // 2
    )

    cy = (
        frame_y + 25
    )

    jitter_x = (
        (-1, 2, -2, 1, 0)[
            phase % 5
        ]
    )

    jitter_y = (
        (0, -2, 1, -1, 2)[
            phase % 5
        ]
    )

    cx += jitter_x
    cy += jitter_y

    # Legs

    thick_limb(
        surface,
        (
            cx - 4,
            cy + 6,
        ),
        (
            cx - 9,
            cy + 19,
        ),
        CHAOS_DARK,
        3,
    )

    thick_limb(
        surface,
        (
            cx + 4,
            cy + 6,
        ),
        (
            cx + 9,
            cy + 19,
        ),
        CHAOS_DARK,
        3,
    )

    # Thin angular body

    body = [
        (
            cx,
            cy - 14,
        ),
        (
            cx + 9,
            cy - 4,
        ),
        (
            cx + 5,
            cy + 10,
        ),
        (
            cx - 5,
            cy + 10,
        ),
        (
            cx - 9,
            cy - 4,
        ),
    ]

    poly(
        surface,
        body,
        CHAOS,
    )

    poly(
        surface,
        body,
        INK,
        2,
    )

    # Asymmetrical head

    head = [
        (
            cx - 7,
            cy - 15,
        ),
        (
            cx - 3,
            cy - 23,
        ),
        (
            cx + 1,
            cy - 18,
        ),
        (
            cx + 8,
            cy - 22,
        ),
        (
            cx + 6,
            cy - 12,
        ),
    ]

    poly(
        surface,
        head,
        ARMOR_DARK,
    )

    poly(
        surface,
        head,
        INK,
        2,
    )

    circle(
        surface,
        (
            cx + 2,
            cy - 16,
        ),
        2,
        WHITE,
    )

    # Arms

    line(
        surface,
        (
            cx - 7,
            cy - 3,
        ),
        (
            cx - 16 - phase,
            cy + 2,
        ),
        CHAOS,
        3,
    )

    line(
        surface,
        (
            cx + 7,
            cy - 3,
        ),
        (
            cx + 15 + phase,
            cy - 8,
        ),
        CHAOS,
        3,
    )

    if pose == "attack":

        for index in range(
            3
        ):

            circle(
                surface,
                (
                    cx
                    + 14
                    + phase * 2
                    + index * 3,
                    cy
                    - 8
                    - index * 2,
                ),
                2,
                CHAOS,
            )

    if pose == "hit":

        line(
            surface,
            (
                cx - 12,
                cy - 20,
            ),
            (
                cx + 13,
                cy + 15,
            ),
            WHITE,
            2,
        )

    if pose == "death":

        for index in range(
            phase + 1
        ):

            circle(
                surface,
                (
                    cx
                    + index * 4
                    - 5,
                    cy
                    + index * 3
                    - 5,
                ),
                2,
                CHAOS,
            )


def generate_chaos_enemy():

    columns = 5
    rows = 5

    sheet = pygame.Surface(
        (
            columns * ENEMY_CELL,
            rows * ENEMY_CELL,
        ),
        pygame.SRCALPHA,
    )

    animations = (
        ("idle", 4),
        ("walk", 4),
        ("attack", 5),
        ("hit", 2),
        ("death", 5),
    )

    for row, (
        pose,
        count,
    ) in enumerate(
        animations
    ):

        for frame in range(
            count
        ):

            draw_chaos_enemy(
                sheet,
                frame * ENEMY_CELL,
                row * ENEMY_CELL,
                pose,
                frame,
            )

    save(
        sheet,
        ENEMY_DIR
        / "enemy_chunky_b_sheet.png",
    )


# ============================================================
# UI ICONS
# ============================================================

def icon_cell(
    sheet,
    column,
    row,
):

    x = column * UI_CELL
    y = row * UI_CELL

    return (
        x,
        y,
        x + UI_CELL // 2,
        y + UI_CELL // 2,
    )


def draw_ui_frame(
    sheet,
    column,
    row,
):

    x = column * UI_CELL
    y = row * UI_CELL

    pygame.draw.rect(
        sheet,
        PAPER_LIGHT,
        (
            x + 2,
            y + 2,
            UI_CELL - 4,
            UI_CELL - 4,
        ),
        border_radius=4,
    )

    pygame.draw.rect(
        sheet,
        INK,
        (
            x + 2,
            y + 2,
            UI_CELL - 4,
            UI_CELL - 4,
        ),
        2,
        border_radius=4,
    )


def generate_ui():

    sheet = pygame.Surface(
        (
            UI_CELL * 5,
            UI_CELL * 2,
        ),
        pygame.SRCALPHA,
    )

    sheet.fill(
        TRANSPARENT
    )

    # --------------------------------------------------------
    # cursor
    # --------------------------------------------------------

    x, y, cx, cy = icon_cell(
        sheet,
        0,
        0,
    )

    poly(
        sheet,
        [
            (
                x + 7,
                y + 5,
            ),
            (
                x + 24,
                y + 16,
            ),
            (
                x + 14,
                y + 18,
            ),
            (
                x + 11,
                y + 27,
            ),
        ],
        ARMOR_LIGHT,
    )

    poly(
        sheet,
        [
            (
                x + 7,
                y + 5,
            ),
            (
                x + 24,
                y + 16,
            ),
            (
                x + 14,
                y + 18,
            ),
            (
                x + 11,
                y + 27,
            ),
        ],
        INK,
        2,
    )

    # --------------------------------------------------------
    # select arrow
    # --------------------------------------------------------

    x, y, cx, cy = icon_cell(
        sheet,
        1,
        0,
    )

    poly(
        sheet,
        [
            (
                x + 6,
                y + 8,
            ),
            (
                x + 25,
                y + 16,
            ),
            (
                x + 6,
                y + 24,
            ),
        ],
        CONTROL,
    )

    poly(
        sheet,
        [
            (
                x + 6,
                y + 8,
            ),
            (
                x + 25,
                y + 16,
            ),
            (
                x + 6,
                y + 24,
            ),
        ],
        INK,
        2,
    )

    # --------------------------------------------------------
    # normal button
    # --------------------------------------------------------

    draw_ui_frame(
        sheet,
        2,
        0,
    )

    # --------------------------------------------------------
    # selected button
    # --------------------------------------------------------

    draw_ui_frame(
        sheet,
        3,
        0,
    )

    x, y, cx, cy = icon_cell(
        sheet,
        3,
        0,
    )

    pygame.draw.rect(
        sheet,
        CONTROL,
        (
            x + 5,
            y + 5,
            22,
            22,
        ),
        2,
        border_radius=3,
    )

    # --------------------------------------------------------
    # HP
    # --------------------------------------------------------

    draw_ui_frame(
        sheet,
        0,
        1,
    )

    x, y, cx, cy = icon_cell(
        sheet,
        0,
        1,
    )

    line(
        sheet,
        (
            cx - 7,
            cy,
        ),
        (
            cx + 7,
            cy,
        ),
        PRESSURE,
        4,
    )

    line(
        sheet,
        (
            cx,
            cy - 7,
        ),
        (
            cx,
            cy + 7,
        ),
        PRESSURE,
        4,
    )

    # --------------------------------------------------------
    # shield
    # --------------------------------------------------------

    draw_ui_frame(
        sheet,
        1,
        1,
    )

    x, y, cx, cy = icon_cell(
        sheet,
        1,
        1,
    )

    shield = [
        (
            cx,
            cy - 9,
        ),
        (
            cx + 8,
            cy - 5,
        ),
        (
            cx + 6,
            cy + 5,
        ),
        (
            cx,
            cy + 10,
        ),
        (
            cx - 6,
            cy + 5,
        ),
        (
            cx - 8,
            cy - 5,
        ),
    ]

    poly(
        sheet,
        shield,
        CONTROL,
    )

    poly(
        sheet,
        shield,
        INK,
        2,
    )

    # --------------------------------------------------------
    # Pressure
    # --------------------------------------------------------

    draw_mode_icon(
        sheet,
        2,
        1,
        PRESSURE,
        "!",
    )

    # --------------------------------------------------------
    # Control
    # --------------------------------------------------------

    draw_mode_icon(
        sheet,
        3,
        1,
        CONTROL,
        "=",
    )

    # --------------------------------------------------------
    # Chaos
    # --------------------------------------------------------

    draw_mode_icon(
        sheet,
        4,
        1,
        CHAOS,
        "?",
    )

    save(
        sheet,
        UI_DIR
        / "ui_icons.png",
    )


def draw_mode_icon(
    sheet,
    column,
    row,
    color,
    symbol,
):

    draw_ui_frame(
        sheet,
        column,
        row,
    )

    x, y, cx, cy = icon_cell(
        sheet,
        column,
        row,
    )

    circle(
        sheet,
        (
            cx,
            cy,
        ),
        10,
        color,
    )

    circle(
        sheet,
        (
            cx,
            cy,
        ),
        10,
        INK,
        2,
    )

    font = pygame.font.Font(
        None,
        19,
    )

    text = font.render(
        symbol,
        True,
        WHITE,
    )

    rect = text.get_rect(
        center=(
            cx,
            cy,
        )
    )

    sheet.blit(
        text,
        rect,
    )


# ============================================================
# EFFECT IMAGES
# ============================================================

def transparent_effect_surface(
    size=64,
):

    return pygame.Surface(
        (
            size,
            size,
        ),
        pygame.SRCALPHA,
    )


def generate_pressure_mark():

    surface = (
        transparent_effect_surface()
    )

    cx = cy = 32

    for radius in (
        27,
        20,
        13,
    ):

        circle(
            surface,
            (
                cx,
                cy,
            ),
            radius,
            PRESSURE,
            3,
        )

    for angle in range(
        0,
        360,
        45,
    ):

        start = (
            cx
            + math.cos(
                math.radians(angle)
            )
            * 13,

            cy
            + math.sin(
                math.radians(angle)
            )
            * 13,
        )

        end = (
            cx
            + math.cos(
                math.radians(angle)
            )
            * 29,

            cy
            + math.sin(
                math.radians(angle)
            )
            * 29,
        )

        line(
            surface,
            start,
            end,
            PRESSURE,
            4,
        )

    save(
        surface,
        EFFECT_DIR
        / "pressure_mark.png",
    )


def generate_control_mark():

    surface = (
        transparent_effect_surface()
    )

    for inset in (
        7,
        14,
        21,
    ):

        pygame.draw.rect(
            surface,
            CONTROL,
            (
                inset,
                inset,
                64 - inset * 2,
                64 - inset * 2,
            ),
            3,
        )

    line(
        surface,
        (
            8,
            32,
        ),
        (
            56,
            32,
        ),
        CONTROL,
        3,
    )

    line(
        surface,
        (
            32,
            8,
        ),
        (
            32,
            56,
        ),
        CONTROL,
        3,
    )

    save(
        surface,
        EFFECT_DIR
        / "control_mark.png",
    )


def generate_chaos_mark():

    surface = (
        transparent_effect_surface()
    )

    points = []

    for index in range(
        24
    ):

        angle = (
            index * 15
        )

        radius = (
            28
            if index % 2 == 0
            else (
                10
                + (
                    index * 7
                )
                % 13
            )
        )

        points.append(
            (
                32
                + math.cos(
                    math.radians(angle)
                )
                * radius,

                32
                + math.sin(
                    math.radians(angle)
                )
                * radius,
            )
        )

    poly(
        surface,
        points,
        CHAOS,
    )

    poly(
        surface,
        points,
        INK,
        2,
    )

    circle(
        surface,
        (
            32,
            32,
        ),
        7,
        PAPER_LIGHT,
    )

    save(
        surface,
        EFFECT_DIR
        / "chaos_mark.png",
    )


def generate_sparks():

    spark1 = (
        transparent_effect_surface(
            32
        )
    )

    cx = cy = 16

    for angle in range(
        0,
        360,
        45,
    ):

        line(
            spark1,
            (
                cx,
                cy,
            ),
            (
                cx
                + math.cos(
                    math.radians(angle)
                )
                * 13,

                cy
                + math.sin(
                    math.radians(angle)
                )
                * 13,
            ),
            ARMOR_LIGHT,
            2,
        )

    save(
        spark1,
        EFFECT_DIR
        / "spark_01.png",
    )

    spark2 = (
        transparent_effect_surface(
            32
        )
    )

    zigzag = [
        (
            4,
            18,
        ),
        (
            11,
            12,
        ),
        (
            14,
            17,
        ),
        (
            21,
            7,
        ),
        (
            18,
            17,
        ),
        (
            27,
            14,
        ),
    ]

    line(
        spark2,
        zigzag[0],
        zigzag[1],
        PRESSURE,
        3,
    )

    for start, end in zip(
        zigzag,
        zigzag[1:],
    ):

        line(
            spark2,
            start,
            end,
            ARMOR_LIGHT,
            3,
        )

    save(
        spark2,
        EFFECT_DIR
        / "spark_02.png",
    )


# ============================================================
# NOTEBOOK / ARENA BACKGROUND
# ============================================================

def generate_background():

    width = 1280
    height = 720

    surface = pygame.Surface(
        (
            width,
            height,
        )
    )

    surface.fill(
        PAPER
    )

    # subtle horizontal notebook lines

    for y in range(
        40,
        height,
        32,
    ):

        pygame.draw.line(
            surface,
            (
                211,
                210,
                196,
            ),
            (
                0,
                y,
            ),
            (
                width,
                y,
            ),
            1,
        )

    # vertical margin line

    pygame.draw.line(
        surface,
        (
            213,
            106,
            106,
        ),
        (
            95,
            0,
        ),
        (
            95,
            height,
        ),
        2,
    )

    # sketchy arena

    center = (
        width // 2,
        height // 2 + 60,
    )

    pygame.draw.ellipse(
        surface,
        (
            198,
            197,
            183,
        ),
        (
            center[0] - 390,
            center[1] - 170,
            780,
            340,
        ),
        4,
    )

    pygame.draw.ellipse(
        surface,
        (
            215,
            214,
            200,
        ),
        (
            center[0] - 360,
            center[1] - 145,
            720,
            290,
        ),
        2,
    )

    # corner doodles

    for x, y in (
        (170, 120),
        (1080, 130),
        (150, 620),
        (1110, 610),
    ):

        circle(
            surface,
            (
                x,
                y,
            ),
            13,
            ARMOR_DARK,
            2,
        )

        line(
            surface,
            (
                x - 18,
                y,
            ),
            (
                x + 18,
                y,
            ),
            ARMOR_DARK,
            2,
        )

        line(
            surface,
            (
                x,
                y - 18,
            ),
            (
                x,
                y + 18,
            ),
            ARMOR_DARK,
            2,
        )

    save(
        surface,
        ENV_DIR
        / "notebook_background.png",
    )


# ============================================================
# TEXT IMAGE ASSETS
# ============================================================

def create_text_image(
    text,
    filename,
    font_size=56,
):

    font = pygame.font.SysFont(
        "arial",
        font_size,
        bold=True,
    )

    rendered = font.render(
        text,
        True,
        INK,
    )

    padding = 16

    surface = pygame.Surface(
        (
            rendered.get_width()
            + padding * 2,

            rendered.get_height()
            + padding * 2,
        ),
        pygame.SRCALPHA,
    )

    # slight offset duplicate gives an imperfect
    # poster / stamped visual

    ghost = font.render(
        text,
        True,
        ARMOR_DARK,
    )

    ghost.set_alpha(
        75
    )

    surface.blit(
        ghost,
        (
            padding + 2,
            padding + 2,
        ),
    )

    surface.blit(
        rendered,
        (
            padding,
            padding,
        ),
    )

    save(
        surface,
        TEXT_DIR
        / filename,
    )


def generate_text():

    create_text_image(
        "START",
        "start.png",
    )

    create_text_image(
        "OPTIONS",
        "options.png",
    )

    create_text_image(
        "EXIT",
        "exit.png",
    )

    create_text_image(
        "PRESSURE",
        "pressure.png",
        44,
    )

    create_text_image(
        "CONTROL",
        "control.png",
        44,
    )

    create_text_image(
        "CHAOS",
        "chaos.png",
        44,
    )

    create_text_image(
        "GAME OVER",
        "game_over.png",
        64,
    )

    create_text_image(
        "YOU WIN",
        "you_win.png",
        64,
    )


# ============================================================
# GENERATE EVERYTHING
# ============================================================

def main():

    print()
    print(
        "Generating RoboSwitch assets..."
    )
    print()

    generate_protagonist_sheet()

    generate_pressure_enemy()
    generate_chaos_enemy()

    generate_ui()

    generate_pressure_mark()
    generate_control_mark()
    generate_chaos_mark()

    generate_sparks()

    generate_background()

    generate_text()

    print()
    print(
        "RoboSwitch asset generation complete."
    )

    print()
    print(
        f"Output folder: {ROOT.resolve()}"
    )

    print()


if __name__ == "__main__":
    main()
