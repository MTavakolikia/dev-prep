#!/usr/bin/env python3
# Dev Prep — package the whole project into one zip archive.
# Includes source, tests, prisma schema, seeded SQLite DB, docs and configs.
# Excludes node_modules / .next / coverage / .git / logs / screenshots.
# The shipped .env is patched to be portable (relative DATABASE_URL).
import os, zipfile, pathlib

ROOT = pathlib.Path("/home/z/my-project")
OUT = ROOT / "download" / "devprep-project.zip"
OUT.parent.mkdir(parents=True, exist_ok=True)

INCLUDE_DIRS = ["src", "public", "tests", "prisma", "docs"]
DIR_EXCLUDES = {"node_modules", ".next", "coverage", ".git", ".zscripts",
                "__pycache__", "tool-results", "upload", "download",
                "examples", "mini-services", "skills"}
ROOT_FILES = [
    "package.json", "package-lock.json", "tsconfig.json", "next.config.ts",
    "next-env.d.ts", "postcss.config.mjs", "eslint.config.mjs",
    "tailwind.config.ts", "vitest.config.ts", "components.json",
    ".gitignore", ".env.example", "README.md", "LICENSE",
]
SCRIPT_EXT = {".ts", ".py", ".mjs", ".sh"}

# Portable .env: relative DB path (Prisma resolves it against prisma/),
# localhost URLs — the sandbox preview host is not meaningful elsewhere.
ENV_PATCHED = """# ---- Database (SQLite) ----
DATABASE_URL=file:../db/custom.db

# ---- Admin bootstrap (seed reads these ONLY from env) ----
ADMIN_EMAIL=admin@devprep.dev
ADMIN_PASSWORD=Forge-Admin-2026!
ADMIN_NAME=Sara Mitchell

# ---- Demo reader account (seeded, for preview) ----
DEMO_EMAIL=alex@devprep.dev
DEMO_PASSWORD=Demo-2026!

# ---- App ----
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_SECRET=devprep-dev-secret-change-in-production
"""

def keep_file(p: pathlib.Path) -> bool:
    name = p.name
    if name.endswith((".log", ".tsbuildinfo")):
        return False
    # screenshots are excluded everywhere except docs/screenshots (README needs them)
    if name.endswith(".png") and "docs/screenshots" not in p.as_posix():
        return False
    return True

count = 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    # directories (source trees)
    for d in INCLUDE_DIRS:
        base = ROOT / d
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames[:] = [x for x in dirnames if x not in DIR_EXCLUDES]
            for fn in filenames:
                p = pathlib.Path(dirpath) / fn
                if not keep_file(p):
                    continue
                z.write(p, p.relative_to(ROOT))
                count += 1
    # scripts: code files only (skip screenshots / logs)
    scripts = ROOT / "scripts"
    if scripts.exists():
        for p in sorted(scripts.iterdir()):
            if p.is_file() and p.suffix in SCRIPT_EXT:
                z.write(p, p.relative_to(ROOT))
                count += 1
    # seeded database
    dbf = ROOT / "db" / "custom.db"
    if dbf.exists():
        z.write(dbf, "db/custom.db")
        count += 1
    # root config files
    for fn in ROOT_FILES:
        p = ROOT / fn
        if p.exists():
            z.write(p, fn)
            count += 1
    # patched .env
    z.writestr(".env", ENV_PATCHED)
    count += 1

size_mb = OUT.stat().st_size / 1024 / 1024
print(f"OK {OUT} — {count} entries, {size_mb:.1f} MB")
