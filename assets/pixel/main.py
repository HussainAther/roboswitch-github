import pygame

from asset_validator import validate_assets
from background import NotebookBackground
from hud import HUD
from robo_assets import RoboAssets
from robot import RoboSwitchPlayer
from ui_assets import UIAssets

from visuals import (
    MODE_PRESSURE,
    MODE_CONTROL,
    MODE_CHAOS,
)


WIDTH = 1280
HEIGHT = 720
FPS = 60


def main():
    pygame.init()

    screen = pygame.display.set_mode(
        (WIDTH, HEIGHT)
    )

    pygame.display.set_caption(
        "RoboSwitch - Development Build"
    )

    clock = pygame.time.Clock()

    # --------------------------------------------------------
    # CHECK ART
    # --------------------------------------------------------

    validate_assets()

    # --------------------------------------------------------
    # BACKGROUND
    # --------------------------------------------------------

    background = NotebookBackground(
        "assets/environment/notebook_background.png",
        (WIDTH, HEIGHT),
    )

    # --------------------------------------------------------
    # PLAYER
    # --------------------------------------------------------

    robo_assets = RoboAssets(
        "assets/robot"
    )

    player = RoboSwitchPlayer(
        position=(
            WIDTH // 2,
            HEIGHT // 2,
        ),
        assets=robo_assets,
    )

    player_group = pygame.sprite.Group(
        player
    )

    # --------------------------------------------------------
    # UI
    # --------------------------------------------------------

    ui_assets = UIAssets(
        "assets/ui"
    )

    hud = HUD(
        ui_assets
    )

    # --------------------------------------------------------
    # MAIN LOOP
    # --------------------------------------------------------

    running = True

    print()
    print("RoboSwitch running.")
    print()
    print("Controls:")
    print("  WASD / arrows = move")
    print("  1 = Pressure mode")
    print("  2 = Control mode")
    print("  3 = Chaos mode")
    print("  J = Pressure action")
    print("  K = Control action")
    print("  L = Chaos action")
    print("  H = Take damage")
    print("  ESC = Quit")
    print()

    while running:

        # Seconds since last frame
        dt = clock.tick(FPS) / 1000.0

        # ----------------------------------------------------
        # EVENTS
        # ----------------------------------------------------

        for event in pygame.event.get():

            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.KEYDOWN:

                if event.key == pygame.K_ESCAPE:
                    running = False

                elif event.key == pygame.K_1:
                    player.set_mode(
                        MODE_PRESSURE
                    )

                elif event.key == pygame.K_2:
                    player.set_mode(
                        MODE_CONTROL
                    )

                elif event.key == pygame.K_3:
                    player.set_mode(
                        MODE_CHAOS
                    )

                elif event.key == pygame.K_j:
                    player.pressure_attack()

                elif event.key == pygame.K_k:
                    player.control_action()

                elif event.key == pygame.K_l:
                    player.chaos_attack()

                elif event.key == pygame.K_h:
                    player.damage(10)

        # ----------------------------------------------------
        # UPDATE
        # ----------------------------------------------------

        player_group.update(dt)

        # ----------------------------------------------------
        # DRAW
        # ----------------------------------------------------

        background.draw(
            screen
        )

        player_group.draw(
            screen
        )

        hud.draw(
            screen,
            player,
        )

        # ----------------------------------------------------
        # DEBUG LABEL
        # ----------------------------------------------------

        font = pygame.font.Font(
            None,
            28,
        )

        debug_text = font.render(
            "RoboSwitch DEV - placeholder art",
            True,
            (26, 26, 26),
        )

        screen.blit(
            debug_text,
            (
                WIDTH - debug_text.get_width() - 20,
                20,
            ),
        )

        # ----------------------------------------------------
        # SHOW FRAME
        # ----------------------------------------------------

        pygame.display.flip()

    print("RoboSwitch closed.")

    pygame.quit()


if __name__ == "__main__":
    main()
