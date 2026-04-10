# 🛹 Pathflip

[![CI](https://github.com/jonahsnider/pathflip/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jonahsnider/pathflip/actions/workflows/ci.yml)

Pathflip is a CLI tool for FRC teams to mirror Java autonomous routines from one side of the field to the other.

Write and tune an auto for one side (e.g. `RightIntegratedAuto`), then use Pathflip to produce the mirrored version (e.g. `LeftIntegratedAuto`).

Developed for [Team 581](https://github.com/team581).

## Install

```sh
npm install -g pathflip
```

## Usage

```sh
pathflip <input-file> [--config path]
```

### Options

- `--config, -c` — Path to `pathflip.config.pkl`. If omitted, Pathflip walks up from the input file's directory to find one.

### Example

```sh
pathflip comp-bot/src/main/java/frc/robot/autos/auto_state_machines/RightIntegratedAuto.java
```

## Config

Create a `pathflip.config.pkl` in your project root:

<!-- x-release-please-start-version -->

```pkl
amends "package://pkg.pkl-lang.org/github.com/jonahsnider/pathflip/pathflip@4.0.3#/src/config.pkl"

fieldHeight = 8.069

replacements {
  ["Right"] = "Left"
  ["right"] = "left"
  ["RIGHT"] = "LEFT"
  ["Left"] = "Right"
  ["left"] = "right"
  ["LEFT"] = "RIGHT"
}

negateConstants {
  "BUMP_OFFSET"
}
```

<!-- x-release-please-end -->

The `amends` line is optional but recommended — it provides type checking and editor support via the published [Pkl package](https://github.com/jonahsnider/pathflip).

| Key | Description |
|-----|-------------|
| `fieldHeight` | Field height in meters, used to flip `Pose2d` Y-coordinates (`y' = fieldHeight - y`) |
| `replacements` | Simultaneous find-and-replace pairs (both directions must be listed) |
| `negateConstants` | Names of `private static final double` constants whose values should be negated |

## Transformations

Applied in order:

1. **Pose2d Y-flip** — `new Pose2d(x, y, ...)` → `new Pose2d(x, fieldHeight - y, ...)`
2. **Rotation2d.fromDegrees negation** — Simple numbers are negated; `180 + X` ↔ `180 - X`
3. **Rotation2d constant swap** — `kCW_90deg` ↔ `kCCW_90deg`
4. **Constant sign negation** — Configured constants have their values negated
5. **String multi-replace** — Simultaneous replacement using the `replacements` map
