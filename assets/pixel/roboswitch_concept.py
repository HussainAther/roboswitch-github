"""
RoboSwitch rough character concept generator
---------------------------------------------

Purpose:
    Generate a NON-FINAL reference sketch for RoboSwitch's silhouette,
    proportions, mode-switching gear, armor shapes, eyes, and pose.

This intentionally uses simple vector geometry to establish the silhouette,
proportions, equipment, and pose for later visual refinement.

Install:
    pip install pygame

Run:
    python roboswitch_concept.py
"""

import pygame
import math
import sys

pygame.init()

WIDTH, HEIGHT = 1000, 1000
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("RoboSwitch - Rough Character Concept")

clock = pygame.time.Clock()

# -------------------------------------------------------------------
# COLORS
# -------------------------------------------------------------------

BG = (238, 232, 210)          # notebook-paper-ish
INK = (24, 26, 32)

ARMOR = (188, 198, 207)
ARMOR_DARK = (86, 96, 108)
ARMOR_LIGHT = (245, 248, 250)

EYE = (245, 245, 255)
PUPIL = (20, 26, 38)

PRESSURE = (225, 65, 55)
CHAOS = (135, 72, 190)
CONTROL = (45, 150, 210)

JOINT = (55, 60, 68)


# -------------------------------------------------------------------
# HELPERS
# -------------------------------------------------------------------

def poly(points, color, width=0):
    pygame.draw.polygon(screen, color, points, width)


def line(a, b, color=INK, width=4):
    pygame.draw.line(screen, color, a, b, width)


def circle(pos, radius, color, width=0):
    pygame.draw.circle(screen, color, pos, radius, width)


def ellipse(rect, color, width=0):
    pygame.draw.ellipse(screen, color, rect, width)


def rotate_point(point, pivot, angle):
    """Rotate point around pivot."""
    angle = math.radians(angle)

    px, py = point
    ox, oy = pivot

    x = ox + math.cos(angle) * (px - ox) - math.sin(angle) * (py - oy)
    y = oy + math.sin(angle) * (px - ox) + math.cos(angle) * (py - oy)

    return int(x), int(y)


# -------------------------------------------------------------------
# MODE GEAR
# -------------------------------------------------------------------

def draw_mode_gear(cx, cy, radius=72, rotation=0):

    teeth = 12

    outer = []
    inner_r = radius * 0.82

    for i in range(teeth * 2):

        angle = rotation + i * (360 / (teeth * 2))

        r = radius if i % 2 == 0 else inner_r

        x = cx + math.cos(math.radians(angle)) * r
        y = cy + math.sin(math.radians(angle)) * r

        outer.append((x, y))

    # Outer gear
    poly(outer, ARMOR_DARK)
    pygame.draw.polygon(screen, INK, outer, 5)

    circle((cx, cy), int(radius * 0.64), ARMOR)
    circle((cx, cy), int(radius * 0.64), INK, 5)

    # Three mode sectors
    pygame.draw.arc(
        screen,
        PRESSURE,
        (cx - 45, cy - 45, 90, 90),
        math.radians(-75),
        math.radians(35),
        11,
    )

    pygame.draw.arc(
        screen,
        CHAOS,
        (cx - 45, cy - 45, 90, 90),
        math.radians(45),
        math.radians(155),
        11,
    )

    pygame.draw.arc(
        screen,
        CONTROL,
        (cx - 45, cy - 45, 90, 90),
        math.radians(165),
        math.radians(275),
        11,
    )

    circle((cx, cy), 17, INK)

    # Physical selector lever
    selector_angle = rotation - 90

    sx = cx + math.cos(math.radians(selector_angle)) * 38
    sy = cy + math.sin(math.radians(selector_angle)) * 38

    line((cx, cy), (sx, sy), ARMOR_LIGHT, 8)
    circle((int(sx), int(sy)), 8, INK)


# -------------------------------------------------------------------
# HANDS
# -------------------------------------------------------------------

def draw_hand(x, y, flip=False, pointing=False):

    direction = -1 if flip else 1

    # Palm
    palm = [
        (x - 18 * direction, y - 15),
        (x + 18 * direction, y - 18),
        (x + 24 * direction, y + 18),
        (x - 12 * direction, y + 26),
    ]

    poly(palm, ARMOR_LIGHT)
    pygame.draw.polygon(screen, INK, palm, 4)

    # Thumb
    line(
        (x + 12 * direction, y + 8),
        (x + 32 * direction, y + 17),
        INK,
        7,
    )

    # Four actual fingers
    for i in range(4):

        fx = x + (-10 + i * 8) * direction

        length = 30

        if pointing and i == 1:
            length = 52

        line(
            (fx, y - 12),
            (fx + 4 * direction, y - length),
            INK,
            7,
        )

        circle(
            (int(fx + 4 * direction), int(y - length)),
            4,
            ARMOR_LIGHT,
        )


# -------------------------------------------------------------------
# HEAD
# -------------------------------------------------------------------

def draw_head(cx, cy):

    # -----------------------------------------
    # FORWARD-SWEPT SPIKY HELMET
    # -----------------------------------------

    helmet = [
        (cx - 100, cy + 30),
        (cx - 95, cy - 50),

        # Rear top
        (cx - 62, cy - 90),

        # Dramatic forward-facing spikes
        (cx - 38, cy - 145),
        (cx - 15, cy - 105),

        (cx + 20, cy - 165),
        (cx + 36, cy - 100),

        (cx + 88, cy - 135),
        (cx + 67, cy - 72),

        # nose/front helmet edge
        (cx + 120, cy - 55),
        (cx + 84, cy - 5),

        (cx + 82, cy + 52),
        (cx + 40, cy + 88),
        (cx - 45, cy + 82),
    ]

    poly(helmet, ARMOR)
    pygame.draw.polygon(screen, INK, helmet, 6)

    # Slightly ridiculous forehead ridge
    poly([
        (cx - 12, cy - 103),
        (cx + 16, cy - 145),
        (cx + 34, cy - 102),
        (cx + 12, cy - 78),
    ], ARMOR_LIGHT)

    # -----------------------------------------
    # FACE PLATE
    # -----------------------------------------

    face = [
        (cx - 68, cy - 28),
        (cx + 67, cy - 37),
        (cx + 75, cy + 43),
        (cx + 35, cy + 72),
        (cx - 35, cy + 69),
        (cx - 75, cy + 34),
    ]

    poly(face, ARMOR_LIGHT)
    pygame.draw.polygon(screen, INK, face, 5)

    # -----------------------------------------
    # ANIME EYES
    # -----------------------------------------

    # left eye
    poly([
        (cx - 52, cy - 5),
        (cx - 8, cy - 12),
        (cx - 18, cy + 12),
        (cx - 51, cy + 11),
    ], EYE)

    # right eye, intentionally asymmetrical
    poly([
        (cx + 9, cy - 14),
        (cx + 58, cy - 7),
        (cx + 48, cy + 13),
        (cx + 17, cy + 10),
    ], EYE)

    # piercing pupils
    ellipse((cx - 28, cy - 9, 9, 19), PUPIL)
    ellipse((cx + 29, cy - 11, 9, 21), PUPIL)

    # eyebrow armor gives expressions
    line(
        (cx - 55, cy - 18),
        (cx - 8, cy - 25),
        INK,
        6,
    )

    line(
        (cx + 10, cy - 26),
        (cx + 61, cy - 15),
        INK,
        6,
    )

    # Tiny skeptical mouth.
    # This deliberately keeps him from looking like a faceless mech.
    pygame.draw.arc(
        screen,
        INK,
        (cx - 21, cy + 22, 43, 24),
        math.radians(10),
        math.radians(155),
        4,
    )

    # cheek armor
    line((cx - 66, cy + 18), (cx - 42, cy + 45), ARMOR_DARK, 7)
    line((cx + 67, cy + 16), (cx + 43, cy + 45), ARMOR_DARK, 7)

    # Shine
    line(
        (cx - 69, cy - 66),
        (cx - 39, cy - 95),
        ARMOR_LIGHT,
        7,
    )


# -------------------------------------------------------------------
# BODY
# -------------------------------------------------------------------

def draw_body(cx, cy):

    # Narrow waist + larger upper torso:
    # humanoid superhero proportions without becoming a generic mech.

    torso = [
        (cx - 115, cy),
        (cx - 72, cy - 45),
        (cx + 82, cy - 34),

        # uneven right shoulder
        (cx + 126, cy + 11),

        (cx + 77, cy + 145),
        (cx + 38, cy + 178),

        (cx - 36, cy + 178),
        (cx - 74, cy + 142),
    ]

    poly(torso, ARMOR)
    pygame.draw.polygon(screen, INK, torso, 6)

    # Chest center
    poly([
        (cx - 44, cy + 3),
        (cx + 52, cy + 0),
        (cx + 37, cy + 107),
        (cx, cy + 132),
        (cx - 39, cy + 102),
    ], ARMOR_DARK)

    # silly tiny central switch emblem
    circle((cx, cy + 61), 24, ARMOR_LIGHT)
    circle((cx, cy + 61), 24, INK, 4)

    line(
        (cx - 10, cy + 61),
        (cx + 11, cy + 61),
        INK,
        5,
    )

    line(
        (cx, cy + 51),
        (cx, cy + 72),
        INK,
        5,
    )

    # armor sheen
    line(
        (cx - 73, cy - 7),
        (cx - 51, cy + 62),
        ARMOR_LIGHT,
        9,
    )


# -------------------------------------------------------------------
# ARMS
# -------------------------------------------------------------------

def draw_left_arm():

    shoulder = (384, 463)
    elbow = (288, 565)
    wrist = (230, 653)

    circle(shoulder, 35, JOINT)

    line(shoulder, elbow, ARMOR_DARK, 55)
    line(shoulder, elbow, INK, 5)

    circle(elbow, 24, JOINT)

    line(elbow, wrist, ARMOR, 48)
    line(elbow, wrist, INK, 5)

    draw_hand(218, 695, flip=True)


def draw_gear_arm():

    shoulder = (617, 469)
    elbow = (705, 557)
    wrist = (770, 630)

    circle(shoulder, 36, JOINT)

    line(shoulder, elbow, ARMOR, 56)
    line(shoulder, elbow, INK, 5)

    circle(elbow, 25, JOINT)

    line(elbow, wrist, ARMOR_DARK, 54)
    line(elbow, wrist, INK, 5)

    # Huge signature mechanism
    draw_mode_gear(758, 596, radius=74, rotation=-10)

    # Actual usable hand still exists below/after gear.
    draw_hand(815, 675, pointing=True)


# -------------------------------------------------------------------
# LEGS
# -------------------------------------------------------------------

def draw_leg(hip, knee, foot, flip=False):

    circle(hip, 27, JOINT)

    line(hip, knee, ARMOR_DARK, 62)
    line(hip, knee, INK, 5)

    circle(knee, 30, ARMOR_LIGHT)
    circle(knee, 30, INK, 5)

    line(knee, foot, ARMOR, 66)
    line(knee, foot, INK, 5)

    x, y = foot

    if flip:
        boot = [
            (x + 27, y - 8),
            (x + 45, y + 32),
            (x - 30, y + 38),
            (x - 54, y + 22),
        ]

    else:
        boot = [
            (x - 27, y - 8),
            (x - 45, y + 32),
            (x + 30, y + 38),
            (x + 54, y + 22),
        ]

    poly(boot, ARMOR_DARK)
    pygame.draw.polygon(screen, INK, boot, 6)


# -------------------------------------------------------------------
# FULL ROBOT
# -------------------------------------------------------------------

def draw_robot():

    # legs behind torso
    draw_leg(
        hip=(453, 642),
        knee=(425, 762),
        foot=(390, 886),
        flip=True,
    )

    draw_leg(
        hip=(548, 642),
        knee=(589, 758),
        foot=(620, 883),
        flip=False,
    )

    # torso
    draw_body(500, 455)

    # Arms intentionally have very different silhouettes.
    draw_left_arm()
    draw_gear_arm()

    # neck
    line(
        (470, 380),
        (470, 415),
        JOINT,
        32,
    )

    line(
        (530, 380),
        (530, 415),
        JOINT,
        32,
    )

    # head
    draw_head(500, 310)


# -------------------------------------------------------------------
# LABELS
# -------------------------------------------------------------------

def draw_labels():

    font = pygame.font.SysFont("arial", 24, bold=True)
    small = pygame.font.SysFont("arial", 17)

    title = font.render(
        "ROBOSWITCH — SILHOUETTE STUDY",
        True,
        INK,
    )

    screen.blit(title, (28, 24))

    subtitle = small.render(
        "Pressure / Chaos / Control",
        True,
        ARMOR_DARK,
    )

    screen.blit(subtitle, (30, 56))

    # mode legend

    labels = [
        ("PRESSURE", PRESSURE),
        ("CHAOS", CHAOS),
        ("CONTROL", CONTROL),
    ]

    x = 730

    for text, color in labels:

        circle((x, 43), 7, color)

        img = small.render(text, True, INK)

        screen.blit(img, (x + 13, 33))

        x += 88


# -------------------------------------------------------------------
# MAIN LOOP
# -------------------------------------------------------------------

running = True

while running:

    for event in pygame.event.get():

        if event.type == pygame.QUIT:
            running = False

        if event.type == pygame.KEYDOWN:

            if event.key == pygame.K_ESCAPE:
                running = False

            # Press S to save concept sheet
            if event.key == pygame.K_s:
                pygame.image.save(
                    screen,
                    "roboswitch_concept.png",
                )

    screen.fill(BG)

    draw_robot()
    draw_labels()

    pygame.display.flip()

    clock.tick(60)
    pygame.image.save(screen, "roboswitch_concept.png")


pygame.quit()
sys.exit()
