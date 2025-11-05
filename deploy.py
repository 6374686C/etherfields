import os
import re
import subprocess
import sys

# -----------------------------
# Helper to run shell commands
# -----------------------------
def run_cmd(command, check=True):
    result = subprocess.run(command, shell=True)
    if check and result.returncode != 0:
        print(f"\n!!! Command failed: {command} !!!")
        input("Press Enter to exit...")
        sys.exit(1)


# -----------------------------
# Read and update version
# -----------------------------
def get_current_version(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r"APP_VERSION\s*=\s*'([^']+)'", content)
    return match.group(1) if match else None


def update_version(file_path, new_version):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    updated = re.sub(r"APP_VERSION\s*=\s*'[^']+'", f"APP_VERSION = '{new_version}'", content)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(updated)


# -----------------------------
# Main deploy flow
# -----------------------------
def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print("\n===============================")
    print("  Web App Build & Push Tool")
    print("===============================\n")

    # Check if in Git repo
    if not os.path.exists(".git"):
        print("❌ This folder is not a Git repository!")
        input("Press Enter to exit...")
        sys.exit(1)

    constants_path = "constants.ts"
    if not os.path.exists(constants_path):
        print("❌ constants.ts not found!")
        input("Press Enter to exit...")
        sys.exit(1)

    # Show current version
    current_version = get_current_version(constants_path)
    if current_version:
        print(f"📦 Current version: {current_version}")
    else:
        print("⚠️ Could not read version from constants.ts")

    # Ask to update version
    choice = input("Do you want to update the version? [Y/n]: ").strip().lower()
    if choice in ("", "y", "yes"):
        new_version = input("Enter new version number (e.g. 1.0.9): ").strip()
        if new_version:
            update_version(constants_path, new_version)
            print(f"✅ Version updated to {new_version}")
        else:
            print(f"⚠️ No version entered, keeping {current_version}")
    else:
        print("🔹 Version unchanged.")

    # Run npm install
    print("\n🔧 Installing dependencies...")
    run_cmd("npm install")

    # Build project
    print("\n🏗️ Building project...")
    run_cmd("npm run build")

    # Git operations
    print("\n➕ Adding all changes...")
    run_cmd("git add .", check=False)

    print("\n📋 Current status:")
    run_cmd("git status", check=False)

    commit_msg = input("\nEnter commit message: ").strip()
    if not commit_msg:
        commit_msg = "Auto commit"

    print(f"\n📝 Committing with message: '{commit_msg}'")
    run_cmd(f'git commit -m "{commit_msg}"', check=False)

    print("\n🚀 Pushing to remote...")
    run_cmd("git push", check=False)

    print("\n✅ Done!")
    input("Press Enter to exit...")


if __name__ == "__main__":
    main()
