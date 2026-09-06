# particles.py

import random

import pygame


class ArtParticle:

    def __init__(
        self,
        image,
        position,
        velocity,
        lifetime,
        rotation_speed=0,
    ):

        self.original = image

        self.position = pygame.Vector2(
            position
        )

        self.velocity = pygame.Vector2(
            velocity
        )

        self.lifetime = lifetime

        self.max_lifetime = lifetime

        self.angle = 0

        self.rotation_speed = rotation_speed

        self.dead = False

    def update(
        self,
        dt,
    ):

        self.lifetime -= dt

        if self.lifetime <= 0:

            self.dead = True
            return

        self.position += (
            self.velocity * dt
        )

        self.angle += (
            self.rotation_speed * dt
        )

    def draw(
        self,
        screen,
    ):

        if self.dead:
            return

        alpha = int(
            255
            * (
                self.lifetime
                / self.max_lifetime
            )
        )

        image = pygame.transform.rotate(
            self.original,
            self.angle,
        )

        image.set_alpha(alpha)

        rect = image.get_rect(
            center=self.position
        )

        screen.blit(
            image,
            rect,
        )


class ParticleSystem:

    def __init__(self):

        self.particles = []

    def burst(
        self,
        image,
        position,
        amount=6,
        speed=80,
    ):

        for _ in range(amount):

            direction = pygame.Vector2(
                random.uniform(-1, 1),
                random.uniform(-1, 1),
            )

            if direction.length_squared():

                direction.normalize_ip()

            velocity = (
                direction
                * random.uniform(
                    speed * 0.5,
                    speed,
                )
            )

            self.particles.append(
                ArtParticle(
                    image=image,
                    position=position,
                    velocity=velocity,
                    lifetime=random.uniform(
                        0.25,
                        0.55,
                    ),
                    rotation_speed=random.uniform(
                        -160,
                        160,
                    ),
                )
            )

    def update(
        self,
        dt,
    ):

        for particle in self.particles:

            particle.update(dt)

        self.particles = [
            particle
            for particle in self.particles
            if not particle.dead
        ]

    def draw(
        self,
        screen,
    ):

        for particle in self.particles:

            particle.draw(screen)
